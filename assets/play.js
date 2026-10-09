/* Inkpot Lane puzzle levels (/play/): endless word search and whodunit levels from levels.js, progress in store.js.
   Keyboard: the word-search grid is one tab stop (arrow keys move, Enter or Space picks); every puzzle also has a typed or
   plain-text route; results are announced in words. No timer unless the player switches it on; nothing is sent to us except
   anonymous Google Analytics counts (level started, level solved, hint used). */
(function(){
'use strict';
var LV=window.InkpotLevels,ST=window.InkpotStore,root=document.getElementById('pl-root');if(!LV||!ST||!root)return;
function $(i){return document.getElementById(i)}
function el(tag,attrs,text){var e=document.createElement(tag);if(attrs)for(var k in attrs){if(k==='cls')e.className=attrs[k];else e.setAttribute(k,attrs[k])}if(text!=null)e.textContent=text;return e}
function ev(n,p){try{if(window.gtag)window.gtag('event',n,p||{})}catch(e){}}
var qt=(location.search.match(/[?&]type=(ws|wd)/)||[])[1],D=ST.load(),type=qt||((D.lastType==='wd'||D.lastType==='ws')?D.lastType:'ws'),level=D.currentLevel[type],P=null,st=null,timer={on:false,t0:0,iv:null};
var status=$('pl-status'),box=$('pl-puzzle'),done=$('pl-done'),hintB=$('pl-hint'),showB=$('pl-show'),timeB=$('pl-timer'),clockEl=$('pl-clock');
function say(t){status.textContent='';setTimeout(function(){status.textContent=t},30)}
function save(complete){D.lastType=type;if(complete)ST.touch(D);ST.save(D,{complete:!!complete});drawTally()}   /* the day streak counts days with a solved level */
function drawTally(){$('pl-stars').textContent=D.stars;$('pl-coins').textContent=D.coins;$('pl-streak').textContent=D.streak.days||0;
 $('pl-best-ws').textContent=D.currentLevel.ws;$('pl-best-wd').textContent=D.currentLevel.wd}
function stars(n){return n>0?new Array(n+1).join('★')+new Array(4-n).join('☆'):'no stars'}
/* ---------------------------------------------------------------- level header + type switch */
var tabs=[].slice.call(document.querySelectorAll('[data-type]'));
tabs.forEach(function(b){b.addEventListener('click',function(){if(b.getAttribute('data-type')===type)return;type=b.getAttribute('data-type');level=D.currentLevel[type];start(true)})});
$('pl-go').addEventListener('submit',function(e){e.preventDefault();var v=parseInt($('pl-goto').value,10),max=D.currentLevel[type];
 if(!(v>=1&&v<=max)){say('Type a level from 1 to '+max+'. Levels open one at a time as you solve them.');$('pl-goto').focus();return}level=v;start(true)});
/* ---------------------------------------------------------------- timer (optional, counts up only) */
function fmt(ms){var s=Math.round(ms/1000),m=Math.floor(s/60);s%=60;return m+' min '+(s<10?'0':'')+s+' s'}
function timing(on){timer.on=on;timeB.setAttribute('aria-pressed',on?'true':'false');timeB.textContent=on?'Stop timing me':'Time myself (optional)';
 if(timer.iv){clearInterval(timer.iv);timer.iv=null}if(on){timer.t0=Date.now();clockEl.hidden=false;timer.iv=setInterval(function(){clockEl.textContent='Time so far: '+fmt(Date.now()-timer.t0)},1000);clockEl.textContent='Time so far: 0 min 00 s'}
 else{clockEl.hidden=true;clockEl.textContent=''}}
timeB.addEventListener('click',function(){var on=timeB.getAttribute('aria-pressed')!=='true';timing(on);
 say(on?'Timer on. It only counts; there is no time limit.':'Timer off.')});
/* ---------------------------------------------------------------- start a level */
function start(focus){try{P=LV.level(type,level)}catch(err){/* a level the generator cannot make (none known up to 3,000): move on, never stop the player */
  level++;D.currentLevel[type]=Math.max(D.currentLevel[type],level);return start(focus)}st={hints:0,wrong:0,found:{},picked:null,crossed:{},guesses:[],over:false};
 tabs.forEach(function(b){b.setAttribute('aria-pressed',b.getAttribute('data-type')===type?'true':'false')});
 $('pl-goto').max=D.currentLevel[type];$('pl-goto').value='';
 $('pl-h').textContent='Level '+level+(P.boss?': milestone level':'')+' · '+(type==='ws'?'Word search':'Whodunit');
 var info=[];if(type==='ws'){info.push(P.size+' by '+P.size+' grid, '+P.words.length+' words. Theme: '+P.theme+'.');info.push('Words run '+P.dirs.map(function(d){return LV.DIR_WORDS[d]}).join(', ')+'.');
  if(P.message)info.push('Hidden message: when every word is found, the leftover letters, read row by row, spell a message.');if(P.decoys.length)info.push('Watch for decoys: near-misses that stop one letter short.')}
 else{info.push(P.suspects.length+' suspects, '+P.clues.length+' clues.'+(P.decoyColumn?' One column is not used by any clue.':''))}
 $('pl-info').textContent=info.join(' ');$('pl-twist').textContent=P.twist||'';$('pl-twist').hidden=!P.twist;
 done.hidden=true;box.innerHTML='';hintB.disabled=false;showB.disabled=false;drawHint();
 if(type==='ws')renderWS();else renderWD();
 if(timer.on)timing(true);ev('pl_start',{puzzle_type:type,level:level});D.lastType=type;save();
 if(focus)$('pl-h').focus()}
function drawHint(){hintB.textContent=D.coins>0?'Hint (costs 1 coin, you have '+D.coins+')':'No coins left: solve a level to earn one';hintB.disabled=D.coins<=0||st.over}
/* ---------------------------------------------------------------- word search */
function renderWS(){var N=P.size,g=el('div',{cls:'pl-grid',id:'pl-grid',role:'group','aria-label':'Word search grid, '+N+' rows by '+N+' columns','aria-describedby':'pl-keys'});
 g.style.setProperty('--n',N);g.style.setProperty('--fs',(N<=9?24:N<=11?21:N<=13?19:17)+'px');
 var cur=[0,0];
 for(var r=0;r<N;r++)for(var c=0;c<N;c++){var b=el('button',{type:'button','data-cell':'1','data-min':'32','data-r':r,'data-c':c,'aria-label':'Row '+(r+1)+', column '+(c+1)+', letter '+P.rows[r][c]},P.rows[r][c]);
  b.tabIndex=(r===0&&c===0)?0:-1;b.addEventListener('click',function(){cur=[+this.getAttribute('data-r'),+this.getAttribute('data-c')];rove();pickCell(cur[0],cur[1])});g.appendChild(b)}
 function cell(r,c){return g.children[r*N+c]}
 function rove(){[].forEach.call(g.children,function(x){x.tabIndex=-1});var t=cell(cur[0],cur[1]);t.tabIndex=0;return t}
 g.addEventListener('keydown',function(e){var d={ArrowRight:[0,1],ArrowLeft:[0,-1],ArrowDown:[1,0],ArrowUp:[-1,0]}[e.key];
  if(e.key==='Home'){cur=[cur[0],0];e.preventDefault();rove().focus();return}if(e.key==='End'){cur=[cur[0],N-1];e.preventDefault();rove().focus();return}
  if(!d)return;e.preventDefault();cur=[Math.max(0,Math.min(N-1,cur[0]+d[0])),Math.max(0,Math.min(N-1,cur[1]+d[1]))];rove().focus()});
 var keys=el('p',{cls:'sr',id:'pl-keys'},'Arrow keys move. Enter or Space picks the first letter of a word, then its last letter.');
 var wrap=el('div',{cls:'pl-gridwrap','data-rail':'',role:'group','aria-label':'Puzzle grid area, scrolls sideways on a narrow screen'});wrap.appendChild(g);
 var list=el('ul',{cls:'words pl-words','aria-label':'Words to find'});P.words.forEach(function(w){var li=el('li',{'data-w':w},w);li.appendChild(el('span',{cls:'sr'}));list.appendChild(li)});
 var count=el('p',{cls:'pl-count',id:'pl-count'},'0 of '+P.words.length+' words found.');
 /* typed route */
 var det=el('details',{cls:'pz-text pl-typed'});det.appendChild(el('summary',null,'Find words by typing their start and end positions'));
 det.appendChild(el('p',null,'The grid has '+N+' rows and '+N+' columns. Each line below is one row, read left to right.'));
 var ol=el('ol',{cls:'rowtext pl-rowtext','aria-label':'The grid as text, one row per line'});P.rows.forEach(function(row,i){ol.appendChild(el('li',{'aria-label':'Row '+(i+1)+': '+row.split('').join(', ')},row.split('').join(' ')))});det.appendChild(ol);
 det.appendChild(el('p',null,'To mark a word, type the row and column of its first letter and of its last letter (numbers 1 to '+N+'; row 1 is the top row, column 1 the left column), then press the button.'));
 var f=el('div',{cls:'pz-fields'});[['tr1','First letter, row'],['tc1','First letter, column'],['tr2','Last letter, row'],['tc2','Last letter, column']].forEach(function(x){
  var lb=el('label',null,x[1]+' ');var inp=el('input',{id:'pl-'+x[0],type:'number',min:'1',max:String(N),inputmode:'numeric'});lb.appendChild(inp);f.appendChild(lb)});det.appendChild(f);
 var tm=el('button',{cls:'pz-btn',type:'button'},'Mark this word');det.appendChild(tm);
 tm.addEventListener('click',function(){var v=['tr1','tc1','tr2','tc2'].map(function(i){return parseInt($('pl-'+i).value,10)});
  if(v.some(function(x){return !(x>=1&&x<=N)})){say('Please type a number from 1 to '+N+' in all four boxes.');$('pl-tr1').focus();return}
  st.picked=null;pickCell(v[0]-1,v[1]-1);pickCell(v[2]-1,v[3]-1)});
 box.appendChild(keys);box.appendChild(wrap);box.appendChild(list);box.appendChild(count);box.appendChild(det);
 function line(a,b){var dr=b[0]-a[0],dc=b[1]-a[1],n=Math.max(Math.abs(dr),Math.abs(dc));if(n===0||(dr!==0&&dc!==0&&Math.abs(dr)!==Math.abs(dc)))return null;
  var sr=Math.sign(dr),sc=Math.sign(dc),o=[];for(var i=0;i<=n;i++)o.push([a[0]+sr*i,a[1]+sc*i]);return o}
 function markWord(w,cells){st.found[w]=1;cells.forEach(function(x){var q=cell(x[0],x[1]);q.classList.add('found');if(q.getAttribute('aria-label').indexOf('found word')<0)q.setAttribute('aria-label',q.getAttribute('aria-label')+', part of found word '+w)});
  var li=list.querySelector('[data-w="'+w+'"]');li.className='done';li.querySelector('.sr').textContent=' (found)';
  count.textContent=Object.keys(st.found).length+' of '+P.words.length+' words found.'}
 function pickCell(r,c){if(st.over)return;if(!st.picked){st.picked=[r,c];cell(r,c).setAttribute('aria-pressed','true');say('First letter chosen: '+P.rows[r][c]+', row '+(r+1)+', column '+(c+1)+'. Now choose the last letter.');return}
  var a=st.picked;cell(a[0],a[1]).removeAttribute('aria-pressed');st.picked=null;var cells=line(a,[r,c]);
  if(!cells){say('Those two letters are not in a straight line. Choose a first letter to try again.');return}
  var s=cells.map(function(x){return P.rows[x[0]][x[1]]}).join(''),rev=s.split('').reverse().join('');
  var w=P.words.filter(function(x){return x===s||x===rev})[0];
  if(w&&!st.found[w]){markWord(w,cells);var n=Object.keys(st.found).length;if(n===P.words.length){finish(false);return}say('Found '+w+', '+n+' of '+P.words.length+' words.')}
  else if(w)say(w+' is already found.');else say('That is not one of the words. Try again.')}
 st.cellsOf=function(w){var i=P.words.indexOf(w),pl=P.place[i],d=LV.DIRS[pl.d],o=[];for(var k=0;k<w.length;k++)o.push([pl.r+d[0]*k,pl.c+d[1]*k]);return o};
 st.hint=function(){var w=P.words.filter(function(x){return !st.found[x]})[0];var c0=st.cellsOf(w)[0];[].forEach.call(g.querySelectorAll('.hint'),function(x){x.classList.remove('hint')});
  var q=cell(c0[0],c0[1]);q.classList.add('hint');cur=c0;rove();say('Hint: '+w+' starts at row '+(c0[0]+1)+', column '+(c0[1]+1)+'. That letter now has a dotted ring.')};
 st.reveal=function(){P.words.forEach(function(w){if(!st.found[w])markWord(w,st.cellsOf(w))})};
 st.solvedText=function(){return 'All '+P.words.length+' words found.'+(P.message?' The leftover letters spell: '+P.message+'.':'')};
}
/* ---------------------------------------------------------------- whodunit */
var COLNAME={colour:'Scarf',item:'Carrying',street:'Lives on',time:'Left at'};
function renderWD(){box.appendChild(el('p',{cls:'pl-story'},P.story));
 var tb=el('table',{cls:'wd-table pl-table','aria-labelledby':'pl-sus-h'}),th=el('thead'),tr=el('tr');tr.appendChild(el('th',{scope:'col'},'Suspect'));
 var cols=P.columns.filter(function(c){return c!=='job'});cols.forEach(function(c){tr.appendChild(el('th',{scope:'col'},COLNAME[c]))});th.appendChild(tr);tb.appendChild(th);
 var body=el('tbody');P.suspects.forEach(function(s,i){var row=el('tr'),h=el('th',{scope:'row'});var b=el('button',{cls:'wd-x',type:'button','aria-pressed':'false','aria-label':'Cross off '+s.name});
  b.appendChild(el('span',{cls:'nm'},s.name));b.appendChild(el('span',{cls:'xm'}));b.addEventListener('click',function(){cross(i,b.getAttribute('aria-pressed')!=='true',true)});
  h.appendChild(b);h.appendChild(el('span',{cls:'jb'},s.job));row.appendChild(h);cols.forEach(function(c){row.appendChild(el('td',null,c==='time'?s.left:s[c]))});body.appendChild(row)});
 tb.appendChild(body);var h3=el('h3',{id:'pl-sus-h',cls:'pl-sub'},'The '+P.suspects.length+' suspects');box.appendChild(h3);
 var tw=el('div',{cls:'wd-tablewrap pl-tablewrap','data-rail':'',role:'group','aria-label':'Suspects table, scrolls sideways on a narrow screen'});tw.appendChild(tb);box.appendChild(tw);
 box.appendChild(el('h3',{id:'pl-clue-h',cls:'pl-sub'},'The '+P.clues.length+' clues'));
 var ol=el('ol',{cls:'wd-clues','aria-labelledby':'pl-clue-h'});P.clues.forEach(function(c){ol.appendChild(el('li',null,c.text))});box.appendChild(ol);
 var rd=el('details',{cls:'pz-text wd-read'});rd.appendChild(el('summary',null,'How to read a clue exactly'));
 ['After a time means later than it: someone who left at exactly that time is ruled out.','"Before the baker did" can never be the baker: nobody leaves before themselves. It also rules out everyone who left after the baker.','An "if" clue only rules out someone who matches its first half and breaks its second half. It says nothing about anyone else.',"The Scarf column is the colour of each person’s scarf. A column that no clue mentions does not matter."].forEach(function(t){rd.appendChild(el('p',null,t))});box.appendChild(rd);
 var form=el('form',{cls:'wd-form',novalidate:''}),fs=el('fieldset');fs.appendChild(el('legend',null,P.question));var opts=el('div',{cls:'wd-opts'});
 P.suspects.forEach(function(s,i){var lb=el('label',{cls:'wd-opt'});var inp=el('input',{type:'radio',name:'pl-who',value:String(i)});lb.appendChild(inp);lb.appendChild(el('span',{cls:'dot','aria-hidden':'true'}));
  lb.appendChild(el('span',{cls:'on'},s.name));lb.appendChild(el('span',{cls:'wd-tag',id:'pl-tag'+i}));opts.appendChild(lb)});fs.appendChild(opts);form.appendChild(fs);
 var sub=el('button',{cls:'btn btn-primary',type:'submit'},'Check my answer');form.appendChild(sub);box.appendChild(form);
 var radios=[].slice.call(form.querySelectorAll('input'));
 function cross(i,on,announce){var b=body.children[i].querySelector('.wd-x');b.setAttribute('aria-pressed',on?'true':'false');body.children[i].classList.toggle('out',on);
  b.querySelector('.xm').textContent=on?' (crossed off)':'';st.crossed[i]=on;if(announce)say(P.suspects[i].name+(on?' crossed off.':' is back on the list.'))}
 form.addEventListener('submit',function(e){e.preventDefault();if(st.over)return;var r=radios.filter(function(x){return x.checked})[0];
  if(!r){say('Please choose a name first, then press Check my answer.');radios[0].focus();return}var i=+r.value;
  if(i===P.culprit){finish(false);return}
  if(st.guesses.indexOf(i)<0){st.guesses.push(i);st.wrong++}$('pl-tag'+i).textContent='Not this one: clue '+P.wrong[i].c;cross(i,true,false);
  say('Not '+P.suspects[i].name+'. '+P.wrong[i].t+' Try another name.')});
 st.hint=function(){var i=P.suspects.map(function(_,k){return k}).filter(function(k){return k!==P.culprit&&!st.crossed[k]})[0];
  if(i===undefined){say('Everyone but one is already crossed off. Choose the name that is left.');return false}cross(i,true,false);$('pl-tag'+i).textContent='Not this one: clue '+P.wrong[i].c;say('Hint: '+P.wrong[i].t+' '+P.suspects[i].name+' is now crossed off.')};
 st.reveal=function(){radios.forEach(function(r){r.disabled=true});sub.disabled=true};
 st.lock=function(){radios.forEach(function(r){r.disabled=true});sub.disabled=true};
 st.solvedText=function(){return P.suspects[P.culprit].name+' took it. '+P.walk.join(' ')};
}
/* ---------------------------------------------------------------- hints, answer, finishing */
hintB.addEventListener('click',function(){if(st.over||D.coins<=0)return;if(st.hint()===false)return;st.hints++;D.coins--;D.hintsUsed++;save();drawHint();ev('pl_hint',{puzzle_type:type,level:level})});
showB.addEventListener('click',function(){if(st.over)return;st.reveal();finish(true)});
var BADGE=['','Sharp Eye','Lantern Bearer','Clue Keeper','Village Sleuth','Master of the Lane'];
function finish(revealed){st.over=true;if(st.lock)st.lock();hintB.disabled=true;showB.disabled=true;
 var earned=revealed?0:Math.max(1,3-st.hints-st.wrong),prev=D.levelsDone[type][level]|0,coins=revealed?0:(P.boss?3:1);
 if(earned>prev)D.levelsDone[type][level]=earned;D.stars=ST.starsOf(D);D.coins+=coins;
 var unlocked=false;if(level>=D.currentLevel[type]){D.currentLevel[type]=level+1;unlocked=true}
 var badge='';if(!revealed&&P.boss){var id=type+'-'+level;if(D.badges.indexOf(id)<0)D.badges.push(id);badge=(BADGE[Math.min(BADGE.length-1,level/10)]||'Milestone')+' badge for level '+level+'.'}
 var tm=timer.on?' Your time: '+fmt(Date.now()-timer.t0)+'.':'';if(timer.iv){clearInterval(timer.iv);timer.iv=null}
 save(true);ev(revealed?'pl_reveal':'pl_solve',{puzzle_type:type,level:level,stars:earned,hints:st.hints});
 done.hidden=false;$('pl-done-h').textContent=revealed?'Here is the answer.':'Level '+level+' solved.';
 $('pl-done-stars').textContent=revealed?'Answer shown, so no stars this time. You can still go on to level '+(level+1)+'.':'You earned '+stars(earned)+' ('+earned+' of 3 stars'+(coins?', and '+coins+' coin'+(coins>1?'s':''):'')+').'+tm;
 $('pl-done-text').textContent=st.solvedText();$('pl-badge').textContent=badge;$('pl-badge').hidden=!badge;
 $('pl-next').textContent='Go on to level '+(level+1);
 /* the 'from the book' showcase: after levels 3 and 6, then every tenth level; never in the way of the Next button */
 var sc=$('pl-showcase');sc.innerHTML='';sc.hidden=true;if(level===3||level===6||level%10===0){var tpl=document.querySelectorAll('template[data-lane="'+type+'"]');
  if(tpl.length){var t=tpl[(level===3?0:level===6?1:Math.floor(level/10)+1)%tpl.length];sc.appendChild(t.content.cloneNode(true));sc.hidden=false;
   var bid=t.getAttribute('data-book');if(D.bookShowcaseSeen.indexOf(bid)<0){D.bookShowcaseSeen.push(bid);save()}
   [].forEach.call(sc.querySelectorAll('a'),function(a){a.addEventListener('click',function(){ev('pl_book',{book:bid,level:level})})})}}
 say((revealed?'Answer shown. ':'Solved. ')+$('pl-done-stars').textContent+(badge?' '+badge:''));done.focus()}
$('pl-next').addEventListener('click',function(){level=level+1;start(true)});
$('pl-again').addEventListener('click',function(){start(true)});
[].forEach.call(document.querySelectorAll('.pl-hub a'),function(a){a.addEventListener('click',function(){ev(a.getAttribute('data-ev'))})});
if(/[?&]utm_source=|[?&]from=/.test(location.search)||document.referrer.indexOf('instagram')>-1||document.referrer.indexOf('facebook')>-1)ev('hub_landing',{via:document.referrer?'referrer':'tagged link'});
drawTally();start(false);
})();
