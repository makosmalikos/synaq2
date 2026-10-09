from pathlib import Path
from math import sin,cos,pi
from html import escape
INK='#29465b'; BLUE='#65b9df'; PALE='#eaf5fb'; ORANGE='#f5b45e'; PURPLE='#a998db'; GREEN='#8bcbb5'; PINK='#df8caf'
OUT=Path('frontend/public/figures/redrawn');OUT.mkdir(parents=True,exist_ok=True)
entries={}
def text(x,y,s,size=19,anchor='middle'):
 return f'<text x="{x}" y="{y}" fill="{INK}" stroke="none" font-family="Arial, sans-serif" font-size="{size}" text-anchor="{anchor}" dominant-baseline="middle">{escape(str(s))}</text>'
def path(d,fill='none',width=2,extra=''):
 return f'<path d="{d}" fill="{fill}" stroke="{INK}" stroke-width="{width}" stroke-linecap="round" stroke-linejoin="round" {extra}/>'
def line(x,y,X,Y,extra=''):return path(f'M{x} {y}L{X} {Y}',extra=extra)
def poly(points,fill='none',width=2):return path('M'+'L'.join(f'{x:g} {y:g}' for x,y in points)+'Z',fill,width)
def rect(x,y,w,h,fill='white'):return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{fill}" stroke="{INK}" stroke-width="2"/>'
def circle(x,y,r,fill='white',width=2):return f'<circle cx="{x}" cy="{y}" r="{r}" fill="{fill}" stroke="{INK}" stroke-width="{width}"/>'
def group(body,x=0,y=0,scale=1,rotate=0):return f'<g transform="translate({x} {y}) scale({scale}) rotate({rotate})">{body}</g>'
def pts(n,r,cx=0,cy=0,a=-90):return [(cx+r*cos((a+i*360/n)*pi/180),cy+r*sin((a+i*360/n)*pi/180)) for i in range(n)]
def grid(cols,rows,shaded=(),size=32):
 return ''.join(rect(c*size,r*size,size,size,BLUE if r*cols+c in shaded else 'white') for r in range(rows) for c in range(cols))
def sectors(n,shaded,r=60):
 out=''
 for i in range(n):
  a=(-90+i*360/n)*pi/180;b=a+2*pi/n
  out+=path(f'M0 0L{r*cos(a)} {r*sin(a)}A{r} {r} 0 {int(n==1)} 1 {r*cos(b)} {r*sin(b)}Z',BLUE if i in shaded else 'white')
 return out

def svg(body,w=600,h=360):return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" role="img"><g>{body}</g></svg>'
def save(name,body,w=600,h=360):
 (OUT/(name+'.svg')).write_text(svg(body,w,h));entries[name]={'width':w,'height':h}
def options(items,top='',tw=600,th=0):
 out=top
 for i,body in enumerate(items):
  x=(i%3)*200;y=th+(i//3)*190
  out+=group(text(18,22,'ABCDE'[i],18)+group(body,100,100),x,y)
 return out,600,th+((len(items)+2)//3)*190

def saveopts(name,items,top='',th=0):
 body,w,h=options(items,top,th=th);save(name,body,w,h)
 # Keep source option order unchanged; images can be embedded by renderer later.
 for i,body in enumerate(items): (OUT/(name+'-'+str(i)+'.svg')).write_text(svg(group(body,100,85),200,170))
 entries[name]['options']=len(items)
def numberline(labels,minv=0,maxv=3,w=360,div=4):
 body=line(0,0,w,0)
 for i in range(int((maxv-minv)*div)+1):
  v=minv+i/div;x=(v-minv)/(maxv-minv)*w
  body+=line(x,-5,x,5)
  if i%div==0:body+=text(x,22,f'{v:g}',15)
 for v,label in labels: x=(v-minv)/(maxv-minv)*w;body+=circle(x,0,3,INK)+text(x,-20,label,17)
 return body
