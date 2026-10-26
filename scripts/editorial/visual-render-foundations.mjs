// Optional local author QA. Run with SYNAQ_SHARP_MODULE when sharp is provided
// by the workspace runtime rather than installed as an application dependency.
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../../',import.meta.url));
const sharp=createRequire(import.meta.url)(process.env.SYNAQ_SHARP_MODULE || 'sharp');
const read=f=>JSON.parse(fs.readFileSync(path.join(root,f),'utf8'));
const pack=read('problems/editorial/batches/visual-foundations.json');
const inventory=read('problems/editorial/batches/visual-inventory.json');
const dest='output/editorial-visual';fs.mkdirSync(path.join(root,dest),{recursive:true});
const key=src=>{const p=new URL(src,'https://zerek.app').pathname,i=p.indexOf('/questions/');return i<0?p:p.slice(i);};
const sourceMap=new Map();
for(const dir of ['problems/sources/zerek/courses','problems/sources/zerek'])for(const r of read(dir+'/image-manifest.json').files)if(r.file)sourceMap.set(key(r.src||r.url||r.sourceUrl),path.join(root,dir,r.file));
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const labels=(items,source=false)=>Buffer.from(`<svg width="1093" height="580" xmlns="http://www.w3.org/2000/svg"><rect width="1093" height="580" fill="#edf2f8"/>${items.map((r,i)=>{const x=16+(i%3)*359,y=16+Math.floor(i/3)*282;return `<text x="${x+2}" y="${y+22}" font-size="16" font-family="Arial" fill="#223651">${esc(r.editionId)}</text><text x="${x+2}" y="${y+42}" font-size="14" font-family="Arial" fill="#536780">${source?'ARCHIVED SOURCE':'NEW SVG · 343px · DRAFT'}</text>`;}).join('')}</svg>`);
const missing=[];
for(const row of pack.editions)await sharp(path.join(root,'frontend/public',row.image)).resize({width:343}).png().toFile(path.join(root,dest,row.editionId+'-343.png'));
for(let start=0,page=1;start<pack.editions.length;start+=6,page++){
 const rows=pack.editions.slice(start,start+6),own=[],source=[];
 for(const [i,row]of rows.entries()){
  const left=16+(i%3)*359,top=16+Math.floor(i/3)*282+48;
  own.push({input:path.join(root,dest,row.editionId+'-343.png'),left,top});
  const record=inventory.records.find(r=>r.occurrenceId===row.sourceOccurrenceId),raster=record.sourceAssets.map(a=>sourceMap.get(a)).find(p=>p&&fs.existsSync(p));
  if(raster)source.push({input:await sharp(raster).resize(343,229,{fit:'contain',background:'#fff'}).png().toBuffer(),left,top});
  else missing.push({editionId:row.editionId,sourceId:record.sourceId,sourceOccurrenceId:record.occurrenceId,reason:'No archived raster is available; condition/solution must be reviewed as evidence, without claiming visual comparison.'});
 }
 await sharp(labels(rows)).composite(own).png().toFile(path.join(root,dest,`visual-contact-${page}.png`));
 await sharp(labels(rows,true)).composite(source).png().toFile(path.join(root,dest,`visual-source-contact-${page}.png`));
}
const report={status:'author_previews_only_not_independent_review',newNativeSVGs:pack.editions.length,widthPx:343,
 contactPages:Math.ceil(pack.editions.length/6),sourceRasterUnavailable:missing};
fs.writeFileSync(path.join(root,dest,'visual-render-report.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
