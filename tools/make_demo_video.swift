import AppKit
import AVFoundation
import CoreVideo
import Foundation

guard CommandLine.arguments.count >= 3 else {
    fputs("Usage: swift make_demo_video.swift <frames-dir> <output.mp4> [width height [crop-width]]\n", stderr)
    exit(2)
}

let framesDirectory = URL(fileURLWithPath: CommandLine.arguments[1], isDirectory: true)
let outputURL = URL(fileURLWithPath: CommandLine.arguments[2])
let requestedWidth = CommandLine.arguments.count >= 5 ? Int(CommandLine.arguments[3]) : nil
let requestedHeight = CommandLine.arguments.count >= 5 ? Int(CommandLine.arguments[4]) : nil
let cropWidth = CommandLine.arguments.count >= 6 ? Int(CommandLine.arguments[5]) : nil
let imageURLs = try FileManager.default.contentsOfDirectory(
    at: framesDirectory,
    includingPropertiesForKeys: nil
).filter { $0.pathExtension.lowercased() == "png" }.sorted { $0.lastPathComponent < $1.lastPathComponent }

guard imageURLs.count >= 2 else {
    fputs("At least two PNG frames are required.\n", stderr)
    exit(2)
}

let images: [CGImage] = try imageURLs.map { url in
    guard let image = NSImage(contentsOf: url),
          let cgImage = image.cgImage(forProposedRect: nil, context: nil, hints: nil) else {
        throw NSError(domain: "SynaqDemo", code: 1, userInfo: [NSLocalizedDescriptionKey: "Cannot read \(url.path)"])
    }
    if let cropWidth, cropWidth < cgImage.width,
       let cropped = cgImage.cropping(to: CGRect(x: 0, y: 0, width: cropWidth, height: cgImage.height)) {
        return cropped
    }
    return cgImage
}

try? FileManager.default.removeItem(at: outputURL)

let width = requestedWidth ?? images[0].width
let height = requestedHeight ?? images[0].height
let fps: Int32 = 30
let holdFrames = 68
let transitionFrames = 16
let writer = try AVAssetWriter(outputURL: outputURL, fileType: .mp4)
let compression: [String: Any] = [
    AVVideoAverageBitRateKey: 5_200_000,
    AVVideoMaxKeyFrameIntervalKey: Int(fps) * 2,
    AVVideoProfileLevelKey: AVVideoProfileLevelH264HighAutoLevel
]
let input = AVAssetWriterInput(
    mediaType: .video,
    outputSettings: [
        AVVideoCodecKey: AVVideoCodecType.h264,
        AVVideoWidthKey: width,
        AVVideoHeightKey: height,
        AVVideoCompressionPropertiesKey: compression
    ]
)
input.expectsMediaDataInRealTime = false

let adaptor = AVAssetWriterInputPixelBufferAdaptor(
    assetWriterInput: input,
    sourcePixelBufferAttributes: [
        kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA,
        kCVPixelBufferWidthKey as String: width,
        kCVPixelBufferHeightKey as String: height,
        kCVPixelBufferCGImageCompatibilityKey as String: true,
        kCVPixelBufferCGBitmapContextCompatibilityKey as String: true
    ]
)

guard writer.canAdd(input) else {
    fputs("Cannot add video input.\n", stderr)
    exit(3)
}
writer.add(input)
guard writer.startWriting() else {
    fputs("Cannot start writer: \(writer.error?.localizedDescription ?? "unknown error")\n", stderr)
    exit(3)
}
writer.startSession(atSourceTime: .zero)

func draw(_ image: CGImage, in context: CGContext, zoom: CGFloat, alpha: CGFloat) {
    let scaledWidth = CGFloat(width) * zoom
    let scaledHeight = CGFloat(height) * zoom
    let rect = CGRect(
        x: (CGFloat(width) - scaledWidth) / 2,
        y: (CGFloat(height) - scaledHeight) / 2,
        width: scaledWidth,
        height: scaledHeight
    )
    context.saveGState()
    context.setAlpha(alpha)
    context.draw(image, in: rect)
    context.restoreGState()
}

func makePixelBuffer(current: CGImage, next: CGImage?, progress: CGFloat, zoom: CGFloat) throws -> CVPixelBuffer {
    guard let pool = adaptor.pixelBufferPool else {
        throw NSError(domain: "SynaqDemo", code: 2, userInfo: [NSLocalizedDescriptionKey: "Pixel buffer pool is unavailable"])
    }
    var optionalBuffer: CVPixelBuffer?
    let status = CVPixelBufferPoolCreatePixelBuffer(nil, pool, &optionalBuffer)
    guard status == kCVReturnSuccess, let buffer = optionalBuffer else {
        throw NSError(domain: "SynaqDemo", code: 3, userInfo: [NSLocalizedDescriptionKey: "Cannot create pixel buffer (\(status))"])
    }

    CVPixelBufferLockBaseAddress(buffer, [])
    defer { CVPixelBufferUnlockBaseAddress(buffer, []) }
    guard let base = CVPixelBufferGetBaseAddress(buffer) else {
        throw NSError(domain: "SynaqDemo", code: 4, userInfo: [NSLocalizedDescriptionKey: "Pixel buffer has no base address"])
    }
    let bytesPerRow = CVPixelBufferGetBytesPerRow(buffer)
    guard let context = CGContext(
        data: base,
        width: width,
        height: height,
        bitsPerComponent: 8,
        bytesPerRow: bytesPerRow,
        space: CGColorSpaceCreateDeviceRGB(),
        bitmapInfo: CGImageAlphaInfo.premultipliedFirst.rawValue | CGBitmapInfo.byteOrder32Little.rawValue
    ) else {
        throw NSError(domain: "SynaqDemo", code: 5, userInfo: [NSLocalizedDescriptionKey: "Cannot create CGContext"])
    }

    context.setFillColor(NSColor(calibratedRed: 0.95, green: 0.98, blue: 1, alpha: 1).cgColor)
    context.fill(CGRect(x: 0, y: 0, width: width, height: height))
    draw(current, in: context, zoom: zoom, alpha: 1)
    if let next {
        draw(next, in: context, zoom: 1.01 - (0.01 * progress), alpha: progress)
    }
    return buffer
}

var frameNumber: Int64 = 0
for index in images.indices {
    let current = images[index]
    let next = images[(index + 1) % images.count]

    for frame in 0..<holdFrames {
        while !input.isReadyForMoreMediaData { Thread.sleep(forTimeInterval: 0.002) }
        let localProgress = CGFloat(frame) / CGFloat(max(1, holdFrames - 1))
        let buffer = try makePixelBuffer(current: current, next: nil, progress: 0, zoom: 1 + localProgress * 0.012)
        guard adaptor.append(buffer, withPresentationTime: CMTime(value: frameNumber, timescale: fps)) else {
            throw writer.error ?? NSError(domain: "SynaqDemo", code: 6)
        }
        frameNumber += 1
    }

    for frame in 0..<transitionFrames {
        while !input.isReadyForMoreMediaData { Thread.sleep(forTimeInterval: 0.002) }
        let progress = CGFloat(frame + 1) / CGFloat(transitionFrames)
        let eased = progress * progress * (3 - 2 * progress)
        let buffer = try makePixelBuffer(current: current, next: next, progress: eased, zoom: 1.012)
        guard adaptor.append(buffer, withPresentationTime: CMTime(value: frameNumber, timescale: fps)) else {
            throw writer.error ?? NSError(domain: "SynaqDemo", code: 7)
        }
        frameNumber += 1
    }
}

input.markAsFinished()
let semaphore = DispatchSemaphore(value: 0)
writer.finishWriting { semaphore.signal() }
semaphore.wait()

guard writer.status == .completed else {
    fputs("Video export failed: \(writer.error?.localizedDescription ?? "unknown error")\n", stderr)
    exit(4)
}

let duration = Double(frameNumber) / Double(fps)
print("Created \(outputURL.path) — \(String(format: "%.1f", duration))s, \(frameNumber) frames")
