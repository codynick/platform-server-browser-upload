'use strict';
class CodySpeechCapture extends AudioWorkletProcessor {
 constructor(){super();this.buffer=new Float32Array(4096);this.offset=0;this.stopped=false;this.port.onmessage=e=>{if(e.data?.type==='flush'){this.stopped=true;if(this.offset){const data=this.buffer.slice(0,this.offset);this.port.postMessage({type:'audio',data,flush:true},[data.buffer]);this.offset=0;}this.port.postMessage({type:'flushed'});}};}
 process(inputs){if(this.stopped)return true;const channel=inputs[0]?.[0];if(channel)for(let i=0;i<channel.length;i++){this.buffer[this.offset++]=channel[i];if(this.offset===this.buffer.length){this.port.postMessage(this.buffer,[this.buffer.buffer]);this.buffer=new Float32Array(4096);this.offset=0;}}return true;}
}
registerProcessor('codynick-speech-capture',CodySpeechCapture);
