"""Archive public diagram files referenced by captured questions; no login/API access."""
import pathlib,json,subprocess,hashlib,concurrent.futures,struct
ROOT=pathlib.Path(__file__).resolve().parent.parent
BASE=ROOT/'problems/sources/zerek';DEST=BASE/'images';DEST.mkdir(exist_ok=True)
PREFIX='https://cbklwwsbmfzendipdpsj.supabase.co/storage/v1/object/public/questions/'
urls=sorted({im['src'] for f in (BASE/'collections').glob('*.json') if '.partial.' not in f.name for q in json.loads(f.read_text())['questions'] for im in q.get('images',[])})
def get(url):
 rec={'sourceUrl':url,'status':'needs_visual_redraw_review'}
 try:
  if not url.startswith(PREFIX):raise ValueError('Unrecognized source image host/path')
  name=hashlib.sha256(url.encode()).hexdigest()[:24]+'.png';p=DEST/name
  if p.exists():data=p.read_bytes()
  else:
   temp=p.with_suffix('.download')
   result=subprocess.run(['curl','--fail','--silent','--show-error','--max-time','25','--max-filesize','2000000','--output',str(temp),url],capture_output=True,text=True,timeout=30)
   if result.returncode:raise ValueError(result.stderr.strip()[:250])
   data=temp.read_bytes();temp.unlink()
   if len(data)>2_000_000:raise ValueError('Image larger than archive budget')
   if not data.startswith(b'\x89PNG\r\n\x1a\n'):raise ValueError('Expected PNG image')
   p.write_bytes(data)
  width,height=struct.unpack('>II',data[16:24]);rec.update(file='images/'+name,sha256=hashlib.sha256(data).hexdigest(),bytes=len(data),width=width,height=height)
 except Exception as e:rec.update(status='download_error',error=str(e))
 return rec
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:records=list(pool.map(get,urls))
(BASE/'image-manifest.json').write_text(json.dumps({'files':records},ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'images':len(records),'downloaded':sum('file'in r for r in records),'bytes':sum(r.get('bytes',0) for r in records),'errors':[r for r in records if r['status']=='download_error']},ensure_ascii=False,indent=2))
