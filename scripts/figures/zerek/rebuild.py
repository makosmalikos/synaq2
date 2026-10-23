"""Reconstruct Zerek diagram assets as geometry, or preserve complex source linework.
No embedded rasters. Run from repo root with Pillow and vtracer 0.6.15.
Never fill in missing labels or alter the source mathematical givens.
"""
from pathlib import Path
import json,math,re,html,hashlib,io
from PIL import Image
import vtracer
ROOT=Path(__file__).resolve().parents[3];BASE=ROOT/'problems/sources/zerek';OUT=ROOT/'frontend/public/figures/zerek';OUT.mkdir(exist_ok=True)
INK='#172d43';SHADE='#a8b5c5'
def text(x,y,t,size=22):return f'<text x="{x:g}" y="{y:g}" font-size="{size}" text-anchor="middle" dominant-baseline="middle">{html.escape(str(t))}</text>'
def line(x,y,a,b):return f'<path d="M{x:g} {y:g}L{a:g} {b:g}"/>'
def rect(x,y,w,h,fill='white'):return f'<rect x="{x:g}" y="{y:g}" width="{w:g}" height="{h:g}" fill="{fill}"/>'
def circle(x,y,r,fill='white'):return f'<circle cx="{x:g}" cy="{y:g}" r="{r:g}" fill="{fill}"/>'
def svg(w,h,body):return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="-12 -12 {w+24} {h+24}" role="img"><title>Тапсырма сызбасы</title><rect x="-12" y="-12" width="{w+24}" height="{h+24}" fill="white"/><g fill="none" stroke="{INK}" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round">'+body+'</g></svg>'
def labels(s):return s.replace('<text ',f'<text fill="{INK}" stroke="none" font-family="Arial, sans-serif" ')
def polar(cx,cy,r,a):a=math.radians(a);return cx+r*math.cos(a),cy+r*math.sin(a)
def pie(values,inner=None):
 n=len(values);cx=cy=130;r=115;start=-120 if n==6 else -135 if n==4 else -90;step=360/n;b=circle(cx,cy,r)
 for i,v in enumerate(values):
  a=start+i*step;x,y=polar(cx,cy,r,a);b+=line(cx,cy,x,y);x,y=polar(cx,cy,82 if inner else 74,a+step/2);b+=text(x,y,v)
 if inner:
  b+=circle(cx,cy,53)
  for i,v in enumerate(inner):
   a=start+i*step;x,y=polar(cx,cy,53,a);b+=line(cx,cy,x,y);x,y=polar(cx,cy,31,a+step/2);b+=text(x,y,v,18)
 return svg(260,260,b)
def cards(cards,kind='square'):
 b='';w=180
 for i,(values,center) in enumerate(cards):
  x=i*w
  if kind=='square':
   b+=rect(x+10,15,150,150)+circle(x+85,90,29)
   for (dx,dy),v in zip([(32,40),(137,40),(32,140),(137,140)],values):b+=text(x+dx,dy,v)
  else:
   b+=circle(x+85,90,76)+circle(x+85,90,29)
   for j,v in enumerate(values):
    a=-135+j*90;xx,yy=polar(x+85,90,76,a);ix,iy=polar(x+85,90,29,a);b+=line(ix,iy,xx,yy)
    xx,yy=polar(x+85,90,54,a+45);b+=text(xx,yy,v)
  b+=text(x+85,90,center,25)
 return svg(w*len(cards),180,b)
def triangles(cards,star=False):
 b='';w=220
 for i,vals in enumerate(cards):
  x=i*w+20;points=[(x+90,25),(x+18,150),(x+162,150)]
  b+=f'<polygon points="'+ ' '.join(f'{a},{c}' for a,c in points)+'" fill="white"/>'
  if star:
   b+=f'<polygon points="{x+90},165 {x+18},40 {x+162},40" fill="none"/>'
   positions=[(90,10),(167,40),(167,151),(90,178),(12,151),(12,40)];center=vals[-1]
   for (dx,dy),v in zip(positions,vals[:-1]):b+=text(x+dx,dy,v,19)
  else:
   positions=[(90,10),(12,160),(167,160)];center=vals[-1]
   for (dx,dy),v in zip(positions,vals[:-1]):b+=text(x+dx,dy,v)
  b+=text(x+90,107 if not star else 100,center,25)
 return svg(w*len(cards),190,b)
def pyramid(cards,inverted=False):
 b='';w=280;cw=56;ch=45
 for j,rows in enumerate(cards):
  h=len(rows)
  for r,row in enumerate(rows):
   for c,v in enumerate(row):
    x=j*w+(w-len(row)*cw)/2+c*cw;y=(r if inverted else h-r-1)*ch
    b+=rect(x,y,cw,ch)+text(x+cw/2,y+ch/2,v,24)
 return svg(w*len(cards),h*ch,b)
def grid(cols,rows,shade=False,dots=False):
 b='';step=50
 if dots:
  for x in range(cols):
   for y in range(rows):b+=circle(15+x*step,15+y*step,4,INK)
  return svg(cols*step,rows*step,b)
 for x in range(cols):
  for y in range(rows):b+=rect(x*step,y*step,step,step,SHADE if shade else 'white')
 return svg(cols*step,rows*step,b)
def net(cells):return svg(220,250,''.join(rect(x*48,y*48,48,48,SHADE) for x,y in cells))
N={}
for idx,vals in {10:[4,8,16,'?',64,2],18:[2,'?',6,7,4,9,36,49],19:[31,24,5,8,11,4,'?',28],20:[7,'?',64,16,49,81,8,4],21:[16,32,1,2,'?',8],32:[22,30,'?',46,6,14],42:['7/9','9/11','?','1/3','3/5','5/7'],43:[17,'?',23,8,11,14],44:['3/4','4/5','5/6','?','7/8','8/9'],45:[24,48,96,3,6,'?'],90:['y',3,65,126,9,28,4,'x + y'],162:[7,11,16,22,28,44,64,'?']}.items():N[idx]=pie(vals)
for idx,(outer,inner) in {25:([100,'?',4,36],[10,4,2,6]),26:([25,4,100,'?',49,9],[5,2,10,8,7,3]),46:([8,28,32,40,'?',36],[2,7,8,10,4,9]),47:([20,'?',19,17],[11,3,10,8]),48:([16,'?',13,22],[4,5,1,10]),49:([8,17,18,10,'?',15],[2,11,12,4,1,9])}.items():N[idx]=pie(outer,inner)
for idx,data in {22:[([2,8,7,2],24),([5,9,3,8],32),([5,6,6,1],'?')],23:[([9,3,5,8],154),([4,7,5,5],108),([6,6,8,6],'?')],24:[([9,6,9,2],144),([4,2,9,8],130),([5,4,1,3],'?')]}.items():N[idx]=cards(data,'round')
for idx,data in {31:[([4,4,8,3],19),([3,4,1,9],17),([4,6,4,9],'?')],33:[([3,7,2,6],65),([7,5,1,9],112),([3,4,9,4],'?')],38:[([1,8,5,4],9),([5,7,6,4],24),([2,6,5,1],'?')],86:[([11,13,16,12],13),([8,18,19,11],14),([14,19,20,11],'?')],176:[([5,8,4,7],24),([9,6,2,5],32),([4,5,6,7],'?')]}.items():N[idx]=cards(data)
for idx,data in {27:[[8,7,4,88],[8,9,1,80],[7,6,9,'?']],28:[[8,7,7,22],[4,9,8,21],[6,8,3,'?']],29:[[4,6,3,27],[6,7,7,49],[6,9,5,'?']],30:[[9,4,1,14],[6,7,2,15],[7,1,3,'?']],36:[[1,7,5,35],[3,8,4,96],[3,2,6,'?']],37:[[7,1,1,7],[8,4,8,256],[8,1,5,'?']],189:[[6,9,4,42],[5,7,3,26],[4,4,7,'?']]}.items():N[idx]=triangles(data)
for idx,data in {14:[[2,10,10,5,2,8,37],[7,9,6,12,11,11,50],[11,11,7,6,12,12,'?']],15:[[3,10,8,12,11,1,45],[6,4,6,4,6,9,37],[6,11,9,12,10,6,'?']],16:[[8,4,8,10,12,3,45],[6,1,3,10,12,10,31],[9,12,1,3,11,12,'?']],17:[[3,6,3,12,3,5,32],[11,7,10,7,10,12,53],[12,5,9,4,11,11,'?']],34:[[1,1,10,1,1,4,18],[12,8,4,3,4,7,38],[3,8,3,7,'?',5,30]],35:[[10,4,8,6,4,11,43],[11,12,7,6,5,1,42],[7,9,6,8,12,'?',39]]}.items():N[idx]=triangles(data,True)
for idx,data in {11:[[[12,7,7,1],[19,14,8],[33,22],[55]],[[8,3,1,7],[11,4,8],[15,12],['?']]],12:[[[1,6,10,11],[7,16,21],[23,37],[60]],[[3,9,11,11],[12,20,22],[32,42],['?']]],13:[[[6,2,2,7],[8,4,9],[12,13],[25]],[[11,9,3,5],[20,12,8],[32,20],['?']]],41:[[[4,4,4],[16,16],[256]],[[4,3,4],[12,12],['?']]]}.items():N[idx]=pyramid(data)
N[221]=pyramid([[[4,5,'?'],[20,''],[300]]],True);N[223]=pyramid([[[1,-1,1],[-1,-1],[1]]],True)
for idx,args in {53:(4,2,True),56:(4,2),57:(3,2),58:(2,2),188:(4,4),201:(3,3),216:(4,4,False,True)}.items():N[idx]=grid(*args)
N[52]=net([(1,0),(0,1),(1,1),(1,2),(1,3),(2,3)])
N[54]=net([(1,0),(0,1),(1,1),(0,2),(1,2),(2,2),(3,2),(3,3)])
# Counting geometry: reconstructed exactly, not decorative substitutes.
N[63]=svg(300,170,line(10,160,150,10)+line(150,10,290,160)+line(10,160,290,160)+line(150,10,103,160)+line(150,10,197,160))
N[64]=svg(300,170,line(10,160,150,10)+line(150,10,290,160)+line(10,160,290,160)+line(150,10,150,160)+line(80,85,220,85))
N[65]=svg(250,250,rect(10,10,230,230)+line(10,10,240,240)+line(240,10,10,240))
N[51]=svg(260,260,circle(130,130,115)+f'<path d="M130 130H245A115 115 0 0 1 130 245Z" fill="{SHADE}"/>'+line(15,130,245,130)+line(130,15,130,245))
N[50]=svg(260,260,''.join(f'<path d="M130 130L{polar(130,130,115,-90+i*36)[0]:g} {polar(130,130,115,-90+i*36)[1]:g}A115 115 0 0 1 {polar(130,130,115,-90+(i+1)*36)[0]:g} {polar(130,130,115,-90+(i+1)*36)[1]:g}Z" fill="{SHADE if i not in (3,5) else "white"}"/>' for i in range(10)))


# Rebuilt tables and graphs retain the source's numbers, axes and point labels.
N[2]=grid(5,3)
N[201]=svg(210,210,''.join(rect(30+x*50,30+y*50,50,50) for x in range(3) for y in range(3))+text(20,15,'A'))
def table(rows,widths):
 b='';h=42
 for r,row in enumerate(rows):
  x=0
  for c,v in enumerate(row):b+=rect(x,r*h,widths[c],h)+text(x+widths[c]/2,r*h+h/2,v,18);x+=widths[c]
 return svg(sum(widths),len(rows)*h,b)
N[124]=table([['Шахмат клубы','6-сынып','7-сынып','8-сынып'],['Әуесқой',1,'?',5],['Шебер',2,'?',6]],[160,110,110,110])
N[127]=table([['Түскі ас','Саны'],['Пицца',132],['Манты',112],['Плов',88],['Спагетти',44],['Лагман',24]],[190,150])
def plot_grid(cols,rows,points,names,axes=False):
 step=30;ox=40;oy=rows*step+25;b=''
 for x in range(cols+1):b+=line(ox+x*step,25,ox+x*step,oy)
 for y in range(rows+1):b+=line(ox,oy-y*step,ox+cols*step,oy-y*step)
 b='<g stroke="#d9e3ee" stroke-width="1">'+b+'</g>'
 pp=lambda x,y:(ox+x*step,oy-y*step)
 b+='<polygon points="'+' '.join(f'{pp(x,y)[0]},{pp(x,y)[1]}' for x,y in points)+'" fill="#c3dcff" stroke="#2463b8"/>'
 for (x,y),name in zip(points,names):
  a,c=pp(x,y);b+=text(a+(12 if name=='B' else -8),c+(14 if name in ('A','B') else -13),name,16)
 if axes:
  b+=line(ox,oy,ox+(cols+0.5)*step,oy)+line(ox,oy,ox,10)+text(ox+cols*step+23,oy,'x',17)+text(ox,8,'y',17)
  for x in range(2,cols+1,2):b+=text(ox+x*step,oy+17,x,14)
  for y in range(2,rows+1,2):b+=text(ox-15,oy-y*step,y,14)
 return svg(ox+cols*step+35,oy+30,b)
# The source origin is unlabelled: only relative grid coordinates matter here.
N[89]=plot_grid(8,8,[(1,1),(7,1),(7,7),(3,5)],['A','B','C','D'])
N[125]=plot_grid(14,11,[(1,1),(7,4),(7,9),(12,1)],['','','',''],True)
# Eight rectangular bricks: five standing in front, three laid across the top.
def bricks():
 p=lambda x,y,z:(30+12*x+6*y,180-4*y-12*z)
 poly=lambda ps,fill:'<polygon points="'+' '.join(f'{p(*v)[0]:g},{p(*v)[1]:g}' for v in ps)+f'" fill="{fill}"/>'
 b=poly([(0,0,8),(15,0,8),(15,15,8),(0,15,8)],'white')+poly([(15,0,0),(15,15,0),(15,15,8),(15,0,8)],'#b5c4d4')+poly([(0,0,0),(15,0,0),(15,0,8),(0,0,8)],'#dbe5ef')
 for x in (3,6,9,12):b+=line(*p(x,0,0),*p(x,0,5))
 b+=line(*p(0,0,5),*p(15,0,5))+line(*p(15,0,5),*p(15,15,5))
 for y in (5,10):b+=line(*p(0,y,8),*p(15,y,8))+line(*p(15,y,5),*p(15,y,8))
 a,c=p(0,0,0);d,e=p(3,0,0);b+=line(a,c+9,d,e+9)+line(a,c+5,a,c+13)+line(d,e+5,d,e+13)+text((a+d)/2,c+25,'3 см',17)
 return svg(320,220,b)
N[3]=bricks()


def drilled_cube():
 p=lambda x,y,z:(30+44*x+30*y,330-22*y-55*z)
 poly=lambda ps:'<polygon points="'+' '.join(f'{p(*v)[0]:g},{p(*v)[1]:g}' for v in ps)+'" fill="white"/>'
 b=poly([(0,0,4),(4,0,4),(4,4,4),(0,4,4)])+poly([(4,0,0),(4,4,0),(4,4,4),(4,0,4)])+poly([(0,0,0),(4,0,0),(4,0,4),(0,0,4)])
 for k in (1,2,3):
  for a,c in [((k,0,4),(k,4,4)),((0,k,4),(4,k,4)),((4,k,0),(4,k,4)),((4,0,k),(4,4,k)),((k,0,0),(k,0,4)),((0,0,k),(4,0,k))]:b+=line(*p(*a),*p(*c))
 # Locations read from all three source faces: two distinct triple intersections.
 for x,y,z in [(1.5,2.5,1.5),(2.5,1.5,2.5)]:
  a,c=p(x,0,z);b+=circle(a,c,8,INK)
  a,c=p(4,y,z);b+=f'<ellipse cx="{a}" cy="{c}" rx="6" ry="9" fill="{INK}"/>'
  a,c=p(x,y,4);b+=f'<ellipse cx="{a}" cy="{c}" rx="10" ry="5" fill="{INK}"/>'
 return svg(360,350,b)
N[192]=drilled_cube()
N[193]=svg(300,230,'<g stroke="#bd5858">'+''.join(rect(x*90+10,y*100+10,90,100) for x,y in [(0,0),(1,0),(2,0),(0,1),(1,1)])+'</g>'+''.join(circle(x*90+10,y*100+10,4,INK) for x,y in sorted({(x+a,y+b) for x,y in [(0,0),(1,0),(2,0),(0,1),(1,1)] for a,b in [(0,0),(1,0),(0,1),(1,1)]})))
N[193]=N[193].replace('</g></svg>','<g stroke="#9aaabd" stroke-width="1.3" stroke-dasharray="4 4">'+line(108,10,108,210)+line(198,10,198,110)+line(10,118,190,118)+'</g></g></svg>')
N[203]=svg(390,270,rect(10,10,210,96,'#27bdea')+rect(220,10,150,96)+rect(10,106,210,144)+rect(220,106,150,144,'#27bdea')+text(115,58,42,30)+text(295,58,'?',30)+text(115,178,63,30)+text(295,178,45,30)+''.join(circle(x,y,4,INK) for x in (10,220,370) for y in (10,106,250)))

def run():
 previous=json.loads((BASE/'vector-manifest.json').read_text())['files'] if (BASE/'vector-manifest.json').exists() else []
 approved={f['vectorSha256']:f.get('visualReview') for f in previous}
 files=json.loads((BASE/'image-manifest.json').read_text())['files'];report=[];tmp=ROOT/'output/zerek-import/vector-work';tmp.mkdir(exist_ok=True)
 for i,f in enumerate(files):
  target=OUT/(Path(f['file']).stem+'.svg')
  if i in N:content=labels(N[i]);method='constructed geometry and explicit source labels'
  else:
   im=Image.open(BASE/f['file']).convert('RGBA');bg=Image.new('RGBA',im.size,'white');bg.alpha_composite(im);im=bg.convert('RGB')
   # Preserve every small dot, number and colour; remove only anti-alias greys.
   gray_share=sum(1 for r,g,b in im.getdata() if max(r,g,b)-min(r,g,b)<28 and 100<=(r+g+b)/3<205)/(im.width*im.height)
   ink_cutoff=205 if gray_share<0.12 else 100
   pix=[]
   for r,g,b in im.getdata():
    lum=(r+g+b)/3
    if max(r,g,b)-min(r,g,b)<28:
     color=(255,255,255) if lum>235 else (23,45,67) if lum<ink_cutoff else (168,181,197) if lum<205 else (220,226,234)
    else:color=(r//16*16,g//16*16,b//16*16)
    pix.append(color)
   im.putdata(pix);im=im.quantize(colors=16).convert('RGB')
   colors=sorted(set(im.getdata()),key=lambda c:sum(c),reverse=True);parts=[]
   # Trace masks separately so later colour layers cannot erase a thin black line.
   for color in colors:
    if min(color)>240:continue
    mask=Image.new('L',im.size);mask.putdata([0 if v==color else 255 for v in im.getdata()]);p=tmp/(target.stem+'-mask.png');mask.save(p)
    layer=tmp/(target.stem+'-mask.svg')
    vtracer.convert_image_to_svg_py(str(p),str(layer),colormode='binary',mode='spline',filter_speckle=0,corner_threshold=65,length_threshold=3.5,path_precision=2)
    ink='#'+''.join(f'{c:02x}' for c in color)
    for path in re.findall(r'<path\b[^>]+/>',layer.read_text()):parts.append(re.sub(r'fill="[^"]*"',f'fill="{ink}"',path))
   content=f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="-8 -8 {im.width+16} {im.height+16}" role="img"><rect x="-8" y="-8" width="{im.width+16}" height="{im.height+16}" fill="white"/><title>Тапсырма сызбасы</title>'+''.join(parts)+'</svg>'
   method='source linework reconstructed as vector paths; all dots and labels retained'
  assert '<image' not in content and 'data:image' not in content
  target.write_text(content)
  report.append({'sourceUrl':f['sourceUrl'],'sourceFile':f['file'],'image':'/figures/zerek/'+target.name,'method':method,'sourceSha256':f['sha256'],'vectorSha256':hashlib.sha256(content.encode()).hexdigest(),'visualReview':approved.get(hashlib.sha256(content.encode()).hexdigest(),'pending')})
 (BASE/'vector-manifest.json').write_text(json.dumps({'files':report},ensure_ascii=False,indent=2)+'\n')
 print('Vectors',len(report),'constructed',len(N))
if __name__=='__main__':run()
