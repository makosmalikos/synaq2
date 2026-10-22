import React, { useEffect, useRef, useState } from 'react';
import { petEvolution } from './petEvolution.js';
import './PetCreature.css';

export default function PetCreature({pet='owl',stage=1,progress=0,size=220,className='',label=''}) {
 const creature=petEvolution(pet,stage,progress);
 const element=useRef(null);
 const [visible,setVisible]=useState(false);
 useEffect(()=>{
   if(typeof IntersectionObserver==='undefined'){setVisible(true);return undefined;}
   const observer=new IntersectionObserver(([entry])=>setVisible(entry.isIntersecting));
   if(element.current)observer.observe(element.current);
   return ()=>observer.disconnect();
 },[]);
 return <span ref={element} className={`pet-creature pc-stage-${creature.stage}${visible?' is-visible':''}${creature.hatching?' is-hatching':''} ${className}`} style={{width:size,aspectRatio:'1 / 1.1'}} role={label?'img':undefined} aria-label={label||undefined} aria-hidden={label?undefined:true}>
   <span className="pc-halo"/>
   <img className="pc-character" src={creature.image} srcSet={`${creature.smallImage} ${creature.smallWidth}w, ${creature.image} 640w`} sizes={`${size}px`} width="640" height="640" alt="" loading="lazy" decoding="async"/>
   {creature.stage===3&&<span className="pc-scholar" aria-hidden="true">✦</span>}
   {creature.legend&&<><svg className="pc-crown" viewBox="0 0 100 65" aria-hidden="true"><path d="M12 17L31 34L50 7L69 34L88 17L78 57H22Z" fill="#ffc846" stroke="#cf851b" strokeWidth="3" strokeLinejoin="round"/><path d="M23 49H77L75 57H25Z" fill="#e39a23"/><path d="M50 25L58 36L50 47L42 36Z" fill="#fff1b7"/><circle cx="12" cy="15" r="5" fill="#ffe99f"/><circle cx="50" cy="6" r="5" fill="#ffe99f"/><circle cx="88" cy="15" r="5" fill="#ffe99f"/></svg><span className="pc-spark pc-spark-one">✦</span><span className="pc-spark pc-spark-two">✧</span></>}
 </span>;
}
