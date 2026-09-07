import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const PRODUCT_HEAD='5ba702d8e418b430b4c8ee7bf13b338c49652505';
const SAVE_KEY='mystery-pocket-tech.save';
const out='/tmp/one-gesture-result-gate';
const errors=[]; const failed=[]; const assertions=[];
await fs.rm(out,{recursive:true,force:true}); await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,channel:'chrome',args:['--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});
const attach=(p,tag)=>{p.on('pageerror',e=>errors.push(`${tag}: ${e.message}`));p.on('console',m=>{if(m.type()==='error')errors.push(`${tag}: ${m.text()}`)});p.on('requestfailed',r=>failed.push({tag,url:r.url(),error:r.failure()?.errorText??'unknown'}));};
const waitCanvas=async p=>{await p.waitForSelector('#game canvas',{state:'visible',timeout:20000});await p.waitForFunction(()=>document.querySelector('#orientation-gate')?.getAttribute('data-visible')!=='true');await p.waitForTimeout(450)};
const hide=async p=>p.evaluate(()=>{const x=document.querySelector('.mpt-debug-panel');if(x)x.style.display='none'}); const show=async p=>p.evaluate(()=>{const x=document.querySelector('.mpt-debug-panel');if(x)x.style.display=''});
const stage=async(p,name)=>{await show(p);await Promise.all([p.waitForEvent('framenavigated',{timeout:10000}),p.getByRole('button',{name,exact:true}).click()]);await waitCanvas(p);await hide(p)};
const shot=(p,n)=>p.screenshot({path:`${out}/${n}.png`});
const tap=async(p,x,y)=>{await p.mouse.move(x,y);await p.mouse.down();await p.waitForTimeout(70);await p.mouse.up()};
const testScenario=async({tag,button,x,y})=>{
  const ctx=await browser.newContext({viewport:{width:800,height:720},locale:'en-US',recordVideo:{dir:out,size:{width:800,height:720}}});
  const p=await ctx.newPage(); attach(p,tag);
  await p.goto('http://127.0.0.1:5173/?debug=1&platform=mock',{waitUntil:'domcontentloaded'});await waitCanvas(p);await hide(p);await stage(p,button);
  await p.waitForTimeout(button==='Force Hidden Pocket'?3600:2200);
  await shot(p,`${tag}-00-before-first-tap`);
  await tap(p,x,y);
  await p.waitForTimeout(180);await shot(p,`${tag}-01-after-first-tap-180ms`);
  await p.waitForTimeout(620);await shot(p,`${tag}-02-after-first-tap-800ms`);
  // First gesture must not return to idle; verify with second tap causing actual banking/idle.
  await tap(p,400,565);await p.waitForTimeout(950);await shot(p,`${tag}-03-after-second-tap`);
  await ctx.close();
};
await testScenario({tag:'standard',button:'Force Epic',x:400,y:565});
await testScenario({tag:'hidden-side',button:'Force Hidden Pocket',x:185,y:330});
await fs.writeFile(`${out}/report.json`,JSON.stringify({auditedProductHead:PRODUCT_HEAD,auditHead:process.env.GITHUB_SHA??null,assertions,errors,failedRequests:failed},null,2));
await browser.close(); if(errors.length||failed.length)process.exitCode=1;
