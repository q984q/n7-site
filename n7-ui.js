/* Интерфейс N7: оглавление с прогрессом, диммер освещения, сравнение покрытий,
  Before/After «свет выключен / включён», быстрый вход в квиз, микро-фидбек полей. */
(function(){
'use strict';
var d=document,w=window;
var $=function(s,c){return (c||d).querySelector(s)};
var $$=function(s,c){return Array.prototype.slice.call((c||d).querySelectorAll(s))};
var reduce=false;try{reduce=matchMedia('(prefers-reduced-motion: reduce)').matches}catch(e){}
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function toast(m){if(w.n7Toast)w.n7Toast(m)}
function slug(s){
 var map={'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'e','ж':'zh','з':'z','и':'i','й':'y','к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r','с':'s','т':'t','у':'u','ф':'f','х':'h','ц':'c','ч':'ch','ш':'sh','щ':'sch','ъ':'','ы':'y','ь':'','э':'e','ю':'yu','я':'ya'};
 return String(s).toLowerCase().replace(/[а-яё]/g,function(c){return map[c]||''}).replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,42)||'section';
}

/* ---------- 1. Панель управления страницей: разделы + прогресс + быстрые действия ---------- */
/* Единая на всех 18 страницах: одинаковая разметка, заголовок, прогресс и набор кнопок. */
function toc(){
 var main=$('main')||d.body;
 var secs=$$('section',main).filter(function(s){return $('h2',s)});
 var items=secs.map(function(s,i){
  var h=$('h2',s),t=h.getAttribute('aria-label')||h.textContent;
  if(!s.id)s.id='sec-'+(i+1)+'-'+slug(t);
  return {href:'#'+esc(s.id),text:t};
 });
 /* на коротких страницах та же панель, но вместо пустого оглавления — навигация по сайту */
 var site=items.length<3;
 if(site){
  items=[['index.html','Главная'],['o-kompanii.html','О компании'],['uslugi.html','Услуги'],
   ['sportivnye-pokrytiya.html','Покрытия'],['osveshhenie.html','Освещение'],['proekty.html','Проекты'],
   ['sotrudnichestvo.html','Сотрудничество'],['geografiya.html','География'],
   ['prezentatsiya.html','Презентация'],['kontakty.html','Контакты']]
   .map(function(a){return {href:a[0],text:a[1]}});
 }
 var el=d.createElement('nav');el.className='toc n7panel';
 el.setAttribute('aria-label','Панель управления страницей');
 el.innerHTML='<div class="tp"><b>Управление</b><span id="tocNow">'+(site?'Сайт':'1 / '+items.length)+'</span></div>'+
  '<ol>'+items.map(function(x,i){
   return '<li><a href="'+x.href+'"'+(site?'':' data-i="'+i+'"'+(i===0?' class="on"':''))+
    '><span>'+esc(x.text.length>19?x.text.slice(0,18)+'…':x.text)+'</span></a></li>';
  }).join('')+'</ol>'+
  '<div class="tc-acts">'+
   '<button type="button" data-act="quiz"><span aria-hidden="true">✦</span> Подобрать за 60 сек</button>'+
   '<button type="button" data-act="search"><span aria-hidden="true">⌕</span> Поиск по сайту</button>'+
   '<button type="button" data-act="list"><span aria-hidden="true">☰</span> Лист подбора</button>'+
   '<a class="tc-go" href="kontakty.html">Получить расчёт →</a>'+
  '</div>';
 d.body.appendChild(el);

 var links=$$('.toc ol a[data-i]'),now=$('#tocNow');
 function set(i){links.forEach(function(a,k){a.classList.toggle('on',k===i)});if(now&&links.length)now.textContent=(i+1)+' / '+links.length}
 links.forEach(function(a){a.onclick=function(){set(parseInt(a.getAttribute('data-i'),10))}});
 if(!site&&typeof w.IntersectionObserver==='function'){
  var io=new IntersectionObserver(function(es){es.forEach(function(e){
   if(e.isIntersecting){var i=secs.indexOf(e.target);if(i>=0)set(i)}
  })},{rootMargin:'-25% 0px -65% 0px'});
  secs.forEach(function(s){io.observe(s)});
 }
 $$('.tc-acts button',el).forEach(function(btn){
  btn.onclick=function(){
   var a=btn.getAttribute('data-act');
   if(a==='search'){if(w.n7Search)w.n7Search.open();else location.href='index.html?q='}
   else if(a==='list'){if(w.n7List)w.n7List.open()}
   else if(a==='quiz'){
    if($('#quiz')&&w.n7Quiz)w.n7Quiz.open();
    else location.href='sportivnye-pokrytiya.html#quiz';
   }
  };
 });
}

/* ---------- 2. Диммер освещения ---------- */
function dimmer(){
 var grid=$('#lgrid');if(!grid)return;
 var wrap=d.createElement('div');wrap.className='dimmer';
 wrap.innerHTML='<div class="dim-t"><b>Яркость площадки</b><span id="dimLab">Класс II · соревнования</span></div>'+
  '<input type="range" id="dimRange" min="0" max="2" step="1" value="1" aria-label="Класс освещённости">'+
  '<div class="dl"><span>Тренировки · III</span><span>Соревнования · II</span><span>ТВ и топ-уровень · I</span></div>';
 grid.parentNode.insertBefore(wrap,grid);
 var lab=['Класс III · тренировки','Класс II · соревнования','Класс I · высокий уровень и ТВ'];
 var r=$('#dimRange',wrap);
 r.addEventListener('input',function(){
  var v=parseInt(r.value,10);
  grid.style.setProperty('--dim',[.62,.88,1.12][v]);
  $('#dimLab',wrap).textContent=lab[v];
  var sel=$('#lo-class');if(sel){sel.value=String(v);sel.dispatchEvent(new Event('change',{bubbles:true}))}
 });
 grid.style.setProperty('--dim',.88);
}

/* ---------- 3. Before/After: свет выключен / включён ---------- */
function beforeAfter(){
 var slot=$('#ba-slot');if(!slot)return;
 slot.innerHTML='<div class="ba-wrap"><h3>Площадка без освещения и с освещением</h3>'+
  '<p class="intro">Потяните ползунок: слева — та же площадка при выключенном свете, справа — при рабочем освещении. Так видно, что даёт правильно рассчитанный свет.</p>'+
  '<div class="ba" id="ba" tabindex="0" role="slider" aria-valuemin="0" aria-valuemax="100" aria-valuenow="52" aria-label="Сравнение: без освещения и с освещением">'+
  '<img class="ba-img" src="img/sections/padel-court.webp" alt="Падел-корт с включённым освещением" loading="lazy" decoding="async">'+
  '<img class="ba-img ba-dark" src="img/sections/padel-court.webp" alt="" aria-hidden="true" loading="lazy" decoding="async">'+
  '<span class="ba-lbl l">Без освещения</span><span class="ba-lbl r">С освещением</span>'+
  '<span class="ba-handle" aria-hidden="true"></span></div>'+
  '<p class="tnote">Иллюстрация: затемнение той же фотографии корта, а не снимки реального объекта до и после работ. Параметры освещения подтверждаются светотехническим расчётом.</p></div>';
 var box=$('#ba',slot),pos=52,drag=false;
 function set(v){pos=Math.max(2,Math.min(98,v));box.style.setProperty('--pos',pos+'%');box.setAttribute('aria-valuenow',Math.round(pos))}
 function from(e){var r=box.getBoundingClientRect();set((e.clientX-r.left)/r.width*100)}
 box.addEventListener('pointerdown',function(e){drag=true;box.setPointerCapture&&box.setPointerCapture(e.pointerId);from(e)});
 box.addEventListener('pointermove',function(e){if(drag)from(e)});
 box.addEventListener('pointerup',function(){drag=false});
 box.addEventListener('pointercancel',function(){drag=false});
 box.addEventListener('keydown',function(e){if(e.key==='ArrowLeft'){set(pos-4);e.preventDefault()}else if(e.key==='ArrowRight'){set(pos+4);e.preventDefault()}});
 set(pos);
}

/* ---------- 4. Сравнение покрытий ---------- */
var sel=[];
function cardData(c){
 return {
  art:(($('.art',c)||{}).textContent||'').trim(),
  name:(($('b',c)||{}).textContent||'').trim(),
  badge:(($('.badge',c)||{}).textContent||'').trim(),
  specs:$$('.pspec li',c).map(function(x){return x.textContent.trim()}),
  el:c
 };
}
function cmpBar(){
 var el=d.createElement('div');el.className='cmpbar';el.id='cmpbar';el.hidden=true;
 el.innerHTML='<b id="cmpN">0</b><span>выбрано для сравнения</span><button type="button" class="btn" id="cmpGo">Сравнить</button><button type="button" class="ib" id="cmpClr">Сбросить</button>';
 d.body.appendChild(el);
 $('#cmpGo',el).onclick=openCmp;
 $('#cmpClr',el).onclick=function(){sel=[];sync()};
}
function sync(){
 var bar=$('#cmpbar');if(!bar)return;
 bar.hidden=!sel.length;$('#cmpN',bar).textContent=sel.length;
 $$('#catalog.grid.pcard').forEach(function(c){var b=$('.addcmp',c);if(b){b.classList.toggle('on',sel.indexOf(c)>=0);b.textContent=sel.indexOf(c)>=0?'✓ В сравнении':'Сравнить'}});
}
function toggle(c){
 var i=sel.indexOf(c);
 if(i>=0)sel.splice(i,1);
 else{if(sel.length>=3){sel.shift();toast('Сравниваем не больше трёх позиций — убрали первую')}sel.push(c)}
 sync();
}
function openCmp(){
 if(sel.length<2){toast('Выберите хотя бы две позиции');return}
 var data=sel.map(cardData),max=Math.max.apply(null,data.map(function(x){return x.specs.length}));
 var rows=[['Артикул',function(x){return x.art}],['Покрытие',function(x){return x.name}],['Отметка',function(x){return x.badge}]];
 for(var i=0;i<max;i++){(function(k){rows.push(['Характеристика '+(k+1),function(x){return x.specs[k]||'—'}])})(i)}
 var html='<div class="cmp" id="cmp" role="dialog" aria-modal="true" aria-label="Сравнение покрытий"><div class="cmp-in">'+
  '<div class="cmp-h"><b>Сравнение покрытий</b><button type="button" class="ib cmp-x" aria-label="Закрыть">×</button></div>'+
  '<div class="tw"><table class="tbl"><thead><tr><th scope="col">Параметр</th>'+data.map(function(x){return '<th scope="col">'+esc(x.name)+'</th>'}).join('')+'</tr></thead><tbody>'+
  rows.map(function(r){return '<tr><td>'+esc(r[0])+'</td>'+data.map(function(x){return '<td>'+esc(r[1](x))+'</td>'}).join('')+'</tr>'}).join('')+'</tbody></table></div>'+
  '<div class="fbtns"><button type="button" class="btn" id="cmpList">Добавить все в лист подбора</button><button type="button" class="ib" id="cmpPrint">Печать</button></div>'+
  '<p class="tnote">Наличие, минимальная партия и совместимость с основанием уточняются при расчёте.</p></div></div>';
 var host=d.createElement('div');host.innerHTML=html;var modal=host.firstChild;d.body.appendChild(modal);
 $('.cmp-x',modal).onclick=function(){modal.remove()};
 modal.addEventListener('click',function(e){if(e.target===modal)modal.remove()});
 $('#cmpList',modal).onclick=function(){if(w.n7List)data.forEach(function(x,i){w.n7List.add({id:'sku:'+x.art,title:x.name,text:'Позиция каталога: '+x.name+' ('+x.art+')\n'+x.specs.join('\n')+'\nЦена по запросу'})});modal.remove()};
 $('#cmpPrint',modal).onclick=function(){w.print()};
 d.addEventListener('keydown',function esc(e){if(e.key==='Escape'){modal.remove();d.removeEventListener('keydown',esc)}});
}
w.n7Compare={toggle:toggle};

/* ---------- 5. Быстрый вход в квиз + микро-фидбек полей ---------- */
function extras(){
 /* быстрый вход в квиз теперь живёт в единой панели.tc-acts и в dock — дубль не нужен */
 $$('#lead input,#lead textarea,#lead select').forEach(function(el){
  el.addEventListener('input',function(){
   var ok=el.type==='checkbox'?el.checked:(el.value||'').trim().length>1;
   el.classList.toggle('field-ok',!!ok);
  });
 });
}
/* Подпись к усечённому тексту в select: полное значение видно по наведению */
function selectTitles(){
  $$('select').forEach(function(s){
    function set(){try{var o=s.options[s.selectedIndex];s.title=o?o.text:''}catch(e){}}
    set();s.addEventListener('change',set);
  });
}
function boot(){toc();dimmer();beforeAfter();cmpBar();sync();extras();selectTitles()}
if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',boot);else boot();
})();
