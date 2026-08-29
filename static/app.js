let entries=[],weights=[],rotation=0,spinning=false,lastWinner=null,selected=-1,privateTarget=null;
let currentLanguage=localStorage.getItem("spinwheel.language")||"en";

const canvas=document.getElementById("wheel"),ctx=canvas.getContext("2d"),$=id=>document.getElementById(id);

const T={
en:{tagline:"Random Name Picker",newGame:"New Game",save:"Save",open:"Open",share:"Share",customize:"Customize",entries:"Entries",entriesHint:"Add names or numbers, one per line.",add:"＋ Add",rename:"Rename",shuffle:"Shuffle",sort:"Sort",removeWinner:"Remove winner",appearance:"Appearance",themeColor:"Theme colour",backgroundColor:"Background colour",backgroundStyle:"Background style",solid:"Solid",gradient:"Gradient",pattern:"Pattern",dots:"Dots",graphics:"Background graphics",sound:"Sound",confetti:"Confetti",spinTime:"Spin time",apply:"Apply",clickSpin:"CLICK TO SPIN",spin:"SPIN",winner:"Winner!",ok:"OK",spinning:"SPINNING…",saved:"Saved on this device.",noSaved:"No saved wheel.",selectFirst:"Select an entry first.",enterEntry:"Enter a number or name",newName:"New name",notFound:"is not in the wheel entries.",shareCopied:"Share link copied.",enterTarget:"Enter a number or name."},
am:{tagline:"የዘፈቀደ ስም መምረጫ",newGame:"አዲስ ጨዋታ",save:"አስቀምጥ",open:"ክፈት",share:"አጋራ",customize:"አቀናብር",entries:"ዝርዝሮች",entriesHint:"ስሞች ወይም ቁጥሮችን አንድ በአንድ መስመር ያስገቡ።",add:"＋ ጨምር",rename:"ስም ቀይር",shuffle:"ቀላቅል",sort:"ደርድር",removeWinner:"አሸናፊውን አስወግድ",appearance:"መልክ",themeColor:"የገጽታ ቀለም",backgroundColor:"የጀርባ ቀለም",backgroundStyle:"የጀርባ አይነት",solid:"አንድ ቀለም",gradient:"ቀስ በቀስ",pattern:"ንድፍ",dots:"ነጥቦች",graphics:"የጀርባ ግራፊክስ",sound:"ድምፅ",confetti:"ኮንፌቲ",spinTime:"የማሽከርከሪያ ጊዜ",apply:"ተግብር",clickSpin:"ለማሽከርከር ይጫኑ",spin:"አሽከርክር",winner:"አሸናፊ!",ok:"እሺ",spinning:"በመሽከርከር ላይ…",saved:"በዚህ መሣሪያ ላይ ተቀምጧል።",noSaved:"የተቀመጠ ጎማ የለም።",selectFirst:"መጀመሪያ አንድ እቃ ይምረጡ።",enterEntry:"ቁጥር ወይም ስም ያስገቡ",newName:"አዲስ ስም",notFound:"በጎማው ውስጥ አልተገኘም።",shareCopied:"የማጋሪያ ሊንክ ተቀድቷል።",enterTarget:"ቁጥር ወይም ስም ያስገቡ።"},
om:{tagline:"Maqaa Filannoo Tasaa",newGame:"Tapha Haaraa",save:"Olkaa'i",open:"Bani",share:"Qoodi",customize:"Qindeessi",entries:"Tarree",entriesHint:"Maqaa ykn lakkoofsa sarara tokko tokkoon galchi.",add:"＋ Dabali",rename:"Maqaa Jijjiiri",shuffle:"Walitti Makii",sort:"Tartiibsi",removeWinner:"Mo'ataa Haqi",appearance:"Bifa",themeColor:"Halluu mata-duree",backgroundColor:"Halluu duubbee",backgroundStyle:"Akkaataa duubbee",solid:"Tokko",gradient:"Garaagarummaa",pattern:"Qorannoo",dots:"Tuqaalee",graphics:"Fakkiiwwan duubbee",sound:"Sagalee",confetti:"Confetti",spinTime:"Yeroo naannessuu",apply:"Hojii Irra Oolchi",clickSpin:"NAANNESSUUF CUQAASI",spin:"NAANNESI",winner:"Mo'ataa!",ok:"TOLE",spinning:"NAANNA'AA…",saved:"Meeshaa kana irratti olkaa'ame.",noSaved:"Wheel olkaa'ame hin jiru.",selectFirst:"Dura galmee tokko filadhu.",enterEntry:"Lakkoofsa ykn maqaa galchi",newName:"Maqaa haaraa",notFound:"wheel keessatti hin argamne.",shareCopied:"Linkiin qoodinsaa garagalfame.",enterTarget:"Lakkoofsa ykn maqaa galchi."},
ti:{tagline:"ብዘይ ቅድሚ ስም መምረጺ",newGame:"ሓድሽ ጸወታ",save:"ዓቅብ",open:"ክፈት",share:"ኣካፍል",customize:"ኣስተካኽል",entries:"ዝርዝር",entriesHint:"ስማት ወይ ቁጽሪ በብመስመሩ ኣእቱ።",add:"＋ ወስኽ",rename:"ስም ቀይር",shuffle:"ሓዋውስ",sort:"ሰርዕ",removeWinner:"ኣሸናፊ ኣልግስ",appearance:"ቅርጺ",themeColor:"ሕብሪ ገጽታ",backgroundColor:"ሕብሪ ድሕረ ባይታ",backgroundStyle:"ዓይነት ድሕረ ባይታ",solid:"ሓደ ሕብሪ",gradient:"ግራዲየንት",pattern:"ንድፊ",dots:"ነጥብታት",graphics:"ግራፊክስ ድሕረ ባይታ",sound:"ድምጺ",confetti:"ኮንፈቲ",spinTime:"ግዜ ምዝዋር",apply:"ተግብር",clickSpin:"ንምዝዋር ጠውቕ",spin:"ዘውር",winner:"ኣሸናፊ!",ok:"ሕራይ",spinning:"ይዝወር ኣሎ…",saved:"ኣብዚ መሳርሒ ተዓቂቡ።",noSaved:"ዝተዓቀበ ዊል የለን።",selectFirst:"መጀመርታ ኣንዱ ምረጽ።",enterEntry:"ቁጽሪ ወይ ስም ኣእቱ",newName:"ሓድሽ ስም",notFound:"ኣብ ዊል ኣይተረኽበን።",shareCopied:"መካፈሊ ሊንክ ተቐዲሑ።",enterTarget:"ቁጽሪ ወይ ስም ኣእቱ።"},
wal:{tagline:"Sakka Maacaa Xoosuwaa",newGame:"Haaraa Oyduwaa",save:"Meegaa",open:"Dooyi",share:"Geddari",customize:"Giigissi",entries:"C'alaa",entriesHint:"Suuntata woy maacaa sarare sarare gelissi.",add:"＋ Gujji",rename:"Suuntaa Laami",shuffle:"Geeshsha",sort:"Tarso",removeWinner:"Xoossaa Hashshi",appearance:"Danaa",themeColor:"Danaa Qooqaa",backgroundColor:"Duubbee Qooqaa",backgroundStyle:"Duubbee Dana",solid:"Issippe",gradient:"Gradient",pattern:"Mala",dots:"X'ulluwa",graphics:"Duubbee Fakkii",sound:"Sagana",confetti:"Confetti",spinTime:"Xullayssa Yeroo",apply:"Ooththa",clickSpin:"XULLAYSSANAA CUQAASI",spin:"XULLAYSSI",winner:"Hashshi!",ok:"WOY",spinning:"XULLAYSSAA…",saved:"Meeshshaa bolli meemettida.",noSaved:"Meemettida xullayssi de'ena.",selectFirst:"Koyro issuwaa doori.",enterEntry:"Suuntata woy maacaa gelissi",newName:"Ooratha suunta",notFound:"xullayssaa giddon beettibeenna.",shareCopied:"Geddari linkki garagalfame.",enterTarget:"Suuntata woy maacaa gelissi."},
so:{tagline:"Doorashada Magacyada Random-ka",newGame:"Ciyaar Cusub",save:"Kaydi",open:"Fur",share:"La wadaag",customize:"Habay",entries:"Liiska",entriesHint:"Geli magacyo ama tirooyin, mid kasta sadar gooni ah.",add:"＋ Ku dar",rename:"Magac beddel",shuffle:"Isku qas",sort:"Kala saar",removeWinner:"Ka saar guuleystaha",appearance:"Muuqaal",themeColor:"Midabka mawduuca",backgroundColor:"Midabka gadaasha",backgroundStyle:"Qaabka gadaasha",solid:"Hal midab",gradient:"Gradient",pattern:"Qaab",dots:"Dhibco",graphics:"Sawirro gadaal",sound:"Cod",confetti:"Confetti",spinTime:"Waqtiga wareegga",apply:"Dhaqan geli",clickSpin:"RIIGGA TAABO",spin:"WAREEJI",winner:"Guuleyste!",ok:"HAYE",spinning:"WUU WAREEGAYAA…",saved:"Qalabkan ayaa lagu kaydiyey.",noSaved:"Wheel kaydsan ma jiro.",selectFirst:"Marka hore dooro gelin.",enterEntry:"Geli tiro ama magac",newName:"Magac cusub",notFound:"kama jiro wheel-ka.",shareCopied:"Linkiga wadaagga waa la koobiyeeyay.",enterTarget:"Geli tiro ama magac."},
sid:{tagline:"Tasaw Maqaa Dooronsa",newGame:"Haaroo Oyduwa",save:"Ke'e",open:"Fani",share:"Gaddari",customize:"Qindeessi",entries:"Tarree",entriesHint:"Maqaa woy lakkoofsa sarara sararaan gelessi.",add:"＋ Gujji",rename:"Maqaa Soorri",shuffle:"Walitti Makki",sort:"Tartiibsi",removeWinner:"Mo'ataa Baasi",appearance:"Bifa",themeColor:"Bifa mata-duree",backgroundColor:"Duubbee bifa",backgroundStyle:"Duubbee akkata",solid:"Tokko",gradient:"Gradient",pattern:"Mala",dots:"Tuqa",graphics:"Fakkii duubbee",sound:"Sagalee",confetti:"Confetti",spinTime:"Yeroo naannessaa",apply:"Hojii irra oolchi",clickSpin:"NAANNESSUUF CUQAASI",spin:"NAANNESI",winner:"Mo'ataa!",ok:"TOLE",spinning:"NAANNA'AA…",saved:"Meeshaa kana irratti ke'ame.",noSaved:"Wheel ke'ame hin jiru.",selectFirst:"Dura galmee filadhu.",enterEntry:"Lakkoofsa ykn maqaa galchi",newName:"Maqaa haaraa",notFound:"keessatti hin argamne.",shareCopied:"Linkiin gaddarii garagalfame.",enterTarget:"Lakkoofsa ykn maqaa galchi."}
};

function tr(k){return (T[currentLanguage]&&T[currentLanguage][k])||T.en[k]||k}
function applyLanguage(){
  document.documentElement.lang=currentLanguage;
  document.querySelectorAll("[data-i18n]").forEach(el=>el.textContent=tr(el.dataset.i18n));
  $("language").value=currentLanguage;
  $("durationLabel").textContent=$("duration").value;
}
function setLanguage(lang){currentLanguage=lang;localStorage.setItem("spinwheel.language",lang);applyLanguage()}
function rnd(){let a=new Uint32Array(1);crypto.getRandomValues(a);return a[0]/4294967296}
function sync(){$("entryInput").value=entries.join("\n");$("entryCount").textContent=entries.length}
function render(){let l=$("entryList");l.innerHTML="";entries.forEach((x,i)=>{let d=document.createElement("div");d.className="entry"+(i===selected?" selected":"");let s=document.createElement("span");s.textContent=(i+1)+". "+x;let b=document.createElement("button");b.textContent=tr("rename");b.onclick=()=>{selected=i;render()};d.append(s,b);l.appendChild(d)})}
function load(){entries=($("entryInput").value||"").split(/\r?\n/).map(x=>x.trim()).filter(Boolean);weights=entries.map(()=>1);sync();render();draw()}
$("entryInput").value="1\n2\n3\n4\n5\n6\n7\n8\n9\n10";$("entryInput").oninput=load;

function addEntry(){let x=prompt(tr("enterEntry"));if(x?.trim()){entries.push(x.trim());weights.push(1);sync();render();draw()}}
function renameSelected(){if(selected<0)return alert(tr("selectFirst"));let x=prompt(tr("newName"),entries[selected]);if(x?.trim()){entries[selected]=x.trim();sync();render();draw()}}
function shuffleEntries(){for(let i=entries.length-1;i>0;i--){let j=Math.floor(rnd()*(i+1));[entries[i],entries[j]]=[entries[j],entries[i]];[weights[i],weights[j]]=[weights[j],weights[i]]}selected=-1;sync();render();draw()}
function sortEntries(){entries.sort((a,b)=>a.localeCompare(b,undefined,{numeric:true,sensitivity:"base"}));selected=-1;sync();render();draw()}

function draw(){
  let n=entries.length,c=380,r=360;ctx.clearRect(0,0,760,760);if(!n)return;
  let step=2*Math.PI/n;
  for(let i=0;i<n;i++){
    let a=rotation+i*step;
    ctx.beginPath();ctx.moveTo(c,c);ctx.arc(c,c,r,a,a+step);ctx.closePath();
    ctx.fillStyle=`hsl(${i*360/n},72%,58%)`;ctx.fill();ctx.strokeStyle="#fff";ctx.lineWidth=4;ctx.stroke();
    ctx.save();ctx.translate(c,c);ctx.rotate(a+step/2);ctx.textAlign="right";ctx.fillStyle="#fff";
    ctx.font=`bold ${Math.max(15,Math.min(30,280/n+8))}px Arial`;ctx.fillText(entries[i],r-25,0);ctx.restore()
  }
  ctx.beginPath();ctx.arc(c,c,58,0,Math.PI*2);ctx.fillStyle="#fff";ctx.fill();ctx.strokeStyle="#222";ctx.lineWidth=3;ctx.stroke()
}
function norm(x){return String(x).trim().toLocaleLowerCase()}
function targetIndex(){
  if(privateTarget!==null){
    let i=entries.findIndex(x=>norm(x)===norm(privateTarget));
    if(i>=0)return i;
    alert(`"${privateTarget}" ${tr("notFound")}`);privateTarget=null;
  }
  let total=weights.reduce((a,b)=>a+b,0),x=rnd()*total;
  for(let i=0;i<entries.length;i++){x-=weights[i];if(x<0)return i}
  return entries.length-1
}
function spin(){
  if(spinning||entries.length<2)return;
  spinning=true;lastWinner=null;$("winner").textContent="";$("centerText").textContent=tr("spinning");$("duration").disabled=true;document.querySelector(".bigSpin").disabled=true;
  let idx=targetIndex(),n=entries.length,step=2*Math.PI/n,target=idx*step+step/2,delta=-Math.PI/2-target;
  while(delta<0)delta+=2*Math.PI;
  let start=rotation,end=rotation+(7+Math.floor(rnd()*3))*2*Math.PI+delta,dur=+$("duration").value*1000,t0=performance.now();
  function f(now){
    let p=Math.min(1,(now-t0)/dur),e=1-Math.pow(1-p,4);rotation=start+(end-start)*e;draw();
    if(p<1)requestAnimationFrame(f);else{
      rotation=end%(2*Math.PI);draw();lastWinner=entries[idx];$("centerText").textContent=tr("clickSpin");$("winner").textContent="🏆 "+lastWinner;
      spinning=false;$("duration").disabled=false;document.querySelector(".bigSpin").disabled=false;showWinner(lastWinner);sound();privateTarget=null
    }
  }
  requestAnimationFrame(f)
}
canvas.onclick=spin;canvas.ontouchend=e=>{e.preventDefault();spin()};
$("duration").oninput=()=> $("durationLabel").textContent=$("duration").value;

function sound(){if(!$("sound").checked)return;try{let a=new AudioContext(),o=a.createOscillator(),g=a.createGain();o.frequency.value=720;g.gain.value=.1;o.connect(g);g.connect(a.destination);o.start();o.stop(a.currentTime+.35)}catch(e){}}
function showWinner(x){$("modalWinner").textContent=x;$("winnerModal").classList.remove("hidden");if($("confetti").checked)for(let i=0;i<45;i++){let s=document.createElement("span");s.className="confetti";s.style.left=Math.random()*100+"vw";s.style.setProperty("--h",Math.floor(Math.random()*360));s.style.animationDelay=Math.random()*.4+"s";document.body.appendChild(s);setTimeout(()=>s.remove(),1600)}}
function closeWinner(){$("winnerModal").classList.add("hidden")}
function removeWinner(){if(!lastWinner)return;let i=entries.indexOf(lastWinner);if(i>=0){entries.splice(i,1);weights.splice(i,1);lastWinner=null;sync();render();draw()}}
function newGame(){entries=["1","2","3","4","5","6","7","8","9","10"];weights=entries.map(()=>1);rotation=0;lastWinner=null;privateTarget=null;sync();render();draw()}
function saveGame(){localStorage.setItem("spinwheel.v6",JSON.stringify({entries,weights,duration:$("duration").value,theme:{themeColor:$("themeColor").value,bgColor:$("bgColor").value,bgStyle:$("bgStyle").value,graphics:$("graphics").checked}}));alert(tr("saved"))}
function openSaved(){let x=localStorage.getItem("spinwheel.v6");if(!x)return alert(tr("noSaved"));let d=JSON.parse(x);entries=d.entries;weights=d.weights||entries.map(()=>1);$("duration").value=d.duration||6;if(d.theme){$("themeColor").value=d.theme.themeColor||"#6c63ff";$("bgColor").value=d.theme.bgColor||"#f5f7fb";$("bgStyle").value=d.theme.bgStyle||"solid";$("graphics").checked=d.theme.graphics!==false;applyTheme()}sync();render();draw()}
function shareWheel(){let u=new URL(location.href);u.searchParams.set("entries",entries.join(","));u.searchParams.set("spinTime",$("duration").value);navigator.clipboard?.writeText(u.href);alert(tr("shareCopied"))}
function toggleCustomize(){$("customize").classList.toggle("hidden")}
function toggleFullscreen(){document.documentElement.requestFullscreen?.()}

function applyTheme(){
  const theme=$("themeColor").value,bg=$("bgColor").value,style=$("bgStyle").value;
  document.documentElement.style.setProperty("--theme",theme);
  document.documentElement.style.setProperty("--bg",bg);
  document.body.classList.remove("bg-solid","bg-gradient","bg-pattern","bg-dots");
  document.body.classList.add("bg-"+style);
  $("bgGraphic").classList.toggle("hiddenGraphic",!$("graphics").checked);
  localStorage.setItem("spinwheel.theme",JSON.stringify({themeColor:theme,bgColor:bg,bgStyle:style,graphics:$("graphics").checked}));
}
function loadTheme(){
  let d=JSON.parse(localStorage.getItem("spinwheel.theme")||"null");
  if(d){$("themeColor").value=d.themeColor||"#6c63ff";$("bgColor").value=d.bgColor||"#f5f7fb";$("bgStyle").value=d.bgStyle||"solid";$("graphics").checked=d.graphics!==false}
  applyTheme()
}

function connect(){
  if(typeof io!=="function")return;
  let s=io();
  s.on("target_changed",d=>{privateTarget=d.target==null?null:String(d.target)})
}

load();loadTheme();applyLanguage();connect();
