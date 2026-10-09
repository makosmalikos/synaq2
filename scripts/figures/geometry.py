from drawing import *
# Cube net, angles and counting grid.
s=''
for x,y,label in [(2,0,'1'),(0,1,'2'),(1,1,''),(2,1,'3'),(3,1,'4'),(1,2,'5')]:s+=rect(x*58,y*58,58,58,BLUE if not label else 'white')+text(x*58+29,y*58+29,label,26)
save('v1_q1',group(s,80,35),400,250)
save('v1_q10',line(65,240,535,240)+line(300,240,165,80)+line(300,240,430,105)+''.join(text(x,y,t) for x,y,t in [(50,245,'A'),(550,245,'D'),(300,270,'O'),(155,65,'B'),(442,92,'C'),(195,210,'50°'),(295,150,'3x°'),(410,213,'2x°')]),600,310)
save('v1_q22',group(grid(5,3),35,30),230,155)
# Two rectangles with a shared length of 6.
save('bil_v1_q16',group(rect(100,30,160,120)+rect(0,150,220,120)+line(100,150,220,150,extra='stroke-dasharray="5 5"')+text(180,12,'8 см')+text(294,90,'6 см')+text(255,210,'6 см')+text(110,300,'11 см')+text(160,130,'6 см'),115,15),480,340)
wall=rect(30,70,480,150,ORANGE)+rect(310,70,90,150,PALE)+''.join(line(x,70,x,220) for x in [330,350,370,390])+line(310,115,400,115)+line(310,175,400,175)+text(170,245,'A')+text(455,245,'B')+text(550,145,'3 м')
for name in ['bil_v1_q24','bil_v1_q25']:save(name,wall,600,290)
save('bil_v1_q37',rect(70,40,390,280)+line(70,170,460,170)+line(70,215,460,215)+line(135,40,135,170)+line(325,40,325,170)+line(275,215,275,320)+text(230,100,'49 м²')+text(390,100,'28 м²')+text(265,193,'28 м²')+text(175,265,'35 м²')+text(365,265,'30 м²'),530,360)
save('bil_v2_q1',rect(120,40,220,220)+circle(230,150,110)+line(120,150,230,150)+circle(230,150,3,INK)+text(176,132,'5 см')+text(246,172,'M'),460,300)
# Exact 11-column polyomino from the source: 3+8+11+3=25 cells.
s=''
for r,cols in enumerate([[2,6,10],[1,2,3,5,6,7,9,10],list(range(11)),[2,6,10]]):
 for c in cols:s+=rect(c*30,r*30,30,30,GREEN)
save('bil_v2_q4',group(s,25,25),380,175)
# Triangular grid, side four units, all upward triangles pink.
s='';u=55;ht=u*3**.5/2
for row in range(4):
 for col in range(row+1):
  x=200-row*u/2+col*u;y=30+row*ht
  s+=poly([(x,y),(x-u/2,y+ht),(x+u/2,y+ht)],PINK)
  if col<row:s+=poly([(x,y),(x+u,y),(x+u/2,y+ht)],'#f8e795')
save('bil_v2_q7',s,400,260)
save('bil_v2_q12',poly([(150,40),(360,40),(360,90),(250,90),(250,170),(195,170),(195,290),(150,290)],PALE)+text(255,20,'42 см')+text(100,165,'50 см'),450,330)
items=[]
for left,right,op in [([0,1,2,3],[3],'−'),([1,2,3],[2],'+'),([1,3],[1],'+'),([0,1,3],[3],'−'),([2,3],[1,3],'+')]:
 items.append(group(sectors(4,left,32),-47,0)+text(0,0,op,24)+group(sectors(4,right,32),47,0))
saveopts('bil_v2_q13',items)
save('bil_v2_q15',path('M120 30H280A80 80 0 0 0 280 190A80 80 0 0 0 280 350H120Z',PALE)+line(280,30,280,350,extra='stroke-dasharray="5 5"')+text(70,190,'32 см')+text(200,377,'20 см'),400,410)
save('bil_v2_q25',group(grid(3,3,range(9)),25,35)+group(grid(3,3,range(9)),145,35)+group(grid(3,3,[0,1,2,3,5,6,7]),265,35),390,170)
save('bil_v2_q39',line(270,175,325,45)+line(270,175,435,250)+line(270,175,115,250)+poly([(279,153),(300,162),(291,183)],'none')+text(270,208,'123°')+''.join(text(x,y,t) for x,y,t in [(330,30,'A'),(450,260,'B'),(98,260,'C'),(255,162,'O')]),550,310)
# Three pentagons; the third is split into ten equal triangles, three filled.
s=''
for j in range(3):
 p=pts(5,70,100+j*185,100)
 if j<2:s+=poly(p,BLUE)
 else:
  pp=[]
  for i in range(5):pp.extend([p[i],((p[i][0]+p[(i+1)%5][0])/2,(p[i][1]+p[(i+1)%5][1])/2)])
  for i in range(10):s+=poly([(100+j*185,100),pp[i],pp[(i+1)%10]],BLUE if i in [7,8,9] else 'white')
save('bil_v4_q6',s,570,220)
save('bil_v4_q13',group(grid(2,1,[0],60),100,35)+text(70,110,'+',28)+group(grid(3,1,[0],40),160,95)+line(75,150,305,150)+group(grid(6,1,range(5),20),100,175),390,245)
save('bil_v4_q14',rect(100,40,270,270)+rect(100,220,90,90,PINK)+rect(190,40,180,180,ORANGE)+text(145,265,'9 см²',17)+text(280,130,'36 см²')+''.join(text(x,y,t) for x,y,t in [(88,327,'A'),(382,327,'B'),(382,25,'C'),(88,25,'D')]),470,360)
save('bil_v4_q23',line(70,260,530,260)+line(290,260,160,105)+line(290,260,365,54)+text(205,244,'40°')+text(290,204,'?')+''.join(text(x,y,t) for x,y,t in [(65,281,'B'),(540,280,'C'),(290,280,'A'),(150,92,'E'),(375,42,'D')]),600,330)
save('bil_v4_q25',poly([(125,270),(380,270),(325,125),(235,55)])+''.join(text(x,y,t) for x,y,t in [(112,289,'A'),(395,289,'B'),(340,115,'C'),(235,33,'D'),(142,155,'3 см'),(325,65,'½ см'),(389,192,'2 см'),(250,299,'3/2 см')]),500,350)
save('bil_v4_q27',rect(100,110,75,75,PINK)+rect(230,35,100,175,'#f8e795')+text(137,92,'3 см')+text(280,17,'4 см')+text(370,125,'7 см')+rect(110,250,175,100,'#f8e795')+rect(285,275,75,75,PINK),460,390)
def pie(values,labels,r=110):
 s='';start=-100
 for i,(angle,label) in enumerate(zip(values,labels)):
  a=start*pi/180;b=(start+angle)*pi/180;m=(a+b)/2
  s+=path(f'M0 0L{r*cos(a)} {r*sin(a)}A{r} {r} 0 {int(angle>180)} 1 {r*cos(b)} {r*sin(b)}Z',[PALE,'#f8e795',GREEN,ORANGE,PURPLE][i%5])
  for k,part in enumerate(label.split('|')):s+=text(r*.62*cos(m),r*.62*sin(m)+(k-(len(label.split('|'))-1)/2)*21,part,14)
  start+=angle
 return s
save('bil_v4_q28',group(pie([160,50,40,80,30],['Футбол|160°','Волейбол|50°','Жүзу|40°','Баскетбол|80°','Теннис|30°'],145),190,185),380,370)
save('bil_v4_q38',group(pie([36,144,180],['Мұғалімдер','Қыздар|144°','Ұлдар'],145),195,185)+text(195,185,'O'),390,370)
# Six equilateral triangles sharing a vertex; side lengths preserved.
s='';lengths=[10,8,6,9,7,5]
for i,n in enumerate(lengths):
 a=(-60+i*60)*pi/180;b=a+pi/3;r=n*15;p=[(300,190),(300+r*cos(a),190+r*sin(a)),(300+r*cos(b),190+r*sin(b))];s+=poly(p,[ORANGE,GREEN,BLUE,PURPLE,PINK,'#f8e795'][i]);s+=text((p[1][0]+p[2][0])/2+20*cos((a+b)/2),(p[1][1]+p[2][1])/2+20*sin((a+b)/2),str(n)+' см',16)
save('bil_v5_q3',s,600,400)
s=circle(190,120,90,ORANGE)+circle(190,120,60,'white')
for i in range(7):
 s+=line(100+i*30,30,100+i*30,210,extra='opacity=".35" stroke-dasharray="3 4"')+line(100,30+i*30,280,30+i*30,extra='opacity=".35" stroke-dasharray="3 4"')
save('bil_v5_q4',s,380,255)
save('bil_v5_q19',rect(100,60,288,120)+poly([(100,120),(388,60),(388,180),(244,180)],ORANGE)+text(244,35,'24 см')+text(435,120,'10 см')+''.join(text(x,y,t) for x,y,t in [(90,200,'A'),(400,200,'B'),(400,45,'C'),(90,45,'D'),(82,120,'E'),(244,202,'F')]),510,250)
s=rect(75,25,90,30)+text(205,40,'→ a')+rect(275,25,30,30)+text(345,40,'→ 1')
for r in range(3):s+=rect(100,105+r*50,110,35)+rect(225,105+r*50,35,35)+(rect(275,105+r*50,35,35) if r<2 else '')
save('bil_v5_q20',s,450,290)
save('bil_v5_q35',line(210,230,470,230)+line(210,230,110,80)+path('M240 230A30 30 0 0 0 194 205',ORANGE)+text(250,192,'x+5°')+text(105,60,'A')+text(210,255,'O')+text(480,247,'B'),560,310)
s='';vals=[20,5,40,25,30,15,34]
for v in range(0,41,5):y=290-v*6;s+=line(70,y,470,y,extra='stroke-dasharray="3 5" opacity=".3"')+text(45,y,v,15)
for i,v in enumerate(vals):s+=rect(85+i*54,290-v*6,25,v*6,[PINK,BLUE,ORANGE,GREEN][i%4])
save('bil_v5_q36',s,510,330)
save('bil_v5_q39',group(numberline([(-3.5,'E'),(-1.5,'B'),(.5,'A'),(1.5,'C'),(2.5,'D')],-4,4,480,2),60,70),600,135)
save('nzm_q10',group(grid(4,3,[0,1,5,6,10,11],52),50,30),310,220)
save('nzm_q22',rect(100,120,200,160,INK)+rect(165,40,240,180,'#aabac6')+rect(165,120,135,100,'white')+text(285,20,'12')+text(435,130,'9')+text(200,305,'10')+text(75,200,'8'),510,345)
# Grey complementary circular segments plus two sectors; no raster textures.
s=rect(100,40,220,220,'white')+poly([(100,40),(320,40),(210,150)],'#aabac6')+poly([(100,260),(320,260),(210,150)],'#aabac6')+circle(210,150,110,'white')
for a in [-45,135]:
 p=pts(8,110,210,150,a);s+=path(f'M210 150L{p[0][0]} {p[0][1]}A110 110 0 0 1 {p[2][0]} {p[2][1]}Z','#aabac6')
s+=line(100,40,320,260)+line(320,40,100,260)
s+=''.join(text(x,y,t) for x,y,t in [(85,25,'A'),(335,25,'B'),(335,282,'C'),(85,282,'D')])
save('nzm_q30',s,420,300)
save('nzm_q48',''.join(circle(x,y,58,'#aabac6' if (x,y)==(258,198) else 'white') for x in [142,258] for y in [82,198]),400,295)
save('nzm_q52',rect(100,40,220,220)+poly([(210,40),(320,150),(210,260),(100,150)],'#aabac6')+''.join(text(x,y,'a',16) for x,y in [(155,20),(265,20),(155,283),(265,283),(80,95),(80,205),(340,95),(340,205)]),420,320)
p=pts(6,105,210,150,-75);s=poly(p)+poly([(210,150),p[2],p[3]],'#aabac6')+''.join(line(210,150,x,y,extra='stroke-dasharray="4 5"') for x,y in p)
save('nzm_q59',s,420,300)
s=''
for i in range(14):s+=line(50+i*30,30,50+i*30,330,extra='opacity=".2"')
for i in range(11):s+=line(50,330-i*30,440,330-i*30,extra='opacity=".2"')
s+=poly([(80,300),(260,210),(260,60),(410,300)],'#aabac6')+line(50,330,465,330)+line(50,350,50,15)
for i in range(2,13,2):s+=text(50+i*30,355,i,15)
for i in range(2,11,2):s+=text(32,330-i*30,i,15)
save('nzm_q68',s,500,390)
save('nzm_q69',rect(80,30,250,250)+path('M80 80H280V280H230V130H80Z',INK)+path('M80 180H180V280H130V230H80Z',INK),410,330)
save('nzm_q79',rect(80,50,280,160)+line(160,50,160,210)+line(80,90,360,90)+text(120,25,'2')+text(260,25,'5')+text(55,70,'1')+text(55,150,'3'),430,250)
save('bil_ve_4',rect(100,50,240,240)+poly([(148,50),(292,50),(340,98),(340,242),(292,290),(148,290),(100,242),(100,98)],PALE)+text(220,25,'10 см')+text(380,266,'2 см'),450,330)
save('bil_ve_14',group(grid(3,3,(),60),40,30),260,250)
save('bil_ve_16',line(120,35,120,245)+line(190,35,190,245)+line(50,105,260,105)+line(50,175,260,175)+''.join(text(85+c*70,70+r*70,t,26) for r,row in enumerate([['X','O','1'],['2','3','4'],['5','X','']]) for c,t in enumerate(row)),310,280)
save('bil_ve_39',poly([(90,90),(240,90),(240,210),(330,210),(330,45),(450,45),(450,330),(90,330)])+''.join(text(x,y,t) for x,y,t in [(75,72,'A'),(245,72,'B'),(225,227,'C'),(344,227,'D'),(320,27,'E'),(460,27,'F'),(462,347,'G'),(75,347,'H')]),540,380)
s=poly([(120,300),(300,30),(480,300)])
for i in range(6):s+=poly([(120+i*60,300),(150+i*60,255),(180+i*60,300)])
for i,t in enumerate('ACEGIKM'):s+=text(120+i*60,321,t,16)
for i,t in enumerate('BDFHJL'):s+=text(150+i*60,241,t,16)
s+=text(300,14,'N');save('bil_ve_40',s,600,360)
s='';
for r,cols in enumerate([[2],[1,2,3],[0,1,2,3,4]]):
 for c in cols:s+=rect(50+c*50,25+r*50,50,50,PURPLE)
save('bil_log_v1_25',s,350,215)
save('logic64',poly([(70,40),(310,40),(310,160),(450,160),(450,280),(70,280)],PALE)+text(260,310,'n')+text(40,160,'m')+text(333,100,'t')+text(380,141,'y'),530,350)
