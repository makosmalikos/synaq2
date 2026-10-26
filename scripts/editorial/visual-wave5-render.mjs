// Local author previews only, using the existing runtime's sharp installation.
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../../',import.meta.url));
const sharp=createRequire(import.meta.url)(process.env.SYNAQ_SHARP_MODULE||'sharp');
const read=f=>JSON.parse(fs.readFileSync(path.join(root,f),'utf8'));
const pack=read('problems/editorial/batches/visual-wave5-rational-visuals.json');
const inventory=read('problems/editorial/batches/visual-inventory.json');
const dir=path.join(root,'output/editorial-visual-wave5');fs.mkdirSync(dir,{recursive:true});
const key=src=>{const p=new URL(src,'https://zerek.app').pathname;return p.slice(p.indexOf('/questions/'));};
const sourceMap=new Map();
for(const row of read('problems/sources/zerek/courses/image-manifest.json').files)if(row.file)sourceMap.set(key(row.src||row.url||row.sourceUrl),path.join(root,'problems/sources/zerek/courses',row.file));
const esc=s=>String(s).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
const bg=(rows,source)=>Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="1093" height="654"><rect width="1093" height="654" fill="#eef3fa"/>'+rows.map((r,i)=>{
 const x=16+(i%3)*359,y=16+Math.floor(i/3)*318;
 return '<text x="'+(x+2)+'" y="'+(y+18)+'" fill="#213448" font-family="Arial" font-size="13">'+esc(r.editionId)+'</text><text x="'+(x+2)+'" y="'+(y+38)+'" fill="#567089" font-family="Arial" font-size="14">'+(source?'ARCHIVED SOURCE':'NEW NATIVE · 343px · DRAFT')+'</text>';
}).join('')+'</svg>');
const missing=[];
for(const row of pack.editions)await sharp(path.join(root,'frontend/public',row.image)).resize({width:343}).png().toFile(path.join(dir,row.editionId+'-343.png'));
for(let start=0,page=1;start<pack.editions.length;start+=6,page++){
 const rows=pack.editions.slice(start,start+6),own=[],source=[];
 for(const [i,row]of rows.entries()){
  const left=16+(i%3)*359,top=16+Math.floor(i/3)*318+46;
  own.push({input:path.join(dir,row.editionId+'-343.png'),left,top});
  const record=inventory.records.find(r=>r.occurrenceId===row.sourceOccurrenceId),raster=record.sourceAssets.map(s=>sourceMap.get(key(s))).find(f=>f&&fs.existsSync(f));
  if(raster)source.push({input:await sharp(raster).resize(343,257,{fit:'contain',background:'#fff'}).png().toBuffer(),left,top});
  else missing.push({editionId:row.editionId,sourceId:record.sourceId,reason:'Archived raster unavailable: review only the full saved condition/solution; do not claim a raster comparison.'});
 }
 await sharp(bg(rows,false)).composite(own).png().toFile(path.join(dir,'visual-wave5-contact-'+page+'.png'));
 await sharp(bg(rows,true)).composite(source).png().toFile(path.join(dir,'visual-wave5-source-'+page+'.png'));
}
const report={status:'author_previews_only_not_independent_review',nativeSVGs:pack.editions.length,widthPx:343,contactPages:Math.ceil(pack.editions.length/6),sourceRasterUnavailable:missing};
fs.writeFileSync(path.join(dir,'visual-wave5-render-report.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
