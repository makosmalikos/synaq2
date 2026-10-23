import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {verifyEdition} from '../scripts/editorial/geometry-models.mjs';

const read=file=>JSON.parse(fs.readFileSync(new URL('../'+file,import.meta.url),'utf8'));
const editions=read('problems/editorial/synaq-standard-geometry.json').editions;
const svg=row=>fs.readFileSync(new URL('../frontend/public'+row.image,import.meta.url),'utf8');
const attrs=tag=>Object.fromEntries([...tag.matchAll(/([\w:-]+)="([^"]*)"/g)].map(m=>[m[1],m[2]]));
const tags=(content,name)=>[...content.matchAll(new RegExp(`<${name}\\b[^>]*>`,'g'))].map(m=>attrs(m[0]));
const elements=(row,name,role)=>tags(svg(row),name).filter(a=>a['data-role']===role);
const row=model=>editions.find(r=>r.modelId===model);
const assertGiven=(edition,key,value)=>{
  const label=tags(svg(edition),'text').find(a=>a['data-given']===key);
  assert.ok(label,edition.editionId+' missing given '+key);
  assert.equal(label['data-value'],String(value));
};

test('ten new editorial editions have separate models, verified source references and no reused source art',()=>{
  assert.equal(editions.length,10);
  assert.equal(new Set(editions.map(r=>r.editionId)).size,10);
  assert.equal(new Set(editions.map(r=>r.modelId)).size,10);
  const files=new Map();
  for(const edition of editions){
    assert.ok([4,5,6].includes(edition.grade));
    assert.equal(edition.editorialStatus,'verified');assert.equal(edition.minimumPlan,'pro');
    const verified=verifyEdition(edition);assert.equal(verified.answer,edition.answer);assert.ok(verified.checks.length>=4);
    assert.ok(edition.adaptationChanges.length>=3);
    for(const ref of edition.sourceRefs){
      if(!files.has(ref.sourceFile))files.set(ref.sourceFile,read(ref.sourceFile));
      const source=files.get(ref.sourceFile).questions.find(q=>q.id===ref.sourceId);
      assert.ok(source,edition.editionId+' source exists');
      assert.notEqual(edition.statement,source.statement.replaceAll('$',''));
      assert.notEqual(edition.solution,source.solution.replaceAll('$',''));
      assert.ok(!source.images.some(im=>im.src===edition.image));
    }
    assert.match(edition.image,/^\/figures\/synaq-editions\/geometry-[a-z-]+\.svg$/);
    const content=svg(edition);
    assert.equal(crypto.createHash('sha256').update(content).digest('hex'),edition.figureSha256);
    assert.match(content,/<svg[^>]+viewBox="0 0 720 \d+"/);
    assert.match(content,/role="img"/);assert.match(content,/<title id="title">/);assert.match(content,/<desc id="desc">/);
    assert.doesNotMatch(content.replace('http://www.w3.org/2000/svg',''),/<image\b|<script\b|<foreignObject\b|(?:href|onload|onclick)=|data:image|https?:\/\//i);
    assert.ok(Buffer.byteLength(content)<16000,edition.editionId+' lightweight native SVG');
    assert.doesNotMatch(edition.statement+edition.solution,/\$|\\frac|\[Image:|\[SVG/);
  }
});

test('independent target calculations agree with all ten authored answers',()=>{
  const l=row('l-shape-area');assert.equal(Number(l.answer),l.params.width*l.params.height-l.params.cutWidth*l.params.cutHeight);
  const tile=row('tile-boundary'),p=tile.params;
  let shared=0;for(let a=0;a<p.cells.length;a++)for(let b=a+1;b<p.cells.length;b++)
    if(Math.abs(p.cells[a][0]-p.cells[b][0])+Math.abs(p.cells[a][1]-p.cells[b][1])===1)shared++;
  assert.equal(Number(tile.answer),(4*p.cells.length-2*shared)*p.sideCm);
  const volume=row('cuboid-missing-height');assert.equal(Number(volume.answer),volume.params.volumeCm3/(volume.params.lengthCm*volume.params.widthCm));
  const angle=row('straight-angle-gap');assert.equal(Number(angle.answer),180-angle.params.leftDeg-angle.params.rightDeg);
  const shade=row('shaded-grid-percent');assert.equal(Number(shade.answer),100*shade.params.shaded.length/(shade.params.rows*shade.params.columns));
  const chart=row('bar-chart-total');assert.equal(Number(chart.answer),chart.params.values.reduce((a,b)=>a+b,0));
  const walk=row('coordinate-walk-distance');assert.equal(Number(walk.answer),Math.abs(walk.params.end-walk.params.start)*walk.params.metresPerUnit);
  const route=row('scaled-route-distance');assert.equal(Number(route.answer),route.params.segmentsMm.reduce((s,v)=>s+v/10,0)*route.params.denominator/100000);
  const surface=row('closed-box-surface'),{lengthCm:a,widthCm:b,heightCm:c}=surface.params;
  assert.equal(Number(surface.answer),2*(a*b+b*c+a*c));
  const rectangles=row('grid-rectangle-count'),{rows:r,columns:cols}=rectangles.params;
  assert.equal(Number(rectangles.answer),r*(r+1)/2*cols*(cols+1)/2);
});

test('SVG floor geometry, tile placement and shared edges match the actual givens',()=>{
  const edition=row('l-shape-area'),p=edition.params;
  const shape=elements(edition,'polygon','l-floor')[0];assert.ok(shape);
  const points=shape.points.split(' ').map(v=>v.split(',').map(Number)),scale=Number(shape['data-unit-scale']);
  const xs=points.map(v=>v[0]),ys=points.map(v=>v[1]);
  assert.equal((Math.max(...xs)-Math.min(...xs))/scale,p.width);
  assert.equal((Math.max(...ys)-Math.min(...ys))/scale,p.height);
  assert.equal((points[3][0]-points[2][0])/scale,p.cutWidth);
  assert.equal((points[2][1]-points[1][1])/scale,p.cutHeight);
  for(const key of ['width','height','cutWidth','cutHeight'])assertGiven(edition,key,p[key]);
  const tile=row('tile-boundary'),tiles=elements(tile,'rect','tile');assert.equal(tiles.length,tile.params.cells.length);
  assert.deepEqual(tiles.map(t=>t['data-cell']),tile.params.cells.map(c=>c.join(',')));
  const minX=Math.min(...tiles.map(t=>Number(t.x))),minY=Math.min(...tiles.map(t=>Number(t.y))),side=Number(tiles[0].width);
  for(let i=0;i<tiles.length;i++){
    assert.equal(Number(tiles[i].height),side);assert.equal(Number(tiles[i].width),side);
    assert.deepEqual([(Number(tiles[i].x)-minX)/side,(Number(tiles[i].y)-minY)/side],tile.params.cells[i]);
  }
  assertGiven(tile,'sideCm',tile.params.sideCm);
});

test('cuboid, straight-angle and shaded-grid SVG labels/quantities retain their parameters',()=>{
  const volume=row('cuboid-missing-height');for(const key of ['lengthCm','widthCm','volumeCm3'])assertGiven(volume,key,volume.params[key]);
  assert.match(svg(volume),/>h = \?<\/text>/);assert.doesNotMatch(svg(volume),/>6 см<\/text>/);
  const surface=row('closed-box-surface');for(const key of ['lengthCm','widthCm','heightCm'])assertGiven(surface,key,surface.params[key]);
  const angle=row('straight-angle-gap'),rays=tags(svg(angle),'line').filter(t=>t['data-ray']);
  const degrees=t=>Math.atan2(Number(t.y1)-Number(t.y2),Number(t.x2)-Number(t.x1))*180/Math.PI;
  assert.ok(Math.abs(degrees(rays.find(t=>t['data-ray']==='C'))-(180-angle.params.leftDeg))<1e-9);
  assert.ok(Math.abs(degrees(rays.find(t=>t['data-ray']==='D'))-angle.params.rightDeg)<1e-9);
  assertGiven(angle,'leftDeg',angle.params.leftDeg);assertGiven(angle,'rightDeg',angle.params.rightDeg);
  assert.match(svg(angle),/>x°<\/text>/);assert.ok(!svg(angle).includes('>'+angle.answer+'°</text>'));
  const shade=row('shaded-grid-percent'),cells=elements(shade,'rect','grid-cell');
  assert.equal(cells.length,shade.params.rows*shade.params.columns);
  assert.deepEqual(cells.filter(c=>c['data-shaded']==='true').map(c=>c['data-cell']),shade.params.shaded.map(c=>c.join(',')));
  for(const cell of cells)assert.equal(cell.width,cell.height);
  assertGiven(shade,'rows',shade.params.rows);assertGiven(shade,'columns',shade.params.columns);
});

test('chart heights, coordinate intervals, route lengths and grid boundaries match their labels',()=>{
  const chart=row('bar-chart-total'),bars=elements(chart,'rect','bar');assert.equal(bars.length,4);
  bars.forEach((bar,i)=>{assert.equal(Number(bar.height)/Number(bar['data-scale']),chart.params.values[i]);assert.equal(Number(bar['data-value']),chart.params.values[i]);assertGiven(chart,'values.'+i,chart.params.values[i]);});
  chart.params.shortLabels.forEach(label=>assert.ok(svg(chart).includes('>'+label+'</text>')));
  const walk=row('coordinate-walk-distance'),ticks=tags(svg(walk),'line').filter(t=>t['data-coordinate']);
  assert.deepEqual(ticks.map(t=>Number(t['data-coordinate'])),Array.from({length:walk.params.end-walk.params.start+1},(_,i)=>walk.params.start+i));
  assert.equal(new Set(ticks.slice(1).map((t,i)=>Number(t.x1)-Number(ticks[i].x1))).size,1);
  for(const key of ['start','end','metresPerUnit'])assertGiven(walk,key,walk.params[key]);
  const route=row('scaled-route-distance'),legs=elements(route,'line','route-leg');assert.equal(legs.length,3);
  legs.forEach((leg,i)=>{assert.equal(Math.hypot(Number(leg.x2)-Number(leg.x1),Number(leg.y2)-Number(leg.y1))/10,route.params.segmentsMm[i]);assertGiven(route,'segmentsMm.'+i,route.params.segmentsMm[i]);});
  assertGiven(route,'denominator',route.params.denominator);
  const rectangles=row('grid-rectangle-count'),vertical=elements(rectangles,'line','vertical-grid-line'),horizontal=elements(rectangles,'line','horizontal-grid-line');
  assert.equal(vertical.length,rectangles.params.columns+1);assert.equal(horizontal.length,rectangles.params.rows+1);
  assertGiven(rectangles,'rows',rectangles.params.rows);assertGiven(rectangles,'columns',rectangles.params.columns);
});

test('verifier rejects wrong answers and silently changed mathematical givens',()=>{
  for(const edition of editions){
    assert.throws(()=>verifyEdition({...edition,answer:String(Number(edition.answer)+1)}),edition.editionId);
    const changed=structuredClone(edition),key=Object.keys(changed.params).find(k=>Number.isInteger(changed.params[k]));
    if(key){changed.params[key]++;assert.throws(()=>verifyEdition(changed),edition.editionId+' changed '+key);}
    else {changed.params.values[0]++;assert.throws(()=>verifyEdition(changed),edition.editionId+' changed bar');}
  }
});
