/* Мастер заявки: 3 шага вместо длинной формы, черновик в localStorage,
   переключатель «Обычная форма». Логика валидации и WhatsApp остаётся в main.js. */
(function(){
'use strict';
var d=document,w=window;
var $=function(s,c){return (c||d).querySelector(s)};
var $$=function(s,c){return Array.prototype.slice.call((c||d).querySelectorAll(s))};
function toast(m){if(w.n7Toast)w.n7Toast(m)}
var KEY='n7-draft',MODE='n7-wizard';
var f=$('#lead');
if(!f)return;

var wrap={};
$$('#lead > div').forEach(function(div){
  var c=div.querySelector('input,select,textarea');if(c)wrap[c.id]=div;
});
var send=$('#send'),note=f.querySelector('p.tnote'),status=$('#status');
if(!wrap.fname||!wrap.phone||!send)return;

function store(k,v){try{localStorage.setItem(k,v)}catch(e){}}
function read(k){try{return localStorage.getItem(k)}catch(e){return null}}
function draft(){
  var o={};['fname','phone','work','msg'].forEach(function(k){var el=$('#'+k);if(el)o[k]=el.value});
  store(KEY,JSON.stringify(o));
}
function restore(){
  try{var o=JSON.parse(read(KEY)||'{}');Object.keys(o).forEach(function(k){var el=$('#'+k);if(el&&!el.value&&o[k])el.value=o[k]})}catch(e){}
}
function err(id,msg){
  var el=$('#'+id),e=$('#'+id+'-e');
  if(!el)return false;
  var bad=!!msg;
  el.setAttribute('aria-invalid',bad?'true':'false');
  if(e)e.textContent=msg||'';
  return bad;
}
function validStep(i){
  if(i===0)return true;
  if(i===1){
    var a=err('fname',($('#fname').value.trim().length<2?'Введите имя':''));
    var b=err('phone',($('#phone').value.replace(/\D/g,'').length<10?'Введите телефон: не меньше 10 цифр':''));
    if(a)$('#fname').focus();else if(b)$('#phone').focus();
    return !a&&!b;
  }
  var c=err('agree',(!$('#agree').checked?'Нужно согласие на обработку данных':''));
  if(c){$('#agree').focus();toast('Подтвердите согласие на обработку данных')}
  return !c;
}
function build(){
  var head=d.createElement('div');head.className='wz-head';
  head.innerHTML='<div class="wz-dots"><span class="on"><i>1</i><em>Объект</em></span><span><i>2</i><em>Контакты</em></span><span><i>3</i><em>Отправка</em></span></div>'+
    '<span class="wz-now" id="wzNow">Шаг 1 из 3</span>';
  var steps=[0,1,2].map(function(i){
    var s=d.createElement('div');s.className='wz-step';s.setAttribute('data-s',i);if(i)s.hidden=true;return s;
  });
  [wrap.work,wrap.msg].forEach(function(x){if(x)steps[0].appendChild(x)});
  [wrap.fname,wrap.phone].forEach(function(x){if(x)steps[1].appendChild(x)});
  if(wrap.agree)steps[2].appendChild(wrap.agree);
  steps[2].appendChild(send);if(note)steps[2].appendChild(note);
  var nav=d.createElement('div');nav.className='wz-nav';
  nav.innerHTML='<button type="button" class="ib" id="wzBack" disabled>← Назад</button><span class="wz-hint">Черновик сохраняется автоматически</span><button type="button" class="btn" id="wzNext">Далее →</button>';
  var classic=d.createElement('button');classic.type='button';classic.className='wz-classic';classic.textContent='Заполнить обычной формой';
  f.insertBefore(head,f.firstChild);
  steps.forEach(function(s){f.insertBefore(s,status||null)});
  f.insertBefore(nav,status||null);
  f.insertBefore(classic,status||null);
  if(status)f.appendChild(status);
  return {head:head,steps:steps,nav:nav,classic:classic};
}
var i=0,ui=null;
function show(n){
  i=Math.max(0,Math.min(2,n));
  ui.steps.forEach(function(s,k){s.hidden=k!==i});
  $$('.wz-dots span',ui.head).forEach(function(s,k){s.classList.toggle('on',k<=i)});
  $('#wzNow',ui.head).textContent='Шаг '+(i+1)+' из 3';
  $('#wzBack',ui.nav).disabled=i===0;
  $('#wzNext',ui.nav).textContent=i===2?'Отправить заявку →':'Далее →';
  if(i===2)$('#wzNext',ui.nav).setAttribute('type','submit');else $('#wzNext',ui.nav).setAttribute('type','button');
}
function classicMode(on){
  f.classList.toggle('wz-off',on);store(MODE,on?'off':'on');
  ui.classic.textContent=on?'Вернуться к шагам':'Заполнить обычной формой';
  ui.head.hidden=on;ui.nav.hidden=on;
  ui.steps.forEach(function(s){s.hidden=false});
  if(!on)show(0);
}
function boot(){
  restore();
  ui=build();
  ['fname','phone','work','msg'].forEach(function(k){var el=$('#'+k);if(el)el.addEventListener('input',draft)});
  $('#wzBack',ui.nav).onclick=function(){show(i-1)};
  $('#wzNext',ui.nav).addEventListener('click',function(e){
    if($('#wzNext',ui.nav).getAttribute('type')==='submit')return; /* отдаём main.js */
    e.preventDefault();if(validStep(i))show(i+1);
  });
  ui.classic.onclick=function(){classicMode(!f.classList.contains('wz-off'))};
  /* если неверные поля остались на прошлом шаге — вернуть пользователя к ним */
  f.addEventListener('submit',function(){
    setTimeout(function(){
      var bad=$('#lead [aria-invalid="true"]');
      if(bad&&!f.classList.contains('wz-off')){
        var s=bad.closest('.wz-step');if(s)show(parseInt(s.getAttribute('data-s'),10));
      }
    },0);
  });
  show(0);
  if(read(MODE)==='off')classicMode(true);
}
if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',boot);else boot();
})();
