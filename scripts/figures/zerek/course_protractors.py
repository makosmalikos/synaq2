"""True SVG protractors: ray positions verified against the displayed source solutions."""
import math

def extend_protractors(g):
    F,T,L,C=g['fig'],g['text'],g['line'],g['circle'];ink=g['INK']
    def diagram(rays,rotation=0,marks=()):
        cx,cy,r=360,350 if rotation else 320,250
        def point(angle,radius):
            a=math.radians(angle);return cx+radius*math.cos(a),cy-radius*math.sin(a)
        s=f'<path d="M{cx-r} {cy} A{r} {r} 0 0 1 {cx+r} {cy} V{cy+22} H{cx-r} Z" fill="#e4efff" stroke="{ink}" stroke-width="2"/>'
        cut=118;s+=f'<path d="M{cx-cut} {cy} A{cut} {cut} 0 0 1 {cx+cut} {cy} Z" fill="white" stroke="{ink}" stroke-width="1.5"/>'
        for a in range(181):
            length=21 if a%10==0 else 14 if a%5==0 else 7
            x,y=point(a,r);X,Y=point(a,r-length);s+=L(x,y,X,Y,ink,1.4 if a%5==0 else .8)
        for label,angle in rays:
            x,y=point(angle,r+58);s+=L(cx,cy,x,y,ink,2.3)
            X,Y=point(angle,r+82);s+=T(X,Y+7,label,25)
        for a in range(0,181,10):
            for radius,value,fill in [(r-43,180-a,ink),(r-80,a,'#235aa8')]:
                x,y=point(a,radius);s+=f'<text x="{x}" y="{y}" text-anchor="middle" dominant-baseline="middle" font-size="16" fill="{fill}" stroke="#e4efff" stroke-width="2" paint-order="stroke" transform="rotate({90-a} {x} {y})">{value}</text>'
        for label,angle in marks:
            x,y=point(angle,r+18);X,Y=point(angle,r+46);s+=C(x,y,4.5,'#d83f47')+T(X,Y,label,22)
        s+=C(cx,cy,4.5,'#d83f47')+T(cx,cy+47,'O',24)
        return f'<g transform="rotate({rotation} {cx} {cy})">{s}</g>'
    # Inner scale starts at the right-hand zero; outer scale at the left.
    specs={
        '01':([('A',0),('B',50)],0,()),
        '02':([('A',180),('B',145)],0,()),
        '04':([('A',0),('B',115)],0,()),
        '05':([('A',180),('B',52)],0,()),
        '07':([('A',0),('B',23)],0,()),
        '09':([('A',0),('B',64)],-30,()),
        '10':([('A',0)],0,[('L',120),('M',50),('K',60),('N',70)]),
        '12':([('A',180),('B',40)],0,()),
        '13':([('A',0),('B',47),('C',132)],0,()),
        '16':([('A',180),('B',75)],20,()),
    }
    for number,spec in specs.items():F[f'course-5/7.2-L1-{number}.png']=(520 if spec[1] else 430,diagram(*spec))
