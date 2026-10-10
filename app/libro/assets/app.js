(function(){
'use strict';
var $=function(s){return document.querySelector(s)};
var BOOK=[],LES=[],cur=0,practice=false;
var LS='libro4b:';
function load(k,d){try{var v=localStorage.getItem(LS+k);return v==null?d:JSON.parse(v)}catch(e){return d}}
function save(k,v){try{localStorage.setItem(LS+k,JSON.stringify(v))}catch(e){}}
var answers=load('answers',{});
practice=load('practice',false);
function toast(t,ms){var e=$('#toast');e.textContent=t;e.hidden=false;clearTimeout(toast.t);toast.t=setTimeout(function(){e.hidden=true},ms||2200)}

/* ---------- TTS ---------- */
var synth=window.speechSynthesis,voices=[],voice=null;
var MALE=/(male|david|daniel|alex|fred|aaron|arthur|guy|tom|mark|george|james|rishi|oliver|ryan|christopher|eric|roger|brian|matthew|google uk english male)/i;
var FEM=/(female|samantha|victoria|karen|zira|susan|hazel|moira|tessa|fiona|serena|allison|ava|kate|libby|sonia|aria|jenny|emma|amy|joanna|salli|kimberly|google us english)/i;
function loadVoices(){
  if(!synth)return;voices=synth.getVoices().filter(function(v){return /^en(-|_|$)/i.test(v.lang)});
  var sel=$('#voiceSel');sel.innerHTML='';
  var saved='';try{saved=(localStorage.getItem('ql_guia_voice_v2')||'').split('|')[0]}catch(e){}if(!saved)saved=load('voice','');
  voices.sort(function(a,b){return score(b)-score(a)});
  voices.forEach(function(v,i){var o=document.createElement('option');o.value=v.name;o.textContent=v.name+' ('+v.lang+')'+(MALE.test(v.name)&&!/female/i.test(v.name)?' ♂':'');sel.appendChild(o)});
  voice=voices.filter(function(v){return v.name===saved})[0]||voices[0]||null;
  if(voice)sel.value=voice.name;
  if(!voices.length){var o=document.createElement('option');o.textContent='(sin voces en inglés en este dispositivo)';sel.appendChild(o)}
}
function score(v){var s=0;if(MALE.test(v.name)&&!/female/i.test(v.name))s+=10;if(FEM.test(v.name))s-=5;if(/en-US/i.test(v.lang))s+=3;if(/en-GB/i.test(v.lang))s+=2;if(v.localService)s+=1;return s}
if(synth){loadVoices();synth.onvoiceschanged=loadVoices}
var sayEl=null;
function speak(text,el,onend){
  if(!synth){toast('Tu navegador no tiene voz (TTS).');return}
  synth.cancel();if(sayEl)sayEl.classList.remove('say');
  text=String(text).replace(/→/g,', modifies,').replace(/\(that\)/g,'that').replace(/~/g,'');
  var u=new SpeechSynthesisUtterance(text);u.lang=voice?voice.lang:'en-US';if(voice)u.voice=voice;
  text=text.replace(/\n/g,' ');u.text=text;u.rate=$('#slow').checked?0.6:0.95;
  if(el){sayEl=el;el.classList.add('say')}
  u.onend=u.onerror=function(){if(el)el.classList.remove('say');if(onend)onend()};
  synth.speak(u);
}

/* ---------- render ---------- */
function pct(b){return 'left:'+b[0]+'%;top:'+b[1]+'%;width:'+b[2]+'%;height:'+b[3]+'%'}
function norm(s){return String(s).toLowerCase().replace(/[’`´]/g,"'").replace(/\(that\)\s*/g,'').replace(/\bthat\s+/g,'').replace(/[^a-z0-9' ]/g,' ').replace(/\s+/g,' ').trim()}
function fit(el){ // shrink text to fit box width
  var fs=100;el.style.fontSize=el.dataset.fs?(2.6*el.dataset.fs)+'cqw':'';
  var base=parseFloat(getComputedStyle(el).fontSize);
  if(el.classList.contains('ml'))return;while(el.scrollWidth>el.clientWidth+2&&fs>70){fs-=5;el.style.fontSize=(base*fs/100)+'px'}
}
function render(){
  var P=BOOK[cur];if(!P)return;
  var img=$('#pimg');img.src=P.img;img.alt='Página '+P.n;
  $('#page').style.aspectRatio=(1/P.ar).toFixed(4);
  var ov=$('#ov');ov.innerHTML='';
  P.hs.forEach(function(h){var d=document.createElement('div');d.className='hs';d.style.cssText=pct(h.b);d.title=h.t;
    d.onclick=function(){speak(h.t,d)};ov.appendChild(d)});
  var saved=answers[P.n]||{};
  P.items.forEach(function(it,i){
    var a=document.createElement('div');a.className='ans'+(it.kind==='voc'?' voc':'')+(it.kind&&/^(note|sent|mean|comp|month)$/.test(it.kind)?' k-'+it.kind:'')+(it.center?' ctr':'')+(it.u?' u':'')+(it.a.indexOf('\n')>=0?' ml':'');a.style.cssText=pct(it.b);
    if(it.fs){a.dataset.fs=it.fs;a.style.fontSize=(2.6*it.fs)+'cqw'}
    a.innerHTML=(it.m&&!it.nl?'<span class="ej">ej.</span>':'')+esc(it.a)+(it.u?'<span class="unc">?</span>':'');
    a.onclick=function(e){e.stopPropagation();speak(it.say||it.a,a)};ov.appendChild(a);
    if(practice&&!it.np){
      var w=document.createElement('div');w.className='inp'+(it.kind==='voc'?' voc':'');w.dataset.i=i;w.style.cssText=pct(it.b);if(it.fs)w.style.setProperty('--fs',it.fs);
      var inp=document.createElement('input');inp.type='text';inp.autocomplete='off';inp.autocapitalize='off';inp.spellcheck=false;
      inp.placeholder=it.m?'(libre)':'';inp.value=saved[i]||'';
      inp.oninput=function(){var s=answers[P.n]=answers[P.n]||{};s[i]=inp.value;save('answers',answers);w.classList.remove('ok','bad');var so=w.querySelector('.sol');if(so)so.remove()};
      inp.onkeydown=function(e){if(e.key==='Enter'){checkOne(it,w,inp,true)}};
      w.appendChild(inp);
      var hb=document.createElement('button');hb.className='hint';hb.innerHTML='<svg class=sk aria-hidden=true><use href=#i-bulb></use></svg>';hb.title='Ver respuesta';
      hb.onclick=function(e){e.stopPropagation();showSol(w,it)};w.appendChild(hb);
      ov.appendChild(w);
    }
  });
  if(!practice)requestAnimationFrame(function(){ov.querySelectorAll('.ans').forEach(fit)});
  var lbl=P.lesson?('Lección '+P.lesson):(P.n<4?'Inicio':'Apéndice');
  $('#lesLbl').textContent=lbl;
  $('#pnum').textContent='Pág. '+(P.pp!=null?P.pp:'–')+' · '+(cur+1)+'/'+BOOK.length;
  $('#bListen').hidden=!P.text;
  $('#bCheck').hidden=!(practice&&P.items.some(function(x){return !x.np}));
  $('#bPrev').disabled=cur===0;$('#bNext').disabled=cur===BOOK.length-1;
  save('page',cur);
  if(P.lesson){try{localStorage.setItem('ql_app_leccion_v1',String(P.lesson))}catch(e){}if(window.parent!==window)try{parent.postMessage({ql:'lesson',n:P.lesson,from:'libro'},'*')}catch(e){}}
  [cur-1,cur+1].forEach(function(j){if(BOOK[j]){var im=new Image();im.src=BOOK[j].img}});
  document.querySelectorAll('#lesList button').forEach(function(b){b.classList.toggle('cur',+b.dataset.l===P.lesson)});
}
function esc(s){return String(s).replace(/[&<>]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;'}[c]})}
function showSol(w,it){var so=w.querySelector('.sol');if(so){so.remove();return}so=document.createElement('div');so.className='sol';so.style.color='#1546c9';so.style.borderColor='#1546c9';
  so.textContent=(it.m?'Ejemplo: ':'')+it.alt.join(' / ')+(it.u?' (?)':'');w.appendChild(so);speak(it.say||it.a)}
function checkOne(it,w,inp,sp){
  var v=norm(inp.value);w.classList.remove('ok','bad');var so=w.querySelector('.sol');if(so)so.remove();
  if(!v)return null;
  if(it.m){showSol(w,it);return null}
  var ok=it.alt.some(function(a){return norm(a)===v});
  w.classList.add(ok?'ok':'bad');
  if(!ok){so=document.createElement('div');so.className='sol';so.innerHTML='<svg class=sk aria-hidden=true><use href=#i-check></use></svg>'+' '+esc(it.alt.join(' / '));w.appendChild(so)}
  if(sp)speak(it.say||it.a);
  return ok;
}
function checkPage(){
  var P=BOOK[cur],ok=0,bad=0,empty=0;
  P.items.forEach(function(it,i){var w=document.querySelector('#ov .inp[data-i="'+i+'"]');if(!w)return;var r=checkOne(it,w,w.querySelector('input'),false);if(r===true)ok++;else if(r===false)bad++;else if(!it.m)empty++});
  var st=load('score',{});st[P.n]={ok:ok,bad:bad,t:Date.now()};save('score',st);
  toast(ok+' bien · '+bad+' por corregir'+(empty?' · '+empty+' vacías':''),3500);
}
function go(i){if(i<0||i>=BOOK.length)return;if(synth)synth.cancel();listening=false;$('#bListen').classList.remove('on');$('#bListen').innerHTML='<svg class=sk aria-hidden=true><use href=#i-player-play></use></svg>'+' Escuchar página';cur=i;render();window.scrollTo(0,0)}
/* listen page */
var listening=false;
function listenPage(){
  var P=BOOK[cur];var b=$('#bListen');
  if(listening){synth.cancel();listening=false;b.classList.remove('on');b.innerHTML='<svg class=sk aria-hidden=true><use href=#i-player-play></use></svg>'+' Escuchar página';return}
  var parts=P.text.match(/[^.!?]+[.!?]*["”]?/g)||[P.text];var k=0;listening=true;b.classList.add('on');b.innerHTML='<svg class=sk aria-hidden=true><use href=#i-player-stop></use></svg>'+' Detener';
  (function next(){if(!listening||k>=parts.length){listening=false;b.classList.remove('on');b.innerHTML='<svg class=sk aria-hidden=true><use href=#i-player-play></use></svg>'+' Escuchar página';return}
    var s=parts[k++].trim();if(!s)return next();
    var hit=null,ns=norm(s).slice(0,25);document.querySelectorAll('#ov .hs').forEach(function(h){if(!hit&&ns.length>5&&norm(h.title).indexOf(ns.slice(0,15))>=0)hit=h});
    speak(s,hit,next)})();
}
/* swipe */
var sx=0,sy=0,st=0,multi=false;
$('#stage').addEventListener('touchstart',function(e){multi=e.touches.length>1;sx=e.touches[0].clientX;sy=e.touches[0].clientY;st=Date.now()},{passive:true});
$('#stage').addEventListener('touchend',function(e){
  if(multi||(window.visualViewport&&visualViewport.scale>1.05))return;
  var t=e.changedTouches[0],dx=t.clientX-sx,dy=t.clientY-sy;
  if(Math.abs(dx)>70&&Math.abs(dx)>2*Math.abs(dy)&&Date.now()-st<700){go(cur+(dx<0?1:-1))}
},{passive:true});
document.addEventListener('keydown',function(e){if(e.target.tagName==='INPUT')return;if(e.key==='ArrowRight')go(cur+1);if(e.key==='ArrowLeft')go(cur-1)});
/* ui */
function setMode(p){practice=p;save('practice',p);document.body.classList.toggle('practice',p);$('#bMode').innerHTML=p?'<svg class=sk aria-hidden=true><use href=#i-eye></use></svg>'+' Ver respuestas':'<svg class=sk aria-hidden=true><use href=#i-pencil></use></svg>'+' Practicar';render()}
$('#bMode').onclick=function(){setMode(!practice);toast(practice?'Modo práctica: escribe y toca Revisar':'Mostrando respuestas')};
$('#bPrev').onclick=function(){go(cur-1)};$('#bNext').onclick=function(){go(cur+1)};
$('#bListen').onclick=listenPage;$('#bCheck').onclick=checkPage;
$('#bIdx').onclick=function(){$('#drawer').hidden=false};$('#bSet').onclick=function(){$('#settings').hidden=false};
document.querySelectorAll('[data-close]').forEach(function(b){b.onclick=function(){b.closest('aside').hidden=true}});
$('#voiceSel').onchange=function(){voice=voices.filter(function(v){return v.name===$('#voiceSel').value})[0]||voice;save('voice',voice?voice.name:'');try{if(voice)localStorage.setItem('ql_guia_voice_v2',voice.name+'|'+voice.lang)}catch(e){}};
$('#slow').checked=load('slow',false);$('#slow').onchange=function(){save('slow',$('#slow').checked)};
$('#testV').onclick=function(){speak('Hello! Robert said that he would visit New York.')};
$('#resetP').onclick=function(){if(confirm('¿Borrar todas tus respuestas guardadas?')){answers={};save('answers',answers);render()}};
$('#gotoB').onclick=function(){var n=+$('#gotoIn').value;if(n>=1&&n<=81){go(n-1);$('#drawer').hidden=true}};
function buildIdx(){var L=$('#lesList');L.innerHTML='';
  var mk=function(lbl,title,p,l){var b=document.createElement('button');b.dataset.l=l||'';b.innerHTML='<b>'+lbl+'</b><span>'+esc(title)+'<br><small>pág. '+(BOOK[p-1].pp||'–')+'</small></span>';b.onclick=function(){go(p-1);$('#drawer').hidden=true};L.appendChild(b)};
  mk('<svg class=sk aria-hidden=true><use href=#i-book></use></svg>','Portada',1);
  LES.forEach(function(l){mk(l.n,l.t||('Lección '+l.n),l.p,l.n)});
  mk('<svg class=sk aria-hidden=true><use href=#i-clipboard-list></use></svg>','Lista de acciones irregulares',78);
}
Promise.all([fetch('book.json?v=b228d70bf9').then(function(r){return r.json()}),fetch('lessons.json?v=b228d70bf9').then(function(r){return r.json()})]).then(function(r){
  BOOK=r[0];LES=r[1];buildIdx();
  var h=location.hash.match(/p(\d+)/);cur=h?Math.min(80,Math.max(0,+h[1]-1)):load('page',0);
  document.body.classList.toggle('practice',practice);$('#bMode').innerHTML=practice?'<svg class=sk aria-hidden=true><use href=#i-eye></use></svg>'+' Ver respuestas':'<svg class=sk aria-hidden=true><use href=#i-pencil></use></svg>'+' Practicar';
  try{var want=+localStorage.getItem('ql_app_leccion_v1');if(window.parent!==window&&want&&!h&&!(BOOK[cur]&&BOOK[cur].lesson===want)){var lw=LES.filter(function(x){return x.n===want})[0];if(lw)cur=lw.p-1}}catch(e){}
  render();
}).catch(function(e){toast('Error cargando el libro: '+e)});
window.addEventListener('resize',function(){if(!practice)document.querySelectorAll('#ov .ans').forEach(fit)});
function goLesson(n){n=+n;var P=BOOK[cur];if(!BOOK.length||(P&&P.lesson===n))return;var l=LES.filter(function(x){return x.n===n})[0];if(l)go(l.p-1)}
window.__libro={go:go,goLesson:goLesson,get cur(){return cur},get lesson(){return BOOK[cur]&&BOOK[cur].lesson},get ready(){return BOOK.length>0},setMode:setMode,stop:function(){if(synth)synth.cancel();listening=false}};
})();
