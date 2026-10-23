"""Archive only public image URLs actually observed in captured course exercises."""
import concurrent.futures, hashlib, json, pathlib, struct, subprocess
ROOT = pathlib.Path(__file__).resolve().parent.parent
BASE = ROOT / 'problems/sources/zerek/courses'
DEST = BASE / 'images'
DEST.mkdir(exist_ok=True)
observed = sorted({im['src'] for p in [*BASE.glob('*-level[123].json'),*BASE.glob('*-leveltest.json')] for q in json.loads(p.read_text())['questions'] for im in q['images']})

def download(src):
    url = 'https://zerek.app' + src if src.startswith('/questions/') else src
    if not (url.startswith('https://zerek.app/questions/') or url.startswith('https://cbklwwsbmfzendipdpsj.supabase.co/storage/v1/object/public/questions/')):
        raise ValueError('Unexpected image URL: ' + url)
    name = hashlib.sha256(src.encode()).hexdigest()[:24] + '.png'
    p = DEST / name
    if not p.exists():
        tmp = p.with_suffix('.download')
        subprocess.run(['curl', '--http1.1', '--fail', '--silent', '--show-error', '--max-time', '25', '--max-filesize', '2000000', '--write-out', '%{http_code}', '--output', str(tmp), url], check=True, timeout=30, capture_output=True)
        data = tmp.read_bytes()
        if not data.startswith(b'\x89PNG\r\n\x1a\n'):
            raise ValueError('Not a PNG: ' + url)
        tmp.rename(p)
    data = p.read_bytes()
    width, height = struct.unpack('>II', data[16:24])
    return dict(src=src, url=url, file='images/'+name, sha256=hashlib.sha256(data).hexdigest(), width=width, height=height)

def safe_download(src):
    try: return download(src)
    except subprocess.CalledProcessError as e:
        code = (e.stdout or b'').decode(errors='replace').strip()
        error = 'HTTP ' + code if code.isdigit() and code != '000' else 'Transport error (curl ' + str(e.returncode) + ')'
        return dict(src=src, status='source_image_unavailable', error=error)
    except (subprocess.SubprocessError, ValueError) as e:
        return dict(src=src, status='source_image_unavailable', error=type(e).__name__)

with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
    images = list(pool.map(safe_download, observed))
(BASE / 'image-manifest.json').write_text(json.dumps({'files': images}, ensure_ascii=False, indent=2)+'\n')
print(json.dumps({'images': len(images), 'archived': sum('file' in i for i in images)}, ensure_ascii=False))
