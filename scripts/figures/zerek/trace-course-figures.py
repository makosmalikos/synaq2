"""Preserve reviewed source diagram linework as SVG paths, with no raster embeds."""
import hashlib,json,pathlib,re
from PIL import Image
import vtracer
ROOT=pathlib.Path(__file__).resolve().parents[3];BASE=ROOT/'problems/sources/zerek/courses';OUT=ROOT/'frontend/public/figures/zerek-courses'
TMP=ROOT/'output/zerek-courses/vector-work';TMP.mkdir(parents=True,exist_ok=True)
manifest=json.loads((BASE/'vector-manifest.json').read_text());known={r['src']:r for r in manifest['files']}
approved={r['src']:r for r in json.loads((BASE/'source-image-reviews.json').read_text())['files']}
added=0
for source in json.loads((BASE/'image-manifest.json').read_text())['files']:
    previous=known.get(source['src'])
    if previous and (previous['method']!='source_linework_as_vector_paths' or previous['visualReview']=='verified'):continue
    if not source.get('file'):continue
    review=approved.get(source['src'])
    if not review or review['sha256']!=source['sha256'] or review['visualReview']!='verified':continue
    image=Image.open(BASE/source['file']).convert('RGBA');background=Image.new('RGBA',image.size,'white');background.alpha_composite(image);image=background.convert('RGB')
    foreground=Image.new('L',image.size);foreground.putdata([255 if min(p)<245 else 0 for p in image.getdata()]);bounds=foreground.getbbox() or (0,0,image.width,image.height)
    viewport={'x':bounds[0]-8,'y':bounds[1]-8,'width':bounds[2]-bounds[0]+16,'height':bounds[3]-bounds[1]+16}
    colors=[];ink_pixels=[]
    for r,g,b in image.getdata():
        lum=(r+g+b)/3
        # Pale coloured overlaps must stay coloured: a broad grey threshold
        # blackened the middle of three-set Venn diagrams and hid their digits.
        # Protect actual ink, without painting a grey prism face or a dark
        # coloured board solid black. Palette layers preserve their shading.
        ink_pixels.append(0 if (max(r,g,b)<110 and (max(r,g,b)-min(r,g,b)<18 or lum<70)) else 255)
        if max(r,g,b)-min(r,g,b)<12:color=(255,255,255) if lum>235 else (23,45,67) if lum<170 else (168,181,197) if lum<205 else (220,226,234)
        else:color=(r//16*16,g//16*16,b//16*16)
        colors.append(color)
    image.putdata(colors);image=image.quantize(colors=16).convert('RGB');pixels=list(image.getdata());parts=[]
    stem=hashlib.sha256(source['src'].encode()).hexdigest()[:24]
    for color in sorted(set(pixels),key=sum,reverse=True):
        if min(color)>240:continue
        mask=Image.new('L',image.size);mask.putdata([0 if v==color else 255 for v in pixels]);png=TMP/(stem+'.png');svg=TMP/(stem+'.svg')
        # Thin blue-grey captions are not part of the dark-ink mask. Preserve
        # their one-pixel strokes in each palette layer as well.
        mask=mask.resize((image.width*2,image.height*2),Image.Resampling.NEAREST);mask.save(png)
        vtracer.convert_image_to_svg_py(str(png),str(svg),colormode='binary',mode='polygon',filter_speckle=0,corner_threshold=65,length_threshold=1,path_precision=2)
        fill='#'+''.join(f'{v:02x}' for v in color)
        parts.append('<g transform="scale(0.5)">'+''.join(re.sub(r'fill="[^"]*"',f'fill="{fill}"',p) for p in re.findall(r'<path\b[^>]+/>',svg.read_text()))+'</g>')
    # Never let colour quantization erase a small digit, dot or thin edge.
    mask=Image.new('L',image.size);mask.putdata(ink_pixels)
    # Trace the ink at twice its source resolution so polygon simplification
    # cannot discard the small digits of a protractor scale.
    mask=mask.resize((image.width*2,image.height*2),Image.Resampling.NEAREST);mask.save(png)
    vtracer.convert_image_to_svg_py(str(png),str(svg),colormode='binary',mode='polygon',filter_speckle=0,corner_threshold=65,length_threshold=1,path_precision=2)
    parts.append('<g transform="scale(0.5)">'+''.join(re.sub(r'fill="[^"]*"','fill="#172d43"',p) for p in re.findall(r'<path\b[^>]+/>',svg.read_text()))+'</g>')
    content=f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{viewport["x"]} {viewport["y"]} {viewport["width"]} {viewport["height"]}" role="img"><title>Тапсырма сызбасы</title><rect x="-8" y="-8" width="{image.width+16}" height="{image.height+16}" fill="white"/>'+''.join(parts)+'</svg>\n'
    assert '<image' not in content and 'data:image' not in content
    target=OUT/(stem+'.svg');target.write_text(content)
    row={'src':source['src'],'image':'/figures/zerek-courses/'+target.name,'sha256':hashlib.sha256(content.encode()).hexdigest(),'sourceSha256':source['sha256'],'sourceViewport':viewport,'inkTraceScale':2,'paletteTraceScale':2,'method':'source_linework_as_vector_paths','visualReview':'pending'}
    known[source['src']]=row;added+=1
manifest['files']=list(known.values())
(BASE/'vector-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
print('Constructed SVG linework:',added,'; visual comparison pending.')
