(function(){var dk=document.getElementById('deck');if(!dk)return;
var sl=[].slice.call(dk.querySelectorAll('.slide')),i=0,bar=dk.querySelector('.dk-bar'),cn=dk.querySelector('.dk-n'),pv=dk.querySelector('.dk-p'),nx=dk.querySelector('.dk-x'),px=null;
var hint=document.createElement('div');hint.className='dk-swipe';hint.setAttribute('aria-hidden','true');hint.textContent='Свайпните или нажмите → чтобы листать';dk.appendChild(hint);
function go(n){i=Math.max(0,Math.min(sl.length-1,n));sl.forEach(function(s,k){s.classList.toggle('on',k===i);s.setAttribute('aria-hidden',k!==i)});bar.style.width=((i+1)/sl.length*100)+'%';cn.textContent=(i+1)+' / '+sl.length;pv.disabled=i===0;nx.disabled=i===sl.length-1;if(hint&&i>0)hint.classList.add('hide')}
pv.onclick=function(){go(i-1)};nx.onclick=function(){go(i+1)};
dk.querySelector('.dk-f').onclick=function(){if(document.fullscreenElement)document.exitFullscreen();else if(dk.requestFullscreen)dk.requestFullscreen()};
dk.querySelector('.dk-pdf').onclick=function(){print()};
document.addEventListener('keydown',function(e){var t=e.target.tagName;if(t==='INPUT'||t==='TEXTAREA'||t==='SELECT'||t==='BUTTON'&&e.key===' ')return;
if(e.key==='ArrowRight'||e.key==='PageDown'||e.key===' '){e.preventDefault();go(i+1)}else if(e.key==='ArrowLeft'||e.key==='PageUp'){go(i-1)}else if(e.key==='Home'){go(0)}else if(e.key==='End'){go(sl.length-1)}else if(e.key==='f'||e.key==='F'){dk.querySelector('.dk-f').click()}});
dk.addEventListener('touchstart',function(e){px=e.touches[0].clientX},{passive:true});
dk.addEventListener('touchend',function(e){if(px===null)return;var x=e.changedTouches[0].clientX-px;px=null;if(Math.abs(x)>50)go(i+(x<0?1:-1))});
go(0)})();
