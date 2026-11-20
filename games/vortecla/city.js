// La ciutat: un carrer amb botigues (gelateria, botiga d'animals, joguines) i coses per portar a la mà.
'use strict';
const GATE=[-10.6,-3.4];                 // porta de la tanca (costat +x del jardí, z)
const CITY={x0:27,x1:99.6,z0:-19.6,z1:5.6};
// botigues fetes a mà: u lateral (0..8), d profunditat des de la façana; sg=+1 si l'edifici creix cap a +z
const SHOPS=[
  {id:'gelateria',x0:36.5,front:-1.5,sg:1,wall:[1,.86,.9],trim:[.95,.5,.68],aw:[[1,.55,.75],[1,1,1]],sign:'GELATERIA',floor:[[1,.92,.95],[1,1,1]]},
  {id:'joguines',x0:54.5,front:-1.5,sg:1,wall:[.82,.88,1],trim:[.5,.6,.95],aw:[[.55,.7,1],[1,.95,.6]],sign:'JOGUINES',floor:[[.9,.93,1],[1,1,1]]},
  {id:'animals',x0:45.5,front:-12.5,sg:-1,wall:[.86,1,.88],trim:[.4,.75,.5],aw:[[.45,.8,.55],[1,1,1]],sign:"BOTIGA D'ANIMALS",floor:[[.93,.97,.85],[1,1,1]]},
];
const SW=8, SD=8, SH=4.2;
function shopRoof(s){const z0=s.sg>0?s.front:s.front-SD, z1=s.sg>0?s.front+SD:s.front; return [s.x0,z0,s.x0+SW,z1,SH];}
function shopStation(s){return {x:s.x0+4,z:s.front+s.sg*3.3,yaw:s.sg>0?Math.PI:0};}

/* ---------- peces KayKit de ciutat ---------- */
let CITYM=null;
function placeKK(name,x,z,deg=0,s=4,o={}){
  const m=CITYM[name], a=deg*Math.PI/180, c=Math.cos(a), n=Math.sin(a), sy=o.sy||1, k=s/4000;
  const P=b64(m.pos,Int16Array), C=b64(m.col,Uint8Array);
  for(let i=0;i<m.n;i++){const px=P[i*3]*k,py=P[i*3+1]*k*sy,pz=P[i*3+2]*k;
    geo.pos.push(x+px*c+pz*n,py+(o.y||0),z-px*n+pz*c); geo.col.push(C[i*3]/255,C[i*3+1]/255,C[i*3+2]/255);}
  if(o.solid!==false){const X=[],Z=[];for(const px of [m.min[0]*s,m.max[0]*s])for(const pz of [m.min[2]*s,m.max[2]*s]){X.push(x+px*c+pz*n);Z.push(z-px*n+pz*c);}
    const bb=[Math.min(...X),Math.min(...Z),Math.max(...X),Math.max(...Z)]; solids.push(bb);
    if(m.max[1]*s>.6) occl.push([bb[0],0,bb[1],bb[2],m.max[1]*s*sy,bb[3]]);}
}

/* ---------- una botiga ---------- */
function buildShop(s){
  const W=(u,d)=>[s.x0+u,s.front+s.sg*d];
  const bx=(u0,y0,d0,u1,y1,d1,col,solid=true)=>{const a=W(u0,d0),b=W(u1,d1);box(Math.min(a[0],b[0]),y0,Math.min(a[1],b[1]),Math.max(a[0],b[0]),y1,Math.max(a[1],b[1]),col,solid);};
  const q=(p)=>p.map(([u,y,d])=>{const w=W(u,d);return [w[0],y,w[1]];});
  const quad2=(a,b,c,d,col)=>{quad(a,b,c,d,col);quad(d,c,b,a,col);};
  // terra
  for(let i=0;i<8;i++)for(let j=0;j<8;j++){const P=q([[i,.015,j],[i+1,.015,j],[i+1,.015,j+1],[i,.015,j+1]]);
    const c=(i+j)&1?s.floor[0]:s.floor[1]; if(s.sg>0) quad(P[3],P[2],P[1],P[0],c); else quad(P[0],P[1],P[2],P[3],c);}
  // parets
  bx(0,0,0,.25,SH,SD,s.wall); bx(SW-.25,0,0,SW,SH,SD,s.wall); bx(0,0,SD-.25,SW,SH,SD,s.wall);
  bx(0,0,0,2.5,.9,.25,s.trim); bx(5.5,0,0,SW,.9,.25,s.trim);                // sòcol dels aparadors
  for(const [u0,u1] of [[0,.35],[2.3,2.5],[5.5,5.7],[7.65,SW]]) bx(u0,0,-.03,u1,SH-.01,.28,s.wall);
  CARBLOCK.push(shopRoof(s).slice(0,4));
  bx(0,2.8,0,SW,SH,.25,s.wall,false);
  bx(.35,1.75,.05,2.3,1.82,.2,WHITE,false); bx(5.7,1.75,.05,7.65,1.82,.2,WHITE,false);   // travessers dels vidres
  bx(1.3,.9,.05,1.37,2.8,.2,WHITE,false); bx(6.6,.9,.05,6.67,2.8,.2,WHITE,false);
  bx(-.15,SH,-.15,SW+.15,SH+.25,SD+.15,s.trim,false); bx(0,SH-.02,0,SW,SH,SD,[1,1,1],false);
  // tendal de ratlles
  for(let i=0;i<10;i++){const u0=i*.8,u1=u0+.8,c=s.aw[i&1];
    const P=q([[u0,3.05,0],[u1,3.05,0],[u1,2.55,-1.3],[u0,2.55,-1.3]]); quad2(P[0],P[1],P[2],P[3],c);
    const F=q([[u0,2.55,-1.3],[u1,2.55,-1.3],[u1,2.3,-1.3],[u0,2.3,-1.3]]); quad2(F[0],F[1],F[2],F[3],c);}
  // taulell
  bx(1,0,5.2,7,1.0,6.0,s.trim); bx(.9,1.0,5.1,7.1,1.08,6.1,[1,1,1],false);
  // prestatges al fons
  for(const y of [1.3,2.0,2.7]) bx(.6,y,SD-.65,7.4,y+.07,SD-.25,[.95,.85,.75],false);
  SHOPDECO[s.id](s,bx,W);
  // rètol (textura) a sobre del tendal
  SIGNS.push({s,txt:s.sign});
}
const SHOPDECO={
  gelateria(s,bx){const F=[[1,.6,.7],[.45,.27,.15],[1,.95,.75],[1,.95,.45],[.6,.95,.75],[.6,.35,.65],[.7,.85,.45]];
    F.forEach((c,i)=>{const u=1.3+i*.8; bx(u,1.08,5.35,u+.6,1.2,5.85,[.85,.88,.95],false); bx(u+.05,1.18,5.4,u+.55,1.26,5.8,c,false);});
    for(let i=0;i<9;i++){const u=.9+i*.7, y=[1.3,2.0,2.7][i%3]+.07; const w=[s.x0+u+.3,s.front+s.sg*(SD-.45)];
      cyl(w[0],w[1],y,y+.3,.02,.11,[.85,.62,.35],8); ball(w[0],y+.38,w[1],.13,F[i%7],8);}
    // cucurutx gegant a la vorera
    const p=[s.x0+7.4,s.front-s.sg*.7]; cyl(p[0],p[1],0,1.6,.05,.4,[.85,.62,.35],10); ball(p[0],1.85,p[1],.45,[1,.6,.7],10); ball(p[0],2.4,p[1],.38,[1,.95,.75],10);
    solids.push([p[0]-.4,p[1]-.4,p[0]+.4,p[1]+.4]);},
  joguines(s,bx){
    for(let i=0;i<9;i++){const u=1+i*.7, y=[1.3,2.0,2.7][i%3]+.07, w=[s.x0+u+.3,s.front+s.sg*(SD-.45)], c=RAINBOW[i%7];
      if(i%3===0){ball(w[0],y+.18,w[1],.18,c,8);} else if(i%3===1){box(w[0]-.15,y,w[1]-.12,w[0]+.15,y+.3,w[1]+.12,c,false);box(w[0]-.1,y+.3,w[1]-.08,w[0]+.1,y+.45,w[1]+.08,[.85,.88,.95],false);}
      else {ball(w[0],y+.15,w[1],.15,[.75,.52,.32],8);ball(w[0],y+.38,w[1],.11,[.75,.52,.32],8);}}
    for(const [u,i] of [[.75,0],[7.25,2]]){const w=[s.x0+u,s.front+s.sg*5.6]; cyl(w[0],w[1],1.08,2.2,.006,.006,[1,1,1],4); ball(w[0],2.35,w[1],.2,RAINBOW[i],8);}
    const p=[s.x0+7.3,s.front-s.sg*.8]; ball(p[0],.55,p[1],.55,[.75,.52,.32],10); ball(p[0],1.35,p[1],.4,[.75,.52,.32],10);
    ball(p[0]-.3,1.68,p[1],.14,[.75,.52,.32],8); ball(p[0]+.3,1.68,p[1],.14,[.75,.52,.32],8); solids.push([p[0]-.5,p[1]-.5,p[0]+.5,p[1]+.5]);},
  animals(s,bx){
    // peixera i gàbies
    bx(1.2,1.08,5.3,3.2,1.9,5.9,[.55,.8,1],false);
    for(let i=0;i<4;i++){const w=[s.x0+1.5+i*.45,s.front+s.sg*5.6]; box(w[0]-.08,1.3+i%2*.25,w[1]-.03,w[0]+.08,1.4+i%2*.25,w[1]+.03,[1,.6,.25],false);}
    for(let i=0;i<3;i++){const u=1+i*2.2; bx(u,1.37,SD-.6,u+1.6,2.0,SD-.3,[.9,.9,.95],false); bx(u+.05,1.37,SD-.62,u+1.55,1.95,SD-.6,[.78,.6,.4],false);}
    for(let i=0;i<4;i++){const w=[s.x0+1.6+i*1.6,s.front+s.sg*(SD-.45)]; box(w[0]-.3,2.07,w[1]-.15,w[0]+.3,2.12,w[1]+.15,[.6,.45,.3],false);}
    bx(4.2,1.08,5.4,6.6,1.25,5.9,[.95,.85,.6],false);   // cistella de menjar
    const p=[s.x0+7.4,s.front-s.sg*.8]; box(p[0]-.35,0,p[1]-.25,p[0]+.35,.45,p[1]+.25,[1,.8,.55],true); box(p[0]-.25,.45,p[1]-.2,p[0]+.25,.75,p[1]+.2,[1,.8,.55],false);
    box(p[0]-.22,.75,p[1]-.2,p[0]-.12,.9,p[1]-.1,[1,.8,.55],false); box(p[0]+.12,.75,p[1]-.2,p[0]+.22,.9,p[1]-.1,[1,.8,.55],false);},
};
const SIGNS=[], CARBLOCK=[];
async function buildSigns(){
  try{await document.fonts.load('40px "Pixelify Sans"');}catch(e){}
  for(const {s,txt} of SIGNS){
    const cv=document.createElement('canvas'); cv.width=1024; cv.height=160; const g=cv.getContext('2d');
    g.fillStyle='#fff'; g.fillRect(0,0,1024,160); g.fillStyle=`rgb(${s.trim.map(v=>v*255|0)})`; g.fillRect(0,0,1024,14); g.fillRect(0,146,1024,14);
    g.font='bold 104px "Pixelify Sans", sans-serif'; g.textAlign='center'; g.textBaseline='middle';
    const sz=Math.min(104,104*920/g.measureText(txt).width); g.font=`bold ${sz}px "Pixelify Sans", sans-serif`; g.fillText(txt,512,84);
    const L=W2(s,.6,-.06), R=W2(s,7.4,-.06), y0=3.15, y1=3.95;
    // es veu des del carrer: d'esquerra a dreta segons on mira la façana
    const A=s.sg>0?R:L, B=s.sg>0?L:R;
    const pos=[A[0],y0,A[1], B[0],y0,B[1], B[0],y1,B[1], A[0],y0,A[1], B[0],y1,B[1], A[0],y1,A[1]];
    ART.push({m:E.makeStatic(pos,null,[0,1,1,1,1,0,0,1,1,0,0,0]),t:E.texture(cv)});}
}
function W2(s,u,d){return [s.x0+u,s.front+s.sg*d];}

/* ---------- el carrer ---------- */
function buildCity(){
  // terra fora del jardí
  for(let i=46;i<128;i+=4)for(let j=-46;j<46;j+=4){const c=((i+j)/4&1)?[.55,.83,.5]:[.6,.87,.54]; quad([i,-.02,j+4],[i+4,-.02,j+4],[i+4,-.02,j],[i,-.02,j],c);}
  quad([27,-.005,-1.5],[100,-.005,-1.5],[100,-.005,-12.5],[27,-.005,-12.5],[.82,.82,.84]);   // voreres
  quad([84,-.004,12],[112,-.004,12],[112,-.004,-26],[84,-.004,-26],[.88,.85,.82]);           // plaça
  // camí del jardí fins a la porta
  quad([20,-.008,-3.6],[27,-.008,-3.6],[27,-.008,-10.4],[20,-.008,-10.4],[.88,.85,.82]);
  for(let x=27+4;x<84;x+=8) placeKK('road_straight',x,-7,90,4,{sy:.12,solid:false});
  // edificis KayKit (davant cap al carrer)
  const N=[['building_A',31.5],['building_C',49.5],['building_E',67.5],['building_G',76.5]];
  const S=[['building_B',31.5],['building_D',40.5],['building_F',58.5],['building_H',67.5],['building_A',76.5]];
  for(const [b,x] of N) placeKK(b,x,2.5,180);
  for(const [b,x] of S) placeKK(b,x,-16.5,0);
  for(const s of SHOPS) buildShop(s);
  // tancar els forats entre edificis
  for(const z of [[-1.5,6.5],[-20.5,-12.5]]) for(let x=27;x<84;x+=1){}
  solids.push([27,-1.5,28,6.5],[27,-20.5,28,-12.5]);
  for(const [a,b] of [[35.5,36.5],[44.5,45.5],[53.5,54.5],[62.5,63.5],[71.5,72.5],[80.5,84]]) solids.push([a,-1.4,b,6.5]);
  for(const [a,b] of [[35.5,36.5],[44.5,45.5],[53.5,54.5],[62.5,63.5],[71.5,72.5],[80.5,84]]) solids.push([a,-20.5,b,-12.6]);
  for(const [a,b] of [[80.5,84]]){box(a,0,-1.4,b,1.2,6,[.4,.72,.45]);box(a,0,-20.5,b,1.2,-12.6,[.4,.72,.45]);}
  // fanals, bancs, arbustos
  for(const x of [36,45,54,63,72,81]){placeKK('streetlight',x,-2.1,90,4); placeKK('streetlight',x,-11.9,-90,4);}
  for(const [x,z,d] of [[34,-2.2,180],[61,-2.2,180],[56,-11.8,0],[38,-11.8,0]]) placeKK('bench',x,z,d,4);
  for(const [x,z] of [[52.6,-2],[65,-12],[44.9,-12]]) placeKK('firehydrant',x,z,0,4);
  // plaça del final: rotonda ampla al voltant de la font
  {const fx=98,fz=-7, R0=3.0, R1=11, N=48;
    for(let i=0;i<N;i++){const a0=i/N*Math.PI*2,a1=(i+1)/N*Math.PI*2, P=(r,a,y)=>[fx+Math.cos(a)*r,y,fz+Math.sin(a)*r];
      quad(P(R0,a0,.002),P(R0,a1,.002),P(R1,a1,.002),P(R1,a0,.002),[.4,.42,.46]);
      if(i%2===0) quad(P(6.85,a0,.004),P(6.85,a1,.004),P(7.15,a1,.004),P(7.15,a0,.004),[1,1,1]);
      if(Math.abs((a0+a1)/2-Math.PI)>.42) quad(P(R1,a0,.003),P(R1,a1,.003),P(R1+.35,a1,.003),P(R1+.35,a0,.003),[.95,.75,.3]);}
    quad([84,.002,-3],[fx-R1+.5,.002,-3],[fx-R1+.5,.002,-11],[84,.002,-11],[.4,.42,.46]);
    solids.push([fx-2.4,fz-2.4,fx+2.4,fz+2.4]); cyl(fx,fz,0,.55,2.4,2.3,[.95,.95,.97],20);cyl(fx,fz,.54,.57,2.15,2.15,[.55,.78,1],20);
    cyl(fx,fz,.55,1.8,.25,.2,[.95,.95,.97],8);cyl(fx,fz,1.8,1.95,.8,.7,[.95,.95,.97],14);ball(fx,2.3,fz,.35,[1,.62,.8],10);
    for(const [x,z,k] of [[86.5,10,2],[110,10,0],[110,-24,2],[86.5,-24,1]]){tree(x,z,1.2,k); solids.push([x-.45,z-.45,x+.45,z+.45]);}
    for(const [x,z,d] of [[94,11.4,180],[102,11.4,180],[94,-25.4,0],[102,-25.4,0]]) placeKK('bench',x,z,d,4);}
  // bardissa al voltant de la plaça
  box(84,0,12,112,1.1,12.6,[.4,.72,.45]); box(84,0,-26.6,112,1.1,-26,[.4,.72,.45]); box(112,0,-26.6,112.6,1.1,12.6,[.4,.72,.45]);
  box(83.4,0,6,84,1.1,12,[.4,.72,.45]); box(83.4,0,-26,84,1.1,-20.5,[.4,.72,.45]);
  // edificis de fons (darrere la plaça, més enllà de la bardissa)
  for(const [b,x,z,d] of [['building_E',118,-14,270],['building_C',118,0,270],['building_H',98,19,180],['building_G',98,-33,0]]) placeKK(b,x,z,d,4,{solid:false});
}

/* ---------- límits del món: jardí + porta + carrer ---------- */
function allowed(x,z,r){
  if(Math.abs(x)<=26.3-r&&Math.abs(z)<=26.3-r) return true;
  if(x>20&&x<30&&z>=GATE[0]+r&&z<=GATE[1]-r) return true;
  if(x>=84&&x<=111.4-r&&z>=-25.4+r&&z<=11.4-r) return true;
  return x>=27&&x<=84&&z>=CITY.z0+r&&z<=CITY.z1-r;
}
function boundSlide(o,ox,oz,r){ if(allowed(o.x,o.z,r)) return;
  if(allowed(o.x,oz,r)){o.z=oz;return;} if(allowed(ox,o.z,r)){o.x=ox;return;} o.x=ox;o.z=oz; }

/* ---------- coses a la mà ---------- */
const FLAVORS={maduixa:[1,.6,.7],xocolata:[.45,.27,.15],vainilla:[1,.95,.75],llimona:[1,.93,.42],menta:[.6,.95,.75],mora:[.6,.35,.65],'pistatxo':[.7,.85,.45]};
let HANDM=null, HANDINV=null, HANDG=null;
function inv4(m){const o=new Float32Array(16);
  const a00=m[0],a01=m[1],a02=m[2],a03=m[3],a10=m[4],a11=m[5],a12=m[6],a13=m[7],a20=m[8],a21=m[9],a22=m[10],a23=m[11],a30=m[12],a31=m[13],a32=m[14],a33=m[15];
  const b00=a00*a11-a01*a10,b01=a00*a12-a02*a10,b02=a00*a13-a03*a10,b03=a01*a12-a02*a11,b04=a01*a13-a03*a11,b05=a02*a13-a03*a12,
    b06=a20*a31-a21*a30,b07=a20*a32-a22*a30,b08=a20*a33-a23*a30,b09=a21*a32-a22*a31,b10=a21*a33-a23*a31,b11=a22*a33-a23*a32;
  const det=1/(b00*b11-b01*b10+b02*b09+b03*b08-b04*b07+b05*b06);
  o[0]=(a11*b11-a12*b10+a13*b09)*det;o[1]=(a02*b10-a01*b11-a03*b09)*det;o[2]=(a31*b05-a32*b04+a33*b03)*det;o[3]=(a22*b04-a21*b05-a23*b03)*det;
  o[4]=(a12*b08-a10*b11-a13*b07)*det;o[5]=(a00*b11-a02*b08+a03*b07)*det;o[6]=(a32*b02-a30*b05-a33*b01)*det;o[7]=(a20*b05-a22*b02+a23*b01)*det;
  o[8]=(a10*b10-a11*b08+a13*b06)*det;o[9]=(a01*b08-a00*b10-a03*b06)*det;o[10]=(a30*b04-a31*b02+a33*b00)*det;o[11]=(a21*b02-a20*b04-a23*b00)*det;
  o[12]=(a11*b07-a10*b09-a12*b06)*det;o[13]=(a00*b09-a01*b07+a02*b06)*det;o[14]=(a31*b01-a30*b03-a32*b00)*det;o[15]=(a20*b03-a21*b01+a22*b00)*det;return o;}
function handSetup(){
  const bi=D.bones.indexOf('HandMiddle_Right'), M=A.sample('idle',0,new Float32Array(D.bones.length*16)).slice(bi*16,bi*16+16);
  const p=D.bind['HandMiddle_Right'];
  HANDG=[M[0]*p[0]+M[4]*p[1]+M[8]*p[2]+M[12], M[1]*p[0]+M[5]*p[1]+M[9]*p[2]+M[13], M[2]*p[0]+M[6]*p[1]+M[10]*p[2]+M[14]];
  HANDINV=inv4(M); HANDM={bone:bi};
}
// geometria en l'espai del personatge dret (y amunt, z endavant), amb origen al puny
const HANDGEO={
  gelat(it){cyl(0,0,-.07,.13,.008,.05,[.88,.64,.36],10); it.scoops.forEach((f,i)=>ball(0,.17+i*.075,0,.058,FLAVORS[f],9));},
  gatet(c){box(-.06,-.02,-.08,.06,.09,.06,c);box(-.055,.06,.04,.055,.15,.13,c);box(-.05,.15,.06,-.02,.19,.09,c);box(.02,.15,.06,.05,.19,.09,c);
    box(-.035,.11,.13,-.015,.125,.135,[.1,.1,.1]);box(.015,.11,.13,.035,.125,.135,[.1,.1,.1]);box(-.01,.09,.13,.01,.1,.14,[1,.6,.7]);box(-.012,.06,-.12,.012,.08,-.07,c);box(-.012,.08,-.14,.012,.17,-.11,c);},
  gosset(c){box(-.065,-.02,-.09,.065,.1,.07,c);box(-.06,.07,.04,.06,.17,.13,c);box(-.035,.07,.13,.035,.12,.18,c);box(-.012,.105,.18,.012,.125,.19,[.1,.1,.1]);
    box(-.08,.08,.05,-.06,.16,.1,shade(c,.7));box(.06,.08,.05,.08,.16,.1,shade(c,.7));box(-.035,.13,.13,-.015,.145,.135,[.1,.1,.1]);box(.015,.13,.13,.035,.145,.135,[.1,.1,.1]);box(-.01,.08,-.13,.01,.15,-.09,c);},
  conill(c){ball(0,.03,-.01,.07,c,8);ball(0,.12,.05,.055,c,8);box(-.04,.16,.04,-.015,.27,.065,c);box(.015,.16,.04,.04,.27,.065,c);
    box(-.035,.18,.045,-.02,.26,.068,[1,.7,.8]);box(.02,.18,.045,.035,.26,.068,[1,.7,.8]);box(-.03,.13,.1,-.015,.145,.105,[.1,.1,.1]);box(.015,.13,.1,.03,.145,.105,[.1,.1,.1]);ball(0,.04,-.08,.025,[1,1,1],6);},
  pollet(c){ball(0,.04,0,.07,c,9);ball(0,.13,.02,.05,c,8);box(-.012,.12,.065,.012,.14,.095,[1,.55,.2]);box(-.03,.15,.06,-.015,.165,.065,[.1,.1,.1]);box(.015,.15,.06,.03,.165,.065,[.1,.1,.1]);},
  tortuga(c){cyl(0,0,.0,.07,.1,.07,c,8);ball(0,.07,0,.07,shade(c,1.15),8);box(-.025,.0,.09,.025,.05,.15,[.6,.8,.45]);box(-.07,-.02,.05,-.04,.02,.08,[.6,.8,.45]);box(.04,-.02,.05,.07,.02,.08,[.6,.8,.45]);},
  peix(c){box(-.06,-.24,-.06,.06,-.04,.06,[.72,.88,1]);box(-.015,-.04,-.015,.015,.02,.015,[.72,.88,1]);
    box(-.035,-.16,-.012,.025,-.12,.012,c);box(.025,-.17,-.008,.045,-.11,.008,c);box(-.022,-.15,.012,-.012,-.14,.016,[.1,.1,.1]);},
  osset(c){ball(0,.02,.02,.075,c,8);ball(0,.13,.03,.06,c,8);ball(-.045,.18,.03,.022,c,6);ball(.045,.18,.03,.022,c,6);ball(0,.115,.085,.022,shade(c,1.25),6);
    box(-.03,.14,.085,-.015,.155,.09,[.1,.1,.1]);box(.015,.14,.085,.03,.155,.09,[.1,.1,.1]);ball(-.06,-.05,.04,.025,c,6);ball(.06,-.05,.04,.025,c,6);},
  pilota(c){ball(0,.0,.06,.11,c,12);cyl(0,.06,-.012,.012,.112,.112,[1,1,1],12,false);},
  globus(c){cyl(0,0,0,.95,.003,.003,[1,1,1],4);ball(0,1.12,0,.16,c,12);cyl(0,0,.93,.97,.02,.0,c,6);},
  robot(c){box(-.05,-.05,-.04,.05,.07,.05,c);box(-.04,.07,-.035,.04,.14,.045,shade(c,1.2));box(-.025,.1,.045,-.01,.115,.05,[.3,1,1]);box(.01,.1,.045,.025,.115,.05,[.3,1,1]);
    box(-.004,.14,-.004,.004,.18,.004,[.6,.6,.65]);ball(0,.185,0,.012,[1,.3,.3],6);box(-.04,-.1,-.02,-.01,-.05,.02,[.6,.6,.65]);box(.01,-.1,-.02,.04,-.05,.02,[.6,.6,.65]);},
  vareta(c){cyl(0,0,-.04,.32,.006,.006,[1,1,1],6);
    const st=[];for(let i=0;i<10;i++){const a=i/10*Math.PI*2+Math.PI/2,r=i&1?.03:.07;st.push([Math.cos(a)*r,.38+Math.sin(a)*r]);}
    for(let i=0;i<10;i++){const p=st[i],q=st[(i+1)%10]; for(const z of [.012,-.012]){geo.pos.push(0,.38,z,p[0],p[1],z,q[0],q[1],z, 0,.38,z,q[0],q[1],z,p[0],p[1],z); for(let k=0;k<6;k++)geo.col.push(...c);}}},
  molinet(c){cyl(0,0,-.04,.32,.006,.006,[1,1,1],6);
    for(let i=0;i<4;i++){const a=i*Math.PI/2,b=a+.9,col=i&1?[1,1,1]:c; const p=[0,.36,.02],q=[Math.cos(a)*.09,.36+Math.sin(a)*.09,.02],r=[Math.cos(b)*.07,.36+Math.sin(b)*.07,.04];
      geo.pos.push(...p,...q,...r,...p,...r,...q); for(let k=0;k<6;k++)geo.col.push(...col);}},
};
function buildHand(){ if(!HANDINV) return;
  const it=outfit.hand; if(!it){HANDM.mesh=null;return;}
  const save=geo, ns=solids.length, no=occl.length; geo={pos:[],col:[]};
  if(it.kind==='gelat') HANDGEO.gelat(it); else HANDGEO[it.kind](COLORS[it.c1].c);
  const M=HANDINV, G=HANDG, out=[];
  const K=1.55; for(let i=0;i<geo.pos.length;i+=3){const x=geo.pos[i]*K+G[0]-.005,y=geo.pos[i+1]*K+G[1]-.02,z=geo.pos[i+2]*K+G[2]+.07;
    out.push(M[0]*x+M[4]*y+M[8]*z+M[12],M[1]*x+M[5]*y+M[9]*z+M[13],M[2]*x+M[6]*y+M[10]*z+M[14]);}
  const m=E.makeStatic(out,geo.col); m.bone=HANDM.bone; HANDM.mesh=m; geo=save; solids.length=ns; occl.length=no;
}
