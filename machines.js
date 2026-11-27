/* Small offline 3D teaching models. Coordinates and mechanisms are simplified. */
const staticMachineSVG=machineSVG;
machineSVG=function(id){return '<div class="model-launch">'+staticMachineSVG(id)+'<button class="primary" onclick="openMachine(\''+id+'\')">Explore moving 3D model</button></div>'};
const PART_HELP={
bicycle:{pedals:'Your feet push the pedals to turn the crank.',chain:'The chain carries motion from the front chainring to the rear sprocket. Gold dots show its travel.',sprocket:'The rear sprocket engages the chain and drives the rear wheel while you pedal.',wheels:'Both wheels roll. Only the rear wheel is driven by the chain.'},
pulley:{wheel:'The grooved wheel turns as the rope moves over it.',rope:'Pull one end down: the other end rises by the same distance.',load:'The rope pulls this load upwards. One fixed pulley changes the direction, not the ideal size, of the force.'},
pottery:{clay:'Clay spins with the wheel. Press Shape clay to represent the potter shaping it with wet hands.',wheel:'The wheel head turns the clay; spinning alone does not shape or harden it.',motor:'The motor supplies turning motion. The speed control represents the foot pedal.'},
conveyor:{motor:'The motor turns the drive pulley.',pulleys:'Friction between the drive pulley and belt makes the belt move.',belt:'The belt returns underneath: the upper and lower runs move in opposite directions.',parcel:'The parcel travels with the upper run of the belt.'},
water:{channel:'Opening the gate allows water to flow towards the wheel.',wheel:'Falling water acts on the blades or buckets and makes the wheel turn.',axle:'The axle turns with the wheel and carries turning motion to other machinery.'},
sharpener:{crank:'Your hand turns the crank.',cutter:'The crank drives cutters inside the case. This model shows one simplified rotating cutter.',pencil:'The cutter removes small pieces of wood and graphite to make a point.',tray:'The tray collects the shavings. The casing is omitted so you can look inside.'},
winch:{handle:'Turning the handle drives the drum through gears (omitted in this simplified view).',drum:'The drum turns and winds cable around itself.',cable:'As cable winds onto the drum, the free length becomes shorter.',load:'The shortening cable pulls the load closer.'}
};
let activeMachine=null;
function openMachine(id){
 if(activeMachine)activeMachine.stop();
 let dlg=document.getElementById('machineDialog');
 if(!dlg){dlg=document.createElement('dialog');dlg.id='machineDialog';document.body.append(dlg);}
 const m=WHEELS.find(x=>x.id===id);
 dlg.innerHTML='<button class="modalclose" id="machineClose">Close ×</button><h2 id="machineTitle">'+m.name+' · motion lab</h2><p class="model-hint">Drag to turn the model. Click a numbered part to discover its job.</p><canvas id="machineCanvas" width="900" height="440" aria-label="Rotatable simplified model of '+m.name+'"></canvas><div class="model-controls"><button id="machinePlay">Start movement</button><button id="machineReset">Reset</button><button id="machineFront">Front view</button><button id="machineAngle">Angled view</button><label>Speed <input id="machineSpeed" type="range" min=".25" max="2" value="1" step=".25"></label>'+(id==='pottery'?'<button id="machineShape">Shape clay</button>':'')+'</div><div class="model-parts">'+Object.keys(PART_HELP[id]).map((p,i)=>'<button data-part="'+p+'">'+(i+1)+'. '+p+'</button>').join('')+'</div><p class="model-explanation" id="machineExplanation" aria-live="polite">'+m.cause+' → '+m.effect+'.</p><details><summary>Explain the process</summary><ol>'+m.steps.map(s=>'<li>'+s+'</li>').join('')+'</ol></details><p class="model-note">Simplified teaching model, not to scale. Some casings and connections are omitted to reveal movement.'+(id==='bicycle'?' The bicycle stays in place here so you can inspect its drive.':id==='conveyor'?' Parcels repeat to demonstrate continuous operation.':'')+'</p>';
 dlg.setAttribute('aria-labelledby','machineTitle');dlg.showModal();
 const canvas=dlg.querySelector('canvas'),ctx=canvas.getContext('2d');
 let yaw=.4,pitch=-.22,t=0,playing=false,speed=1,shape=0,raf,previous=0,drag=null,markers=[],selected=null;
 const navy='#25384b',gold='#efb647',teal='#368c84',purple='#8861ad';
 function project(p){let [x,y,z]=p;let xx=x*Math.cos(yaw)+z*Math.sin(yaw),zz=-x*Math.sin(yaw)+z*Math.cos(yaw);return [450+xx*1.18,215+(y*Math.cos(pitch)-zz*Math.sin(pitch))*1.18,y*Math.sin(pitch)+zz*Math.cos(pitch)];}
 let shapes=[];
 function poly(points,color){shapes.push({p:points.map(project),color});}
 function line(points,color=navy,width=4){shapes.push({p:points.map(project),color,width});}
 function box(x,y,z,w,h,d,color){let a=[x-w/2,y-h/2,z-d/2],b=[x+w/2,y+h/2,z+d/2];for(const f of [[0,1,3,2],[4,6,7,5],[0,4,5,1],[2,3,7,6],[0,2,6,4],[1,5,7,3]]){let v=[[a[0],a[1],a[2]],[b[0],a[1],a[2]],[a[0],b[1],a[2]],[b[0],b[1],a[2]],[a[0],a[1],b[2]],[b[0],a[1],b[2]],[a[0],b[1],b[2]],[b[0],b[1],b[2]]];poly(f.map(i=>v[i]),color);}}
 function wheel(x,y,z,r,depth,angle=0,color=gold,axis='z',solid=false){
 const pt=(a,d,rad=r)=>axis==='y'?[x+Math.cos(a)*rad,y+d,z+Math.sin(a)*rad]:[x+Math.cos(a)*rad,y+Math.sin(a)*rad,z+d];
 let front=[],back=[];for(let i=0;i<32;i++){let a=i*Math.PI/16;front.push(pt(a,depth/2));back.push(pt(a,-depth/2));poly([pt(a,-depth/2),pt(a,depth/2),pt(a+Math.PI/16,depth/2),pt(a+Math.PI/16,-depth/2)],color);}
 if(solid){poly(back,color);poly(front,color);}else {line([...front,front[0]],navy,4);line([...back,back[0]],navy,3);}
 for(let i=0;i<8;i++){const a=angle+i*Math.PI/4;line([pt(0,depth/2,0),pt(a,depth/2,r*.9)],solid?navy:color,3);}
 line([pt(0,-depth,0),pt(0,depth,0)],navy,7);
 }
 function mark(key,p){markers.push({key,p:project(p)});}
 function model(){
 shapes=[];markers=[];let a=t*2;
 if(id==='bicycle'){
  wheel(-160,65,0,85,15,a*2);wheel(160,65,0,85,15,a*2);
  line([[-160,65,0],[-65,-65,0],[0,65,0],[-160,65,0]],teal,9);line([[-65,-65,0],[100,-65,0],[0,65,0]],teal,9);line([[160,65,0],[100,-65,0],[90,-110,0],[125,-110,0]],teal,8);line([[-65,-65,0],[-75,-90,0]],navy,8);box(-75,-95,0,65,9,28,navy);
  wheel(0,65,25,30,6,a,gold,'z',true);wheel(-160,65,25,15,6,a*2,gold,'z',true);
  line([[0,35,30],[-160,50,30],[-160,80,30],[0,95,30],[0,35,30]],purple,4);
  for(let i=0;i<10;i++){let u=(i/10+1000-t*.2)%1;let p=u<.5?[-320*u,35+30*u,32]:[-160+320*(u-.5),80+30*(u-.5),32];box(...p,5,5,5,gold);}
  line([[0,65,38],[Math.cos(a)*42,65+Math.sin(a)*42,38]],navy,7);box(Math.cos(a)*42,65+Math.sin(a)*42,46,25,10,25,teal);
  mark('pedals',[Math.cos(a)*42,65+Math.sin(a)*42,46]);mark('chain',[-80,105,35]);mark('sprocket',[-160,65,40]);mark('wheels',[170,-25,0]);
 }else if(id==='pulley'){
  const lift=Math.min(t*22,125);line([[-150,-140,0],[150,-140,0]],navy,12);line([[0,-140,0],[0,-70,0]],navy,9);wheel(0,-60,0,48,28,lift/48);
  let rope=[[-50,110-lift,20],[-50,-60,20]];for(let i=0;i<=20;i++){let a=Math.PI+i*Math.PI/20;rope.push([Math.cos(a)*50,-60+Math.sin(a)*50,20]);}rope.push([50,30+lift,20]);line(rope,gold,7);box(-50,135-lift,20,65,50,45,teal);box(50,35+lift,20,22,12,22,purple);
  mark('wheel',[0,-60,30]);mark('rope',[50,0+lift,25]);mark('load',[-50,135-lift,50]);
  if(lift===125&&playing){playing=false;play.textContent='Replay lift';}
 }else if(id==='pottery'){
  box(0,75,0,220,18,160,teal);box(-80,125,-55,15,90,15,navy);box(80,125,55,15,90,15,navy);box(0,105,0,60,65,60,purple);
  wheel(0,55,0,100,10,a,teal,'y',true);
  const r=shape?47:60,h=shape?100:70;
  const profile=shape?[.72,1,.95,.72]:[.9,1,1,.95];
  for(let j=0;j<3;j++)for(let i=0;i<32;i++){
   let b=i*Math.PI/16+a,bb=b+Math.PI/16;
   poly([[Math.cos(b)*r*profile[j],45-h*j/3,Math.sin(b)*r*profile[j]],[Math.cos(bb)*r*profile[j],45-h*j/3,Math.sin(bb)*r*profile[j]],[Math.cos(bb)*r*profile[j+1],45-h*(j+1)/3,Math.sin(bb)*r*profile[j+1]],[Math.cos(b)*r*profile[j+1],45-h*(j+1)/3,Math.sin(b)*r*profile[j+1]]],'#cb8c5c');
  }
  poly(Array.from({length:32},(_,i)=>[Math.cos(i*Math.PI/16)*r*profile[3]*.85,44-h,Math.sin(i*Math.PI/16)*r*profile[3]*.85]),'#805330');
  mark('clay',[0,0-h/2,35]);mark('wheel',[90,55,0]);mark('motor',[0,110,45]);
 }else if(id==='conveyor'){
  wheel(-170,50,0,36,100,a,teal);wheel(170,50,0,36,100,a,teal);
  poly([[-170,14,-50],[170,14,-50],[170,14,50],[-170,14,50]],'#9cc8be');poly([[-170,86,-50],[170,86,-50],[170,86,50],[-170,86,50]],'#9cc8be');
  for(let i=0;i<12;i++){let x=-170+((i*30+t*35)%340);line([[x,13,-50],[x,13,50]],teal,2);let b=170-((i*30+t*35)%340);line([[b,87,-50],[b,87,50]],teal,2);}
  let x=-150+(t*35%300);box(x,-15,0,45,56,50,gold);box(-170,140,0,14,100,85,navy);box(170,140,0,14,100,85,navy);box(-170,50,90,55,55,65,purple);
  mark('motor',[-170,50,130]);mark('pulleys',[170,50,60]);mark('belt',[30,14,55]);mark('parcel',[x,-45,20]);
 }else if(id==='water'){
  wheel(0,35,0,95,55,-a,gold);
  for(let i=0;i<12;i++){let b=-a+i*Math.PI/6;box(Math.cos(b)*94,35+Math.sin(b)*94,0,20,20,65,'#b7844b');}
  line([[0,35,-90],[0,35,150]],navy,12);box(-150,-100,0,180,10,50,teal);box(-85,t>0?-145:-118,0,8,t>0?40:45,52,navy);
  if(t>0)for(let i=0;i<12;i++){let v=(t*60+i*15)%170;box(-55+v*.15,-98+v,0,6,10,8,'#3aa6d2');}
  mark('channel',[-150,-100,25]);mark('wheel',[90,30,35]);mark('axle',[0,35,150]);
 }else if(id==='sharpener'){
  box(0,105,0,180,25,120,teal);wheel(20,5,0,34,85,a*3,gold,'z',true);line([[20,5,45],[20,5,110]],navy,8);
  line([[20,5,110],[20+Math.cos(a)*55,5+Math.sin(a)*55,110]],navy,8);box(20+Math.cos(a)*55,5+Math.sin(a)*55,130,20,20,45,purple);
  box(-110,0,0,160,14,14,gold);poly([[-30,-7,-7],[-30,7,-7],[-10,0,0]],'#c7a476');poly([[-30,-7,7],[-30,7,7],[-10,0,0]],'#c7a476');
  if(t>0)for(let i=0;i<9;i++){let v=(t*50+i*14)%90;box(-10+Math.sin(i)*25,v,Math.cos(i)*25,7,4,5,'#bc8250');}
  mark('crank',[70,5,130]);mark('cutter',[20,5,30]);mark('pencil',[-130,0,10]);mark('tray',[0,105,65]);
 }else if(id==='winch'){
  let pull=Math.min(t*20,180);box(-130,110,0,150,15,130,navy);wheel(-130,40,0,45,90,a,teal,'z',true);wheel(-130,40,-48,60,5,a,gold);wheel(-130,40,48,60,5,a,gold);
  for(let i=0;i<8;i++){let z=-38+i*10,pts=[];for(let j=0;j<=32;j++){let b=j*Math.PI/16;pts.push([-130+Math.cos(b)*47,40+Math.sin(b)*47,z]);}line(pts,purple,3);}
  line([[-130,40,60],[-130+Math.cos(a)*78,40+Math.sin(a)*78,60]],navy,7);box(-130+Math.cos(a)*78,40+Math.sin(a)*78,80,18,18,35,gold);
  line([[-130,87,35],[220-pull,87,35]],purple,5);box(230-pull,90,35,65,65,70,teal);
  mark('handle',[-130+Math.cos(a)*78,40+Math.sin(a)*78,80]);mark('drum',[-130,10,55]);mark('cable',[-10,87,35]);mark('load',[230-pull,90,80]);
  if(pull===180&&playing){playing=false;play.textContent='Replay pull';}
 }
 }
 function draw(){
  ctx.clearRect(0,0,900,440);ctx.fillStyle='#edf5ed';ctx.fillRect(0,0,900,440);model();
  shapes.sort((a,b)=>a.p.reduce((s,p)=>s+p[2],0)/a.p.length-b.p.reduce((s,p)=>s+p[2],0)/b.p.length);
  for(const s of shapes){ctx.beginPath();s.p.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));if(s.width){ctx.strokeStyle=s.color;ctx.lineWidth=s.width;ctx.lineJoin='round';ctx.stroke();}else{ctx.closePath();ctx.fillStyle=s.color;ctx.fill();ctx.strokeStyle='#25384b55';ctx.lineWidth=.7;ctx.stroke();}}
  markers.forEach((m,i)=>{ctx.beginPath();ctx.arc(m.p[0],m.p[1],14,0,Math.PI*2);ctx.fillStyle=selected===m.key?'#f3b645':'#fffdf3';ctx.fill();ctx.strokeStyle=navy;ctx.lineWidth=2;ctx.stroke();ctx.fillStyle=navy;ctx.font='bold 16px Arial';ctx.textAlign='center';ctx.fillText(i+1,m.p[0],m.p[1]+5);});
 }
 const play=dlg.querySelector('#machinePlay');
 play.onclick=()=>{if(!playing&&((id==='pulley'&&t>=125/22)||(id==='winch'&&t>=9)))t=0;playing=!playing;play.textContent=playing?'Pause movement':'Resume movement';};
 dlg.querySelector('#machineReset').onclick=()=>{t=0;shape=0;playing=false;play.textContent='Start movement';draw();};
 dlg.querySelector('#machineFront').onclick=()=>{yaw=0;pitch=0;draw();};
 dlg.querySelector('#machineAngle').onclick=()=>{yaw=.65;pitch=-.4;draw();};
 dlg.querySelector('#machineSpeed').oninput=e=>speed=+e.target.value;
 if(id==='pottery')dlg.querySelector('#machineShape').onclick=()=>{shape=1-shape;explain('clay');draw();};
 function explain(key){selected=key;dlg.querySelector('#machineExplanation').textContent=PART_HELP[id][key];dlg.querySelectorAll('[data-part]').forEach(b=>b.classList.toggle('active',b.dataset.part===key));draw();}
 dlg.querySelectorAll('[data-part]').forEach(b=>b.onclick=()=>explain(b.dataset.part));
 canvas.onpointerdown=e=>{drag={x:e.clientX,y:e.clientY,startX:e.clientX,startY:e.clientY};canvas.setPointerCapture(e.pointerId);};
 canvas.onpointermove=e=>{if(!drag)return;yaw+=(e.clientX-drag.x)*.009;pitch=Math.max(-1,Math.min(1,pitch+(e.clientY-drag.y)*.009));drag.x=e.clientX;drag.y=e.clientY;draw();};
 canvas.onpointerup=e=>{if(drag&&Math.hypot(e.clientX-drag.startX,e.clientY-drag.startY)<7){let r=canvas.getBoundingClientRect(),x=(e.clientX-r.left)*900/r.width,y=(e.clientY-r.top)*440/r.height;let hit=markers.find(m=>Math.hypot(x-m.p[0],y-m.p[1])<24);if(hit)explain(hit.key);}drag=null;};
 canvas.onpointercancel=()=>drag=null;
 function loop(now){if(!dlg.open)return;if(previous&&playing)t+=Math.min((now-previous)/1000,.06)*speed;previous=now;draw();raf=requestAnimationFrame(loop);}
 activeMachine={stop(){cancelAnimationFrame(raf);playing=false;}};
 dlg.onclose=()=>activeMachine?.stop();dlg.querySelector('#machineClose').onclick=()=>dlg.close();
 draw();raf=requestAnimationFrame(loop);
}

/* Textbook page 16: interactive overlays on the original illustration. */
function openTextbookMill(){
 let d=document.getElementById('textbookMill');
 if(!d){d=document.createElement('dialog');d.id='textbookMill';document.body.append(d);}
 const help={gate:['Sluice gate','Lift the gate to let water enter the mill race. Close it to stop the demonstration.'],race:['Mill race','This channel carries water towards the wheel. Moving water transfers energy to the wheel.'],wheel:['Water wheel','Water pushes on the blades and turns the wheel. The wheel turns the axle.'],blade:['Blade','Each blade receives a push from the water. The blades are fixed to the wheel, so they turn together.'],axle:['Axle','The rotating shaft carries the turning motion from the wheel to the machinery inside the mill.'],gears:['Gears','Interlocking teeth pass the turning motion to another shaft. Here the machinery drives the millstones.'],turbine:['Inside the mill','The textbook calls this part a “turbine”. In this traditional mill, follow the wheel, axle and gears to see how the millstones are driven.'],stones:['Millstones','The upper stone rotates above the lower stone. Grain is ground between them to make flour.']};
 const spots=[['gate',588,526,132,39],['race',772,634,112,40],['wheel',801,700,87,39],['blade',546,829,90,40],['axle',782,834,73,40],['gears',426,788,85,40],['turbine',513,656,101,40],['stones',430,579,118,42]];
 const spokes=(n,r)=>Array.from({length:n},(_,i)=>`<line x1="0" y1="0" x2="${Math.cos(i*2*Math.PI/n)*r}" y2="${Math.sin(i*2*Math.PI/n)*r}"/>`).join('');
 d.innerHTML=`<div class="mill-head"><h2>Bring the textbook mill to life</h2><button id="millClose" aria-label="Close water wheel demonstration">Close ×</button></div><div class="mill-layout"><div><svg id="millScene" viewBox="385 500 530 455" role="group" aria-label="Interactive textbook mill: use the labelled buttons or the controls to explore its working parts."><image href="assets/book-16.jpg" width="930" height="1303"/>
 <g id="millWater" opacity="0"><path d="M849 599 L726 633 L726 713" fill="none" stroke="#37b5e0" stroke-width="13" opacity=".7"/><path id="millStream" d="M849 599 L726 633 L726 713" fill="none" stroke="white" stroke-width="4" stroke-dasharray="5 13"/><path d="M687 865 Q670 884 650 888 M722 866 Q735 885 750 884" fill="none" stroke="#37b5e0" stroke-width="5"/></g>
 <rect id="millGate" x="802" y="552" width="55" height="42" rx="2" fill="#727c7b" stroke="#36454c" stroke-width="3"/>
 <g transform="translate(728 795) scale(.46 1)"><circle r="76" fill="#a88357" stroke="#60472e" stroke-width="8"/><g id="millWheel" stroke="#67492d" stroke-width="9">${spokes(10,70)}<circle r="64" fill="none" stroke="#d2ad75" stroke-width="7"/></g><circle r="12" fill="#899390" stroke="#344145" stroke-width="4"/></g>
 <g id="millHorizontalGear"><path d="M432 739 L432 760 Q488 779 544 760 L544 739 Z" fill="#b58a55" stroke="#655039" stroke-width="3"/><ellipse cx="488" cy="739" rx="56" ry="12" fill="#d3b17c" stroke="#655039" stroke-width="3"/><g transform="translate(488 739) scale(1 .215)"><g id="millCrownTop" stroke="#8d6a42" stroke-width="3">${spokes(8,49)}</g></g>${Array.from({length:12},(_,i)=>`<ellipse class="mill-crown-tooth" data-tooth="${i}" rx="4" ry="6" fill="#e1c99d" stroke="#655039" stroke-width="2"/>`).join('')}<rect x="483" y="654" width="10" height="84" fill="#8f9890" stroke="#4e5b54" stroke-width="2"/><path id="millUprightStripe" d="M486 655 V737" stroke="#d7dfd3" stroke-width="3"/></g>
 <g transform="translate(552 788) scale(.48 1)"><g id="millGear" fill="#ba955f" stroke="#60472e" stroke-width="5"><circle r="45"/>${spokes(10,49)}<circle r="24" fill="#8b663f"/></g><circle r="8" fill="#a1a7a0"/></g>
 <path d="M737 794 L797 803" stroke="#6c7976" stroke-width="14" stroke-linecap="round"/><path id="millAxle" d="M742 791 L793 800" stroke="#cbd5c9" stroke-width="3"/>
 <g transform="translate(488 596) scale(1 .19)"><circle r="53" fill="#c3c5ad" stroke="#6c7567" stroke-width="4"/><g id="millStone" stroke="#727e70" stroke-width="3">${spokes(8,45)}</g><circle r="7" fill="#5e655b"/></g>
 ${spots.map(([k,x,y,w,h])=>`<g class="mill-spot" data-part="${k}" role="button" tabindex="0" aria-label="${help[k][0]}: ${k==='gate'?'open or close':'explore'}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="13"/><title>Click: ${help[k][0]}</title></g>`).join('')}</svg><p class="mill-caption">Click a label to explore. Coloured moving layers show the mechanism over your textbook picture; this is a simplified demonstration.</p></div><aside><div class="mill-controls"><button id="millToggle">Open gate & start</button><button id="millPause" disabled>Pause</button><button id="millReset">Reset</button></div><p id="millStatus" role="status">Gate closed · machinery stopped</p><div class="mill-explain" aria-live="polite"><h3 id="millPart">Start with the sluice gate</h3><p id="millHelp">Click the sluice gate label, or press “Open gate & start”. Watch how one action causes the next.</p></div><label>Speed <input id="millSpeed" type="range" min="0.3" max="2" step="0.1" value="1"></label><details><summary>Talk about the process</summary><p>What happens first? Why does the wheel turn? What does the axle do?</p><p>“The gate opens. This causes…”<br>“The wheel turns because…”<br>“The axle turns, which in turn…”</p></details></aside></div>`;
 let gate=false,paused=false,t=0,last=performance.now(),raf;
 const q=s=>d.querySelector(s);
 function status(){q('#millToggle').textContent=gate?'Close gate':'Open gate & start';q('#millPause').disabled=!gate;q('#millPause').textContent=paused?'Resume':'Pause';q('#millStatus').textContent=!gate?'Gate closed · machinery stopped':paused?'Paused · look closely at the parts':'Gate open · water is driving the machinery';q('#millGate').setAttribute('transform',gate?'translate(0 -27)':'');q('#millWater').setAttribute('opacity',gate?'1':'0');}
 function select(k){q('#millPart').textContent=help[k][0];q('#millHelp').textContent=help[k][1];d.querySelectorAll('.mill-spot').forEach(e=>e.classList.toggle('selected',e.dataset.part===k));if(k==='gate'){gate=!gate;paused=false;}else if(!gate){gate=true;paused=false;}status();}
 d.querySelectorAll('.mill-spot').forEach(e=>{e.onclick=()=>select(e.dataset.part);e.onkeydown=ev=>{if(ev.key==='Enter'||ev.key===' '){ev.preventDefault();select(e.dataset.part);}};});
 q('#millToggle').onclick=()=>select('gate');q('#millPause').onclick=()=>{paused=!paused;status();};q('#millReset').onclick=()=>{gate=false;paused=false;t=0;status();q('#millPart').textContent='Start with the sluice gate';q('#millHelp').textContent='Open the gate and watch the connected parts work together.';d.querySelectorAll('.mill-spot').forEach(e=>e.classList.remove('selected'));};
 function frame(now){if(gate&&!paused)t+=Math.min((now-last)/1000,.06)*Number(q('#millSpeed').value);last=now;q('#millWheel').setAttribute('transform',`rotate(${-t*40})`);q('#millGear').setAttribute('transform',`rotate(${-t*40})`);q('#millStone').setAttribute('transform',`rotate(${t*60})`);q('#millCrownTop').setAttribute('transform',`rotate(${t*60})`);d.querySelectorAll('.mill-crown-tooth').forEach((e,i)=>{const a=i*Math.PI/6+t*Math.PI/3;e.setAttribute('cx',488+54*Math.cos(a));e.setAttribute('cy',747+12*Math.sin(a));e.setAttribute('visibility',Math.sin(a)>=0?'visible':'hidden');});q('#millUprightStripe').setAttribute('d',`M${488+3*Math.cos(t*Math.PI/3)} 655 V737`);q('#millStream').setAttribute('stroke-dashoffset',-t*65);q('#millAxle').setAttribute('opacity',.55+.4*Math.cos(t*2));raf=requestAnimationFrame(frame);}
 q('#millClose').onclick=()=>d.close();d.onclose=()=>cancelAnimationFrame(raf);d.showModal();status();raf=requestAnimationFrame(frame);
}
(function installTextbookMill(){
 const css=document.createElement('style');css.textContent=`#textbookMill{width:min(1120px,96vw);max-height:94vh;border:3px solid #293747;border-radius:22px;padding:20px;background:#fffdf6;color:#263647}#textbookMill::backdrop{background:#172b3bc9}.mill-head{display:flex;justify-content:space-between;align-items:center;gap:12px}.mill-head h2{font-size:25px;margin:0 0 14px}.mill-layout{display:grid;grid-template-columns:minmax(0,1.6fr) minmax(240px,1fr);gap:20px}#millScene{width:100%;max-height:65vh;display:block}.mill-spot{cursor:pointer}.mill-spot rect{fill:#ffd65b;fill-opacity:.08;stroke:#a36300;stroke-width:2;stroke-dasharray:4 3}.mill-spot:hover rect,.mill-spot:focus rect,.mill-spot.selected rect{fill-opacity:.28;stroke:#7f43b0;stroke-width:4;stroke-dasharray:none}.mill-controls{display:flex;flex-wrap:wrap;gap:8px}.mill-controls button{background:#f6d266;border:2px solid #263647;border-radius:12px;padding:10px;font:inherit;cursor:pointer}.mill-controls button:disabled{opacity:.5}.mill-explain{background:#e4f0e7;border-radius:18px;padding:16px;margin:12px 0;font-size:18px}.mill-explain h3{margin:0 0 10px}.mill-caption{font-size:13px!important;line-height:1.4}.mill-layout details{margin-top:18px}.mill-layout summary{cursor:pointer;font-weight:bold}.textbook-mill-hotspot{position:absolute;left:42%;top:39%;width:56%;height:34%;background:transparent;border:3px dashed #9357ac;border-radius:12px;cursor:pointer;z-index:2}.textbook-mill-hotspot span{position:absolute;right:8px;bottom:7px;background:#ffe28a;border:2px solid #293747;border-radius:10px;padding:8px;font: bold 17px sans-serif}.drawing .textbook-mill-hotspot{pointer-events:none}@media(max-width:700px){.mill-layout{grid-template-columns:1fr}#textbookMill{padding:12px}.mill-head h2{font-size:20px}#millScene{max-height:48vh}}`;document.head.append(css);
 function install(){const img=document.getElementById('bookImage'),board=document.getElementById('bookBoard');if(img&&board){let btn=board.querySelector('.textbook-mill-hotspot');if(/book-16\.jpg/.test(img.getAttribute('src')||'')){if(!btn){btn=document.createElement('button');btn.className='textbook-mill-hotspot';btn.setAttribute('aria-label','Make the textbook water wheel work');btn.innerHTML='<span>Click to make the mill work</span>';btn.onclick=openTextbookMill;board.append(btn);}}else if(btn)btn.remove();}const content=document.getElementById('lessonContent');if(content&&location.hash.includes('/read')&&!content.querySelector('.mill-launch')){const actions=content.querySelector('.lesson-actions');if(actions){const b=document.createElement('button');b.className='primary mill-launch';b.textContent='Make the textbook mill work';b.onclick=openTextbookMill;actions.append(b);}}}
 const observer=new MutationObserver(install);observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['src']});install();
})();
