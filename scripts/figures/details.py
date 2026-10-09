from drawing import *
# Safe handle orientations: the option drawing itself is the answer.
def wheel(a):
 s=circle(0,0,42,'none',7)
 for i in range(3):s+=group(line(0,0,0,-40),rotate=a+i*120).replace('stroke-width="2"','stroke-width="7"')
 return s
saveopts('bil_v1_q31',[wheel(a) for a in [0,90,180,270,-15]],group(wheel(0),300,65),135)
# Analogue scale: 0 at twelve o'clock, 3 at six; the pointer is halfway 3 and 4.
s=path('M150 145L110 345H310L270 145Z',PINK)+path('M130 70Q210 145 290 70Z',PINK)+circle(210,250,75)
for v in range(12):
 a=(-90+v*30)*pi/180;s+=line(210+64*cos(a),250+64*sin(a),210+70*cos(a),250+70*sin(a))
 if v%2==0:s+=text(210+49*cos(a),250+49*sin(a),v//2,17)
a=120*pi/180;s+=line(210,250,210+61*cos(a),250+61*sin(a))+circle(210,250,5,PINK)
for i in range(4):s+=path(f'M{150+i*23} 60Q{180+i*15} 107 {245+i*5} 45Q{215+i*9} 118 {150+i*23} 60Z','#f8d66d')
save('bil_v2_q8',s,420,385)
# Balanced pans: preserve quantities and colours from the original.
def scale(left,right):
 s=poly([(-15,58),(15,58),(0,3)],'#aabac6')+line(-75,4,75,4)+path('M-95 5Q-64 43 -35 5Z',PALE)+path('M35 5Q64 43 95 5Z',PALE)
 for off,balls in [(-65,left),(65,right)]:
  for i,color in enumerate(balls):s+=circle(off+(i-(len(balls)-1)/2)*13,-3,7,color)
 return s
s=group(scale([PINK,PINK],[BLUE]),135,75)+text(135,40,'1')+group(scale([PINK]*3,[PINK,BLUE]),420,75)+text(420,40,'2')+group(scale([PINK]*4,[PINK,PINK,BLUE]),280,240)+text(280,205,'3')
save('bil_v2_q32',s,560,340)
# L-shaped prism. All five dimensions retained.
a=[(150,75),(175,90),(175,230),(150,215)];s=poly(a,PALE)+poly([(150,75),(275,15),(300,30),(175,90)],'white')+poly([(175,90),(300,30),(300,170),(175,230)],PALE)+poly([(175,230),(300,170),(355,200),(230,260)],'white')+poly([(230,260),(355,200),(355,260),(230,320)],PALE)+poly([(150,215),(175,230),(230,260),(230,320),(150,275)],BLUE)
s+=''.join(text(x,y,t) for x,y,t in [(125,175,'5'),(295,10,'1'),(375,235,'2'),(295,310,'4'),(175,315,'3')]);save('nzm_q46',group(s,0,20),480,380)
# Four-wheel numeric grid square counter.
s=''
for r,cols in enumerate([[1,2,3],[0,1,2,3],[0,1,2,3],[1,2]]):
 for c in cols:s+=rect(70+c*55,30+r*55,55,55)
s+=poly([(180,30),(290,140),(180,250),(70,140)])+circle(180,30,5,INK)+circle(180,250,5,INK)
save('bil_log_v1_5',s,365,290)
# Intersecting circle/rectangle silhouettes: no photographed fill.
items=[]
for i in range(5):
 s=circle(-8,8,36,BLUE,0)
 if i==0:s+=rect(-8,-43,50,55,BLUE)
 if i==1:s+=rect(-8,-28,50,38,BLUE)
 if i==2:s+=rect(-8,-28,40,72,BLUE)
 if i==3:s=circle(28,-22,36,BLUE,0)+rect(-58,-22,86,55,BLUE)
 if i==4:s+=rect(-8,-43,36,95,BLUE)
 s=s.replace('stroke-width="2"','stroke-width="0"');items.append(s)
saveopts('bil_log_v1_1',items)
# Matching shapes differing only in orientation/fill.
def ornaments(rotation=0,swap=False):
 s=rect(-35,-35,70,70)
 s+=poly([(-13,-35),(0,-60),(13,-35)],GREEN if not swap else 'white')
 s+=poly([(-13,35),(0,60),(13,35)],'white' if not swap else GREEN)
 s+=rect(-59,-12,24,24,GREEN)+rect(35,-12,24,24)
 return group(s,rotate=rotation)
saveopts('bil_log_v1_17',[ornaments(0),ornaments(-90),ornaments(180),ornaments(90),ornaments(90,True)])
# A square split by both diagonals and midlines; fill only the original triangles.
def eight_square(shaded):
 pp=[(-44,-44),(0,-44),(44,-44),(44,0),(44,44),(0,44),(-44,44),(-44,0)];s=''
 for i in range(8):s+=poly([(0,0),pp[i],pp[(i+1)%8]],PURPLE if i in shaded else 'white')
 return s
base=group(eight_square([7,1,3,5]),190,65)+text(190,132,'I')+group(eight_square([1,3]),400,65)+text(400,132,'II')
items=[eight_square([7,1,5]),rect(-44,-44,88,88)+poly([(0,0),(44,-44),(0,-44)],PURPLE)+poly([(-44,44),(0,0),(0,44)],PURPLE)+line(0,-44,0,44),rect(-44,-44,88,88)+poly([(-44,-44),(-44,0),(0,0)],PURPLE)+poly([(0,0),(44,0),(44,44)],PURPLE)+line(-44,0,44,0),rect(-44,-44,88,88)+poly([(-44,44),(0,0),(0,44)],PURPLE)+line(0,-44,0,44)+line(-44,44,44,-44),eight_square([0,4,6])]
saveopts('bil_log_v1_16',items,base,165)
# Cell diagram: arrow targets the nucleus, not the small nucleolus.
s=path('M110 50C50 75 40 245 105 295C180 335 285 295 285 220C310 135 275 30 195 25C165 20 135 28 110 50Z',PALE,4)
s+=path('M105 80Q90 105 105 145Q130 158 145 123Q152 72 132 60Q115 55 105 80Z','white')
s+=circle(180,215,63,PURPLE)+circle(195,233,13,INK)
for x,y,r in [(83,178,16),(205,77,18),(255,134,17),(110,277,15),(162,60,15)]:
 s+=group(path(f'M{-r} -8Q0 -21 {r} -5Q{r+9} 12 0 14Q{-r-7} 11 {-r} -8Z',ORANGE)+path(f'M{-r+4} -5L-5 4L3 -5L9 5',width=1.5),x,y)
for i in range(23):
 x=100+(i*47)%160;y=50+(i*31)%230
 if (x-180)**2+(y-215)**2>4900:s+=circle(x,y,2.5,INK,0)
s+=line(360,185,229,205)+poly([(230,205),(244,195),(245,207)],INK)+text(382,184,'X',26)
save('cell-x',s,440,350)
