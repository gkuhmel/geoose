import * as d3 from "d3";
import * as topojson from "topojson-client";
import WORLD from "world-atlas/countries-50m.json";
import { COUNTRIES } from "./countries.js";
import "./style.css";
const C = COUNTRIES;

const ROUNDS=10, MAXPTS=1000, CHRONO_S=15, BONUS_MAX=300, R=6371;
const $=id=>document.getElementById(id);
const store={get(k){try{return localStorage.getItem(k)}catch(e){return null}},set(k,v){try{localStorage.setItem(k,v)}catch(e){}}};
const fmt=n=>n.toLocaleString("fr-FR");
const flag=a2=>String.fromCodePoint(...[...a2].map(c=>0x1F1E6+c.charCodeAt(0)-65));
const de=c=>c.art==="l'"?"de l'":c.art==="les"?"des ":c.art==="le"?"du ":c.art==="la"?"de la ":/^[AEIOUYÉÈÎ]/i.test(c.nom)?"d'":"de ";
const dans=c=>c.art==="l'"?"en ":c.art==="les"?"aux ":c.art==="le"?"au ":c.art==="la"?"en ":"à ";

// iOS : bloque le zoom de page (iPad)
["gesturestart","gesturechange"].forEach(t=>document.addEventListener(t,e=>e.preventDefault(),{passive:false}));
document.addEventListener("dblclick",e=>e.preventDefault(),{passive:false});

// ---------- données carte ----------
const geoms = WORLD.objects.countries;
geoms.geometries = geoms.geometries.filter(g=>g.id!=="010"); // sans Antarctique
// territoires sans id dans world-atlas : rattachés au pays reconnu par l'ONU (ou id maison pour le Kosovo)
const NOID={"Kosovo":"XK","N. Cyprus":"196","Somaliland":"706"};
geoms.geometries.forEach(g=>{ if(g.id===undefined && NOID[g.properties?.name]) g.id=NOID[g.properties.name]; });
const features = topojson.feature(WORLD,geoms).features;
// plusieurs morceaux pour un même id (ex. Australie + îles Ashmore) : on les fusionne pour le calcul
const byIso = new Map();
for(const f of features){
  if(f.id===undefined) continue;
  const prev=byIso.get(f.id);
  if(!prev){byIso.set(f.id,f);continue;}
  const polys=g=>g.type==="Polygon"?[g.coordinates]:g.coordinates;
  byIso.set(f.id,{type:"Feature",id:f.id,geometry:{type:"MultiPolygon",coordinates:[...polys(prev.geometry),...polys(f.geometry)]}});
}
const landMesh = topojson.merge(WORLD,geoms.geometries);
const borders = topojson.mesh(WORLD,geoms,(a,b)=>a===b); // côtes
// coloriage façon atlas : voisins de couleurs différentes
const PAL=["#fbe3a8","#cdeaa9","#f9c9b9","#dccff3","#bfe6e0","#f6d6e8","#ffe8c2"];
const nb=topojson.neighbors(geoms.geometries);
const col=new Array(features.length).fill(-1);
features.map((f,i)=>i).sort((a,b)=>nb[b].length-nb[a].length).forEach(i=>{
  const used=new Set(nb[i].map(j=>col[j]));
  let c=(i*7)%PAL.length; for(let t=0;t<PAL.length;t++){const cc=(c+t)%PAL.length;if(!used.has(cc)){c=cc;break;}}
  col[i]=c;
});

const svg=d3.select("#map");
const projection=d3.geoMercator();
const path=d3.geoPath(projection);
const root=svg.append("g");
const gGrat=root.append("path").attr("class","grat");
const gHalo2=root.append("path").attr("class","halo2");
const gHalo=root.append("path").attr("class","halo");
const gLand=root.append("g");
const gCoast=root.append("path").attr("class","coast");
const gOcean=root.append("g");
const gOver=root.append("g");
const lands=gLand.selectAll("path").data(features).join("path").attr("class","land").attr("fill",(d,i)=>PAL[col[i]]);
const OCEANS=[["OCÉAN ATLANTIQUE",-38,30],["OCÉAN ATLANTIQUE",-18,-22],["OCÉAN PACIFIQUE",-140,8],["OCÉAN PACIFIQUE",165,22],["OCÉAN INDIEN",78,-18],["Mer Méditerranée",17,34.6,4],["OCÉAN ARCTIQUE",-5,78],["Mer du Nord",3.5,56.3,6]];
let W=0,H=0,k=1,MH=0;

function layout(){
  W=innerWidth; H=innerHeight;
  svg.attr("viewBox",`0 0 ${W} ${H}`);
  projection.scale(W/(2*Math.PI)).translate([W/2,0]);
  const top=projection([0,83.5])[1]; projection.translate([W/2,-top]);
  MH=projection([0,-58])[1];
  gGrat.attr("d",path(d3.geoGraticule().step([15,15]).extentMinor([[-180,-80],[180.01,85]])()));
  gHalo2.attr("d",path(landMesh)); gHalo.attr("d",path(landMesh));
  lands.attr("d",path); gCoast.attr("d",path(borders));
  gOcean.selectAll("text").data(OCEANS).join("text").attr("class","ocean-label");
  zoom.translateExtent([[0,0],[W,MH]]).scaleExtent([1,40]);
  redrawOverlay();
}
function onZoom(t){
  root.attr("transform",t); k=t.k; root.style("--k",k);
  gOcean.selectAll("text").each(function(d){
    const [x,y]=projection([d[1],d[2]]); const minK=d[3]||0;
    d3.select(this).attr("transform",`translate(${x},${y}) scale(${1/k})`).attr("font-size",d[3]?13:15).text(d[0]).style("display",k>=minK?null:"none");
  });
  placeMarkers();
}
function placeMarkers(){ gOver.selectAll(".mk").attr("transform",d=>{const [x,y]=projection(d);return `translate(${x},${y}) scale(${1/k})`;}); }
const zoom=d3.zoom().on("zoom",e=>onZoom(e.transform));
svg.call(zoom).on("dblclick.zoom",null);
function viewOn(lon,lat,spanLon){
  const s=Math.max(1,360/spanLon); const [x,y]=projection([lon,lat]);
  return d3.zoomIdentity.translate(W/2,H/2).scale(s).translate(-x,-y);
}
function homeView(){ return W>H ? viewOn(12,47,W>1000?55:70) : viewOn(10,46,W>600?55:42); }
$("zin").onclick=()=>svg.transition().duration(300).call(zoom.scaleBy,1.8);
$("zout").onclick=()=>svg.transition().duration(300).call(zoom.scaleBy,1/1.8);
$("zworld").onclick=()=>svg.transition().duration(700).call(zoom.transform,d3.zoomIdentity.translate(0,(H-MH)/2));

// tap (sans glisser) = planter la flèche ; fonctionne souris + tactile
const ptrs=new Map(); let multi=false;
svg.on("pointerdown",e=>{ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY,t:performance.now()}); if(ptrs.size>1) multi=true;});
svg.on("pointerup pointercancel",e=>{
  const p=ptrs.get(e.pointerId); ptrs.delete(e.pointerId);
  const wasMulti=multi; if(ptrs.size===0) multi=false;
  if(!p||wasMulti||e.type==="pointercancel") return;
  const now=performance.now();
  if(Math.hypot(e.clientX-p.x,e.clientY-p.y)>12||now-p.t>500){lastTap=null;return;} // c'était un glissement
  if(lastTap&&now-lastTap.t<400&&Math.hypot(e.clientX-lastTap.x,e.clientY-lastTap.y)<40){
    lastTap=null; placeGuess(e.clientX,e.clientY);
  } else { lastTap={t:now,x:e.clientX,y:e.clientY}; tapHint(e.clientX,e.clientY); }
});
let lastTap=null;
function tapHint(x,y){
  if(!game||game.answered||!$("home").classList.contains("hidden")) return;
  const d=document.createElement("div"); d.className="taphint"; d.style.left=x+"px"; d.style.top=y+"px";
  document.body.appendChild(d); setTimeout(()=>d.remove(),450);
}

// ---------- jeu ----------
let opts={mode:"pays",level:1,chrono:0};
let game=null, timerRAF=0;
// difficulté = renommée du pays / de la capitale / du drapeau (1 célèbre … 4 rareté)
const tierOf=(c,type)=>c.tier[type];
// ---------- révisions (mode apprentissage) ----------
// clé "type|iso" : une question ratée (oie à plus de OK_KM, ou indice utilisé) y est ajoutée ;
// une bonne réponse l'en retire.
const OK_KM=150, REV_KEY="geoose-revisions";
const byKey=new Map(C.map(c=>[c.iso,c]));
const loadRev=()=>{try{const a=JSON.parse(store.get(REV_KEY)||"[]");return new Set(Array.isArray(a)?a:[]);}catch(e){return new Set();}};
let revisions=loadRev();
const saveRev=()=>store.set(REV_KEY,JSON.stringify([...revisions]));
const revItems=()=>[...revisions].map(k=>{const [type,iso]=k.split("|");return {c:byKey.get(iso),type};}).filter(q=>q.c&&["pays","capitale","drapeau"].includes(q.type));
function showRev(){
  const n=revItems().length, b=$("learnbtn");
  b.disabled=n===0;
  $("learnn").textContent=n?`${n} question${n>1?"s":""} à revoir`:"aucune erreur à revoir 🎉";
}
document.querySelectorAll(".choices").forEach(g=>g.addEventListener("click",e=>{
  const b=e.target.closest(".choice"); if(!b) return;
  g.querySelectorAll(".choice").forEach(x=>x.classList.toggle("on",x===b));
  opts[g.dataset.k]= g.dataset.k==="mode"?b.dataset.v:+b.dataset.v; showBest();
}));
const bestKey=()=>`geoose3-${opts.mode}-${opts.level}-${opts.chrono}`;
function showBest(){const b=store.get(bestKey()); $("best").textContent=b?`🏆 Record : ${fmt(+b)} pts`:""; showRev();}
const shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[a[i],a[j]]=[a[j],a[i]]}return a};

// Tire ROUNDS questions dont la renommée correspond exactement au niveau choisi
// (si le niveau n'en a pas assez, on complète avec les niveaux voisins).
function pickQuestions(mode,level){
  const types=mode==="mix"?["pays","capitale","drapeau"]:[mode];
  const out=[], used=new Set();
  for(const d of [0,1,-1,2,-2,3,-3]){
    const lv=level+d; if(lv<1||lv>4) continue;
    const cands=shuffle(C.flatMap(c=>types.filter(t=>tierOf(c,t)===lv).map(t=>({c,type:t}))));
    for(const q of cands){ if(out.length>=ROUNDS) break; if(!used.has(q.c.iso)){used.add(q.c.iso);out.push(q);} }
    if(out.length>=ROUNDS) break;
  }
  return shuffle(out);
}

function startGame(learn){
  learn=learn===true;
  const list=learn?shuffle(revItems()).slice(0,ROUNDS):pickQuestions(opts.mode,opts.level);
  if(!list.length){ goHome(); return; }
  game={chrono:!!opts.chrono,learn,n:list.length,list,i:0,total:0,log:[],learned:0};
  $("dots").innerHTML="<i></i>".repeat(game.n);
  $("home").classList.add("hidden"); $("end").classList.add("hidden");
  $("clock").classList.toggle("on",game.chrono); $("timer").classList.toggle("on",game.chrono);
  nextRound();
}

function nextRound(){
  const q=game.list[game.i];
  Object.assign(game,{guess:null,answered:false,hint:false});
  $("rlabel").textContent=`${game.learn?"📚 ":""}${game.i+1}/${game.n}`;
  [...$("dots").children].forEach((d,i)=>{d.className=i<game.i?"done":i===game.i?"cur":""});
  $("scoreval").textContent=fmt(game.total);
  $("qlabel").textContent={pays:"Où se trouve le pays…",capitale:"Où se trouve la capitale…",drapeau:"Où se trouve le pays de ce drapeau ?"}[q.type];
  $("qname").textContent={pays:q.c.nom,capitale:q.c.cap,drapeau:flag(q.c.a2)}[q.type];
  $("qname").classList.toggle("flagq",q.type==="drapeau");
  $("hintbtn").textContent=q.type==="drapeau"?"💡 Voir le nom (points ÷ 2)":"💡 Indice (points ÷ 2)";
  $("qcard").classList.remove("swap"); void $("qcard").offsetWidth; $("qcard").classList.add("swap");
  $("qhint").textContent=""; $("hintbtn").hidden=q.type==="pays";
  lands.classed("target",false);
  $("result").classList.remove("show");
  setGo("Valider 🎯",true,false);
  svg.transition().duration(700).call(zoom.transform,homeView());
  $("tip").style.opacity=game.i<3?1:0;
  redrawOverlay();
  if(game.chrono) startTimer();
}
function setGo(txt,disabled,green){const b=$("go");b.textContent=txt;b.disabled=disabled;b.classList.toggle("green",green);}

function startTimer(){
  cancelAnimationFrame(timerRAF);
  game.t0=performance.now();
  const tick=()=>{
    if(!game||game.answered) return;
    const left=Math.max(0,CHRONO_S-(performance.now()-game.t0)/1000);
    $("timer").style.transform=`scaleX(${left/CHRONO_S})`;
    $("clock").textContent="⏱️ "+Math.ceil(left);
    $("clock").classList.toggle("urgent",left<=5);
    if(left<=0){ validate(true); return; }
    timerRAF=requestAnimationFrame(tick);
  };
  tick();
}

$("hintbtn").onclick=()=>{const c=game.list[game.i].c;game.hint=true;$("hintbtn").hidden=true;$("qhint").textContent=game.list[game.i].type==="drapeau"?`drapeau ${de(c)}${c.nom}`:`capitale ${de(c)}${c.nom}`;};

function placeGuess(cx,cy){
  if(!game||game.answered||!$("home").classList.contains("hidden")) return;
  const t=d3.zoomTransform(svg.node());
  const [mx,my]=t.invert([cx,cy]);
  if(my<0||my>MH) return;
  const ll=projection.invert([mx,my]); if(!ll||isNaN(ll[0])) return;
  game.guess=ll; game.pinId=(game.pinId||0)+1;
  $("go").disabled=false; $("tip").style.opacity=0;
  redrawOverlay();
}

function distToFeature(f,p){
  if(d3.geoContains(f,p)) return 0;
  let best=Infinity;
  const polys=f.geometry.type==="Polygon"?[f.geometry.coordinates]:f.geometry.coordinates;
  for(const poly of polys) for(const ring of poly) for(let i=0;i<ring.length-1;i++){
    const a=ring[i],b=ring[i+1],n=Math.max(1,Math.ceil(d3.geoDistance(a,b)/0.01)),it=n>1?d3.geoInterpolate(a,b):null;
    for(let s=0;s<(n>1?n:1);s++){const d=d3.geoDistance(p,it?it(s/n):a); if(d<best) best=d;}
  }
  return best;
}
const pointsFor=km=>km<=0?MAXPTS:Math.round(MAXPTS*Math.exp(-km/1200));

$("go").onclick=()=>{
  if(!game) return;
  if(!game.answered) validate(false);
  else {game.i++; if(game.i<game.n) nextRound(); else endGame();}
};

function validate(timeout){
  if(!game.guess && !timeout) return;
  cancelAnimationFrame(timerRAF);
  const q=game.list[game.i], c=q.c, f=byIso.get(c.iso), capPt=[c.lon,c.lat];
  let km=null, pts=0, bonus=0;
  if(game.guess){
    // pays absent de la carte (Tuvalu) : on mesure jusqu'à sa capitale
    const byCap=q.type==="capitale"||!f;
    km = byCap ? Math.round(d3.geoDistance(game.guess,capPt)*R) : Math.round(distToFeature(f,game.guess)*R);
    if(byCap && km<=50) km=0;
    pts=pointsFor(km); if(game.hint) pts=Math.round(pts/2);
    if(game.chrono && !timeout){
      const left=Math.max(0,CHRONO_S-(performance.now()-game.t0)/1000);
      bonus=Math.round(BONUS_MAX*(left/CHRONO_S)*(pts/MAXPTS));
    }
  }
  const gained=pts+bonus;
  // révisions : raté → à revoir ; réussi → appris
  const rk=`${q.type}|${c.iso}`, ok=km!==null&&km<=OK_KM&&!game.hint;
  let revMsg="";
  if(ok){ if(revisions.delete(rk)){ game.learned++; revMsg="✅ Appris ! Retiré de tes révisions"; } }
  else if(!revisions.has(rk)){ revisions.add(rk); revMsg="📚 Ajouté à tes révisions"; }
  else if(game.learn) revMsg="📚 On le reverra !";
  saveRev();
  game.total+=gained; game.answered=true; game.target=capPt; game.km=km;
  game.log.push({label:(q.type!=="capitale"?c.nom:c.cap),fl:flag(c.a2),pts:gained});
  lands.classed("target",d=>d.id===c.iso);
  redrawOverlay();
  [...$("dots").children][game.i].className="done";

  const msg = !game.guess?"⏰ Temps écoulé !":km===0?"🪿 Atterrissage parfait !":pts>=850?"😮 Presque !":pts>=650?"🔥 Super !":pts>=400?"👍 Pas mal !":pts>=150?"🙂 Tu chauffes…":"🧊 Brrr, c'est loin !";
  $("rflag").textContent=flag(c.a2);
  $("rmsg").textContent=msg;
  countUp($("rpts"),gained,"+"," pts");
  $("rbonus").textContent=[bonus?`⚡ dont +${bonus} bonus vitesse`:(game.hint&&game.guess?"💡 indice utilisé : points ÷ 2":""),revMsg].filter(Boolean).join(" · ");
  const where=`${dans(c)}${c.nom}`;
  $("rdetail").textContent = !game.guess ? (q.type!=="capitale"?`C'était ici : ${c.nom} (capitale ${c.cap})`:`${c.cap} est la capitale ${de(c)}${c.nom}`)
    : q.type!=="capitale" ? (km===0?`Ton oie s'est posée ${where} ! Capitale : ${c.cap}`:(f?`À ${fmt(km)} km de la frontière · capitale : ${c.cap}`:`À ${fmt(km)} km de ${c.cap}, capitale ${de(c)}${c.nom}`))
    : (km===0?`Tu as trouvé ${c.cap}, capitale ${de(c)}${c.nom} !`:`À ${fmt(km)} km de ${c.cap}, capitale ${de(c)}${c.nom}`);
  $("result").classList.add("show");
  countUp($("scoreval"),game.total,"","",game.total-gained);
  setGo(game.i+1<game.n?"Suivant ➜":"Voir mon score 🏁",false,true);
  if(km===0) confetti(60);

  // cadrage sur la flèche + la cible
  const pts2=[capPt]; if(game.guess) pts2.push(game.guess);
  const pb=path.bounds({type:"MultiPoint",coordinates:pts2}), fb=f?path.bounds(f):pb;
  let x0=Math.min(pb[0][0],fb[0][0]),y0=Math.min(pb[0][1],fb[0][1]),x1=Math.max(pb[1][0],fb[1][0]),y1=Math.max(pb[1][1],fb[1][1]);
  if(x1-x0>W*0.7){[[x0,y0],[x1,y1]]=pb;}
  const topH=$("qcard").getBoundingClientRect().bottom+10, botH=H-$("result").getBoundingClientRect().top+10;
  const availH=Math.max(120,H-topH-botH), availW=W-90;
  const s=Math.min(30,Math.max(1,Math.min(availW/(x1-x0+40),availH/(y1-y0+40))));
  const t=d3.zoomIdentity.translate(W/2,topH+availH/2).scale(s).translate(-(x0+x1)/2,-(y0+y1)/2);
  svg.transition().duration(900).call(zoom.transform,t);
}

function countUp(el,to,pre,suf,from=0){
  const t0=performance.now(),d=700;
  const step=now=>{const p=Math.min(1,(now-t0)/d),e=1-Math.pow(1-p,3);el.textContent=pre+fmt(Math.round(from+(to-from)*e))+suf;if(p<1)requestAnimationFrame(step);};
  requestAnimationFrame(step);
}

function redrawOverlay(){
  gOver.selectAll("*").remove();
  if(!game) return;
  const sc=1/k;
  if(game.answered&&game.guess&&game.km>0)
    gOver.append("path").attr("class","line").attr("d",path({type:"LineString",coordinates:[game.guess,game.target]}));
  if(game.answered){
    const q=game.list[game.i];
    const g=gOver.append("g").attr("class","mk").datum(game.target);
    g.append("circle").attr("class","ripple").attr("r",14).attr("fill","none").attr("stroke","#22b07d").attr("stroke-width",3);
    g.append("circle").attr("r",9).attr("fill","#fff").attr("stroke","#22b07d").attr("stroke-width",3.5);
    g.append("circle").attr("r",4).attr("fill","#22b07d");
    const label=(q.type!=="capitale"?q.c.nom:q.c.cap);
    const tw=label.length*8.6+44;
    const L=g.append("g").attr("class","tlabel");
    L.append("rect").attr("x",-tw/2).attr("y",-50).attr("width",tw).attr("height",32).attr("rx",16).attr("fill","#22b07d").attr("stroke","#fff").attr("stroke-width",2.5);
    L.append("path").attr("d","M-7,-19 L0,-11 L7,-19 Z").attr("fill","#22b07d");
    L.append("text").attr("y",-28).attr("text-anchor","middle").attr("fill","#fff").attr("font-weight",800).attr("font-size",17).attr("font-family","Baloo 2, sans-serif").text(flag(q.c.a2)+" "+label);
  }
  if(game.guess){
        const g=gOver.append("g").attr("class","mk").datum(game.guess);
    g.append("ellipse").attr("rx",14).attr("ry",4).attr("fill","rgba(0,30,60,.28)");
    const p=g.append("g").attr("class","pin-inner").attr("data-id",game.pinId);
    const O="#2b3a55";
    p.append("path").attr("d","M-3,-11 L-4,0 M3,-11 L4,0").attr("stroke","#f08a24").attr("stroke-width",2.6).attr("stroke-linecap","round");
    p.append("path").attr("d","M-8,0 L-1,0 M1,0 L8,0").attr("stroke","#f08a24").attr("stroke-width",2.6).attr("stroke-linecap","round");
    p.append("path").attr("d","M-14,-20 L-24,-27 L-21,-15 Z").attr("fill","#e9eef5").attr("stroke",O).attr("stroke-width",1.6).attr("stroke-linejoin","round");
    p.append("ellipse").attr("cx",-1).attr("cy",-18).attr("rx",15).attr("ry",10).attr("fill","#fff").attr("stroke",O).attr("stroke-width",1.8);
    p.append("path").attr("d","M10,-22 C11,-30 9,-35 13,-41").attr("fill","none").attr("stroke",O).attr("stroke-width",9.6).attr("stroke-linecap","round");
    p.append("path").attr("d","M10,-22 C11,-30 9,-35 13,-41").attr("fill","none").attr("stroke","#fff").attr("stroke-width",6).attr("stroke-linecap","round");
    p.append("ellipse").attr("cx",-1).attr("cy",-17.5).attr("rx",13.2).attr("ry",8.2).attr("fill","#fff");
    p.append("path").attr("d","M-11,-21 C-6,-27 5,-26 7,-19 C1,-15 -7,-15 -11,-21 Z").attr("fill","#cfd8e6").attr("stroke",O).attr("stroke-width",1.4).attr("stroke-linejoin","round");
    p.append("circle").attr("cx",13.5).attr("cy",-41).attr("r",6.2).attr("fill","#fff").attr("stroke",O).attr("stroke-width",1.8);
    p.append("path").attr("d","M18.5,-43.5 L27,-40.5 L18.5,-37.5 Z").attr("fill","#ff9a2e").attr("stroke",O).attr("stroke-width",1.4).attr("stroke-linejoin","round");
    p.append("circle").attr("cx",15).attr("cy",-42.5).attr("r",1.5).attr("fill",O);
    p.append("ellipse").attr("cx",12.6).attr("cy",-38.6).attr("rx",1.8).attr("ry",1.1).attr("fill","#ffb3a7").attr("opacity",.8);
  }
  if(game.answered) gOver.selectAll(".pin-inner").style("animation","none");
  placeMarkers();
}

function endGame(){
  const t=game.total, max=game.n*(MAXPTS+(game.chrono?BONUS_MAX:0));
  $("final").textContent="0"; countUp($("final"),t,"","");
  $("outof").textContent=`points sur ${fmt(max)}`;
  const r=t/max, n=r>=.85?5:r>=.7?4:r>=.5?3:r>=.3?2:r>=.15?1:0;
  $("stars").innerHTML=[0,1,2,3,4].map(i=>`<i class="${i<n?"on":""}" style="animation-delay:${.3+i*.15}s">★</i>`).join("");
  $("endtitle").textContent=["On s'entraîne encore ! 💪","Bon début ! 🙂","Pas mal du tout ! 👍","Très fort ! 🔥","Champion ! 🏆","Légende de la géo ! 🌟"][n];
  if(game.learn){
    const left=revItems().length;
    $("newbest").textContent=(game.learned?`✅ ${game.learned} appris · `:"")+(left?`📚 encore ${left} à revoir`:"🎉 Plus rien à revoir !");
  } else {
    const prev=+(store.get(bestKey())||0);
    if(t>prev){store.set(bestKey(),t);$("newbest").textContent=prev?"🏆 Nouveau record !":"🏆 Premier record !";} else $("newbest").textContent=`Record : ${fmt(prev)}`;
  }
  $("againbtn").textContent=game.learn?(revItems().length?"Continuer à réviser 📚":"Menu 🏠"):"Rejouer 🔁";
  const mx=Math.max(...game.log.map(l=>l.pts),1);
  $("recap").innerHTML=game.log.map(l=>`<div><span>${l.fl} ${l.label}</span><span style="display:flex;align-items:center;gap:8px"><i class="bar" style="width:${Math.round(60*l.pts/mx)}px;background:${l.pts>=650?"var(--good)":l.pts>=300?"var(--gold)":"var(--accent)"}"></i><b>${fmt(l.pts)}</b></span></div>`).join("");
  $("end").classList.remove("hidden");
  if(n>=3) setTimeout(()=>confetti(140),400);
}

// ---------- confettis ----------
function confetti(N){
  const cv=$("confetti"),ctx=cv.getContext("2d"),dpr=devicePixelRatio||1;
  cv.width=W*dpr;cv.height=H*dpr;ctx.scale(dpr,dpr);
  const cols=["#ff6b4a","#ffc53d","#22b07d","#4aa3d6","#b38cf0","#ff8fc7"];
  const ps=Array.from({length:N},()=>({x:W/2+(Math.random()-.5)*W*.3,y:H*.55,vx:(Math.random()-.5)*12,vy:-Math.random()*14-6,r:Math.random()*6+4,c:cols[Math.random()*cols.length|0],a:Math.random()*6,va:(Math.random()-.5)*.4}));
  const t0=performance.now();
  const f=now=>{ctx.clearRect(0,0,W,H);
    for(const p of ps){p.vy+=.35;p.vx*=.99;p.x+=p.vx;p.y+=p.vy;p.a+=p.va;ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.a);ctx.fillStyle=p.c;ctx.fillRect(-p.r/2,-p.r/4,p.r,p.r/2);ctx.restore();}
    if(now-t0<2600) requestAnimationFrame(f); else ctx.clearRect(0,0,W,H);};
  requestAnimationFrame(f);
}

function goHome(){cancelAnimationFrame(timerRAF);game=null;redrawOverlay();lands.classed("target",false);$("result").classList.remove("show");setGo("Valider 🎯",true,false);$("end").classList.add("hidden");$("home").classList.remove("hidden");showBest();}
$("startbtn").onclick=()=>startGame(false);
$("learnbtn").onclick=()=>startGame(true);
$("againbtn").onclick=()=>startGame(!!game?.learn);
$("menubtn").onclick=goHome;
$("homebtn").onclick=goHome;
showBest();
let rz; addEventListener("resize",()=>{clearTimeout(rz);rz=setTimeout(()=>{layout();svg.call(zoom.transform,game&&!game.answered?homeView():d3.zoomTransform(svg.node()));},150);});
layout();
svg.call(zoom.transform,homeView());
