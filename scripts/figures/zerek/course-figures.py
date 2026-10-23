"""Construct course diagrams from reviewed source geometry and labelled values."""
import hashlib, html, json, math, pathlib
ROOT = pathlib.Path(__file__).resolve().parents[3]
BASE = ROOT / 'problems/sources/zerek/courses'
DEST = ROOT / 'frontend/public/figures/zerek-courses'
DEST.mkdir(parents=True, exist_ok=True)
INK, BLUE, PALE = '#16334c', '#73adff', '#eaf3ff'
def retain_unchanged_figure_review(record, previous):
    """Keep approved adaptation provenance only for an unchanged SVG."""
    result=dict(record)
    if previous.get('sha256')!=record['sha256']:return result
    if previous.get('method')=='adapted_from_source_solution':
        # Preserve the adaptation method, flag, notes and evidence together.
        # Current output/source identity is always supplied by this build.
        result.update({key:value for key,value in previous.items() if key not in {'src','image','sha256'}})
    elif 'visualReview' in previous:result['visualReview']=previous['visualReview']
    return result

def text(x,y,s,size=23): return f'<text x="{x}" y="{y}" text-anchor="middle" font-size="{size}" fill="{INK}">{html.escape(str(s))}</text>'
def line(x,y,X,Y,stroke=INK,w=2): return f'<path d="M{x} {y}L{X} {Y}" fill="none" stroke="{stroke}" stroke-width="{w}"/>'
def rect(x,y,w,h,fill='white'): return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{fill}" stroke="{INK}" stroke-width="2"/>'
def circle(x,y,r,fill='white'):return f'<circle cx="{x}" cy="{y}" r="{r}" fill="{fill}" stroke="{INK}" stroke-width="2"/>'
def poly(points,fill):return f'<polygon points="{points}" fill="{fill}" stroke="{INK}" stroke-width="2"/>'
def bracket(x,X,y,label):return line(x,y,X,y)+line(x,y-7,x,y+7)+line(X,y-7,X,y+7)+text((x+X)/2,y-14,label)
def grid(cols,rows,n,cell=35,x=None,y=45):
    x=(720-cols*cell)/2 if x is None else x
    return ''.join(rect(x+c*cell,y+r*cell,cell,cell,BLUE if r*cols+c<n else 'white') for r in range(rows) for c in range(cols))
def cuboid(a,b,c,unit):
    return poly('170,95 460,95 460,245 170,245',BLUE)+poly('170,95 235,40 525,40 460,95',PALE)+poly('460,95 525,40 525,190 460,245','#99bce8')+text(315,285,f'a = {a} {unit}')+text(560,226,f'b = {b} {unit}')+text(98,178,f'c = {c} {unit}')
def route(v,t,d,n=1):
    s=text(220,60,v)+text(530,60,t)+line(80,115,640,115)+bracket(80,640,160,d)
    for i in range(n+1):s+=line(80+i*560/n,105,80+i*560/n,125)
    return s
def axis(lo,hi,points,step=1):
    s=line(60,105,660,105)+poly('660,100 670,105 660,110',INK)
    for v in range(lo,hi+1,step):
        x=60+(v-lo)*600/(hi-lo);s+=line(x,95,x,115)
        s+=text(x,146,v,19)
    for label,v in points:
        x=60+(v-lo)*600/(hi-lo);s+=circle(x,105,5,'#ec6b67')+text(x,79,label)
    return s
def pie(x,y,r,n,filled,clock=False):
    s=circle(x,y,r)
    for i in range(n):
        a=-math.pi/2+i*2*math.pi/n;b=a+2*math.pi/n
        X,Y=x+r*math.cos(a),y+r*math.sin(a);xx,yy=x+r*math.cos(b),y+r*math.sin(b)
        if i in filled:s+=f'<path d="M{x} {y}L{X} {Y}A{r} {r} 0 {1 if n==1 else 0} 1 {xx} {yy}Z" fill="{BLUE}"/>'
    s+=circle(x,y,r,'none')
    if clock:
        for i in range(1,13):
            a=-math.pi/2+i*math.pi/6;s+=text(x+.81*r*math.cos(a),y+.81*r*math.sin(a)+6,i,18)
        s+=line(x,y,x,y-r)+line(x,y,x+r*math.sin(len(filled)*2*math.pi/n),y-r*math.cos(len(filled)*2*math.pi/n))
    else:
        for i in range(n):
            a=-math.pi/2+i*2*math.pi/n;s+=line(x,y,x+r*math.cos(a),y+r*math.sin(a))
    return s
def percent_strip(n,filled,total):
    s=bracket(60,660,45,total)
    for i in range(n):s+=rect(60+600*i/n,80,600/n,70,BLUE if i<filled else 'white')+text(60+600*(i+.5)/n,124,f'{100//n}%',18)
    return s
def bar_chart(values,maximum,step):
    s='';w=560/len(values)
    for n in range(0,maximum+1,step):
        y=350-n/maximum*280;s+=line(80,y,650,y,'#d5e1ef',1)+text(54,y+6,n,19)
    for i,v in enumerate(values):
        x=90+i*w;s+=rect(x,350-v/maximum*280,w*.6,v/maximum*280,BLUE)+text(x+w*.3,383,i+1,21)
    return s+line(80,350,650,350)

fig={}
fig['course-4/1.1-L1-02.png']=(330,''.join(line(110+i*165,50,110+i*165,255)+text(110+i*165,302,label,20)+''.join(f'<ellipse cx="{110+i*165}" cy="{240-j*24}" rx="32" ry="10" fill="{BLUE}" stroke="{INK}"/>' for j in range(n)) for i,(label,n) in enumerate(zip(['Мыңдық','Жүздік','Ондық','Бірлік'],[3,0,4,7])))+line(60,260,665,260))
fig['course-4/1.1-L1-13.png']=(240,text(360,45,'1 см — 4 км')+bracket(90,630,100,'9 см')+line(90,150,630,150)+''.join(line(90+i*60,140,90+i*60,161)+text(90+i*60,190,i,19) for i in range(10))+text(673,190,'см',19))
fig['course-4/1.1-L1-15.png']=(230,bracket(50,250,55,'6 000 ₸')+bracket(340,676,55,'? ₸')+''.join(rect(x,95,40,74,PALE)+line(x+8,114,x+32,114)+circle(x+20,148,6) for x in [50,104,158,212,340,388,436,484,532,580,628]))
fig['course-4/3.1-L1-01.png']=(220,route('v = 70 км/сағ','t = 3 сағ','S = ?',3))
fig['course-4/3.1-L1-04.png']=(220,route('v = 15 км/сағ','t = ?','S = 45 км'))
fig['course-4/3.1-L1-16.png']=(220,route('v = 80 м/мин','t = 7 мин','S = ? м',7))
fig['course-4/3.1-L1-10.png']=(220,''.join(rect(60+i*150,40,150,65,PALE)+text(135+i*150,82,v) for i,v in enumerate(['Автобус','v','t','S']))+''.join(rect(60+i*150,105,150,65)+text(135+i*150,147,v) for i,v in enumerate(['','?','6 сағ','480 км'])))
fig['course-4/4.1-L1-03.png']=(320,cuboid(8,5,3,'см'))
fig['course-4/4.1-L1-07.png']=(320,cuboid(9,6,5,'дм'))
fig['course-4/4.1-L1-12.png']=(370,''.join(rect(170+x*90,40+y*90,90,90,BLUE)+text(215+x*90,94+y*90,l) for l,x,y in [('A',0,1),('B',1,1),('C',2,1),('D',3,1),('E',1,0),('F',1,2)]))
fig['course-5/3.2-L1-01.png']=(260,''.join(rect(85+i*110,40,110,60,BLUE if i<3 else 'white') for i in range(5))+''.join(rect(85+i*27.5,150,27.5,60) for i in range(20)))
fig['course-5/3.2-L1-10.png']=(360,grid(6,4,8,65,y=40))
fig['course-5/3.8-L1-13.png']=(325,pie(190,140,105,4,{0,1,2})+pie(530,140,105,2,{0})+text(190,290,'A')+text(530,290,'B'))
fig['course-5/3.8-L1-16.png']=(325,pie(190,140,105,12,{0,1,2,3},True)+pie(530,140,105,12,{0,1,2},True)+text(190,290,'A')+text(530,290,'B'))
fig['course-5/6.2-L1-03.png']=(450,grid(10,10,23,36,y=40))
fig['course-5/6.2-L1-06.png']=(210,percent_strip(10,4,350))
fig['course-5/6.2-L1-11.png']=(210,percent_strip(4,3,360))
# 20 equal intervals; only source endpoint numbers are shown.
fig['course-5/6.2-L1-14.png']=(205,line(60,105,660,105)+poly('660,100 670,105 660,110',INK)+''.join(line(60+i*30,98,60+i*30,112) for i in range(21))+text(60,148,'0')+text(660,148,'60')+''.join(circle(60+n*10,105,5,'#ec6b67')+text(60+n*10,78,l) for l,n in [('K',15),('M',21),('L',36),('N',39)]))
fig['course-6/4.2-L1-13.png']=(205,axis(-5,3,[('A',-3)]))
fig['course-6/4.2-L1-10.png']=(205,bracket(60,660,45,'26')+''.join(rect(60+i*170,80,170,65,'#ffdf85')+text(145+i*170,122,'x') for i in range(3))+rect(570,80,90,65,PALE)+text(615,122,'5'))
fig['course-6/4.2-L1-03.png']=(300,line(200,65,550,65,w=5)+poly('375,50 365,270 385,270',INK)+line(330,270,420,270,w=5)+line(200,65,60,190)+line(200,65,330,190)+line(550,65,475,190)+line(550,65,650,190)+line(50,200,340,200,w=5)+line(465,200,660,200,w=5)+''.join(rect(x,145,48,50,'#ffdf85' if v=='x' else PALE)+text(x+24,180,v) for x,v in [(62,'x'),(116,'x'),(170,'x'),(224,'x'),(278,'2'),(490,'x'),(550,'14')]))
fig['course-6/8.1-L1-08.png']=(205,axis(-6,5,[('A',-5),('B',3)]))
fig['course-6/8.1-L1-03.png']=(420,bar_chart([6,9,4,8,3],10,2))
fig['course-6/8.1-L1-11.png']=(420,bar_chart([40,55,35,50],60,10))

from course_extra import extend_figures
extend_figures(globals())
from course_protractors import extend_protractors
extend_protractors(globals())
records=[]
for source in json.loads((BASE/'image-manifest.json').read_text())['files']:
    key='/'.join(source['src'].split('/')[-2:])
    if key not in fig:continue # New captures remain pending until reconstructed/reviewed.
    h,body=fig[key]
    svg=f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 {h}" role="img"><title>{html.escape(key)}</title><rect width="720" height="{h}" fill="white"/><g font-family="Arial, DejaVu Sans, sans-serif" stroke-linejoin="round" stroke-linecap="round">{body}</g></svg>\n'
    name=key.replace('/','-').replace('.png','.svg');(DEST/name).write_text(svg)
    records.append({'src':source['src'],'image':'/figures/zerek-courses/'+name,'sha256':hashlib.sha256(svg.encode()).hexdigest(),'method':'constructed_from_complete_condition' if source.get('status')=='source_image_unavailable' else 'constructed_from_reviewed_source_geometry','visualReview':'pending'})
old={}
if (BASE/'vector-manifest.json').exists():old={x['image']:x for x in json.loads((BASE/'vector-manifest.json').read_text())['files']}
records=[retain_unchanged_figure_review(r,old.get(r['image'],{})) for r in records]
native={r['image'] for r in records}
native_sources={r['src'] for r in records}
for r in old.values():
    if r['src'] not in native_sources and r['image'] not in native and r['method']=='source_linework_as_vector_paths':
        path=ROOT/'frontend/public'/r['image'].lstrip('/')
        if path.exists() and hashlib.sha256(path.read_bytes()).hexdigest()==r['sha256']:records.append(r)
(BASE/'vector-manifest.json').write_text(json.dumps({'files':records},ensure_ascii=False,indent=2)+'\n')
print(f'Constructed {len(records)} SVG diagrams; visual review required for changed assets.')
