/* ==========================================================================
   N7 v2 «СТАЛЬ» — интерактив без зависимостей.
   Оставляем рабочую форму из 3 полей с отправкой через WhatsApp и панель
   управления, которая не мешает первому экрану. Из v1 убраны заставка,
   кастомный курсор, бегущая строка и параллакс: они belonged к старому
   визуальному языку и ухудшали LCP. Уважаем prefers-reduced-motion.
   ========================================================================== */
(function(){
'use strict';
var d=document,r=d.documentElement,w=window;
var $=function(s,c){return (c||d).querySelector(s)};
var RM=false;try{RM=matchMedia('(prefers-reduced-motion: reduce)').matches}catch(e){}

/* ---------- 1. Панель управления: появляется после первого экрана ---------- */
var tocRaf=0;
function tocReveal(){
  tocRaf=0;
  var y=scrollY||r.scrollTop||0;
  d.body.classList.toggle('n7-scrolled',y>innerHeight*.65);
}
addEventListener('scroll',function(){if(!tocRaf)tocRaf=requestAnimationFrame(tocReveal)},{passive:true});
addEventListener('resize',tocReveal,{passive:true});
tocReveal();

/* ---------- 2. Форма из 3 полей: endpoint или отправка через WhatsApp ---------- */
var f=$('#n7Quick'),st=$('#q-status');
if(f){
  var WA='77778848818';
  var TEL1='+7 (777) 884-88-18',TEL2='+7 (747) 534-40-14';
  var ENDPOINT=String((w.N7_LEAD_ENDPOINT||'')||(f.getAttribute('data-endpoint'))||'').trim();
  function val(id){var e=d.getElementById(id);return e?String(e.value||'').trim():''}
  function say(msg,bad){
    if(!st)return;
    st.hidden=false;st.textContent=msg;
    st.style.color=bad?'var(--err)':'var(--azure-deep)';
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
      a.textContent='Открыть WhatsApp →';st.appendChild(a);
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
