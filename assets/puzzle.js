(function(){
/* playable word search */
 var G=document.getElementById('g8');if(!G)return;
 var P={"grid": ["EUFWEOKG", "ULERHREE", "LADEBHTY", "CNUNPVTV", "RTMOIGLI", "DEOOYPEV", "ORSDEUGP", "FNSYUBDP"], "words": {"LANTERN": [[1, 1], [2, 1], [3, 1], [4, 1], [5, 1], [6, 1], [7, 1]], "KETTLE": [[0, 6], [1, 6], [2, 6], [3, 6], [4, 6], [5, 6]], "WREN": [[0, 3], [1, 3], [2, 3], [3, 3]], "CLUE": [[3, 0], [2, 0], [1, 0], [0, 0]], "MOSS": [[4, 2], [5, 2], [6, 2], [7, 2]]}},N=8,grid=P.grid,words=Object.keys(P.words);
 var status=document.getElementById('status'),list=document.getElementById('wlist'),win=document.getElementById('win'),cur=[0,0],start=null,found={};
 function idx(r,c){return r*N+c}
 function say(t){status.textContent=t}
 function build(){G.innerHTML='';start=null;found={};cur=[0,0];
  for(var r=0;r<N;r++)for(var c=0;c<N;c++){var x=document.createElement('button');x.type='button';x.textContent=grid[r][c];x.dataset.r=r;x.dataset.c=c;x.setAttribute('data-cell','1');
   x.tabIndex=(r===0&&c===0)?0:-1;x.setAttribute('aria-label','Row '+(r+1)+', column '+(c+1)+', letter '+grid[r][c]);
   x.addEventListener('click',function(){cur=[+this.dataset.r,+this.dataset.c];rove();pick(cur[0],cur[1])});G.appendChild(x)}
  [].slice.call(list.children).forEach(function(li){li.className='';li.removeAttribute('data-state');var s=li.querySelector('.sr');if(s)s.textContent=''});
  say('Choose the first letter of a word, then its last letter.');win.style.display='none'}
 function rove(){[].slice.call(G.children).forEach(function(x){x.tabIndex=-1});var t=G.children[idx(cur[0],cur[1])];t.tabIndex=0;return t}
 G.addEventListener('keydown',function(e){var d={ArrowRight:[0,1],ArrowLeft:[0,-1],ArrowDown:[1,0],ArrowUp:[-1,0]}[e.key];
  if(e.key==='Home'){cur=[cur[0],0];e.preventDefault();rove().focus();return}if(e.key==='End'){cur=[cur[0],N-1];e.preventDefault();rove().focus();return}
  if(!d)return;e.preventDefault();cur=[Math.max(0,Math.min(N-1,cur[0]+d[0])),Math.max(0,Math.min(N-1,cur[1]+d[1]))];rove().focus()});
 function line(a,b){var dr=b[0]-a[0],dc=b[1]-a[1],n=Math.max(Math.abs(dr),Math.abs(dc));
  if(n===0||(dr!==0&&dc!==0&&Math.abs(dr)!==Math.abs(dc)))return null;var sr=Math.sign(dr),sc=Math.sign(dc),o=[];for(var i=0;i<=n;i++)o.push([a[0]+sr*i,a[1]+sc*i]);return o}
 function pick(r,c){var bt=G.children;
  if(!start){start=[r,c];bt[idx(r,c)].setAttribute('aria-pressed','true');say('First letter chosen: '+grid[r][c]+', row '+(r+1)+', column '+(c+1)+'. Now choose the last letter.');return}
  var s0=start;bt[idx(s0[0],s0[1])].removeAttribute('aria-pressed');start=null;var cells=line(s0,[r,c]);
  if(!cells){say('Those two letters are not in a straight line. Choose a first letter to try again.');return}
  var s=cells.map(function(x){return grid[x[0]][x[1]]}).join(''),rev=s.split('').reverse().join('');
  var w=words.filter(function(x){return x===s||x===rev})[0];
  if(w&&!found[w]){found[w]=1;cells.forEach(function(x){var q=bt[idx(x[0],x[1])];q.classList.add('found');q.setAttribute('aria-label',q.getAttribute('aria-label')+', part of found word '+w)});
   var li=list.querySelector('[data-w='+w+']');li.className='done';li.querySelector('.sr').textContent=' (found)';
   var n=Object.keys(found).length;say('Found '+w+', '+n+' of '+words.length+' words.');
   if(n===words.length){say('Found '+w+', '+n+' of '+words.length+' words. All five found.');win.style.display='block'}}
  else if(w){say(w+' is already found.')}
  else say('That is not one of the words. Try again.')}
 function dirText(c){var a=c[0],b=c[c.length-1],dr=Math.sign(b[0]-a[0]),dc=Math.sign(b[1]-a[1]);
  var m={'0,1':'across, left to right','0,-1':'across, right to left','1,0':'down','-1,0':'up','1,1':'diagonally down and to the right','1,-1':'diagonally down and to the left','-1,1':'diagonally up and to the right','-1,-1':'diagonally up and to the left'};return m[dr+','+dc]}
 var sb=document.getElementById('showwords'),wp=document.getElementById('wordpos');
 words.forEach(function(w){var c=P.words[w],a=c[0],z=c[c.length-1],li=document.createElement('li');
  li.textContent=w+': starts at row '+(a[0]+1)+', column '+(a[1]+1)+'; ends at row '+(z[0]+1)+', column '+(z[1]+1)+'; reads '+dirText(c)+'.';wp.appendChild(li)});
 sb.addEventListener('click',function(){var o=wp.hidden;wp.hidden=!o;sb.setAttribute('aria-expanded',o?'true':'false');sb.textContent=o?'Hide the words and where they are':'Show me the words and where they are'});
 var rt=document.getElementById('rowtext');grid.forEach(function(r,i){var li=document.createElement('li');li.textContent=r.split('').join(' ');li.setAttribute('aria-label','Row '+(i+1)+': '+r.split('').join(', '));rt.appendChild(li)});
 document.getElementById('tmark').addEventListener('click',function(){var v=['tr1','tc1','tr2','tc2'].map(function(i){return parseInt(document.getElementById(i).value,10)});
  if(v.some(function(x){return !(x>=1&&x<=8)})){say('Please type a number from 1 to 8 in all four boxes.');document.getElementById('tr1').focus();return}
  start=null;pick(v[0]-1,v[1]-1);pick(v[2]-1,v[3]-1)});
 document.getElementById('reset').addEventListener('click',build);build();
})();
