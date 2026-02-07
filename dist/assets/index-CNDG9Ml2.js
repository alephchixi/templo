import{s as m,R as v,F as f,V as g,O as y,L as p,T as w}from"./tone-CtRS-R2h.js";import{C as b,S,O as C,W as x,a as r,b as T,P as _,M as L}from"./three-DRJ9YT4z.js";(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const t of document.querySelectorAll('link[rel="modulepreload"]'))i(t);new MutationObserver(t=>{for(const s of t)if(s.type==="childList")for(const a of s.addedNodes)a.tagName==="LINK"&&a.rel==="modulepreload"&&i(a)}).observe(document,{childList:!0,subtree:!0});function n(t){const s={};return t.integrity&&(s.integrity=t.integrity),t.referrerPolicy&&(s.referrerPolicy=t.referrerPolicy),t.crossOrigin==="use-credentials"?s.credentials="include":t.crossOrigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function i(t){if(t.ep)return;t.ep=!0;const s=n(t);fetch(t.href,s)}})();class B{constructor(){this.state={canvas_hash:0,battery_level:1,network_rtt:0,time_of_day:0,cursor_entropy:0},this.cursorHistory=[],this.lastCursorTime=Date.now(),this.init()}async init(){console.log("SystemState: Initializing..."),this.updateTimeOfDay(),setInterval(()=>this.updateTimeOfDay(),6e4),await this.initBattery(),this.initNetwork(),this.generateCanvasHash(),this.initCursorTracking(),console.log("SystemState: Ready",this.state)}updateTimeOfDay(){this.state.time_of_day=new Date().getHours()}async initBattery(){if("getBattery"in navigator)try{const e=await navigator.getBattery();this.updateBattery(e),e.addEventListener("levelchange",()=>this.updateBattery(e))}catch(e){console.warn("Battery API failed",e)}}updateBattery(e){this.state.battery_level=e.level,console.log("SystemState: Battery Level",this.state.battery_level)}initNetwork(){if("connection"in navigator){const e=navigator.connection||navigator.mozConnection||navigator.webkitConnection;e&&(this.updateNetwork(e),e.addEventListener("change",()=>this.updateNetwork(e)))}}updateNetwork(e){this.state.network_rtt=e.rtt||0,console.log("SystemState: Network RTT",this.state.network_rtt)}generateCanvasHash(){try{const e=document.createElement("canvas"),n=e.getContext("2d");e.width=200,e.height=50,n.textBaseline="top",n.font="14px 'Arial'",n.textBaseline="alphabetic",n.fillStyle="#f60",n.fillRect(125,1,62,20),n.fillStyle="#069",n.fillText("Cloud Temple",2,15),n.fillStyle="rgba(102, 204, 0, 0.7)",n.fillText("Cloud Temple",4,17);const i=e.toDataURL();let t=0;if(i.length===0){this.state.canvas_hash=t;return}for(let s=0;s<i.length;s++){const a=i.charCodeAt(s);t=(t<<5)-t+a,t=t&t}this.state.canvas_hash=Math.abs(t),console.log("SystemState: Canvas Hash",this.state.canvas_hash)}catch(e){console.warn("Canvas Fingerprint failed",e),this.state.canvas_hash=12345}}initCursorTracking(){document.addEventListener("mousemove",e=>{const n=Date.now(),i=n-this.lastCursorTime;if(i>100){const s=Math.sqrt(Math.pow(e.movementX,2)+Math.pow(e.movementY,2))/i;this.state.cursor_entropy=this.state.cursor_entropy*.9+s*.1,this.lastCursorTime=n}})}get(){return this.state}}class E{constructor(e){this.systemState=e,this.isStarted=!1,this.drones=[]}async init(){console.log("AudioEngine: Initialized")}async start(){await m(),this.reverb=new v({decay:10,wet:.5}).toDestination(),this.delay=new f({delayTime:.5,feedback:.3,wet:.3}).connect(this.reverb),this.masterVol=new g(-12).connect(this.delay),this.setupDrones(),this.startLoop(),this.isStarted=!0,console.log("AudioEngine: Started")}setupDrones(){const n=60+this.systemState.get().canvas_hash%140;console.log("AudioEngine: Base Frequency",n),[1,1.5,2].forEach((t,s)=>{const a=new y({frequency:n*t,type:"sine",volume:-6}).connect(this.masterVol);this.drones.push({osc:a,baseFreq:n*t,lfo:new p(Math.random()*.1+.01,-2,2).connect(a.detune).start()}),a.start()})}startLoop(){setInterval(()=>this.update(),100)}update(){if(!this.isStarted)return;const e=this.systemState.get(),n=Math.max(.1,e.battery_level);this.reverb.decay=1+n*20,this.masterVol.volume.rampTo(-12-(1-n)*20,.1);const i=w(Math.min(e.network_rtt,1e3)/1e3+.2).toSeconds();this.delay.delayTime.rampTo(i,1);const t=Math.min(e.network_rtt/500,.9);this.delay.feedback.rampTo(t,1);const s=e.cursor_entropy||0;this.drones.forEach(a=>{a.lfo.min=-2-s*50,a.lfo.max=2+s*50,a.lfo.frequency.rampTo(.1+s*5,.1)})}}const A=`varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`,k=`uniform float uTime;
uniform vec3 uColorA;
uniform vec3 uColorB;
uniform float uBrightness;
uniform float uSeed; // New random seed

varying vec2 vUv;

// Utility functions
float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
}

// Grain noise
float grain(vec2 st, float time) {
    return random(st + mod(time, 10.0)); // Animating grain
}

float noise(vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a)* u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

float fbm(vec2 st) {
    float v = 0.0;
    float a = 0.5;
    vec2 shift = vec2(100.0);
    mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.50));
    for (int i = 0; i < 6; ++i) { // Increased iterations for more detail/softness
        v += a * noise(st);
        st = rot * st * 2.0 + shift;
        a *= 0.5;
    }
    return v;
}

// Iridescence mixing
vec3 iridescence(float v) {
    // Multi-stop gradient simulating thin-film interference
    // Similar to the user's reference: Pearlescent white -> Pink -> Gold -> Blue
    vec3 col1 = vec3(0.9, 0.9, 1.0); // Pearl
    vec3 col2 = vec3(1.0, 0.4, 0.8); // Pink/Magenta
    vec3 col3 = vec3(1.0, 0.8, 0.4); // Gold
    vec3 col4 = vec3(0.4, 0.6, 1.0); // Soft Blue

    vec3 c = mix(col1, col2, smoothstep(0.0, 0.33, v));
    c = mix(c, col3, smoothstep(0.33, 0.66, v));
    c = mix(c, col4, smoothstep(0.66, 1.0, v));
    return c;
}

void main() {
    vec2 st = vUv * 2.5; // Scale
    float time = uTime * 0.05;

    // Use seed to offset noise space -> Unique texture per load
    st += vec2(uSeed * 100.0); 

    // Distortion fields
    vec2 q = vec2(0.);
    q.x = fbm( st + 0.00*time );
    q.y = fbm( st + vec2(1.0));

    vec2 r = vec2(0.);
    r.x = fbm( st + 1.0*q + vec2(1.7,9.2)+ 0.15*time );
    r.y = fbm( st + 1.0*q + vec2(8.3,2.8)+ 0.126*time);

    float f = fbm(st+r);

    // Color mixing
    // We mix the "Iridescence" result with the "Atmosphere" colors (Time of Day props)
    vec3 iridescentColor = iridescence(f);
    
    // Mix uColorA/B (Time of Day) with Iridescence
    // uColorA/B acts as a tint/ambient light
    vec3 baseColor = mix(uColorA, uColorB, f);
    
    // Blend approach: Soft Light or Screen
    vec3 finalColor = mix(baseColor, iridescentColor, 0.5); // 50% blend

    // Apply brightness (Battery interaction)
    finalColor *= uBrightness;

    // Apply Film Grain
    float g = grain(vUv, uTime * 2.0);
    // Submit noise to color (subtle)
    finalColor += (g - 0.5) * 0.08; // 8% grain strength

    gl_FragColor = vec4(finalColor, 1.0);
}
`;class M{constructor(e){this.systemState=e,this.canvas=document.getElementById("canvas"),this.scene=null,this.camera=null,this.renderer=null,this.material=null,this.clock=new b}init(){this.scene=new S,this.camera=new C(-1,1,1,-1,0,1),this.renderer=new x({canvas:this.canvas,antialias:!0}),this.renderer.setSize(window.innerWidth,window.innerHeight),this.renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));const e={uTime:{value:0},uColorA:{value:new r("#ff0000")},uColorB:{value:new r("#0000ff")},uBrightness:{value:1},uDensity:{value:1}};this.material=new T({uniforms:e,vertexShader:A,fragmentShader:k});const n=new _(2,2),i=new L(n,this.material);this.scene.add(i),window.addEventListener("resize",()=>this.onResize()),console.log("VisualEngine: Initialized"),this.animate()}onResize(){this.renderer.setSize(window.innerWidth,window.innerHeight),this.renderer.setPixelRatio(Math.min(window.devicePixelRatio,2))}animate(){requestAnimationFrame(()=>this.animate());const e=this.clock.getElapsedTime(),n=this.systemState.get();this.material.uniforms.uTime.value=e;const i=n.time_of_day;i>6&&i<18?(this.material.uniforms.uColorA.value.lerp(new r("#ffaa6e"),.05),this.material.uniforms.uColorB.value.lerp(new r("#fcdece"),.05)):(this.material.uniforms.uColorA.value.lerp(new r("#0b0033"),.05),this.material.uniforms.uColorB.value.lerp(new r("#3c0042"),.05)),this.material.uniforms.uBrightness.value=.5+n.battery_level*.5,this.renderer.render(this.scene,this.camera)}}class q{constructor(e){this.systemState=e,this.container=null,this.isVisible=!1,this.params=[{id:"battery_level",label:"Battery",type:"range",min:0,max:1,step:.01,default:1},{id:"network_rtt",label:"Network Wait",type:"range",min:0,max:2e3,step:10,default:50},{id:"time_of_day",label:"Hour",type:"range",min:0,max:23,step:1,default:12},{id:"cursor_entropy",label:"Entropy",type:"range",min:0,max:2,step:.01,default:0}],this.overrides={},this.toggles={},this.init()}init(){this.createUI(),this.attachListeners(),this.systemState.registerOverlay(this)}createUI(){this.container=document.createElement("div"),this.container.id="control-panel",this.container.innerHTML=`
      <div class="controls-header">
        <span>Parameters</span>
        <button id="controls-toggle" class="icon-btn">_</button>
      </div>
      <div class="controls-content">
        ${this.params.map(e=>`
          <div class="control-group" data-id="${e.id}">
            <div class="control-label">
              <span>${e.label}</span>
              <button class="sensor-toggle active" title="Toggle Sensor/Manual"></button>
            </div>
            <input type="range" 
                   min="${e.min}" max="${e.max}" step="${e.step}" 
                   value="${e.default}" 
                   disabled
                   class="delicate-slider">
            <div class="value-display">Auto</div>
          </div>
        `).join("")}
      </div>
    `,document.body.appendChild(this.container)}attachListeners(){const e=this.container.querySelector("#controls-toggle");e.addEventListener("click",()=>{this.container.classList.toggle("collapsed"),e.textContent=this.container.classList.contains("collapsed")?"+":"_"}),this.params.forEach(n=>{const i=this.container.querySelector(`.control-group[data-id="${n.id}"]`),t=i.querySelector("input"),s=i.querySelector(".sensor-toggle"),a=i.querySelector(".value-display");this.toggles[n.id]=!0,this.overrides[n.id]=n.default,s.addEventListener("click",()=>{this.toggles[n.id]=!this.toggles[n.id],this.toggles[n.id]?(s.classList.add("active"),t.disabled=!0,a.textContent="Auto",a.classList.remove("manual")):(s.classList.remove("active"),t.disabled=!1,a.textContent=parseFloat(t.value).toFixed(2),a.classList.add("manual"),this.overrides[n.id]=parseFloat(t.value))}),t.addEventListener("input",u=>{const c=parseFloat(u.target.value);this.overrides[n.id]=c,a.textContent=c.toFixed(2)})})}getOverride(e){return this.toggles[e]===!1?this.overrides[e]:null}}console.log("Cloud Temple Initializing...");const h=document.getElementById("overlay"),l=new B;new q(l);const P=new M(l),d=new E(l);P.init();const D=async()=>{console.log("Interaction detected. Starting Audio..."),h.classList.add("active");try{await d.init(),await d.start()}catch(o){console.error("Audio start failed",o)}};h.addEventListener("click",()=>{D()});
