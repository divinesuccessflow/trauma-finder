import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const times=process.argv.slice(2).map(Number);
const b=await chromium.launch();const pg=await b.newPage({viewport:{width:1080,height:1920}});
await pg.goto('http://127.0.0.1:8765/video.html');await pg.evaluate(()=>window.ready);await pg.waitForTimeout(300);
for(const t of times){await pg.evaluate(t=>window.render(t),t);await pg.screenshot({path:`stills/t${t.toFixed(2)}.jpg`,type:'jpeg',quality:80});}
await b.close();
