/* Inkpot Lane whodunit challenge (/whodunit/). No timer, no account, nothing sent to us: progress is kept in this browser only.
   Google Analytics (already on every page, see /privacy/) gets anonymous counts: answer checked, hint opened, answer shown, result copied. */
(function(){
 var el=document.getElementById('wd-data');if(!el)return;
 var D;try{D=JSON.parse(decodeURIComponent(escape(atob(el.textContent.trim()))))}catch(e){return}
 /* Progress store: the ONLY place progress is read or written. Today it is this browser's localStorage, keyed by puzzle id;
    a later level ladder (stars, accounts) replaces these two functions and nothing else. It never throws: a private window
    or blocked storage just means progress is not remembered. */
 var Progress=window.InkpotProgress||(window.InkpotProgress={
  get:function(id){try{return JSON.parse(localStorage.getItem('il-p-'+id)||'null')}catch(e){return null}},
  set:function(id,v){try{localStorage.setItem('il-p-'+id,JSON.stringify(v))}catch(e){}}});
 function fresh(){return{g:[],h:0,r:false,x:[],ts:0,t:0}}
 var S=fresh();
 function $(i){return document.getElementById(i)}
 function load(){var v=Progress.get(D.id);if(v&&v.g)S=v}
 function save(){S.solved=solved();Progress.set(D.id,S)}
 function ev(n,p){try{if(window.gtag){p=p||{};p.case_no=D.no;window.gtag('event',n,p)}}catch(e){}}
 var form=$('wd-form'),status=$('wd-status'),hintBtn=$('wd-hint'),showBtn=$('wd-show'),hintList=$('wd-hints'),done=$('wd-done');
 var xs=[].slice.call(document.querySelectorAll('.wd-x')),radios=[].slice.call(document.querySelectorAll('input[name=who]'));
 function say(t){status.textContent='';setTimeout(function(){status.textContent=t},30)}
 function solved(){return S.g.indexOf(D.c)>-1}
 function finished(){return solved()||S.r}
 function cross(i,on){var b=xs[i];if(!b)return;b.setAttribute('aria-pressed',on?'true':'false');
  var row=b.closest('tr');if(row)row.classList.toggle('out',on);var m=b.querySelector('.xm');if(m)m.textContent=on?' (crossed off)':''}
 xs.forEach(function(b,i){b.addEventListener('click',function(){var on=b.getAttribute('aria-pressed')!=='true';cross(i,on);
  var k=S.x.indexOf(i);if(on&&k<0)S.x.push(i);if(!on&&k>-1)S.x.splice(k,1);save();
  say(D.names[i]+(on?' crossed off.':' is back on the list.'))})});
 function tag(i){var t=$('wd-tag'+i);if(t&&D.w[i])t.textContent='Not this one: clue '+D.w[i].c}
 function hintsLeft(){return D.hints.length-S.h}
 function drawHints(){hintList.innerHTML='';for(var k=0;k<S.h;k++){var li=document.createElement('li');li.textContent=D.hints[k];hintList.appendChild(li)}
  hintList.hidden=S.h===0;var n=hintsLeft();
  hintBtn.textContent=n>0?(S.h===0?'Give me a hint':'Give me another hint')+' ('+n+' left)':'No hints left';hintBtn.disabled=n<=0||finished();
  showBtn.disabled=finished()}
 function ordinal(n){return['first','second','third','fourth','fifth','sixth','seventh'][n-1]||(n+'th')}
 /* optional timer: off unless the player switches it on; it only counts up, never limits anything */
 var tb=$('wd-timer'),clock=$('wd-clock'),tick=null;
 function fmt(ms){var s=Math.round(ms/1000),m=Math.floor(s/60);s=s%60;return m+' min '+(s<10?'0':'')+s+' s'}
 function drawClock(){if(!S.ts){clock.textContent='';clock.hidden=true;return}clock.hidden=false;clock.textContent=(S.t?'Your time: ':'Time so far: ')+fmt((S.t||Date.now())-S.ts)}
 function timing(on){S.ts=on?(S.ts||Date.now()):0;S.t=0;tb.setAttribute('aria-pressed',on?'true':'false');tb.textContent=on?'Stop timing me':'Time myself (optional)';
  if(tick){clearInterval(tick);tick=null}if(on&&!finished())tick=setInterval(drawClock,1000);drawClock()}
 tb.addEventListener('click',function(){if(finished())return;var on=tb.getAttribute('aria-pressed')!=='true';timing(on);save();ev('wd_timer',{on:on});
  say(on?'Timer on. It only counts; there is no time limit. Press Stop timing me to switch it off.':'Timer off.')});
 function stopClock(){if(S.ts&&!S.t)S.t=Date.now();if(tick){clearInterval(tick);tick=null}drawClock()}
 function card(){var g=S.g.length,h=S.h,line;
  if(solved()){line=(S.g.length===1?'Solved on my first guess':'Solved on my '+ordinal(g)+' guess')+(h?', with '+h+' hint'+(h>1?'s':''):', no hints')}
  else{line='Case closed: I asked to see the answer'+(g?' after '+g+' guess'+(g>1?'es':''):'')}
  var marks=S.g.map(function(x){return x===D.c?'🟩':'⬜'}).join('')+(h?' '+new Array(h+1).join('💡'):'')+(S.r?' 📖':'');
  var tm=(solved()&&S.ts&&S.t)?'Time: '+fmt(S.t-S.ts)+' (timer switched on)\n':'';
  return 'Inkpot Lane Whodunit No. '+D.no+'\n'+D.short+'\n'+line+'\n'+tm+(marks?marks+'\n':'')+'inkpotlane.com/whodunit'}
 function showDone(focus){done.hidden=false;$('done-h').textContent=solved()?'Case solved. Well done.':'Here is the answer.';
  $('wd-reveal').textContent=D.cn+' took it.';$('wd-walk').innerHTML='';
  D.walk.forEach(function(t){var li=document.createElement('li');li.textContent=t;$('wd-walk').appendChild(li)});
  $('wd-why').textContent=D.why;$('wd-card').textContent=card();
  radios.forEach(function(r){r.disabled=true});form.querySelector('button[type=submit]').disabled=true;stopClock();tb.disabled=true;drawHints();
  if(focus){done.focus()}}
 function copyText(t,okMsg,where){function fallback(){var ta=document.createElement('textarea');ta.value=t;ta.setAttribute('readonly','');ta.style.position='fixed';ta.style.left='-9999px';
   document.body.appendChild(ta);ta.select();var ok=false;try{ok=document.execCommand('copy')}catch(e){}document.body.removeChild(ta);
   where.textContent=ok?okMsg:'Your browser would not copy it. Select the text of the card above and copy it yourself.'}
  where.textContent='';if(navigator.clipboard&&window.isSecureContext){var settled=false,tm=setTimeout(function(){if(!settled){settled=true;fallback()}},1500);
   navigator.clipboard.writeText(t).then(function(){if(!settled){settled=true;clearTimeout(tm);where.textContent=okMsg}},function(){if(!settled){settled=true;clearTimeout(tm);fallback()}})}else fallback()}
 form.addEventListener('submit',function(e){e.preventDefault();if(finished())return;
  var r=radios.filter(function(x){return x.checked})[0];
  if(!r){say('Please choose a name first, then press Check my answer.');radios[0].focus();return}
  var i=+r.value;if(S.g.indexOf(i)>-1&&i!==D.c){say('You have already tried '+D.names[i]+'. '+D.w[i].t+' Choose another name.');return}
  S.g.push(i);save();ev('wd_check',{correct:i===D.c,suspect:D.names[i],guess_no:S.g.length});
  if(i===D.c){stopClock();save();ev('wd_solve',{guesses:S.g.length,hints:S.h,timed:!!S.ts});say('Yes. '+D.cn+' took it. Your result is below.');showDone(true);return}
  tag(i);cross(i,true);if(S.x.indexOf(i)<0)S.x.push(i);save();
  say('Not '+D.names[i]+'. '+D.w[i].t+' Try another name.')});
 hintBtn.addEventListener('click',function(){if(hintsLeft()<=0||finished())return;S.h++;save();drawHints();ev('wd_hint',{hint_no:S.h});
  say('Hint '+S.h+': '+D.hints[S.h-1])});
 showBtn.addEventListener('click',function(){if(finished())return;S.r=true;stopClock();save();ev('wd_reveal',{guesses:S.g.length,hints:S.h});showDone(true)});
 $('wd-copy').addEventListener('click',function(){copyText(card(),'Copied. Paste it into a message, a post or an email. It does not give the answer away.',$('wd-copied'));ev('wd_copy')});
 $('wd-invite').addEventListener('click',function(){var t='Can you solve this whodunit? '+D.names.length+' suspects, '+D.nc+' clues, one answer, and no timer.',u='https://inkpotlane.com/whodunit/';
  if(navigator.share){navigator.share({title:'Inkpot Lane Whodunit',text:t,url:u}).then(function(){ev('wd_invite',{method:'share'})},function(){})}
  else{copyText(t+' '+u,'Copied an invitation with the link. Paste it into a message to a friend.',$('wd-copied'));ev('wd_invite',{method:'copy'})}});
 $('wd-again').addEventListener('click',function(){S=fresh();save();done.hidden=true;tb.disabled=false;timing(false);
  radios.forEach(function(r){r.disabled=false;r.checked=false});form.querySelector('button[type=submit]').disabled=false;
  xs.forEach(function(b,i){cross(i,false)});D.names.forEach(function(n,i){var t=$('wd-tag'+i);if(t)t.textContent=''});
  $('wd-copied').textContent='';drawHints();say('Started again. Everything is back on the list.');$('case-top').focus()});
 [].slice.call(document.querySelectorAll('[data-ev]')).forEach(function(a){a.addEventListener('click',function(){ev(a.getAttribute('data-ev'))})});
 load();S.x.forEach(function(i){cross(i,true)});S.g.forEach(function(i){if(i!==D.c)tag(i)});drawHints();
 if(S.ts&&!finished())timing(true);if(finished())showDone(false);
})();
