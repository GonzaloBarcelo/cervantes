import type { FaceLandmarker } from '@mediapipe/tasks-vision';
export class HeadTracking {
 private stream?:MediaStream;
 private detector?:FaceLandmarker;
 private video?:HTMLVideoElement;
 private frame=0;
 private generation=0;
 async start(onLook:(x:number,y:number)=>void) {
  const generation=++this.generation;
  const stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'user',width:320,height:240},audio:false});
  if(generation!==this.generation){stream.getTracks().forEach(t=>t.stop());return;}
  this.stream=stream;
  try{
   const {FaceLandmarker,FilesetResolver}=await import('@mediapipe/tasks-vision');
   const vision=await FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22-rc.20250304/wasm');
   const detector=await FaceLandmarker.createFromOptions(vision,{baseOptions:{modelAssetPath:'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task'},runningMode:'VIDEO',numFaces:1});
   if(generation!==this.generation){detector.close();return;}this.detector=detector;
   const video=document.createElement('video');video.muted=true;video.playsInline=true;video.srcObject=stream;this.video=video;await video.play();
   let last=0,lastVideo=-1;
   const tick=(now:number)=>{if(generation!==this.generation)return;if(now-last>66&&video.readyState>=2&&video.currentTime!==lastVideo){last=now;lastVideo=video.currentTime;const result=detector.detectForVideo(video,now);const nose=result.faceLandmarks[0]?.[1];if(nose)onLook((.5-nose.x)*2,(nose.y-.5)*2);else onLook(0,0);}this.frame=requestAnimationFrame(tick);};this.frame=requestAnimationFrame(tick);
  }catch(error){this.stop();throw error;}
 }
 stop(){this.generation++;cancelAnimationFrame(this.frame);this.stream?.getTracks().forEach(t=>t.stop());this.stream=undefined;this.detector?.close();this.detector=undefined;if(this.video){this.video.pause();this.video.srcObject=null;this.video=undefined;}}
}
