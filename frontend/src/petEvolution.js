const species = new Set(['owl','fox','panda','lion','penguin','koala']);
export function petEvolution(pet='owl', stage=1, progress=0) {
 const id=species.has(pet)?pet:'owl';
 const current=Math.max(1,Math.min(5,Math.floor(Number(stage)||1)));
 const suffix=current===1?'pet-egg':`${id}-${current>=4?'grown':'study'}`;
 return {
   pet:id,stage:current,
   image:`/mascot/synaq-${suffix}.webp`,
   smallImage:current===1?'/mascot/synaq-pet-egg-small.webp':current>=4?`/mascot/synaq-${id}-grown-small.webp`:`/mascot/synaq-${id}-avatar.webp`,
   smallWidth:current===1||current>=4?256:128,
   hatching:current===1&&Number(progress)>=.7,
   legend:current===5,
 };
}
