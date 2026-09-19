let entries=[],weights=[],rotation=0,spinning=false,lastWinner=null,selected=-1,privateTarget=null,results=[];
let currentLanguage=localStorage.getItem('spinwheel.language')||'en';
let stats=JSON.parse(localStorage.getItem('spinwheel.stats')||'{"spins":0,"seconds":0}');
let entryPoints=JSON.parse(localStorage.getItem('spinwheel.entryPoints')||'[]');
const WINNER_SHARE=80;
const HOUSE_SHARE=20;
let winnerShare=WINNER_SHARE;
let spinAudio=null,spinNoise=null,spinGain=null,lastTickIndex=-1;
const $=id=>document.getElementById(id),canvas=$('wheel'),ctx=canvas.getContext('2d'),fullscreenCanvas=$('fullscreenWheel'),fullscreenCtx=fullscreenCanvas?.getContext('2d'),TAU=Math.PI*2;
const T={en:{newGame:'New',open:'Open',save:'Save',share:'Share',gallery:'Gallery',customize:'Customize',more:'More',wheelReady:'Wheel ready',clickSpin:'CLICK TO SPIN',entries:'Entries',results:'Results',stats:'Stats',shuffle:'Shuffle',sort:'Sort',add:'Add',removeWinner:'Remove winner',appearance:'Appearance',themeColor:'Theme colour',backgroundColor:'Background colour',backgroundStyle:'Background style',graphics:'Animated graphics',sound:'Sound',confetti:'Confetti',spinTime:'Spin time',apply:'Apply',wheelSpins:'Wheel spins',hoursSpinning:'Hours of spinning',lastWinner:'Last winner',openCloud:'From cloud',openLocal:'Local file',helpChoose:'Help me choose',updateShared:'Update your shared wheel',savePrivate:'Save as private wheel',signIn:'Sign In',galleryNote:'You can add your own wheels to this gallery by clicking “Share” on the main page.',spinStatsHint:'Live game statistics'},am:{newGame:'አዲስ',open:'ክፈት',save:'አስቀምጥ',share:'አጋራ',gallery:'ጋለሪ',customize:'አቀናብር',more:'ተጨማሪ',wheelReady:'ዊል ዝግጁ ነው',clickSpin:'ለማሽከርከር ይጫኑ',entries:'ዝርዝሮች',results:'ውጤቶች',stats:'ስታቲስቲክስ',shuffle:'ቀላቅል',sort:'ደርድር',add:'ጨምር',removeWinner:'አሸናፊውን አስወግድ',appearance:'መልክ',themeColor:'የገጽታ ቀለም',backgroundColor:'የጀርባ ቀለም',backgroundStyle:'የጀርባ አይነት',graphics:'የተንቀሳቃሽ ግራፊክስ',sound:'ድምፅ',confetti:'ኮንፈቲ',spinTime:'የማሽከርከሪያ ጊዜ',apply:'ተግብር',wheelSpins:'የዊል ማሽከርከሪያዎች',hoursSpinning:'የማሽከርከር ሰዓታት',lastWinner:'የመጨረሻ አሸናፊ',openCloud:'ከክላውድ',openLocal:'የአካባቢ ፋይል',helpChoose:'እርዳኝ',updateShared:'የተጋራ ዊል አዘምን',savePrivate:'እንደ የግል ዊል አስቀምጥ',signIn:'ግባ',galleryNote:'የራስዎን ዊል ለመጨመር Share ይጫኑ።',spinStatsHint:'የጨዋታ ስታቲስቲክስ'}};
['om','ti','wal','so','sid'].forEach(l=>T[l]={...T.en});
function tr(k){return T[currentLanguage]?.[k]||T.en[k]||k}
function applyLanguage(){document.documentElement.lang=currentLanguage;document.querySelectorAll('[data-i18n]').forEach(e=>e.textContent=tr(e.dataset.i18n));$('language').value=currentLanguage}
function setLanguage(v){currentLanguage=v;localStorage.setItem('spinwheel.language',v);applyLanguage();render()}
function rnd(){const a=new Uint32Array(1);crypto.getRandomValues(a);return a[0]/4294967296}
function norm(x){return String(x).trim().toLocaleLowerCase()}
function normalize(a){a%=TAU;return a<0?a+TAU:a}
function load(){entries=(localStorage.getItem('spinwheel.entries')||'1\n2\n3\n4\n5\n6\n7\n8\n9\n10').split(/\r?\n/).map(x=>x.trim()).filter(Boolean);weights=entries.map(()=>1);syncEntryPoints();sync();draw();updateStats();renderMainGallery('')}
function sync(){localStorage.setItem('spinwheel.entries',entries.join('\n'));$('entryInput').value=entries.join('\n');$('entryCount').textContent=entries.length;syncEntryPoints();renderPoints()}
function syncEntryPoints(){const def=Math.max(0,Number($('pointsDefault')?.value||100));if(!Array.isArray(entryPoints))entryPoints=[];entryPoints=entries.map((_,i)=>Number.isFinite(Number(entryPoints[i]))?Math.max(0,Number(entryPoints[i])):def);localStorage.setItem('spinwheel.entryPoints',JSON.stringify(entryPoints));}
function updatePointsUI(){winnerShare=WINNER_SHARE;localStorage.setItem('spinwheel.winnerShare',String(WINNER_SHARE));renderPoints()}
function applyDefaultPoints(){const v=Math.max(0,Number($('pointsDefault')?.value||100));entryPoints=entries.map(()=>v);localStorage.setItem('spinwheel.entryPoints',JSON.stringify(entryPoints));renderPoints()}
function applyAllEntryBet(){const v=Math.max(0,Number($('fsAllBetAmount')?.value||0));entryPoints=entries.map(()=>v);if($('pointsDefault'))$('pointsDefault').value=v;localStorage.setItem('spinwheel.entryPoints',JSON.stringify(entryPoints));renderPoints()}
function renderPoints(){syncEntryPoints();const total=entryPoints.reduce((a,b)=>a+b,0);const pct=WINNER_SHARE;const list=$('pointsList');if(list)list.innerHTML=entries.map((x,i)=>`<div class="pointRow"><span><b>${i+1}.</b> ${escapeHtml(x)}</span><input type="number" min="0" step="1" value="${entryPoints[i]}" onchange="setEntryPoints(${i},this.value)"></div>`).join('');const fs=$('fsPointsList');if(fs)fs.innerHTML=entries.map((x,i)=>`<div class="fsPointRow ${i===selected?'active':''}"><span class="fsPointName">${i+1}. ${escapeHtml(x)}</span><label class="fsBetInput"><span>BET</span><input type="number" min="0" step="1" value="${entryPoints[i]}" aria-label="Bet for ${escapeHtml(x)}" onchange="setEntryPoints(${i},this.value)" onclick="event.stopPropagation()" onkeydown="event.stopPropagation()"></label></div>`).join('');if($('poolTotal'))$('poolTotal').textContent=`${total.toLocaleString()} pts`;if($('fsPoolTotal'))$('fsPoolTotal').textContent=`${total.toLocaleString()} pts`;if($('fsWinnerShare'))$('fsWinnerShare').textContent=`${pct}%`;if($('winnerPayoutPct'))$('winnerPayoutPct').textContent=`${WINNER_SHARE}%`;if($('winnerPayout'))$('winnerPayout').textContent=`${winnerPointAmount().toLocaleString()} pts`;if($('housePayout'))$('housePayout').textContent=`${housePointAmount().toLocaleString()} pts`;if($('fsWinnerPayout'))$('fsWinnerPayout').textContent=`${winnerPointAmount().toLocaleString()} pts`;if($('winnerShare')){$('winnerShare').value=pct;$('winnerShare').readOnly=true}}
function setEntryPoints(i,v){entryPoints[i]=Math.max(0,Number(v)||0);localStorage.setItem('spinwheel.entryPoints',JSON.stringify(entryPoints));renderPoints()}
function winnerPointAmount(){if(selected<0)return 0;const total=entryPoints.reduce((a,b)=>a+b,0);return Math.round(total*WINNER_SHARE/100)}
function housePointAmount(){const total=entryPoints.reduce((a,b)=>a+b,0);return Math.round(total*HOUSE_SHARE/100)}

function render(){sync();const list=$('entryList');list.innerHTML=entries.map((x,i)=>`<div class="entry ${i===selected?'selected':''}"><span>${i+1}. ${escapeHtml(x)}</span><button onclick="selected=${i};render()">✎</button></div>`).join('');renderResults();renderStatsPanel();renderFullscreenEntries()}
function escapeHtml(s){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function renderResults(){$('resultsList').innerHTML=results.length?results.map((r,i)=>`<div class="result"><b>${i+1}. ${escapeHtml(r.name)}</b><small>${r.time}</small></div>`).join(''):'<div class="result">No spins yet.</div>'}
function renderStatsPanel(){$('statsPanel').innerHTML=`<div class="statBox"><b>${stats.spins.toLocaleString()}</b>Wheel spins</div><div class="statBox"><b>${(stats.seconds/3600).toFixed(2)}</b>Hours of spinning</div><div class="statBox"><b>${escapeHtml(lastWinner||'—')}</b>Last winner</div>`}
function renderFullscreenEntries(){const box=$('fsEntries');if(!box)return;const count=$('fsEntryCount');if(count)count.textContent=`(${entries.length})`;box.innerHTML=entries.map((x,i)=>`<div class="fsEntry ${i===selected?'active':''}"><span class="num">${i+1}</span><span class="entryName">${escapeHtml(x)}</span><button type="button" class="fsEntryRemove" title="Remove entry" onclick="fsRemoveEntry(event,${i})">−</button></div>`).join('')}
$('entryInput').addEventListener('input',()=>{entries=$('entryInput').value.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);weights=entries.map(()=>1);selected=-1;sync();draw();render()});
$('fsInlineEntryName')?.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();confirmFsAddEntry(e)}else if(e.key==='Escape'){e.preventDefault();cancelFsAddEntry(e)}});

function addEntry(){const x=prompt('Enter a number or name');if(x?.trim()){entries.push(x.trim());weights.push(1);entryPoints.push(Math.max(0,Number($('pointsDefault')?.value||100)));render();draw()}}
function fsAddEntry(e){
  e?.preventDefault(); e?.stopPropagation();
  if(spinning)return;
  const panel=$('fsInlineAdd');
  const input=$('fsInlineEntryName');
  if(!panel||!input)return;
  panel.classList.remove('hidden');
  input.value='';
  requestAnimationFrame(()=>input.focus());
}
function confirmFsAddEntry(e){
  e?.preventDefault(); e?.stopPropagation();
  if(spinning)return;
  const input=$('fsInlineEntryName');
  const x=input?.value?.trim();
  if(!x){input?.focus();return;}
  entries.push(x); weights.push(1);
  const allBet=Math.max(0,Number($('fsAllBetAmount')?.value||0));
  entryPoints.push(allBet);
  selected=-1; sync(); render(); draw();
  cancelFsAddEntry(e);
  requestAnimationFrame(()=>{resizeFullscreenCanvas();draw();});
}
function cancelFsAddEntry(e){
  e?.preventDefault(); e?.stopPropagation();
  $('fsInlineAdd')?.classList.add('hidden');
}
function fsRemoveEntry(e,i){
  e?.preventDefault(); e?.stopPropagation();
  if(spinning)return;
  if(i<0||i>=entries.length)return;
  entries.splice(i,1); weights.splice(i,1); entryPoints.splice(i,1);
  if(selected===i)selected=-1; else if(selected>i)selected--;
  sync(); render(); draw();
  requestAnimationFrame(()=>{resizeFullscreenCanvas();draw();});
}
function renameSelected(){if(selected<0)return;const x=prompt('New name',entries[selected]);if(x?.trim()){entries[selected]=x.trim();render();draw()}}
function shuffleEntries(){for(let i=entries.length-1;i>0;i--){let j=Math.floor(rnd()*(i+1));[entries[i],entries[j]]=[entries[j],entries[i]]}selected=-1;render();draw()}
function sortEntries(){entries.sort((a,b)=>a.localeCompare(b,undefined,{numeric:true,sensitivity:'base'}));selected=-1;render();draw()}
function drawWheel(targetCtx,size){if(!targetCtx)return;const n=entries.length,c=size/2,r=size*.467;targetCtx.clearRect(0,0,size,size);if(!n)return;const step=TAU/n;for(let i=0;i<n;i++){const a=rotation+i*step;targetCtx.beginPath();targetCtx.moveTo(c,c);targetCtx.arc(c,c,r,a,a+step);targetCtx.closePath();targetCtx.fillStyle=`hsl(${(i*360/n+12)%360},78%,${i%2?57:62}%)`;targetCtx.fill();targetCtx.strokeStyle='#ffffffdd';targetCtx.lineWidth=Math.max(2,size/273);targetCtx.stroke();targetCtx.save();targetCtx.translate(c,c);targetCtx.rotate(a+step/2);targetCtx.textAlign='right';targetCtx.fillStyle='#fff';const labelSize=n<=20?Math.min(size*.038,300/n+7):n<=40?Math.min(size*.026,210/n+7):Math.min(size*.020,170/n+6);targetCtx.font=`900 ${Math.max(9,labelSize)}px Arial`;targetCtx.shadowColor='#000c';targetCtx.shadowBlur=5;targetCtx.fillText(entries[i],r-24*size/820,6);targetCtx.restore()}targetCtx.beginPath();targetCtx.arc(c,c,r,0,TAU);targetCtx.strokeStyle='#ffffff';targetCtx.lineWidth=Math.max(4,size/164);targetCtx.stroke()}
function resizeFullscreenCanvas(){if(!fullscreenCanvas)return;const box=fullscreenCanvas.parentElement;const rect=box?.getBoundingClientRect();if(!rect?.width)return;const dpr=Math.min(window.devicePixelRatio||1,2);const px=Math.max(300,Math.round(rect.width*dpr));if(fullscreenCanvas.width!==px||fullscreenCanvas.height!==px){fullscreenCanvas.width=px;fullscreenCanvas.height=px;fullscreenCanvas.style.width='100%';fullscreenCanvas.style.height='100%'}}
function draw(){drawWheel(ctx,820);resizeFullscreenCanvas();drawWheel(fullscreenCtx,fullscreenCanvas?.width||1200)}
function weightedRandom(){let total=weights.reduce((a,b)=>a+b,0),x=rnd()*total;for(let i=0;i<entries.length;i++){x-=weights[i];if(x<0)return i}return entries.length-1}
function targetIndexForValue(target){const wanted=norm(target);let i=entries.findIndex(x=>norm(x)===wanted);if(i>=0)return i;const wantedNum=Number(String(target).trim());if(Number.isFinite(wantedNum)){i=entries.findIndex(x=>{const n=Number(String(x).trim());return Number.isFinite(n)&&n===wantedNum});if(i>=0)return i}return -1}
async function getServerTarget(){try{const r=await fetch('/api/target',{cache:'no-store'});if(r.ok){const d=await r.json();privateTarget=d.target==null?null:String(d.target);}}catch(e){}return privateTarget}
async function findWinnerIndex(){const target=await getServerTarget();if(target!==null){const i=targetIndexForValue(target);if(i>=0)return i;privateTarget=null;try{await fetch('/api/target/clear',{method:'POST'})}catch(e){}alert('The owner target was not found in the current wheel entries. Add that number/name to the wheel and try again.');return -1}return weightedRandom()}
const POINTER_ANGLE=-Math.PI/2;
function targetRotationForIndex(idx){const n=entries.length,step=TAU/n;/* Segment midpoint is placed exactly on the fixed pointer at 12 o'clock. */return normalize(POINTER_ANGLE-(idx+.5)*step)}
async function spin(){
 if(spinning||entries.length<1)return;
 spinning=true; lastWinner=null; $('winner').textContent='';
 const idx=await findWinnerIndex();
 if(idx<0){spinning=false;return}
 const start=rotation,endBase=targetRotationForIndex(idx),delta=normalize(endBase-start);
 const dur=Math.max(1000,+$('duration').value*1000);
 // Keep the wheel visually fast even when the configured duration is long.
 // The extra turns scale with time so a 60-second spin does not crawl.
 // One consistent, wheel-like motion profile for every selected spin time:
 // quick launch -> sustained spin -> smooth progressive braking -> gentle stop.
 // The number of turns scales with time so 2s, 10s and 60s all feel like the same wheel.
 const turns=Math.max(6,Math.round((dur/1000)*1.45));
 const end=start+turns*TAU+delta,t0=performance.now();
 startSpinRumble();
 document.querySelectorAll('.floatingSpin,.fsSpin').forEach(b=>b.classList.add('spin-rumble'));
 let lastSeg=Math.floor(normalize(rotation-POINTER_ANGLE)/(TAU/Math.max(entries.length,1)));
 function frame(now){
   const p=Math.min(1,(now-t0)/dur);
   // Ease-out cubic: fast at the beginning, then continuously loses speed until zero.
   // No abrupt velocity change at the end.
   const q=1-Math.pow(1-p,3);
   rotation=start+(end-start)*q;
   const seg=Math.floor(normalize(rotation-POINTER_ANGLE)/(TAU/Math.max(entries.length,1)));
   if(seg!==lastSeg){lastSeg=seg;spinTick();}
   draw();
   if(p<1)requestAnimationFrame(frame);else{rotation=endBase;draw();stopSpinRumble();document.querySelectorAll('.floatingSpin,.fsSpin').forEach(b=>b.classList.remove('spin-rumble'));finishSpin(idx,dur)}
 }
 requestAnimationFrame(frame)
}
function finishSpin(idx,dur){selected=idx;lastWinner=entries[idx];stats.spins++;stats.seconds+=dur/1000;localStorage.setItem('spinwheel.stats',JSON.stringify(stats));results.unshift({name:lastWinner,time:new Date().toLocaleString()});results=results.slice(0,100);localStorage.setItem('spinwheel.results',JSON.stringify(results));const totalBet=entryPoints.reduce((a,b)=>a+b,0); const totalWin=Math.round(totalBet*WINNER_SHARE/100); fetch('/api/play',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({winner:lastWinner,total_bet:totalBet,total_win:totalWin})}).then(()=>{}).catch(()=>{});$('winner').innerHTML='<small>🏆 WINNER</small><strong>'+escapeHtml(lastWinner)+'</strong><em>+'+winnerPointAmount().toLocaleString()+' pts</em>';$('fullscreenWinner').textContent='🏆 WINNER · '+lastWinner+' · +'+winnerPointAmount().toLocaleString()+' pts';$('lastResult').textContent=lastWinner;updateStats();render();spinning=false;privateTarget=null;fetch('/api/target/clear',{method:'POST'}).catch(()=>{});announceWinner(lastWinner);if(currentLanguage!=='am')setTimeout(sound,350);if($('confetti').checked)confetti()}
function updateStats(){const h=(stats.seconds/3600).toFixed(2),lw=lastWinner||results[0]?.name||'—';$('spinCount').textContent=stats.spins.toLocaleString();$('hoursCount').textContent=h;$('activitySpins').textContent=stats.spins.toLocaleString();$('activityHours').textContent=h;$('lastResult').textContent=lw;if($('fsSpinCount'))$('fsSpinCount').textContent=stats.spins.toLocaleString();if($('fsHoursCount'))$('fsHoursCount').textContent=h;if($('fsLastResult'))$('fsLastResult').textContent=lw}
function ensureAudio(){if(spinAudio)return spinAudio;const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return null;spinAudio=new AC();return spinAudio}
function startSpinRumble(){if(!$('sound').checked)return;try{const a=ensureAudio();if(!a)return;a.resume?.();if(spinNoise)return;
  // Low mechanical wheel rumble: filtered noise + a quiet rotating hum.
  const buffer=a.createBuffer(1,a.sampleRate*2,a.sampleRate),data=buffer.getChannelData(0);
  for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*0.55;
  const src=a.createBufferSource(),filter=a.createBiquadFilter(),g=a.createGain();
  src.buffer=buffer;src.loop=true;filter.type='lowpass';filter.frequency.value=430;filter.Q.value=.7;
  g.gain.setValueAtTime(.0001,a.currentTime);g.gain.exponentialRampToValueAtTime(.035,a.currentTime+.18);
  src.connect(filter);filter.connect(g);g.connect(a.destination);src.start();spinNoise=src;spinGain=g;
 }catch(e){}}
function stopSpinRumble(){try{if(spinNoise&&spinAudio){const now=spinAudio.currentTime;spinGain.gain.cancelScheduledValues(now);spinGain.gain.setValueAtTime(Math.max(spinGain.gain.value,.0001),now);spinGain.gain.exponentialRampToValueAtTime(.0001,now+.18);spinNoise.stop(now+.2)}}catch(e){}spinNoise=null;spinGain=null}
function spinTick(){if(!$('sound').checked)return;try{const a=ensureAudio();if(!a)return;a.resume?.();const now=a.currentTime;
  // Short spring/click like a real physical prize wheel passing a peg.
  const o=a.createOscillator(),g=a.createGain();o.type='triangle';o.frequency.setValueAtTime(210+Math.random()*55,now);o.frequency.exponentialRampToValueAtTime(105,now+.055);
  g.gain.setValueAtTime(.0001,now);g.gain.exponentialRampToValueAtTime(.075,now+.003);g.gain.exponentialRampToValueAtTime(.0001,now+.075);o.connect(g);g.connect(a.destination);o.start(now);o.stop(now+.08);
  const c=a.createOscillator(),cg=a.createGain();c.type='square';c.frequency.value=1450;cg.gain.setValueAtTime(.0001,now);cg.gain.exponentialRampToValueAtTime(.025,now+.002);cg.gain.exponentialRampToValueAtTime(.0001,now+.018);c.connect(cg);cg.connect(a.destination);c.start(now);c.stop(now+.02);
 }catch(e){}}
function sound(){if(!$('sound').checked)return;try{const a=ensureAudio();if(!a)return;a.resume?.();const notes=[523,659,784,1047];notes.forEach((f,i)=>{const o=a.createOscillator(),g=a.createGain();o.type='sine';o.frequency.value=f;g.gain.setValueAtTime(.001,a.currentTime+i*.11);g.gain.exponentialRampToValueAtTime(.08,a.currentTime+i*.11+.02);g.gain.exponentialRampToValueAtTime(.001,a.currentTime+i*.11+.18);o.connect(g);g.connect(a.destination);o.start(a.currentTime+i*.11);o.stop(a.currentTime+i*.11+.2)})}catch(e){}}
function escapeHtml(v){return String(v).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
const amUnits=['ዜሮ','አንድ','ሁለት','ሶስት','አራት','አምስት','ስድስት','ሰባት','ስምንት','ዘጠኝ','አስር','አስራ አንድ','አስራ ሁለት','አስራ ሶስት','አስራ አራት','አስራ አምስት','አስራ ስድስት','አስራ ሰባት','አስራ ስምንት','አስራ ዘጠኝ'];
const amTens={20:'ሃያ',30:'ሰላሳ',40:'አርባ',50:'ሃምሳ',60:'ስልሳ',70:'ሰባ',80:'ሰማንያ',90:'ዘጠና'};
function amharicNumber(n){n=Math.trunc(Number(n));if(!Number.isFinite(n))return String(n);if(n<0)return 'አሉታዊ '+amharicNumber(-n);if(n<20)return amUnits[n];if(n<100){let t=Math.floor(n/10)*10,r=n%10;return amTens[t]+(r?' '+amUnits[r]:'')}if(n<1000){let h=Math.floor(n/100),r=n%100;let hword=h===1?'አንድ መቶ':amUnits[h]+' መቶ';return hword+(r?' '+amharicNumber(r):'')}if(n<1000000){let th=Math.floor(n/1000),r=n%1000;let thword=th===1?'አንድ ሺህ':amharicNumber(th)+' ሺህ';return thword+(r?' '+amharicNumber(r):'')}if(n<1000000000){let m=Math.floor(n/1000000),r=n%1000000;let mw=m===1?'አንድ ሚሊዮን':amharicNumber(m)+' ሚሊዮን';return mw+(r?' '+amharicNumber(r):'')}return String(n)}
function spokenWinner(name){const text=String(name).trim();const num=/^[+-]?\d+$/.test(text)?Number(text):null;if(currentLanguage==='am'){if(num!==null)return 'አሸናፊው፣ ቁጥር '+amharicNumber(num)+'፣ ነው።';return 'አሸናፊው፣ '+text+'፣ ነው።'}return 'The winner is '+text+'.'}
function pickVoice(lang){const voices=speechSynthesis.getVoices();if(lang==='am'){return voices.find(v=>/^am-ET$/i.test(v.lang))||voices.find(v=>/^am(-|_)/i.test(v.lang))||voices.find(v=>/amharic|ethiopia|ethiopian|mekdes/i.test(v.name+' '+v.lang))||null}return voices.find(v=>/^en(-|_)/i.test(v.lang))||null}
function browserAnnounce(text,lang){if(!('speechSynthesis' in window))return false;try{speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang=lang==='am'?'am-ET':'en-US';u.rate=lang==='am'?.72:.9;u.pitch=1;u.volume=1;const v=pickVoice(lang);if(lang==='am'&&!v)return false;if(v)u.voice=v;speechSynthesis.speak(u);return true}catch(e){return false}}
function announceWinner(name){if(!$('sound').checked||!name)return;const text=spokenWinner(name);if(currentLanguage==='am'){
  const spoken=browserAnnounce(text,'am');
  if(!spoken){
    try{
      const audio=new Audio('https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=am&q='+encodeURIComponent(text));
      audio.volume=1; audio.play().catch(()=>{});
    }catch(e){}
  }
}else{browserAnnounce(text,'en')}}
if('speechSynthesis' in window){speechSynthesis.onvoiceschanged=()=>{ /* refreshes the available Amharic voice list */ }}
function confetti(){for(let i=0;i<80;i++){const s=document.createElement('i');s.className='confetti';s.style.left=Math.random()*100+'vw';s.style.setProperty('--h',Math.floor(Math.random()*360));s.style.animationDelay=Math.random()*.6+'s';document.body.appendChild(s);setTimeout(()=>s.remove(),2000)}}
function openFullscreenGame(){const el=$('fullscreenGame');el.classList.remove('hidden');renderFullscreenEntries();renderPoints();requestAnimationFrame(()=>{resizeFullscreenCanvas();draw()});$('fullscreenWinner').textContent=lastWinner?`🏆 ${lastWinner} · +${winnerPointAmount().toLocaleString()} pts`:'Ready to spin';updateStats();try{el.requestFullscreen?.()}catch(e){}}
function closeFullscreenGame(){const el=$('fullscreenGame');el.classList.add('hidden');if(document.fullscreenElement)document.exitFullscreen?.()}
document.addEventListener('fullscreenchange',()=>{if(!document.fullscreenElement && !$('fullscreenGame').classList.contains('hidden'))$('fullscreenGame').classList.add('hidden')});
function showSideTab(w,b){document.querySelectorAll('.sideTabs button').forEach(x=>x.classList.remove('active'));b.classList.add('active');$('entryList').classList.toggle('hidden',w!=='list');$('resultsList').classList.toggle('hidden',w!=='results');$('statsPanel').classList.toggle('hidden',w!=='stats')}
function newGame(){entries=['1','2','3','4','5','6','7','8','9','10'];weights=entries.map(()=>1);rotation=0;results=[];lastWinner=null;localStorage.removeItem('spinwheel.results');render();draw();updateStats()}
function toggleCustomize(){$('customize').classList.toggle('hidden')}
function toggleMenu(id){document.querySelectorAll('.dropdown').forEach(x=>x.id===id?x.classList.toggle('open'):x.classList.remove('open'))}document.addEventListener('click',e=>{if(!e.target.closest('.menu'))document.querySelectorAll('.dropdown').forEach(x=>x.classList.remove('open'))})
function themeData(){return{themeColor:$('themeColor').value,bgColor:$('bgColor').value,bgStyle:$('bgStyle').value,graphics:$('graphics').checked,sound:$('sound').checked,confetti:$('confetti').checked,duration:$('duration').value}}
function applyTheme(){const d=themeData();document.documentElement.style.setProperty('--theme',d.themeColor);document.documentElement.style.setProperty('--bg',d.bgColor);document.body.className='bg-'+d.bgStyle;document.querySelector('.bgfx').style.display=d.graphics?'block':'none';localStorage.setItem('spinwheel.theme',JSON.stringify(d));$('durationLabel').textContent=d.duration}
function loadTheme(){const d=JSON.parse(localStorage.getItem('spinwheel.theme')||'null');if(d){$('themeColor').value=d.themeColor||'#7c5cff';$('bgColor').value=d.bgColor||'#06183d';$('bgStyle').value=d.bgStyle||'solid';$('graphics').checked=d.graphics!==false;$('sound').checked=d.sound!==false;$('confetti').checked=d.confetti!==false;$('duration').value=d.duration||6}$('durationLabel').textContent=$('duration').value;applyTheme()}
function savePrivate(){localStorage.setItem('spinwheel.private',JSON.stringify({entries,settings:themeData()}));alert('Saved as private wheel.')}
async function saveShared(){try{const data={name:'SpinWheel',entries,settings:themeData(),id:localStorage.getItem('spinwheel.cloudId')||null};const r=await fetch('/api/save-wheel',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)}),d=await r.json();if(!d.ok)throw Error();localStorage.setItem('spinwheel.cloudId',d.id);alert('Shared wheel updated.')}catch(e){savePrivate()}}
async function openCloud(){const id=localStorage.getItem('spinwheel.cloudId');if(!id)return showInfo('cloudHelp');try{const r=await fetch('/api/wheel/'+id),d=await r.json();if(!d.ok)throw Error();entries=String(d.entries).split(/\r?\n/).filter(Boolean);weights=entries.map(()=>1);render();draw()}catch(e){alert('Cloud wheel could not be opened.')}}
function openLocal(){const i=document.createElement('input');i.type='file';i.accept='.json,.txt,.csv';i.onchange=()=>{const f=i.files[0];if(!f)return;const rd=new FileReader();rd.onload=()=>{try{const d=JSON.parse(rd.result);entries=d.entries||[];weights=entries.map(()=>1);render();draw()}catch(e){entries=String(rd.result).split(/[\r\n,]+/).map(x=>x.trim()).filter(Boolean);weights=entries.map(()=>1);render();draw()}};rd.readAsText(f)};i.click()}
function helpChoose(){showInfo('helpChoose')}
function shareWheel(){const u=new URL(location.href);u.searchParams.set('entries',entries.join('|'));u.searchParams.set('duration',$('duration').value);$('sharePreview').value=u.href;navigator.clipboard?.writeText(u.href);showShare(u.href)}
function showShare(link){openModal('Share','<div class="shareNotice"><b>Visibility</b><p>If you continue, you will create a public link to your current wheel, including its names, colours and settings.</p><p>This link can be shared by email, website or social media. Public links should contain only information you want to share.</p><p><a href="/terms" target="_blank">Terms & conditions</a></p></div>',[['Cancel','secondary',closeModal],['Continue','primary',()=>{navigator.clipboard?.writeText(link);closeModal();alert('Public link copied.')}]] )}
function importGoogleSheets(){openModal('Import Google Sheets','<p>Paste a public CSV export URL.</p><input id="sheetUrl" class="galleryInput" placeholder="CSV URL">',[['Cancel','secondary',closeModal],['Import','primary',async()=>{const u=$('sheetUrl').value.trim();if(!u)return;try{const t=await (await fetch(u)).text();entries=t.split(/[\r\n,]+/).map(x=>x.replace(/^"|"$/g,'').trim()).filter(Boolean);weights=entries.map(()=>1);render();draw();closeModal()}catch(e){alert('Could not read this URL. Download CSV and use Open local file.')}}]])}
const cats=['Picker','Class','Clash','Defense','Praktikum','Speed','Fuggler','Generator','Seson','Family'];
function renderMainGallery(q=''){const ql=q.toLowerCase();$('mainCats').innerHTML=cats.map(c=>`<button onclick="renderMainGallery('${c}')">${c}</button>`).join('');const names=['Lucky Draw','Classroom Picker','Giveaway','Team Picker','Tasks','Food','Clash Challenge','Defense Picker','Praktikum Randomizer','Speed Challenge','Fuggler Fun'];const a=names.filter(x=>x.toLowerCase().includes(ql));$('mainGallery').innerHTML=a.slice(0,6).map(x=>`<div class="miniCard" onclick="loadGalleryWheel('${x}')"><b>${x}</b><small>Open sample wheel</small></div>`).join('')||'<small>No gallery results.</small>'}
function openGallery(){openModal('Gallery','<input id="gallerySearchModal" class="galleryInput" placeholder="Search gallery…"><div id="galleryModalCards" class="miniGallery" style="margin-top:10px"></div><p>You can add your own wheels to this gallery by clicking “Share” on the main page.</p>');const f=()=>{$('galleryModalCards').innerHTML=cats.concat(['Lucky Draw','Classroom Picker','Giveaway']).filter(x=>x.toLowerCase().includes($('gallerySearchModal').value.toLowerCase())).map(x=>`<div class="miniCard" onclick="loadGalleryWheel('${x}')"><b>${x}</b></div>`).join('')};f();$('gallerySearchModal').oninput=f}
function loadGalleryWheel(name){entries=name.toLowerCase().includes('class')?['Student 1','Student 2','Student 3','Student 4','Student 5']:name.toLowerCase().includes('family')?['Mom','Dad','Brother','Sister','Cousin']:['1','2','3','4','5','6','7','8','9','10'];weights=entries.map(()=>1);rotation=0;render();draw();closeModal()}
function showInfo(type){const m={how:['How to use','Add entries, click the wheel or press Ctrl + Enter, then use Customize for appearance and spin time.'],features:['Wheel features','Spin duration, sound, animated graphics, results, sharing, gallery, localization and private owner control are supported.'],privacy:['Privacy','Keep sensitive information off public wheels. Local settings remain local until you choose cloud or sharing.'],streaming:['OBS / Streaming','Use the public wheel as a browser source and keep the private owner-control URL private.'],random:['Randomness','Normal spins use crypto.getRandomValues(). Owner targeting is an intentional override for the next result.'],terms:['Terms & conditions','Use SpinWheel responsibly. Public wheels should comply with applicable law and site rules.'],faq:['FAQ','Click the wheel or press Ctrl + Enter to spin. Use Results to review previous winners.'],api:['API','Developer API features can be expanded as the platform grows.'],feedback:['Feedback','Send feedback to the SpinWheel owner about improvements you want.'],cloudHelp:['Open from cloud','Save a shared wheel first. The cloud ID is stored in this browser.'],helpChoose:['Help me choose','Start with names or numbers, use Shuffle or Sort, then spin.']}[type]||['SpinWheel',''];openModal(m[0],'<p>'+m[1]+'</p>')}
function showAccount(){openModal('My Account','<p>Sign in to keep your private wheels and preferences together.</p><input class="galleryInput" placeholder="Email"><input class="galleryInput" type="password" placeholder="Password">',[['Cancel','secondary',closeModal],['Sign in','primary',()=>{closeModal();alert('Signed in on this device.')}]] )}
function showPreferences(){openModal('Preferences','<p>Use Customize for theme, background graphics, sound and spin duration. Preferences are stored on this device.</p>')}
function openModal(title,body,actions=[]){$('modalTitle').textContent=title;$('modalBody').innerHTML=body;$('modalActions').innerHTML=actions.map(a=>`<button class="${a[1]}" id="modalBtn${Math.random().toString(36).slice(2)}">${a[0]}</button>`).join('');const bs=$('modalActions').querySelectorAll('button');actions.forEach((a,i)=>bs[i].onclick=a[2]);$('modal').classList.remove('hidden')}
function closeModal(){$('modal').classList.add('hidden')}
function loadUrlWheel(){const p=new URLSearchParams(location.search);if(p.get('entries')){entries=p.get('entries').split('|').filter(Boolean);weights=entries.map(()=>1);$('duration').value=p.get('duration')||6;$('durationLabel').textContent=$('duration').value;render();draw()}}
function connect(){if(typeof io!=='function')return;const s=io({transports:['websocket','polling']});s.on('target_changed',d=>{privateTarget=d.target==null?null:String(d.target)});s.on('connect',()=>getServerTarget())}
window.addEventListener('resize',()=>{resizeFullscreenCanvas();draw()});
if(window.ResizeObserver&&fullscreenCanvas){const ro=new ResizeObserver(()=>{resizeFullscreenCanvas();draw()});ro.observe(fullscreenCanvas.parentElement)}
$('duration').oninput=()=>$('durationLabel').textContent=$('duration').value;document.addEventListener('keydown',e=>{if(e.ctrlKey&&e.key==='Enter'){e.preventDefault();spin()}});canvas.onclick=spin;canvas.ontouchend=e=>{e.preventDefault();spin()};if(fullscreenCanvas){fullscreenCanvas.onclick=spin;fullscreenCanvas.ontouchend=e=>{e.preventDefault();spin()}};results=JSON.parse(localStorage.getItem('spinwheel.results')||'[]');load();render();loadTheme();applyLanguage();loadUrlWheel();connect();
