"""Check rendered ray geometry against the original course's displayed keys."""
import json,math,pathlib,re,unittest,xml.etree.ElementTree as ET
ROOT=pathlib.Path(__file__).resolve().parents[1]
class ProtractorGeometry(unittest.TestCase):
 def test_native_rays_match_the_source_angles(self):
  base=ROOT/'problems/sources/zerek/courses';source=json.loads((base/'5-math-7-2-level1.json').read_text());manifest={r['src']:r for r in json.loads((base/'vector-manifest.json').read_text())['files']};seen=0
  for q in source['questions']:
   if not q['images']:continue
   row=manifest[q['images'][0]['src']];self.assertEqual(row['method'],'constructed_from_reviewed_source_geometry');tree=ET.fromstring((ROOT/'frontend/public'/row['image'].lstrip('/')).read_text());ns={'s':'http://www.w3.org/2000/svg'}
   rays=[e for e in tree.findall('.//s:path',ns) if e.get('stroke-width')=='2.3'];vectors=[]
   for ray in rays:
    x,y,X,Y=map(float,re.fullmatch(r'M([\d.]+) ([\d.]+)L([\d.]+) ([\d.]+)',ray.get('d')).groups());vectors.append((X-x,Y-y))
   if q['sourceAnswer']=='$K$':
    key=next(e for e in tree.findall('.//s:text',ns) if e.text=='K');kx,ky=float(key.get('x')),float(key.get('y'));marks=[e for e in tree.findall('.//s:circle',ns) if math.hypot(float(e.get('cx'))-x,float(e.get('cy'))-y)>260];mark=min(marks,key=lambda e:math.hypot(float(e.get('cx'))-kx,float(e.get('cy'))-ky));v=(float(mark.get('cx'))-x,float(mark.get('cy'))-y);want=60
   else:
    v=vectors[2] if r'\angle AOC' in q['statement'] else vectors[1];want=int(re.search(r'\d+',q['sourceAnswer'])[0])
   a=vectors[0];angle=math.degrees(math.acos(max(-1,min(1,sum(u*w for u,w in zip(a,v))/math.hypot(*a)/math.hypot(*v)))));self.assertAlmostEqual(angle,want,places=7,msg=row['src']);self.assertLess((ROOT/'frontend/public'/row['image'].lstrip('/')).stat().st_size,100000);seen+=1
  self.assertEqual(seen,10)
if __name__=='__main__':unittest.main()
