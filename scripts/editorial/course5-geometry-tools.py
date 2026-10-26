"""Exact offline geometry for editorial review; does not read authored answer specs."""
import itertools

def norm(cells):
 x0=min(x for x,y in cells);y0=min(y for x,y in cells);return tuple(sorted((x-x0,y-y0)for x,y in cells))
def orientations(cells,reflect=True):
 return sorted({norm([(sx*x,sy*y)if not swap else(sy*y,sx*x)for x,y in cells])for sx in[-1,1]for sy in[-1,1]for swap in[0,1]}if reflect else{norm([(x,y)for x,y in cells]),norm([(-y,x)for x,y in cells]),norm([(-x,-y)for x,y in cells]),norm([(y,-x)for x,y in cells])})
def canonical(cells):return min(orientations(cells))
def neg(v):return tuple(-x for x in v)
def fold(cells):
 cells=set(map(tuple,cells));assert len(cells)==6;first=min(cells);frames={first:((1,0,0),(0,1,0),(0,0,1))};todo=[first]
 while todo:
  x,y=todo.pop();r,d,n=frames[x,y]
  for p,f in[((x+1,y),(neg(n),d,r)),((x-1,y),(n,d,neg(r))),((x,y+1),(r,neg(n),d)),((x,y-1),(r,n,neg(d)))]:
   if p not in cells:continue
   if p in frames:assert frames[p]==f
   else:frames[p]=f;todo.append(p)
 assert len(frames)==6 and len({f[2]for f in frames.values()})==6;return frames
def valid(cells):
 try:fold(cells);return True
 except AssertionError:return False
def vertex(cells,p):
 frames=fold(cells);out=set()
 for(x,y),(r,d,n)in frames.items():
  u,v=p[0]-x,p[1]-y
  if u in[0,1]and v in[0,1]:out.add(tuple(n[j]+(2*u-1)*r[j]+(2*v-1)*d[j]for j in range(3)))
 assert len(out)==1;return next(iter(out))
def boundary(cells):
 c=set(map(tuple,cells));return[(p,(p[0]+dx,p[1]+dy))for p in sorted(c)for dx,dy in[(0,1),(0,-1),(1,0),(-1,0)]if(p[0]+dx,p[1]+dy)not in c]
def tile(target,pieces,reflect=True):
 target=set(map(tuple,target));forms=[orientations(p,reflect)for p in pieces];placements=[]
 for variants in forms:
  allp=set()
  for shape in variants:
   for tx,ty in target:
    for sx,sy in shape:
     moved=frozenset((x+tx-sx,y+ty-sy)for x,y in shape)
     if moved<=target:allp.add(moved)
  placements.append(sorted(allp,key=lambda p:sorted(p)))
 seen=set()
 def search(left,remaining):
  if not remaining:return[]if not left else None
  key=(frozenset(left),tuple(remaining))
  if key in seen:return None
  point=min(left);usedforms=set()
  for k in remaining:
   fk=tuple(forms[k])
   if fk in usedforms:continue
   usedforms.add(fk)
   for p in placements[k]:
    if point in p and p<=left:
     rest=search(left-p,[j for j in remaining if j!=k])
     if rest is not None:return[(k,sorted(p)),*rest]
  seen.add(key);return None
 return search(target,list(range(len(pieces))))
def hexominoes():
 s={((0,0),)}
 for _ in range(5):s={canonical([*p,(x+dx,y+dy)])for p in s for x,y in p for dx,dy in[(1,0),(-1,0),(0,1),(0,-1)]if(x+dx,y+dy)not in p}
 assert len(s)==35;return sorted(s)
