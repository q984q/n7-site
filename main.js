(function(){

var d=document,r=d.documentElement,$=function(s){return d.querySelector(s)};
/* тема */
var saved=null;try{saved=localStorage.getItem('n7-theme')}catch(e){}
r.dataset.theme=saved||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');
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
/* фото: пути к файлам WebP. projects: галерея проектов, products: каталог; порядок как на странице */
var PHOTOS={hero:'',projects:[],products:[]}; /* пример: {hero:'img/hero.webp',projects:['img/p1.webp'],products:['img/c1.webp']} */
var hp=$('.hero-photo');if(PHOTOS.hero&&hp){hp.style.backgroundImage='url("'+PHOTOS.hero+'")';hp.classList.add('on')}
function put(list,sel){var gs=d.querySelectorAll(sel);list.forEach(function(u,i){var g=gs[i];if(!u||!g)return;var im=d.createElement('img');im.src=u;im.alt=g.querySelector('b').textContent;im.width=800;im.height=600;im.loading='lazy';g.querySelector('.ph').appendChild(im)})}
put(PHOTOS.projects,'.grid:not(.cat) figure');put(PHOTOS.products,'.cat figure');
var qp=new URLSearchParams(location.search).get('p'),mg=$('#msg');if(qp&&mg)mg.value='Интересует: '+qp;
/* форма */
var ENDPOINT='[FORMSPREE_URL]'; /* например https://formspree.io/f/xxxx */
var f=$('#lead'),st=$('#status');
function show(t,bad){st.hidden=false;st.className=bad?'bad':'';st.textContent=t}
function chk(id,bad,msg,s){var el=d.getElementById(id),e=d.getElementById(id+'-e');el.setAttribute('aria-invalid',bad);e.textContent=bad?msg:'';if(bad&&s.ok){el.focus();s.ok=false}}
f&&f.addEventListener('submit',function(e){
e.preventDefault();var s={ok:true};
chk('fname',$('#fname').value.trim().length<2,'Введите имя',s);
chk('phone',$('#phone').value.replace(/\D/g,'').length<10,'Введите телефон: не меньше 10 цифр',s);
chk('agree',!$('#agree').checked,'Нужно согласие на обработку данных',s);
if(!s.ok){show('Проверьте поля, отмеченные ошибкой.',true);return}
var btn=$('#send');btn.disabled=true;
if(ENDPOINT.charAt(0)==='['){btn.disabled=false;show('Онлайн-отправка пока не подключена. Позвоните нам: +7 (777) 884-88-18 или +7 (747) 534-40-14 — подготовим расчёт.',true);return}
fetch(ENDPOINT,{method:'POST',body:new FormData(f),headers:{Accept:'application/json'}})
.then(function(x){if(!x.ok)throw 0;f.reset();show('Спасибо! Заявка отправлена. Мы свяжемся с вами в ближайшее время.')})
.catch(function(){show('Не удалось отправить заявку. Позвоните нам: +7 (777) 884-88-18 или +7 (747) 534-40-14.',true)})
.then(function(){btn.disabled=false});
});
})();