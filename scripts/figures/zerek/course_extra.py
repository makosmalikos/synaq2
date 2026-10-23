"""Native constructions for the next course diagrams; values read from originals."""
import math

def build_missing_grade5_figures(g):
    """Recover only data explicitly recorded in the complete source solutions."""
    T, L, R, C = g['text'], g['line'], g['rect'], g['circle']
    ink, blue = g['INK'], g['BLUE']
    red = '#dc3545'

    # 6.3-L3-04: the original raster is unavailable. The displayed solution
    # states that A ends at 80% of B and the red difference is 1,500 tenge.
    # Both bars share a start and scale; the monetary balances stay unknown.
    s = R(110,55,500,60,blue)+T(65,95,'B',29)
    s += R(110,155,400,60,'#9de0cb')+T(65,195,'A',29)
    for x,top in [(510,215),(610,115)]:
        s += f'<path d="M{x} {top}V315" stroke="{ink}" stroke-width="1.5" stroke-dasharray="6 6" fill="none"/>'
    s += L(110,315,610,315)
    for value in range(0,101,20):
        x = 110+5*value
        s += L(x,307,x,323)+T(x,352,f'{value}%',21)
    s += L(515,260,605,260,red,3)
    s += '<path d="M510 260L522 254V266Z M610 260L598 254V266Z" fill="'+red+'"/>'
    s += T(560,241,'1 500 тг',23).replace(ink,red)
    savings = (385,s)

    # 7.1-L3-03: only six distinct rays OA...OF are specified. Their fan
    # placement is schematic; no angle measures or answer count are supplied.
    s = ''
    ox, oy, length = 360, 340, 260
    for label,degrees in zip('ABCDEF',[0,24,51,79,111,146]):
        angle = math.radians(degrees)
        dx,dy = math.cos(angle),-math.sin(angle)
        x,y = ox+length*dx,oy+length*dy
        bx,by = x-12*dx,y-12*dy
        s += L(ox,oy,x,y,w=3)
        s += f'<path d="M{x:.3f} {y:.3f}L{bx-5*dy:.3f} {by+5*dx:.3f}L{bx+5*dy:.3f} {by-5*dx:.3f}Z" fill="{ink}"/>'
        s += T(ox+(length+24)*dx,oy+(length+24)*dy+7,label,27)
    s += C(ox,oy,4,ink)+T(ox-12,oy+35,'O',27)
    rays = (410,s)
    return {'course-5/6.3-L3-04.png':savings,'course-5/7.1-L3-03.png':rays}

def build_missing_grade5_higher46_figures(g):
    """Native equivalents using only explicitly recoverable mathematical data.

    7.4-L2-15 is an explicitly authorised adaptation: polygons 1/2 follow
    the recorded dimensions, while 3/4 are newly constructed distractors.
    """
    T,L,R,C,P = g['text'],g['line'],g['rect'],g['circle'],g['poly']
    ink,blue,pale = g['INK'],g['BLUE'],g['PALE']
    figures = {}
    def put(name,height,body): figures['course-5/'+name+'.png']=(height,body)
    def point(origin,degrees,radius):
        a=math.radians(degrees)
        return origin[0]+radius*math.cos(a),origin[1]-radius*math.sin(a)
    def arc(origin,lo,hi,radius=65,colour=blue):
        x,y=point(origin,lo,radius);X,Y=point(origin,hi,radius)
        return f'<path d="M{x} {y}A{radius} {radius} 0 {1 if hi-lo>180 else 0} 0 {X} {Y}" fill="none" stroke="{colour}" stroke-width="3"/>'
    def angle_label(origin,lo,hi,label,radius=100):
        x,y=point(origin,(lo+hi)/2,radius)
        return T(x,y+7,label,25)
    def equal_mark(origin,lo,hi,radius=65):
        x,y=point(origin,(lo+hi)/2,radius-6);X,Y=point(origin,(lo+hi)/2,radius+6)
        return arc(origin,lo,hi,radius)+L(x,y,X,Y,blue,3)
    def right_mark(origin,a,b,size=22):
        x,y=point(origin,a,size);X,Y=point(origin,b,size)
        return f'<path d="M{x} {y}L{x+X-origin[0]} {y+Y-origin[1]}L{X} {Y}" fill="none" stroke="{ink}" stroke-width="2"/>'
    def rays(origin,specs,radius=250,origin_label_offset=(-12,35)):
        s=''
        for label,degrees in specs:
            x,y=point(origin,degrees,radius);X,Y=point(origin,degrees,radius+27)
            s+=L(*origin,x,y,w=3)+T(X,Y+7,label,27)
        return s+C(*origin,4,ink)+T(origin[0]+origin_label_offset[0],origin[1]+origin_label_offset[1],'O',25)

    # Two genuine scales, including all 1-degree ticks: OA at inner zero,
    # OB at 132 degrees. Do not draw the requested bisector OC.
    o=(360,320);radius=250
    s=f'<path d="M110 320A250 250 0 0 1 610 320V342H110Z" fill="#e4efff" stroke="{ink}" stroke-width="2"/>'
    s+=f'<path d="M242 320A118 118 0 0 1 478 320Z" fill="white" stroke="{ink}" stroke-width="1.5"/>'
    for degree in range(181):
        length=21 if degree%10==0 else 14 if degree%5==0 else 7
        x,y=point(o,degree,radius);X,Y=point(o,degree,radius-length)
        s+=L(x,y,X,Y,ink,1.4 if degree%5==0 else .8)
    for label,degree in [('A',0),('B',132)]:
        x,y=point(o,degree,radius+58);X,Y=point(o,degree,radius+82)
        s+=L(*o,x,y,w=2.5)+T(X,Y+7,label,25)
    for degree in range(0,181,10):
        for r,value,fill in [(radius-43,180-degree,ink),(radius-80,degree,'#235aa8')]:
            x,y=point(o,degree,r)
            s+=f'<text x="{x}" y="{y}" text-anchor="middle" dominant-baseline="middle" font-size="16" fill="{fill}" stroke="#e4efff" stroke-width="2" paint-order="stroke" transform="rotate({90-degree} {x} {y})">{value}</text>'
    s+=C(*o,4.5,'#d83f47')+T(360,370,'O',25)
    put('7.2-L2-07',430,s)

    o=(360,330)
    s=rays(o,[('B',0),('C',30),('D',80),('A',180)])
    for lo,hi,label,r in [(0,30,'30°',70),(30,80,'50°',80),(80,180,'100°',85)]:
        s+=arc(o,lo,hi,r)+angle_label(o,lo,hi,label,r+39)
    put('7.3-L2-02',400,s)

    s=rays(o,[('A',180),('C',90),('D',28),('B',0)])+right_mark(o,180,90)
    s+=arc(o,0,28,85)+angle_label(o,0,28,'28°',125)
    s+=arc(o,28,90,60)+angle_label(o,28,90,'?',103)
    put('7.3-L2-07',400,s)

    s=rays(o,[('A',180),('C',80),('D',40),('B',0)])
    s+=arc(o,80,180,85)+angle_label(o,80,180,'100°',125)
    s+=equal_mark(o,0,40)+equal_mark(o,40,80)
    put('7.3-L2-14',400,s)

    o=(360,225)
    s=rays(o,[('A',0),('B',90),('C',160),('D',230)],165,(21,30))+right_mark(o,0,90)
    s+=equal_mark(o,90,160)+equal_mark(o,160,230)
    s+=arc(o,230,360,90)+angle_label(o,230,360,'130°',125)
    put('7.3-L3-05',450,s)

    # Exact 90-degree rotation for 1/2. Only one side of each original
    # distractor survives in the written solution, so 3/4 are adaptations,
    # not claims about the missing original vertices. Their areas differ
    # from 1/2 and from one another: 3, 7 versus 5 square grid units.
    polygons=[[(0,0),(3,0),(3,2),(1,2)],[(2,0),(2,3),(0,3),(0,1)],
              [(0,0),(2,0),(2,2),(1,2)],[(0,0),(4,0),(4,2),(1,2)]]
    s=''
    for i,vertices in enumerate(polygons):
        center=190 if i%2==0 else 530;top=35 if i<2 else 325
        for col in range(7):s+=L(center-144+48*col,top,center-144+48*col,top+240,'#dbe4ef',1)
        for row in range(6):s+=L(center-144,top+48*row,center+144,top+48*row,'#dbe4ef',1)
        width=max(x for x,y in vertices)
        left=center-144+48*((6-width)//2);bottom=top+192
        points=' '.join(f'{left+48*x},{bottom-48*y}' for x,y in vertices)
        s+=P(points,pale).replace(f'fill="{pale}"',f'fill="{pale}" fill-opacity=".65"')
        s+=T(center,top+265,i+1,27)
    put('7.4-L2-15',620,s)

    # The complete solution specifies two aligned rows of three equal cells.
    s=R(120,80,480,240,pale)
    for x in [280,440]:s+=L(x,80,x,320)
    s+=L(120,200,600,200)
    put('7.4-L3-04',370,s)

    # Notch width/location are immaterial and remain unlabelled schematic
    # dimensions. Only width 14, height 10 and notch depth 4 are supplied.
    s=P('150,60 270,60 270,180 450,180 450,60 570,60 570,360 150,360',pale)
    s+=L(150,390,570,390)+L(150,382,150,398)+L(570,382,570,398)+T(360,426,'14 см',25)
    s+=L(112,60,112,360)+L(104,60,120,60)+L(104,360,120,360)+T(63,217,'10 см',25)
    s+=L(300,60,300,180)+L(293,60,307,60)+L(293,180,307,180)+T(363,128,'4 см',25)
    put('7.4-L3-06',460,s)

    # The hands show exactly 4:00; no sector angle is printed.
    o=(360,225);radius=165;s=C(*o,radius)
    for i in range(60):
        a=90-i*6;x,y=point(o,a,radius);X,Y=point(o,a,radius-(15 if i%5==0 else 7))
        s+=L(x,y,X,Y,ink,2 if i%5==0 else 1)
    for i in range(1,13):
        x,y=point(o,90-i*30,132);s+=T(x,y+8,i,25)
    s+=L(*o,360,78,blue,5)
    x,y=point(o,-30,105);s+=L(*o,x,y,ink,7)+C(*o,6,ink)
    put('8.2-L2-06',435,s)

    # Every daily value, axis name and 50-person grid unit is in the source.
    values=[100,150,150,200,250,400,350];s='';x0,y0=100,400
    for value in range(0,451,50):
        y=y0-.7*value;s+=L(x0,y,660,y,'#dbe4ef',1)+T(66,y+6,value,18)
    for day in range(8):
        x=x0+80*day;s+=L(x,85,x,y0,'#dbe4ef',1)+T(x,y0+32,day,20)
    s+=L(x0,400,690,400)+L(x0,420,x0,55)+T(704,406,'d',25)+T(80,40,'n',25)
    points=[(x0+80*(day+1),y0-.7*value) for day,value in enumerate(values)]
    s+='<polyline points="'+' '.join(f'{x},{y}' for x,y in points)+f'" fill="none" stroke="{blue}" stroke-width="4"/>'
    for x,y in points:s+=C(x,y,4,ink)
    put('8.3-L2-15',465,s)

    # Show only initial weeks; crossing/exceeding weeks are intentionally
    # outside the view. Both linear laws are recorded in the source solution.
    s='';x0,y0=120,450
    for amount in range(0,1801,100):
        y=y0-.2*amount;s+=L(x0,y,600,y,'#dbe4ef',1)+T(77,y+6,amount,16)
    for week in range(5):
        x=x0+120*week;s+=L(x,90,x,y0,'#dbe4ef',1)+T(x,y0+31,week,21)
    s+=L(x0,y0,645,y0)+L(x0,y0+15,x0,65)+T(664,477,'w',25)+T(83,40,'S, тг',24)
    for label,start,increment,colour in [('A',500,200,'#2374c8'),('B',1300,100,'#d58212')]:
        points=[(x0+120*week,y0-.2*(start+increment*week)) for week in range(5)]
        s+='<polyline points="'+' '.join(f'{x},{y}' for x,y in points)+f'" fill="none" stroke="{colour}" stroke-width="3"/>'
        for x,y in points:s+=C(x,y,4,colour)
        s+=T(points[-1][0]+29,points[-1][1]+7,label,26).replace(ink,colour)
    put('8.3-L3-03',510,s)
    return figures

def build_missing_grade5_higher47_figures(g):
    """Equivalent cuboid net; attachment positions are a disclosed adaptation."""
    T,L,R = g['text'],g['line'],g['rect']
    pale = g['PALE']
    # The written source gives the strip length 22 cm, its height 4 cm,
    # and the lid width 3 cm. The inferred long side is not labelled.
    # Place both matching lids on the same lateral face: a valid net.
    s='';x=80
    for width,colour in zip([200,75,200,75],[pale,'#f4f8ff',pale,'#f4f8ff']):
        s+=R(x,175,width,100,colour);x+=width
    s+=R(80,100,200,75,'#d6f2e7')+R(80,275,200,75,'#d6f2e7')
    s+=L(310,100,310,175)+L(303,100,317,100)+L(303,175,317,175)+T(365,145,'3 см',25)
    s+=L(650,175,650,275)+L(643,175,657,175)+L(643,275,657,275)+T(689,233,'4 см',23)
    s+=L(80,390,630,390)+L(80,382,80,398)+L(630,382,630,398)+T(355,429,'22 см',26)
    return {'course-5/9.1-L2-10.png':(465,s)}

def extend_figures(g):
    F=g['fig'];T=g['text'];L=g['line'];R=g['rect'];C=g['circle'];P=g['poly'];B=g['bracket'];blue=g['BLUE'];pale=g['PALE'];ink=g['INK']
    F.update(build_missing_grade5_figures(g))
    F.update(build_missing_grade5_higher46_figures(g))
    F.update(build_missing_grade5_higher47_figures(g))
    def put(name,height,body):F['course-4/'+name+'.png']=(height,body)
    # Keep the original long-division setup, without an empty raster worksheet.
    put('2.2-T-03',190,T(300,80,'72 036',36)+T(490,80,'6',36)+L(440,35,440,155)+L(440,100,625,100))
    put('5.4-L3-01',190,T(300,80,'5 470',36)+T(490,80,'60',36)+L(440,35,440,155)+L(440,100,625,100))
    put('5.6-L3-01',190,T(240,80,'3',36)+R(271,40,43,50,'#ffdf85')+T(342,80,'8',36)+T(392,80,'6',36)+T(490,80,'58',36)+L(440,35,440,155)+L(440,100,625,100))
    # Compact division setups preserve the unknown quotient and highlighted
    # missing digits, while removing rows of unused exercise-book grid.
    def compact_division(name,dividend,divisor,dots=False):
        body=L(440,35,440,155)+L(440,100,625,100)+T(525,80,divisor,36)
        for i,digit in enumerate(dividend):
            x=406-(len(dividend)-1-i)*38
            body+=R(x-16,42,32,44,'#ffdf85') if digit=='□' else T(x,80,digit,36)
        if dots:body+=C(480,130,5,'#2563eb')+C(520,130,5,'#2563eb')
        put(name,190,body)
    for name,dividend,divisor in [('5.11-T-01','97440','232'),('5.10-T-03','179280','415'),('5.4-T-01','38400','60'),('5.4-T-09','6370','80'),('5.6-T-01','4473','63'),('5.6-T-09','3□72','47'),('5.8-T-01','8815','43')]:compact_division(name,dividend,divisor)
    compact_division('5.7-T-01','734','29',True)
    # The source image returns 404. Reconstruct the two packing rules from
    # the complete statement, leaving the requested leftover count unknown.
    packing=T(105,35,'2 640 бөтелке',23)+R(85,90,42,78,'#9de0cb')+R(94,66,24,24,pale)+L(85,115,127,115)+T(210,145,'→',38)
    packing+=R(275,75,155,115,pale)
    for row in range(2):
        for col in range(5):
            x=286+col*28;y=90+row*44;packing+=R(x,y+8,20,30,'#9de0cb')+R(x+5,y,10,8,blue)
    packing+=T(352,225,'10 бөтелке',23)+T(465,145,'→',38)+R(510,60,170,145,'#ffdf85')
    for row in range(2):
        for col in range(5):packing+=R(521+col*30,78+row*55,26,42,pale)
    packing+=T(595,240,'10 қорап',23)
    put('2.5-L3-10',265,packing)
    digital='<rect x="140" y="40" width="440" height="160" rx="24" fill="#0f172a" stroke="#334155" stroke-width="5"/>'
    digital+=T(360,148,'07:45',72).replace(ink,'#43d780').replace('<text ','<text font-family="DejaVu Sans Mono, monospace" ')
    F['course-5/1.1-T-08.png']=(240,digital)
    # Two groups from the source: 6 notebooks + 4 pens, then 4 notebooks +
    # 6 pens. Keep the shared 3,000-tenge bracket and every object count.
    s=''
    for row,(books,pens) in enumerate([(6,4),(4,6)]):
        y=45+row*140
        for i in range(books):
            x=60+i*50
            s+=R(x,y,40,82,blue)+R(x+10,y+12,24,18)+L(x+6,y,x+6,y+82)
        for i in range(pens):
            x=60+books*50+i*34
            s+=R(x,y+18,11,55,'#f8bc22')+R(x-2,y,15,23,ink)+P(f'{x},{y+73} {x+11},{y+73} {x+5.5},{y+86}','#94a3b8')
    s+=L(590,36,602,36)+L(602,36,602,274)+L(590,274,602,274)+L(602,155,617,155)+T(660,163,'3000 тг',20)
    F['course-5/1.9-L3-12.png']=(315,s)
    s=''
    for row,(count,start) in enumerate([(6,125),(6,169),(5,125)]):
        for i in range(count):
            x,y=start+i*88,55+row*82
            s+=C(x,y,32,'#f7a81b')+f'<circle cx="{x-8}" cy="{y-8}" r="9" fill="#ffdf85"/>'
    F['course-5/3.4-L2-15.png']=(275,s)
    # The source labels the lower blue part 1/3 but draws it too wide.
    # Construct equal wholes with exact halves/thirds; the missing yellow
    # part remains unknown and ends at the same halfway guide.
    def fraction_label(x,y,n,d):
        return T(x,y-9,n,23)+L(x-11,y,x+11,y,w=1)+T(x,y+26,d,23)
    s=R(60,40,300,70,blue)+R(360,40,300,70)
    s+=R(60,150,200,70,blue)+R(260,150,100,70,'#ffcf43')+R(360,150,300,70)
    s+=fraction_label(210,70,1,2)+fraction_label(160,180,1,3)+T(310,194,'?',30)
    s+=f'<path d="M360 110V150M360 220V240" stroke="{ink}" stroke-width="2" stroke-dasharray="7 6" fill="none"/>'
    F['course-5/3.8-T-03.png']=(260,s)
    s=R(60,65,300,80,blue)+R(360,65,200,80,'#ffcf43')+R(560,65,100,80)
    s+=fraction_label(210,101,1,2)+fraction_label(460,101,1,3)+T(610,116,'?',30)
    F['course-5/3.10-L2-12.png']=(200,s)
    # Missing source raster. The full solution explicitly records
    # *,4* × 7 = 2*,*9; preserve all four hidden digits and decimal places.
    s=R(320,35,60,60,'#ffdf85')+T(350,80,'∗',40)+T(390,80,',',40)+T(430,80,'4',40)
    s+=R(480,35,60,60,'#ffdf85')+T(510,80,'∗',40)+T(250,155,'×',40)+T(510,155,'7',40)+L(230,180,550,180)
    s+=T(270,240,'2',40)+R(320,195,60,60,'#ffdf85')+T(350,240,'∗',40)+T(390,240,',',40)
    s+=R(400,195,60,60,'#ffdf85')+T(430,240,'∗',40)+T(510,240,'9',40)
    F['course-5/4.5-L3-01.png']=(285,s)
    # The original arrow showed only "100". The complete solution specifies
    # multiplication by 100, followed by division by 1000.
    s=R(20,80,160,80,pale)+T(100,132,'3,6',36)+R(285,80,150,80)+R(540,80,160,80,'#ffdf85')+T(620,132,'?',36)
    s+=L(188,120,270,120)+P('270,114 280,120 270,126',ink)+T(232,62,'× 100',24)
    s+=L(443,120,525,120)+P('525,114 535,120 525,126',ink)+T(490,62,'÷ 1000',24)
    F['course-5/4.9-L2-01.png']=(210,s)
    # The raster could not be downloaded. The official solution explicitly
    # enumerates every element: A-only 12,18,30; intersection 6,24;
    # B-only 4,8,20; outside both 5,9. No sums or answer are revealed here.
    s=f'<circle cx="275" cy="190" r="150" fill="{pale}"/><circle cx="445" cy="190" r="150" fill="#dcfce7" fill-opacity="0.65"/>'
    s+=C(275,190,150,'none')+C(445,190,150,'none')+T(220,80,'A',30)+T(500,80,'B',30)
    for value,x,y in [(12,205,155),(18,195,240),(30,270,280),(6,360,155),(24,360,245),(4,515,155),(8,525,240),(20,450,280),(5,90,350),(9,630,85)]:
        s+=T(x,y+9,value,29)
    F['course-5/5.1-L3-08.png']=(390,s)
    def cards(values,y=75,labels=None):
        w=min(95,600/len(values));x=(720-len(values)*w)/2;s=''
        for i,v in enumerate(values):
            s+=R(x+i*w,y,w,85,[blue,'#ffdf85','#9de0cb',pale][i%4])+T(x+(i+.5)*w,y+52,v,29)
            if labels:s+=T(x+(i+.5)*w,y-15,labels[i],16)
        return s
    def strip(total,values):
        w=600/len(values);return B(60,660,50,total)+''.join(R(60+i*w,90,w,65,[blue,'#ffdf85','#9de0cb'][i%3])+T(60+(i+.5)*w,132,v) for i,v in enumerate(values))
    def notes(values):
        n=len(values);w=min(170,600/n);x=(720-n*w)/2
        return ''.join(R(x+i*w,65,w-14,90,[blue,'#ffdf85','#9de0cb',pale][i%4])+T(x+(i+.5)*w-7,121,v,24) for i,v in enumerate(values))
    def clock(hour=0,minute=0,quarter=False):
        x,y,r=360,175,135;s=C(x,y,r)
        if quarter:s+=f'<path d="M360 175L360 40A135 135 0 0 1 495 175Z" fill="{blue}"/>'
        for i in range(60):
            a=i*math.pi/30-math.pi/2;rr=r-(14 if i%5==0 else 6)
            s+=L(x+rr*math.cos(a),y+rr*math.sin(a),x+r*math.cos(a),y+r*math.sin(a))
        for i in range(1,13):
            a=i*math.pi/6-math.pi/2;s+=T(x+105*math.cos(a),y+105*math.sin(a)+7,i,19)
        for angle,length in [(minute*math.pi/30,120),((hour+minute/60)*math.pi/6,82)]:s+=L(x,y,x+length*math.sin(angle),y-length*math.cos(angle),w=5)
        return s+C(x,y,5,ink)
    put('1.2-L1-03',360,''.join(L(110+i*100,45,110+i*100,275)+T(110+i*100,320,label,18)+''.join(f'<ellipse cx="{110+i*100}" cy="{260-j*21}" rx="30" ry="9" fill="{blue}" stroke="{ink}"/>' for j in range(n)) for i,(n,label) in enumerate(zip([5,3,0,4,0,9],['100 000','10 000','1 000','100','10','1'])))+L(70,280,650,280))
    put('1.2-L1-09',235,cards(['9','9','9','9','9','9'],55)+T(360,195,'+ 1 → ?'))
    put('1.2-L1-15',330,cards(['4','9','1','6'],35)+T(360,162,'↓',32)+''.join(R(170+i*95,200,95,75) for i in range(4)))
    put('1.3-L1-05',235,cards(['4','6','5','2'],75,['1 000','100','10','1'])+L(360,40,360,190,'#e84a4a',5)+L(286,145,334,145,w=4))
    put('1.3-L1-06',225,cards(['4','8','7','2','5'],70,['10 000','1 000','100','10','1']))
    put('1.3-L1-08',235,cards(['0','4','5','9','9','9'],45)+T(360,195,'+ 1 → ?'))
    put('1.3-L1-16',235,cards(['3','5','8','4','9','1','2'],80,['1 000 000','100 000','10 000','1 000','100','10','1']))
    put('1.4-L1-02',260,notes(['10 000']*5)+T(360,193,'+')+''.join(R(200+i*160,205,150,40,'#ffdf85')+T(275+i*160,234,'10 000',20) for i in range(2)))
    rows=[['','2','5','0','0','0','0'],['3','0','0','0','0','0','0'],['','','4','0','0','0','0']]
    s=''.join(T(120+i*80,36,v,14) for i,v in enumerate(['1 000 000','100 000','10 000','1 000','100','10','1']))
    for j,row in enumerate(rows):
        for i,v in enumerate(row):s+=R(80+i*80,55+j*55,80,55,[blue,'#ffdf85',pale][i//3])+T(120+i*80,91+j*55,v,24)
        if j:s+=T(55,91+j*55,'+',25)
    s+=L(70,228,650,228)+R(80,240,560,45)+T(360,272,'?')
    put('1.4-L1-06',315,s)
    put('1.4-L1-13',210,notes(['110 011','220 022','330 033','?']))
    put('1.4-L1-14',205,strip('?',['34 250','35 600']))
    def vertical(a,b,op):
        a,b=str(a),str(b);n=max(len(a),len(b));s=''
        for row in range(3):
            for col in range(n):s+=R(120+col*85,35+row*70,85,70)
        for row,value in enumerate([a.rjust(n),b.rjust(n)]):
            for col,v in enumerate(value):s+=T(162+col*85,84+row*70,v,32)
        return s+T(85,150,op,32)+L(110,176,130+n*85,176,w=4)
    put('5.9-L2-10',285,vertical(2708,309,'×'))
    put('1.5-L1-03',285,vertical(63208,4795,'−'))
    put('1.5-L1-11',205,strip('38 450',['12 675','?']))
    put('1.5-L1-15',205,strip('5 т 300 кг',['2 т 480 кг','?']))
    s=''
    for x in [135,445]:s+=f'<rect x="{x}" y="55" width="145" height="65" rx="32" fill="{pale}" stroke="{ink}" stroke-width="3"/>'+L(x+72,55,x+72,120)+T(x+72,170,'500 мг')
    put('1.6-L1-11',210,s)
    put('1.6-L1-14',205,strip('1 т',['250 кг','?']))
    put('1.6-L1-16',205,strip('?',['2 ц 45 кг','4 ц 38 кг']))
    put('1.7-L1-01',320,g['cuboid'](6,2,3,'см'))
    put('1.7-L1-05',320,g['cuboid'](7,4,2,'см'))
    def area(a,b,inside=''):
        w=220 if a==b else 370;x=(720-w)/2
        return R(x,50,w,220,blue)+T(360,160,inside)+T(360,310,a)+T(x-65,165,b)
    put('1.8-L1-09',345,area('10 м','10 м'))
    put('1.8-L1-14',345,area('50 м','30 м'))
    put('1.9-L1-11',350,clock(7,0))
    put('1.9-L1-12',345,area('15 м','?','120 м²'))
    s=R(100,35,360,290,pale)
    for row in range(5):
        for col in range(4):x,y=145+90*col,70+53*row;s+=C(x,y,17)+L(x-10,y,x+10,y)
    s+=T(510,180,'→',35)+C(600,165,27)+L(580,165,620,165)+T(600,230,'250 мг')
    put('1.9-L1-14',355,s)
    put('1.10-L1-01',350,clock(3,0,True))
    put('1.10-L1-16',190,''.join(R(60+i*50,70,50,65,pale)+T(85+i*50,112,i+1,22) for i in range(12)))
    put('1.11-L1-01',210,C(170,105,70,pale)+C(170,105,54,'#ffdf85')+T(170,115,'2 €',29)+T(360,115,'→',40)+C(535,105,60,'#ffdf85')+T(535,115,'50 c',27)+T(655,115,'× ?'))
    put('1.11-L1-08',300,notes(['20 €','10 €','5 €'])+C(285,230,43,'#ffdf85')+T(285,238,'2 €')+C(435,230,36,'#ffdf85')+T(435,238,'50 c'))
    put('1.11-L1-09',290,notes(['10 $']*3)+''.join(R(65+i*150,205,140,55,'#9de0cb')+T(135+i*150,241,'5 $') for i in range(4)))
    put('1.11-L1-15',220,R(100,50,90,120,blue)+R(120,70,50,25)+T(290,110,'37 €')+T(390,110,'←',35)+R(475,65,165,85,'#ffdf85')+T(557,120,'50 €',30))
    put('1.12-L1-08',220,R(60,55,180,105,'#c6b8f5')+T(150,119,'500 руб.')+T(320,119,'→',35)+R(390,45,85,130,blue)+T(585,118,'320 руб.',22))
    put('1.12-L1-12',220,R(80,55,200,105,'#9de0cb')+T(180,119,'200 руб.')+R(430,45,90,130,'#9de0cb')+T(608,118,'35 руб.',22))
    put('2.1-L1-01',330,T(360,35,'2 123 · 3')+notes(['2 000','100','20','3'])+''.join(T(135+i*150,205,'× 3 ↓',23)+R(65+i*150,235,140,55)+T(135+i*150,272,'?') for i in range(4)))
    put('2.1-L1-12',245,notes(['2 120 ₸']*3)+T(360,215,'3 дәптер'))
    put('2.1-L1-16',210,notes(['2 132 ₸']*4))
    put('2.2-L1-02',285,vertical(7001,5,'×'))
    s=''.join(R(70+i*45,40+j*35,45,35) for i in range(13) for j in range(7))
    for i,v in enumerate('96348'):s+=T(92+i*45,67,v,22)
    s+=L(295,40,295,282,w=3)+L(295,75,655,75,w=3)+T(317,67,'4')
    put('2.2-L1-04',320,s)
    put('2.2-L1-13',205,strip('2 456',['?','','','','','','','']))
    put('2.3-L1-04',320,cards(['12','35','48','51','70'],40)+cards(['93','104','226','307'],185))
    put('2.3-L1-10',210,cards(['7','3','8','*']))
    put('2.3-L1-15',310,cards(['5','3','8'],35)+''.join(R(217+i*95,195,95,75) for i in range(3)))
    put('1.12-L1-04',230,notes(['550 руб.','345 руб.','360 руб.'])+''.join(T(190+i*170,195,v,20) for i,v in enumerate(['Матрешка','Қуыршақ','Ойыншық'])))
    put('1.4-L1-15',210,''.join(R(70+i*240,95,125,65,pale)+T(132+i*240,137,v) for i,v in enumerate(['5 300','?','?']))+T(250,80,'− 100')+T(490,80,'+ 1')+T(250,137,'→',35)+T(490,137,'→',35))
    put('5.3-L1-01',285,vertical(2340,30,'×'))
    s=''.join(R(90+i*60,55+j*55,60,55) for i in range(8) for j in range(3))
    for i,v in enumerate('28745'):s+=T(120+i*60,92,v,29)
    s+=L(270,55,270,220,w=4)+L(270,110,570,110,w=4)
    put('5.7-L1-01',260,s)
    # Native labels avoid palette quantization of small blue distance values.
    s=L(60,110,660,110,'#94a3b8',6)+L(60,110,510,110,'#2563eb',6)
    for i in range(1,5):s+=L(60+i*112.5,100,60+i*112.5,120)
    for i in range(4):s+=T(116.25+i*112.5,72,'6 км',25).replace(ink,'#2563eb')
    s+=T(585,72,'8 км',25)+C(60,110,7,ink)+C(660,110,7,'#f7a5ad')
    s+=L(60,166,660,166)+L(60,153,60,179)+L(660,153,660,179)+T(360,210,'x км',25)
    put('6.6-L1-04',235,s)
    s=L(70,170,250,70,w=4)+L(250,70,410,150,w=4)+L(410,150,650,70,w=4)
    for x,y in [(70,170),(250,70),(410,150),(650,70)]:s+=C(x,y,6,'#f7a5ad')
    s+=T(137,95,'7 см')+T(345,85,'5 см')+T(535,95,'8 см')+T(360,235,'1 см — 4 км')
    put('1.1-L3-07',275,s)
    s=''
    for i in range(6):
        x=85+i*94;s+=R(x,40,68,110,blue)+R(x+10,52,48,27)+L(x+8,40,x+8,150)+T(x+34,190,'150 ₸',18)
    F['course-5/1.8-L1-12.png']=(235,s)
    s=''
    for start,values in [(40,['5','□','3','6','1','8']),(410,['5','7','3','9','0','0'])]:
        for i,value in enumerate(values):s+=R(start+i*45,65,45,65,pale if value=='□' else 'white')+T(start+22.5+i*45,108,value,29)
    put('1.2-L2-05',185,s+T(360,108,'>',34))
    F['course-6/2.2-L1-03.png']=(200,g['axis'](-5,4,[('M',-3),('N',2),('O',0)]))
    # One known segment plus an unpartitioned remainder avoids misleading cuts.
    s=B(60,660,45,'8 м')+R(60,80,50,60,blue)+R(110,80,550,60)+T(385,119,'…',32)
    s+=T(85,174,'2',23)+L(74,182,96,182)+T(85,207,'3',23)+T(120,194,'м',23)
    F['course-5/3.13-L1-12.png']=(245,s)
    s=''
    for i,value in enumerate(['4 449','?','?','?']):
        x=60+i*180;s+=R(x,90,110,65,'#ffdf85' if i==0 else 'white')+T(x+55,133,value,28)
    for i,label in enumerate(['≈ 10','≈ 100','≈ 1 000']):
        x=180+i*180;s+=L(x,122,x+48,122,w=3)+P(f'{x+48},122 {x+39},117 {x+39},127',ink)+T(x+25,75,label,21)
    put('1.3-L3-07',210,s)
    # Both source files return 404; all geometry is explicitly stated in the
    # displayed solutions (vertical 47-degree angles and M(-2; 3) on y=kx).
    # Keep the entire drawing in its viewBox by using rays of fixed length.
    dx,dy=190*math.cos(math.radians(47)),190*math.sin(math.radians(47))
    s=L(90,200,630,200)+L(360-dx,200+dy,360+dx,200-dy)
    for a in [0,180]:
        p=math.radians(a);q=math.radians(a+47);x,y=360+65*math.cos(p),200-65*math.sin(p);X,Y=360+65*math.cos(q),200-65*math.sin(q)
        s+=f'<path d="M{x} {y} A65 65 0 0 0 {X} {Y}" fill="none" stroke="{blue}" stroke-width="3"/>'
    s+=T(458,161,'47°',26)+T(264,251,'?',28)+C(360,200,4,ink)+T(365,229,'O',21)+T(646,202,'a',23)+T(360+dx+15,190-dy,'b',23)
    F['course-6/6.1-L1-03.png']=(385,s)
    s='';origin=(360,215);scale=45
    for n in range(-4,5):
        x=360+n*scale;y=215-n*scale;s+=L(x,35,x,395,'#dbe4ef',1)+L(180,y,540,y,'#dbe4ef',1)
        if n:s+=T(x,238,n,16)+T(340,y+5,n,16)
    s+=L(165,215,560,215)+P('560,215 550,210 550,220',ink)+L(360,410,360,20)+P('360,20 355,30 365,30',ink)+T(580,220,'x',22)+T(346,238,'0',16)+T(382,24,'y',22)
    s+=L(240,35,480,395,blue,3)+C(270,80,5,'#e84c4c')+T(251,66,'M',24)
    F['course-6/9.5-L1-16.png']=(460,s)
