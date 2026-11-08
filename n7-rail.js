/* Листаемые ленты ТОЛЬКО на телефоне (≤ 760 px).
   На ПК и планшете сохраняется исходная статичная сетка сайта — как была:
   без стрелок, счётчиков и сужения карточек. Один и тот же компонент на всех
   страницах, поэтому на телефоне поведение везде одинаковое.
   Листание — только по действию пользователя: стрелки, свайп, клавиши ← →.
   Карточки видны целиком (1 на телефоне), без обрезанных «хвостов». */
(function(){
'use strict';
var d=document,w=window;
var $=function(s,c){return (c||d).querySelector(s)};
var $$=function(s,c){return Array.prototype.slice.call((c||d).querySelectorAll(s))};
var reduce=false;try{reduce=w.matchMedia('(prefers-reduced-motion: reduce)').matches}catch(e){}
var MQ='(max-width:760px)',mq=null;
try{mq=w.matchMedia(MQ)}catch(e){}
function mobile(){return mq?mq.matches:(w.innerWidth||1024)<=760}
var all=[],inited=false,bound=false;

/* Слайды презентации листаются своим deck.js — сюда не попадают. */
function skip(box){
  if(box.closest('#deck')||box.closest('.slide'))return true;
  if(box.id==='catalog'||box.closest('#catalog'))return true;
  if(box.classList.contains('cat')||box.querySelector('.lcard'))return true;
  /* Каталог покрытий (#catalog, 13 SKU с фильтрами) остаётся сеткой. */
  return false;
}
function name(box){
  var sec=box.closest('section'),h=sec&&$('h2',sec);
  return h?h.textContent.replace(/\s+/g,' ').trim().slice(0,60):'Блок';
}
function button(txt,aria){
  var b=d.createElement('button');b.type='button';b.className='n7rail-'+(txt==='←'?'prev':'next');
  b.textContent=txt;b.setAttribute('aria-label',aria);return b;
}
function rail(box){
  if(!box||box.classList.contains('n7rail')||skip(box))return;
  var kids=Array.prototype.slice.call(box.children).filter(function(x){return !x.hidden});
  if(kids.length<3)return;                       /* листать нечего */
  var L=name(box);
  box.classList.add('n7rail');
  box.setAttribute('tabindex','0');
  box.setAttribute('aria-label','Листание: '+L);

  var ui=d.createElement('div');ui.className='n7rail-ui';
  ui.setAttribute('role','group');ui.setAttribute('aria-label','Листание: '+L);
  var prev=button('←','Предыдущий: '+L),next=button('→','Следующий: '+L);
  var num=d.createElement('span');num.className='n7rail-num';num.setAttribute('aria-live','polite');
  ui.appendChild(prev);ui.appendChild(num);ui.appendChild(next);
  if(box.parentNode)box.parentNode.insertBefore(ui,box);

  function gap(){var cs=getComputedStyle(box);return parseFloat(cs.columnGap||cs.gap)||16}
  function visible(){return Array.prototype.slice.call(box.children).filter(function(x){return !x.hidden})}
  function step(){var v=visible()[0]||kids[0];return Math.max(1,v.getBoundingClientRect().width+gap())}
  function update(){
    var n=visible().length,max=Math.max(0,box.scrollWidth-box.clientWidth);
    var i=Math.min(n,Math.max(1,Math.round(box.scrollLeft/step())+1));
    num.textContent=i+' / '+n;
    prev.disabled=box.scrollLeft<=2;
    next.disabled=box.scrollLeft>=max-2||n<2;
  }
  function go(dir){box.scrollBy({left:dir*step(),behavior:reduce?'auto':'smooth'})}
  prev.onclick=function(){go(-1)};
  next.onclick=function(){go(1)};
  box.addEventListener('scroll',update,{passive:true});
  [box,ui].forEach(function(el){el.addEventListener('keydown',function(e){
    if(e.key==='ArrowLeft'){go(-1);e.preventDefault()}
    else if(e.key==='ArrowRight'){go(1);e.preventDefault()}
  })});
  all.push(update);
  update();
  setTimeout(update,350);   /* после подгрузки изображений */
}

/* Соседние блоки услуг на uslugi.html собираем в одну ленту. */
function groupSrows(){
  var rows=$$('.srow');if(rows.length<3)return;
  var p=rows[0].parentNode;if(!p||rows.some(function(r){return r.parentNode!==p}))return;
  var g=d.createElement('div');g.className='n7rail-group';
  p.insertBefore(g,rows[0]);
  rows.forEach(function(r){g.appendChild(r)});
}
/* Полный возврат к исходной разметке при переходе на широкий экран. */
function teardown(){
  $$('.n7rail-ui').forEach(function(u){if(u.parentNode)u.parentNode.removeChild(u)});
  $$('.n7rail').forEach(function(r){
    r.classList.remove('n7rail');r.removeAttribute('tabindex');r.removeAttribute('aria-label');
    try{r.scrollLeft=0}catch(e){}
  });
  $$('.n7rail-group').forEach(function(g){
    var p=g.parentNode;if(!p)return;
    while(g.firstChild)p.insertBefore(g.firstChild,g);
    p.removeChild(g);
  });
  all=[];
}
function updateAll(){all.forEach(function(f){f()})}
function sync(){
  if($('#deck'))return;                          /* презентация листается сама */
  if(mobile()&&!inited){
    groupSrows();
    $$('.grid.bento, .pcats, .grid:not(.cat):not(.bento):not(.lgrid), ol.steps, ul.tl, .why .g, .n7rail-group')
      .forEach(rail);
    inited=true;
  } else if(!mobile()&&inited){
    teardown();inited=false;
  }
  if(!bound){
    bound=true;
    /* фильтры скрывают карточки — пересчитываем счётчики после клика */
    d.addEventListener('click',function(e){
      if(e.target&&e.target.closest&&e.target.closest('.filters'))setTimeout(updateAll,80);
    });
    w.addEventListener('load',updateAll,{once:true});
    w.addEventListener('resize',function(){sync();updateAll()});
    if(mq){
      if(mq.addEventListener)mq.addEventListener('change',sync);
      else if(mq.addListener)mq.addListener(sync);
    } else w.addEventListener('resize',sync);
  }
}
if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',sync);else sync();
})();
