import { LoadingProgress } from '../assets/scripts/model/AsyncLoading.ts';

// Use the same original artwork coordinates as GameInterface, without changing the bitmap.
export const FISH_CONTOUR = [[503,2008],[487,2012],[478,2028],[459,2040],[450,2048],[439,2038],
  [430,2038],[423,2046],[423,2058],[430,2070],[425,2080],[423,2092],[428,2102],
  [437,2107],[450,2100],[461,2093],[478,2107],[490,2113],[489,2118],[497,2125],
  [513,2127],[527,2121],[532,2114],[550,2107],[570,2090],[583,2073],[585,2066],
  [580,2055],[565,2039],[543,2025],[532,2014],[519,2007]];

function fishShader() {
  return FISH_CONTOUR.map(([x,y], i) => {
    const [px,py] = FISH_CONTOUR[(i + FISH_CONTOUR.length - 1) % FISH_CONTOUR.length];
    if (py === y) return '';
    return `if ((p.y > ${y}.0) != (p.y > ${py}.0)) { if (p.x < ${x}.0 + (${px-x}.0) * (p.y-${y}.0)/(${py-y}.0)) hit = !hit; }`;
  }).join('\n');
}

export const STARTUP_FRAGMENT = `precision highp float;
uniform sampler2D u_Poster;
uniform vec2 u_Size;
uniform float u_Progress;
uniform float u_HasPoster;
bool fish(vec2 p) { bool hit = false; ${fishShader()} return hit; }
vec4 samplePoster(vec2 p) { return texture2D(u_Poster, p / vec2(1080.0,2400.0)); }
void main() {
  float scale = min(u_Size.x/1080.0,u_Size.y/2400.0);
  vec2 p = (vec2(gl_FragCoord.x,u_Size.y-gl_FragCoord.y)-(u_Size-vec2(1080.0,2400.0)*scale)*0.5)/scale;
  vec4 color = vec4(32.0/255.0,44.0/255.0,80.0/255.0,1.0);
  if (p.x >= 0.0 && p.x <= 1080.0 && p.y >= 0.0 && p.y <= 2400.0) {
    if (u_HasPoster > 0.5) color = samplePoster(p);
    if (p.x >= 416.0 && p.x <= 590.0 && p.y >= 2000.0 && p.y <= 2132.0 && u_HasPoster > 0.5)
      color = samplePoster(vec2(745.0+(p.x-416.0)*8.0/174.0,p.y));
    vec2 q = abs(p-vec2(542.5,2067.0))-vec2(372.5,0.0);
    if (length(max(q,0.0)) <= 41.0) {
      bool filled = p.x <= 129.0+827.0*u_Progress;
      color = u_HasPoster > 0.5 ? samplePoster(vec2((filled ? 250.0 : 800.0)+(p.x-129.0)*8.0/827.0,p.y))
        : (filled ? vec4(0.43,0.76,0.48,1.0) : vec4(0.81,0.85,0.83,1.0));
    }
    vec2 original = vec2(p.x-(129.0+659.0*u_Progress-420.0),p.y);
    if (u_HasPoster > 0.5 && original.x >= 420.0 && original.x <= 588.0 && original.y >= 2004.0 && original.y <= 2134.0 && fish(original))
      color = samplePoster(original);
  }
  gl_FragColor = color;
}`;

/** Platform-owned renderer. It gives up the canvas synchronously before Cocos draws its poster. */
function wechatScreen(Progress, fragment) {
  const window = GameGlobal;
  const progress = new Progress();
  let gl, program, texture, buffer, vao, vaoApi, position;
  let raf = null, stopped = false, hasPoster = false, previousTime = 0;
  let engine, engineDriving = false;
  function setProgress(value) { progress.report(value); return Promise.resolve(); }
  function shader(type, source) {
    const result = gl.createShader(type); gl.shaderSource(result, source); gl.compileShader(result);
    if (!gl.getShaderParameter(result, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(result));
    return result;
  }
  function draw() {
    if (stopped || !gl) return;
    // Creator caches WebGL state. Restore every binding/state touched by this separate renderer.
    const old = { program: gl.getParameter(gl.CURRENT_PROGRAM), buffer: gl.getParameter(gl.ARRAY_BUFFER_BINDING),
      active: gl.getParameter(gl.ACTIVE_TEXTURE), viewport: gl.getParameter(gl.VIEWPORT), mask: gl.getParameter(gl.COLOR_WRITEMASK),
      vao: vaoApi ? gl.getParameter(vaoApi.VERTEX_ARRAY_BINDING_OES) : null };
    gl.activeTexture(gl.TEXTURE0); old.texture = gl.getParameter(gl.TEXTURE_BINDING_2D);
    const flags = [gl.SCISSOR_TEST,gl.CULL_FACE,gl.DEPTH_TEST,gl.BLEND];
    const enabled = flags.map(flag => gl.isEnabled(flag));
    flags.forEach(flag => gl.disable(flag)); gl.colorMask(true,true,true,true);
    if (vaoApi) vaoApi.bindVertexArrayOES(vao);
    const attribute = !vaoApi ? { enabled:gl.getVertexAttrib(position,gl.VERTEX_ATTRIB_ARRAY_ENABLED),
      buffer:gl.getVertexAttrib(position,gl.VERTEX_ATTRIB_ARRAY_BUFFER_BINDING),size:gl.getVertexAttrib(position,gl.VERTEX_ATTRIB_ARRAY_SIZE),
      type:gl.getVertexAttrib(position,gl.VERTEX_ATTRIB_ARRAY_TYPE),normalized:gl.getVertexAttrib(position,gl.VERTEX_ATTRIB_ARRAY_NORMALIZED),
      stride:gl.getVertexAttrib(position,gl.VERTEX_ATTRIB_ARRAY_STRIDE),offset:gl.getVertexAttribOffset(position,gl.VERTEX_ATTRIB_ARRAY_POINTER) } : null;
    gl.viewport(0,0,window.canvas.width,window.canvas.height);
    gl.useProgram(program); gl.bindTexture(gl.TEXTURE_2D,texture); gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
    gl.enableVertexAttribArray(position); gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
    gl.uniform1i(gl.getUniformLocation(program,'u_Poster'),0);
    gl.uniform2f(gl.getUniformLocation(program,'u_Size'),window.canvas.width,window.canvas.height);
    gl.uniform1f(gl.getUniformLocation(program,'u_Progress'),progress.value);
    gl.uniform1f(gl.getUniformLocation(program,'u_HasPoster'),hasPoster ? 1 : 0);
    gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
    if (vaoApi) vaoApi.bindVertexArrayOES(old.vao);
    else if (attribute) {
      if (attribute.buffer) { gl.bindBuffer(gl.ARRAY_BUFFER,attribute.buffer);
        gl.vertexAttribPointer(position,attribute.size,attribute.type,attribute.normalized,attribute.stride,attribute.offset); }
      if (!attribute.enabled) gl.disableVertexAttribArray(position);
    }
    gl.bindBuffer(gl.ARRAY_BUFFER,old.buffer); gl.bindTexture(gl.TEXTURE_2D,old.texture);
    gl.activeTexture(old.active); gl.useProgram(old.program); gl.viewport(...old.viewport); gl.colorMask(...old.mask);
    flags.forEach((flag,index) => { if (enabled[index]) gl.enable(flag); });
  }
  function tick(time) {
    if (stopped || engineDriving) return;
    progress.advance(previousTime ? (time-previousTime)/1000 : 1/60); previousTime = time;
    draw(); raf = window.requestAnimationFrame(tick);
  }
  function beforeEngineDraw() {
    // Once the engine renders, its frame loop owns presentation. Never race two RAF callbacks.
    engineDriving = true;
    if (raf !== null) { window.cancelAnimationFrame(raf); raf = null; }
  }
  function afterEngineDraw() {
    if (stopped) return;
    const time = Date.now();
    progress.advance(engine.lastTime ? (time-engine.lastTime)/1000 : 1/60);engine.lastTime = time;
    draw();
  }
  function attach(cc) {
    if (engine) return;
    engine = { director:cc.director,events:cc.Director,lastTime:0 };
    engine.director.on(engine.events.EVENT_BEFORE_DRAW,beforeEngineDraw);
    engine.director.on(engine.events.EVENT_AFTER_DRAW,afterEngineDraw);
  }
  function end() {
    if (stopped) return Promise.resolve();
    stopped = true;
    if (raf !== null) window.cancelAnimationFrame(raf);
    if (engine) {
      engine.director.off(engine.events.EVENT_BEFORE_DRAW,beforeEngineDraw);
      engine.director.off(engine.events.EVENT_AFTER_DRAW,afterEngineDraw);
    }
    if (gl) {
      if (vaoApi && vao) vaoApi.deleteVertexArrayOES(vao);
      gl.deleteTexture(texture); gl.deleteBuffer(buffer); gl.deleteProgram(program);
    }
    return Promise.resolve();
  }
  async function start(alpha, antialias) {
    gl = window.canvas.getContext('webgl', { alpha:alpha==='true',antialias:antialias!=='false',depth:true,stencil:true });
    if (!gl) throw new Error('WebGL unavailable');
    window.WebGL2RenderingContext = false;
    const vertex = shader(gl.VERTEX_SHADER,'attribute vec2 a_Position; void main(){gl_Position=vec4(a_Position,0.0,1.0);}');
    const pixel = shader(gl.FRAGMENT_SHADER,fragment);
    program = gl.createProgram(); gl.attachShader(program,vertex); gl.attachShader(program,pixel); gl.linkProgram(program);
    gl.deleteShader(vertex); gl.deleteShader(pixel);
    if (!gl.getProgramParameter(program,gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
    position = gl.getAttribLocation(program,'a_Position');
    vaoApi = gl.getExtension('OES_vertex_array_object'); if (vaoApi) vao = vaoApi.createVertexArrayOES();
    buffer = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
    texture = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D,texture);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([32,44,80,255]));
    raf = window.requestAnimationFrame(tick);
    await new Promise(resolve => {
      const image = new window.Image(); let finished = false;
      const timer = setTimeout(() => complete(false),10000);
      function complete(loaded) {
        if (finished) return; finished = true; clearTimeout(timer);
        if (loaded && !stopped) { gl.bindTexture(gl.TEXTURE_2D,texture); gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image); hasPoster = true; }
        resolve();
      }
      image.onload = () => complete(true); image.onerror = () => complete(false); image.src = 'loading-cover.jpg';
    });
    await new Promise(resolve => window.requestAnimationFrame(() => { draw(); resolve(); }));
  }
  return { start,end,attach,setProgress,getProgress:()=>progress.value,getTarget:()=>progress.target,isEnded:()=>stopped };
}

export const WECHAT_STARTUP_SOURCE = `// Offwork startup renderer v2: single canvas owner, live progress.\nmodule.exports = (${wechatScreen.toString()})(${LoadingProgress.toString()},${JSON.stringify(STARTUP_FRAGMENT)});\n`;

/** Browser cover uses the same crop/contour as the native poster. */
function browserScreen(Progress, contour) {
  const cover = document.getElementById('startup-cover');
  const canvas = cover.querySelector('canvas'), context = canvas.getContext('2d');
  const image = new Image(), progress = new Progress(); let ready = false, stopped = false, raf, previous = 0;
  progress.report(0.06);
  function draw(time) {
    if (stopped) return;
    progress.advance(previous ? (time-previous)/1000 : 1/60); previous = time;
    const width = innerWidth, height = innerHeight, ratio = Math.min(devicePixelRatio||1,2);
    if (canvas.width!==Math.round(width*ratio)||canvas.height!==Math.round(height*ratio)) { canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio); }
    const scale = Math.min(canvas.width/1080,canvas.height/2400), p = progress.value;
    context.setTransform(1,0,0,1,0,0); context.fillStyle='#202c50';context.fillRect(0,0,canvas.width,canvas.height);
    context.translate((canvas.width-1080*scale)/2,(canvas.height-2400*scale)/2);context.scale(scale,scale);
    if (ready) {
      context.drawImage(image,0,0,1080,2400);
      context.drawImage(image,745,2000,8,132,416,2000,174,132);
      context.save();context.beginPath();
      context.moveTo(170,2026);context.lineTo(915,2026);context.arcTo(956,2026,956,2067,41);
      context.arcTo(956,2108,915,2108,41);context.lineTo(170,2108);context.arcTo(129,2108,129,2067,41);
      context.arcTo(129,2026,170,2026,41);context.closePath();context.clip();
      context.drawImage(image,800,2026,8,82,129,2026,827,82);
      if(p>0)context.drawImage(image,250,2026,8*p,82,129,2026,827*p,82);
      context.restore();context.save();context.translate(129+659*p-420,0);context.beginPath();
      contour.forEach(([x,y],i)=>i?context.lineTo(x,y):context.moveTo(x,y));context.closePath();context.clip();
      context.drawImage(image,420,2004,168,130,420,2004,168,130);context.restore();
    }
    raf=requestAnimationFrame(draw);
  }
  const freeze=()=>{stopped=true;cancelAnimationFrame(raf);};
  window.__offworkStartup={getProgress:()=>progress.value,getTarget:()=>progress.target,
    setProgress:value=>progress.report(value),freeze,end:()=>{freeze();cover.remove();}};
  image.onload=()=>{ready=true;};image.src='loading-cover.jpg';raf=requestAnimationFrame(draw);
}

export const BROWSER_STARTUP_SOURCE = `(${browserScreen.toString()})(${LoadingProgress.toString()},${JSON.stringify(FISH_CONTOUR)});`;
