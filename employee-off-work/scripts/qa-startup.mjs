/** Actual cold/warm navigation plus the packaged WeChat shader on Chrome WebGL. */
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {STARTUP_OBSERVER,startupChecks} from './qa-startup-fixture.mjs';

const out=process.env.QA_OUT??'temp/qa/startup-audit/startup';mkdirSync(out,{recursive:true});
const base=`http://127.0.0.1:${process.env.GAME_PORT??7456}/`;
const remote=`http://127.0.0.1:${process.env.CDP_PORT??9334}`;
const target=await(await fetch(`${remote}/json/new?about:blank`,{method:'PUT'})).json();
const socket=new WebSocket(target.webSocketDebuggerUrl);await new Promise((resolve,reject)=>{socket.onopen=resolve;socket.onerror=reject;});
let id=0;const pending=new Map(),errors=[];
socket.onmessage=({data})=>{const m=JSON.parse(data);if(m.id){pending.get(m.id)?.(m);pending.delete(m.id);}
  if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails);
  if(m.method==='Runtime.consoleAPICalled'&&m.params.type==='error')errors.push(m.params.args);};
const send=(method,params={})=>new Promise((resolve,reject)=>{const request=++id;
  const timer=setTimeout(()=>{pending.delete(request);reject(new Error(`${method} timed out`));},45000);
  pending.set(request,m=>{clearTimeout(timer);m.error?reject(new Error(JSON.stringify(m.error))):resolve(m.result);});socket.send(JSON.stringify({id:request,method,params}));});
const evaluate=async expression=>{const result=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});
  if(result.exceptionDetails)throw new Error(JSON.stringify(result.exceptionDetails));return result.result.value;};
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const shot=async name=>{const result=await send('Page.captureScreenshot',{format:'png'});const path=`${out}/${name}.png`;writeFileSync(path,Buffer.from(result.data,'base64'));return path;};
const expected=JSON.parse(readFileSync('build/web-mobile/build-info.json','utf8')).fingerprint;
const checks={},states={},screenshots=[];
try{
  await send('Page.enable');await send('Runtime.enable');await send('Network.enable');
  await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
  await send('Page.addScriptToEvaluateOnNewDocument',{source:STARTUP_OBSERVER});
  for(const cold of [true,false]){
    const name=cold?'cold':'warm';
    if(cold)await send('Network.clearBrowserCache');
    await send('Network.setCacheDisabled',{cacheDisabled:cold});
    await send('Network.emulateNetworkConditions',{offline:false,latency:cold?120:0,downloadThroughput:cold?2000000:-1,uploadThroughput:-1});
    await send('Page.navigate',{url:`${base}?startup-${name}-${Date.now()}`});
    const captured=new Set();let complete=false;
    for(let attempt=0;attempt<450;attempt++){
      await sleep(200);
      let sample;try{sample=await evaluate('window.__qaStartupFrames?.at(-1)');}catch{continue;}
      if(!sample)continue;
      for(const threshold of [0.1,0.5,0.9])if(!sample.ready&&sample.progress>=threshold&&!captured.has(threshold)){
        captured.add(threshold);screenshots.push(await shot(`${name}-${Math.round(threshold*100)}`));break;
      }
      if(sample.ready){complete=true;break;}
    }
    if(!complete)throw new Error(`${name} startup did not finish`);
    states[name]=await evaluate(`(async()=>{const cc=await System.import('cc'),g=cc.director.getScene().getChildByName('Canvas').components.find(c=>cc.js.getClassName(c)==='GameMain');
      return {frames:window.__qaStartupFrames,fingerprint:g.buildFingerprint,cover:!!document.getElementById('startup-cover'),started:g.model.started};})()`);
    Object.assign(checks,Object.fromEntries(Object.entries(startupChecks(states[name].frames)).map(([key,value])=>[`${name}_${key}`,value])));
    checks[`${name}_opens_home_on_current_source`]=states[name].fingerprint===expected&&!states[name].cover&&!states[name].started;
    screenshots.push(await shot(`${name}-home`));
  }
  // Use the real packaged native startup implementation, including its fragment shader.
  const source=readFileSync('build/wechatgame/first-screen.js','utf8');
  await evaluate(`(async()=>{const cc=await System.import('cc');cc.game.pause();document.body.innerHTML='<canvas id="native-loading" width="390" height="844" style="position:fixed;inset:0;width:390px;height:844px"></canvas>';
    const canvas=document.getElementById('native-loading'),module={exports:{}};
    const host={canvas,Image,requestAnimationFrame:requestAnimationFrame.bind(window),cancelAnimationFrame:cancelAnimationFrame.bind(window)};
    new Function('GameGlobal','module',${JSON.stringify(source)})(host,module);
    window.__qaNative=module.exports;await window.__qaNative.start('default','default','false');return true;})()`);
  states.native=[];
  for(const progress of [0.2,0.6,1]){
    const sample=await evaluate(`(async()=>{const screen=window.__qaNative;await screen.setProgress(${progress});
      while(screen.getProgress()<${progress}-1e-6)await new Promise(resolve=>requestAnimationFrame(resolve));
      return new Promise(resolve=>requestAnimationFrame(()=>{const canvas=document.getElementById('native-loading'),gl=canvas.getContext('webgl');
        const scale=Math.min(canvas.width/1080,canvas.height/2400),pixel=new Uint8Array(4);
        gl.readPixels(Math.floor((canvas.width-1080*scale)/2+700*scale),Math.floor((canvas.height+2400*scale)/2-2067*scale),1,1,gl.RGBA,gl.UNSIGNED_BYTE,pixel);
        resolve({progress:screen.getProgress(),pixel:[...pixel],error:gl.getError()});}));})()`);
    states.native.push(sample);screenshots.push(await shot(`native-${Math.round(progress*100)}`));
  }
  checks.native_shader_advances_original_bar=states.native.every(s=>s.error===0&&s.pixel[3]===255)&&Math.abs(states.native[0].pixel[0]-states.native[2].pixel[0])>25;
  checks.native_progress_reaches_full=states.native[2].progress===1;
  await evaluate('window.__qaNative.end();true');
  checks.no_runtime_errors=errors.length===0;
}finally{socket.close();}
const report={passed:Object.values(checks).every(Boolean),checks,states,errors,screenshots};
writeFileSync(`${out}/startup-result.json`,JSON.stringify(report,null,2));
console.log(JSON.stringify({passed:report.passed,checks,errors,screenshots},null,2));process.exitCode=report.passed?0:1;
