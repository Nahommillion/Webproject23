let entries=[],weights=[],rotation=0,spinning=false,lastWinner=null,selected=-1,privateTarget=null,results=[];
let currentLanguage=localStorage.getItem('spinwheel.language')||'en';
let stats=JSON.parse(localStorage.getItem('spinwheel.stats')||'{"spins":0,"seconds":0}');
const canvas=document.getElementById('wheel'),ctx=canvas.getContext('2d'),$=id=>document.getElementById(id);
const T={en:{tagline:'Random Name Picker',newGame:'New Game',open:'Open⌄',save:'Save⌄',share:'Share',gallery:'Gallery',customize:'Customize',more:'More⌄',feedback:'Feedback',faq:'FAQ',myAccount:'My Account',preferences:'Preferences',importSheets:'Import Google Sheets',openCloud:'Open from cloud',openLocal:'Open local file',helpChoose:'Help me choose',updateShared:'Update your shared wheel',savePrivate:'Save as private wheel',wheelReady:'Wheel ready',entries:'Entries',entriesHint:'Add names or numbers, one per line.',add:'＋ Add',rename:'Rename',shuffle:'Shuffle',sort:'Sort',list:'List',results:'Results',removeWinner:'Remove winner',appearance:'Appearance',themeColor:'Theme colour',backgroundColor:'Background colour',backgroundStyle:'Background style',graphics:'Animated graphics',sound:'Sound',confetti:'Confetti',spinTime:'Spin time',apply:'Apply',clickSpin:'CLICK TO SPIN',spin:'SPIN',wheelSpins:'Wheel spins',hoursSpinning:'Hours of spinning',lastWinner:'Last winner',whatForTitle:'What is the wheel spinner for?',whatForIntro:'Use a wheel to make quick, fair choices in classrooms, giveaways, presentations, meetings, games and everyday decisions.',use1:'Pick a student to answer a question.',use2:'Choose a customer for a giveaway.',use3:'Select a lucky attendee during a presentation.',use4:'Randomize who speaks first in a meeting.',use5:'Choose which task to start with.',use6:'Pick who goes first in a game.',use7:'Let the wheel decide between alternatives.',howTitle:'How to use the wheel spinner',howText:'Type entries in the panel, click the wheel or press Ctrl + Enter, then customize colours, sounds, graphics and spin time.',activityTitle:'Activity',featuresTitle:'Wheel features',featuresIntro:'A flexible wheel designed for games, classrooms, events and work.',feature1:'Rich audio controls.',feature2:'Multi-wheel organization.',feature3:'Weighted entries.',feature4:'Instant sharing.',feature5:'Custom visuals and themes.',feature6:'Large lists and imports.',feature7:'Global localization.',privacyTitle:'Is my data private?',privacyText:'Local settings stay on your device unless you choose to share or use a connected service. Avoid sensitive information on public wheels.',streamTitle:'Can I use the wheel in OBS or Streamlabs?',streamText:'Yes. Use the public wheel as a browser source while keeping owner controls private.',randomTitle:'Is the wheel truly random?',randomText:'Normal spins use browser cryptographic randomness. A private owner target intentionally selects the next winner.',terms:'Terms & conditions',privacy:'Privacy policy',api:'API',streaming:'Streaming',winner:'Winner!',saved:'Saved.',noSaved:'No saved wheel.',selectFirst:'Select an entry first.',enterEntry:'Enter a number or name',newName:'New name',notFound:'is not in the wheel entries.',shareCopied:'Share link copied.',enterTarget:'Enter a number or name.'},am:{tagline:'የዘፈቀደ ስም መምረጫ',newGame:'አዲስ ጨዋታ',open:'ክፈት⌄',save:'አስቀምጥ⌄',share:'አጋራ',gallery:'ጋለሪ',customize:'አቀናብር',more:'ተጨማሪ⌄',feedback:'አስተያየት',faq:'FAQ',myAccount:'መለያዬ',preferences:'ምርጫዎች',importSheets:'Google Sheets አስገባ',openCloud:'ከክላውድ ክፈት',openLocal:'የአካባቢ ፋይል ክፈት',helpChoose:'እንዴት እንደምመርጥ እርዳኝ',updateShared:'የተጋራ ዊል አዘምን',savePrivate:'እንደ የግል ዊል አስቀምጥ',wheelReady:'ዊል ዝግጁ ነው',entries:'ዝርዝሮች',entriesHint:'ስሞች ወይም ቁጥሮችን አንድ በአንድ መስመር ያስገቡ።',add:'＋ ጨምር',rename:'ስም ቀይር',shuffle:'ቀላቅል',sort:'ደርድር',list:'ዝርዝር',results:'ውጤቶች',removeWinner:'አሸናፊውን አስወግድ',appearance:'መልክ',themeColor:'የገጽታ ቀለም',backgroundColor:'የጀርባ ቀለም',backgroundStyle:'የጀርባ አይነት',graphics:'የተንቀሳቃሽ ግራፊክስ',sound:'ድምፅ',confetti:'ኮንፈቲ',spinTime:'የማሽከርከሪያ ጊዜ',apply:'ተግብር',clickSpin:'ለማሽከርከር ይጫኑ',spin:'አሽከርክር',wheelSpins:'የዊል ማሽከርከሪያዎች',hoursSpinning:'የማሽከርከር ሰዓታት',lastWinner:'የመጨረሻ አሸናፊ',winner:'አሸናፊ!',saved:'ተቀምጧል።',selectFirst:'መጀመሪያ አንድ እቃ ይምረጡ።',enterEntry:'ቁጥር ወይም ስም ያስገቡ',newName:'አዲስ ስም',notFound:'በዊል ውስጥ አልተገኘም።',shareCopied:'የማጋሪያ ሊንክ ተቀድቷል።',enterTarget:'ቁጥር ወይም ስም ያስገቡ።'}};
const COMMON={};Object.keys(T.en).forEach(k=>COMMON[k]=T.en[k]);['om','ti','wal','so','sid'].forEach(l=>T[l]={...COMMON});
function tr(k){return T[currentLanguage]?.[k]||T.en[k]||k}
function applyLanguage(){document.documentElement.lang=currentLanguage;document.querySelectorAll('[data-i18n]').forEach(e=>e.textContent=tr(e.dataset.i18n));$('language').value=currentLanguage}
function setLanguage(v){currentLanguage=v;localStorage.setItem('spinwheel.language',v);applyLanguage()}
function rnd(){const a=new Uint32Array(1);crypto.getRandomValues(a);return a[0]/4294967296}
function norm(x){return String(x).trim().toLocaleLowerCase()}
function load(){entries=(localStorage.getItem('spinwheel.entries')||'1\n2\n3\n4\n5\n6\n7\n8\n9\n10').split(/\r?\n/).map(x=>x.trim()).filter(Boolean);weights=entries.map(()=>1);$('entryInput').value=entries.join('\n');render();draw();updateStats()}
function sync(){localStorage.setItem('spinwheel.entries',entries.join('\n'));$('entryInput').value=entries.join('\n');$('entryCount').textContent=entries.length}
function render(){sync();const list=$('entryList');list.innerHTML='';entries.forEach((x,i)=>{const d=document.createElement('div');d.className='entry'+(i===selected?' selected':'');const s=document.createElement('span');s.textContent=(i+1)+'. '+x;const b=document.createElement('button');b.textContent='✎';b.onclick=()=>{selected=i;render()};d.append(s,b);list.appendChild(d)});renderResults()}
function renderResults(){const r=$('resultsList');r.innerHTML=results.length?results.map((x,i)=>`<div class="result"><span>${i+1}. ${escapeHtml(x.name)}</span><small>${x.time}</small></div>`).join(''):'<div class="result">—</div>'}
function escapeHtml(s){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
$('entryInput').addEventListener('input',()=>{entries=$('entryInput').value.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);weights=entries.map(()=>1);selected=-1;render();draw()});
function addEntry(){const x=prompt(tr('enterEntry'));if(x?.trim()){entries.push(x.trim());weights.push(1);render();draw()}}
function renameSelected(){if(selected<0)return alert(tr('selectFirst'));const x=prompt(tr('newName'),entries[selected]);if(x?.trim()){entries[selected]=x.trim();render();draw()}}
function shuffleEntries(){for(let i=entries.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1));[entries[i],entries[j]]=[entries[j],entries[i]]}selected=-1;render();draw()}
function sortEntries(){entries.sort((a,b)=>a.localeCompare(b,undefined,{numeric:true,sensitivity:'base'}));selected=-1;render();draw()}
function draw(){
  const n=entries.length,c=400,r=365;
  ctx.clearRect(0,0,800,800);
  if(!n)return;
  const step=Math.PI*2/n;
  for(let i=0;i<n;i++){
    const a=rotation+i*step;
    ctx.beginPath();ctx.moveTo(c,c);ctx.arc(c,c,r,a,a+step);ctx.closePath();
    ctx.fillStyle=`hsl(${i*360/n},72%,58%)`;ctx.fill();
    ctx.strokeStyle='#ffffffdd';ctx.lineWidth=3;ctx.stroke();
    ctx.save();ctx.translate(c,c);ctx.rotate(a+step/2);ctx.textAlign='right';ctx.fillStyle='#fff';
    ctx.font=`900 ${Math.max(14,Math.min(30,300/n+7))}px Arial`;
    ctx.shadowColor='#0008';ctx.shadowBlur=4;ctx.fillText(entries[i],r-25,5);ctx.restore();
  }
  // Outer glow/rim and center hub.
  ctx.beginPath();ctx.arc(c,c,r,0,Math.PI*2);ctx.strokeStyle=varColor('--theme','#7c5cff');ctx.lineWidth=10;ctx.stroke();
  ctx.beginPath();ctx.arc(c,c,63,0,Math.PI*2);ctx.fillStyle='#0b1020e8';ctx.fill();ctx.strokeStyle='#ffffffaa';ctx.lineWidth=3;ctx.stroke();
}
function varColor(name,fallback){const v=getComputedStyle(document.documentElement).getPropertyValue(name).trim();return v||fallback}
function findTarget(){
  if(privateTarget!==null){
    const i=entries.findIndex(x=>norm(x)===norm(privateTarget));
    if(i>=0)return i;
    privateTarget=null;
  }
  return weightedRandom();
}
function weightedRandom(){let total=weights.reduce((a,b)=>a+b,0),x=rnd()*total;for(let i=0;i<entries.length;i++){x-=weights[i];if(x<0)return i}return entries.length-1}
function normalizeAngle(a){return ((a%(Math.PI*2))+Math.PI*2)%(Math.PI*2)}
function spin(){
  if(spinning||entries.length<1)return;
  spinning=true;$('winner').textContent='';
  const idx=findTarget(),n=entries.length,step=Math.PI*2/n;
  // The arrow is fixed at 12 o'clock. We aim the CENTER of the selected
  // segment at exactly -90 degrees, so the visual winner and logical winner match.
  const pointer=-Math.PI/2;
  const desired=pointer-(idx+0.5)*step;
  const start=rotation;
  let delta=normalizeAngle(desired-start);
  const turns=7+Math.floor(rnd()*3);
  const end=start+turns*Math.PI*2+delta;
  const dur=Math.max(1000,Number($('duration').value)*1000),t0=performance.now();
  $('duration').disabled=true;document.querySelector('.spinButton').disabled=true;
  function frame(now){
    const p=Math.min(1,(now-t0)/dur),e=1-Math.pow(1-p,4);
    rotation=start+(end-start)*e;draw();
    if(p<1)requestAnimationFrame(frame);else{
      // Snap to the mathematically exact final angle to remove floating-point drift.
      rotation=normalizeAngle(desired);draw();finish(idx,dur);
    }
  }
  requestAnimationFrame(frame);
}
function finish(idx,dur){
  // idx is the exact segment under the pointer. Never derive the winner from
  // approximate canvas coordinates after the animation.
  rotation=normalizeAngle(rotation);draw();
  lastWinner=entries[idx];
  results.unshift({name:lastWinner,time:new Date().toLocaleString()});results=results.slice(0,100);
  stats.spins++;stats.seconds+=dur/1000;
  localStorage.setItem('spinwheel.stats',JSON.stringify(stats));
  updateStats();renderResults();$('lastResult').textContent=lastWinner;
  $('winner').textContent='🏆 '+lastWinner;
  spinning=false;$('duration').disabled=false;document.querySelector('.spinButton').disabled=false;
  privateTarget=null;sound();if($('confetti').checked)confetti();saveLocalStats();
}
function updateStats(){$('spinCount').textContent=stats.spins.toLocaleString();$('hoursCount').textContent=(stats.seconds/3600).toFixed(2);$('activitySpins').textContent=stats.spins.toLocaleString();$('activityHours').textContent=(stats.seconds/3600).toFixed(2)}
function saveLocalStats(){localStorage.setItem('spinwheel.results',JSON.stringify(results))}
function newGame(){entries=['1','2','3','4','5','6','7','8','9','10'];weights=entries.map(()=>1);rotation=0;results=[];lastWinner=null;selected=-1;sync();render();draw()}
function removeWinner(){if(!lastWinner)return;const i=entries.indexOf(lastWinner);if(i>=0){entries.splice(i,1);weights.splice(i,1);lastWinner=null;render();draw()}}
function toggleCustomize(){$('customize').classList.toggle('hidden')}
function toggleMenu(id){document.querySelectorAll('.dropdown').forEach(x=>x.id===id?x.classList.toggle('open'):x.classList.remove('open'))}
document.addEventListener('click',e=>{if(!e.target.closest('.menu'))document.querySelectorAll('.dropdown').forEach(x=>x.classList.remove('open'))})
function showSideTab(which,btn){document.querySelectorAll('.sideTabs button').forEach(b=>b.classList.remove('active'));btn.classList.add('active');$('entryList').classList.toggle('hidden',which!=='list');$('resultsList').classList.toggle('hidden',which!=='results')}
function sound(){if(!$('sound').checked)return;try{const a=new AudioContext(),o=a.createOscillator(),g=a.createGain();o.frequency.value=660;g.gain.value=.08;o.connect(g);g.connect(a.destination);o.start();o.stop(a.currentTime+.35)}catch(e){}}
function confetti(){for(let i=0;i<70;i++){const s=document.createElement('i');s.className='confetti';s.style.left=Math.random()*100+'vw';s.style.top='-20px';s.style.setProperty('--h',Math.floor(Math.random()*360));s.style.animationDelay=Math.random()*.5+'s';document.body.appendChild(s);setTimeout(()=>s.remove(),1800)}}
function toggleFullscreen(){document.documentElement.requestFullscreen?.()}
document.addEventListener('keydown',e=>{if(e.ctrlKey&&e.key==='Enter'){e.preventDefault();spin()}});canvas.onclick=spin;canvas.ontouchend=e=>{e.preventDefault();spin()};$('duration').oninput=()=>$('durationLabel').textContent=$('duration').value;
function themeData(){return{themeColor:$('themeColor').value,bgColor:$('bgColor').value,bgStyle:$('bgStyle').value,graphics:$('graphics').checked,sound:$('sound').checked,confetti:$('confetti').checked,duration:$('duration').value}}
function applyTheme(){const d=themeData();document.documentElement.style.setProperty('--theme',d.themeColor);document.documentElement.style.setProperty('--bg',d.bgColor);document.body.classList.remove('bg-solid','bg-gradient','bg-pattern','bg-dots');document.body.classList.add('bg-'+d.bgStyle);document.querySelector('.ambient').style.display=d.graphics?'block':'none';localStorage.setItem('spinwheel.theme',JSON.stringify(d))}
function loadTheme(){const d=JSON.parse(localStorage.getItem('spinwheel.theme')||'null');if(d){$('themeColor').value=d.themeColor||'#7c5cff';$('bgColor').value=d.bgColor||'#101426';$('bgStyle').value=d.bgStyle||'solid';$('graphics').checked=d.graphics!==false;$('sound').checked=d.sound!==false;$('confetti').checked=d.confetti!==false;$('duration').value=d.duration||6;$('durationLabel').textContent=$('duration').value}applyTheme()}
function payload(){return{name:'SpinWheel',entries,settings:themeData()}}
function savePrivate(){localStorage.setItem('spinwheel.private',JSON.stringify(payload()));closeMenus();alert(tr('saved'))}
async function saveShared(){closeMenus();try{const data=payload();data.id=localStorage.getItem('spinwheel.cloudId')||null;const r=await fetch('/api/save-wheel',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});const d=await r.json();if(d.ok){localStorage.setItem('spinwheel.cloudId',d.id);alert(tr('saved'))}else throw Error()}catch(e){savePrivate()}}
async function openCloud(){closeMenus();const id=localStorage.getItem('spinwheel.cloudId');if(!id)return showInfo('cloudHelp');try{const r=await fetch('/api/wheel/'+id),d=await r.json();if(!d.ok)throw Error();entries=String(d.entries||'').split(/\r?\n/).filter(Boolean);weights=entries.map(()=>1);render();draw();}catch(e){alert(tr('noSaved'))}}
function openLocal(){closeMenus();const i=document.createElement('input');i.type='file';i.accept='.json,.txt';i.onchange=()=>{const f=i.files[0];if(!f)return;const rd=new FileReader();rd.onload=()=>{try{const d=JSON.parse(rd.result);entries=d.entries||[];weights=entries.map(()=>1);if(d.settings){$('themeColor').value=d.settings.themeColor||$('themeColor').value;$('bgColor').value=d.settings.bgColor||$('bgColor').value;$('bgStyle').value=d.settings.bgStyle||'solid';$('duration').value=d.settings.duration||6;applyTheme()}render();draw()}catch(e){entries=String(rd.result).split(/\r?\n/).filter(Boolean);weights=entries.map(()=>1);render();draw()}};rd.readAsText(f)};i.click()}
function helpChoose(){closeMenus();showInfo('helpChoose')}
function shareWheel(){const u=new URL(location.href);u.searchParams.set('entries',entries.join('|'));u.searchParams.set('duration',$('duration').value);const text=u.href;if(navigator.clipboard)navigator.clipboard.writeText(text);showShare(text)}
function showShare(link){openModal('Share',`<div class="shareNotice"><b>Visibility</b><p>If you continue, you will create a public link to your current wheel, including its names, colours and settings.</p><p>This link can be shared by email, website or social media. Unused links can be deleted by the owner.</p><p>We want SpinWheel to be a safe place for everyone. Wheels that violate the terms may be removed.</p></div>`,[['Cancel','secondary',closeModal],['Continue','primary',()=>{if(navigator.clipboard)navigator.clipboard.writeText(link);alert(tr('shareCopied'));closeModal()}]])}
function importGoogleSheets(){closeMenus();openModal(tr('importSheets'),'<p>Paste a public Google Sheets CSV URL or export your sheet as CSV.</p><input id="sheetUrl" class="gallerySearch" placeholder="CSV URL">', [['Cancel','secondary',closeModal],['Import','primary',async()=>{const u=$('sheetUrl').value.trim();if(!u)return;try{const r=await fetch(u),txt=await r.text();entries=txt.split(/\r?\n/).flatMap(x=>x.split(',')).map(x=>x.replace(/^"|"$/g,'').trim()).filter(Boolean);weights=entries.map(()=>1);render();draw();closeModal()}catch(e){alert('Unable to read this URL from the browser. Download CSV locally and use Open local file.')}}]])}
function openGallery(){const cats=['picker','class','clash','defense','praktikum','speed','fuggler','generator','seson','family'];openModal('Gallery',`<input class="gallerySearch" id="gallerySearch" placeholder="Search gallery…"><div class="chips">${cats.map(x=>`<button onclick="filterGallery('${x}')">${x}</button>`).join('')}</div><div id="galleryCards" class="galleryCards"></div><p>You can add your own wheels to this gallery by clicking Share on the main page.</p>`);renderGallery('');setTimeout(()=>{const q=$('gallerySearch');if(q)q.oninput=()=>renderGallery(q.value)},0)}
function renderGallery(q){const names=['Classroom Picker','Lucky Draw','Number Generator','Family Game','Praktikum Randomizer','Speed Challenge','Clash Challenge','Defense Picker','Fuggler Fun'];const arr=names.filter(x=>x.toLowerCase().includes(q.toLowerCase()));$('galleryCards').innerHTML=arr.map(x=>`<div class="galleryCard" onclick="loadGalleryWheel('${x}')"><b>${x}</b><p>Open this sample wheel.</p></div>`).join('')||'<p>No gallery results.</p>'}
function filterGallery(q){renderGallery(q)}function loadGalleryWheel(name){entries=['1','2','3','4','5','6','7','8','9','10'];if(name.includes('Class'))entries=['Student 1','Student 2','Student 3','Student 4','Student 5'];if(name.includes('Family'))entries=['Mom','Dad','Brother','Sister','Cousin'];weights=entries.map(()=>1);render();draw();closeModal()}
function showInfo(type){closeMenus();const content={terms:['Terms & conditions','Use SpinWheel responsibly. Public wheels must comply with applicable laws and platform rules.'],privacy:['Privacy policy','Keep private information out of public wheels. Local settings can be stored on your device; cloud/shared wheels are sent to the server when you choose those features.'],faq:['FAQ','Use Ctrl + Enter or click the wheel to spin. Customize the theme, graphics, sound and duration. Results appear in the Results tab.'],api:['API','API access can be added to a future developer account.'],streaming:['Streaming','Use the public wheel URL as a browser source in OBS or Streamlabs while keeping the owner control URL private.'],feedback:['Feedback','Tell the owner what you would like improved in SpinWheel.'],cloudHelp:['Cloud open','Save a shared wheel first. Its cloud ID is then stored in this browser.'],helpChoose:['Help me choose','Start with a simple list of names or numbers. Use Shuffle for a quick mix, Sort for an ordered list, or let SpinWheel choose randomly.']}[type]||['SpinWheel',''];openModal(content[0],'<p>'+content[1]+'</p>')}
function showAccount(){openModal(tr('myAccount'),'<p>Sign in to keep your private wheels and preferences together.</p><input class="gallerySearch" id="loginEmail" placeholder="Email"><br><br><input class="gallerySearch" id="loginPassword" type="password" placeholder="Password">', [['Cancel','secondary',closeModal],['Sign in','primary',()=>{localStorage.setItem('spinwheel.account', $('loginEmail').value.trim());closeModal();alert('Signed in on this device.')} ]])}
function showPreferences(){openModal(tr('preferences'),'<p>Use Customize for theme, sound, animated bubbles/graphics and spin duration. Your preferences are saved on this device.</p>', [['Close','primary',closeModal]])}
function openModal(title,body,actions=[]){$('modalTitle').textContent=title;$('modalBody').innerHTML=body;$('modalActions').innerHTML=actions.map(a=>`<button class="${a[1]}" onclick="(${a[2].toString()})()">${a[0]}</button>`).join('');$('modal').classList.remove('hidden')}
function closeModal(){$('modal').classList.add('hidden')}
function closeMenus(){document.querySelectorAll('.dropdown').forEach(x=>x.classList.remove('open'))}
function loadUrlWheel(){const p=new URLSearchParams(location.search);const raw=p.get('entries');if(raw){entries=raw.split('|').filter(Boolean);weights=entries.map(()=>1);$('duration').value=p.get('duration')||6;$('durationLabel').textContent=$('duration').value;render();draw()}}
function connect(){if(typeof io!=='function')return;const s=io();s.on('owner_ready',d=>{privateTarget=d.target??null});s.on('target_changed',d=>{privateTarget=d.target==null?null:String(d.target)})}
results=JSON.parse(localStorage.getItem('spinwheel.results')||'[]');load();loadTheme();applyLanguage();loadUrlWheel();connect();
