import { chromium } from 'playwright';
import fs from 'node:fs/promises';
const out='/tmp/side-item-tap-audit'; await fs.rm(out,{recursive:true,force:true}); await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,channel:'chrome',args:['--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});
const ctx=await browser.newContext({viewport:{width:800,height:720},locale:'en-US',recordVideo:{dir:out,size:{width:800,height:720}}});
const p=await ctx.newPage(); const errors=[]; p.on('pageerror',e=>errors.push(e.message)); p.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
await p.goto('http://127.0.0.1:5173/?debug=1&platform=mock',{waitUntil:'domcontentloaded'}); await p.waitForSelector('#game canvas',{state:'visible'}); await p.waitForTimeout(500);
await p.evaluate(()=>{const x=document.querySelector('.mpt-debug-panel');if(x)x.style.display=''});
await Promise.all([p.waitForEvent('framenavigated',{timeout:10000}),p.getByRole('button',{name:'Force Hidden Pocket',exact:true}).click()]);
await p.waitForSelector('#game canvas',{state:'visible'}); await p.evaluate(()=>{const x=document.querySelector('.mpt-debug-panel');if(x)x.style.display='none'}); await p.waitForTimeout(3800);
await p.screenshot({path:`${out}/00-before-side-tap.png`});
// The standard collectible is visibly parked at the left side of the carousel.
await p.mouse.click(185,330); await p.waitForTimeout(180); await p.screenshot({path:`${out}/01-after-side-tap-180ms.png`}); await p.waitForTimeout(700); await p.screenshot({path:`${out}/02-after-side-tap-880ms.png`});
const save=await p.evaluate(()=>JSON.parse(localStorage.getItem('mystery-pocket-tech.save')??'null'));
await fs.writeFile(`${out}/report.json`,JSON.stringify({errors,save:save&&{totalOpens:save.totalOpens,pendingReveal:save.pendingReveal}},null,2));
await ctx.close(); await browser.close(); if(errors.length)process.exitCode=1;
