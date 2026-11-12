'use strict';
/* =================== DADES DEL JOC =================== */
const COLORS={
  r:{n:'rosa',c:[1,.62,.8]}, f:{n:'fúcsia',c:[.93,.22,.6]}, l:{n:'lila',c:[.68,.52,.95]}, b:{n:'blau',c:[.36,.62,1]},
  v:{n:'verd',c:[.42,.8,.48]}, g:{n:'groc',c:[1,.86,.3]}, t:{n:'taronja',c:[1,.56,.25]}, m:{n:'marró',c:[.48,.29,.17]},
  n:{n:'negre',c:[.16,.14,.17]}, c:{n:'crema',c:[1,.95,.86]},
};
const SKIN=[1,.79,.65];
// Cada parada: paraula, posició, opcions (paraula a escriure → peces)
const STATIONS=[
  {id:'pentinat',room:'perruqueria',x:-11.7,z:-10.4,slot:'hair',opts:[
    {w:'melena',p:['Hair_Normal','SecondHair_NormalLong']},
    {w:'cua',p:['Hair_Normal','SecondHair_PonytailLong']},
    {w:'monyo',p:['Hair_Normal','SecondHair_Ball']},
    {w:'dos monyos',p:['Hair_Normal','SecondHair_DoubleBall_Small']},
    {w:'princesa',p:['Hair_Normal','SecondHair_Leia']},
    {w:'serrell',p:['Hair_EmoToLeft','SecondHair_NormalMedium']},
    {w:'curt',p:['Hair_Normal']},
    {w:'arrissat',p:['Hair_BlackPowerSmall']},
  ]},
  {id:'barba',room:'perruqueria',x:-8.3,z:-10.4,slot:'beard',one:true,opts:[
    {w:'bigoti',p:['Beard_MoustacheBig']},
    {w:'bigotet',p:['Beard_MoustacheSmall']},
    {w:'perilla',p:['Beard_GoateeShort']},
    {w:'barbeta',p:['Beard_GoateeLong']},
    {w:'barba',p:['Beard_ChopBig']},
    {w:'patilles',p:['Beard_ChopSmall']},
    {w:'mosqueter',p:['Beard_Circled']},
    {w:'sense',p:[],none:true},
  ]},
  {id:'samarreta',room:'armari',x:-2.4,z:-10.4,slot:'top',opts:[
    {w:'samarreta',p:['ClothesUp_T-Shirt']},
    {w:'tirants',p:['ClothesUp_TankTop']},
    {w:'jersei',p:['ClothesUp_SweaterLong']},
    {w:'jaqueta',p:['ClothesUp_BigJacket']},
  ]},
  {id:'vestit',room:'vestidor',x:10,z:-10.4,slot:'top',dress:true,opts:[
    {w:'curt',p:['ClothesUp_DressRegularShort']},
    {w:'llarg',p:['ClothesUp_DressRegularLong']},
    {w:'princesa',p:['ClothesUp_DressFancy']},
    {w:'granota',p:['ClothesUp_OverallLong']},
  ]},
  {id:'pantalons',room:'armari',x:2.4,z:-10.4,slot:'bottom',opts:[
    {w:'texans',p:['ClothesBottom_RegularPantsLong']},
    {w:'malles',p:['ClothesBottom_SkinnyPantsLong']},
    {w:'curts',p:['ClothesBottom_LargeShorts']},
    {w:'faldilla',p:['ClothesBottom_SkirtMedium']},
    {w:'minifaldilla',p:['ClothesBottom_SkirtShort']},
    {w:'campana',p:['ClothesBottom_bell-bottomPants']},
  ]},
  {id:'sabates',room:'sabateria',x:-10,z:10.4,slot:'shoes',opts:[
    {w:'bambes',p:['Shoes_Sport']},
    {w:'botes',p:['Shoes_Boots']},
    {w:'ballarines',p:['Shoes_BalletShoes']},
    {w:'sabates',p:['Shoes_Regular']},
    {w:'esclops',p:['Shoes_Crocs']},
    {w:'xancletes',p:['Shoes_slipper']},
    {w:'mocassins',p:['Shoes_Casual']},
  ]},
  {id:'complements',room:'joieria',x:0,z:10.4,slot:'acc',opts:[
    {w:'gorra',p:['Accessories_Cap']},
    {w:'barret',p:['Accessories_RegularHat']},
    {w:'orelles de gat',p:['Accessories_TiaraCat']},
    {w:'orelles de conill',p:['Accessories_TiaraBunny']},
    {w:'ulleres',p:['Accessories_GlassesRounded']},
    {w:'auriculars',p:['Accessories_HeadPhones']},
    {w:'cinta',p:['Accessories_Strip']},
    {w:'arracades',p:['Accessories_EarringLeft','Accessories_EarringRight']},
  ]},
];
STATIONS.forEach(s=>{s.yaw=s.z<0?0:Math.PI;});

/* =================== ESTAT =================== */
const outfit={
  hair:null,                                                    // sota la tovallola
  beard:null,
  top:{p:['ClothesUp_DressRegularLong'],c1:'r',c2:'c',dress:true,robe:true}, // barnús
  bottom:null,
  shoes:{p:['Shoes_slipper'],c1:'r',c2:'c'},
  acc:{p:['Accessories_Hood'],c1:'c',c2:'r',towel:true},        // tovallola al cap
};
const player={x:0,z:1.5,yaw:Math.PI,anim:0,walkT:0,idleT:0,wave:0,speed:0};
let mode='walk', station=null, buf='', step='pick', lockStation=null, locks={}, got=new Set();
const keys={};

/* =================== ESCENARI =================== */
let geo={pos:[],col:[]}; const solids=[], occl=[];
function quad(a,b,c,d,col){geo.pos.push(...a,...b,...c,...a,...c,...d);for(let i=0;i<6;i++)geo.col.push(...col);}
function shade(c,k){return c.map(v=>Math.min(1,v*k));}
function box(x0,y0,z0,x1,y1,z1,col,solid=true){
  quad([x0,y1,z1],[x1,y1,z1],[x1,y1,z0],[x0,y1,z0],col);
  quad([x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1],col);
  quad([x1,y0,z0],[x0,y0,z0],[x0,y1,z0],[x1,y1,z0],col);
  quad([x1,y0,z1],[x1,y0,z0],[x1,y1,z0],[x1,y1,z1],col);
  quad([x0,y0,z0],[x0,y0,z1],[x0,y1,z1],[x0,y1,z0],col);
  if(y0>0.01) quad([x0,y0,z0],[x1,y0,z0],[x1,y0,z1],[x0,y0,z1],col);
  if(solid&&y0<1.2) solids.push([x0,z0,x1,z1]);
  if(y1-y0>.3) occl.push([x0,y0,z0,x1,y1,z1]);
}
const XW=15, ZW=14, H=3.3, DOOR=1.35, WY0=1.15, WY1=2.6;
// habitacions: rectangle + colors (paret, sòcol, terra A, terra B)
const ROOMS={
  hall:{x0:-XW,x1:XW,z0:-5,z1:5,wall:[.98,.7,.82],low:[.92,.5,.68],fa:[1,.84,.91],fb:[1,.95,.97]},
  perruqueria:{x0:-XW,x1:-5,z0:-ZW,z1:-5,wall:[1,.76,.86],low:[.95,.52,.7],fa:[1,.9,.94],fb:[1,1,1]},
  armari:{x0:-5,x1:5,z0:-ZW,z1:-5,wall:[.85,.78,.98],low:[.68,.56,.9],fa:[.93,.89,1],fb:[1,1,1]},
  vestidor:{x0:5,x1:XW,z0:-ZW,z1:-5,wall:[1,.8,.82],low:[.93,.55,.62],fa:[1,.88,.9],fb:[1,.97,.97]},
  sabateria:{x0:-XW,x1:-5,z0:5,z1:ZW,wall:[.76,.93,.87],low:[.48,.8,.68],fa:[.88,.98,.94],fb:[1,1,1]},
  joieria:{x0:-5,x1:5,z0:5,z1:ZW,wall:[1,.93,.75],low:[.96,.76,.42],fa:[1,.97,.88],fb:[1,1,1]},
  sala:{x0:5,x1:XW,z0:5,z1:ZW,wall:[1,.86,.8],low:[.93,.6,.58],fa:[.97,.88,.8],fb:[1,.95,.9]},
};
const ROOMNAME={perruqueria:'pentinat',armari:'samarreta · pantalons',vestidor:'vestit',sabateria:'sabates',joieria:'complements',sala:"sala d'estar"};
const DOORS=[['perruqueria',-10,-5],['armari',0,-5],['vestidor',10,-5],['sabateria',-10,5],['joieria',0,5],['sala',10,5]];
function roomAt(x,z){for(const [k,r] of Object.entries(ROOMS)) if(x>=r.x0&&x<=r.x1&&z>=r.z0&&z<=r.z1&&k!=='hall') return k; return 'hall';}
const WHITE=[1,1,1];
// cara de paret (vista des de dins) d'a a b, amb finestres [u0,u1] (distància des d'a)
function wallFace(a,b,r,wins=[]){
  const L=Math.hypot(b[0]-a[0],b[1]-a[1]), dx=(b[0]-a[0])/L, dz=(b[1]-a[1])/L;
  const P=u=>[a[0]+dx*u,a[1]+dz*u];
  const seg=(u0,u1,y0,y1,c)=>{const p=P(u0),q=P(u1);quad([p[0],y0,p[1]],[q[0],y0,q[1]],[q[0],y1,q[1]],[p[0],y1,p[1]],c);};
  seg(0,L,0,.95,r.low); seg(0,L,.95,1.05,WHITE); seg(0,L,1.05,WY0,r.wall); seg(0,L,WY1,H,r.wall);
  let u=0; for(const [u0,u1] of wins){seg(u,u0,WY0,WY1,r.wall);u=u1;} seg(u,L,WY0,WY1,r.wall);
  // marcs de finestra (normal cap endins = (-dz,dx))
  const nx=-dz, nz=dx;
  for(const [u0,u1] of wins){
    const fr=(ua,ub,y0,y1,d0,d1)=>{const p=P(ua),q=P(ub);const xs=[p[0]+nx*d0,q[0]+nx*d1,p[0]+nx*d1,q[0]+nx*d0],zs=[p[1]+nz*d0,q[1]+nz*d1,p[1]+nz*d1,q[1]+nz*d0];
      box(Math.min(...xs),y0,Math.min(...zs),Math.max(...xs),y1,Math.max(...zs),WHITE,false);};
    fr(u0-.12,u1+.12,WY0-.1,WY0,-.25,.18);           // ampit
    fr(u0-.12,u1+.12,WY1,WY1+.1,-.25,.06);           // llinda
    fr(u0-.12,u0,WY0,WY1,-.25,.06); fr(u1,u1+.12,WY0,WY1,-.25,.06);
    const m=(u0+u1)/2; fr(m-.04,m+.04,WY0,WY1,-.08,.0); fr(u0,u1,(WY0+WY1)/2-.04,(WY0+WY1)/2+.04,-.08,0);
    // cortines
    fr(u0-.42,u0-.12,WY0-.3,WY1+.15,.02,.12); fr(u1+.12,u1+.42,WY0-.3,WY1+.15,.02,.12);
  }
}
const CURT={};
const WT=.15;
function slabZ(z,x0,x1,rn,rp){
  wallFace([x1,z-WT],[x0,z-WT],ROOMS[rn]); wallFace([x0,z+WT],[x1,z+WT],ROOMS[rp]);
  for(const x of [x0,x1]){ if(x===x0) quad([x,0,z-WT],[x,0,z+WT],[x,H,z+WT],[x,H,z-WT],WHITE); else quad([x,0,z+WT],[x,0,z-WT],[x,H,z-WT],[x,H,z+WT],WHITE);}
  solids.push([x0,z-WT,x1,z+WT]); occl.push([x0,0,z-WT,x1,H,z+WT]);
}
function slabX(x,z0,z1,rn,rp){
  wallFace([x-WT,z0],[x-WT,z1],ROOMS[rn]); wallFace([x+WT,z1],[x+WT,z0],ROOMS[rp]);
  solids.push([x-WT,z0,x+WT,z1]); occl.push([x-WT,0,z0,x+WT,H,z1]);
}
function lintel(x,z){box(x-DOOR,2.55,z-WT-.02,x+DOOR,H,z+WT+.02,[.98,.94,.96],false);
  box(x-DOOR-.14,0,z-WT-.06,x-DOOR+.04,2.65,z+WT+.06,WHITE,false);box(x+DOOR-.04,0,z-WT-.06,x+DOOR+.14,2.65,z+WT+.06,WHITE,false);
  box(x-DOOR-.14,2.55,z-WT-.06,x+DOOR+.14,2.68,z+WT+.06,WHITE,false);}

/* ---------- formes ---------- */
function cyl(cx,cz,y0,y1,r0,r1,col,seg=12,caps=true){
  for(let i=0;i<seg;i++){const a=i/seg*6.2832,b=(i+1)/seg*6.2832,ca=Math.cos(a),sa=Math.sin(a),cb=Math.cos(b),sb=Math.sin(b);
    quad([cx+ca*r0,y0,cz-sa*r0],[cx+cb*r0,y0,cz-sb*r0],[cx+cb*r1,y1,cz-sb*r1],[cx+ca*r1,y1,cz-sa*r1],col);
    if(caps){geo.pos.push(cx,y1,cz, cx+ca*r1,y1,cz-sa*r1, cx+cb*r1,y1,cz-sb*r1); for(let k=0;k<3;k++)geo.col.push(...col);
      geo.pos.push(cx,y0,cz, cx+cb*r0,y0,cz-sb*r0, cx+ca*r0,y0,cz-sa*r0); for(let k=0;k<3;k++)geo.col.push(...col);}}
}
function ball(cx,cy,cz,r,col,seg=10){const st=5;
  for(let j=0;j<st;j++){const a0=-Math.PI/2+j/st*Math.PI,a1=-Math.PI/2+(j+1)/st*Math.PI;
    cyl(cx,cz,cy+Math.sin(a0)*r,cy+Math.sin(a1)*r,Math.cos(a0)*r,Math.cos(a1)*r,col,seg,false);}}
function tree(x,z,s=1,kind=0){
  box(x-.15*s,0,z-.15*s,x+.15*s,1.1*s,z+.15*s,[.55,.36,.24],false);
  if(kind===0){ball(x,1.9*s,z,1.0*s,[.42,.75,.42],9);ball(x+.45*s,1.6*s,z+.2*s,.6*s,[.5,.82,.48],8);}
  else if(kind===1){cyl(x,z,1.0*s,2.4*s,1.0*s,.15*s,[.32,.66,.45],9);cyl(x,z,1.9*s,3.2*s,.75*s,.05*s,[.38,.72,.5],9);}
  else {ball(x,1.8*s,z,.95*s,[1,.75,.86],9);ball(x-.4*s,1.5*s,z-.2*s,.55*s,[1,.82,.9],8);}
}

/* ---------- mobles KayKit ---------- */
let FUR=null, KREF={};
const PAL={rosa:[1,.62,.8],fucsia:[.95,.38,.68],lila:[.76,.62,.98],menta:[.55,.88,.76],blanc:[1,.97,.97],crema:[1,.93,.82],
  blau:[.55,.75,1],groc:[1,.86,.45]};
function place(name,x,z,deg=0,o={}){
  const m=FUR[name], s=.75*(o.s||1), y=o.y||0, a=deg*Math.PI/180, c=Math.cos(a), n=Math.sin(a);
  const P=b64(m.pos,Float32Array), C=b64(m.col,Uint8Array), K=b64(m.kind,Uint8Array);
  const map={1:o.wood,2:o.fab,3:o.fab2||o.fab,4:o.acc};
  for(let i=0;i<m.n;i++){
    const px=P[i*3]*s,py=P[i*3+1]*s,pz=P[i*3+2]*s;
    geo.pos.push(x+px*c+pz*n, y+py, z-px*n+pz*c);
    let r=C[i*3]/255,g=C[i*3+1]/255,b=C[i*3+2]/255; const k=K[i], t=map[k]&&PAL[map[k]];
    if(t){const l=Math.max(r,g,b)/KREF[k]; r=Math.min(1,t[0]*l); g=Math.min(1,t[1]*l); b=Math.min(1,t[2]*l);}
    geo.col.push(r,g,b);
  }
  if(o.solid!==false){
    const xs=[m.min[0]*s,m.max[0]*s], zs=[m.min[2]*s,m.max[2]*s], X=[],Z=[];
    for(const px of xs)for(const pz of zs){X.push(x+px*c+pz*n);Z.push(z-px*n+pz*c);}
    const bb=[Math.min(...X),Math.min(...Z),Math.max(...X),Math.max(...Z)];
    if(y<1.2) solids.push(bb);
    if(m.max[1]*s>.5) occl.push([bb[0],y,bb[1],bb[2],y+m.max[1]*s,bb[3]]);
  }
}
function kindRefs(){const sum={},cnt={};
  for(const m of Object.values(FUR)){const C=b64(m.col,Uint8Array),K=b64(m.kind,Uint8Array);
    for(let i=0;i<m.n;i++){const k=K[i];sum[k]=(sum[k]||0)+Math.max(C[i*3],C[i*3+1],C[i*3+2])/255;cnt[k]=(cnt[k]||0)+1;}}
  for(const k in sum) KREF[k]=sum[k]/cnt[k]*1.05;}
const RAINBOW=[[.93,.22,.6],[.36,.62,1],[1,.86,.3],[.42,.8,.48],[.68,.52,.95],[1,.55,.25],[1,.62,.8]];

/* ---------- JARDÍ ---------- */
function buildGarden(){
  const G0=-46,G1=46;
  for(let i=G0;i<G1;i+=4)for(let j=G0;j<G1;j+=4){
    const c=((i+j)/4&1)?[.55,.83,.5]:[.6,.87,.54]; quad([i,-.02,j+4],[i+4,-.02,j+4],[i+4,-.02,j],[i,-.02,j],c);}
  // vorera de pedra al voltant de la casa
  quad([-XW-1,-.01,ZW+1],[XW+1,-.01,ZW+1],[XW+1,-.01,-ZW-1],[-XW-1,-.01,-ZW-1],[.93,.9,.88]);
  // parterres de flors sota les finestres
  const fl=[[1,.55,.75],[1,1,1],[1,.85,.3],[.8,.6,1],[1,.4,.5]];
  const bed=(x0,z0,x1,z1)=>{box(x0,0,z0,x1,.25,z1,[.6,.42,.3],false);let k=0;
    for(let x=x0+.25;x<x1-.1;x+=.45)for(let z=z0+.25;z<z1-.1;z+=.45){const c=fl[(k++)%5];
      box(x-.04,.25,z-.04,x+.04,.5,z+.04,[.35,.65,.35],false);box(x-.12,.5,z-.12,x+.12,.62,z+.12,c,false);}};
  bed(-XW-2.6,-4,-XW-1.4,4); bed(XW+1.4,-4,XW+2.6,4); bed(-XW-2.6,-13,-XW-1.4,-6); bed(-XW-2.6,6,-XW-1.4,13);
  bed(XW+1.4,6,XW+2.6,13); bed(XW+1.4,-13,XW+2.6,-6); bed(-4,ZW+1.4,4,ZW+2.6); bed(6,ZW+1.4,14,ZW+2.6); bed(-14,-ZW-2.6,-6,-ZW-1.4);
  // tanca blanca
  const F=27;
  for(let x=-F;x<=F;x+=1.2){box(x-.06,0,-F-.06,x+.06,1.0,-F+.06,WHITE,false);box(x-.06,0,F-.06,x+.06,1.0,F+.06,WHITE,false);}
  for(let z=-F;z<=F;z+=1.2){box(-F-.06,0,z-.06,-F+.06,1.0,z+.06,WHITE,false);box(F-.06,0,z-.06,F+.06,1.0,z+.06,WHITE,false);}
  for(const y of [.4,.8]){box(-F,y,-F-.03,F,y+.08,-F+.03,WHITE,false);box(-F,y,F-.03,F,y+.08,F+.03,WHITE,false);
    box(-F-.03,y,-F,-F+.03,y+.08,F,WHITE,false);box(F-.03,y,-F,F+.03,y+.08,F,WHITE,false);}
  // arbres
  const T=[[-22,-6,1.2,0],[-21,3,1,2],[-23,10,1.3,1],[-19,-16,1.1,0],[-22,19,1.2,2],[22,-4,1.1,2],[21,5,1.3,0],[23,12,1,1],[19,-17,1.2,1],[22,20,1.1,0],
    [-10,-21,1.2,2],[-2,-23,1.3,1],[8,-21,1.1,0],[16,-22,1,2],[-12,21,1.2,0],[-3,23,1,2],[6,22,1.3,1],[14,20,1.1,2],[-30,-30,1.6,1],[30,-28,1.5,0],[33,24,1.6,1],[-32,22,1.5,0],[0,33,1.7,0],[0,-34,1.7,2],[34,0,1.6,1],[-35,0,1.6,0]];
  for(const [x,z,s,k] of T) tree(x,z,s,k);
  // font davant del rebedor (costat dret)
  for(const [fx,fz] of [[21,-.5],[-21,.5]]){cyl(fx,fz,0,.45,1.3,1.2,[.95,.95,.97],16);cyl(fx,fz,.44,.47,1.1,1.1,[.55,.78,1],16);
    cyl(fx,fz,.45,1.2,.15,.12,[.95,.95,.97],8);cyl(fx,fz,1.2,1.35,.45,.4,[.95,.95,.97],12);ball(fx,1.5,fz,.18,[.6,.82,1],8);}
  // núvols
  for(const [x,y,z] of [[-30,13,-40],[10,15,-44],[40,12,-20],[38,14,25],[-42,12,10],[-5,16,45],[25,13,42]]){ball(x,y,z,3,[1,1,1],8);ball(x+3,y-.5,z,2.2,[1,1,1],8);ball(x-3,y-.6,z+.5,2,[1,1,1],8);}
}

/* ---------- CASA ---------- */
function ceiling(r){const c=r.wall.map(v=>Math.min(1.5,v*1.45));
  quad([r.x0,H,r.z0],[r.x1,H,r.z0],[r.x1,H,r.z1],[r.x0,H,r.z1],c);
  const cx=(r.x0+r.x1)/2, cz=(r.z0+r.z1)/2; cyl(cx,cz,H-.12,H,.45,.45,[1.6,1.55,1.5],14); cyl(cx,cz,H-.2,H-.12,.3,.42,[1.5,1.4,1.45],14);}
function buildRoom(){
  buildGarden();
  for(const r of Object.values(ROOMS)){ for(let i=r.x0;i<r.x1;i++)for(let j=r.z0;j<r.z1;j++){const c=(i+j)&1?r.fa:r.fb; quad([i,0,j+1],[i+1,0,j+1],[i+1,0,j],[i,0,j],c);} ceiling(r);}
  // hall amb tres llums
  for(const x of [-9,9]){const r=ROOMS.hall;cyl(x,0,H-.12,H,.45,.45,[1.6,1.55,1.5],14);cyl(x,0,H-.2,H-.12,.3,.42,[1.5,1.4,1.45],14);}
  // parets exteriors amb finestres
  const O=(a,b,rk,w)=>wallFace(a,b,ROOMS[rk],w);
  O([-XW,-ZW],[-5,-ZW],'perruqueria',[[1.2,3.2]]); O([-5,-ZW],[5,-ZW],'armari'); O([5,-ZW],[XW,-ZW],'vestidor');
  O([XW,-ZW],[XW,-5],'vestidor',[[2.2,5.8]]); O([XW,-5],[XW,5],'hall',[[1.3,4.3],[5.7,8.7]]); O([XW,5],[XW,ZW],'sala',[[2,4.6]]);
  O([XW,ZW],[5,ZW],'sala'); O([5,ZW],[-5,ZW],'joieria',[[3.4,6.6]]); O([-5,ZW],[-XW,ZW],'sabateria');
  O([-XW,ZW],[-XW,5],'sabateria',[[3,6.4]]); O([-XW,5],[-XW,-5],'hall',[[1.3,4.3],[5.7,8.7]]); O([-XW,-5],[-XW,-ZW],'perruqueria',[[2.5,6.5]]);
  // parets interiors amb portes
  const back=['perruqueria','armari','vestidor'], front=['sabateria','joieria','sala'], cols=[-10,0,10];
  cols.forEach((cx,i)=>{const x0=cx-5,x1=cx+5;
    slabZ(-5,x0,cx-DOOR,back[i],'hall'); slabZ(-5,cx+DOOR,x1,back[i],'hall'); lintel(cx,-5);
    slabZ(5,x0,cx-DOOR,'hall',front[i]); slabZ(5,cx+DOOR,x1,'hall',front[i]); lintel(cx,5);});
  for(const x of [-5,5]){ slabX(x,-ZW,-5+WT,back[x<0?0:1],back[x<0?1:2]); slabX(x,5-WT,ZW,front[x<0?0:1],front[x<0?1:2]); }

  /* ---- REBEDOR ---- */
  place('rug_oval_A',0,0,0,{s:1.5,fab:'rosa',fab2:'rosa',solid:false});
  for(const sx of [-1,1]){
    place('couch_pillows',sx*6.2,0,sx<0?90:-90,{fab:'rosa',fab2:'lila',wood:'blanc'});
    place('table_low',sx*4.4,0,90,{wood:'blanc'});
    place('lamp_standing',sx*14.3,-4.4,0,{wood:'blanc'}); place('lamp_standing',sx*14.3,4.4,0,{wood:'blanc'});
    place('armchair_pillows',sx*13.2,-1.6,sx<0?60:-60,{fab:'lila',fab2:'rosa'});
    place('armchair_pillows',sx*13.2,1.6,sx<0?120:-120,{fab:'lila',fab2:'rosa'});
    place('table_small',sx*14.2,0,0,{s:.7,wood:'blanc'}); place('cactus_small_A',sx*14.2,0,0,{y:.53,solid:false});
    place('cactus_small_B',sx*4.4,0,0,{y:.375,solid:false});
  }
  for(const x of [-12.4,-7.6,-2.4,2.4,7.6,12.4]) for(const z of [-4.35,4.35]) place('cactus_medium_A',x,z,0,{s:.9,acc:'rosa'});
  // quadres del rebedor (les imatges es pinten a sobre, a frame())
  place('pictureframe_large_B',-5,-4.84,0,{y:2,solid:false,wood:'blanc'}); place('pictureframe_large_B',5,-4.84,0,{y:2,solid:false,wood:'blanc'});
  place('pictureframe_large_B',-5,4.84,180,{y:2,solid:false,wood:'blanc'}); place('pictureframe_large_A',5,4.84,180,{y:2,solid:false,wood:'blanc'});

  /* ---- PERRUQUERIA (pentinat) ---- */
  place('cabinet_medium',-10,-13.45,0,{wood:'blanc'});
  place('pictureframe_large_B',-10,-13.84,0,{y:1.75,s:1.1,solid:false,wood:'groc'});
  box(-11.1,1.25,-13.8,-8.9,2.25,-13.75,[.78,.9,1],false);
  place('lamp_table',-11.2,-13.45,0,{y:.75,solid:false}); place('cactus_small_B',-8.8,-13.45,0,{y:.75,solid:false});
  for(const sx of [-1,1]){ place('chair_C',-10+sx*3.3,-11.5,sx<0?90:-90,{fab:'fucsia'}); }
  // secadors de cabell (cúpules)
  for(const sx of [-1,1]){const x=-10+sx*3.9; cyl(x,-11.5,0,1.35,.08,.06,[.8,.8,.85],8); ball(x,1.55,-11.5,.32,[1,.75,.88],10);}
  place('shelf_B_small_decorated',-5.2,-9,-90,{y:1.6,solid:false,wood:'blanc'});
  place('rug_rectangle_stripes_A',-10,-7.3,0,{s:.8,fab:'rosa',solid:false});
  place('cactus_medium_B',-14.2,-13.2,0,{acc:'rosa'});
  // pots de xampú a la calaixera
  for(let k=0;k<4;k++) cyl(-10.4+k*.28,-13.5,.75,.95+(k%2)*.08,.07,.07,RAINBOW[k],8);

  /* ---- ARMARI (samarreta + pantalons) ---- */
  box(-4.4,0,-13.85,-.4,3.0,-13.15,[.75,.6,.95]); box(-2.44,.15,-13.17,-2.36,2.85,-13.1,[.55,.4,.8],false);
  box(-2.85,1.4,-13.15,-2.65,1.6,-13.05,[1,.85,.3],false); box(-2.15,1.4,-13.15,-1.95,1.6,-13.05,[1,.85,.3],false);
  box(-4.4,3.0,-13.85,-.4,3.1,-13.1,[.85,.72,1],false);
  // penjador amb pantalons
  box(.5,0,-13.85,4.4,2.55,-13.2,[.7,.55,.95]); box(.7,2.0,-13.15,4.2,2.08,-12.95,[1,.85,.3],false);
  for(let k=0;k<6;k++) box(.85+k*.58,.75,-13.05,1.2+k*.58,2.0,-12.9,[[.36,.62,1],[1,.62,.8],[.42,.8,.48],[1,.86,.3],[.68,.52,.95],[.25,.3,.6]][k],false);
  // prestatges laterals amb roba plegada
  for(const sx of [-1,1]){const x=sx*4.84,d=sx<0?90:-90;
    for(const y of [1.3,2.0]){place('shelf_A_big',x,-9.6,d,{y,solid:false,wood:'blanc'});
      for(let k=0;k<4;k++){const z=-10.25+k*.42;box(x-sx*.38,y+.0,z-.16,x-sx*.08,y+.14,z+.16,RAINBOW[(k+(y>1.5?3:0))%7],false);}}}
  place('armchair',-3.9,-6.3,150,{fab:'lila',fab2:'rosa'});
  place('rug_rectangle_A',0,-8.2,0,{s:.75,fab:'lila',solid:false});

  /* ---- VESTIDOR (vestit) ---- */
  for(const x of [7.2,12.8]){box(x-.1,0,-13.4,x+.1,1.2,-13.2,[.6,.6,.65]); box(x-.38,1.2,-13.55,x+.38,2.2,-13.05,[1,.62,.8]);
    box(x-.55,2.2,-13.5,x+.55,2.3,-13.1,[1,.62,.8],false); cyl(x,-13.3,.95,1.25,.6,.38,[1,.62,.8],10,false);}
  // mirall gran al fons
  box(8.8,.3,-13.9,11.2,2.9,-13.8,[1,.85,.35],false); box(9,.45,-13.8,11,2.75,-13.76,[.8,.92,1],false);
  place('armchair_pillows',6.3,-7,45,{fab:'rosa',fab2:'fucsia'}); place('table_small',6.2,-12.6,0,{wood:'blanc'});
  place('lamp_table',6.2,-12.6,0,{y:.75,solid:false}); place('rug_oval_B',10,-7.4,0,{s:.7,fab:'fucsia',solid:false});
  place('pictureframe_standing_B',14.2,-13.2,-30,{});

  /* ---- SABATERIA (sabates) ---- */
  box(-12.6,0,13.15,-7.4,2.5,13.85,WHITE);
  for(const y of [.5,1.15,1.8]){box(-12.6,y,12.75,-7.4,y+.06,13.15,[.95,.7,.85]);
    for(let k=0;k<6;k++) box(-12.35+k*.85,y+.06,12.8,-12.0+k*.85,y+.24,13.1,RAINBOW[(k+Math.round(y*3))%6],false);}
  for(const sx of [-1,1]) place('chair_stool',-10+sx*3,11.4,0,{fab:'menta'});
  place('pictureframe_standing_A',-14.3,13.4,180,{}); place('cactus_medium_A',-14.2,13.2,0,{});
  place('shelf_B_large_decorated',-5.2,9,-90,{y:1.5,solid:false,wood:'blanc'});
  place('rug_rectangle_stripes_B',-10,7.4,0,{s:.8,fab:'menta',solid:false});
  box(-14.9,0,5.6,-13.6,1.0,7.6,WHITE); for(let k=0;k<3;k++) box(-14.7,1.0,5.8+k*.6,-14.1,1.2,6.2+k*.6,RAINBOW[k+2],false);

  /* ---- JOIERIA (complements) ---- */
  place('table_medium_long',0,13.1,0,{s:.9,wood:'blanc'});
  box(-1.4,.68,12.9,-.8,.93,13.3,[1,.62,.8],false); box(.7,.68,12.9,1.4,.83,13.3,[.36,.62,1],false); box(-.2,.68,12.95,.25,.78,13.25,[1,.86,.3],false);
  place('lamp_standing',-4.2,13.2,0,{}); place('lamp_standing',4.2,13.2,0,{});
  for(const sx of [-1,1]){ // vitrines
    box(sx*4.4-.32,0,8,sx*4.4+.32,1.0,11,WHITE); box(sx*4.4-.3,1.0,8.05,sx*4.4+.3,1.03,10.95,[.8,.92,1],false);
    for(let k=0;k<4;k++) ball(sx*4.4,1.1,8.4+k*.7,.08,RAINBOW[k+sx+1],6);}
  place('armchair',3.0,7.2,-150,{fab:'groc',fab2:'rosa'}); place('rug_oval_A',0,7.4,0,{s:.7,fab:'groc',solid:false});

  /* ---- SALA D'ESTAR ---- */
  // llar de foc a la paret del fons
  box(8.4,0,13.3,11.6,1.6,13.95,[1,.97,.95]); box(8.2,1.6,13.15,11.8,1.75,13.95,[.95,.85,.82],false);
  box(9.2,.12,13.27,10.8,1.15,13.32,[.18,.12,.14],false);
  for(const [x,h,c] of [[9.6,.55,[1,.45,.15]],[10,.75,[1,.62,.2]],[10.4,.5,[1,.45,.15]],[9.85,.4,[1,.85,.3]],[10.2,.45,[1,.85,.3]]]) box(x-.14,.15,13.2,x+.14,.15+h,13.26,c,false);
  box(9.3,.12,13.0,10.7,.2,13.3,[.45,.3,.22],false);
  place('pictureframe_standing_A',8.9,13.55,180,{y:1.75,solid:false}); place('pictureframe_standing_B',11.1,13.55,180,{y:1.75,solid:false});
  cyl(10,13.55,1.75,1.95,.09,.07,[1,.62,.8],8); ball(10,2.02,13.55,.12,[1,.55,.75],8);
  place('pictureframe_large_B',10,13.84,180,{y:2.6,s:1.1,solid:false,wood:'groc'});
  place('pictureframe_medium',14.84,10.9,-90,{y:1.95,solid:false,wood:'blanc'}); place('pictureframe_medium',14.84,12.5,-90,{y:1.95,solid:false,wood:'blanc'});
  // sofà i butaques mirant la llar de foc
  place('rug_rectangle_stripes_B',10,11.2,0,{s:1.15,fab:'rosa',solid:false});
  place('couch_pillows',10,9.4,0,{fab:'fucsia',fab2:'rosa'});
  place('table_low',10,11.3,0,{s:.85,wood:'blanc'}); place('book_set',9.7,11.3,0,{y:.45,solid:false}); cyl(10.4,11.3,.42,.55,.07,.06,[1,1,1],8);
  place('armchair_pillows',7.2,11.6,90,{fab:'rosa',fab2:'lila'}); place('armchair_pillows',12.8,11.6,-90,{fab:'rosa',fab2:'lila'});
  place('lamp_standing',6,13.3,0,{}); place('lamp_standing',14,13.3,0,{});
  // prestatgeria i calaixera a la paret interior
  place('cabinet_medium_decorated',5.6,8,90,{wood:'blanc'});
  place('pictureframe_large_B',5.16,8,90,{y:2.25,s:1.2,solid:false,wood:'groc'});
  place('shelf_B_large_decorated',5.2,11,90,{y:1.6,solid:false,wood:'blanc'}); place('shelf_B_large_decorated',5.2,11,90,{y:2.3,solid:false,wood:'blanc'});
  place('cactus_medium_B',14.2,5.8,0,{acc:'rosa'}); place('cactus_medium_A',6,5.9,0,{acc:'rosa'});
  place('pillow_A',8.4,9.0,20,{y:.0,solid:false,fab:'lila'}); place('pillow_B',11.8,9.0,-30,{y:.0,solid:false,fab:'groc'});
}

/* =================== MOTOR =================== */
let E,A,D,PARTS={},room,faceQuad,faceTex,discs=[];
function colsFor(name,item){
  const p=D.parts[name], c1=COLORS[item.c1].c, c2=COLORS[item.c2].c, out=[];
  p.mats.forEach(([mn,orig],i)=>{
    let c=orig;
    if(name==='body') c=SKIN;
    else if(i===0) c=c1; else if(i===1) c=c2;
    else if(/Dress|ClothesDownDefault/.test(mn)) c=c2;
    out.push(...c);
  });
  while(out.length<12) out.push(1,1,1);
  return new Float32Array(out.slice(0,12));
}
function part(n){return PARTS[n]||(PARTS[n]=E.makePart(D.parts[n]));}
function makeDisc(st){const pos=[],col=[];const N=40,r=1.15;
  for(let i=0;i<N;i++){const a=i/N*Math.PI*2,b=(i+1)/N*Math.PI*2;
    pos.push(st.x,.03,st.z, st.x+Math.cos(a)*r,.03,st.z-Math.sin(a)*r, st.x+Math.cos(b)*r,.03,st.z-Math.sin(b)*r);
    col.push(1,.45,.72,1,.75,.88,1,.75,.88);}
  return E.makeStatic(pos,col);}
function makeFace(){
  // quadrat davant la cara, enganxat a l'os del cap
  const hb=D.bones.indexOf('Head'), z=.1585, cx=0, cy=1.455, s=.17;
  const pos=[cx-s,cy-s,z, cx+s,cy-s,z, cx+s,cy+s,z, cx-s,cy-s,z, cx+s,cy+s,z, cx-s,cy+s,z];
  const uv=[0,1,1,1,1,0,0,1,1,0,0,0];
  const m=E.makeStatic(pos,null,uv);
  const gl=E.gl; gl.bindVertexArray(m.vao); gl.vertexAttrib4f(1,hb,0,0,0); gl.vertexAttrib4f(2,1,0,0,0); gl.bindVertexArray(null);
  return m;
}

/* =================== VESTIR =================== */
function equip(st,o){
  const item={p:o.p||[],c1:'r',c2:'c',w:o.w,f:o.f};
  const prev=outfit[st.slot];
  if(prev && !prev.robe && !prev.towel){item.c1=prev.c1;item.c2=prev.c2;}
  if(st.slot==='beard'){item.c1=prev?prev.c1:(outfit.hair?outfit.hair.c1:'m'); if(o.none){outfit.beard=null; got.add(st.id+':'+o.w); player.wave=1.4; sparkle(); sfx('win'); return null;}}
  if(st.slot==='hair'){item.c1=prev?prev.c1:'m'; item.c2=prev?prev.c2:'r'; if(outfit.acc&&outfit.acc.towel) outfit.acc=null;}
  if(st.slot==='top'){
    item.dress=!!st.dress; outfit.top=item;
    if(st.dress) outfit.bottom=null;
    else if(!outfit.bottom) outfit.bottom={p:['ClothesBottom_SkinnyPantsLong'],c1:'b',c2:'c'};
  } else if(st.slot==='bottom'){
    outfit.bottom=item;
    if(outfit.top&&outfit.top.dress) outfit.top={p:['ClothesUp_T-Shirt'],c1:'c',c2:'r'};
  } else if(st.slot==='acc'){
    outfit.acc=item; if(!outfit.hair) outfit.hair={p:['Hair_Normal','SecondHair_NormalLong'],c1:'m',c2:'r'};
  } else outfit[st.slot]=item;
  got.add(st.id+':'+o.w);
  player.wave=1.4; sparkle(); sfx('win');
  return item;
}

/* =================== INTERFÍCIE =================== */
const $=id=>document.getElementById(id);
function renderPanel(){
  const pn=$('panel');
  if(mode!=='station'){pn.classList.remove('show');return;}
  pn.classList.add('show');
  $('ptitle').textContent=station.id.toUpperCase();
  if(step==='pick'){
    const now=performance.now();
    $('pbody').innerHTML='<div class="opts">'+station.opts.map(o=>{
      const lk=locks[station.id+o.w]>now, cur=outfit[station.slot], on=!!(cur&&cur.w===o.w);
      const match=buf&&o.w.startsWith(buf);
      let h='';for(let i=0;i<o.w.length;i++){const ch=o.w[i]===' '?'&nbsp;':o.w[i];h+=`<span class="${match&&i<buf.length?'ok':''}">${ch}</span>`;}
      return `<div class="opt px btn ${lk?'grey lock':''} ${match?'match dark':''} ${on?'on':''}">${h}</div>`;}).join('')+'</div>';
    $('pfoot').innerHTML='<b class="px btn">Intro</b> per sortir';
  } else {
    const it=outfit[station.slot];
    $('pbody').innerHTML=`<div class="ctitle">${step==='c1'?'Color':'Segon color'} · <i>${it.w}</i></div><div class="sw">`+
      Object.entries(COLORS).map(([k,v])=>`<div class="s ${it[step]===k?'sel':''}"><div class="dot" style="background:rgb(${v.c.map(x=>x*255|0)})">${k.toUpperCase()}</div><div class="cn">${v.n}</div></div>`).join('')+'</div>';
    $('pfoot').innerHTML='<b class="px btn">Intro</b> per sortir';
  }
}
function msg(t,bad){const m=$('msg');m.innerHTML=`<img src="ui/${bad?'heart':'star'}.png" alt="">`+t;m.className='px pnl show'+(bad?' bad':'');clearTimeout(msg.t);msg.t=setTimeout(()=>m.className='px pnl',1400);}
function sparkle(){const host=$('fx');
  for(let i=0;i<18;i++){const s=document.createElement('img');s.className='spark';s.src='ui/'+(i%2?'star':'heart')+'.png';
    s.style.left='32%';s.style.top='45%';const a=Math.random()*6.28,d=90+Math.random()*130;
    s.style.setProperty('--dx',Math.cos(a)*d+'px');s.style.setProperty('--dy',Math.sin(a)*d-50+'px');host.appendChild(s);setTimeout(()=>s.remove(),1000);}}
let ac;function beep(f,d=.08,type='sine',v=.07){try{ac=ac||new AudioContext();const o=ac.createOscillator(),g=ac.createGain();o.type=type;o.frequency.value=f;g.gain.value=v;
  g.gain.exponentialRampToValueAtTime(.0001,ac.currentTime+d);o.connect(g).connect(ac.destination);o.start();o.stop(ac.currentTime+d);}catch(e){}}
function sfx(k,n=0){if(k==='key')beep(520+n*35,.05);if(k==='win')[660,880,1180].forEach((f,i)=>setTimeout(()=>beep(f,.13,'triangle',.08),i*80));
  if(k==='bad')beep(170,.28,'square',.05);if(k==='col')beep(900,.07,'triangle',.06);if(k==='in')beep(440,.1,'triangle',.06);}

function enterStation(st){mode='station';station=st;buf='';step='pick';player.x=st.x;player.z=st.z;player.yaw=st.yaw;player.speed=0;
  sfx('in');renderPanel();$('hint').classList.add('hide');}
function leaveStation(){for(const o of station.opts) delete locks[station.id+o.w]; lockStation=station;mode='walk';station=null;renderPanel();}

addEventListener('keydown',e=>{
  const k=e.key.toLowerCase();
  if(mode==='walk'){ if('jfkd'.includes(k)&&k.length===1){keys[k]=1;e.preventDefault();} return; }
  // dins una parada
  if(e.key==='Escape'||e.key==='Enter'){e.preventDefault();leaveStation();return;}
  if(e.repeat) return;
  if(step!=='pick'){
    if(COLORS[k]){outfit[station.slot][step]=k;sfx('col');step=(step==='c1'&&!station.one)?'c2':'pick';buf='';renderPanel();}
    return;
  }
  if(e.key==='Dead'||e.key.length!==1||e.ctrlKey||e.metaKey) return;
  e.preventDefault();
  const now=performance.now(), nb=buf+k;
  const cand=station.opts.filter(o=>!(locks[station.id+o.w]>now)&&o.w.startsWith(nb));
  if(cand.length){
    buf=nb; sfx('key',buf.length);
    const done=cand.find(o=>o.w===nb);
    if(done){const it=equip(station,done);buf='';step=it?'c1':'pick';msg(['Molt bé!','Quin estil!','Preciós!','Genial!'][Math.random()*4|0]);}
    renderPanel();
  } else {
    const was=station.opts.filter(o=>buf&&o.w.startsWith(buf));
    if(was.length===1) locks[station.id+was[0].w]=Infinity;   // perduda fins que surts de la parada
    buf=''; sfx('bad'); msg(was.length===1?'Oh no! Has perdut: '+was[0].w:'Oh no! Aquesta lletra no hi és',true);
    const pn=$('panel');pn.classList.remove('shake');void pn.offsetWidth;pn.classList.add('shake');
    renderPanel();
  }
});
addEventListener('keyup',e=>{keys[e.key.toLowerCase()]=0;});
addEventListener('blur',()=>{for(const k in keys)keys[k]=0;});

/* =================== BUCLE =================== */
const cam={eye:[0,3,8],tgt:[0,1,0]};
function lerp3(a,b,t){for(let i=0;i<3;i++)a[i]+=(b[i]-a[i])*t;}
function collide(){
  const r=.38;
  player.x=Math.max(-XW+r,Math.min(XW-r,player.x)); player.z=Math.max(-ZW+r,Math.min(ZW-r,player.z));
  for(const [x0,z0,x1,z1] of solids){
    const cx=Math.max(x0,Math.min(x1,player.x)), cz=Math.max(z0,Math.min(z1,player.z));
    const dx=player.x-cx, dz=player.z-cz, d=Math.hypot(dx,dz);
    if(d<r){ if(d>1e-5){player.x=cx+dx/d*r;player.z=cz+dz/d*r;} }
  }
}
function camClip(t,e){
  for(let s=.15;s<=1.001;s+=.05){const p=[t[0]+(e[0]-t[0])*s,t[1]+(e[1]-t[1])*s,t[2]+(e[2]-t[2])*s];
    for(const [x0,y0,z0,x1,y1,z1] of occl){ if(p[0]>x0-.3&&p[0]<x1+.3&&p[2]>z0-.3&&p[2]<z1+.3&&p[1]>y0-.3&&p[1]<y1+.3){
      const k=Math.max(.15,s-.07);return [t[0]+(e[0]-t[0])*k,t[1]+(e[1]-t[1])*k+.4*(1-k),t[2]+(e[2]-t[2])*k];}}}
  return e;}
let last=performance.now();
function frame(t){
  const dt=Math.min(.05,(t-last)/1000); last=t;
  if(mode==='walk'){
    const fwd=(keys.j?1:0)-(keys.f?.6:0), turn=(keys.d?1:0)-(keys.k?1:0);
    player.yaw+=turn*2.6*dt;
    player.speed+=(fwd*3.2-player.speed)*Math.min(1,dt*10);
    player.x+=Math.sin(player.yaw)*player.speed*dt; player.z+=Math.cos(player.yaw)*player.speed*dt;
    collide();
    if(fwd||turn) $('hint').classList.add('hide');
    // entrar a una parada
    for(const st of STATIONS){const d=Math.hypot(player.x-st.x,player.z-st.z);
      if(st===lockStation){ if(d>1.6) lockStation=null; continue; }
      if(d<.95){enterStation(st);break;}}
  }
  // càmera
  const sy=Math.sin(player.yaw),cy=Math.cos(player.yaw);
  let eye,tgt;
  if(mode==='station'){ eye=[player.x+sy*3.1+cy*.2,1.55,player.z+cy*3.1-sy*.2]; tgt=[player.x+cy*.75,1.0,player.z-sy*.75]; }
  else { eye=[player.x-sy*4.6,2.7,player.z-cy*4.6]; tgt=[player.x+sy*1.2,1.05,player.z+cy*1.2];
    eye[0]=Math.max(-XW+.3,Math.min(XW-.3,eye[0])); eye[2]=Math.max(-ZW+.3,Math.min(ZW-.3,eye[2])); }
  eye=camClip(tgt,eye);
  lerp3(cam.eye,eye,Math.min(1,dt*(mode==='station'?4:6))); lerp3(cam.tgt,tgt,Math.min(1,dt*7));
  const cv=$('c'), asp=cv.clientWidth/cv.clientHeight;
  const vp=M4.mul(M4.persp(.95,asp,.05,80),M4.look(cam.eye,cam.tgt,[0,1,0]));
  E.begin(vp,cam.eye,[.74,.87,1]);
  E.draw(room,{mode:1});
  for(const a of ART) E.draw(a.m,{mode:2,tex:a.t});
  STATIONS.forEach((st,i)=>E.draw(discs[i],{mode:1,glow:.18+.14*Math.sin(t/300+i)}));
  // animació
  const sp=Math.abs(player.speed)/3.2;
  player.walkT+=dt*(player.speed>=0?1:-1)*Math.max(.35,sp); player.idleT+=dt;
  let bones=A.blend('idle',player.idleT,'walk',player.walkT*1.05,Math.min(1,sp));
  if(player.wave>0){player.wave-=dt; const w=Math.min(1,player.wave*2,(1.4-player.wave)*4);
    const wv=A.sample('wave',1.4-player.wave,new Float32Array(bones.length)); for(let i=0;i<bones.length;i++) bones[i]=bones[i]*(1-w)+wv[i]*w;}
  const model=M4.trY(player.x,0,player.z,player.yaw);
  E.draw(part('body'),{model,bones,cols:colsFor('body',{c1:'c',c2:'c'})});
  for(const sl of ['hair','beard','top','bottom','shoes','acc']){const it=outfit[sl]; if(!it) continue;
    for(const n of it.p) E.draw(part(n),{model,bones,cols:colsFor(n,it)});}
  E.draw(faceQuad,{model,bones,mode:2,tex:faceTex});

  // ombra
  E.draw(shadow,{model:M4.trY(player.x,0,player.z,0),mode:1});
  // rètols
  const here=roomAt(player.x,player.z);
  const show=(el,p)=>{ if(!p||mode==='station'){el.style.display='none';return;}
    const x=vp[0]*p[0]+vp[4]*p[1]+vp[8]*p[2]+vp[12], y=vp[1]*p[0]+vp[5]*p[1]+vp[9]*p[2]+vp[13], w=vp[3]*p[0]+vp[7]*p[1]+vp[11]*p[2]+vp[15];
    if(w<2.2){el.style.display='none';return;}
    el.style.display='block'; el.style.left=((x/w*.5+.5)*cv.clientWidth)+'px'; el.style.top=((-y/w*.5+.5)*cv.clientHeight)+'px';
    el.style.transform=`translate(-50%,-100%) scale(${Math.max(.55,Math.min(1,6/w))})`;};
  DOORS.forEach(d=>show(d.el, here==='hall'?[d[1],3.05,d[2]+(d[2]<0?.35:-.35)]:null));
  STATIONS.forEach(st=>show(st.el, here===st.room&&Math.hypot(player.x-st.x,player.z-st.z)>2.2?[st.x,2.6,st.z]:null));
  $('cnum').textContent=got.size;
  requestAnimationFrame(frame);
}
let shadow; const ART=[];
// [imatge, centre x, z, amplada, alçada, mira cap a +z?]
// [imatge, x, y, z, amplada, alçada, cap on mira]
const ARTDEF=[['pingui',-5,2,-4.67,1.26,.7,'+z'],['dali',5,2,-4.67,1.26,.7,'+z'],['castell',-5,2,4.67,1.26,.7,'-z'],['dibuix',5,2,4.67,.6,.72,'-z'],
  ['arquer',10,2.6,13.66,1.4,.78,'-z'],['esquirol',14.67,1.95,10.9,.42,.42,'-x'],['cargol',14.67,1.95,12.5,.42,.42,'-x'],['platja',5.33,2.25,8,1.52,.85,'+x']];
async function buildArt(){
  for(const [img,x,y,z,w,h,dir] of ARTDEF){const hw=w/2, hh=h/2;
    let A,B; // extrems esquerre i dret vistos des de davant
    if(dir==='+z'){A=[x-hw,z];B=[x+hw,z];} else if(dir==='-z'){A=[x+hw,z];B=[x-hw,z];}
    else if(dir==='-x'){A=[x,z-hw];B=[x,z+hw];} else {A=[x,z+hw];B=[x,z-hw];}
    const pos=[A[0],y-hh,A[1], B[0],y-hh,B[1], B[0],y+hh,B[1], A[0],y-hh,A[1], B[0],y+hh,B[1], A[0],y+hh,A[1]];
    const uv=[0,1,1,1,1,0,0,1,1,0,0,0];
    const m=E.makeStatic(pos,null,uv); const im=new Image(); im.src='art/'+img+'.jpg'; await im.decode();
    ART.push({m,t:E.texture(im)});}}
async function start(){
  D=await (await fetch('model.json')).json();
  E=new Engine($('c')); A=new Anim(D);
  FUR=await (await fetch('furniture.json')).json(); kindRefs();
  buildRoom(); room=E.makeStatic(geo.pos,geo.col); await buildArt();
  discs=STATIONS.map(makeDisc);
  {const pos=[],col=[],N=24,r=.42;for(let i=0;i<N;i++){const a=i/N*6.283,b=(i+1)/N*6.283;
    pos.push(0,.035,0, Math.cos(a)*r,.035,-Math.sin(a)*r, Math.cos(b)*r,.035,-Math.sin(b)*r);col.push(.85,.55,.68,.95,.72,.82,.95,.72,.82);} shadow=E.makeStatic(pos,col);}
  faceQuad=makeFace();
  const img=new Image(); img.src='face.png'; await img.decode(); faceTex=E.texture(img);
  for(const n of ['body','Accessories_Hood','ClothesUp_DressRegularLong','Shoes_slipper']) part(n);
  STATIONS.forEach(st=>{const el=document.createElement('div');el.className='label';el.textContent=st.id;$('labels').appendChild(el);st.el=el;});
  DOORS.forEach(d=>{const el=document.createElement('div');el.className='label door';el.textContent=ROOMNAME[d[0]];$('labels').appendChild(el);d.el=el;});
  $('loading').remove();
  requestAnimationFrame(frame);
}
start().catch(e=>{$('loading').textContent='Error: '+e;console.error(e);});
