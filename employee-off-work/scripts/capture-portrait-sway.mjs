/** Capture the actual Cocos canvas to show circle-contained animation in review. */
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
const port=process.env.CDP_PORT??9335;
const targets=await(await fetch(`http://127.0.0.1:${port}/json/list`)).json();
const socket=new WebSocket(targets.find(t=>t.type==='page').webSocketDebuggerUrl);
await new Promise((r,j)=>{socket.onopen=r;socket.onerror=j;});
let id=0;const pending=new Map();
socket.onmessage=({data})=>{const m=JSON.parse(data);if(m.id){pending.get(m.id)?.(m);pending.delete(m.id);}};
const send=(method,params={})=>new Promise((r,j)=>{pending.set(++id,m=>m.error?j(new Error(JSON.stringify(m.error))):r(m.result));socket.send(JSON.stringify({id,method,params}));});
async function evaluate(body){
  const result=await send('Runtime.evaluate',{expression:`(async()=>{const cc=await System.import('cc');const canvas=cc.director.getScene().getChildByName('Canvas');const g=canvas.components.find(c=>cc.js.getClassName(c)==='GameMain'),m=g.model,h=g.artHud;${body}})()`,returnByValue:true,awaitPromise:true});
  if(result.exceptionDetails)throw new Error(JSON.stringify(result.exceptionDetails));
  return result.result.value;
}
try{
  for(const load of [0,1,2]){
    const out=resolve(process.env.PORTRAIT_QA_OUT??'temp/qa/portrait',`sway-${load}`);mkdirSync(out,{recursive:true});
    await evaluate(`g.restart();g.guide.start(false);g.shieldCoach.reset(true);m.paused=true;m.workload=${load};h.portraitMotion.reset();h.portraitMotion.advance(${load},0);return true;`);
    for(let frame=0;frame<61;frame++){
      const data=await evaluate(`h.portraitMotion.advance(${load},1/12);g.visualDt=0;g.draw();g.interface.root.active=false;g.overlay.node.active=false;cc.director.tick(0);
        const src=cc.game.canvas,shot=document.createElement('canvas'),scale=src.width/720,p=h.avatarPoint(m.height);
        shot.width=shot.height=256;shot.getContext('2d').drawImage(src,(p.x-40)*scale,(m.height-p.y-40)*scale,80*scale,80*scale,0,0,256,256);
        return shot.toDataURL('image/png');`);
      writeFileSync(resolve(out,`${String(frame).padStart(3,'0')}.png`),Buffer.from(data.split(',')[1],'base64'));
    }
    console.log('Cocos circle animation captured:',load);
  }
  await evaluate('g.goHome();g.draw();return true;');
}finally{socket.close();}
