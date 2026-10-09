"""Clean geometric replacements for complex diagrams, reviewed against originals."""
from drawing import *
# Number-line answer choices: retain each correct and incorrect placement.
s=''
for i,(a,b,step) in enumerate([(1.25,2.75,.25),(.75,2.75,.25),(.75,2.75,.25),(1.25,3,.25),(1.5,2.5,.25)]):
 y=45+i*100;s+=text(25,y,'ABCDE'[i])+line(60,y,550,y)
 # Original C/D/E stretch the interval 1..2 compared with A/B.
 def pos(v):return 70+v*145
 for j in range(13):s+=line(pos(j/4),y-4,pos(j/4),y+4)
 for j in range(4):s+=text(pos(j),y-19,j,17)
 if i==2:b=1.75
 s+=text(pos(a),y+27,'5/4',19)+text(pos(b),y+27,'2¾',19)
save('bil_v2_q10',s,590,500)
# Directed jumps used for subtraction; arrows point to the original endpoints.
s=''
for i,(end,result) in enumerate([(8/3,7/3),(7/3,5/3),(7/3,2/3),(2,2/3),(5/3,4/3)]):
 y=65+i*120;s+=text(25,y,'ABCDE'[i])+line(55,y,545,y)
 def x(v):return 75+v*140
 for j in range(10):s+=line(x(j/3),y-4,x(j/3),y+4)
 for j in range(4):s+=text(x(j),y+20,j,16)
 def jump(a,b,dy,color):
  return path(f'M{x(a)} {y-5} Q{(x(a)+x(b))/2} {y+dy} {x(b)} {y-5}').replace(INK,color)+poly([(x(b),y-5),(x(b)+(8 if b<a else -8),y-13),(x(b)+(5 if b<a else -5),y-2)],color)
 s+=jump(0,end,-85,INK)+jump(end,result,-45,INK)+jump(0,result,75,PINK)
save('bil_v2_q29',s,590,610)
# Three trains shown before/after shifting: clean icons with unchanged distances.
def train(x,y,color):
 s=rect(x,y,265,36,color)
 for j in range(9):s+=rect(x+9+j*28,y+6,19,15,'#e9f4fa')
 for j in range(6):s+=circle(x+18+j*44,y+37,5,INK)
 return s
def signal(x,y):return line(x,y-27,x,y+42)+rect(x-5,y-27,10,19,INK)+circle(x,y-22,2,GREEN)
s=''
for i,(color,dist,last) in enumerate([(ORANGE,'27 м','3⁵ м'),(BLUE,'31 м','4⁴ м'),('#acbdc9','33 м','17² м')]):
 y=55+i*100;s+=train(85,y,color)+signal(173,y)+signal(535,y)+line(350,y+18,535,y+18)+text(130,y-15,dist)+text(437,y,last)
 y=365+i*100;s+=signal(55,y)+signal(535,y)+train(270,y,color)+line(55,y+18,270,y+18)+text(165,y,['A³','B²','C²'][i])
save('bil_v1_q22',s,600,630)
# Exact partitions of the pet survey, including the right-angle marker.
s=circle(250,240,195,'white')
for a in [-165,-8,15,105,172]:s+=line(250,240,250+195*cos(a*pi/180),240+195*sin(a*pi/180))
s+=group(path('M18 0V18H0'),250,240,rotate=15)
for x,y,t in [(250,120,'иттер / собаки'),(250,165,'19'),(107,225,'балықтар'),(107,247,'рыбы'),(395,245,'құстар'),(395,267,'птицы'),(316,320,'мысықтар'),(316,345,'кошки'),(316,380,'12'),(165,310,'тасбақалар'),(165,335,'черепахи')]:s+=text(x,y,t,17)
save('nzm_q38',s,500,470)
# Nine equal squares and their exact shaded triangles.
s=group(grid(3,3,(),80),90,50)
for p in [[(90,130),(170,50),(170,130)],[(250,50),(250,130),(330,130)],[(90,210),(170,210),(170,290)],[(250,210),(330,210),(250,290)],[(170,130),(250,130),(210,170)],[(170,210),(250,210),(210,170)]]:s+=poly(p,INK)
for x,y,flip in [(170,50,0),(90,130,1),(250,130,1),(170,210,0)]:
 s+=line(x,y if not flip else y+80,x+80,y+80 if not flip else y)
 s+=line(x+40,y+40,x+80,y if not flip else y+80)
for x,y,t in [(75,42,'A'),(170,30,'M'),(250,30,'P'),(345,42,'B'),(70,130,'Q'),(350,130,'R'),(70,210,'T'),(350,210,'S'),(75,310,'D'),(170,315,'N'),(250,315,'O'),(345,310,'C')]:s+=text(x,y,t)
save('nzm_q47',s,420,350)
# Three prisms; smooth faces rather than paper grain.
s=''
for i in range(3):
 x=35+i*175;y=100
 if i==0:
  face=path(f'M{x} {y+70} Q{x+10} {y+10} {x+72} {y-35} L{x+76} {y+25} L{x+25} {y+90}Z',ORANGE)
  face+=path(f'M{x+25} {y+90} Q{x+35} {y+30} {x+98} {y-20} L{x+101} {y+40}Z','#fbe4bf')+line(x+72,y-35,x+98,y-20)
 elif i==1:face=poly([(x,y+70),(x+70,y-35),(x+97,y-18),(x+24,y+87)],'#fbe4bf')+poly([(x+24,y+87),(x+97,y-18),(x+100,y+40)],ORANGE)
 else:face=poly([(x,y+10),(x+74,y-35),(x+101,y-18),(x+27,y+28)],'#fbe4bf')+poly([(x,y+10),(x+27,y+28),(x+27,y+87),(x,y+69)],ORANGE)+poly([(x+27,y+28),(x+101,y-18),(x+101,y+40),(x+27,y+87)],'#f8d499')
 s+=face+text(x+50,220,['I','II','III'][i])
save('bil_log_v1_3',s,550,260)
# Unit-cube arrangements. Coordinates reproduce the visible stacks.
def cubes(layout):
 out='';a=32;dx=16;dy=12
 for x,y,h in sorted(layout,key=lambda p:(-p[1],p[0])):
  for z in range(h):
   u=x*a+y*dx;v=90-y*dy-z*a
   out+=poly([(u,v),(u+a,v),(u+a+dx,v-dy),(u+dx,v-dy)],'#e9f6fb')+poly([(u+a,v),(u+a+dx,v-dy),(u+a+dx,v+a-dy),(u+a,v+a)],'#c4e5f2')+rect(u,v,a,a,'white')
 return out
layouts=[[(x,y,2 if x==0 else 1) for x in range(2) for y in range(3)],[(0,y,2 if y==2 else 1) for y in range(3)],[(x,y,1) for x in range(3) for y in range(3) if x<2 or y==0],[(x,y,1) for x in range(2) for y in range(3)],[(x,y,2 if x==0 and y==0 else 1) for x in range(2) for y in range(3)]]
s=''
for i,l in enumerate(layouts):s+=group(cubes(l)+text(60,157,i+1,22),40+(i%2)*240,25+(i//2)*195)
save('bil_log_v1_8',s,500,600)
# Missing bracket in a 3×3 matrix.
s=group(grid(3,3,(),110),40,25)
def bracket(x,y,angle):return group(path('M-12 -12V12H12V-12H4V4H-4V-12Z','white'),x,y,rotate=angle)
for x,y,a in [(60,47,0),(205,115,90),(345,47,180),(63,195,270),(315,160,90),(60,332,180),(240,300,270),(277,267,0)]:s+=bracket(x,y,a)
s+=text(205,190,'?',32);save('bil_ve_3',s,410,380)
# Dot-grid polyominoes. Areas in square units: K24, I22, T20, A19, P18.
polygons=[('T',[(1,1),(6,1),(6,8),(4,8),(4,3),(1,3)],3.5,2),('P',[(8,1),(12,1),(12,4),(14,4),(14,6),(10,6),(10,3),(8,3)],9.5,2),('A',[(15,2),(18,2),(18,1),(20,1),(20,6),(21,6),(21,7),(18,7),(18,4),(15,4)],18.6,3),('I',[(22,1),(24,1),(24,3),(27,3),(27,1),(29,1),(29,5),(22,5)],25.5,4),('K',[(22,6),(28,6),(28,7),(29,7),(29,8),(30,8),(30,9),(31,9),(31,10),(25,10),(25,9),(24,9),(24,8),(23,8),(23,7),(22,7)],26.5,8)]
s=''.join(circle(20+x*19,20+y*19,1.3,BLUE,0) for x in range(33) for y in range(12))
for label,p,x,y in polygons:s+=poly([(20+a*19,20+b*19) for a,b in p],PALE)+text(20+x*19,20+y*19,label,22)
save('bil_v1_q8',s,650,255)
