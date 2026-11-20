// Petit motor WebGL2 per al personatge (pell + roba amb esquelet) i escenari pla.
'use strict';
const M4={
  ident(){return new Float32Array([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]);},
  mul(a,b){const o=new Float32Array(16);for(let c=0;c<4;c++)for(let r=0;r<4;r++){let s=0;for(let k=0;k<4;k++)s+=a[k*4+r]*b[c*4+k];o[c*4+r]=s;}return o;},
  persp(fov,asp,n,f){const t=1/Math.tan(fov/2),o=new Float32Array(16);o[0]=t/asp;o[5]=t;o[10]=(f+n)/(n-f);o[11]=-1;o[14]=2*f*n/(n-f);return o;},
  look(e,c,u){let z=[e[0]-c[0],e[1]-c[1],e[2]-c[2]];let l=Math.hypot(...z);z=z.map(v=>v/l);
    let x=[u[1]*z[2]-u[2]*z[1],u[2]*z[0]-u[0]*z[2],u[0]*z[1]-u[1]*z[0]];l=Math.hypot(...x);x=x.map(v=>v/l);
    const y=[z[1]*x[2]-z[2]*x[1],z[2]*x[0]-z[0]*x[2],z[0]*x[1]-z[1]*x[0]];
    return new Float32Array([x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,
      -(x[0]*e[0]+x[1]*e[1]+x[2]*e[2]),-(y[0]*e[0]+y[1]*e[1]+y[2]*e[2]),-(z[0]*e[0]+z[1]*e[1]+z[2]*e[2]),1]);},
  rx(a){const c=Math.cos(a),n=Math.sin(a);return new Float32Array([1,0,0,0,0,c,n,0,0,-n,c,0,0,0,0,1]);},
  tr(x,y,z){return new Float32Array([1,0,0,0,0,1,0,0,0,0,1,0,x,y,z,1]);},
  trY(x,y,z,a,s=1){const c=Math.cos(a)*s,n=Math.sin(a)*s;return new Float32Array([c,0,-n,0,0,s,0,0,n,0,c,0,x,y,z,1]);},
};
function b64(s,T){const bin=atob(s),u=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);return new T(u.buffer);}

const VS=`#version 300 es
in vec3 aPos; in vec4 aBi; in vec4 aBw; in float aSlot; in vec2 aUV; in vec3 aCol;
uniform mat4 uBones[31]; uniform mat4 uModel; uniform mat4 uVP; uniform int uSkin; uniform int uDrop; uniform float uTime; uniform vec3 uEye;
out vec3 vW; out vec2 vUV; out vec3 vCol; flat out int vSlot;
void main(){
  vec4 p=vec4(aPos,1.);
  if(uSkin==1){ mat4 s=uBones[int(aBi.x)]*aBw.x+uBones[int(aBi.y)]*aBw.y+uBones[int(aBi.z)]*aBw.z+uBones[int(aBi.w)]*aBw.w; p=s*p; }
  if(uDrop==1){ // gota de pluja: cau i es repeteix al voltant de la càmera
    vec3 c=aPos; c.y=mod(c.y-uTime*11.,16.)-.5;
    c.x=uEye.x+mod(c.x-uEye.x+22.,44.)-22.; c.z=uEye.z+mod(c.z-uEye.z+22.,44.)-22.;
    p=vec4(c+(aCol.r>.5?vec3(0.,aUV.y*.38,aUV.x*.014):vec3(aUV.x*.014,aUV.y*.38,0.)),1.);
  }
  vec4 w=uModel*p; vW=w.xyz; vUV=aUV; vCol=aCol; vSlot=int(aSlot+.5); gl_Position=uVP*w; }`;
const FS=`#version 300 es
precision highp float;
in vec3 vW; in vec2 vUV; in vec3 vCol; flat in int vSlot;
uniform vec3 uCol[4]; uniform int uMode; uniform sampler2D uTex; uniform vec3 uEye; uniform float uGlow;
uniform float uDay; uniform float uRain; uniform vec3 uFogC;
out vec4 o;
bool roofed(vec3 p,float m){ /*ROOFS*/ return false; }
vec3 light(){ // factor de llum segons dia/nit i si som dins de casa (o sota un sostre)
  bool inside=abs(vW.x)<15.05&&abs(vW.z)<14.05&&vW.y<3.35||roofed(vW,-.06);
  vec3 night=inside?vec3(.82,.76,.72):vec3(.30,.36,.55);
  vec3 L=mix(night,vec3(1.),uDay);
  if(!inside) L*=1.-.22*uRain;
  return L;
}
void main(){
  if(uMode==4){ if(abs(vW.x)<15.4&&abs(vW.z)<14.4&&vW.y<7.5||vW.y<0.||roofed(vW,.4)) discard; o=vec4(mix(vec3(.75,.85,1.),vec3(.55,.65,.9),1.-uDay),1.); return; }
  if(uMode==3){ o=vec4(vCol,1.); return; }
  if(uMode==2){ vec4 t=texture(uTex,vUV); if(t.a<.35) discard; o=vec4(t.rgb*light(),1.); return; }
  vec3 n=normalize(cross(dFdx(vW),dFdy(vW)));
  vec3 base = uMode==1 ? vCol : uCol[vSlot];
  vec3 Ld=normalize(vec3(.35,.9,.55));
  float d=max(dot(n,Ld),0.);
  float hemi=.5+.5*n.y;
  vec3 c=base*(.58+.24*hemi+.26*d)*light();
  c+= vec3(1.,.55,.8)*uGlow;
  float fog=clamp((length(vW-uEye)-16.)/40.,0.,1.);
  o=vec4(mix(c,uFogC,fog*.65),1.);
}`;

class Engine{
  constructor(canvas,roofs=[]){
    const gl=this.gl=canvas.getContext('webgl2',{antialias:true});
    if(!gl) throw new Error('WebGL2');
    const sh=(t,s)=>{const x=gl.createShader(t);gl.shaderSource(x,s.replace('/*ROOFS*/',roofs.map(([x0,z0,x1,z1,h])=>`if(p.x>${x0.toFixed(2)}-m&&p.x<${x1.toFixed(2)}+m&&p.z>${z0.toFixed(2)}-m&&p.z<${z1.toFixed(2)}+m&&p.y<${h.toFixed(2)}+m) return true;`).join(' ')));gl.compileShader(x);if(!gl.getShaderParameter(x,gl.COMPILE_STATUS))throw gl.getShaderInfoLog(x);return x;};
    const p=this.prog=gl.createProgram();gl.attachShader(p,sh(gl.VERTEX_SHADER,VS));gl.attachShader(p,sh(gl.FRAGMENT_SHADER,FS));
    ['aPos','aBi','aBw','aSlot','aUV','aCol'].forEach((n,i)=>gl.bindAttribLocation(p,i,n));
    gl.linkProgram(p); if(!gl.getProgramParameter(p,gl.LINK_STATUS)) throw gl.getProgramInfoLog(p);
    gl.useProgram(p); this.u={};
    for(const n of ['uBones','uModel','uVP','uSkin','uCol','uMode','uTex','uEye','uGlow','uDrop','uTime','uDay','uRain','uFogC']) this.u[n]=gl.getUniformLocation(p,n);
    gl.enable(gl.DEPTH_TEST); gl.enable(gl.CULL_FACE); gl.cullFace(gl.BACK);
    this.canvas=canvas;
  }
  buf(data,loc,size,type,norm){const gl=this.gl,b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,data,gl.STATIC_DRAW);
    gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,size,type,norm,0,0);}
  // part del personatge (dades del model.json)
  makePart(p){const gl=this.gl,v=gl.createVertexArray();gl.bindVertexArray(v);
    this.buf(b64(p.pos,Float32Array),0,3,gl.FLOAT,false);
    this.buf(b64(p.bi,Uint8Array),1,4,gl.UNSIGNED_BYTE,false);
    this.buf(b64(p.bw,Uint8Array),2,4,gl.UNSIGNED_BYTE,true);
    this.buf(b64(p.slot,Uint8Array),3,1,gl.UNSIGNED_BYTE,false);
    gl.vertexAttrib2f(4,0,0); gl.vertexAttrib3f(5,1,1,1);
    gl.bindVertexArray(null); return {vao:v,n:p.n};}
  // malla estàtica amb color per vèrtex (pos, col)
  makeStatic(pos,col,uv){const gl=this.gl,v=gl.createVertexArray();gl.bindVertexArray(v);
    this.buf(new Float32Array(pos),0,3,gl.FLOAT,false);
    if(col) this.buf(new Float32Array(col),5,3,gl.FLOAT,false); else gl.vertexAttrib3f(5,1,1,1);
    if(uv) this.buf(new Float32Array(uv),4,2,gl.FLOAT,false); else gl.vertexAttrib2f(4,0,0);
    gl.vertexAttrib4f(1,0,0,0,0);gl.vertexAttrib4f(2,1,0,0,0);gl.vertexAttrib1f(3,0);
    gl.bindVertexArray(null); return {vao:v,n:pos.length/3};}
  // dibuixa només uns triangles (per amagar la pell tapada per la roba)
  setTris(m,keepTri){const gl=this.gl; const idx=new Uint16Array(keepTri.length*3); keepTri.forEach((t,i)=>{idx[i*3]=t*3;idx[i*3+1]=t*3+1;idx[i*3+2]=t*3+2;});
    gl.bindVertexArray(m.vao); if(!m.ibo) m.ibo=gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,m.ibo); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,idx,gl.DYNAMIC_DRAW);
    gl.bindVertexArray(null); m.count=idx.length;}
  updateTexture(t,img){const gl=this.gl;gl.bindTexture(gl.TEXTURE_2D,t);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,img);gl.generateMipmap(gl.TEXTURE_2D);}
  texture(img){const gl=this.gl,t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,img);gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);return t;}
  begin(vp,eye,bg){const gl=this.gl,c=this.canvas;
    const dpr=Math.min(devicePixelRatio||1,1.5), w=c.clientWidth*dpr|0,h=c.clientHeight*dpr|0;
    if(c.width!==w||c.height!==h){c.width=w;c.height=h;}
    gl.viewport(0,0,c.width,c.height);gl.clearColor(...bg,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    gl.useProgram(this.prog);gl.uniformMatrix4fv(this.u.uVP,false,vp);gl.uniform3fv(this.u.uEye,eye);gl.uniform1f(this.u.uGlow,0);
    const W=this.env||{day:1,rain:0,fog:[.86,.92,1],t:0}; gl.uniform1f(this.u.uDay,W.day);gl.uniform1f(this.u.uRain,W.rain);gl.uniform3fv(this.u.uFogC,W.fog);gl.uniform1f(this.u.uTime,W.t);}
  draw(m,{model,bones,cols,mode=0,tex,glow=0,cull=true,drop=0}){const gl=this.gl; gl.uniform1i(this.u.uDrop,drop);
    if(m.bone!==undefined){gl.vertexAttrib4f(1,m.bone,0,0,0);gl.vertexAttrib4f(2,1,0,0,0);}  // malla rígida enganxada a un os
    gl.uniformMatrix4fv(this.u.uModel,false,model||M4.ident());
    gl.uniform1i(this.u.uSkin,bones?1:0); if(bones) gl.uniformMatrix4fv(this.u.uBones,false,bones);
    if(cols) gl.uniform3fv(this.u.uCol,cols);
    gl.uniform1i(this.u.uMode,mode); gl.uniform1f(this.u.uGlow,glow);
    if(tex){gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,tex);gl.uniform1i(this.u.uTex,0);}
    if(cull) gl.enable(gl.CULL_FACE); else gl.disable(gl.CULL_FACE);
    gl.bindVertexArray(m.vao); if(m.ibo) gl.drawElements(gl.TRIANGLES,m.count,gl.UNSIGNED_SHORT,0); else gl.drawArrays(gl.TRIANGLES,0,m.n);}
}

// Animacions: matrius per fotograma (31 ossos × 16)
class Anim{
  constructor(data){this.nb=data.bones.length;this.clips={};
    for(const [k,v] of Object.entries(data.anims)) this.clips[k]={n:v.n,m:b64(v.m,Float32Array)};
    this.out=new Float32Array(this.nb*16);}
  sample(name,t,dst){const c=this.clips[name],fps=30,L=this.nb*16;
    let f=t*fps%(c.n-1); if(f<0)f+=c.n-1; const i=f|0,a=f-i,A=i*L,B=(i+1)*L;
    for(let k=0;k<L;k++) dst[k]=c.m[A+k]*(1-a)+c.m[B+k]*a; return dst;}
  blend(a,ta,b,tb,w){const A=this.sample(a,ta,new Float32Array(this.nb*16)),B=this.sample(b,tb,new Float32Array(this.nb*16));
    for(let k=0;k<A.length;k++) this.out[k]=A[k]*(1-w)+B[k]*w; return this.out;}
}
