/* ==========================================================================
   N7 v2 «СТАЛЬ» — лёгкая моторика страницы.
   Никаких библиотек, параллакса, магнитных кнопок и разбиения заголовков
   на слова: только появляющиеся блоки, счётчики и тонкая полоса прогресса.
   Полностью отключается при prefers-reduced-motion и в jsdom.
   ========================================================================== */
(function(){
'use strict';
var d=document,r=d.documentElement;
var $$=function(s,c){return Array.prototype.slice.call((c||d).querySelectorAll(s))};
var rm=false;try{rm=matchMedia('(prefers-reduced-motion: reduce)').matches}catch(e){}

/* Полоса прогресса чтения */
var pb=d.createElement('div');pb.className='pb';pb.setAttribute('aria-hidden','true');
if(d.body)d.body.appendChild(pb);
function up(){
  var max=Math.max(1,r.scrollHeight-innerHeight);
  pb.style.transform='scaleX('+Math.min(1,Math.max(0,(scrollY||0)/max))+')';
}
if(!rm){addEventListener('scroll',up,{passive:true});addEventListener('resize',up,{passive:true});up()}

/* Появление блоков: observer добавляет .in, CSS в n7-bold.css делает остальное */
if(!rm&&typeof IntersectionObserver==='function'){
  r.classList.add('v2-fx');
  var io=new IntersectionObserver(function(es){
    es.forEach(function(e){
      if(!e.isIntersecting)return;
      e.target.classList.add('in');
      io.unobserve(e.target);
      if(e.target._c)e.target._c();
    });
  },{threshold:.12,rootMargin:'0px 0px -6% 0px'});
  $$('.v2-rise,.v2-card,.pcat,.svc-card,figure,ol.steps li,.stats>div,.fmt>div,.two>div,.info,.v2-panel')
    .forEach(function(el,i){
      if(el.closest('.deck')||el.closest('.lb'))return;
      el.style.setProperty('--d',(i%6*70)+'ms');
      el.classList.add('rv');
      io.observe(el);
    });
  /* Счётчики: только явно размеченные data-count, текст «20+» не трогаем */
  $$('[data-count]').forEach(function(el){
    var n=parseInt(el.getAttribute('data-count'),10);
    if(!isFinite(n)||el.closest('.deck'))return;
    var a=el.getAttribute('data-prefix')||'',b=el.getAttribute('data-suffix')||'';
    el._c=function(){
      var t0=performance.now();
      (function tick(t){
        var k=Math.min(1,(t-t0)/1100),v=Math.round(n*(1-Math.pow(1-k,3)));
        el.textContent=a+v.toLocaleString('ru-RU')+b;
        if(k<1)requestAnimationFrame(tick);
      })(t0);
    };
    io.observe(el);
  });
}
})();
