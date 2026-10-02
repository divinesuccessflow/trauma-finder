import fs from 'fs';
const SR=44100,DUR=22.5,N=Math.floor(SR*DUR);
const L=new Float32Array(N),R=new Float32Array(N);       // music bus
const fxL=new Float32Array(N),fxR=new Float32Array(N);   // sfx bus
const rev=new Float32Array(N);                            // reverb send
const mtof=m=>440*Math.pow(2,(m-69)/12);
let seed=1;const rnd=()=>((seed=(seed*16807)%2147483647)/2147483647)*2-1;
const BPM=112,BEAT=60/BPM,BAR=BEAT*4,T0=4.3;
function add(buf,i,v){if(i>=0&&i<N)buf[i]+=v}
// Rhodes-ish electric piano: sine + soft bell partial, exp decay
function ep(t,m,len,g,pan=0,send=.35){const f=mtof(m),s=Math.floor(t*SR),n=Math.floor((len+1.2)*SR);
 for(let k=0;k<n;k++){const tt=k/SR;const env=Math.min(1,tt/0.008)*Math.exp(-tt*1.6)*(tt>len?Math.exp(-(tt-len)*6):1);
  const v=(Math.sin(2*Math.PI*f*tt+0.6*Math.sin(2*Math.PI*f*2*tt)*Math.exp(-tt*6))*0.8+0.12*Math.sin(2*Math.PI*f*3.01*tt)*Math.exp(-tt*5))*env*g;
  add(L,s+k,v*(1-pan)*.7);add(R,s+k,v*(1+pan)*.7);add(rev,s+k,v*send)}}
function pad(t0,t1,ms,g){const s=Math.floor(t0*SR),e=Math.floor(t1*SR);
 for(let i=s;i<e;i++){const tt=(i-s)/SR,rem=(e-i)/SR;const env=Math.min(1,tt/0.8)*Math.min(1,rem/0.6);let v=0;
  for(const m of ms){const f=mtof(m);v+=Math.sin(2*Math.PI*f*tt)+0.5*Math.sin(2*Math.PI*f*1.003*tt+1)+0.25*Math.sin(2*Math.PI*f*2.002*tt)}
  v*=env*g/ms.length;add(L,i,v*.6);add(R,i,v*.6);add(rev,i,v*.3)}}
function kick(t,g){const s=Math.floor(t*SR);let ph=0;for(let k=0;k<SR*.35;k++){const tt=k/SR;const f=48+90*Math.exp(-tt*30);ph+=2*Math.PI*f/SR;const v=Math.sin(ph)*Math.exp(-tt*9)*g;add(L,s+k,v);add(R,s+k,v)}}
let hp=0;function hat(t,g,pan){const s=Math.floor(t*SR);let prev=0;for(let k=0;k<SR*.06;k++){const n=rnd();const h=n-prev;prev=n;const v=h*Math.exp(-k/SR*70)*g;add(L,s+k,v*(1-pan));add(R,s+k,v*(1+pan));add(rev,s+k,v*.1)}}
function bass(t,m,len,g){const f=mtof(m),s=Math.floor(t*SR);for(let k=0;k<(len)*SR;k++){const tt=k/SR;const env=Math.min(1,tt/.01)*Math.min(1,(len-tt)/.05)*Math.exp(-tt*1.2);const v=(Math.sin(2*Math.PI*f*tt)+.25*Math.sin(4*Math.PI*f*tt))*env*g;add(L,s+k,v);add(R,s+k,v)}}
// ---- SFX (sfx bus)
function pluck(t,m,g,pan=0){const f=mtof(m),s=Math.floor(t*SR);for(let k=0;k<SR*.6;k++){const tt=k/SR;const v=(Math.sin(2*Math.PI*f*tt)+.3*Math.sin(4*Math.PI*f*tt)*Math.exp(-tt*20))*Math.min(1,tt/.003)*Math.exp(-tt*9)*g;add(fxL,s+k,v*(1-pan));add(fxR,s+k,v*(1+pan));add(rev,s+k,v*.5)}}
function whoosh(tc,len,g){const s=Math.floor((tc-len*.7)*SR),n=Math.floor(len*SR);let lp=0,lp2=0;for(let k=0;k<n;k++){const x=k/n;const env=Math.pow(Math.sin(Math.PI*Math.min(1,x/.7*.5+(x>.7?(x-.7)/.3*.5:0))),2);const cut=0.02+0.12*Math.sin(Math.PI*x);lp+=cut*(rnd()-lp);lp2+=cut*(lp-lp2);const v=lp2*env*g;const p=Math.sin(x*Math.PI*2)*.5;add(fxL,s+k,v*(1-p));add(fxR,s+k,v*(1+p));add(rev,s+k,v*.4)}}
function thud(t,g){const s=Math.floor(t*SR);let ph=0;for(let k=0;k<SR*.5;k++){const tt=k/SR;ph+=2*Math.PI*(55+40*Math.exp(-tt*25))/SR;const v=Math.sin(ph)*Math.exp(-tt*7)*g;add(fxL,s+k,v);add(fxR,s+k,v);add(rev,s+k,v*.3)}}

// ---------- MUSIC
// Hook: low drone + soft "ringback" tones (E5) muted
pad(0,4.6,[45,52,57],.10);
for(const t of [0.15,1.15,2.15,3.15]){pluck(t,76,.05,-.2);pluck(t+.22,76,.04,.2)}
// riser into reveal
whoosh(4.3,1.4,.55);
// Groove from T0 to ~17.9: progression A - F#m - D - E (per bar)
const prog=[[57,61,64,68],[54,57,61,64],[50,54,57,61],[52,56,59,62]];
const roots=[45,42,38,40];
let bar=0;for(let t=T0;t<17.85;t+=BAR,bar++){const c=prog[bar%4];
 // chords on beat 1 and the "and" of 2
 c.forEach((m,i)=>ep(t+i*.012,m,BEAT*1.4,.07,(i-1.5)*.15));c.forEach((m,i)=>ep(t+BEAT*1.5+i*.012,m,BEAT*.9,.045,(i-1.5)*.15));
 for(let b=0;b<4;b++){const tb=t+b*BEAT;if(tb>=17.85)break;kick(tb,.42);hat(tb+BEAT/2,.09,.3);hat(tb+BEAT*.75,.04,-.3);
  bass(tb,roots[bar%4]+(b==3?7:0),BEAT*.85,.17)}
 // pluck motif
 const mot=[76,73,69,71];[0,.5,1.5,2.5].forEach((o,i)=>{const tt=t+o*BEAT+BEAT*2;if(tt<17.85)ep(tt,mot[(i+bar)%4]+12,BEAT*.4,.03,.4,.5)});
}
// Dip at 17.95 then outro: resolve on A major, warm and wide
pad(17.9,22.5,[45,57,61,64,69],.12);
[57,61,64,69,73].forEach((m,i)=>ep(18.0+i*.04,m,3.2,.06,(i-2)*.2,.6));
for(let b=0;b<5;b++){const tb=18.0+b*BEAT*2;if(tb<21)kick(tb,.3)}
[[19.75,76],[20.55,81]].forEach(([t,m])=>ep(t,m,1.5,.05,.2,.6));
// ---------- SFX
thud(2.0,.35);pluck(2.0,57,.08);           // X stamp, low A
whoosh(8.4,.6,.35);                        // to S3
pluck(9.45,88,.06,.2);pluck(9.55,93,.05,.2); // QR detected (E6,A6)
whoosh(10.15,.45,.22);whoosh(11.85,.45,.22);
pluck(10.55,81,.07,-.1);pluck(11.45,85,.07,.1);pluck(12.3,88,.08,0);pluck(12.75,81,.07,0); // taps
pluck(12.95,76,.06);pluck(13.07,81,.06);    // toast chime E5->A5
whoosh(14.05,.7,.35);                      // card slides up
pluck(14.75,88,.05);pluck(14.85,93,.04);    // consent pill
for(const t of [14.95,15.3])for(let i=0;i<6;i++)pluck(t+i*.07,100,.008,(i%2?.3:-.3)); // timestamp ticks (E7), very soft
pluck(15.75,81,.05);                       // badge
pluck(16.85,76,.07);pluck(16.95,88,.05);    // call tap
whoosh(17.95,.6,.3);

// ---------- reverb (Schroeder) on send
const combs=[1557,1617,1491,1422].map(d=>({d,b:new Float32Array(d),i:0}));const aps=[225,556].map(d=>({d,b:new Float32Array(d),i:0}));
const wet=new Float32Array(N);for(let n=0;n<N;n++){let x=rev[n]*.25,y=0;for(const c of combs){const o=c.b[c.i];c.b[c.i]=x+o*.8;c.i=(c.i+1)%c.d;y+=o}for(const a of aps){const o=a.b[a.i];const v=-y*.5+o;a.b[a.i]=y+o*.5;a.i=(a.i+1)%a.d;y=v}wet[n]=y}
// ---------- mix
const out=Buffer.alloc(44+N*4);let peak=0;const M=[];
for(let n=0;n<N;n++){const t=n/SR;let fade=Math.min(1,t/0.05)*Math.min(1,(DUR-t)/1.0);
 let l=L[n]+fxL[n]*.75+wet[n]*.35,r=R[n]+fxR[n]*.75+wet[Math.max(0,n-300)]*.35;
 l=Math.tanh(l*1.1)*fade*.85;r=Math.tanh(r*1.1)*fade*.85;M.push(l,r);peak=Math.max(peak,Math.abs(l),Math.abs(r))}
const hdr=(o,s)=>out.write(s,o);hdr(0,'RIFF');out.writeUInt32LE(36+N*4,4);hdr(8,'WAVE');hdr(12,'fmt ');out.writeUInt32LE(16,16);out.writeUInt16LE(1,20);out.writeUInt16LE(2,22);out.writeUInt32LE(SR,24);out.writeUInt32LE(SR*4,28);out.writeUInt16LE(4,32);out.writeUInt16LE(16,34);hdr(36,'data');out.writeUInt32LE(N*4,40);
const g=0.89/peak;for(let i=0;i<M.length;i++)out.writeInt16LE(Math.round(Math.max(-1,Math.min(1,M[i]*g))*32767),44+i*2);
fs.writeFileSync('audio.wav',out);console.log('peak',peak.toFixed(3));
