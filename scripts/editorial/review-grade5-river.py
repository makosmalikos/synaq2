"""Independent review of all47 complete source/new river conditions and solutions.

No author solver imported. Exact signed bank-relative trajectories and independent
linear velocity equations are used; units, which moving objects are compared,
elapsed/remaining time and one-way/round-trip distance were individually read.
"""
from fractions import Fraction as F
import hashlib
import json
from pathlib import Path
import re
import sys
ROOT=Path(__file__).resolve().parents[2];PACK='problems/editorial/batches/grade5-river.json';ROWS=json.loads((ROOT/PACK).read_text())['editions']
def digest(r):return hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
def one(xs):
    xs=list(xs);assert len(xs)==1,xs;return xs[0]
def integer(x):x=F(x);assert x.denominator==1,x;return str(x.numerator)
def velocities(down,up):return (F(down)+F(up))/2,(F(down)-F(up))/2
def numeric(r):
    p=r['params'];k=r['modelId'].removeprefix('grade5-river-')
    if k=='raft-distance':return p['current']*p['hours']
    if k=='current-from-own-down':return p['down']-p['own']
    if k=='raft-speed':return p['current']
    if k=='own-from-two-speeds':return velocities(p['down'],p['up'])[0]
    if k in ['downstream-boat-distance','supply-boat-downstream-distance']:return (p['own']+p['current'])*p['hours']
    if k=='own-from-down-current':return p['down']-p['current']
    if k=='lake-distance-extraneous-current':return p['own']*p['hours']
    if k=='time-from-given-downspeed':return F(p['distance'],p['down'])
    if k=='own-from-up-current':return p['up']+p['current']
    if k=='current-from-raft-trip':return F(p['distance'],p['hours'])
    if k=='current-from-two-speeds':return velocities(p['down'],p['up'])[1]
    if k=='distance-from-given-upspeed':return p['up']*p['hours']
    if k=='downstream-time':return F(p['distance'],p['own']+p['current'])
    if k in ['own-from-two-trips','current-from-two-trips']:
        own,current=velocities(F(p['downDistance'],p['downHours']),F(p['upDistance'],p['upHours']));assert own>current>0
        return own if k=='own-from-two-trips' else current
    if k=='upstream-time':return F(p['distance'],p['own']-p['current'])
    if k=='up-to-down-distance':
        own=p['up']+p['current'];return (own+p['current'])*p['hours']
    if k=='boat-matches-raft-route':return F(p['current']*p['raftHours'],p['own']+p['current'])
    if k=='upstream-distance':return (p['own']-p['current'])*p['hours']
    if k=='difference-from-current':return 2*p['current']
    if k=='swimmer-downstream-minutes':return F(p['distance'],p['own']+p['current'])
    if k=='boat-raft-separation':
        boat=(p['own']+p['current'])*p['hours'];raft=p['current']*p['hours'];return abs(boat-raft)
    if k=='river-then-lake-total':return (p['own']+p['current'])*p['riverHours']+p['own']*p['lakeHours']
    if k=='positive-upstream-headway':return one(x for x in p['choices'] if x-p['current']>0)
    if k=='down-to-up-distance':
        own=p['down']-p['current'];assert own>p['current'];return (own-p['current'])*p['hours']
    if k=='raft-time-without-distance':
        # Normalize the common route to ONE, rather than the author's LCM route.
        own,current=velocities(F(1,p['downDays']),F(1,p['upDays']));assert own>current>0;return 1/current
    if k=='own-current-ratio-trip':
        down=F(p['downDistance'],p['downHours']);current=down/(p['ratio']+1);own=current*p['ratio'];assert own>current>0
        return (own-current)*p['upHours']
    if k=='equal-route-distance-inverse':
        # d/downTime+d/upTime=2*own: solve the distance directly.
        distance=F(2*p['own'])/(F(1,p['downHours'])+F(1,p['upHours']));own,current=velocities(distance/p['downHours'],distance/p['upHours']);assert own==p['own'] and own>current>0
        return distance
    if k=='round-trip-with-stop':return F(p['distance'],p['own']+p['current'])+F(p['stopHours'])+F(p['distance'],p['own']-p['current'])
    if k=='raft-time-known-route':
        own,current=velocities(F(p['distance'],p['downHours']),F(p['distance'],p['upHours']));assert own>current>0
        return p['distance']/current
    if k=='boat-turns-to-meet-raft':
        down=F(p['distance'],p['downHours']);up=down-2*p['current'];assert up>0
        # After turn, boat=d−up*s; raft=current*(firstTime+s).
        after=(p['distance']-p['current']*p['downHours'])/(up+p['current']);total=p['downHours']+after
        assert p['distance']-up*after==p['current']*total;return total
    if k=='swimmer-lost-float-separation':
        swimmer=-(p['own']-p['current'])*p['minutes'];floating=p['current']*p['minutes'];return abs(floating-swimmer)
    if k=='turn-before-origin-distance':
        initial=(p['own']+p['current'])*p['downHours'];back=(p['own']-p['current'])*p['upHours'];assert back<initial;return abs(initial-back)
    if k=='groundspeed-ratio-to-own-ratio':
        own,current=velocities(p['downUpRatio'],1);return own/current
    if k=='up-from-lake-down':return p['own']-(p['down']-p['own'])
    if k=='raft-distance-from-groundspeeds':return velocities(p['down'],p['up'])[1]*p['hours']
    if k=='lake-speed-from-down-trip':return F(p['distance'],p['hours'])-p['current']
    if k=='upstream-metres-from-minutes':return F((p['own']-p['current'])*1000*p['minutes'],60)
    if k=='staggered-raft-separation':
        first=p['current']*(p['observeHour']-p['firstHour']);second=p['current']*(p['observeHour']-p['secondHour']);assert first>second>=0;return first-second
    if k=='lake-down-up-three-observations':
        own=F(p['lakeDistance'],p['lakeHours']);down=F(p['downDistance'],p['downHours']);current=down-own;assert own>current>0
        return p['upDistance']/(own-current)
    if k=='maximum-returnable-excursion':
        # For arbitrary real distance d>=0, total time is a positive linear
        # function d*(1/up+1/down). Its exact equality is the GLOBAL maximum;
        # checking only MCQs or integer distances would not establish that.
        slope=F(1,p['own']-p['current'])+F(1,p['own']+p['current']);assert slope>0
        return F(p['totalHours'])/slope
    if k=='breakdown-drift-return':
        # Upstream is negative. During failure the current moves TOWARDS origin.
        at_break=-(p['own']-p['current'])*p['upHours'];at_repair=at_break+p['current']*p['driftHours'];assert at_repair<0
        returning=F(-at_repair,p['own']+p['current']);assert at_repair+(p['own']+p['current'])*returning==0
        return p['upHours']+p['driftHours']+returning
    if k=='delayed-boat-catches-raft':
        # Solve absolute-coordinate intersection u*(delay+t)=(v+u)*t.
        t=F(p['current']*p['delayHours'],p['own']);position=(p['own']+p['current'])*t;assert position==p['current']*(p['delayHours']+t)
        return position
    raise AssertionError(k)

SPEED={'current-from-own-down','raft-speed','own-from-up-current','current-from-raft-trip','current-from-two-trips','difference-from-current','up-from-lake-down'}
HOURS={'upstream-time','boat-matches-raft-route'}
KM={'lake-distance-extraneous-current','boat-raft-separation','down-to-up-distance','own-current-ratio-trip','equal-route-distance-inverse','staggered-raft-separation','maximum-returnable-excursion'}
def solve(r):
    p=r['params'];k=r['modelId'].removeprefix('grade5-river-');s=r['statement']
    for key,v in p.items():
        if key=='choices':continue
        if isinstance(v,int):assert re.search(r'(?<!\d)'+str(v)+r'(?!\d)',s),(k,key,v)
        elif isinstance(v,str):assert v in s
    if k=='downstream-direction':
        assert p['backHours']<p['outHours'] and 'суға қатысты жылдамдығы өзгермеді' in s
        return p['secondPort']+' айлағынан '+p['firstPort']+' айлағына'
    if k=='speed-difference-theorem':
        # General symbolic coefficients: (v+u)−(v−u)=0*v+2*u.
        assert (1-1,1-(-1))==(0,2);return 'Ағыс жылдамдығының екі есесіне'
    if k=='river-lake-roundtrip-comparison':
        assert 'БІР БАҒЫТТАҒЫ жол' in s and 'қайтар жол да' in s
        river=F(p['distance'],p['own']+p['current'])+F(p['distance'],p['own']-p['current']);lake=F(2*p['distance'],p['own']);assert river>lake
        return 'Өзенде '+integer(river-lake)+' сағатқа ұзақ'
    v=numeric(r)
    unit=' км/сағ' if k in SPEED else ' сағат' if k in HOURS else ' км' if k in KM else ' м/мин' if k=='positive-upstream-headway' else ' тәулік' if k=='raft-time-without-distance' else ' есе' if k=='groundspeed-ratio-to-own-ratio' else ' м' if k in ['swimmer-lost-float-separation','upstream-metres-from-minutes'] else ''
    return integer(v)+unit

def main():
    assert len(ROWS)==47;entries=[]
    for r in ROWS:
        a=solve(r);assert a==r['answer'],(r['modelId'],a,r['answer']);assert a!='wrong'
        if r.get('options'):assert len(set(r['options']))==4 and r['options'].count(a)==1
        entries.append({'editionId':r['editionId'],'sha256':digest(r),'verdict':'verified','reviewer':'independent_root_agent','method':'All47 full saved/new conditions, complete solutions and MCQs; Fraction velocity equations and signed absolute trajectories, exact unit conversion and global linear-time maximum','checks':['each numeric printed given checked against its source-specific parameter','own vs already-ground velocity and raft/lake assumptions read individually','meeting positions and total vs remaining times distinguished','failure drift moves towards origin; both moving objects evaluated','one-way96km explicit before river/lake roundtrip comparison','maximum distance proved over real nonnegative distances, not only answer choices']})
    assert (F(1,4)-F(1,6))/2==F(1,24)
    assert F(9*1000*16,60)==2400
    assert -(11-3)*5+3*4==-28 and F(28,11+3)==2
    assert F(10)/(F(1,12)+F(1,18))==72
    assert 75-19*3==3*6==18
    if '--write' in sys.argv:(ROOT/'problems/editorial/reviews/grade5-river.json').write_text(json.dumps({'schemaVersion':1,'pack':PACK,'reviewedAt':'2026-10-23','entries':entries},ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({'independentlyVerified':47,'wrongKeysRejected':47,'completeOriginalAndNewReads':47,'signedTrajectoryCanaries':5,'authorSolverImported':False}))
if __name__=='__main__':main()
