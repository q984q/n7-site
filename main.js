(function(){

var d=document,r=d.documentElement,$=function(s){return d.querySelector(s)};
/* тема */
var saved=null;try{saved=localStorage.getItem('n7-theme')}catch(e){}
r.dataset.theme=saved||'dark';
$('#theme').onclick=function(){var t=r.dataset.theme==='dark'?'light':'dark';r.dataset.theme=t;try{localStorage.setItem('n7-theme',t)}catch(e){}};
addEventListener('scroll',function(){$('header').classList.toggle('s',scrollY>8)},{passive:true});
/* меню */
var m=$('#menu'),b=$('#burger');
function close(){m.removeAttribute('data-open');b.setAttribute('aria-expanded','false')}
b.onclick=function(){var o=m.toggleAttribute('data-open');b.setAttribute('aria-expanded',o)};
m.addEventListener('click',function(e){if(e.target.tagName==='A')close()});
d.addEventListener('keydown',function(e){if(e.key==='Escape')close()});
/* фильтр */
var bs=d.querySelectorAll('.filters button'),fs=d.querySelectorAll('.grid figure');
bs.forEach(function(x){x.onclick=function(){bs.forEach(function(y){y.setAttribute('aria-pressed',y===x)});
fs.forEach(function(f){f.hidden=x.dataset.f!=='all'&&f.dataset.t!==x.dataset.f})}});
/* фото: paths to WebP files. projects: галерея проектов, products: каталог; порядок как на странице */
var PHOTOS={hero:'',projects:[],products:[]}; /* пример: {hero:'img/hero.webp',projects:['img/p1.webp'],products:['img/c1.webp']} */
var hp=$('.hero-photo');if(PHOTOS.hero&&hp){hp.style.backgroundImage='url("'+PHOTOS.hero+'")';hp.classList.add('on')}
function put(list,sel){var gs=d.querySelectorAll(sel);list.forEach(function(u,i){var g=gs[i];if(!u||!g)return;var im=d.createElement('img');im.src=u;im.alt=g.querySelector('b').textContent;im.width=800;im.height=600;im.loading='lazy';g.querySelector('.ph').appendChild(im)})}
put(PHOTOS.projects,'.grid:not(.cat) figure');put(PHOTOS.products,'.cat figure');
var qp=new URLSearchParams(location.search).get('p'),mg=$('#msg');if(qp&&mg)mg.value='Интересует: '+qp;

/* ---------------- форма заявки ----------------
   ENDPOINT: публичный URL серверного прокси (tools/telegram-proxy/).
   Токен бота НЕ находится в этом файле и вообще в репозитории — он живёт
   в секретах Cloudflare Worker. Задать endpoint можно двумя способами:
     window.N7_LEAD_ENDPOINT = 'https://…workers.dev'
     <form id="lead" data-endpoint="https://…workers.dev">
   Пока endpoint не задан, работает резервный сценарий без сервера:
   браузер собирает текст заявки и открывает WhatsApp с готовым сообщением.   */
var f=$('#lead'),st=$('#status');
var ENDPOINT=String((window.N7_LEAD_ENDPOINT||'')||(f&&f.getAttribute('data-endpoint'))||'').trim();
var WA='77778848818';
var TEL1='+7 (777) 884-88-18',TEL2='+7 (747) 534-40-14';

function show(t,bad){st.hidden=false;st.className=bad?'bad':'';st.textContent=t}
function chk(id,bad,msg,s){var el=d.getElementById(id),e=d.getElementById(id+'-e');el.setAttribute('aria-invalid',bad);e.textContent=bad?msg:'';if(bad&&s.ok){el.focus();s.ok=false}}
function leadText(){
var name=$('#fname').value.trim(),phone=$('#phone').value.trim(),work=$('#work').value,msg=$('#msg').value.trim();
var t='Заявка с сайта N7 Construction\nИмя: '+name+'\nТелефон: '+phone+'\nНаправление: '+work+(msg?'\nКомментарий: '+msg:'');
/* если посетитель собрал лист подбора / прошёл квиз — прикладываем к заявке */
try{
  if(window.n7List&&window.n7List.count&&window.n7List.count()){
    var ls=window.n7List.all().map(function(x,i){return (i+1)+'. '+x.title+'\n'+String(x.text||'').slice(0,220)}).join('\n');
    t+='\n\nЛист подбора:\n'+ls.slice(0,1600);
  }
}catch(e){}
return t;
}
function leadPayload(){
  var p={name:$('#fname').value.trim(),phone:$('#phone').value.trim(),work:$('#work').value,
    msg:$('#msg').value.trim(),page:d.title,url:location.href,text:leadText(),ts:new Date().toISOString()};
  try{
    if(window.n7List&&window.n7List.count&&window.n7List.count()){
      p.list=window.n7List.all().map(function(x,i){return (i+1)+'. '+x.title+' — '+String(x.text||'').slice(0,160)}).join('\n').slice(0,1600);
    }
  }catch(e){}
  return p;
}
function fallback(){
var text=leadText(),url='https://wa.me/'+WA+'?text='+encodeURIComponent(text);
st.hidden=false;st.className='';
st.textContent='Заявка подготовлена. Отправьте её в WhatsApp или позвоните нам: '+TEL1+', '+TEL2+'.';
var box=d.createElement('div');box.className='fbtns';
var a=d.createElement('a');a.className='btn';a.href=url;a.target='_blank';a.rel='noopener';a.textContent='Отправить в WhatsApp';
var copy=d.createElement('button');copy.className='ib';copy.type='button';copy.textContent='Скопировать текст';
copy.onclick=function(){
var done=function(){copy.textContent='Скопировано';if(window.n7Toast)window.n7Toast('Текст заявки скопирован')},fail=function(){copy.textContent='Выделите текст вручную'};
if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(text).then(done,fail)}
else{var ta=d.createElement('textarea');ta.value=text;ta.style.position='fixed';ta.style.opacity='0';d.body.appendChild(ta);ta.select();try{d.execCommand('copy')?done():fail()}catch(e){fail()}d.body.removeChild(ta)}
};
var call=d.createElement('a');call.className='ib';call.href='tel:+77778848818';call.textContent='Позвонить';
box.appendChild(a);box.appendChild(copy);box.appendChild(call);st.appendChild(box);
var pre=d.createElement('pre');pre.className='leadtext';pre.textContent=text;st.appendChild(pre);
try{window.open(url,'_blank','noopener')}catch(e){}
}

f&&f.addEventListener('submit',function(e){
e.preventDefault();var s={ok:true};
chk('fname',$('#fname').value.trim().length<2,'Введите имя',s);
chk('phone',$('#phone').value.replace(/\D/g,'').length<10,'Введите телефон: не меньше 10 цифр',s);
chk('agree',!$('#agree').checked,'Нужно согласие на обработку данных',s);
if(!s.ok){show('Проверьте поля, отмеченные ошибкой.',true);return}
var btn=$('#send');btn.disabled=true;
if(!ENDPOINT){btn.disabled=false;fallback();return}
fetch(ENDPOINT,{method:'POST',body:JSON.stringify(leadPayload()),
  headers:{'Content-Type':'application/json',Accept:'application/json'}})
.then(function(x){if(!x.ok)throw 0;return x.json()})
.then(function(j){if(!j||j.ok===false)throw 0;f.reset();show('Спасибо! Заявка отправлена. Мы свяжемся с вами в ближайшее время.')})
.catch(function(){btn.disabled=false;fallback()})
.then(function(){btn.disabled=false});
});

/* Регистрация service worker отключена: он перехватывал навигацию и мог вернуть
   заглушку вместо сайта / закрепить старый CSS после деплоя. Очищаем уже установленные SW. */
if('serviceWorker' in navigator&&/^https:/.test(location.protocol)){
  addEventListener('load',function(){
    try{navigator.serviceWorker.getRegistrations().then(function(rs){
      rs.forEach(function(r){if(r.scope.indexOf(location.origin)===0)r.unregister()})
    }).catch(function(){})}catch(e){}
  });
}
})();
