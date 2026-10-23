// Ten separate SYNAQ editorial models. This file reads no source images and
// performs no publication. Figures are new SVG geometry drawn from the givens.
import assert from 'node:assert/strict';

const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const comma = value => String(value).replace('.', ',');
const integer = (value, name, low = 1) => assert.ok(Number.isSafeInteger(value) && value >= low, name);
const cellsKey = cell => cell.join(',');
const uniqueCells = cells => {
  assert.ok(Array.isArray(cells) && cells.length > 0);
  for (const cell of cells) {
    assert.equal(cell.length, 2); cell.forEach(v => integer(v, 'cell coordinate', 0));
  }
  const keys = new Set(cells.map(cellsKey));
  assert.equal(keys.size, cells.length, 'cells must be distinct');
  return keys;
};
const lVertices = p => [[0,0],[p.width-p.cutWidth,0],[p.width-p.cutWidth,p.cutHeight],
  [p.width,p.cutHeight],[p.width,p.height],[0,p.height]];

function calculate(row) {
  const p = row.params;
  assert.ok(p && typeof p === 'object');
  switch (row.modelId) {
    case 'l-shape-area': {
      for (const key of ['width','height','cutWidth','cutHeight']) integer(p[key], key);
      assert.ok(p.width > p.cutWidth && p.height > p.cutHeight);
      const v = lVertices(p);
      const twice = v.reduce((sum, [x,y], i) => {
        const [nx,ny] = v[(i+1)%v.length]; return sum+x*ny-y*nx;
      }, 0);
      return {answer:String(Math.abs(twice)/2), checks:['six-vertex orthogonal polygon', 'shoelace area']};
    }
    case 'tile-boundary': {
      integer(p.sideCm, 'tile side'); const keys = uniqueCells(p.cells);
      const reached = new Set([cellsKey(p.cells[0])]), queue = [p.cells[0]];
      for (const [x,y] of queue) for (const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
        const next=[x+dx,y+dy], key=cellsKey(next);
        if (keys.has(key) && !reached.has(key)) {reached.add(key);queue.push(next);}
      }
      assert.equal(reached.size, keys.size, 'tiles must form one connected shape');
      const edges = new Map();
      for (const [x,y] of p.cells) for (const [a,b] of [
        [[x,y],[x+1,y]],[[x+1,y],[x+1,y+1]],[[x,y+1],[x+1,y+1]],[[x,y],[x,y+1]],
      ]) {
        const key=[cellsKey(a),cellsKey(b)].sort().join('|'); edges.set(key,(edges.get(key)||0)+1);
      }
      const exposed=[...edges.values()].filter(count=>count===1).length;
      return {answer:String(exposed*p.sideCm),checks:['connected nonoverlapping tiles','unpaired boundary edges: '+exposed]};
    }
    case 'cuboid-missing-height': {
      for (const key of ['lengthCm','widthCm','volumeCm3']) integer(p[key],key);
      const candidates=[];
      for (let h=1;h<=p.volumeCm3;h++) if (p.lengthCm*p.widthCm*h===p.volumeCm3)candidates.push(h);
      assert.equal(candidates.length,1,'one positive integral height');
      return {answer:String(candidates[0]),checks:['positive height enumerated from volume','base dimensions retained']};
    }
    case 'straight-angle-gap': {
      integer(p.leftDeg,'left angle');integer(p.rightDeg,'right angle');
      const candidates=Array.from({length:179},(_,i)=>i+1).filter(x=>p.leftDeg+x+p.rightDeg===180);
      assert.equal(candidates.length,1);
      return {answer:String(candidates[0]),checks:['three adjacent sectors fill a straight angle','unique positive missing sector']};
    }
    case 'shaded-grid-percent': {
      integer(p.rows,'rows');integer(p.columns,'columns');uniqueCells(p.shaded);
      assert.ok(p.shaded.every(([x,y])=>x<p.columns&&y<p.rows));
      const fraction=p.shaded.length/(p.rows*p.columns);assert.ok(fraction>0&&fraction<1);
      const value=100*fraction;assert.equal(value,Math.round(value),'whole percentage');
      return {answer:String(value),checks:['equal-area cells','distinct shaded cells: '+p.shaded.length]};
    }
    case 'bar-chart-total': {
      assert.equal(p.labels.length,p.values.length);assert.equal(p.labels.length,4);
      assert.equal(p.shortLabels.length,p.values.length);assert.equal(new Set(p.shortLabels).size,4);
      p.values.forEach(v=>integer(v,'bar value'));
      let count=0;for (const bar of p.values)for(let item=0;item<bar;item++)count++;
      return {answer:String(count),checks:['four labelled bars','all individual books counted once']};
    }
    case 'coordinate-walk-distance': {
      integer(p.start,'start',-100);integer(p.end,'end',-100);integer(p.metresPerUnit,'unit length');
      assert.ok(p.start<p.end&&p.start<0&&p.end>0);
      let steps=0;for(let point=p.start;point<p.end;point++)steps++;
      return {answer:String(steps*p.metresPerUnit),checks:['unit intervals enumerated across zero','metres per unit applied']};
    }
    case 'scaled-route-distance': {
      assert.equal(p.segmentsMm.length,3);p.segmentsMm.forEach(v=>integer(v,'map segment'));
      integer(p.denominator,'scale denominator');
      const realMm=p.segmentsMm.reduce((n,v)=>n+v*p.denominator,0);
      assert.equal(realMm%1_000_000,0,'whole kilometre result');
      return {answer:String(realMm/1_000_000),checks:['three route legs, not endpoint shortcut','exact mm to kilometre conversion']};
    }
    case 'closed-box-surface': {
      for(const key of ['lengthCm','widthCm','heightCm'])integer(p[key],key);
      let faces=0;
      for(let x=0;x<p.lengthCm;x++)for(let y=0;y<p.widthCm;y++)for(let z=0;z<p.heightCm;z++){
        faces+=Number(x===0)+Number(x===p.lengthCm-1)+Number(y===0)+Number(y===p.widthCm-1)+Number(z===0)+Number(z===p.heightCm-1);
      }
      return {answer:String(faces),checks:['closed cuboid has six external sides','exposed unit-square faces enumerated']};
    }
    case 'grid-rectangle-count': {
      integer(p.rows,'rows');integer(p.columns,'columns');let count=0;
      for(let x1=0;x1<p.columns;x1++)for(let x2=x1+1;x2<=p.columns;x2++)
        for(let y1=0;y1<p.rows;y1++)for(let y2=y1+1;y2<=p.rows;y2++)count++;
      return {answer:String(count),checks:['all pairs of vertical grid lines','all pairs of horizontal grid lines, including outer frame']};
    }
    default: throw Error('Unknown geometry model: '+row.modelId);
  }
}

export function statementFor(row) {
  const p=row.params;
  switch(row.modelId){
    case 'l-shape-area': return `Мектеп ауласына L пішінді гүлзар жасалды. Ол ұзындығы ${p.width} м, ені ${p.height} м тіктөртбұрыштың жоғарғы оң жақ бұрышынан ұзындығы ${p.cutWidth} м, ені ${p.cutHeight} м бөлікті алып тастағанда шығады. Гүлзардың ауданын шаршы метрмен табыңдар.`;
    case 'tile-boundary': return `Ойын алаңындағы соқпақ суреттегідей бірдей шаршы плиткалардан құралған. Әр плитканың қабырғасы ${p.sideCm} см. Плиткалар қабырғаларымен толық жанасады. Соқпақтың сыртқы жиегінің жалпы ұзындығын сантиметрмен табыңдар; плиткалардың ортақ қабырғаларын санамаңдар.`;
    case 'cuboid-missing-height': return `Роботқа арналған тікбұрышты қораптың ішкі көлемі ${p.volumeCm3} см³. Оның ішкі табанының ұзындығы ${p.lengthCm} см, ені ${p.widthCm} см. Қораптың ішкі биіктігі неше сантиметр? Қабырғалардың қалыңдығы есепке алынбайды.`;
    case 'straight-angle-gap': return `A, O, B нүктелері бір түзудің бойында жатыр, ал O нүктесі A мен B арасында. OC және OD сәулелері AOB жазыңқы бұрышының ішінде; OC сәулесі OA мен OD арасында орналасқан. AOC бұрышы ${p.leftDeg}°, DOB бұрышы ${p.rightDeg}°. COD бұрышын градуспен табыңдар.`;
    case 'shaded-grid-percent': return `Жарық тақтасы ${p.rows} қатар мен ${p.columns} бағанға бөлінген бірдей ұяшықтардан тұрады. Суретте қосылған ұяшықтар көк түспен белгіленген. Барлық ұяшықтың неше пайызы қосылған? Жауапты пайыз санымен жазыңдар.`;
    case 'bar-chart-total': return `Бағанды диаграммада мектеп кітапханасына төрт күнде қайтарылған кітап саны көрсетілген. ${p.labels.join(', ')} күндерінде барлығы неше кітап қайтарылған? Әр бағанның үстіндегі сан — сол күннің кітап саны.`;
    case 'coordinate-walk-distance': return `Саябақтағы түзу жол координаталық түзумен көрсетілген. A аялдамасының координатасы ${p.start}, B аялдамасының координатасы ${p.end}. Бір координаталық бірлік ${p.metresPerUnit} м-ге тең. A-дан B-ға дейінгі жолдың ұзындығын метрмен табыңдар.`;
    case 'scaled-route-distance': return `Картада үйден спортзалға баратын жол үш бөліктен тұрады: ${p.segmentsMm.map(v=>comma(v/10)+' см').join(', ')}. Картаның масштабы 1 : ${p.denominator.toLocaleString('fr-FR').replace(/\u202f/g,' ')}. Бала суретте белгіленген жолмен жүреді. Оның жүрген жолын километрмен табыңдар; нүктелердің арасын төте сызықпен қоспаңдар.`;
    case 'closed-box-surface': return `Сыйлық салынған жабық тікбұрышты қораптың ұзындығы ${p.lengthCm} см, ені ${p.widthCm} см, биіктігі ${p.heightCm} см. Қақпағы мен табанын қоса алғанда, барлық сыртқы бетін қағазбен қаптайды. Қабаттасуға қосымша қағаз алмай, неше шаршы сантиметр қағаз керек?`;
    case 'grid-rectangle-count': return `Терезе торы ${p.rows} қатар мен ${p.columns} бағанға бөлінген. Қабырғалары осы тордың сызықтарымен өтетін барлық тіктөртбұрышты санаңдар. Бірнеше ұяшықтан құралған үлкен тіктөртбұрыштар мен квадраттар да есептеледі.`;
    default: throw Error('Unknown geometry model');
  }
}

export function solutionFor(row) {
  const p=row.params,a=calculate(row).answer;
  switch(row.modelId){
    case 'l-shape-area': return `Алдымен бүкіл тіктөртбұрыштың ауданын табамыз: ${p.width} × ${p.height} = ${p.width*p.height} м². Бұрыштағы алынған бөліктің ауданы: ${p.cutWidth} × ${p.cutHeight} = ${p.cutWidth*p.cutHeight} м². Қалған аудан: ${p.width*p.height} − ${p.cutWidth*p.cutHeight} = ${a} м². Жауабы: ${a}.`;
    case 'tile-boundary': {
      const keys=new Set(p.cells.map(cellsKey)),byRow=new Map();
      for(const [x,y] of p.cells){const exposed=[[1,0],[-1,0],[0,1],[0,-1]].filter(([dx,dy])=>!keys.has(cellsKey([x+dx,y+dy]))).length;byRow.set(y,(byRow.get(y)||0)+exposed);}
      const counts=[...byRow.entries()].sort((a,b)=>a[0]-b[0]).map(([,n])=>n);
      return `Сыртқа қарап тұрған кіші қабырғаларды қатар бойынша санаймыз: ${counts.join(' + ')} = ${Number(a)/p.sideCm} қабырға. Ортақ қабырғалар сыртқы жиекке кірмейді. Әрқайсысы ${p.sideCm} см болғандықтан, ${Number(a)/p.sideCm} × ${p.sideCm} = ${a} см. Жауабы: ${a}.`;
    }
    case 'cuboid-missing-height': return `Табанның ауданы ${p.lengthCm} × ${p.widthCm} = ${p.lengthCm*p.widthCm} см². Көлем табан ауданы мен биіктіктің көбейтіндісіне тең. Биіктік: ${p.volumeCm3} : ${p.lengthCm*p.widthCm} = ${a} см. Тексеру: ${p.lengthCm} × ${p.widthCm} × ${a} = ${p.volumeCm3} см³. Жауабы: ${a}.`;
    case 'straight-angle-gap': return `AOB жазыңқы бұрышы 180°-қа тең. Оның ішіндегі үш іргелес бұрыштың қосындысы да 180°. Белгілі бұрыштар: ${p.leftDeg} + ${p.rightDeg} = ${p.leftDeg+p.rightDeg}°. Сондықтан COD = 180 − ${p.leftDeg+p.rightDeg} = ${a}°. Жауабы: ${a}.`;
    case 'shaded-grid-percent': return `Барлығы ${p.rows} × ${p.columns} = ${p.rows*p.columns} бірдей ұяшық бар. Көк ұяшықтарды қатар бойынша санасақ, ${p.shaded.length} ұяшық шығады. Қосылған бөлік ${p.shaded.length}/${p.rows*p.columns}. Пайызбен: ${p.shaded.length} : ${p.rows*p.columns} × 100 = ${a}%. Жауабы: ${a}.`;
    case 'bar-chart-total': return `Әр күннің кітап саны жеке бағанмен берілген. Барлығын қосамыз: ${p.values.join(' + ')} = ${a} кітап. Бағандардың биіктіктерін салыстыру ғана жеткіліксіз: сұрақ төрт күннің жалпы санын сұрайды. Жауабы: ${a}.`;
    case 'coordinate-walk-distance': return `Екі аялдама нөлдің екі жағында. A-дан 0-ге дейін ${Math.abs(p.start)} бірлік, 0-ден B-ға дейін ${p.end} бірлік. Барлығы ${Math.abs(p.start)} + ${p.end} = ${p.end-p.start} бірлік. Әр бірлік ${p.metresPerUnit} м: ${p.end-p.start} × ${p.metresPerUnit} = ${a} м. Жауабы: ${a}.`;
    case 'scaled-route-distance': return `Картадағы үш бөліктің қосындысы: ${p.segmentsMm.map(v=>comma(v/10)).join(' + ')} = ${comma(p.segmentsMm.reduce((s,v)=>s+v,0)/10)} см. Масштаб бойынша 1 см жердегі ${p.denominator} см-ге, яғни ${p.denominator/100000} км-ге тең. Жол: ${comma(p.segmentsMm.reduce((s,v)=>s+v,0)/10)} × ${p.denominator/100000} = ${a} км. Жауабы: ${a}.`;
    case 'closed-box-surface': return `Қорапта үш жұп бірдей жақ бар. Табаны мен қақпағы: 2 × ${p.lengthCm} × ${p.widthCm} = ${2*p.lengthCm*p.widthCm} см². Ұзын екі бүйірі: 2 × ${p.lengthCm} × ${p.heightCm} = ${2*p.lengthCm*p.heightCm} см². Қалған екі бүйірі: 2 × ${p.widthCm} × ${p.heightCm} = ${2*p.widthCm*p.heightCm} см². Қосындысы ${2*p.lengthCm*p.widthCm} + ${2*p.lengthCm*p.heightCm} + ${2*p.widthCm*p.heightCm} = ${a} см². Жауабы: ${a}.`;
    case 'grid-rectangle-count': return `Тіктөртбұрыш үшін екі көлденең және екі тік шекара таңдалады. ${p.rows+1} көлденең сызықтан екі шекараны ${(p.rows+1)*p.rows/2} тәсілмен, ${p.columns+1} тік сызықтан екі шекараны ${(p.columns+1)*p.columns/2} тәсілмен таңдаймыз. Барлығы ${(p.rows+1)*p.rows/2} × ${(p.columns+1)*p.columns/2} = ${a} тіктөртбұрыш. Жауабы: ${a}.`;
    default: throw Error('Unknown geometry model');
  }
}

export function verifyEdition(row) {
  assert.match(row.editionId,/^geometry-[a-z0-9-]+$/);
  assert.ok([4,5,6].includes(row.grade));assert.ok(row.topic&&row.difficulty);
  assert.equal(row.statement,statementFor(row),'statement must retain exactly these model givens and units');
  const result=calculate(row);assert.equal(row.answer,result.answer,'independent answer disagrees');
  assert.equal(row.solution,solutionFor(row),'solution must follow the current givens');
  assert.equal(row.image,`/figures/synaq-editions/${row.editionId}.svg`);
  assert.ok(row.sourceRefs?.length&&row.sourceRefs.every(r=>/^[a-f0-9]{16}$/.test(r.sourceId)&&/^problems\/sources\/zerek\/courses\/[456]-math-/.test(r.sourceFile)));
  assert.ok(row.adaptationChanges?.length>=3);
  return {...result,checks:[...result.checks,'Kazakh condition/units and explanation bound to parameters','new local SVG path','source reference and editorial changes retained']};
}

const line=(x1,y1,x2,y2,extra='')=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" ${extra}/>`;
const text=(x,y,value,extra='')=>`<text x="${x}" y="${y}" ${extra}>${esc(value)}</text>`;
const given=(key,value,x,y,label)=>text(x,y,label,`data-given="${key}" data-value="${esc(value)}"`);
const point=(cx,cy,extra='')=>`<circle cx="${cx}" cy="${cy}" r="8" fill="#2257dc" stroke="none" ${extra}/>`;
const rayPoint=(angle,r=260)=>[360+r*Math.cos(angle*Math.PI/180),320-r*Math.sin(angle*Math.PI/180)];
const arc=(from,to,r)=>{const a=rayPoint(from,r),b=rayPoint(to,r);return`<path d="M ${a.join(' ')} A ${r} ${r} 0 0 0 ${b.join(' ')}" fill="none" stroke="#17a897" stroke-width="5"/>`;};
const box=(p,unknownHeight=false)=>{
  const front=[[140,180],[470,180],[470,350],[140,350]],top=[[140,180],[260,90],[590,90],[470,180]],side=[[470,180],[590,90],[590,260],[470,350]];
  const poly=(v,fill)=>`<polygon points="${v.map(a=>a.join(',')).join(' ')}" fill="${fill}"/>`;
  return poly(front,'#e4edff')+poly(top,'#c8dafd')+poly(side,'#a5c3fc')+
    line(140,385,470,385)+line(140,375,140,395)+line(470,375,470,395)+given('lengthCm',p.lengthCm,305,433,`${p.lengthCm} см`)+
    given('widthCm',p.widthCm,570,369,`${p.widthCm} см`)+
    (unknownHeight?text(85,276,'h = ?'):given('heightCm',p.heightCm,80,276,`${p.heightCm} см`));
};

export function renderFigure(row) {
  const p=row.params;let body='',height=480;
  switch(row.modelId){
    case 'l-shape-area': {
      const s=32,ox=135,oy=110;
      body=`<polygon data-role="l-floor" data-unit-scale="${s}" points="${lVertices(p).map(([x,y])=>`${ox+x*s},${oy+y*s}`).join(' ')}" fill="#c8dafd"/>`;
      body+=line(ox,oy+p.height*s+34,ox+p.width*s,oy+p.height*s+34)+given('width',p.width,ox+p.width*s/2,oy+p.height*s+78,`${p.width} м`);
      body+=line(ox-35,oy,ox-35,oy+p.height*s)+given('height',p.height,50,oy+p.height*s/2+10,`${p.height} м`);
      body+=line(ox+(p.width-p.cutWidth)*s,oy-34,ox+p.width*s,oy-34)+given('cutWidth',p.cutWidth,ox+(p.width-p.cutWidth/2)*s,oy-52,`${p.cutWidth} м`);
      body+=line(ox+p.width*s+30,oy,ox+p.width*s+30,oy+p.cutHeight*s)+given('cutHeight',p.cutHeight,640,oy+p.cutHeight*s/2+10,`${p.cutHeight} м`);height=500;break;
    }
    case 'tile-boundary': {
      const s=88,ox=228,oy=120;
      body=given('sideCm',p.sideCm,360,60,`Плитканың қабырғасы: ${p.sideCm} см`);
      for(const [x,y] of p.cells)body+=`<rect data-role="tile" data-cell="${x},${y}" x="${ox+x*s}" y="${oy+y*s}" width="${s}" height="${s}" fill="#c8dafd"/>`;
      body+=text(360,445,'Тек сыртқы жиек');break;
    }
    case 'cuboid-missing-height': body=box(p,true)+given('volumeCm3',p.volumeCm3,360,48,`V = ${p.volumeCm3} см³`);break;
    case 'straight-angle-gap': {
      height=420;const angleC=180-p.leftDeg,angleD=p.rightDeg;
      body=line(65,320,655,320);
      for(const [label,angle] of [['C',angleC],['D',angleD]]){const [x,y]=rayPoint(angle);body+=line(360,320,x,y,`data-ray="${label}"`)+text(x+(label==='C'?-18:8),y-20,label);}
      body+=point(360,320)+text(60,367,'A')+text(360,370,'O')+text(665,367,'B');
      body+=arc(angleC,180,88)+arc(angleD,angleC,115)+arc(0,angleD,80);
      body+=given('leftDeg',p.leftDeg,210,285,`${p.leftDeg}°`)+given('rightDeg',p.rightDeg,485,270,`${p.rightDeg}°`)+text(322,164,'x°');break;
    }
    case 'shaded-grid-percent': {
      const s=78,ox=165,oy=94,shaded=new Set(p.shaded.map(cellsKey));
      body=given('columns',p.columns,360,50,`${p.columns} баған`)+given('rows',p.rows,82,265,`${p.rows} қатар`);
      for(let y=0;y<p.rows;y++)for(let x=0;x<p.columns;x++)body+=`<rect data-role="grid-cell" data-cell="${x},${y}" data-shaded="${shaded.has(`${x},${y}`)}" x="${ox+x*s}" y="${oy+y*s}" width="${s}" height="${s}" fill="${shaded.has(`${x},${y}`)?'#4685f5':'#fff'}"/>`;
      break;
    }
    case 'bar-chart-total': {
      height=440;const base=350,scale=11;
      body=text(100,44,'Кітап саны','text-anchor="start"');
      for(let tick=0;tick<=24;tick+=6)body+=line(110,base-tick*scale,680,base-tick*scale,'stroke="#d7e2f5" stroke-width="2"')+text(75,base-tick*scale+10,tick,'font-size="26"');
      for(let i=0;i<p.values.length;i++){const x=145+i*140,v=p.values[i];body+=`<rect data-role="bar" data-value="${v}" data-scale="${scale}" x="${x}" y="${base-v*scale}" width="70" height="${v*scale}" fill="#71a4fa"/>`+given('values.'+i,v,x+35,base-v*scale-14,v)+text(x+35,405,p.shortLabels[i]);}break;
    }
    case 'coordinate-walk-distance': {
      height=330;const start=132,step=38,y=175;
      body=line(65,y,655,y)+`<path d="M 645 166 L 655 175 L 645 184" fill="none"/>`;
      for(let n=p.start;n<=p.end;n++){const x=start+(n-p.start)*step;body+=line(x,y-10,x,y+10,`data-coordinate="${n}"`);if([p.start,0,p.end].includes(n))body+=text(x,y+53,n);}
      body+=point(start,y)+point(start+(p.end-p.start)*step,y)+given('start',p.start,start,125,`A (${p.start})`)+given('end',p.end,start+(p.end-p.start)*step,125,`B (${p.end})`)+given('metresPerUnit',p.metresPerUnit,360,290,`1 бірлік = ${p.metresPerUnit} м`);break;
    }
    case 'scaled-route-distance': {
      height=450;const pts=[[95,310],[345,310],[345,160],[645,160]];
      body=given('denominator',p.denominator,360,58,`Масштаб 1 : ${p.denominator.toLocaleString('fr-FR').replace(/\u202f/g,' ')}`);
      for(let i=0;i<3;i++)body+=line(...pts[i],...pts[i+1],`stroke="#2257dc" stroke-width="9" data-role="route-leg" data-length-mm="${p.segmentsMm[i]}"`);
      for(const [x,y] of pts)body+=point(x,y);
      body+=text(95,370,'Үй')+text(600,112,'Спортзал')+given('segmentsMm.0',p.segmentsMm[0],220,355,`${comma(p.segmentsMm[0]/10)} см`)+given('segmentsMm.1',p.segmentsMm[1],260,238,`${comma(p.segmentsMm[1]/10)} см`)+given('segmentsMm.2',p.segmentsMm[2],495,215,`${comma(p.segmentsMm[2]/10)} см`);break;
    }
    case 'closed-box-surface':body=box(p)+text(360,46,'Табаны мен қақпағы да қапталады','font-size="28"');break;
    case 'grid-rectangle-count': {
      const s=100,ox=160,oy=110;
      body=given('columns',p.columns,360,57,`${p.columns} баған`)+given('rows',p.rows,65,270,`${p.rows} қатар`);
      for(let x=0;x<=p.columns;x++)body+=line(ox+x*s,oy,ox+x*s,oy+p.rows*s,'data-role="vertical-grid-line"');
      for(let y=0;y<=p.rows;y++)body+=line(ox,oy+y*s,ox+p.columns*s,oy+y*s,'data-role="horizontal-grid-line"');break;
    }
    default:throw Error('Unknown geometry model');
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 ${height}" role="img" aria-labelledby="title desc" data-edition="${esc(row.editionId)}" data-model="${esc(row.modelId)}"><title id="title">${esc(row.figureTitle)}</title><desc id="desc">${esc(row.figureDescription)}</desc><rect width="720" height="${height}" fill="white"/><g stroke="#233b5d" stroke-width="4" stroke-linejoin="round" stroke-linecap="round" font-family="Arial, DejaVu Sans, sans-serif" font-size="32" text-anchor="middle"><style>text{fill:#18304e;stroke:none}</style>${body}</g></svg>\n`;
}
