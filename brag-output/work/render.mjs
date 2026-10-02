import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { spawn } from 'child_process';
const FPS=30,DUR=22.5,NF=Math.round(FPS*DUR);
const ff=spawn('ffmpeg',['-v','error','-y','-f','image2pipe','-framerate',String(FPS),'-c:v','mjpeg','-i','-','-i','audio.wav','-c:v','libx264','-preset','slow','-crf','18','-pix_fmt','yuv420p','-c:a','aac','-b:a','192k','-shortest','-movflags','+faststart','raw.mp4'],{stdio:['pipe','inherit','inherit']});
const b=await chromium.launch();const pg=await b.newPage({viewport:{width:1080,height:1920}});
await pg.goto('http://127.0.0.1:8765/video.html');await pg.evaluate(()=>window.ready);await pg.waitForTimeout(500);
for(let f=0;f<NF;f++){await pg.evaluate(t=>window.render(t),f/FPS);const buf=await pg.screenshot({type:'jpeg',quality:95});if(!ff.stdin.write(buf))await new Promise(r=>ff.stdin.once('drain',r));if(f%100==0)console.log(f)}
ff.stdin.end();await new Promise(r=>ff.on('close',r));await b.close();
