import fs from 'node:fs/promises';
import path from 'node:path';

export function privateContentPath(raw) {
  let value=String(raw||'').split(/[?#]/,1)[0].replaceAll('\\','/');
  try { for(let n=0;n<5;n++){const decoded=decodeURIComponent(value).split(/[?#]/,1)[0].replaceAll('\\','/');if(decoded===value)break;value=decoded;} }
  catch { return true; }
  value=value.replaceAll('\\','/');
  const candidates=[value,path.posix.normalize(value)];
  return candidates.some(p=>/(?:^|\/)figures\/(?:synaq-editions|zerek|zerek-courses)(?:\/|$)/i.test(p)
    || /(?:^|\/)(?:backend|problems)(?:\/|$)/i.test(p)
    || /(?:^|\/)zerek[a-z0-9_]*questions\.js$/i.test(p));
}

// Editorial source locations stay stable. Only their delivery changes: neither
// Vite's public middleware, filesystem URLs nor the emitted deployment may expose them.
export function privateContentBoundary() {
  let outDir,publicDir;
  const block=(req,res,next)=>{
    if(!privateContentPath(req.url))return next();
    res.statusCode=404;res.setHeader('Cache-Control','no-store');res.end('Not found');
  };
  return {
    name:'private-content-boundary',enforce:'pre',
    configResolved(config){outDir=path.resolve(config.root,config.build.outDir);publicDir=config.publicDir;},
    configureServer(server){server.middlewares.use(block);},
    configurePreviewServer(server){server.middlewares.use(block);},
    resolveId(source,importer){
      const candidate=source.startsWith('.')&&importer?path.resolve(path.dirname(importer.split('?')[0]),source):source;
      if(privateContentPath(candidate))this.error('Private content must be loaded through its authenticated API.');
    },
    load(id){if(privateContentPath(id))this.error('Private content must be loaded through its authenticated API.');},
    async closeBundle(){
      if(!publicDir)return;
      const relative=path.relative(publicDir,outDir);
      if(!relative||(!relative.startsWith('..'+path.sep)&&relative!=='..'&&!path.isAbsolute(relative)))throw new Error('Build output must not overwrite editorial public sources');
      // Remove only generated deployment copies left by an older unfiltered build.
      for(const name of ['zerek','zerek-courses','synaq-editions'])await fs.rm(path.join(outDir,'figures',name),{recursive:true,force:true});
      await fs.cp(publicDir,outDir,{recursive:true,filter(source){return !privateContentPath(path.relative(publicDir,source));}});
    },
  };
}
