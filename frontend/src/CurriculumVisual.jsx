import React from 'react';
import './CurriculumVisual.css';

const point=(x,y)=>`${x},${y}`;
export default function CurriculumVisual({model,lang='ru'}) {
 if(!model)return null;
 const kk=lang==='kk'; let drawing=null,label='',height=220;
 const text=(x,y,value,props={})=><text x={x} y={y} textAnchor="middle" {...props}>{value}</text>;
 const line=(x1,y1,x2,y2,props={})=><line x1={x1} y1={y1} x2={x2} y2={y2} {...props}/>;
 if(model.type==='rectangle'){
   const {w,h,unit}=model,cell=Math.min(30,280/w,130/h),width=w*cell,boxHeight=h*cell,x=(420-width)/2,y=45;
   label=kk?`Қабырғалары ${w} және ${h} ${unit} тіктөртбұрыш`:`Прямоугольник со сторонами ${w} и ${h} ${unit}`;
   drawing=<><rect x={x} y={y} width={width} height={boxHeight} rx="2" className="cv-fill"/>{Array.from({length:w-1},(_,i)=>line(x+(i+1)*cell,y,x+(i+1)*cell,y+boxHeight,{key:`v${i}`,className:'cv-grid'}))}{Array.from({length:h-1},(_,i)=>line(x,y+(i+1)*cell,x+width,y+(i+1)*cell,{key:`h${i}`,className:'cv-grid'}))}{text(210,28,`${w} ${unit}`)}{text(x+width+28,y+boxHeight/2+5,`${h} ${unit}`)}</>;
 } else if(model.type==='fraction'){
   const {num,den}=model,rows=Math.ceil(num/den)||1; height=Math.max(130,rows*36+60);
   label=kk?`${num}/${den}: әр бүтін ${den} тең бөлікке бөлінген, ${num} бөлік боялған`:`${num}/${den}: в каждом целом ${den} равных частей. Всего закрашено: ${num}`;
   drawing=<>{Array.from({length:rows},(_,r)=><g key={r}>{Array.from({length:den},(_,i)=><rect key={i} x={35+i*350/den} y={20+r*36} width={350/den} height="28" className={r*den+i<num?'cv-fill':'cv-empty'}/>)}</g>)}{text(210,rows*36+32,`${num}/${den}`)}</>;
 } else if(model.type==='array'){
   const {rows,cols}=model,cell=Math.min(27,300/cols,160/rows),left=(420-cols*cell)/2;
   label=kk?`${rows} қатар, әр қатарда ${cols} нүкте`:`${rows} рядов по ${cols} точек`;
   drawing=<>{Array.from({length:rows},(_,r)=><g key={r}>{Array.from({length:cols},(_,c)=><circle key={c} cx={left+(c+.5)*cell} cy={25+(r+.5)*cell} r={cell*.28} className="cv-fill"/>)}</g>)}{text(210,rows*cell+58,`${rows} × ${cols}`)}</>;
 } else if(model.type==='places'){
   const digits=String(model.number).split('.'),all=(digits[0]+(digits[1]||'')).split(''),cell=Math.min(62,370/all.length),left=(420-all.length*cell)/2;
   height=160;label=kk?`${model.number} санының разрядтық кестесі`:`Разрядная таблица числа ${model.number}`;
   drawing=<>{all.map((digit,i)=>{const power=digits[0].length-i-1,unit=power>=0?10**power:`1/${10**(-power)}`;return <g key={i}><rect x={left+i*cell} y="25" width={cell} height="95" className={digit==='0'?'cv-empty':'cv-fill'}/>{text(left+(i+.5)*cell,52,unit,{className:'cv-small'})}{text(left+(i+.5)*cell,95,digit,{className:'cv-digit'})}</g>;})}</>;
 } else if(model.type==='numberline'||model.type==='fractionline'||model.type==='interval'){
   const fractional=model.type==='fractionline',interval=model.type==='interval';
   const values=fractional?Array.from({length:model.den+1},(_,i)=>i/model.den):interval?Array.from({length:model.max-model.min+1},(_,i)=>model.min+i):[...new Set(model.points)].sort((a,b)=>a-b);
   const min=Math.min(...values),max=Math.max(...values),scale=v=>45+(v-min)/(max-min||1)*330;
   height=150;label=fractional?(kk?`Бірлік кесіндідегі ${model.num}/${model.den} нүктесі`:`Точка ${model.num}/${model.den} на единичном отрезке`):interval?`(${model.min}; ${model.max}]`:(kk?`Сан түзуі: ${values.join(', ')}`:`Числовая прямая: ${values.join(', ')}`);
   drawing=<>{line(25,60,395,60)}<path d="M388 55L395 60L388 65"/>{interval&&line(scale(model.min),60,scale(model.max),60,{className:'cv-interval'})}{values.map((v,i)=><g key={i}>{line(scale(v),54,scale(v),66)}{text(scale(v),98,fractional?i===0?'0':i===model.den?'1':`${i}/${model.den}`:v,{className:values.length>8?'cv-small':''})}</g>)}{fractional&&<circle cx={scale(model.num/model.den)} cy="60" r="7" className="cv-dot"/>}{interval&&<><circle cx={scale(model.min)} cy="60" r="6" className={model.leftOpen?'cv-open':'cv-dot'}/><circle cx={scale(model.max)} cy="60" r="6" className="cv-dot"/></>}</>;
 } else if(model.type==='percent'){
   label=kk?`100 тең бөлік: ${model.value} бөлік боялған`:`100 равных частей: закрашено ${model.value}`;height=210;
   drawing=<>{Array.from({length:100},(_,i)=><rect key={i} x={120+(i%10)*18} y={10+Math.floor(i/10)*18} width="16" height="16" rx="3" className={i<model.value?'cv-fill':'cv-empty'}/>)}{text(210,208,`${model.value}%`)}</>;
 } else if(model.type==='angle'){
   const rad=model.degrees*Math.PI/180,x=115+145*Math.cos(rad),y=170-145*Math.sin(rad);
   label=kk?`${model.degrees}° бұрыш`:`Угол ${model.degrees}°`;height=230;
   drawing=<>{line(115,170,300,170)}{line(115,170,x,y)}<path d={`M165 170 A50 50 0 0 0 ${point(115+50*Math.cos(rad),170-50*Math.sin(rad))}`} className="cv-accent"/><circle cx="115" cy="170" r="4" className="cv-dot"/>{text(220,220,`${model.degrees}°`)}</>;
 } else if(model.type==='bars'){
   const {values}=model,max=Math.max(...values),cell=320/values.length;
   label=kk?`Күндер бойынша мәндер: ${values.join(', ')}`:`Значения по дням: ${values.join(', ')}`;
   drawing=<>{line(45,185,385,185)}{values.map((v,i)=>{const h=v/max*140;return <g key={i}><rect x={55+i*cell} y={185-h} width={cell-15} height={h} rx="5" className="cv-fill"/>{text(55+i*cell+(cell-15)/2,177-h,v)}{text(55+i*cell+(cell-15)/2,210,i+1)}</g>;})}</>;
 } else if(['point','symmetry','graph'].includes(model.type)){
   const graph=model.type==='graph',p=graph?model.point:[model.x,model.y];
   const bx=Math.max(6,Math.abs(p[0])+2),by=Math.max(6,Math.abs(p[1])+2),sx=x=>210+x/bx*150,sy=y=>110-y/by*90;
   const points=model.type==='symmetry'?[p,[-p[0],p[1]]]:[p];
   label=graph?`y = ${model.slope}x ${model.intercept<0?'−':'+'} ${Math.abs(model.intercept)}, (${p.join('; ')})`:points.map(q=>`(${q.join('; ')})`).join(' → ');
   let segment=null;
   if(graph){const x1=Math.max(-bx,(-by-model.intercept)/model.slope),x2=Math.min(bx,(by-model.intercept)/model.slope);segment=line(sx(x1),sy(model.slope*x1+model.intercept),sx(x2),sy(model.slope*x2+model.intercept),{className:'cv-accent'});}
   drawing=<>{line(35,110,385,110)}{line(210,210,210,7)}{text(396,116,'x')}{text(225,18,'y')}{text(198,128,0)}{text(sx(bx),130,bx)}{text(190,sy(by)+7,by)}{segment}{points.map(([x,y],i)=><g key={i}>{line(sx(x),110,sx(x),sy(y),{className:'cv-dashed'})}{line(210,sy(y),sx(x),sy(y),{className:'cv-dashed'})}<circle cx={sx(x)} cy={sy(y)} r="6" className="cv-dot"/>{text(sx(x),sy(y)-13,`(${x}; ${y})`)}</g>)}</>;
 } else if(model.type==='circle'){
   label=kk?`Радиусы ${model.radius} см шеңбер`:`Окружность радиуса ${model.radius} см`;
   drawing=<><circle cx="210" cy="110" r="80" className="cv-empty"/>{line(130,110,290,110,{className:'cv-dashed'})}{line(210,110,290,110,{className:'cv-accent'})}<circle cx="210" cy="110" r="4" className="cv-dot"/>{text(250,98,`r = ${model.radius}`)}{text(210,215,`d = ${2*model.radius}`)}</>;
 } else if(model.type==='volume'){
   label=kk?`Өлшемдері ${model.w} × ${model.h} × ${model.d} см параллелепипед`:`Параллелепипед ${model.w} × ${model.h} × ${model.d} см`;
   drawing=<><path d="M100 70L160 30L320 30L260 70Z" className="cv-top"/><path d="M260 70L320 30L320 150L260 190Z" className="cv-side"/><rect x="100" y="70" width="160" height="120" className="cv-fill"/>{text(180,216,`${model.w} см`)}{text(67,135,`${model.h} см`)}{text(322,190,`${model.d} см`)}</>;
 }
 if(!drawing)return null;
 return <figure className="curriculum-visual"><svg viewBox={`0 0 420 ${height}`} role="img" aria-label={label}>{drawing}</svg><figcaption>{label}</figcaption></figure>;
}
