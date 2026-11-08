/* Единые листаемые ленты N7.
   Один и тот же компонент на всех страницах: услуги, продукция, проекты,
   этапы, списки, преимущества. Листание ТОЛЬКО по действию пользователя —
   стрелки, свайп, клавиатура. Автоплей и бегущие строки отсутствуют.
   Карточки показываются целиком: 3 на широком экране, 2 на планшете,
   1 на телефоне — без «обрубков» соседних блоков. */
(function(){
'use strict';
var d=document,w=window;
var $=function(s,c){return (c||d).querySelector(s)};
var $$=function(s,c){return Array.prototype.slice.call((c||d).querySelectorAll(s))};
var reduce=false;try{reduce=w.matchMedia('(prefers-reduced-motion: reduce)').matches}catch(e){}
var all=[];

/* Слайды презентации листаются своим deck.js — сюда не попадают. */
function skip(box){
  if(box.closest('#deck')||box.closest('.slide'))return true;
  if(box.id==='catalog'||box.closest('#catalog'))return true;
  if(box.classList.contains('cat')||box.querySelector('.lcard'))return true;
  /* Каталог покрытий (#catalog, 13 SKU с фильтрами) остаётся сеткой;
     остальные ленты, включая проекты с фильтрами, листаются одинаково. */
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
  w.addEventListener('resize',update);
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

function updateAll(){all.forEach(function(f){f()})}
function boot(){
  if($('#deck'))return;                          /* презентация листается сама */
  groupSrows();
  $$('.grid.bento, .pcats, .grid:not(.cat):not(.bento):not(.lgrid), ol.steps, ul.tl, .why .g, .n7rail-group')
    .forEach(rail);
  /* фильтры скрывают карточки — пересчитываем счётчики после клика */
  d.addEventListener('click',function(e){
    if(e.target&&e.target.closest&&e.target.closest('.filters'))setTimeout(updateAll,80);
  });
  w.addEventListener('load',updateAll,{once:true});
  w.addEventListener('resize',updateAll);
}
if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',boot);else boot();
})();
