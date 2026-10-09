/* Inkpot Lane site script: phone menu, scrollable rows, the monthly-puzzle e-mail form. No tracking code lives here. */
(function(){
 var b=document.getElementById('burger'),m=document.getElementById('menu'),main=document.getElementById('main'),foot=document.querySelector('footer');
 function setInert(v){[main,foot].forEach(function(x){if(x){if(v)x.setAttribute('inert','');else x.removeAttribute('inert')}})}
 function openM(){m.classList.add('open');b.setAttribute('aria-expanded','true');b.setAttribute('aria-label','Close main menu');document.body.classList.add('menu-open');if(window.innerWidth<=920)setInert(true)}
 function closeM(back){m.classList.remove('open');b.setAttribute('aria-expanded','false');b.setAttribute('aria-label','Open main menu');document.body.classList.remove('menu-open');setInert(false);if(back)b.focus()}
 if(b&&m){
  b.addEventListener('click',function(){m.classList.contains('open')?closeM(true):openM()});
  document.addEventListener('keydown',function(e){if(e.key==='Escape'&&m.classList.contains('open')){closeM(true)}});
  m.addEventListener('click',function(e){if(e.target.closest('a')&&window.innerWidth<=920)closeM(false)});
  window.addEventListener('resize',function(){if(window.innerWidth>920&&m.classList.contains('open'))closeM(false)});
  if(/[?&]menu=open/.test(location.search))openM();
 }
 /* a sideways-scrolling row or wide table gets a tab stop only when it really scrolls (so a keyboard user can scroll it) */
 function rails(){[].slice.call(document.querySelectorAll('[data-rail]')).forEach(function(r){if(r.scrollWidth>r.clientWidth+2)r.setAttribute('tabindex','0');else r.removeAttribute('tabindex')})}
 rails();window.addEventListener('resize',rails);window.addEventListener('load',rails);
 if(document.fonts&&document.fonts.ready)document.fonts.ready.then(rails);
 if(window.ResizeObserver){[].slice.call(document.querySelectorAll('[data-rail]')).forEach(function(r){new ResizeObserver(rails).observe(r)})}
 /* the monthly puzzle e-mail form: posts to the owner's Google Form without leaving the page (the form also works without script) */
 [].slice.call(document.querySelectorAll('form.mail')).forEach(function(f){
  f.noValidate=true;
  f.addEventListener('submit',function(e){
   e.preventDefault();
   var i=f.querySelector('input[type=email]'),er=f.querySelector('.err'),ok=f.querySelector('.ok'),btn=f.querySelector('button[type=submit]'),v=i.value.trim();
   ok.textContent='';ok.className='ok';
   if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)){er.textContent='Error: please type an email address in the form name@example.com, then press the button again.';er.className='err on';i.setAttribute('aria-invalid','true');i.focus();return}
   er.className='err';er.textContent='';i.removeAttribute('aria-invalid');
   var old=btn.textContent;btn.disabled=true;btn.textContent='Sending...';
   var body=new URLSearchParams();body.set(f.getAttribute('data-entry'),v);body.set('fvv','1');body.set('pageHistory','0');
   fetch(f.getAttribute('action'),{method:'POST',mode:'no-cors',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:body.toString()}).then(function(){
    i.value='';btn.disabled=false;btn.textContent=old;
    ok.textContent='Thank you. Your address is on the list. Next month’s puzzle pack will come to you by email, and the current one is on the free puzzles page.';
    setTimeout(function(){ok.className='ok on'},60);
   }).catch(function(){
    btn.disabled=false;btn.textContent=old;
    er.textContent='Error: we could not send that just now. Please check your connection and try again, or use the plain form link below.';er.className='err on';
   });
  });
 });
})();
