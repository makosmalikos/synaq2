from drawing import *
# The source panels in variants A and B differ in answer ordering.
def numbered_hex():
 p=pts(6,115,220,150,-90);s=poly(p)
 for x,y in p:s+=line(220,150,x,y)
 for i,t in enumerate(['10','41','206','?','1','3']):
  a=(-60+i*60)*pi/180;s+=text(220+70*cos(a),150+70*sin(a),t,24)
 return s
for n in ['bil_va_8','bil_vb_11']:save(n,numbered_hex(),440,310)
# Cross/star with four inside values and four outside diamonds.
s='';center=(260,205)
p=[(260,100),(280,185),(365,205),(280,225),(260,310),(240,225),(155,205),(240,185)]
s+=poly(p,PALE)+poly(pts(10,18,260,205), 'white')
for x,y,t in [(260,160,'13'),(305,205,'5'),(260,255,'8'),(215,205,'3')]:s+=text(x,y,t)
for x,y,t in [(260,65,'27'),(410,205,'x'),(260,345,'y'),(110,205,'7')]:s+=poly([(x,y-30),(x+45,y),(x,y+30),(x-45,y)])+text(x,y,t)
for n in ['bil_va_3','bil_vb_17']:save(n,s,520,395)
s=circle(240,180,95)+poly([(240,85),(335,180),(240,275),(145,180)])+line(145,180,335,180)+line(240,85,240,275)
for x,y,t in [(240,65,'12'),(355,180,'18'),(240,295,'27'),(125,180,'8')]:s+=circle(x,y,25,PALE)+text(x,y,t)
for x,y,t in [(213,151,'24'),(267,151,'36'),(213,210,'?'),(267,210,'54')]:s+=text(x,y,t)
save('bil_va_10',s,480,355)
s=''
for i,t in enumerate(['x','7','9','11','y']):
 x=60+i*105;s+=circle(x,90,30,PALE)+text(x,90,t,24)
 if i<4:s+=line(x+33,90,x+71,90)+poly([(x+65,85),(x+72,90),(x+65,95)],INK)
for n in ['bil_va_11','bil_vb_18']:save(n,s,570,180)
s=circle(250,180,48)+line(202,180,298,180)+line(250,132,250,228)
for x,y,t in [(226,158,'3'),(274,158,'11'),(226,204,'x'),(274,204,'y')]:s+=text(x,y,t)
for x,y,vals in [(75,20,[9,12,2,3]),(325,20,[7,6,4,5]),(75,255,[11,8,6,5]),(325,255,[13,8,4,3])]:
 s+=rect(x,y,100,85)+circle(x+50,y+43,9)
 for xx,yy,t in [(x+17,y+16,vals[0]),(x+82,y+16,vals[1]),(x+17,y+68,vals[2]),(x+82,y+68,vals[3])]:s+=text(xx,yy,t,17)
 s+=line(x+50,y+43,250,180,extra='opacity=".15"')
for n in ['bil_va_13','bil_vb_8']:save(n,s,500,375)
# Shared circle/triangle counting drawing, rebuilt from explicit segments.
s=circle(250,180,135)+poly([(120,180),(205,95),(295,95),(380,180),(295,265),(205,265)],PALE)
s+=rect(205,95,90,170,'none')+poly([(170,180),(250,95),(330,180),(250,265)],'none')+line(120,180,380,180)+line(250,95,250,265)
for n in ['bil_va_33','bil_vb_23']:save(n,s,500,365)
p=[(120,135),(175,270),(355,270),(395,130),(255,50)];s=poly(p)+line(*p[0],*p[2])
for (x,y),t in zip(p,'ABCDE'):s+=text(x+(x-250)*.11,y+(y-160)*.14,t,22)
for n in ['bil_va_38','bil_vb_3']:save(n,s,520,330)
# Dot tiles. Zero is blank and '?' stays unknown.
def dots(n,x=0,y=0,size=42):
 if n=='?':return text(x+size/2,y+size/2,'?',22)
 coords={0:[],1:[(1,1)],2:[(0,0),(2,2)],3:[(0,0),(1,1),(2,2)],4:[(0,0),(2,0),(0,2),(2,2)],5:[(0,0),(2,0),(1,1),(0,2),(2,2)],6:[(0,0),(2,0),(0,1),(2,1),(0,2),(2,2)]}
 return ''.join(circle(x+size*(.22+.28*a),y+size*(.22+.28*b),2.8,INK,0) for a,b in coords[n])
def domino(a,b):return rect(-23,-45,46,90)+line(-23,0,23,0)+dots(a,-21,-44)+dots(b,-21,1)
seq=[(3,0),(1,0),('?','?'),(3,0),(3,4),(5,0),(3,6)]
top=''.join(group(domino(a,b),55+i*79,65) for i,(a,b) in enumerate(seq))
for n,opts in [('bil_va_7',[(5,2),(4,0),(5,1),(2,4),(3,2)]),('bil_vb_10',[(5,2),(4,0),(3,2),(5,1),(2,4)])]:saveopts(n,[domino(a,b) for a,b in opts],top,145)
# Pattern cells preserve top/bottom counts and source option order.
def starcell(top,bottom,inverted=False):
 s=rect(-35,-35,70,70)+text(0,1,'✦',28)
 for i in range(top):s+=rect(-32+i*43,-32,20,20,INK if inverted else 'white')
 for i in range(bottom):s+=rect(12-i*43,12,20,20,'white' if inverted else INK)
 return s
base=''
for r in range(3):
 for c in range(3):base+=group(text(0,0,'?',25) if r==c==2 else starcell(c,r),200+c*75,45+r*75)
for n,opts in [('bil_va_9',[(2,2,True),(1,2,False),(1,2,False),(2,2,False),(2,1,False)]),('bil_vb_14',[(2,2,False),(2,2,True),(1,2,False),(1,2,False),(2,1,False)])]:
 # The two one-square alternatives differ by its corner.
 items=[starcell(a,b,inv) for a,b,inv in opts]
 if n=='bil_va_9':items[1]=group(starcell(1,2),rotate=0).replace('x="-32" y="-32"','x="12" y="-32"')
 else:items[2]=items[2].replace('x="-32" y="-32"','x="12" y="-32"')
 saveopts(n,items,base,270)
# Paper folds and mirrored hole choices.
def paper(holes):return rect(-37,-43,74,86)+''.join(circle(x,y,3,INK,0) for x,y in holes)
top=''
for i in range(4):
 x=45+i*110;top+=rect(x,30,75,90)+text(x+37,143,i+1,16)
 if i>0:top+=line(x,75,x+75,75)
 if i>1:top+=line(x+37,30,x+37,120)
 if i==3:top+=circle(x+15,44,3,INK)
patterns=[ [(-23,-28),(23,-28),(-23,0),(23,0)], [(-23,-28),(23,-28),(-23,0),(23,0),(-23,28),(23,28)], [(-23,-28),(23,-28),(-23,28),(23,28)], [(-23,-28),(23,-28),(0,0),(-23,28),(23,28)], [(-23,-28)] ]
for n,order in [('bil_va_5',[0,1,2,3,4]),('bil_vb_7',[2,0,1,3,4])]:saveopts(n,[paper(patterns[i]) for i in order],top,170)
# Gridded shortest paths.
paths=[[(0,3),(1,3),(2,2),(2,0),(3,0)],[(0,3),(1,3),(2,0),(3,0)],[(0,3),(0,2),(2,1),(3,1),(3,0)],[(0,3),(0,1),(3,1),(3,0)],[(0,3),(0,1),(2,0),(3,0)]]
items=[]
for pp in paths:items.append(group(grid(3,3,(),35),-52,-52)+path('M'+'L'.join(f'{x*35-52} {y*35-52}' for x,y in pp),width=5))
saveopts('bil_ve_10',items)
# Number squares and wheels.
s=''
for j,values in enumerate([[12,4,9,3],[2,12,8,48],['A',3,16,4]]):
 x=100+j*190;s+=rect(x-30,80,60,60)
 for xx,yy,t in [(x-65,45,values[0]),(x+65,45,values[1]),(x-65,175,values[2]),(x+65,175,values[3])]:s+=text(xx,yy,t)+line(x+(xx-x)*.6,110+(yy-110)*.6,xx+(x-xx)*.3,yy+(110-yy)*.3)
save('bil_log_v1_19',s,650,220)
s=''
for j,vals in enumerate([[4,2,1,8],[16,8,4,32],[24,'y',6,'x']]):
 x=100+j*200;s+=circle(x,115,85)+line(x-60,55,x+60,175)+line(x+60,55,x-60,175)
 for dx,dy,t in [(0,-48,vals[0]),(48,0,vals[1]),(0,48,vals[2]),(-48,0,vals[3])]:s+=text(x+dx,115+dy,t,23)
 # Direction is part of the sequence, retain the upward arrow on the left.
 s+=path(f'M{x-94} 155Q{x-117} 98 {x-70} 43',extra='marker-end="url(#arrow)"')
s='<defs><marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0L10 5L0 10" fill="'+INK+'"/></marker></defs>'+s
save('bil_log_v1_21',s,620,235)
s=circle(200,170,125)
for a in [-90,-30,30,90,150,210]:s+=line(200,170,200+125*cos(a*pi/180),170+125*sin(a*pi/180))
for a,t in zip([-60,0,60,120,180,240],['b','4','9','16','a','36']):s+=text(200+75*cos(a*pi/180),170+75*sin(a*pi/180),t,25)
save('bil_log_v1_23',s,400,340)
# 5 text cells: readable text rather than a photographed table.
phrases=['Сол ғана|келді','Бұдан әрі|шыдай|алмадым','Серік пен|Берік келді','Отан үшін|отқа түс,|күймейсің','Мен-ақ|білемін']
s=''
for i,phrase in enumerate(phrases):
 x=50+(i%3)*160 if i<3 else 130+(i-3)*160;y=20 if i<3 else 125;s+=rect(x,y,160,100)
 for k,t in enumerate(phrase.split('|')):s+=text(x+80,y+25+k*24,t,17)
# Answer cells follow original order, after removing one of the five blocks.
items=[]
for absent in [1,2,4,0,3]:
 body=''
 for i in range(5):
  if i==absent:continue
  x=-75+(i%3)*50 if i<3 else -50+(i-3)*50;y=-20 if i<3 else 10;body+=rect(x,y,50,30)
 items.append(body)
saveopts('bil_ve_kaz1_45',items,s,250)
s=''
for i,t in enumerate(['алынды','айтқыз','жазысты','көрсеткіз']):s+=rect(150,25+i*75,280,55,PALE)+text(110,53+i*75,2+i*2,24)+text(290,53+i*75,t,23)
save('bil_ve_kaz1_48',s,530,340)
