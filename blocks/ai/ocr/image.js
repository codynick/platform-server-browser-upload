'use strict';
// Small, bounded preprocessing for printed text. No second OCR pass or model.
(()=>{
 function prepare(image,{layout='auto',cropped=false,enhance=true}={}){
  const {width:w,height:h,data}=image;
  if(!enhance)return {data,width:w,height:h,scale:1,padding:0,contrast:false};
  // Enlarge short selected areas only. Full photographs retain their resolution.
  const wanted=(cropped||layout==='line')?Math.min(3,Math.max(1,96/h)):1;
  const scale=Math.min(wanted,Math.max(1,Math.sqrt(2000000/(w*h))));
  const sw=Math.max(1,Math.round(w*scale)),sh=Math.max(1,Math.round(h*scale));
  const grey=new Uint8Array(w*h),hist=new Uint32Array(256);
  for(let i=0;i<grey.length;i++){const j=i*4,a=data[j+3]/255;const v=Math.round((.299*data[j]+.587*data[j+1]+.114*data[j+2])*a+255*(1-a));grey[i]=v;hist[v]++;}
  const cut=Math.floor(w*h*.02);let lo=0,hi=255,sum=0;
  while(lo<255&&sum+hist[lo]<=cut)sum+=hist[lo++];sum=0;
  while(hi>0&&sum+hist[hi]<=cut)sum+=hist[hi--];
  // Skip aggressive stretching of nearly blank or already high-contrast images.
  const contrast=hi-lo>=32&&hi-lo<220;
  const lut=Uint8Array.from({length:256},(_,v)=>contrast?Math.max(0,Math.min(255,Math.round((v-lo)*255/(hi-lo)))):v);
  const padding=12,width=sw+padding*2,height=sh+padding*2,out=new Uint8ClampedArray(width*height*4);out.fill(255);
  if(sw===w&&sh===h){
   for(let y=0;y<h;y++)for(let x=0;x<w;x++){const v=lut[grey[y*w+x]],j=((y+padding)*width+x+padding)*4;out[j]=out[j+1]=out[j+2]=v;}
  }else for(let y=0;y<sh;y++){
   const sy=Math.max(0,Math.min(h-1,(y+.5)*h/sh-.5)),y0=Math.floor(sy),y1=Math.min(h-1,y0+1),fy=sy-y0;
   for(let x=0;x<sw;x++){
    const sx=Math.max(0,Math.min(w-1,(x+.5)*w/sw-.5)),x0=Math.floor(sx),x1=Math.min(w-1,x0+1),fx=sx-x0;
    const a=lut[grey[y0*w+x0]]*(1-fx)+lut[grey[y0*w+x1]]*fx,b=lut[grey[y1*w+x0]]*(1-fx)+lut[grey[y1*w+x1]]*fx;
    const v=Math.round(a*(1-fy)+b*fy),j=((y+padding)*width+x+padding)*4;out[j]=out[j+1]=out[j+2]=v;
   }
  }
  return {data:out,width,height,scaleX:sw/w,scaleY:sh/h,scale,padding,contrast};
 }
 globalThis.CodyOCRImage={prepare};
})();
