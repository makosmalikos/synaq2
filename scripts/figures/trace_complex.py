"""Reconstruct complex source linework as SVG paths (no embedded bitmap).
Requires Pillow, numpy, opencv-python-headless and vtracer. Crops retain the
question's visual givens and remove the duplicated prose/page margins.
"""
from pathlib import Path
import json,re
import cv2,numpy as np,vtracer
from PIL import Image
from drawing import OUT
# Normalized source bounds, visually checked against every original.
CROPS={
'bil_v1_q8':(.06,.14,.71,.315),'bil_v1_q22':(.19,.29,.92,.85),
'bil_v2_q10':(.12,.16,.99,.93),'bil_v2_q29':(.04,.14,.90,.99),
'nzm_q7':(.22,.40,.78,.94),'nzm_q38':(.29,.31,.73,.99),'nzm_q47':(.46,.23,.68,.72),
'bil_va_2':(.03,.56,.64,.96),'bil_va_27':(.015,.38,.445,.85),'bil_vb_20':(.015,.395,.45,.835),
'bil_va_kaz2_45':(.06,.10,.97,.87),'bil_vb_kaz2_42':(.035,.08,.98,.88),
'bil_vb_6':(.025,.16,.565,.97),'bil_vb_30':(.045,.55,.65,.76),
'bil_ve_3':(.31,.448,.717,1),'bil_ve_5':(.17,.30,.89,1),
'bil_ve_19':(.145,.21,.94,1),'bil_ve_29':(.12,.20,.94,.98),
'bil_log_v1_2':(.12,.20,.98,.98),'bil_log_v1_3':(.04,.03,.96,.94),
'bil_log_v1_4':(.10,.12,.84,.96),'bil_log_v1_7':(.07,.19,.96,.96),
'bil_log_v1_8':(.06,.08,.73,.65),'bil_log_v1_10':(.10,.12,.97,.99),
'bil_log_v1_11':(.04,.025,.96,.98),'bil_log_v1_12':(.08,.16,.91,.95),
'bil_log_v1_13':(.10,.15,.91,.98),'bil_log_v1_14':(.05,.10,.90,.99),
'bil_log_v1_15':(.015,.01,.99,.91),'bil_log_v1_18':(.19,.18,.84,.96),
'bil_log_v1_20':(.05,.08,.94,.98),'bil_log_v1_22':(.05,.12,.95,.99),
'bil_log_v1_24':(.095,.34,.99,.98),'hippo-range':(.01,.05,.99,.99),
}

def run():
 sources={p.stem:p for p in Path('frontend/public/figures').rglob('*') if p.suffix.lower() in ['.png','.jpg']}
 report=[]
 tmp=Path('/tmp/synaq-vector-work');tmp.mkdir(exist_ok=True)
 for name,bounds in CROPS.items():
  im=Image.open(sources[name]).convert('RGB');w,h=im.size;crop=tuple(round(v*(w if i%2==0 else h)) for i,v in enumerate(bounds));im=im.crop(crop)
  rgb=np.array(im);gray=cv2.cvtColor(rgb,cv2.COLOR_RGB2GRAY)
  # Correct illumination; only colour/ink survives, paper is plain white.
  bg=cv2.GaussianBlur(gray,(0,0),19);norm=cv2.divide(gray,np.maximum(bg,1),scale=255)
  hsv=cv2.cvtColor(rgb,cv2.COLOR_RGB2HSV);hue,sat,val=hsv[:,:,0],hsv[:,:,1],hsv[:,:,2]
  out=np.full_like(rgb,255)
  dark=((norm<215)|(gray<200))&(gray<230)
  # Colour printed lines are pale in these books: preserve saturation rather than use a dark threshold.
  chroma=(sat>18)&(val>95)&(hsv[:,:,2]-np.min(rgb,axis=2)>16)
  for mask,color in [(chroma&(hue<25),(235,170,94)),(chroma&(hue>=25)&(hue<85),(102,177,153)),(chroma&(hue>=85)&(hue<112),(90,167,207)),(chroma&(hue>=112)&(hue<150),(153,132,194)),(chroma&(hue>=150),(209,122,161))]:out[mask]=color
  out[dark & ~chroma]=(41,70,91)
  if name=='hippo-range':
   # Preserve the map's three separate geographical layers.
   out[:]=255;out[gray<210]=(184,192,203);out[gray<140]=(109,126,145);out[gray<65]=(35,54,72)
  # Despeckle tiny isolated scan dust; never remove enclosed holes.
  mask=np.any(out!=255,axis=2).astype('uint8');n,labels,stats,_=cv2.connectedComponentsWithStats(mask,8)
  for k in range(1,n):
   if stats[k,cv2.CC_STAT_AREA]<3:out[labels==k]=255
  # Tracer smooths the linework into resolution-independent paths.
  enlarged=cv2.resize(out,None,fx=2,fy=2,interpolation=cv2.INTER_NEAREST);png=tmp/(name+'.png');Image.fromarray(enlarged).save(png)
  target=OUT/(name+'.svg');vtracer.convert_image_to_svg_py(str(png),str(target),colormode='color',hierarchical='stacked',mode='spline',filter_speckle=4,color_precision=6,layer_difference=16,corner_threshold=65,length_threshold=3.5,max_iterations=10,splice_threshold=45,path_precision=2)
  s=target.read_text();ww,hh=enlarged.shape[1],enlarged.shape[0];s=re.sub(r'<svg ([^>]+)>',lambda m:f'<svg {m[1]} viewBox="0 0 {ww} {hh}">',s,count=1);target.write_text(s)
  report.append({'name':name,'source':str(sources[name]),'crop':crop,'method':'source-linework-vectorization'})
 Path('output/figure-redraw/vectorization.json').write_text(json.dumps(report,indent=2))
 print('Vectorized',len(report),'complex diagrams')
if __name__=='__main__':run()
