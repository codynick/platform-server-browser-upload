const assert=require('assert/strict'),path=require('path');require(path.resolve(process.argv[2]||'build/testsite','blocks/ai/ocr/image.js'));
const prepare=globalThis.CodyOCRImage.prepare,make=(w,h,v=180)=>({width:w,height:h,data:new Uint8ClampedArray(w*h*4).fill(v)});
const im=make(100,20);for(let i=3;i<im.data.length;i+=4)im.data[i]=255;
let a=prepare(im,{layout:'line'});assert.equal(a.width,324);assert.equal(a.height,84);assert.equal(a.scaleX,3);assert.equal(a.scaleY,3);assert.equal(a.padding,12);assert.equal(a.contrast,false);assert(a.data.every((v,i)=>i%4!==3||v===255));assert.equal(a.data[0],255);assert.equal(a.data[(12*a.width+12)*4],180);
a=prepare(im,{enhance:false});assert.equal(a.data,im.data);assert.equal(a.width,100);assert.equal(a.padding,0);
a=prepare(im,{});assert.equal(a.width,124,'whole photos are not enlarged');
const crop=make(50,20);for(let i=0;i<1000;i++){const v=i<500?150:230;crop.data.set([v,v,v,255],i*4);}a=prepare(crop,{cropped:true});assert(a.contrast);assert.equal(a.data[(12*a.width+12)*4],0);assert.equal(a.data[((a.height-13)*a.width+12)*4],255);
a=prepare(make(16000,10),{layout:'line'});assert((a.width-24)*(a.height-24)<2010000,'upscaling budget');
console.log('PASS: bounded enlargement, contrast guard, white border, alpha flattening, optional bypass and unchanged full-image scale');
