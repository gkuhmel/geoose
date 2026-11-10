import * as d3 from "d3";
import * as topojson from "topojson-client";
import { presimplify, simplify } from "topojson-simplify";
import WORLD from "world-atlas/countries-50m.json";
import { COUNTRIES, CONTINENTS } from "./countries.js";
import { FACTS } from "./facts.js";
import { CITIES } from "./cities.js";
import { MONUMENTS } from "./monuments.js";
import { PLUME, ACCESSORIES, SLOTS, gooseParts, gooseSVG } from "./goose.js";
import { dayStr, seededRng, levelInfo, addXp, getEquip, setEquip, getStats, addPlayTime, recordAnswer, getDefi, currentStreak, defiDoneToday, finishDefi, MEDALS, getMedals, award } from "./progress.js";
import { sfx, say, unlock, soundOn, setSound, voiceOn, setVoice } from "./audio.js";
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
// Hong Kong et Macao : rattachés à la Chine (pour le mode Villes)
geoms.geometries.forEach(g=>{ if(g.id==="344"||g.id==="446") g.id="156"; });
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
// ---------- niveaux de détail (perf) ----------
// Le dessin utilise une géométrie simplifiée selon le zoom (le jeu, lui, garde la géométrie exacte).
// Seuils en px² à l'écran : PX_LAND pour les pays, PX_HALO (bien plus grossier) pour les halos côtiers,
// qui sont de gros traits flous et coûtaient ~80 % du rendu en pleine résolution.
const PRE = presimplify(WORLD);
const LOD_K=[1,3,10], PX_LAND=.5, PX_HALO=6;
let lodCache=[], lodIdx=-1;
function lodFor(i){
  if(lodCache[i]) return lodCache[i];
  const ppd=W/360*LOD_K[i], wt=px=>px/(ppd*ppd);
  const t=simplify(PRE,wt(PX_LAND)), g=t.objects.countries, th=simplify(PRE,wt(PX_HALO));
  return lodCache[i]={
    lands: topojson.feature(t,g).features.map(f=>path(f)),
    coast: tiles(topojson.mesh(t,g,(a,b)=>a===b)),
    halo: tiles(topojson.mesh(th,th.objects.countries,(a,b)=>a===b)),
  };
}
// découpe un trait (côtes) en tuiles de 30° : chaque tuile est un <path> séparé,
// que le navigateur ignore quand elle est hors écran (au lieu de retracer le monde entier).
function tiles(mesh){
  const b=new Map();
  for(const line of mesh.coordinates){
    const [lon,lat]=line[0], key=Math.floor(lon/30)+","+Math.floor(lat/30);
    if(!b.has(key)) b.set(key,[]); b.get(key).push(line);
  }
  return [...b.values()].map(ls=>path({type:"MultiLineString",coordinates:ls}));
}
function setLod(i){
  if(i===lodIdx) return; lodIdx=i;
  const L=lodFor(i);
  lands.attr("d",(d,j)=>L.lands[j]);
  gCoast.selectAll("path").data(L.coast).join("path").attr("d",d=>d);
  gHalo2.selectAll("path").data(L.halo).join("path").attr("d",d=>d);
  gHalo.selectAll("path").data(L.halo).join("path").attr("d",d=>d);
  drawHover();
}
const lodOfK=k=>k>=LOD_K[2]?2:k>=LOD_K[1]?1:0;
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
const path=d3.geoPath(projection).digits(2);
const root=svg.append("g");
const gGrat=root.append("path").attr("class","grat");
const gHalo2=root.append("g").attr("class","halo2");
const gHalo=root.append("g").attr("class","halo");
const gLand=root.append("g");
const gCoast=root.append("g").attr("class","coast");
const gHover=root.append("path").attr("class","hover");
const gOcean=root.append("g");
const gOver=root.append("g");
const lands=gLand.selectAll("path").data(features).join("path").attr("class",(d,i)=>"land c"+col[i]); // couleur = variable du thème (--l0…--l6)
const OCEANS=[["OCÉAN ATLANTIQUE",-38,30],["OCÉAN ATLANTIQUE",-18,-22],["OCÉAN PACIFIQUE",-140,8],["OCÉAN PACIFIQUE",165,22],["OCÉAN INDIEN",78,-18],["Mer Méditerranée",17,34.6,4],["OCÉAN ARCTIQUE",-5,78],["Mer du Nord",3.5,56.3,6]];
let W=0,H=0,k=1,MH=0;

function layout(){
  W=innerWidth; H=innerHeight;
  svg.attr("viewBox",`0 0 ${W} ${H}`);
  projection.scale(W/(2*Math.PI)).translate([W/2,0]);
  const top=projection([0,83.5])[1]; projection.translate([W/2,-top]);
  MH=projection([0,-58])[1];
  gGrat.attr("d",path(d3.geoGraticule().step([15,15]).extentMinor([[-180,-80],[180.01,85]])()));
  lodCache=[]; lodIdx=-1; setLod(lodOfK(k));
  gOcean.selectAll("text").data(OCEANS).join("text").attr("class","ocean-label").attr("font-size",d=>d[3]?13:15).text(d=>d[0]);
  zoom.translateExtent([[0,0],[W,MH]]).scaleExtent([1,40]);
  redrawOverlay();
  k=-1; // la projection a changé : le prochain onZoom recalcule étiquettes et marqueurs
}
function onZoom(t){
  root.attr("transform",t);
  if(t.k===k) return; // simple glissement : rien d'autre à recalculer
  k=t.k; root.style("--k",k);
  gOcean.selectAll("text").each(function(d){
    const [x,y]=projection([d[1],d[2]]);
    this.setAttribute("transform",`translate(${x},${y}) scale(${1/k})`); this.style.display=k>=(d[3]||0)?"":"none";
  });
  placeMarkers();
}
function placeMarkers(){ gOver.selectAll(".mk").attr("transform",d=>{const [x,y]=projection(d);return `translate(${x},${y}) scale(${1/k})`;}); }
// pas de pan quand le doigt attrape l'oie (c'est elle qu'on déplace)
// « mou » au bord : la carte peut glisser jusqu'à ce que son bord atteigne ~le milieu de l'écran,
// pour pouvoir centrer un pays en bout de carte (Nouvelle-Zélande, Alaska, Chili…).
const EDGE=.45;
function constrainView(t,ext){
  const [[x0,y0],[x1,y1]]=ext, w=x1-x0, h=y1-y0, mw=W*t.k, mh=MH*t.k;
  const fit=(pos,size,lo,len,m)=>{
    if(size<=len-2*m) return Math.min(Math.max(pos,lo+m),lo+len-m-size); // carte plus petite : elle reste entre les marges
    return Math.min(Math.max(pos,lo+len-m-size),lo+m);
  };
  const tx=fit(t.x,mw,x0,w,w*EDGE), ty=fit(t.y,mh,y0,h,mh<h?0:h*EDGE);
  return tx===t.x&&ty===t.y?t:d3.zoomIdentity.translate(tx,ty).scale(t.k);
}
const zoom=d3.zoom().constrain(constrainView).filter(e=>!e.target.closest?.(".pin-hit")&&(!e.ctrlKey||e.type==="wheel")&&!e.button).on("zoom",e=>onZoom(e.transform)).on("end",()=>setLod(lodOfK(k)));
svg.call(zoom).on("dblclick.zoom",null);
function viewOn(lon,lat,spanLon){
  const s=Math.max(1,360/spanLon); const [x,y]=projection([lon,lat]);
  return d3.zoomIdentity.translate(W/2,H/2).scale(s).translate(-x,-y);
}
// cadrage de départ : le continent choisi (Monde = centré sur l'Europe, comme avant)
function homeView(){
  const [lon,lat,sp,sl]=CONTINENTS[game?game.view:opts.cont].view;
  return viewOn(lon,lat, W>H ? (W>1000?sl:sl*1.2) : (W>600?sp*1.3:sp));
}
$("zin").onclick=()=>svg.transition().duration(300).call(zoom.scaleBy,1.8);
$("zout").onclick=()=>svg.transition().duration(300).call(zoom.scaleBy,1/1.8);
$("zworld").onclick=()=>svg.transition().duration(700).call(zoom.transform,d3.zoomIdentity.translate(0,(H-MH)/2));

// ---------- gestes ----------
// Tap simple (sans glisser) = poser / déplacer l'oie ; glisser = bouger la carte ; pincer = zoomer.
// Appui sur l'oie puis glisser = ajuster finement : l'oie s'envole et son ombre, LIFT px au-dessus
// du doigt (pour que le doigt ne la cache pas), marque le point exact où elle va atterrir.
const LIFT=60;
const ptrs=new Map(); let multi=false, drag=null;
svg.on("pointerdown",e=>{
  ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY,t:performance.now()}); if(ptrs.size>1){multi=true;endDrag();return;}
  if(e.target.closest(".pin-hit")&&canPlay()&&game.guess){
    const t=d3.zoomTransform(svg.node()), [fx,fy]=t.apply(projection(game.guess));
    drag={id:e.pointerId,t0:performance.now(),ox:fx-e.clientX,oy:fy-e.clientY};
    svg.classed("dragging",true);
    try{svg.node().setPointerCapture(e.pointerId);}catch(_){}
  }
});
svg.on("pointermove",e=>{
  if(!drag||e.pointerId!==drag.id) return;
  if(!canPlay()){endDrag();return;}
  // décalage initial (là où on a attrapé l'oie) → oie soulevée au-dessus du doigt, en 150 ms
  const a=Math.min(1,(performance.now()-drag.t0)/150);
  const ox=drag.ox*(1-a), oy=drag.oy*(1-a)-LIFT*a;
  const ll=screenToLL(e.clientX+ox,e.clientY+oy); if(!ll) return;
  game.guess=ll; gOver.select(".mk.goose").datum(ll); placeMarkers(); updateHover();
});
svg.on("pointerup pointercancel",e=>{
  const p=ptrs.get(e.pointerId); ptrs.delete(e.pointerId);
  const wasMulti=multi; if(ptrs.size===0) multi=false;
  if(drag&&e.pointerId===drag.id){endDrag();return;}
  if(!p||wasMulti||e.type==="pointercancel") return;
  if(Math.hypot(e.clientX-p.x,e.clientY-p.y)>12||performance.now()-p.t>500) return; // c'était un glissement
  if(e.target.closest(".pin-hit")) return; // simple tap sur l'oie : rien
  if(pmap){ passMapTap(e.clientX,e.clientY); return; }
  placeGuess(e.clientX,e.clientY);
});
function endDrag(){ if(!drag) return; drag=null; svg.classed("dragging",false); }
const canPlay=()=>game&&!game.answered&&!game.quiz&&$("home").classList.contains("hidden");
function screenToLL(cx,cy){
  const [mx,my]=d3.zoomTransform(svg.node()).invert([cx,cy]);
  if(my<0||my>MH) return null;
  const ll=projection.invert([mx,my]); return ll&&!isNaN(ll[0])?ll:null;
}

// ---------- pays sous l'oie (surbrillance, modes pays / drapeau) ----------
const fBounds=features.map(f=>d3.geoBounds(f));
function countryAt(ll){
  const [lon,lat]=ll;
  for(let j=0;j<features.length;j++){
    const f=features[j], b=fBounds[j]; if(f.id===undefined) continue;
    if(lat<b[0][1]||lat>b[1][1]) continue;
    if(b[0][0]<=b[1][0] ? (lon<b[0][0]||lon>b[1][0]) : (lon<b[0][0]&&lon>b[1][0])) continue;
    if(d3.geoContains(f,ll)) return f.id;
  }
  return null;
}
let hoverId=null;
function updateHover(){
  const q=game&&game.list[game.i];
  const id=q&&!game.answered&&game.guess&&(q.type==="pays"||q.type==="drapeau")?countryAt(game.guess):null;
  if(id!==hoverId){hoverId=id;drawHover();}
}
function drawHover(){
  if(!hoverId||lodIdx<0){gHover.attr("d",null);return;}
  const L=lodCache[lodIdx]; gHover.attr("d",features.map((f,j)=>f.id===hoverId?L.lands[j]:"").join(""));
}

// ---------- options (mémorisées) ----------
// chrono : 0 = calme, 1 = chrono, 2 = survie (3 vies), 3 = quiz (mode inversé, 4 choix)
const OPTS_KEY="geoose-options", NAMES_KEY="geoose-noms";
let opts={mode:"pays",level:1,chrono:0,cont:"monde",players:1};
try{ Object.assign(opts,JSON.parse(store.get(OPTS_KEY)||"{}")); }catch(e){}
if(!CONTINENTS[opts.cont]) opts.cont="monde";
let game=null, timerRAF=0;
const NUM_KEYS=new Set(["level","chrono","players"]);
// joueurs (mode à deux) : couleur du badge / du trait ; plumage dans goose.js (oie blanche / cendrée)
const PCOL=["#4aa3d6","#f08a24"];
let equip=getEquip();

$("conts").innerHTML=Object.entries(CONTINENTS).map(([k,v])=>`<button class="choice" data-v="${k}"><span class="e">${v.e}</span>${v.nom}</button>`).join("");
document.querySelectorAll(".choices[data-k]").forEach(g=>{
  const key=g.dataset.k;
  g.querySelectorAll(".choice").forEach(x=>x.classList.toggle("on",x.dataset.v===String(opts[key])));
  g.addEventListener("click",e=>{
    const b=e.target.closest(".choice"); if(!b) return;
    g.querySelectorAll(".choice").forEach(x=>x.classList.toggle("on",x===b));
    opts[key]=NUM_KEYS.has(key)?+b.dataset.v:b.dataset.v;
    store.set(OPTS_KEY,JSON.stringify(opts));
    if(key==="cont"&&!game) svg.transition().duration(700).call(zoom.transform,homeView());
    showBest();
  });
});
// prénoms (mode à deux)
try{ const n=JSON.parse(store.get(NAMES_KEY)||"null")||["Nils","Papa"]; $("name1").value=n[0]; $("name2").value=n[1]; }catch(e){ $("name1").value="Nils"; $("name2").value="Papa"; }
["name1","name2"].forEach(id=>$(id).addEventListener("input",()=>store.set(NAMES_KEY,JSON.stringify([$("name1").value,$("name2").value]))));
["name1","name2"].forEach(id=>$(id).addEventListener("keydown",e=>{if(e.key==="Enter")e.target.blur();}));

// ---------- questions ----------
// types : pays, capitale, drapeau, ville (grandes villes), monument (merveilles : monuments, sites, animaux)
const TYPES=["pays","capitale","drapeau","ville","monument"];
const cityById=new Map(CITIES.map(v=>[v.id,v]));
const monById=new Map(MONUMENTS.map(m=>[m.id,m]));
const cap1=s=>s[0].toUpperCase()+s.slice(1);
const monTitle=m=>`${m.e} ${cap1(m.nom)}`;
// nom à trouver / point cible / clé (révisions, doublons) d'une question
const placeName=q=>q.type==="ville"?q.city.nom:q.type==="monument"?monTitle(q.mon):q.type==="capitale"?q.c.cap:q.c.nom;
const targetOf=q=>q.city?[q.city.lon,q.city.lat]:q.mon?[q.mon.lon,q.mon.lat]:[q.c.lon,q.c.lat];
const revKey=q=>q.type==="ville"?`ville|${q.city.id}`:q.type==="monument"?`monument|${q.mon.id}`:`${q.type}|${q.c.iso}`;
const qKey=q=>q.city?q.city.id:q.mon?q.mon.id:q.c.iso;
const shuffle=(a,rnd=Math.random)=>{for(let i=a.length-1;i>0;i--){const j=rnd()*(i+1)|0;[a[i],a[j]]=[a[j],a[i]]}return a};
const byKey=new Map(C.map(c=>[c.iso,c]));
const nomAvecArticle=c=>c.art==="l'"?"l'"+c.nom:c.art?c.art+" "+c.nom:c.nom;
// pays sans voisin terrestre (médaille « Île au trésor »)
const ISLANDS=new Set();
{ const m=new Map(); features.forEach((f,j)=>{ if(f.id!==undefined) m.set(f.id,(m.get(f.id)??true)&&nb[j].length===0); }); m.forEach((v,k)=>v&&ISLANDS.add(k)); }

// toutes les questions possibles d'un type, d'une renommée et d'un continent (difficulté = renommée, 1 célèbre … 4 rareté)
function candidates(types,lv,cont){
  const inCont=c=>c&&(cont==="monde"||c.cont===cont), out=[];
  for(const t of types){
    if(t==="ville") CITIES.forEach(v=>{ const c=byKey.get(v.iso); if(v.tier===lv&&inCont(c)) out.push({c,type:t,city:v}); });
    else if(t==="monument") MONUMENTS.forEach(m=>{ const c=byKey.get(m.iso); if(m.tier===lv&&inCont(c)) out.push({c,type:t,mon:m}); });
    else C.forEach(c=>{ if(inCont(c)&&c.tier[t]===lv) out.push({c,type:t}); });
  }
  return out;
}
// Tire n questions dont la renommée correspond au niveau (complète avec les niveaux voisins s'il en manque)
function pickQuestions(mode,level,cont,n=ROUNDS,used=new Set()){
  const types=mode==="mix"?TYPES:[mode], out=[];
  for(const d of [0,1,-1,2,-2,3,-3]){
    const lv=level+d; if(lv<1||lv>4) continue;
    for(const q of shuffle(candidates(types,lv,cont))){ if(out.length>=n) break; const k=qKey(q); if(!used.has(k)){used.add(k);out.push(q);} }
    if(out.length>=n) break;
  }
  return shuffle(out);
}
// défi du jour : 5 questions (une par type), les mêmes pour tout le monde le même jour
function defiQuestions(){
  const rnd=seededRng("geoose-defi-"+dayStr()), out=[], used=new Set();
  const plan=shuffle(["pays","capitale","drapeau","ville","monument"],rnd);
  for(const t of plan){
    const lv=1+Math.floor(rnd()*3);
    let cands=candidates([t],lv,"monde"); if(!cands.length) cands=candidates([t],1,"monde");
    for(let k=0;k<20;k++){ const q=cands[Math.floor(rnd()*cands.length)]; if(!used.has(q.c.iso)){ used.add(q.c.iso); out.push(q); break; } }
  }
  return out;
}

// ---------- révisions (mode apprentissage) ----------
// clé "type|iso" (ou ville|id, monument|id) : une question ratée y est ajoutée ; une bonne réponse l'en retire.
const OK_KM=150, REV_KEY="geoose-revisions";
const loadSet=k=>{try{const a=JSON.parse(store.get(k)||"[]");return new Set(Array.isArray(a)?a:[]);}catch(e){return new Set();}};
let revisions=loadSet(REV_KEY);
const saveRev=()=>store.set(REV_KEY,JSON.stringify([...revisions]));
function qFromKey(k){
  const i=k.indexOf("|"), type=k.slice(0,i), rest=k.slice(i+1);
  if(type==="ville"){ const city=cityById.get(rest); return {c:city&&byKey.get(city.iso),type,city}; }
  if(type==="monument"){ const mon=monById.get(rest); return {c:mon&&byKey.get(mon.iso),type,mon}; }
  return {c:byKey.get(rest),type};
}
const revItems=()=>[...revisions].map(qFromKey).filter(q=>q.c&&TYPES.includes(q.type));

// ---------- passeport : un tampon par pays et par mode réussi ----------
const PASS_KEY="geoose-passeport", MODES=[["pays","🗺️"],["capitale","🏛️"],["drapeau","🚩"],["ville","🏙️"]];
let passport={}; try{ passport=JSON.parse(store.get(PASS_KEY)||"{}")||{}; }catch(e){}
let passDates={}; try{ passDates=JSON.parse(store.get(PASS_KEY+"-dates")||"{}")||{}; }catch(e){}
const stamped=c=>(passport[c.iso]||[]).length>0;
// renvoie 2 = nouveau pays, 1 = nouveau mode pour ce pays, 0 = déjà tamponné (les merveilles ne tamponnent pas)
function addStamp(c,type){
  if(!MODES.some(m=>m[0]===type)) return 0;
  const a=passport[c.iso]||(passport[c.iso]=[]);
  if(a.includes(type)) return 0;
  a.push(type); store.set(PASS_KEY,JSON.stringify(passport));
  if(!passDates[c.iso]){ passDates[c.iso]=dayStr(); store.set(PASS_KEY+"-dates",JSON.stringify(passDates)); }
  return a.length===1?2:1;
}
// ---------- dessin d'un tampon (SVG) : anneau à l'encre du continent, nom en arc, drapeau, étoiles, date ----------
const INK={europe:"#2f62b0",afrique:"#c4502f",asie:"#b52d45",ameriques:"#23885a",oceanie:"#7a4bb0"};
const MOIS=["JANV","FÉVR","MARS","AVR","MAI","JUIN","JUIL","AOÛT","SEPT","OCT","NOV","DÉC"];
const hashIso=s=>[...s].reduce((h,ch)=>(h*31+ch.charCodeAt(0))%997,7);
const esc=t=>t.replace(/&/g,"&amp;").replace(/</g,"&lt;");
function stampSVG(c,{got=passport[c.iso]||[],date=passDates[c.iso]}={}){
  const id="a"+c.iso, name=esc(c.nom.toUpperCase());
  // arc de 240° (de 210° à -30°) pour le nom, rayon 46.5 ; taille de police selon la longueur
  const r=46.5, a0=210*Math.PI/180, a1=-30*Math.PI/180;
  const P=a=>`${(60+r*Math.cos(a)).toFixed(1)},${(60-r*Math.sin(a)).toFixed(1)}`;
  const fs=Math.min(10.5,195/(c.nom.length*.66));
  if(!got.length){
    return `<svg viewBox="0 0 120 120" class="stampsvg off"><circle cx="60" cy="60" r="54" fill="none" stroke="#c3cad8" stroke-width="2" stroke-dasharray="5 4"/>
<text x="60" y="66" text-anchor="middle" font-size="34" class="fl">${flag(c.a2)}</text>
<text x="60" y="94" text-anchor="middle" font-size="${Math.min(14,170/c.nom.length).toFixed(1)}" font-weight="800" fill="#97a1b5">${esc(c.nom)}</text></svg>`;
  }
  const ink=INK[c.cont]||"#2f62b0", rot=(hashIso(c.iso)%29)-14, n=got.length;
  const d=date?date.split("-"):null, dateTxt=d?`${d[2]} ${MOIS[+d[1]-1]} ${d[0]}`:"";
  const stars=[0,1,2,3].map(i=>`<text x="${42+i*12}" y="88" text-anchor="middle" font-size="10" fill="${i<n?ink:"none"}" stroke="${ink}" stroke-width=".8">★</text>`).join("");
  return `<svg viewBox="0 0 120 120" class="stampsvg" style="transform:rotate(${rot}deg)">
<defs><path id="${id}" d="M${P(a0)} A${r},${r} 0 1,1 ${P(a1)}"/><path id="${id}b" d="M${P(-150*Math.PI/180)} A${r},${r} 0 0,0 ${P(-30*Math.PI/180)}"/></defs>
<g fill="none" stroke="${ink}"><circle cx="60" cy="60" r="56" stroke-width="3.2"/><circle cx="60" cy="60" r="38" stroke-width="1.4"/>${n===4?`<circle cx="60" cy="60" r="52.5" stroke-width="1" stroke-dasharray="2 2.4"/>`:""}</g>
<text font-size="${fs.toFixed(1)}" font-weight="800" fill="${ink}" letter-spacing=".6"><textPath href="#${id}" startOffset="50%" text-anchor="middle">${name}</textPath></text>
${dateTxt?`<text font-size="7" font-weight="700" fill="${ink}" letter-spacing=".8"><textPath href="#${id}b" startOffset="50%" text-anchor="middle">${dateTxt}</textPath></text>`:""}
<text x="60" y="68" text-anchor="middle" font-size="30" class="fl">${flag(c.a2)}</text>${stars}</svg>`;
}
let passTab="europe";
function renderPassport(){
  const n=C.filter(stamped).length;
  $("ptotal").textContent=`${n} pays visité${n>1?"s":""} sur ${C.length}`;
  $("ptabs").innerHTML=Object.entries(CONTINENTS).filter(([k])=>k!=="monde").map(([k,v])=>{
    const all=C.filter(c=>c.cont===k), got=all.filter(stamped).length;
    return `<button class="ptab${k===passTab?" on":""}" data-k="${k}">${v.e} ${v.nom}<small>${got}/${all.length}</small></button>`;
  }).join("");
  $("pgrid").innerHTML=C.filter(c=>c.cont===passTab).map(c=>`<button class="stamp" data-iso="${c.iso}">${stampSVG(c)}</button>`).join("");
  $("pgrid").scrollTop=0;
}
$("ptabs").addEventListener("click",e=>{const b=e.target.closest(".ptab"); if(b){passTab=b.dataset.k; renderPassport();}});
$("pgrid").addEventListener("click",e=>{
  const b=e.target.closest(".stamp"); if(!b) return; const c=byKey.get(b.dataset.iso), got=passport[c.iso]||[];
  if(voiceOn()) say(`${nomAvecArticle(c)}. Capitale : ${c.cap}.`+(got.length?` ${got.length} étoile${got.length>1?"s":""} sur 4.`:""));
});
const openScreen=id=>{ unlock(); $(id).classList.remove("hidden"); };
const closeScreen=id=>{ $(id).classList.add("hidden"); showBest(); };
$("passbtn").onclick=()=>{ renderPassport(); openScreen("passport"); };
$("passclose").onclick=()=>closeScreen("passport");

// ---------- réglages : sons, voix, thème ----------
function showSound(){ document.querySelectorAll(".sound").forEach(b=>{ b.firstChild.textContent=soundOn()?"🔊":"🔇"; b.classList.toggle("off",!soundOn()); }); }
document.querySelectorAll(".sound").forEach(b=>b.addEventListener("click",()=>{ setSound(!soundOn()); unlock(); showSound(); if(soundOn()) sfx.plop(); }));
document.addEventListener("pointerdown",unlock,{once:true,capture:true});
showSound();
// voix : lecture des noms (questions, passeport) ; désactivée par défaut
function showVoice(){ document.querySelectorAll(".voice").forEach(b=>{ b.firstChild.textContent=voiceOn()?"🗣️":"🤐"; b.classList.toggle("off",!voiceOn()); }); }
document.querySelectorAll(".voice").forEach(b=>b.addEventListener("click",()=>{ setVoice(!voiceOn()); unlock(); showVoice(); if(voiceOn()) say("Je lirai les questions."); }));
showVoice();
// thèmes : Atlas (clair), Néon (nuit lumineuse), Vieille carte (parchemin)
const THEMES=[["atlas","Atlas","#5fb3e0"],["neon","Néon","#0e1238"],["carte","Vieille carte","#c9d1ae"]];
function applyTheme(id){
  const t=THEMES.find(x=>x[0]===id)||THEMES[0];
  if(t[0]==="atlas") delete document.documentElement.dataset.theme; else document.documentElement.dataset.theme=t[0];
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content",t[2]);
  document.querySelectorAll("#themes .choice").forEach(b=>b.classList.toggle("on",b.dataset.t===t[0]));
  store.set("geoose-theme",t[0]);
}
$("themes").addEventListener("click",e=>{ const b=e.target.closest(".choice"); if(b){ applyTheme(b.dataset.t); sfx.plop(); } });
applyTheme(store.get("geoose-theme")||"atlas");
$("setbtn").onclick=()=>openScreen("reglages");
$("setclose").onclick=()=>closeScreen("reglages");

// ---------- carte du passeport : pays tamponnés coloriés à l'encre du continent ----------
const PASTEL={europe:"var(--p-europe)",afrique:"var(--p-afrique)",asie:"var(--p-asie)",ameriques:"var(--p-ameriques)",oceanie:"var(--p-oceanie)"};
let pmap=false;
function openPassMap(){
  pmap=true;
  $("passport").classList.add("hidden"); $("home").classList.add("hidden");
  document.body.classList.add("pmap");
  const vis=new Set(C.filter(stamped).map(c=>c.iso));
  lands.style("fill",d=>vis.has(d.id)?PASTEL[byKey.get(d.id).cont]:null);
  $("pmapn").textContent=`🛂 ${vis.size} pays visité${vis.size>1?"s":""} sur ${C.length}`;
  $("pmaplegend").innerHTML=Object.entries(CONTINENTS).filter(([k])=>k!=="monde").map(([k,v])=>{
    const all=C.filter(c=>c.cont===k); return `<span><i style="background:${PASTEL[k]}"></i>${v.nom} ${all.filter(stamped).length}/${all.length}</span>`;}).join("");
  $("pmapbar").hidden=false; $("pmapcard").hidden=true;
  // monde entier, centré verticalement sous la barre
  const top=$("pmapbar").getBoundingClientRect().bottom;
  svg.transition().duration(800).call(zoom.transform,d3.zoomIdentity.translate(0,Math.max(top+8,(H-MH)/2)));
}
function closePassMap(){
  pmap=false; document.body.classList.remove("pmap");
  lands.style("fill",null);
  $("pmapbar").hidden=true; $("pmapcard").hidden=true;
  renderPassport(); $("home").classList.remove("hidden"); $("passport").classList.remove("hidden");
  svg.transition().duration(700).call(zoom.transform,homeView());
}
function passMapTap(cx,cy){
  const ll=screenToLL(cx,cy), c=ll&&byKey.get(countryAt(ll));
  if(!c){ $("pmapcard").hidden=true; return; }
  const got=passport[c.iso]||[];
  $("pmapcard").innerHTML=`${stampSVG(c)}<div><b>${flag(c.a2)} ${c.nom}</b><span>Capitale : ${c.cap}</span><span>${got.length?`${"★".repeat(got.length)}${"☆".repeat(4-got.length)} · ${got.map(t=>({pays:"pays",capitale:"capitale",drapeau:"drapeau",ville:"ville"})[t]).join(", ")}`:"Pas encore visité : à toi de jouer !"}</span></div>`;
  $("pmapcard").hidden=false;
  if(voiceOn()) say(nomAvecArticle(c));
}
$("pmapbtn").onclick=openPassMap;
$("pmapback").onclick=closePassMap;

// ---------- mon oie : niveau, XP, accessoires ----------
function renderLevel(){
  const L=levelInfo();
  $("lvlbadge").innerHTML=`Niv. ${L.lvl}<i style="width:${Math.round(100*L.cur/L.need)}%"></i>`;
  $("brandgoose").innerHTML=gooseSVG(equip,"idle");
}
function renderOie(){
  const L=levelInfo();
  $("oiepreview").innerHTML=gooseSVG(equip,"idle");
  $("oielvl").innerHTML=`<b>Niveau ${L.lvl}</b><span class="xpbar"><i style="width:${Math.round(100*L.cur/L.need)}%"></i></span><small>${L.cur} / ${L.need} XP pour le niveau ${L.lvl+1}</small>`;
  $("oiegrid").innerHTML=ACCESSORIES.map(a=>{
    const open=L.lvl>=a.lvl, on=equip[a.slot]===a.id;
    return `<button class="acc${open?"":" locked"}${on?" on":""}" data-id="${a.id}"><span class="e">${open?a.e:"🔒"}</span>${a.nom}<small>${open?(on?"porté ✓":SLOTS[a.slot]):`niveau ${a.lvl}`}</small></button>`;
  }).join("");
}
$("oiegrid").addEventListener("click",e=>{
  const b=e.target.closest(".acc"); if(!b) return;
  const a=ACCESSORIES.find(x=>x.id===b.dataset.id);
  if(levelInfo().lvl<a.lvl){ toast(`🔒 Niveau ${a.lvl} pour débloquer !`); return; }
  if(equip[a.slot]===a.id) delete equip[a.slot]; else equip[a.slot]=a.id;
  setEquip(equip); sfx.plop(); renderOie(); renderLevel();
});
$("oiebtn").onclick=()=>{ renderOie(); openScreen("oie"); };
$("oieclose").onclick=()=>closeScreen("oie");

// ---------- progrès : médailles + tableau pour les parents ----------
let progTab="medailles";
function keyLabel(k){ const q=qFromKey(k); return q.c?`${q.type==="monument"?"":flag(q.c.a2)+" "}${placeName(q)} <small>(${({pays:"pays",capitale:"capitale",drapeau:"drapeau",ville:"ville",monument:"merveille"})[q.type]})</small>`:null; }
function renderProgres(){
  document.querySelectorAll("#progtabs .ptab").forEach(b=>b.classList.toggle("on",b.dataset.k===progTab));
  const got=getMedals();
  if(progTab==="medailles"){
    $("progbody").innerHTML=`<div class="mtotal">${Object.keys(got).length} / ${MEDALS.length} médailles</div><div class="medals">`+MEDALS.map(m=>{
      const d=got[m.id];
      return `<div class="medal${d?" on":""}"><span class="e">${m.e}</span><b>${m.nom}</b><small>${m.desc}</small>${d?`<i>${d.split("-").reverse().join("/")}</i>`:""}</div>`;
    }).join("")+"</div>";
    return;
  }
  const s=getStats(), L=levelInfo(), df=getDefi();
  let week=0; for(let i=0;i<7;i++){ const d=new Date(); d.setDate(d.getDate()-i); week+=s.days[dayStr(d)]||0; }
  const conts=Object.entries(CONTINENTS).filter(([k])=>k!=="monde").map(([k,v])=>{
    const all=C.filter(c=>c.cont===k), n=all.filter(stamped).length;
    return `<div class="srow"><span>${v.e} ${v.nom}</span><span class="sbar"><i style="width:${Math.round(100*n/all.length)}%;background:${PASTEL[k]}"></i></span><b>${n}/${all.length}</b></div>`;
  }).join("");
  const modes=TYPES.filter(t=>s.ok[t]).map(t=>{ const [a,b]=s.ok[t];
    return `<div class="srow"><span>${({pays:"🗺️ Pays",capitale:"🏛️ Capitales",drapeau:"🚩 Drapeaux",ville:"🏙️ Villes",monument:"🗿 Merveilles"})[t]}</span><span class="sbar"><i style="width:${Math.round(100*a/b)}%"></i></span><b>${Math.round(100*a/b)} %</b></div>`; }).join("")||`<p class="muted">Pas encore de partie.</p>`;
  const misses=Object.entries(s.miss).sort((a,b)=>b[1]-a[1]).map(([k,n])=>[keyLabel(k),n]).filter(x=>x[0]).slice(0,6)
    .map(([l,n])=>`<li>${l} <b>${n}×</b></li>`).join("")||`<li class="muted">Rien à signaler 👏</li>`;
  const confs=Object.entries(s.conf).sort((a,b)=>b[1]-a[1]).map(([k,n])=>{ const [x,y]=k.split(">").map(i=>byKey.get(i)); return x&&y?`<li>${flag(x.a2)} ${x.nom} ↔ ${flag(y.a2)} ${y.nom} <b>${n}×</b></li>`:""; }).filter(Boolean).slice(0,4).join("")||`<li class="muted">Aucune pour l'instant</li>`;
  $("progbody").innerHTML=`
  <div class="sgrid">
    <div class="scard"><b>${Math.round(week/60)} min</b><small>de jeu cette semaine</small></div>
    <div class="scard"><b>${s.games}</b><small>parties jouées</small></div>
    <div class="scard"><b>🔥 ${currentStreak(df)}</b><small>jours de défi (record ${df.best})</small></div>
    <div class="scard"><b>Niv. ${L.lvl}</b><small>${L.xp} XP en tout</small></div>
  </div>
  <h4>🛂 Pays au passeport</h4>${conts}
  <h4>🎯 Réussite par mode</h4>${modes}
  <h4>📌 À retravailler</h4><ul>${misses}</ul>
  <h4>🔀 Confusions fréquentes</h4><ul>${confs}</ul>`;
}
$("progtabs").addEventListener("click",e=>{ const b=e.target.closest(".ptab"); if(b){ progTab=b.dataset.k; renderProgres(); } });
$("progbtn").onclick=()=>{ renderProgres(); openScreen("progres"); };
$("progclose").onclick=()=>closeScreen("progres");

// ---------- accueil ----------
const special=()=>opts.chrono>=2; // survie et quiz : solo
const bestKey=()=>`geoose4-${opts.mode}-${opts.level}-${opts.chrono}-${opts.cont}`;
function showBest(){
  const solo=opts.players===1||special(), b=store.get(bestKey());
  $("best").textContent=solo&&b?(opts.chrono===2?`🏆 Record : ${b} bonnes réponses`:`🏆 Record : ${fmt(+b)} pts`):"";
  $("names").hidden=solo;
  document.querySelector('[data-k="players"]').classList.toggle("dim",special());
  const n=revItems().length;
  $("learnbtn").disabled=n===0;
  $("learnn").textContent=n?`${n} à revoir`:"à jour 🎉";
  $("passn").textContent=`${C.filter(stamped).length} / ${C.length}`;
  $("progn").textContent=`${Object.keys(getMedals()).length} 🏅`;
  const df=getDefi(), st=currentStreak(df);
  $("defibtn").classList.toggle("done",defiDoneToday(df));
  $("defin").textContent=defiDoneToday(df)?`✅ fait · 🔥 ${st}`:st?`🔥 ${st} jour${st>1?"s":""}`:"5 questions";
  renderLevel();
}

// ---------- partie ----------
// kind : "normal" | "learn" (révisions) | "defi" (défi du jour)
function startGame(kind="normal"){
  unlock();
  const learn=kind==="learn", defi=kind==="defi";
  const survie=!learn&&!defi&&opts.chrono===2, quiz=!learn&&!defi&&opts.chrono===3;
  const used=new Set();
  const list=learn?shuffle(revItems()).slice(0,ROUNDS):defi?defiQuestions():pickQuestions(opts.mode,opts.level,opts.cont,survie?6:ROUNDS,used);
  if(!list.length){ goHome(); return; }
  const np=learn||defi||survie||quiz?1:opts.players, names=[$("name1").value.trim()||"Joueur 1",$("name2").value.trim()||"Joueur 2"];
  game={kind,learn,defi,survie,quiz,chrono:!learn&&!defi&&opts.chrono===1,n:survie?Infinity:list.length,list,used,i:0,
    view:learn||defi?"monde":opts.cont,learned:0,stamps:[],medals:[],run:0,okCount:0,lives:3,t0Game:performance.now(),
    players:Array.from({length:np},(_,p)=>({name:np>1?names[p]:"",total:0,log:[]}))};
  $("dots").innerHTML=survie?"":"<i></i>".repeat(game.n);
  ["home","end","passport","oie","progres","reglages"].forEach(id=>$(id).classList.add("hidden"));
  $("clock").classList.toggle("on",game.chrono); $("timer").classList.toggle("on",game.chrono);
  setScore();
  nextRound();
}
const duo=()=>game.players.length>1;
const hearts=()=>"❤️".repeat(game.lives)+"🖤".repeat(3-game.lives);

function nextRound(){
  Object.assign(game,{turn:0,recs:[],results:null,answered:false});
  // survie : on rallonge la liste au fur et à mesure, de plus en plus dur (+1 niveau toutes les 5 réussites)
  if(game.survie&&game.i>=game.list.length-1){
    const lv=Math.min(4,opts.level+Math.floor(game.okCount/5));
    game.list.push(...pickQuestions(opts.mode,lv,opts.cont,5,game.used));
  }
  $("rlabel").textContent=game.survie?`n°${game.i+1}`:`${game.learn?"📚 ":game.defi?"🗓️ ":""}${game.i+1}/${game.n}`;
  if(game.survie) $("dots").textContent=hearts();
  else [...$("dots").children].forEach((d,i)=>{d.className=i<game.i?"done":i===game.i?"cur":""});
  startTurn();
}

const QLABEL={pays:"Où se trouve le pays…",capitale:"Où se trouve la capitale…",drapeau:"Où se trouve le pays de ce drapeau ?",ville:"Où se trouve la ville…",monument:"Où se trouve…"};
// un tour = un joueur pose son oie (à deux : même question pour les deux, réponse révélée après le 2e)
function startTurn(){
  const q=game.list[game.i];
  Object.assign(game,{guess:null,hint:false});
  const P=game.players[game.turn];
  $("turn").hidden=!duo();
  if(duo()) $("turn").innerHTML=`<i style="background:${PCOL[game.turn]}"></i>${P.name}, à toi !`;
  $("qcard").classList.remove("swap"); void $("qcard").offsetWidth; $("qcard").classList.add("swap");
  $("qhint").textContent="";
  lands.classed("target",false); updateHover();
  $("result").classList.remove("show");
  $("qopts").hidden=!game.quiz;
  if(game.quiz){ startQuiz(q); return; }
  $("qlabel").textContent=q.type==="monument"&&q.mon.kind==="a"?"Où vivent…":QLABEL[q.type];
  $("qname").textContent=q.type==="drapeau"?flag(q.c.a2):placeName(q);
  $("qname").classList.toggle("flagq",q.type==="drapeau");
  $("hintbtn").textContent=q.type==="drapeau"?"💡 Voir le nom (points ÷ 2)":"💡 Indice (points ÷ 2)";
  $("hintbtn").hidden=q.type==="pays";
  setGo("Valider 🎯",true,false);
  svg.transition().duration(700).call(zoom.transform,homeView());
  $("tip").style.opacity=game.i<3&&game.turn===0?1:0;
  redrawOverlay();
  if(voiceOn()) speakQuestion(duo()?`${P.name}, à toi ! `:"");
  if(game.chrono) startTimer();
}
function speakQuestion(prefix=""){
  if(!game) return;
  const q=game.list[game.i];
  say(prefix+(q.type==="pays"?`Où se trouve ${nomAvecArticle(q.c)} ?`:q.type==="drapeau"?"À quel pays est ce drapeau ?":q.type==="monument"?`${q.mon.kind==="a"?"Où vivent":"Où se trouve"} ${q.mon.nom} ?`:`Où se trouve ${placeName(q)} ?`));
}
$("qname").addEventListener("click",()=>{ if(voiceOn()&&!game?.quiz) speakQuestion(); });
function setGo(txt,disabled,green){const b=$("go");b.textContent=txt;b.disabled=disabled;b.classList.toggle("green",green);}
function setScore(){
  $("score").classList.toggle("duo",duo());
  $("scoreval").innerHTML=duo()
    ? game.players.map((p,i)=>`<i class="pdot" style="background:${PCOL[i]}"></i><b>${fmt(p.total)}</b>`).join(" ")
    : game.survie?`✅ <b>${game.okCount}</b>`:`⭐ <b>${fmt(game.players[0].total)}</b>`;
}
function toast(txt){ const t=$("toast"); t.textContent=txt; t.classList.remove("show"); void t.offsetWidth; t.classList.add("show"); }

// ---------- quiz (mode inversé) : la réponse est montrée sur la carte, on choisit parmi 4 ----------
const optLabel=q=>q.type==="drapeau"?flag(q.c.a2):placeName(q);
function startQuiz(q){
  $("qlabel").textContent={pays:"Quel est ce pays ?",capitale:`Quelle est la capitale de ce pays ?`,drapeau:"Quel est le drapeau de ce pays ?",ville:"Quelle est cette ville ?",monument:q.mon?.kind==="a"?"Quel animal vit ici ?":"Qu'y a-t-il ici ?"}[q.type];
  $("qname").textContent=q.type==="capitale"?`${flag(q.c.a2)} ${q.c.nom}`:"";
  $("qname").classList.remove("flagq");
  $("hintbtn").hidden=true; $("tip").style.opacity=0;
  // 3 leurres du même type, du même continent si possible, de renommée proche
  const good=optLabel(q), seen=new Set([good]), opts4=[q];
  const pools=[[q.c.cont,1],[q.c.cont,4],["monde",4]];
  for(const [cont,spread] of pools){
    const tier=q.mon?q.mon.tier:q.city?q.city.tier:q.c.tier[q.type];
    const cands=shuffle([1,2,3,4].filter(l=>Math.abs(l-tier)<=spread).flatMap(l=>candidates([q.type],l,cont)));
    for(const x of cands){ if(opts4.length>=4) break; const l=optLabel(x); if(!seen.has(l)){ seen.add(l); opts4.push(x); } }
    if(opts4.length>=4) break;
  }
  game.qopts=shuffle(opts4.map(optLabel));
  $("qopts").innerHTML=game.qopts.map((l,i)=>`<button class="qopt${q.type==="drapeau"?" fl":""}" data-i="${i}">${esc(l)}</button>`).join("");
  $("qopts").classList.toggle("flags",q.type==="drapeau");
  setGo("Choisis une réponse",true,false);
  lands.classed("target",d=>d.id===q.c.iso);
  game.target=targetOf(q);
  redrawOverlay();
  // cadrage : le pays au centre, assez dézoomé pour voir les voisins
  const f=byIso.get(q.c.iso), pb=path.bounds({type:"MultiPoint",coordinates:[game.target]}), fb=f?path.bounds(f):pb;
  let [[x0,y0],[x1,y1]]=fb; if(x1-x0>W*0.9){[[x0,y0],[x1,y1]]=pb;}
  // le pays occupe ~40 % de la zone visible (on agrandit sa boîte autour de son centre), sans zoomer à l'excès
  const cx=(x0+x1)/2, cy=(y0+y1)/2, hw=Math.max(6,(x1-x0)*1.25), hh=Math.max(6,(y1-y0)*1.25);
  frameBox(cx-hw,cy-hh,cx+hw,cy+hh,1,undefined,12);
}
$("qopts").addEventListener("click",e=>{
  const b=e.target.closest(".qopt"); if(!b||!game||game.answered||!game.quiz) return;
  const q=game.list[game.i], pick=game.qopts[+b.dataset.i], correct=pick===optLabel(q);
  $("qopts").querySelectorAll(".qopt").forEach(x=>{ const l=game.qopts[+x.dataset.i]; x.classList.toggle("good",l===optLabel(q)); x.classList.toggle("bad",x===b&&!correct); x.disabled=true; });
  game.recs[0]={quiz:true,correct,pick};
  reveal();
});
// cadre la carte sur une boîte (coordonnées carte à k=1) entre la carte de question et le bas de l'écran
function frameBox(x0,y0,x1,y1,fill=1,botH,maxK=30){
  const topH=$("qcard").getBoundingClientRect().bottom+10;
  botH=botH??(H-$("go").getBoundingClientRect().top+10);
  const availH=Math.max(120,H-topH-botH), availW=W-90;
  const s=Math.min(maxK,Math.max(1,fill*Math.min(availW/(x1-x0+40),availH/(y1-y0+40))));
  const t=d3.zoomIdentity.translate(W/2,topH+availH/2).scale(s).translate(-(x0+x1)/2,-(y0+y1)/2);
  svg.transition().duration(900).call(zoom.transform,t);
}

function startTimer(){
  cancelAnimationFrame(timerRAF);
  game.t0=performance.now();
  const tick=()=>{
    if(!game||game.answered) return;
    const left=Math.max(0,CHRONO_S-(performance.now()-game.t0)/1000);
    $("timer").style.transform=`scaleX(${left/CHRONO_S})`;
    $("clock").textContent="⏱️ "+Math.ceil(left);
    $("clock").classList.toggle("urgent",left<=5);
    if(left<=0){ submitTurn(true); return; }
    timerRAF=requestAnimationFrame(tick);
  };
  tick();
}

$("hintbtn").onclick=()=>{const q=game.list[game.i],c=q.c;game.hint=true;$("hintbtn").hidden=true;$("qhint").textContent=q.type==="drapeau"?`drapeau ${de(c)}${c.nom}`:q.type==="ville"?`ville située ${dans(c)}${c.nom}`:q.type==="monument"?`${dans(c)}${c.nom}`:`capitale ${de(c)}${c.nom}`;};

function placeGuess(cx,cy){
  if(!canPlay()) return;
  const ll=screenToLL(cx,cy); if(!ll) return;
  game.guess=ll; game.pinId=(game.pinId||0)+1;
  $("go").disabled=false; $("tip").style.opacity=0;
  sfx.plop();
  redrawOverlay(); updateHover();
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
  if(!game.answered) submitTurn(false);
  else { game.i++; if(game.i<game.n&&!(game.survie&&game.lives<=0)) nextRound(); else endGame(); }
};

function submitTurn(timeout){
  if(game.quiz) return;
  if(!game.guess && !timeout) return;
  cancelAnimationFrame(timerRAF); endDrag();
  const left=game.chrono&&!timeout?Math.max(0,CHRONO_S-(performance.now()-game.t0)/1000):0;
  game.recs[game.turn]={guess:game.guess,hint:game.hint,left};
  if(game.turn+1<game.players.length){
    game.turn++;
    toast(`Au tour de ${game.players[game.turn].name} ! 🙈`);
    startTurn();
  } else reveal();
}

// points d'une oie posée
// - pays / drapeau : distance à la frontière (0 = dans le pays) ;
// - capitale / ville / merveille (indulgent) : tous les points dans le bon pays (ou à ≤ 50 km du point),
//   sinon points selon la distance au pays. `dT` = distance au point, pour l'affichage.
// - quiz : 1 000 si la bonne réponse est choisie.
function scoreRec(rec,q){
  if(rec.quiz) return {quiz:true,correct:rec.correct,km:rec.correct?0:1e6,pts:rec.correct?MAXPTS:0,bonus:0,gained:rec.correct?MAXPTS:0,good:rec.correct,perfect:false,hint:false,dT:null};
  const tgt=targetOf(q), isos=q.mon?q.mon.isos:[q.c.iso], fs=isos.map(i=>byIso.get(i)).filter(Boolean);
  if(!rec.guess) return {km:null,pts:0,bonus:0,gained:0,good:false,perfect:false,hint:rec.hint,dT:null};
  const dT=Math.round(d3.geoDistance(rec.guess,tgt)*R);
  const distC=()=>fs.length?Math.round(Math.min(...fs.map(f=>distToFeature(f,rec.guess)))*R):dT;
  let km, good=false, perfect=false;
  if(q.type==="capitale"||q.type==="ville"||q.type==="monument"){
    good=dT<=50||fs.some(f=>d3.geoContains(f,rec.guess));
    km=good?0:distC();
    perfect=dT<=50;
  } else if(fs.length){ km=distC(); perfect=good=km===0; }
  else { km=dT<=50?0:dT; perfect=good=km===0; } // pays absent de la carte (Tuvalu) : distance à la capitale
  let pts=pointsFor(km); if(rec.hint) pts=Math.round(pts/2);
  const bonus=Math.round(BONUS_MAX*(rec.left/CHRONO_S)*(pts/MAXPTS));
  return {km,pts,bonus,gained:pts+bonus,good,perfect,hint:rec.hint,dT};
}
const verdict=r=>r.quiz?(r.correct?"✅ Bravo !":"❌ Raté !"):r.km===null?"⏰ Temps écoulé !":r.perfect?"🪿 Atterrissage parfait !":r.good?"✅ Bon pays !":r.pts>=850?"😮 Presque !":r.pts>=650?"🔥 Super !":r.pts>=400?"👍 Pas mal !":r.pts>=150?"🙂 Tu chauffes…":"🧊 Brrr, c'est loin !";

// médailles : annoncées une par une (toast + son), gardées pour l'écran de fin
function celebrate(list){
  list.forEach((m,i)=>{ game.medals.push(m); setTimeout(()=>{ toast(`🏅 ${m.e} ${m.nom} !`); sfx.stamp(); },1100+i*1700); });
}
function passportMedals(){
  const ids=[], n=C.filter(stamped).length;
  if(n>=50) ids.push("globe"); if(n>=C.length) ids.push("tour");
  if(C.filter(c=>(passport[c.iso]||[]).includes("capitale")).length>=50) ids.push("capitales");
  for(const k of ["europe","afrique","asie","ameriques","oceanie"]) if(C.filter(c=>c.cont===k).every(stamped)) ids.push(k);
  return ids;
}

function reveal(){
  const q=game.list[game.i], c=q.c, f=byIso.get(c.iso), capPt=targetOf(q), name=placeName(q);
  const res=game.recs.map(r=>scoreRec(r,q));
  res.forEach((r,p)=>{ const P=game.players[p]; P.total+=r.gained; P.log.push({label:q.mon?cap1(q.mon.nom):name,fl:q.mon?q.mon.e:flag(c.a2),pts:r.gained}); });
  Object.assign(game,{answered:true,target:capPt,results:res});
  $("turn").hidden=true;

  // révisions + passeport + stats + médailles : pour le 1er joueur (Nils)
  // réussi : pays/drapeau à ≤ OK_KM de la frontière ; capitale/ville/merveille dans le bon pays ; quiz juste ; jamais avec l'indice
  const r0=res[0], pointQ=q.type==="capitale"||q.type==="ville"||q.type==="monument";
  const ok=r0.quiz?r0.correct:r0.km!==null&&!r0.hint&&(pointQ?r0.good:r0.km<=OK_KM), rk=revKey(q);
  let revMsg="", stampMsg="";
  if(ok){
    if(revisions.delete(rk)){ game.learned++; revMsg="✅ Appris ! Retiré de tes révisions"; }
    const st=addStamp(c,q.type);
    if(st){ game.stamps.push(c); stampMsg=st===2?`🛂 Nouveau tampon : ${c.nom} !`:`🛂 Nouvelle étoile pour ${c.nom} !`; }
  }
  else if(!revisions.has(rk)){ revisions.add(rk); revMsg="📚 Ajouté à tes révisions"; }
  else if(game.learn) revMsg="📚 On le reverra !";
  saveRev();
  // statistiques : confusion = l'oie est tombée dans un autre pays (modes pays / drapeau)
  const g0=game.recs[0]?.guess, other=!ok&&g0&&(q.type==="pays"||q.type==="drapeau")?countryAt(g0):null;
  const stats=recordAnswer({type:q.type,key:rk,ok,perfect:r0.perfect,confused:other&&other!==c.iso&&byKey.has(other)?`${c.iso}>${other}`:null,merveille:q.type==="monument"});
  if(ok){ game.run++; game.okCount++; } else game.run=0;
  const ids=[];
  if(r0.perfect) ids.push("pile");
  if(r0.perfect&&ISLANDS.has(c.iso)) ids.push("ile");
  if(game.run>=5) ids.push("feu"); if(game.run>=10) ids.push("inarretable");
  if(stats.merveilles>=10) ids.push("merveilles");
  if(game.survie&&game.okCount>=15) ids.push("survie15"); if(game.survie&&game.okCount>=30) ids.push("survie30");
  if(ok) ids.push(...passportMedals());
  celebrate(award(ids));
  // survie : une vie en moins à chaque erreur
  if(game.survie&&!ok){ game.lives--; $("dots").textContent=hearts(); $("dots").classList.remove("hurt"); void $("dots").offsetWidth; $("dots").classList.add("hurt"); }

  lands.classed("target",d=>d.id===c.iso); updateHover();
  redrawOverlay();
  if(!game.survie) [...$("dots").children][game.i].className="done";
  $("rflag").textContent=q.type==="monument"?q.mon.e:flag(c.a2);
  const where=`${dans(c)}${c.nom}`;
  const what=q.type==="capitale"?`${c.cap}, capitale ${de(c)}${c.nom}`:pointQ?`${name}, ${where}`:`${c.nom} · capitale : ${c.cap}`;
  if(!duo()){
    const r=r0;
    $("rmsg").textContent=verdict(r);
    countUp($("rpts"),r.gained,"+"," pts");
    $("rbonus").textContent=[r.bonus?`⚡ dont +${r.bonus} bonus vitesse`:(r.hint&&r.km!==null?"💡 indice utilisé : points ÷ 2":""),game.survie&&!ok?`💔 une vie en moins (${hearts()})`:"",stampMsg||revMsg].filter(Boolean).join(" · ");
    $("rdetail").textContent = r.quiz ? (r.correct?`C'est bien ${what} !`:`C'était ${what}`)
      : r.km===null ? `C'était ici : ${what}`
      : !pointQ ? (r.km===0?`Ton oie s'est posée ${where} ! Capitale : ${c.cap}`:(f?`À ${fmt(r.km)} km de la frontière · capitale : ${c.cap}`:`À ${fmt(r.km)} km de ${c.cap}, capitale ${de(c)}${c.nom}`))
      : r.perfect ? `Tu as trouvé ${what} !`
      : r.good ? `Ton oie est bien ${where} 👍 ${name} est à ${fmt(r.dT)} km`
      : `${name} : ${where}, ton oie est à ${fmt(r.km)} km de la frontière`;
  } else {
    const [a,b]=res, P=game.players;
    $("rmsg").textContent=a.gained===b.gained?(a.km===null?"⏰ Personne n'a joué !":"🤝 Égalité !"):`🏆 ${P[a.gained>b.gained?0:1].name} gagne la manche !`;
    $("rpts").innerHTML=res.map((r,p)=>`<span class="duo"><i class="pdot" style="background:${PCOL[p]}"></i>${P[p].name} <b>+${fmt(r.gained)}</b></span>`).join("");
    $("rbonus").textContent=[res.map((r,p)=>`${P[p].name} : ${r.km===null?"pas joué":r.perfect?"pile dessus !":r.good?"bon pays":fmt(r.km)+" km"}`).join(" · "),stampMsg].filter(Boolean).join(" · ");
    $("rdetail").textContent=what;
  }
  $("rstamp").innerHTML=stampMsg?stampSVG(c):"";
  $("rfacttxt").textContent=FACTS[c.a2]||"";
  $("rfact").hidden=!FACTS[c.a2];
  $("result").classList.add("show");
  setScore();
  const last=game.survie?game.lives<=0:game.i+1>=game.n;
  setGo(last?"Voir le score 🏁":"Suivant ➜",false,true);
  // son + confettis selon la meilleure oie
  const best=res.reduce((m,r)=>r.gained>m.gained?r:m,res[0]);
  if(res.some(r=>r.perfect)){ sfx.perfect(); confetti(60); }
  else if(best.good) sfx.good();
  else if(best.pts>=300) sfx.ok();
  else sfx.far();
  if(stampMsg) setTimeout(sfx.stamp,700);

  // cadrage sur les oies + la cible
  const pts2=[capPt,...game.recs.filter(r=>r.guess).map(r=>r.guess)];
  const pb=path.bounds({type:"MultiPoint",coordinates:pts2}), fb=f?path.bounds(f):pb;
  let x0=Math.min(pb[0][0],fb[0][0]),y0=Math.min(pb[0][1],fb[0][1]),x1=Math.max(pb[1][0],fb[1][0]),y1=Math.max(pb[1][1],fb[1][1]);
  if(x1-x0>W*0.7){[[x0,y0],[x1,y1]]=pb;}
  // on garde sous la cible la place de son étiquette (fiche à 2-3 lignes en apprentissage)
  const cardH=(game.learn?(pointQ&&q.type!=="capitale"?3:2):1)*24+34;
  frameBox(x0,y0,x1,y1,game.quiz?.6:1,H-$("result").getBoundingClientRect().top+10+cardH);
}
$("rfactsay").onclick=()=>say("Le savais-tu ? "+$("rfacttxt").textContent);

function countUp(el,to,pre,suf,from=0){
  const t0=performance.now(),d=700;
  const step=now=>{const p=Math.min(1,(now-t0)/d),e=1-Math.pow(1-p,3);el.textContent=pre+fmt(Math.round(from+(to-from)*e))+suf;if(p<1)requestAnimationFrame(step);};
  requestAnimationFrame(step);
}

// ---------- dessin des oies / de la cible ----------
function drawGoose(ll,p,{hit=false,tag="",flip=false}={}){
  const g=gOver.append("g").attr("class","mk goose"+(flip?" flip":"")).datum(ll);
  // ombre au sol = point exact d'atterrissage ; pendant le glissé l'oie s'envole au-dessus d'elle
  g.append("ellipse").attr("class","shadow").attr("rx",14).attr("ry",4.5);
  g.append("path").attr("class","trail").attr("d","M0,-4V-26");
  g.append("g").attr("class","fly").append("g").attr("class","pin-inner").attr("data-id",game.pinId)
    .html(gooseParts(PLUME[p]||PLUME[0],p===0?equip:{}));
  if(tag){
    const w=tag.length*7.6+18, T=g.append("g").attr("class","ptag");
    T.append("rect").attr("x",-w/2).attr("y",-72).attr("width",w).attr("height",20).attr("rx",10).attr("fill",PCOL[p]).attr("stroke","#fff").attr("stroke-width",2);
    T.append("text").attr("y",-57.5).attr("text-anchor","middle").attr("fill","#fff").attr("font-weight",800).attr("font-size",13).attr("font-family","Baloo 2, sans-serif").text(tag);
  }
  // zone pour attraper l'oie au doigt (plus grande que le dessin)
  if(hit) g.append("circle").attr("class","pin-hit").attr("cy",-22).attr("r",34);
}
function drawTarget(withLabel){
  const q=game.list[game.i];
  const g=gOver.append("g").attr("class","mk").datum(game.target);
  g.append("circle").attr("class","ripple").attr("r",14).attr("fill","none").attr("stroke","#22b07d").attr("stroke-width",3);
  g.append("circle").attr("r",9).attr("fill","#fff").attr("stroke","#22b07d").attr("stroke-width",3.5);
  g.append("circle").attr("r",4).attr("fill","#22b07d");
  if(!withLabel) return;
  // étiquette : le nom à trouver ; en apprentissage, une fiche pour mémoriser (pays, drapeau, capitale)
  const lines=game.learn
    ? [...(q.type==="ville"||q.type==="monument"?[q.type==="ville"?`🏙️ ${q.city.nom}`:monTitle(q.mon)]:[]), `${flag(q.c.a2)} ${q.c.nom}`, `🏛️ ${q.c.cap}`]
    : [q.type==="monument"?monTitle(q.mon):`${flag(q.c.a2)} ${placeName(q)}`];
  // sous la cible : l'oie (qui monte au-dessus de son point) ne la cache jamais
  const LH=24, hgt=lines.length*LH+10, tw=Math.max(...lines.map(l=>l.length))*8.6+40, top=18;
  const L=g.append("g").attr("class","tlabel"+(game.learn?" learn":""));
  L.append("rect").attr("x",-tw/2).attr("y",top).attr("width",tw).attr("height",hgt).attr("rx",16).attr("fill","#22b07d").attr("stroke","#fff").attr("stroke-width",2.5);
  L.append("path").attr("d","M-7,19.5 L0,11 L7,19.5 Z").attr("fill","#22b07d");
  lines.forEach((t,i)=>L.append("text").attr("y",top+5+LH*(i+1)-6).attr("text-anchor","middle").attr("fill","#fff").attr("font-weight",i===0?800:700).attr("font-size",i===0?17:15).attr("font-family","Baloo 2, sans-serif").text(t));
}

function redrawOverlay(){
  gOver.selectAll("*").remove();
  if(!game) return;
  const q=game.list[game.i];
  if(game.answered){
    game.recs.forEach((r,p)=>{ const rr=game.results[p];
      if(r.guess&&!rr.perfect&&(rr.km>0||rr.dT>50)) gOver.append("path").attr("class","line").style("stroke",duo()?PCOL[p]:null).attr("d",path({type:"LineString",coordinates:[r.guess,game.target]})); });
    drawTarget(true);
    // atterrissage parfait : l'oie fait un salto
    game.recs.forEach((r,p)=>{ if(r.guess) drawGoose(r.guess,p,{tag:duo()?game.players[p].name:"",flip:game.results[p].perfect}); });
    gOver.selectAll(".pin-inner").style("animation","none");
  } else if(game.quiz){ if(q.type==="ville"||q.type==="monument") drawTarget(false); }
  else if(game.guess) drawGoose(game.guess,game.turn,{hit:true});
  placeMarkers();
}

// ---------- fin de partie ----------
function endGame(){
  const P=game.players, max=(game.survie?game.i:game.n)*(MAXPTS+(game.chrono?BONUS_MAX:0));
  addPlayTime((performance.now()-game.t0Game)/1000);
  $("duel").hidden=!duo(); $("final").hidden=duo(); $("stars").hidden=duo();
  $("outof").textContent=game.survie?"bonnes réponses en Survie":`points sur ${fmt(max)}`;
  let n=0, extra="";
  const ids=["envol"];
  if(duo()){
    const [a,b]=P;
    $("endtitle").textContent=a.total===b.total?"🤝 Égalité !":`🏆 ${(a.total>b.total?a:b).name} gagne !`;
    $("duel").innerHTML=P.map((p,i)=>`<div class="dscore${p.total>=Math.max(a.total,b.total)?" win":""}"><span><i class="pdot" style="background:${PCOL[i]}"></i>${p.name}</span><b>${fmt(p.total)}</b></div>`).join("");
    const mx=Math.max(...a.log.map(l=>l.pts),...b.log.map(l=>l.pts),1);
    $("recap").innerHTML=a.log.map((l,i)=>`<div><span>${l.fl} ${l.label}</span><span class="r2">${[l.pts,b.log[i].pts].map((v,p)=>`<i class="bar" style="width:${Math.round(40*v/mx)}px;background:${PCOL[p]}"></i><b>${fmt(v)}</b>`).join("")}</span></div>`).join("");
    n=5; ids.push("duo");
  } else {
    const t=P[0].total, okc=game.okCount;
    if(game.survie){
      $("final").textContent="0"; countUp($("final"),okc,"","");
      n=okc>=30?5:okc>=20?4:okc>=12?3:okc>=6?2:okc>=3?1:0;
      $("endtitle").textContent=["Encore un essai ! 💪","Bien tenu ! 🙂","Joli parcours ! 👍","Survivant ! 🔥","Increvable ! 🏆","Légende de la survie ! 🌟"][n];
      const prev=+(store.get(bestKey())||0);
      if(okc>prev){ store.set(bestKey(),okc); extra=prev?"🏆 Nouveau record !":"🏆 Premier record !"; } else extra=prev?`Record : ${prev}`:"Tu feras mieux la prochaine fois !";
    } else {
      $("final").textContent="0"; countUp($("final"),t,"","");
      const r=t/max; n=r>=.85?5:r>=.7?4:r>=.5?3:r>=.3?2:r>=.15?1:0;
      $("endtitle").textContent=game.defi?"🗓️ Défi du jour terminé !":["On s'entraîne encore ! 💪","Bon début ! 🙂","Pas mal du tout ! 👍","Très fort ! 🔥","Champion ! 🏆","Légende de la géo ! 🌟"][n];
      if(game.learn){
        const left=revItems().length;
        extra=(game.learned?`✅ ${game.learned} appris · `:"")+(left?`📚 encore ${left} à revoir`:"🎉 Plus rien à revoir !");
      } else if(game.defi){
        const was=defiDoneToday(), d=finishDefi(t);
        extra=was?`Déjà fait aujourd'hui · 🔥 ${d.streak} jour${d.streak>1?"s":""}`:`🔥 ${d.streak} jour${d.streak>1?"s":""} d'affilée ! Reviens demain`;
        if(d.streak>=3) ids.push("defi3"); if(d.streak>=7) ids.push("defi7"); if(d.streak>=30) ids.push("defi30");
      } else {
        const prev=+(store.get(bestKey())||0);
        if(t>prev){store.set(bestKey(),t);extra=prev?"🏆 Nouveau record !":"🏆 Premier record !";} else extra=`Record : ${fmt(prev)}`;
        if(game.n===ROUNDS&&okc===ROUNDS) ids.push(game.quiz?"quiz":"sansfaute");
        if(opts.level===4&&game.n===ROUNDS&&!game.quiz&&t>=7000) ids.push("dragon");
      }
    }
    $("stars").innerHTML=[0,1,2,3,4].map(i=>`<i class="${i<n?"on":""}" style="animation-delay:${.3+i*.15}s">★</i>`).join("");
    const mx=Math.max(...P[0].log.map(l=>l.pts),1);
    $("recap").innerHTML=P[0].log.map(l=>`<div><span>${l.fl} ${l.label}</span><span style="display:flex;align-items:center;gap:8px"><i class="bar" style="width:${Math.round(60*l.pts/mx)}px;background:${l.pts>=650?"var(--good)":l.pts>=300?"var(--gold)":"var(--accent)"}"></i><b>${fmt(l.pts)}</b></span></div>`).join("");
  }
  $("newbest").textContent=extra;
  // médailles de fin + XP (joueur 1)
  const fresh=award(ids); game.medals.push(...fresh);
  const xp=Math.round(P[0].total/100)+(game.defi?40:0)+game.medals.length*15;
  const lv=addXp(xp);
  if(levelInfo().lvl>=10) game.medals.push(...award(["niveau10"]));
  const unlocked=ACCESSORIES.filter(a=>a.lvl>lv.before&&a.lvl<=lv.after);
  const L=levelInfo();
  $("xpline").innerHTML=lv.after>lv.before
    ? `<b>⬆️ Niveau ${lv.after} !</b>${unlocked.length?` Nouveau pour ton oie : ${unlocked.map(a=>`${a.e} ${a.nom}`).join(", ")}`:""}`
    : `+${xp} XP · niveau ${L.lvl} <span class="xpbar"><i style="width:${Math.round(100*L.cur/L.need)}%"></i></span>`;
  $("endmedals").innerHTML=game.medals.length?`🏅 ${game.medals.map(m=>`<span title="${m.nom}">${m.e}</span>`).join(" ")} <small>${game.medals.map(m=>m.nom).join(" · ")}</small>`:"";
  $("newstamps").innerHTML=game.stamps.length?`🛂 ${game.stamps.length} nouveau${game.stamps.length>1?"x":""} tampon${game.stamps.length>1?"s":""} : <span>${game.stamps.map(c=>flag(c.a2)).join(" ")}</span>`:"";
  // l'oie danse quand c'est réussi (ou quand on monte de niveau)
  const party=n>=3||lv.after>lv.before;
  $("endgoose").innerHTML=gooseSVG(equip,party?"dance":"idle");
  $("againbtn").textContent=game.learn?(revItems().length?"Continuer à réviser 📚":"Menu 🏠"):game.defi?"Refaire le défi 🔁":"Rejouer 🔁";
  $("end").classList.remove("hidden");
  if(party){ setTimeout(()=>{confetti(140); sfx.fanfare();},400); }
  renderLevel();
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

function goHome(){
  cancelAnimationFrame(timerRAF); try{speechSynthesis.cancel();}catch(e){}
  game=null; endDrag(); updateHover(); redrawOverlay(); lands.classed("target",false);
  $("result").classList.remove("show"); setGo("Valider 🎯",true,false); $("qopts").hidden=true;
  ["end","passport","oie","progres","reglages"].forEach(id=>$(id).classList.add("hidden")); $("home").classList.remove("hidden");
  svg.transition().duration(700).call(zoom.transform,homeView());
  showBest();
}
$("startbtn").onclick=()=>startGame("normal");
$("defibtn").onclick=()=>startGame("defi");
$("learnbtn").onclick=()=>startGame("learn");
$("againbtn").onclick=()=>startGame(game?.kind||"normal");
$("menubtn").onclick=goHome;
$("homebtn").onclick=goHome;
showBest();
let rz; addEventListener("resize",()=>{clearTimeout(rz);rz=setTimeout(()=>{layout();svg.call(zoom.transform,!game||!game.answered?homeView():d3.zoomTransform(svg.node()));},150);});
layout();
svg.call(zoom.transform,homeView());
// pré-calcule les niveaux de détail pendant l'écran d'accueil (évite un à-coup au premier zoom)
setTimeout(()=>lodFor(1),300); setTimeout(()=>lodFor(2),900);

// ---------- app installable (service worker, hors ligne) : seulement sur le site, pas dans un iframe ----------
try{
  if("serviceWorker" in navigator && location.protocol==="https:" && window.top===window)
    addEventListener("load",()=>navigator.serviceWorker.register("sw.js").catch(()=>{}));
}catch(e){}
