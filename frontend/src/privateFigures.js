export const isPrivateFigure=src=>/^\/figures\/synaq-editions\//.test(String(src||''));
export const MAX_FIGURE_BYTES=1024*1024;
const failure=()=>Object.assign(new Error('figure-unavailable'),{code:'figure-unavailable'});

export async function fetchPrivateFigure(questionId,{signal,loadAuth=()=>import('./firebase.js'),fetcher=fetch}={}){
  if(!/^synaq_adapted_[a-z0-9_]{1,180}$/.test(questionId||''))throw failure();
  const {auth}=await loadAuth(),user=auth.currentUser,uid=user?.uid;
  if(!uid)throw failure();
  const token=await user.getIdToken();
  if(auth.currentUser?.uid!==uid||signal?.aborted)throw failure();
  const response=await fetcher('/api/learning',{method:'POST',signal,cache:'no-store',
    headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify({action:'figure',qid:questionId})});
  if(!response.ok||!/^image\/svg\+xml(?:;|$)/i.test(response.headers.get('content-type')||'')
    || Number(response.headers.get('content-length')||0)>MAX_FIGURE_BYTES)throw failure();
  const chunks=[];let size=0;
  if(response.body?.getReader){
    const reader=response.body.getReader();
    try { while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>MAX_FIGURE_BYTES){await reader.cancel();throw failure();}chunks.push(value);} }
    finally {reader.releaseLock();}
  }else {const bytes=await response.arrayBuffer();if(bytes.byteLength>MAX_FIGURE_BYTES)throw failure();chunks.push(bytes);}
  if(auth.currentUser?.uid!==uid||signal?.aborted)throw failure();
  // No shared blob cache: a single mounted question owns at most1MiB and revokes it.
  return new Blob(chunks,{type:'image/svg+xml'});
}
