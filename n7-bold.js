/* ==========================================================================
   N7 BOLD — интерактив редизайна. Без библиотек, без внешних запросов.
   Дополняет fx.js (reveal / счётчики / магнитные кнопки уже есть там):
   здесь — бегущая строка, курсор-кольцо, параллакс, форма из 3 полей.
   Всё тяжёлое отключается при prefers-reduced-motion и на тач-устройствах.
   ========================================================================== */
(function(){
'use strict';
var d=document,r=d.documentElement,w=window;
var $=function(s,c){return (c||d).querySelector(s)};
var $$=function(s,c){return Array.prototype.slice.call((c||d).querySelectorAll(s))};
var RM=false,FINE=false,WIDE=innerWidth>760;
try{RM=matchMedia('(prefers-reduced-motion: reduce)').matches}catch(e){}
try{FINE=matchMedia('(hover:hover) and (pointer:fine)').matches}catch(e){}

/* ---------- 1. Бегущая строка: дублируем группу для бесшовного цикла ---------- */
$$('.n7-marquee-track').forEach(function(track){
  var g=track.querySelector('.n7-marquee-group');
  if(!g)return;
  var clone=g.cloneNode(true);
  clone.setAttribute('aria-hidden','true');
  track.appendChild(clone);
});

/* ---------- 2. Кастомный курсор-кольцо (нативный курсор остаётся) ---------- */
if(FINE&&WIDE&&!RM&&!$('#n7Cursor')){
  var cur=d.createElement('div');cur.id='n7Cursor';cur.className='n7-cursor';
  cur.setAttribute('aria-hidden','true');d.body.appendChild(cur);
  var cx=0,cy=0,tx=0,ty=0,raf=0;
  function tick(){
    cx+=(tx-cx)*.22;cy+=(ty-cy)*.22;
    cur.style.transform='translate3d('+cx.toFixed(1)+'px,'+cy.toFixed(1)+'px,0)';
    if(Math.abs(tx-cx)>.4||Math.abs(ty-cy)>.4)raf=requestAnimationFrame(tick);else raf=0;
  }
  d.addEventListener('pointermove',function(e){
    if(e.pointerType!=='mouse')return;
    tx=e.clientX;ty=e.clientY;cur.classList.add('on');
    if(!raf)raf=requestAnimationFrame(tick);
  },{passive:true});
  d.addEventListener('pointerover',function(e){
    var t=e.target;
    if(t&&t.closest&&t.closest('a,button,input,select,textarea,[role="button"]'))cur.classList.add('big');
  },{passive:true});
  d.addEventListener('pointerout',function(e){
    var t=e.target;
    if(t&&t.closest&&t.closest('a,button,input,select,textarea,[role="button"]'))cur.classList.remove('big');
  },{passive:true});
  d.addEventListener('pointerleave',function(){cur.classList.remove('on')});
}

/* ---------- 3. Лёгкий параллакс объектных фото ---------- */
var px=[],hero=$('.n7-hero .hero-photo')||$('.hero-photo');
function collect(){
  px=$$('img[data-n7-parallax]').filter(function(img){
    if(innerWidth<=760||RM)return false;
    if(img.closest('.n7rail,.deck,.tbl'))return false;
    var p=img.parentElement;if(!p)return false;
    p.classList.add('n7-parallax');
    img.style.setProperty('--n7py','0px');
    return true;
  });
}
var praf=0;
function parallax(){
  praf=0;
  var h=innerHeight;
  px.forEach(function(img){
    var b=img.parentElement.getBoundingClientRect();
    if(b.bottom<0||b.top>h)return;
    var y=Math.max(-18,Math.min(18,((b.top+b.height/2-h/2)/h)*-26));
    img.style.setProperty('--n7py',y.toFixed(1)+'px');
  });
  if(hero&&!RM&&innerWidth>760){
    var hb=hero.getBoundingClientRect();
    if(hb.bottom>0&&hb.top<h){
      var hy=Math.max(-26,Math.min(26,((hb.top+hb.height/2-h/2)/h)*-18));
      hero.style.transform='translate3d(0,'+hy.toFixed(1)+'px,0) scale(1.06)';
    }
  }
}
function onScroll(){if(!praf)praf=requestAnimationFrame(parallax)}
if(!RM&&WIDE){collect();addEventListener('scroll',onScroll,{passive:true});
  addEventListener('resize',function(){collect();onScroll()},{passive:true});onScroll()}

/* Панель управления: не мешает первому экрану, появляется после прокрутки */
var tocRaf=0;
function tocReveal(){tocRaf=0;var y=scrollY||d.documentElement.scrollTop||0;
  d.body.classList.toggle('n7-scrolled',y>innerHeight*.65)}
addEventListener('scroll',function(){if(!tocRaf)tocRaf=requestAnimationFrame(tocReveal)},{passive:true});
addEventListener('resize',tocReveal,{passive:true});tocReveal();

/* ---------- 4. Форма из 3 полей: endpoint или честный WhatsApp-fallback ---------- */
var f=$('#n7Quick'),st=$('#q-status');
if(f){
  var WA='77778848818';
  var TEL1='+7 (777) 884-88-18',TEL2='+7 (747) 534-40-14';
  var ENDPOINT=String((w.N7_LEAD_ENDPOINT||'')||(f.getAttribute('data-endpoint'))||'').trim();
  function val(id){var e=d.getElementById(id);return e?String(e.value||'').trim():''}
  function say(msg,bad){
    if(!st)return;st.hidden=false;st.textContent=msg;
    st.style.color=bad?'var(--err)':'var(--acid)';
  }
  function text(){
    return 'Заявка с сайта N7 Construction\nИмя: '+val('q-name')+
      '\nТелефон: '+val('q-phone')+'\nНаправление: '+val('q-work')+
      '\nСтраница: '+d.title+'\nURL: '+location.href;
  }
  function fallback(){
    var url='https://wa.me/'+WA+'?text='+encodeURIComponent(text());
    say('Заявка подготовлена. Отправьте её в WhatsApp или позвоните: '+TEL1+', '+TEL2+'.');
    if(st){
      var a=d.createElement('a');a.className='more';a.href=url;a.target='_blank';a.rel='noopener';
      a.textContent='Открыть WhatsApp →';a.style.marginLeft='10px';st.appendChild(a);
    }
    try{w.open(url,'_blank','noopener')}catch(e){}
  }
  f.addEventListener('submit',function(e){
    e.preventDefault();if(st)st.textContent='';
    var name=val('q-name'),phone=val('q-phone').replace(/\D/g,''),work=val('q-work');
    var agree=d.getElementById('q-agree');
    var bad=null;
    if(name.length<2)bad='Введите имя — минимум 2 символа.';
    else if(phone.length<10)bad='Введите телефон — не меньше 10 цифр.';
    else if(!work)bad='Выберите направление.';
    else if(agree&&!agree.checked)bad='Нужно согласие на обработку данных.';
    if(bad){say(bad,true);(name.length<2?$('#q-name'):phone.length<10?$('#q-phone'):!work?$('#q-work'):agree).focus();return}
    var btn=f.querySelector('button[type="submit"]');if(btn)btn.disabled=true;
    if(!ENDPOINT){if(btn)btn.disabled=false;fallback();return}
    var payload={name:name,phone:val('q-phone'),work:work,msg:'',page:d.title,
      url:location.href,text:text(),ts:new Date().toISOString()};
    fetch(ENDPOINT,{method:'POST',body:JSON.stringify(payload),
      headers:{'Content-Type':'application/json',Accept:'application/json'}})
      .then(function(x){if(!x.ok)throw 0;return x.json()})
      .then(function(j){if(!j||j.ok===false)throw 0;f.reset();say('Заявка отправлена. Мы свяжемся с вами.')})
      .catch(function(){fallback()})
      .then(function(){if(btn)btn.disabled=false});
  });
}
})();
