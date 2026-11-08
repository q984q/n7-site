/* Квиз «Подберите решение за 60 секунд» — 6 шагов, локальный расчёт,
   без цен и без внешних сервисов. Результат уходит в WhatsApp или лист подбора. */
(function(){
'use strict';
var d=document,w=window;
var $=function(s,c){return (c||d).querySelector(s)};
var $$=function(s,c){return Array.prototype.slice.call((c||d).querySelectorAll(s))};
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function toast(m){if(w.n7Toast)w.n7Toast(m)}

var CATS={
  roll:['ПВХ-покрытия в рулонах','pvh-pokrytiya.html','Бесшовное покрытие для игрового зала: ровный отскок, рисунок под паркет, антибликовая поверхность.'],
  tile:['Модульная плитка','modulnye-pokrytiya.html','Замковое соединение, быстрый монтаж без клея, ремонтопригодность и работа на улице.'],
  track:['Беговые дорожки','begovye-dorozhki.html','Сборная или полусборная система для стадиона и манежа, заводская готовность полотна.'],
  parquet:['Спортивный паркет','sportivnyj-parket.html','Деревянная система на килях с амортизаторами для залов с высокими требованиями.'],
  padel:['Падел-корты','padel-korty.html','Корт 20 × 10 м под ключ: каркас, стекло, газон и освещение.'],
  pool:['Решения для влажных зон','modulnye-pokrytiya.html','Перфорированная плитка для бассейнов, душевых и обходных дорожек.']
};
var CLASSES=['III · тренировки и школа','II · соревнования и клубы','I · высокий уровень и ТВ'];
var AREAS=['до 200 м²','200–600 м²','600–2000 м²','свыше 2000 м²'];

var Q=[
 {q:'Что за объект?',hint:'Это определяет нагрузку, требования к основанию и класс освещения.',
  o:[['Школа, вуз, детская площадка',{tile:2,roll:1}],
     ['Спортивный комплекс или клуб',{roll:2,parquet:1,padel:1}],
     ['Открытая уличная площадка',{tile:3,padel:1}],
     ['Стадион или легкоатлетический манеж',{track:4}],
     ['Фитнес-клуб, частный объект',{roll:2,parquet:1}],
     ['Бассейн, душевые, влажные зоны',{pool:4}]]},
 {q:'Какой вид спорта основной?',hint:'Если площадка универсальная — выберите самый частый сценарий.',
  o:[['Баскетбол, волейбол, гандбол',{roll:2,parquet:2,tile:1}],
     ['Теннис, пиклбол, бадминтон',{tile:2,roll:1}],
     ['Падел',{padel:4}],
     ['Настольный теннис',{roll:3}],
     ['Лёгкая атлетика, бег',{track:4}],
     ['Футзал, мини-футбол',{roll:2,tile:2}],
     ['Фитнес, групповые занятия',{roll:3,parquet:1}],
     ['Бассейн и прилегающие зоны',{pool:4}]]},
 {q:'Где будет площадка?',hint:'Уличные материалы отличаются по морозостойкости и дренажу.',
  o:[['В помещении',{roll:2,parquet:2}],
     ['На улице',{tile:3,track:1,padel:1}],
     ['И зал, и улица',{tile:2,roll:1}]]},
 {q:'Какой уровень нагрузки?',hint:'От уровня зависит толщина, амортизация и класс освещённости.',
  o:[['Тренировки, школа, любители',{tile:1}],
     ['Клубные и региональные соревнования',{roll:1,parquet:1,track:1}],
     ['Высокий уровень, трансляции',{roll:1,parquet:1,track:1,padel:1}]]},
 {q:'Ориентировочная площадь?',hint:'Нужна только для прикидки объёма — точные размеры внесём в калькулятор.',
  o:[['До 200 м²',{padel:1}],['200–600 м²',{roll:1,tile:1}],['600–2000 м²',{track:1,roll:1}],['Свыше 2000 м²',{track:2,tile:1}]]},
 {q:'Что важно учесть в первую очередь?',hint:'Можно выбрать несколько вариантов.',multi:true,
  o:[['Быстрый монтаж',{tile:2}],['Влагостойкость и дренаж',{tile:1,pool:1}],['Амортизация и защита суставов',{roll:2,parquet:2,track:1}],
     ['Цвет, разметка, брендирование',{tile:1,padel:1}],['Освещение под ключ',{padel:1,tile:1}],['Минимальный уход',{tile:2}]]}
];
var answers=[],multi=[];

function resultText(scores,ranked,lvl,area){
  return 'Квиз N7 Construction: подбор решения\n'+
    'Объект: '+answers[0]+'\nВид спорта: '+answers[1]+'\nУсловия: '+answers[2]+'\n'+
    'Уровень: '+CLASSES[lvl]+'\nПлощадь: '+AREAS[area]+'\n'+
    'Приоритеты: '+(multi.length?multi.join(', '):'не указаны')+'\n\n'+
    'Рекомендуем:\n'+ranked.map(function(c,i){return (i+1)+'. '+CATS[c][0]+' — '+CATS[c][2]}).join('\n')+
    '\n\nКласс освещения: '+CLASSES[lvl]+'\n'+
    'Прошу подготовить коммерческое предложение и уточнить характеристики под объект.';
}
function render(){
  var slot=$('#quiz-slot');if(!slot)return;
  var i=answers.length;
  if(i>=Q.length){showResult();return}
  var q=Q[i];
  slot.innerHTML='<div class="quiz" id="quiz"><div class="qtop"><span class="qtag">✦ Квиз · 6 вопросов</span>'+
    '<div class="qprog"><i style="width:'+((i)/Q.length*100).toFixed(1)+'%"></i></div><span class="qnum">'+(i+1)+' / '+Q.length+'</span></div>'+
    '<div class="qbody" aria-live="polite"><h3 class="qh">'+esc(q.q)+'</h3><p class="qhint">'+esc(q.hint)+'</p>'+
    '<div class="qopts">'+q.o.map(function(o,k){return '<button type="button" class="qopt" data-k="'+k+'"><em>'+(k+1)+'</em><b>'+esc(o[0])+'</b></button>'}).join('')+'</div></div>'+
    '<div class="qnav"><button type="button" class="ib" id="qBack"'+(i?'':' disabled')+'>← Назад</button>'+
    '<span class="qkeys">Выбирайте кликом или цифрами 1–9</span>'+
    '<button type="button" class="btn" id="qNext">'+(q.multi?'Показать результат':'Далее →')+'</button></div></div>';
  $$('.qopt',slot).forEach(function(b){b.onclick=function(){pick(parseInt(b.getAttribute('data-k'),10))}});
  $('#qBack',slot).onclick=function(){answers.pop();if(Q[answers.length]&&!Q[answers.length].multi)multi=[];render()};
  $('#qNext',slot).onclick=function(){if(q.multi){answers.push(multi.length?multi.join(', '):'Не указаны');render()}else{next()}};
  if(q.multi)multi=[];
}
function pick(k){
  var q=Q[answers.length];if(!q)return;
  if(q.multi){
    var t=q.o[k][0],i=multi.indexOf(t);
    if(i>=0)multi.splice(i,1);else multi.push(t);
    $$('.qopt').forEach(function(b,j){b.classList.toggle('on',multi.indexOf(q.o[j][0])>=0)});
  }else{
    var ql=$('#quiz');
    $$('.qopt',ql).forEach(function(b,j){b.classList.toggle('on',j===k)});
    ql._pick=k;
    setTimeout(next,190);
  }
}
function next(){
  var q=Q[answers.length];if(!q||q.multi)return;
  var box=$('#quiz'),k=box&&typeof box._pick==='number'?box._pick:-1;
  if(k<0){toast('Выберите вариант');return}
  answers.push(q.o[k][0]);render();
}
function showResult(){
  var scores={};Object.keys(CATS).forEach(function(c){scores[c]=0});
  Q.forEach(function(q,i){
    var chosen=(q.o||[]).filter(function(o){
      if(q.multi)return multi.indexOf(o[0])>=0;
      return answers[i]===o[0];
    });
    chosen.forEach(function(o){Object.keys(o[1]||{}).forEach(function(c){if(scores[c]!=null)scores[c]+=o[1][c]})});
  });
  var ranked=Object.keys(scores).sort(function(a,b){return scores[b]-scores[a]}).filter(function(c){return scores[c]>0}).slice(0,2);
  if(!ranked.length)ranked=['roll','tile'];
  var lvl=3;['Тренировки, школа, любители','Клубные и региональные соревнования','Высокий уровень, трансляции'].forEach(function(x,i){if(answers[3]===x)lvl=i});
  var area=0;AREAS.forEach(function(x,i){if(answers[4]===x)area=i});
  var slot=$('#quiz-slot');
  slot.innerHTML='<div class="quiz qdone" id="quiz"><div class="qtop"><span class="qtag">✓ Готово</span><div class="qprog"><i style="width:100%"></i></div><span class="qnum">Результат</span></div>'+
    '<div class="qbody" aria-live="polite"><h3 class="qh">Ваше решение</h3><p class="qhint">Предварительная рекомендация по вашим ответам. Окончательный подбор — после замера и проекта.</p>'+
    ranked.map(function(c,i){var x=CATS[c];return '<div class="qres"><b>'+(i+1)+'. '+esc(x[0])+'</b><p>'+esc(x[2])+'</p><a class="more" href="'+x[1]+'">Подробнее о решении →</a></div>'}).join('')+
    '<div class="qmeta"><span>Класс освещения: <b>'+esc(CLASSES[lvl])+'</b></span><span>Площадь: <b>'+esc(AREAS[area])+'</b></span></div>'+
    '<div class="fbtns"><button type="button" class="btn" id="qSend">Отправить результат в WhatsApp</button>'+
    '<button type="button" class="ib" id="qList">+ В лист подбора</button>'+
    '<a class="ib" href="produktsiya.html#calc-slot">Калькулятор</a>'+
    '<a class="ib" href="produktsiya.html#osveshhenie">Освещение</a>'+
    '<button type="button" class="ib" id="qAgain">Пройти заново</button></div>'+
    '<p class="tnote">Рекомендация носит ориентировочный характер. Толщину, основание, сертификацию, освещение и сроки подтверждаем проектом и требованиями федерации; цены публично не размещаем.</p></div></div>';
  var txt=resultText(scores,ranked,lvl,area);
  $('#qSend',slot).onclick=function(){if(w.n7Send)w.n7Send(txt)};
  $('#qList',slot).onclick=function(){if(w.n7List)w.n7List.add({id:'quiz:'+txt.slice(0,90),title:'Подбор по квизу: '+ranked.map(function(c){return CATS[c][0]}).join(' + '),text:txt})};
  $('#qAgain',slot).onclick=function(){answers=[];multi=[];render();$('#quiz').scrollIntoView({behavior:'smooth',block:'center'})};
}
function keys(e){
  if(!$('#quiz')||!$('#qNext'))return; /* на экране результата горячие клавиши не нужны */
  var sov=$('#sov');if(sov&&!sov.hidden)return;      /* открыт поиск ⌘K */
  var ld=$('#ldrawer');if(ld&&!ld.hidden)return;      /* открыт лист подбора */
  if($('.cmp'))return;                                 /* открыто сравнение */
  if(!/input|textarea|select/i.test((e.target.tagName||''))&&/^[1-9]$/.test(e.key)){pick(parseInt(e.key,10)-1);e.preventDefault()}
  else if(e.key==='Enter'&&e.target.tagName!=='BUTTON'){var n=$('#qNext');if(n){n.click();e.preventDefault()}}
}
w.n7Quiz={reset:function(){answers=[];multi=[];render()},open:function(){var q=$('#quiz');if(q)q.scrollIntoView({behavior:'smooth',block:'center'})}};
function boot(){if($('#quiz-slot')){render();d.addEventListener('keydown',keys)}}
if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',boot);else boot();
})();
