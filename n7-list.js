/* Лист подбора N7: собрать покрытие + корт + освещение в один запрос КП.
   localStorage, ссылка на подбор (?cfg=), печать спецификации, WhatsApp.
   Цен и оплаты нет — это список позиций для менеджера, а не корзина. */
(function(){
'use strict';
var d=document,w=window;
var $=function(s,c){return (c||d).querySelector(s)};
var $$=function(s,c){return Array.prototype.slice.call((c||d).querySelectorAll(s))};
var KEY='n7-list';
var items=[];

function load(){
  try{var raw=localStorage.getItem(KEY);items=raw?JSON.parse(raw):[]}catch(e){items=[]}
  if(!Array.isArray(items))items=[];
}
function save(){try{localStorage.setItem(KEY,JSON.stringify(items))}catch(e){}}
function toast(m){if(w.n7Toast)w.n7Toast(m)}
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}

function badge(){
  $$('.lcount').forEach(function(b){b.textContent=items.length;b.hidden=!items.length});
  var btn=$('#n7ListBtn');if(btn)btn.setAttribute('aria-label','Лист подбора: '+items.length+' позиций');
  var fab=$('#qfabList');if(fab)fab.textContent='Лист подбора · '+items.length;
}
function render(){
  var box=$('#ldList');if(!box)return;
  if(!items.length){box.innerHTML='<p class="ld-empty">Пока пусто. Добавьте покрытие из каталога или результат расчёта — и отправим одним сообщением.</p>'}
  else box.innerHTML=items.map(function(it,i){
    return '<div class="ld-item"><div><b>'+esc(it.title)+'</b><p>'+esc(String(it.text||'').split('\n').slice(1,4).join(' · '))+'</p></div>'+
           '<button type="button" class="ld-x" data-i="'+i+'" aria-label="Убрать '+esc(it.title)+'">×</button></div>';
  }).join('');
  var acts=$('#ldActs');if(acts)acts.hidden=!items.length;
  badge();
}
function add(it){
  if(!it||!it.id)return;
  if(items.some(function(x){return x.id===it.id})){
    items=items.map(function(x){return x.id===it.id?it:x});
    toast('Обновили позицию в листе подбора');
  }else{items.push(it);toast('Добавлено в лист подбора')}
  save();render();open();
}
function remove(i){var t=items[i]?items[i].title:'Позиция';items.splice(i,1);save();render();toast('Убрано: '+t)}
function clear(){items=[];save();render();toast('Лист подбора очищен')}

function drawer(){
  var el=d.createElement('div');el.className='ldrawer';el.id='ldrawer';el.setAttribute('role','dialog');
  el.setAttribute('aria-modal','true');el.setAttribute('aria-label','Лист подбора');el.hidden=true;
  el.innerHTML='<div class="ld-head"><b>Лист подбора</b><button type="button" class="ld-close ib" id="ldCloseFocus" aria-label="Закрыть">×</button></div>'+
    '<p class="ld-sub">Соберите позиции и отправьте один запрос — цены считаем индивидуально, публичного прайса нет.</p>'+
    '<div class="ld-list" id="ldList"></div>'+
    '<div class="ld-acts" id="ldActs"><button type="button" class="btn" id="ldSend">Отправить в WhatsApp</button>'+
    '<div class="fbtns"><button type="button" class="ib" id="ldCopy">Скопировать список</button>'+
    '<button type="button" class="ib" id="ldLink">Ссылка на подбор</button>'+
    '<button type="button" class="ib" id="ldPrint">Спецификация PDF</button>'+
    '<button type="button" class="ib" id="ldClear">Очистить</button></div></div>';
  var panel=d.createElement('div');panel.className='ld-panel';
  while(el.firstChild)panel.appendChild(el.firstChild);
  el.appendChild(panel);
  d.body.appendChild(el);
  $('.ld-close',el).onclick=close;
  el.addEventListener('click',function(e){if(e.target===el)close()});
  $('#ldList',el).addEventListener('click',function(e){
    var b=e.target.closest('.ld-x');if(b)remove(parseInt(b.getAttribute('data-i'),10));
  });
  $('#ldSend',el).onclick=function(){
    if(w.n7Send)w.n7Send('Подбор с сайта N7 Construction\n\n'+items.map(function(it,i){return (i+1)+'. '+it.title+'\n'+(it.text||'')}).join('\n\n────\n\n')+'\n\nПрошу подготовить коммерческое предложение.');
  };
  $('#ldCopy',el).onclick=function(){if(w.n7Copy)w.n7Copy(items.map(function(it,i){return (i+1)+'. '+it.title+'\n'+(it.text||'')}).join('\n\n'),'Список скопирован')};
  $('#ldLink',el).onclick=share;
  $('#ldPrint',el).onclick=printSpec;
  $('#ldClear',el).onclick=clear;
  return el;
}
function open(){var el=$('#ldrawer')||drawer();el.hidden=false;el.classList.add('on');render();
  var f=$('#ldCloseFocus');if(f)f.focus();}
function close(){var el=$('#ldrawer');if(el){el.classList.remove('on');el.hidden=true}}

/* base64url от сырых UTF-8 байт: в 2–3 раза короче, чем encodeURIComponent + btoa */
function enc(s){
  try{
    if(typeof TextEncoder!=='undefined'){
      var b=new TextEncoder().encode(s),bin='';
      for(var i=0;i<b.length;i+=8192)bin+=String.fromCharCode.apply(null,b.subarray(i,i+8192));
      return btoa(bin).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
    }
  }catch(e){}
  return '~'+btoa(encodeURIComponent(s)).replace(/=+$/,'');
}
function dec(x){
  if(x.charAt(0)==='~')return decodeURIComponent(atob(x.slice(1)));
  x=x.replace(/-/g,'+').replace(/_/g,'/');while(x.length%4)x+='=';
  var bin=atob(x),u=new Uint8Array(bin.length);
  for(var i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);
  return new TextDecoder().decode(u);
}
function share(){
  if(!items.length){toast('Сначала добавьте позиции');return}
  var compact=items.slice(0,12).map(function(it){return [it.id,it.title,it.text]});
  var cfg;
  try{cfg=enc(JSON.stringify(compact))}catch(e){toast('Не удалось собрать ссылку');return}
  var u=location.origin+location.pathname+'?cfg='+encodeURIComponent(cfg);
  if(u.length>4000){toast('Слишком много позиций для ссылки — скопируйте список');return}
  if(w.n7Copy)w.n7Copy(u,'Ссылка на подбор скопирована');
}
function restore(){
  var m=location.search.match(/[?&]cfg=([^&]+)/);if(!m)return;
  try{
    var arr=JSON.parse(dec(decodeURIComponent(m[1])));
    if(Array.isArray(arr)&&arr.length){
      items=arr.map(function(a){return {id:a[0],title:a[1],text:a[2]}}).slice(0,20);
      save();setTimeout(function(){toast('Восстановили подбор из ссылки · '+items.length+' позиций');open()},600);
    }
  }catch(e){}
}
function printSpec(){
  if(!items.length){toast('Нечего печатать');return}
  var p=d.getElementById('n7-print')||d.createElement('div');
  p.id='n7-print';
  p.innerHTML='<h1>N7 Construction · Лист подбора</h1><p>Казахстан и СНГ · '+new Date().toLocaleDateString('ru-RU')+'</p>'+
    items.map(function(it,i){return '<section><h2>'+(i+1)+'. '+esc(it.title)+'</h2><pre>'+esc(it.text||'')+'</pre></section>'}).join('')+
    '<p class="pn">Предварительная заявка. Стоимость, сроки и наличие уточняются при подготовке коммерческого предложения. Точные цены не публикуются.</p>';
  if(!p.parentNode)d.body.appendChild(p);
  d.body.classList.add('printing');
  w.print();
  setTimeout(function(){d.body.classList.remove('printing')},1200);
}

/* публичный API — объявляем сразу, до DOMContentLoaded */
w.n7List={
  add:add,remove:remove,clear:clear,open:open,close:close,share:share,print:printSpec,
  count:function(){return items.length},
  all:function(){return items.slice()}
};

function inject(){
  /* кнопка в шапке */
  var tools=$('.tools');
  if(tools&&!$('#n7ListBtn')){
    var b=d.createElement('button');b.type='button';b.id='n7ListBtn';b.className='ib n7-list-btn';
    b.setAttribute('aria-label','Лист подбора');
    b.innerHTML='<svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 4h14M3 9h14M3 14h9"/></svg><span class="lcount" hidden>0</span>';
    b.onclick=open;
    tools.insertBefore(b,tools.querySelector('.btn')||tools.firstChild);
  }
  /* кнопки «+ В лист» в карточках каталога */
  $$('#catalog .grid .pcard').forEach(function(card){
    var foot=$('.pfoot',card);if(!foot||$('.addlist',card))return;
    var art=($('.art',card)||{}).textContent||'';
    var name=($('b',card)||{}).textContent||'Позиция каталога';
    var specs=$$('.pspec li',card).map(function(li){return li.textContent.trim()});
    var id='sku:'+art.trim();
    var text='Позиция каталога: '+name+' ('+art.trim()+')\n'+specs.join('\n')+'\nЦена по запросу';
    var wrap=d.createElement('div');wrap.className='pmini';
    wrap.innerHTML='<button type="button" class="ib addlist">+ В лист</button><button type="button" class="ib addcmp">Сравнить</button>';
    foot.appendChild(wrap);
    $('.addlist',wrap).onclick=function(){add({id:id,title:name,text:text})};
    $('.addcmp',wrap).onclick=function(){if(w.n7Compare)w.n7Compare.toggle(card)};
  });
  /* кнопки у четырёх инструментов */
  [['#calc-slot','calc','Расчёт материала'],['#padel-config','padel','Падел-корт'],
   ['#picker-slot','picker','Подбор покрытия'],['#light-slot','light','Освещение площадки']].forEach(function(a){
    var slot=$(a[0]);if(!slot||$('.addlist',slot))return;
    var wrap=d.createElement('div');wrap.className='addwrap';
    var b=d.createElement('button');b.type='button';b.className='ib addlist';b.textContent='+ В лист подбора';
    b.onclick=function(){
      var s=(w.n7Snapshot||{})[a[1]];
      if(!s||!s.text){toast('Сначала сделайте расчёт или выберите вариант');return}
      add({id:a[1]+':'+s.text.slice(0,80),title:s.title||a[2],text:s.text});
    };
    wrap.appendChild(b);slot.appendChild(wrap);
  });
  d.addEventListener('keydown',function(e){if(e.key==='Escape')close()});
}

function boot(){load();var el=drawer();render();inject();restore();
  w.addEventListener('afterprint',function(){d.body.classList.remove('printing')});
}
if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',boot);else boot();
})();
