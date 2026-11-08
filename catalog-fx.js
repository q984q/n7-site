/* Каталог N7: премиальные анимации и освещение площадок.
   FLIP-хореография фильтра, скользящий индикатор, световой блик по курсору,
   «включение света» на карточках и предварительный светотехнический расчёт.
   Ванильный JS без зависимостей. Уважает prefers-reduced-motion. */
(function(){
'use strict';
var d=document,w=window;
window.n7Snapshot=window.n7Snapshot||{};
var $=function(s,c){return (c||d).querySelector(s)};
var $$=function(s,c){return Array.prototype.slice.call((c||d).querySelectorAll(s))};
var reduce=false,fine=false;
try{reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
    fine=matchMedia('(hover:hover) and (pointer:fine)').matches}catch(e){}
var motion=!reduce&&!!(w.Element&&Element.prototype.animate);

/* Сообщаем features.js, что фильтр каталога анимируется здесь (FLIP вместо fpop). */
if($('#catalog .grid'))w.n7FlipInstalled=true;

/* ---------- 1. Скользящий индикатор активного фильтра ---------- */
function pill(box,buttons){
  if(!box||!buttons.length)return function(){};
  box.classList.add('fx-pills');
  var p=d.createElement('span');p.className='fpill';p.setAttribute('aria-hidden','true');box.appendChild(p);
  function move(){
    var b=buttons.filter(function(x){return x.getAttribute('aria-pressed')==='true'})[0]||buttons[0];
    if(!b)return;
    p.style.width=b.offsetWidth+'px';p.style.height=b.offsetHeight+'px';
    p.style.transform='translate('+b.offsetLeft+'px,'+b.offsetTop+'px)';
    p.classList.add('on');
  }
  addEventListener('resize',move,{passive:true});
  addEventListener('load',move);
  if(d.fonts&&d.fonts.ready)d.fonts.ready.then(move);
  setTimeout(move,0);
  return move;
}

/* ---------- 2. FLIP: карточки «переезжают» на новые места ---------- */
function snap(items){
  var m=new Map();
  items.forEach(function(el){if(!el.hidden)m.set(el,el.getBoundingClientRect())});
  return m;
}
function flipPlay(items,first){
  if(!motion)return;
  requestAnimationFrame(function(){
    var i=0;
    items.forEach(function(el){
      if(el.hidden)return;
      var r=el.getBoundingClientRect(),a=first.get(el),k=Math.min(i++,10);
      if(a){
        var dx=a.left-r.left,dy=a.top-r.top;
        if(Math.abs(dx)<2&&Math.abs(dy)<2)return;
        el.animate([{transform:'translate('+dx.toFixed(1)+'px,'+dy.toFixed(1)+'px) scale(.965)'},
                    {transform:'none'}],
                   {duration:560,easing:'cubic-bezier(.2,.78,.25,1)',delay:k*20});
      }else{
        el.animate([{transform:'translateY(20px) scale(.95)'},{transform:'none'}],
                   {duration:460,easing:'cubic-bezier(.2,.78,.25,1)',delay:k*26});
      }
    });
  });
}

/* ---------- 3. Световой блик, следующий за курсором ---------- */
function glow(){
  var seen=[];
  $$('.pcard,.pcat,.lcard,.grid figure').forEach(function(c){
    if(seen.indexOf(c)>=0||c.closest('.deck'))return;seen.push(c);
    c.classList.add('glow');
    var ph=$('.ph',c);
    if(ph){var s=d.createElement('span');s.className='spot';s.setAttribute('aria-hidden','true');ph.appendChild(s)}
  });
  if(!fine||reduce)return;
  seen.forEach(function(c){
    c.addEventListener('pointermove',function(e){
      var r=c.getBoundingClientRect();
      c.style.setProperty('--gx',((e.clientX-r.left)/r.width*100).toFixed(1)+'%');
      c.style.setProperty('--gy',((e.clientY-r.top)/r.height*100).toFixed(1)+'%');
    });
    c.addEventListener('pointerenter',function(){c.classList.add('lit')});
    c.addEventListener('pointerleave',function(){c.classList.remove('lit')});
  });
}

/* ---------- 4. Фильтр каталога: FLIP + счётчик + доступность ---------- */
function catalog(){
  var sec=$('#catalog');if(!sec)return;
  var grid=$('.grid',sec),items=$$('figure',grid),btns=$$('.filters button',sec);
  if(!grid||!items.length)return;
  var move=pill($('.filters',sec),btns);
  var cnt=d.createElement('p');cnt.className='catcount';
  cnt.setAttribute('role','status');cnt.setAttribute('aria-live','polite');
  grid.parentNode.insertBefore(cnt,grid);
  function num(n){return n===1?'позиция':(n>1&&n<5)?'позиции':'позиций'}
  function report(){
    var n=items.filter(function(f){return !f.hidden}).length;
    cnt.textContent='Показано '+n+' '+num(n)+' из 13';
    move();
  }
  /* capture-фаза: снимаем позиции ДО того, как main.js скроет карточки */
  btns.forEach(function(b){b.addEventListener('click',function(){
    var first=snap(items);
    setTimeout(function(){flipPlay(items,first);report()},0);
  },true)});
  report();
}

/* ---------- 5. Освещение: фильтр, переключатель света, калькулятор ---------- */
var LTYPES=[
  {id:'hall',  name:'Игровой зал (баскетбол, волейбол, футзал)',E:[200,500,750],U:[.5,.7,.7],
   kind:'Подвесные светильники High Bay',ip:'IP54 · CRI ≥ 80 · 4000–5000 K',uf:.55,area:420,w:150},
  {id:'tennis',name:'Теннисный корт, пиклбол (улица)',E:[200,300,500],U:[.6,.7,.7],
   kind:'LED-прожекторы на стойках 6–8 м',ip:'IP66 · CRI ≥ 70 · асимметричная оптика',uf:.45,area:260,w:300},
  {id:'padel', name:'Падел-корт (улица)',E:[200,300,500],U:[.6,.7,.7],
   kind:'4 прожектора на стойках 6 м',ip:'IP66 · без засветки стекла и соседних кортов',uf:.45,area:200,w:400},
  {id:'out',   name:'Уличная площадка (баскетбол 3×3, волейбол)',E:[75,200,500],U:[.5,.6,.7],
   kind:'LED-прожекторы на стойках 6–8 м',ip:'IP66 · антибликовая оптика',uf:.45,area:320,w:300},
  {id:'track', name:'Беговая дорожка, легкоатлетический стадион',E:[100,200,500],U:[.5,.6,.7],
   kind:'Мачты 8–16 м с группой прожекторов',ip:'IP66 · равномерность по всей длине дорожки',uf:.45,area:4000,w:400},
  {id:'pool',  name:'Бассейн, душевые, фитнес-зал',E:[200,300,500],U:[.5,.6,.7],
   kind:'Влагозащищённые и линейные светильники',ip:'IP65 / IP67 · антикоррозионный корпус',uf:.50,area:300,w:100}
];
var CLASSES=['III · тренировки и школа','II · соревнования и клубы','I · высокий уровень и ТВ'];
var WATTS=[100,150,200,300,400,500,600];
var EFF=130,MF=.8;               /* лм/Вт и коэффициент эксплуатации (оценка) */

function opts(arr,sel){return arr.map(function(x,i){
  return '<option value="'+i+'"'+(i===sel?' selected':'')+'>'+x+'</option>'}).join('')}

function lightCalc(){
  var slot=$('#light-slot');if(!slot)return;
  slot.innerHTML=
  '<div class="lcalc"><div class="lcalc-f">'+
  '<h3>Предварительный расчёт освещения</h3>'+
  '<p>Выберите объект и класс соревнований — оценим требуемое число светильников и мощность. Это прикидка для запроса КП, а не готовый светотехнический проект.</p>'+
  '<div class="calc-f">'+
  '<div><label for="lo-type">Тип объекта</label><select id="lo-type">'+LTYPES.map(function(t,i){return '<option value="'+i+'">'+t.name+'</option>'}).join('')+'</select></div>'+
  '<div><label for="lo-class">Класс освещённости</label><select id="lo-class">'+opts(CLASSES,1)+'</select></div>'+
  '<div><label for="lo-area">Площадь, м²</label><input id="lo-area" type="number" min="20" max="30000" step="10" value="420"></div>'+
  '<div><label for="lo-h">Высота установки, м</label><input id="lo-h" type="number" min="3" max="30" step="0.5" value="8"></div>'+
  '<div><label for="lo-w">Мощность светильника, Вт</label><select id="lo-w">'+opts(WATTS.map(function(x){return x+' Вт'}),2)+'</select></div>'+
  '</div></div>'+
  '<div class="lcalc-r"><div class="cr-big"><span id="lr-n">—</span><small>светильников</small></div>'+
  '<div class="cr-line"><b id="lr-e">—</b><span id="lr-el">целевая освещённость</span></div>'+
  '<div class="cr-line"><b id="lr-u">—</b><span>равномерность Emin / Eavg</span></div>'+
  '<div class="cr-line"><b id="lr-flux">—</b><span>требуемый световой поток</span></div>'+
  '<div class="cr-line"><b id="lr-p">—</b><span>установленная мощность</span></div>'+
  '<div class="cr-line"><b id="lr-kind">—</b><span>рекомендуемое исполнение</span></div>'+
  '<p class="lnote">Оценка методом светового потока: коэффициент использования 0,45–0,55, коэффициент эксплуатации 0,8, светоотдача 130 лм/Вт. Не заменяет расчёт в DIALux / Relux: равномерность, блики (GR), цветопередачу (Ra) и вертикальную освещённость при ТВ-съёмке подтверждает проект по EN 12193:2018 и действующим нормам РК. </p>'+
  '<div class="fbtns"><button type="button" class="btn" id="lr-send">Получить КП</button><button type="button" class="ib" id="lr-copy">Скопировать</button></div>'+
  '</div></div>';
  var T=$('#lo-type',slot),C=$('#lo-class',slot),A=$('#lo-area',slot),H=$('#lo-h',slot),W=$('#lo-w',slot);
  var state={text:''};
  function fmt(n){return Math.round(n).toLocaleString('ru-RU')}
  function pulse(){var r=$('.lcalc-r',slot);if(!r||reduce)return;
    r.classList.remove('pulse');void r.offsetWidth;r.classList.add('pulse')}
  function update(){
    var t=LTYPES[+T.value]||LTYPES[0],cl=+C.value,
        area=Math.min(30000,Math.max(20,+A.value||0)),h=Math.min(30,Math.max(3,+H.value||0)),
        watts=WATTS[+W.value]||200,E=t.E[cl],U=t.U[cl];
    var flux=E*area/(t.uf*MF),per=watts*EFF,n=Math.max(1,Math.ceil(flux/per)),kw=n*watts/1000;
    var rec=h<6?'100–200 Вт':h<=10?'200–400 Вт':'400–600 Вт';
    $('#lr-n',slot).textContent=fmt(n);
    $('#lr-e',slot).textContent=fmt(E)+' лк';
    $('#lr-el',slot).textContent='целевая освещённость · '+CLASSES[cl].split(' · ')[0]+' класс';
    $('#lr-u',slot).textContent='U₀ ≥ '+U.toFixed(1).replace('.',',');
    $('#lr-flux',slot).textContent='≈ '+fmt(flux)+' лм';
    $('#lr-p',slot).textContent=(kw<10?kw.toFixed(2):fmt(kw)).replace('.',',')+' кВт';
    $('#lr-kind',slot).textContent=t.kind+' · '+rec+' при '+h+' м';
    state.text=
      'Освещение площадки — предварительный расчёт\n'+
      'Объект: '+t.name+'\n'+
      'Класс: '+CLASSES[cl]+'\n'+
      'Площадь: '+fmt(area)+' м², высота установки: '+h+' м\n'+
      'Целевая освещённость: '+fmt(E)+' лк, равномерность U0 ≥ '+U.toFixed(1)+'\n'+
      'Ориентир: '+fmt(n)+' светильников × '+watts+' Вт ('+(kw<10?kw.toFixed(2):fmt(kw))+' кВт), поток ≈ '+fmt(flux)+' лм\n'+
      'Исполнение: '+t.kind+'; '+t.ip+'\n'+
      'Прошу выполнить светотехнический расчёт и подготовить коммерческое предложение.';
    window.n7Snapshot.light={title:'Освещение · '+t.name,text:state.text};
    pulse();
  }
  [T,C,A,H,W].forEach(function(el){el.addEventListener('input',update);el.addEventListener('change',update)});
  T.addEventListener('change',function(){
    var t=LTYPES[+T.value]||LTYPES[0];A.value=t.area;W.value=String(WATTS.indexOf(t.w));update()});
  T.value='0';A.value=LTYPES[0].area;W.value=String(WATTS.indexOf(LTYPES[0].w));
  $('#lr-send',slot).onclick=function(){if(w.n7Send)w.n7Send(state.text)};
  $('#lr-copy',slot).onclick=function(){if(w.n7Copy)w.n7Copy(state.text,'Расчёт освещения скопирован')};
  update();
}

function lighting(){
  var grid=$('#lgrid');if(!grid)return;
  var items=$$('.lcard',grid),btns=$$('.lfilters button'),count=$('#lcount');
  var move=pill($('.lfilters'),btns);
  items.forEach(function(c,i){var v=$('.lvis',c);if(v)v.style.setProperty('--i',i%8)});
  btns.forEach(function(b){b.addEventListener('click',function(){
    var first=snap(items),f=b.getAttribute('data-l');
    btns.forEach(function(x){x.setAttribute('aria-pressed',String(x===b))});
    items.forEach(function(c){c.hidden=f!=='all'&&c.getAttribute('data-l')!==f});
    flipPlay(items,first);move();
    var n=items.filter(function(c){return !c.hidden}).length;
    if(count)count.textContent='Показано '+n+' из 8 типов освещения';
  })});
  var tg=$('#ltoggle');
  if(tg)tg.addEventListener('click',function(){
    var off=grid.classList.toggle('off');
    tg.setAttribute('aria-pressed',String(!off));
    tg.textContent=off?'Включить свет':'Выключить свет';
    if(w.n7Toast)w.n7Toast(off?'Свет выключен — так площадка выглядит без освещения':'Свет включён');
  });
  lightCalc();
}

function boot(){glow();catalog();lighting()}
if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',boot);else boot();
})();
