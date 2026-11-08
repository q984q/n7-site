/* Дополнительные фишки сайта N7: лайтбокс, тосты, «Наверх», мобильная плашка,
   анимация фильтра, калькулятор материала, конфигуратор падел-корта, подбор покрытия.
   Ванильный JS, без зависимостей. Уважает prefers-reduced-motion. */
(function(){
'use strict';
var d=document,w=window;
var $=function(s,c){return (c||d).querySelector(s)};
var $$=function(s,c){return Array.prototype.slice.call((c||d).querySelectorAll(s))};
var reduce=false;try{reduce=matchMedia('(prefers-reduced-motion: reduce)').matches}catch(e){}
var WA='77778848818';
window.n7Snapshot=window.n7Snapshot||{};

/* ---------- тост ---------- */
var toastEl=null,toastTimer=null;
function toast(msg){
if(!toastEl){toastEl=d.createElement('div');toastEl.className='toast';toastEl.setAttribute('role','status');toastEl.setAttribute('aria-live','polite');toastEl.hidden=true;d.body.appendChild(toastEl)}
toastEl.textContent=msg;toastEl.hidden=false;toastEl.classList.add('on');
clearTimeout(toastTimer);toastTimer=setTimeout(function(){toastEl.classList.remove('on');setTimeout(function(){toastEl.hidden=true},280)},2600);
}
w.n7Toast=toast;
w.n7Copy=copyText;

/* ---------- копирование и отправка в WhatsApp ---------- */
function copyText(text,msg){
var done=function(){toast(msg||'Скопировано')},fail=function(){toast('Не удалось скопировать — выделите текст вручную')};
if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(text).then(done,fail)}
else{var ta=d.createElement('textarea');ta.value=text;ta.style.position='fixed';ta.style.opacity='0';d.body.appendChild(ta);ta.select();try{d.execCommand('copy')?done():fail()}catch(e){fail()}d.body.removeChild(ta)}
}
function send(text){
var url='https://wa.me/'+WA+'?text='+encodeURIComponent(text);
try{w.open(url,'_blank','noopener')}catch(e){}
toast('Открываем WhatsApp с готовым сообщением');
return url;
}
w.n7Send=send;
$$('[data-copy]').forEach(function(b){b.addEventListener('click',function(){copyText(b.getAttribute('data-copy'),'Номер скопирован')})});

/* ---------- кнопка «Наверх» ---------- */
var topBtn=d.createElement('button');topBtn.type='button';topBtn.className='to-top';topBtn.setAttribute('aria-label','Наверх');topBtn.textContent='↑';d.body.appendChild(topBtn);
function onScroll(){topBtn.classList.toggle('on',scrollY>600)}
addEventListener('scroll',onScroll,{passive:true});onScroll();
topBtn.onclick=function(){try{scrollTo({top:0,behavior:reduce?'auto':'smooth'})}catch(e){scrollTo(0,0)}};

/* ---------- мобильная плашка быстрых действий ---------- */
if(!$('#deck')){
var bar=d.createElement('div');bar.className='mbar';bar.setAttribute('role','group');bar.setAttribute('aria-label','Быстрые действия');
var kp=$('#lead')?'#lead':'kontakty.html';
bar.innerHTML='<a class="mb-call" href="tel:+77778848818">Позвонить</a><a class="mb-wa" href="https://wa.me/'+WA+'" target="_blank" rel="noopener">WhatsApp</a><a class="mb-kp" href="'+kp+'">Получить КП</a>';
d.body.appendChild(bar);d.body.classList.add('has-mbar');
}

/* ---------- лайтбокс ---------- */
function initLightbox(){
var items=$$('figure .ph').filter(function(ph){return ph.querySelector('img')});
if(!items.length)return;
var data=items.map(function(ph){var im=ph.querySelector('img'),fig=ph.closest('figure'),b=fig&&fig.querySelector('figcaption b');
return {src:im.getAttribute('src'),alt:im.getAttribute('alt')||'',cap:b?b.textContent:''}});
var lb=d.createElement('div');lb.className='lb';lb.hidden=true;lb.setAttribute('role','dialog');lb.setAttribute('aria-modal','true');lb.setAttribute('aria-label','Просмотр изображения');
lb.innerHTML='<button class="lb-x" type="button" aria-label="Закрыть">×</button><button class="lb-p" type="button" aria-label="Предыдущее">‹</button><img class="lb-img" alt=""><button class="lb-n" type="button" aria-label="Следующее">›</button><div class="lb-cap"></div>';
d.body.appendChild(lb);
var img=$('.lb-img',lb),cap=$('.lb-cap',lb),i=0,lastFocus=null,sx=null;
function render(){var it=data[i];img.src=it.src;img.alt=it.alt;cap.textContent=(i+1)+' / '+data.length+(it.cap?' · '+it.cap:'');$('.lb-p',lb).disabled=data.length<2;$('.lb-n',lb).disabled=data.length<2}
function open(k){i=k;render();lastFocus=d.activeElement;lb.hidden=false;lb.classList.add('on');d.body.style.overflow='hidden';$('.lb-x',lb).focus()}
function close(){lb.classList.remove('on');lb.hidden=true;d.body.style.overflow='';if(lastFocus&&lastFocus.focus)lastFocus.focus()}
function go(n){i=(i+n+data.length)%data.length;render()}
items.forEach(function(ph,k){ph.classList.add('zoom');ph.addEventListener('click',function(e){e.preventDefault();open(k)})});
$('.lb-x',lb).onclick=close;$('.lb-p',lb).onclick=function(){go(-1)};$('.lb-n',lb).onclick=function(){go(1)};
lb.addEventListener('click',function(e){if(e.target===lb)close()});
d.addEventListener('keydown',function(e){if(lb.hidden)return;if(e.key==='Escape')close();else if(e.key==='ArrowLeft')go(-1);else if(e.key==='ArrowRight')go(1)});
lb.addEventListener('touchstart',function(e){sx=e.touches[0].clientX},{passive:true});
lb.addEventListener('touchend',function(e){if(sx===null)return;var dx=e.changedTouches[0].clientX-sx;sx=null;if(Math.abs(dx)>50)go(dx<0?1:-1)},{passive:true});
}

/* ---------- анимация переключения фильтра каталога ---------- */
function initFilterFx(){
/* catalog-fx.js берёт фильтр каталога на себя (FLIP) */
if(w.n7FlipInstalled)return;
var bs=$$('.filters button');if(!bs.length)return;
bs.forEach(function(b){b.addEventListener('click',function(){
var vis=$$('.grid figure').filter(function(f){return !f.hidden});
vis.forEach(function(f,k){f.style.setProperty('--fi',Math.min(k,8));f.classList.remove('fpop');void f.offsetWidth;f.classList.add('fpop');
f.addEventListener('animationend',function(){f.classList.remove('fpop')},{once:true})});
})});
}

/* ---------- калькулятор материала ---------- */
var SIZES=[
['25×25×2 см',0.25*0.25],['30,3×30,3×1,6 см',0.303*0.303],['30,5×30,5×1,6 см',0.305*0.305],
['30,48×30,48×1,5 см',0.3048*0.3048],['40×40×1,58 см',0.4*0.4],['30,1×30,1×1,58 см',0.301*0.301],
['34,1×34,1×1,55 см',0.341*0.341],['30,48×30,48×1,2 см',0.3048*0.3048],['20×20×0,9 см (влажные зоны)',0.2*0.2]];
var TYPES=[['tile','Модульная плитка'],['pvc','ПВХ-покрытие в рулонах (1,8 м)'],['track','Беговая дорожка (1,22 м)'],['turf','Газон для падел-корта'],['parquet','Спортивный паркет (щиты)']];
function compute(area,waste,type,si){
var a=area*(1+waste/100);
if(type==='tile'){var n=Math.ceil(a/SIZES[si][1]);return {main:n.toLocaleString('ru-RU')+' плиток',desc:'при размере '+SIZES[si][0]+', запас '+waste+'%',note:'Без учёта раскроя по периметру, разметки и подрезки.'}}
if(type==='pvc'){var lm=Math.ceil(a/1.8);return {main:lm.toLocaleString('ru-RU')+' п. м',desc:'≈ '+Math.ceil(lm/20)+' рулонов по 20 м при ширине 1,8 м',note:'Для части артикулов длина рулона изготавливается на заказ — уточним при расчёте.'}}
if(type==='track'){var t=Math.ceil(a/1.22);return {main:t.toLocaleString('ru-RU')+' п. м',desc:'≈ '+Math.ceil(t/20)+'–'+Math.ceil(t/15)+' рулонов при ширине 1,22 м',note:'Сборная дорожка поставляется рулонами 15–20 м.'}}
if(type==='turf'){return {main:Math.ceil(a).toLocaleString('ru-RU')+' м² газона',desc:'≈ '+Math.ceil(a/200)+' корт(ов) 20×10 м по 200 м²',note:'Высота ворса 12 мм — по данным каталога производителя.'}}
var sh=Math.ceil(a/1.6506);return {main:sh.toLocaleString('ru-RU')+' щитов',desc:'модульный паркет 1800×917 мм (1,65 м² на щит)',note:'Для стационарных конструкций на килях расчёт ведётся по проекту.'};
}
function initCalc(){
var slot=$('#calc-slot');if(!slot)return;
var opts=TYPES.map(function(t){return '<option value="'+t[0]+'">'+t[1]+'</option>'}).join('');
var sizes=SIZES.map(function(s,i){return '<option value="'+i+'">'+s[0]+'</option>'}).join('');
slot.innerHTML='<h2>Калькулятор материала</h2><p class="intro">Укажите размеры площадки — посчитаем ориентировочный объём материала. Цен не публикуем: результат можно сразу отправить нам для расчёта стоимости.</p>'+
'<div class="calc"><div class="calc-f">'+
'<div><label for="clen">Длина, м</label><input id="clen" type="number" min="1" step="0.1" value="20" inputmode="decimal"></div>'+
'<div><label for="cwid">Ширина, м</label><input id="cwid" type="number" min="1" step="0.1" value="10" inputmode="decimal"></div>'+
'<div><label for="ctype">Тип покрытия</label><select id="ctype">'+opts+'</select></div>'+
'<div id="csize-wrap"><label for="csize">Размер плитки</label><select id="csize">'+sizes+'</select></div>'+
'<div><label for="cwaste">Запас на раскрой, %</label><input id="cwaste" type="number" min="0" max="30" step="1" value="5" inputmode="numeric"></div>'+
'</div><div class="calc-r" aria-live="polite"><div class="cr-big"><span id="cr-area">200</span><small>м² площади</small></div>'+
'<div class="cr-line"><b id="cr-mat">—</b><span id="cr-desc"></span></div><p class="tnote" id="cr-note"></p>'+
'<div class="fbtns"><button class="btn" type="button" id="cr-send">Отправить расчёт в WhatsApp</button><button class="ib" type="button" id="cr-copy">Скопировать</button></div>'+
'</div></div>';
var len=$('#clen'),wid=$('#cwid'),type=$('#ctype'),size=$('#csize'),waste=$('#cwaste'),wrap=$('#csize-wrap');
var big=$('.cr-big'),areaEl=$('#cr-area'),mat=$('#cr-mat'),desc=$('#cr-desc'),note=$('#cr-note');
var state={text:''};
function update(){
var L=parseFloat(len.value),W=parseFloat(wid.value),w=parseFloat(waste.value);
wrap.hidden=type.value!=='tile';
if(!(L>0&&W>0)){areaEl.textContent='—';mat.textContent='—';desc.textContent='';note.textContent='Введите длину и ширину больше нуля.';state.text='';window.n7Snapshot.calc=null;return}
var a=L*W,r=compute(a,isNaN(w)?0:Math.max(0,Math.min(30,w)),type.value,parseInt(size.value,10)||0);
areaEl.textContent=a.toLocaleString('ru-RU',{maximumFractionDigits:1});mat.textContent=r.main;desc.textContent=r.desc;note.textContent='Ориентировочно. '+r.note;
big.classList.remove('pulse');void big.offsetWidth;big.classList.add('pulse');
state.text='Расчёт материала с сайта N7 Construction\nПлощадка: '+L+' × '+W+' м = '+a.toLocaleString('ru-RU',{maximumFractionDigits:1})+' м²\nТип: '+type.options[type.selectedIndex].text+'\nРезультат: '+r.main+' ('+r.desc+')';

window.n7Snapshot.calc={title:'Расчёт материала · '+a.toLocaleString('ru-RU',{maximumFractionDigits:1})+' м²',text:state.text};
}
[len,wid,type,size,waste].forEach(function(el){el.addEventListener('input',update);el.addEventListener('change',update)});
$('#cr-send').onclick=function(){if(state.text)send(state.text);else toast('Заполните размеры площадки')};
$('#cr-copy').onclick=function(){if(state.text)copyText(state.text,'Расчёт скопирован');else toast('Заполните размеры площадки')};
update();
}

/* ---------- конфигуратор падел-корта ---------- */
var FRAME=[['#141516','Чёрный RAL 9005'],['#3a3d40','Антрацит RAL 7016'],['#1f4e9c','Синий RAL 5010'],['#1f5c3a','Зелёный RAL 6005'],['#8e2b28','Красный RAL 3020'],['#e6e6e2','Белый RAL 9010']];
var TURF=[['#1f7a4d','Зелёный'],['#1f5fa8','Синий'],['#b04a34','Кирпично-красный'],['#d4728c','Розовый'],['#222426','Чёрный']];
function initPadel(){
var slot=$('#padel-config');if(!slot)return;
var models=['Панорамный корт','Суперпанорамный корт','Корт с навесом','Классический корт'];
var mopts=models.map(function(m){return '<option>'+m+'</option>'}).join('');
var sw1=FRAME.map(function(c,i){return '<button type="button" class="sw'+(i===0?' on':'')+'" data-k="frame" data-i="'+i+'" style="--sw:'+c[0]+'" title="'+c[1]+'" aria-label="'+c[1]+'"></button>'}).join('');
var sw2=TURF.map(function(c,i){return '<button type="button" class="sw'+(i===0?' on':'')+'" data-k="turf" data-i="'+i+'" style="--sw:'+c[0]+'" title="'+c[1]+'" aria-label="'+c[1]+'"></button>'}).join('');
slot.innerHTML='<h2>Соберите свой корт</h2><p class="intro">Выберите модель, цвета и освещение — спецификация соберётся сразу. Отправьте её нам, подготовим коммерческое предложение.</p>'+
'<div class="pcfg"><div class="pcfg-f">'+
'<div><label for="pmodel">Модель</label><select id="pmodel">'+mopts+'</select></div>'+
'<div><label>Цвет каркаса (RAL)</label><div class="sws" id="pframe">'+sw1+'</div><span class="tnote" id="pframe-l">Чёрный RAL 9005</span></div>'+
'<div><label>Цвет газона</label><div class="sws" id="pturf">'+sw2+'</div><span class="tnote" id="pturf-l">Зелёный</span></div>'+
'<div><label for="plight">Мощность светильника</label><select id="plight"><option>200 Вт</option><option>300 Вт</option><option selected>400 Вт</option></select><span class="srcnote">по данным каталога производителя</span></div>'+
'<div><label class="ck" for="pads"><input id="pads" type="checkbox" checked><span>Защитные накладки на углы и стойки</span></label></div>'+
'</div><div class="pcfg-r"><div class="pcfg-view" id="pview"><div class="pcfg-net"></div></div>'+
'<ul class="pspec" id="pspec"></ul><div class="fbtns"><button class="btn" type="button" id="psend">Получить КП</button><button class="ib" type="button" id="pcopy">Скопировать</button></div></div></div>';
var model=$('#pmodel'),light=$('#plight'),pads=$('#pads'),view=$('#pview'),spec=$('#pspec'),state={frame:0,turf:0,text:''};
function update(){
view.style.setProperty('--turf',TURF[state.turf][0]);view.style.setProperty('--frame',FRAME[state.frame][0]);
$('#pframe-l').textContent=FRAME[state.frame][1];$('#pturf-l').textContent=TURF[state.turf][1];
var rows=[['Площадка','20 × 10 м, высота сетки 0,88 м'],['Модель',model.value],['Каркас','Сталь, порошковая окраска · '+FRAME[state.frame][1]],
['Панели / стекло','46 сетчатых панелей 4 мм, 18 стёкол 12 мм'],['Газон','200 м², ворс 12 мм · '+TURF[state.turf][1]],
['Освещение','4 прожектора по '+light.value+' на стойках 6 м'],['Опции',pads.checked?'Защитные накладки на углы и стойки':'Без дополнительных накладок'],
['Стандарт','T/WQTB 1002-2021 (по данным каталога)']];
spec.innerHTML=rows.map(function(r){return '<li><b>'+r[0]+':</b> '+r[1]+'</li>'}).join('');
state.text='Конфигурация падел-корта с сайта N7 Construction\n'+rows.map(function(r){return r[0]+': '+r[1]}).join('\n');

window.n7Snapshot.padel={title:'Падел-корт · '+model.value,text:state.text};
}
$$('.sw').forEach(function(b){b.onclick=function(){var k=b.getAttribute('data-k');state[k]=parseInt(b.getAttribute('data-i'),10);
$$('.sw[data-k="'+k+'"]').forEach(function(x){x.classList.toggle('on',x===b)});update()}});
[model,light,pads].forEach(function(el){el.addEventListener('change',update)});
$('#psend').onclick=function(){send(state.text)};$('#pcopy').onclick=function(){copyText(state.text,'Спецификация скопирована')};
update();
}

/* ---------- подбор покрытия по виду спорта ---------- */
var SPORTS=[
['Баскетбол','ПВХ 7 мм с рисунком «дуб» (FIBA), профессиональная модульная плитка 25×25×2 см или спортивный паркет на килях.',[['pvh-pokrytiya.html','ПВХ'],['modulnye-pokrytiya.html','Модульные'],['sportivnyj-parket.html','Паркет']]],
['Волейбол','ПВХ-покрытие 7 мм с амортизацией 25–30% и отскоком ≥95%, либо паркет для многофункционального зала.',[['pvh-pokrytiya.html','ПВХ'],['sportivnyj-parket.html','Паркет']]],
['Настольный теннис','Рулонное ПВХ 5–9 мм с сертификатом ITTF; не требует сложной подготовки основания.',[['pvh-pokrytiya.html','ПВХ'],['produktsiya.html','Каталог']]],
['Теннис и пиклбол','Модульная плитка для уличных кортов или ПВХ для пиклбола: крытое 2,1/3,1 мм и уличное 3,0 мм с УФ-защитой.',[['pvh-pokrytiya.html','ПВХ'],['modulnye-pokrytiya.html','Модульные']]],
['Футзал и мини-футбол','Плоская модульная плитка 30,48×30,48×1,5 см с 50 эластичными прокладками.',[['modulnye-pokrytiya.html','Модульные']]],
['Падел','Корт 20×10 м под ключ: каркас, стекло, газон 200 м² и LED-освещение. Соберите конфигурацию на странице падела.',[['padel-korty.html','Падел-корты']]],
['Лёгкая атлетика','Сборная беговая дорожка 9/13 мм для стадионов или полусборная 9–15 мм для парков и фитнес-троп.',[['begovye-dorozhki.html','Беговые дорожки']]],
['Бассейн и душевые','Плитка 20×20×0,9 см из термопластичного эластомера с бездонной дренажной конструкцией.',[['modulnye-pokrytiya.html','Влажные зоны']]],
['Фитнес и залы','ПВХ с индивидуальным дизайном 2–8 мм, спортивный паркет или модульное покрытие под задачу.',[['pvh-pokrytiya.html','ПВХ'],['sportivnyj-parket.html','Паркет']]]
];
function initPicker(){
var slot=$('#picker-slot');if(!slot)return;
var chips=SPORTS.map(function(s,i){return '<button type="button" class="chip'+(i===0?' on':'')+'" data-i="'+i+'" aria-pressed="'+(i===0?'true':'false')+'">'+s[0]+'</button>'}).join('');
slot.innerHTML='<h2>Подберите покрытие под вид спорта</h2><p class="intro">Выберите дисциплину — покажем подходящие материалы и страницу с характеристиками.</p><div class="chips" role="group" aria-label="Вид спорта">'+chips+'</div><div class="pick-r" aria-live="polite"></div>';
var out=$('.pick-r',slot),active=0;
function render(){
var s=SPORTS[active];
out.innerHTML='<h3>'+s[0]+'</h3><p>'+s[1]+'</p><div class="fbtns">'+s[2].map(function(l){return '<a class="ib" href="'+l[0]+'">'+l[1]+' →</a>'}).join('')+'<a class="ib" href="produktsiya.html#osveshhenie">Освещение →</a><button class="btn" type="button" id="pick-send">Запросить КП</button></div>';
var ptext='Подбор покрытия с сайта N7 Construction\nВид спорта: '+s[0]+'\nРекомендация: '+s[1];
window.n7Snapshot.picker={title:'Подбор покрытия · '+s[0],text:ptext};
$('#pick-send',out).onclick=function(){send(ptext)};
out.classList.remove('pulse');void out.offsetWidth;out.classList.add('pulse');
}
$$('.chip',slot).forEach(function(b){b.onclick=function(){active=parseInt(b.getAttribute('data-i'),10);
$$('.chip',slot).forEach(function(x){x.classList.toggle('on',x===b);x.setAttribute('aria-pressed',x===b)});render()}});
render();
}

/* ---------- запуск ---------- */
function boot(){initLightbox();initFilterFx();initCalc();initPadel();initPicker()}
if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',boot);else boot();
})();
