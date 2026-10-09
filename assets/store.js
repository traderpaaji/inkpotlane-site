/* Inkpot Lane player store: the ONE place puzzle progress is read and written (/play/ and /whodunit/).
   Today: LocalStore (this browser's localStorage, key il-player-v1). Tomorrow: RemoteStore (the signed-in player's own document)
   plugs in behind the same load/save, and merge() combines local and account progress on first sign-in, never losing the
   higher level. Nothing here sends anything anywhere. Every storage call is wrapped: a private window or blocked storage
   just means progress is not remembered. */
(function(root){
'use strict';
var KEY='il-player-v1';
function today(){var d=new Date();return d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2)}
function blank(){return{version:1,levelsDone:{ws:{},wd:{}},currentLevel:{ws:1,wd:1},stars:0,coins:3,hintsUsed:0,
 streak:{days:0,last:''},lastPlayed:'',bestWeekly:{},badges:[],bookShowcaseSeen:[],puzzles:{},updated:''}}
function fix(d){var b=blank();if(!d||typeof d!=='object'||d.version!==1)return b;
 for(var k in b)if(!(k in d))d[k]=b[k];['ws','wd'].forEach(function(t){d.levelsDone[t]=d.levelsDone[t]||{};d.currentLevel[t]=Math.max(1,d.currentLevel[t]|0)});return d}
function starsOf(d){var s=0;['ws','wd'].forEach(function(t){for(var n in d.levelsDone[t])s+=d.levelsDone[t][n]|0});return s}
var LocalStore={name:'device',
 load:function(){try{return fix(JSON.parse(localStorage.getItem(KEY)||'null'))}catch(e){return blank()}},
 save:function(d){try{d.updated=new Date().toISOString();localStorage.setItem(KEY,JSON.stringify(d));return true}catch(e){return false}}};
/* merge(local, account): used once, on first sign-in. Levels: union, best stars per level; current level: the higher; stars:
   recounted from the merged levels; coins and hints used: the higher; streak: the more recent one; weekly results: the better
   one (fewer guesses, then fewer hints); badges, showcases seen: union; per-puzzle state: the account's unless only local has it. */
function better(a,b){if(!a)return b;if(!b)return a;if(a.guesses!==b.guesses)return a.guesses<b.guesses?a:b;return (a.hints||0)<=(b.hints||0)?a:b}
function union(a,b){var o=(a||[]).slice();(b||[]).forEach(function(x){if(o.indexOf(x)<0)o.push(x)});return o}
function merge(L,R){L=fix(L);R=fix(R);var M=blank();
 ['ws','wd'].forEach(function(t){var o={},k;for(k in L.levelsDone[t])o[k]=L.levelsDone[t][k];for(k in R.levelsDone[t])o[k]=Math.max(o[k]|0,R.levelsDone[t][k]|0);
  M.levelsDone[t]=o;M.currentLevel[t]=Math.max(L.currentLevel[t],R.currentLevel[t])});
 M.stars=starsOf(M);M.coins=Math.max(L.coins,R.coins);M.hintsUsed=Math.max(L.hintsUsed,R.hintsUsed);
 M.streak=(L.streak.last||'')>(R.streak.last||'')?L.streak:R.streak;M.lastPlayed=(L.lastPlayed||'')>(R.lastPlayed||'')?L.lastPlayed:R.lastPlayed;
 var ids=union(Object.keys(L.bestWeekly),Object.keys(R.bestWeekly));ids.forEach(function(id){M.bestWeekly[id]=better(L.bestWeekly[id],R.bestWeekly[id])});
 M.badges=union(L.badges,R.badges);M.bookShowcaseSeen=union(L.bookShowcaseSeen,R.bookShowcaseSeen);
 var pids=union(Object.keys(L.puzzles),Object.keys(R.puzzles));pids.forEach(function(id){M.puzzles[id]=R.puzzles[id]||L.puzzles[id]});
 return M}
var Store={backend:LocalStore,
 load:function(){return this.backend.load()},
 /* every change is kept on the device at once; the account copy (tomorrow's RemoteStore, this.remote) is written ONLY when a
    level or the weekly case is completed ({complete:true}), at most once per completion and debounced by the RemoteStore,
    so a viral spike costs one database write per finished puzzle, never one per tap. */
 remote:null,
 save:function(d,opt){var ok=this.backend.save(d);if(opt&&opt.complete&&this.remote)this.remote.queue(d);return ok},
 touch:function(d){var t=today();if(d.streak.last!==t){var y=new Date(Date.now()-864e5),ys=y.getFullYear()+'-'+('0'+(y.getMonth()+1)).slice(-2)+'-'+('0'+y.getDate()).slice(-2);
  d.streak={days:d.streak.last===ys?d.streak.days+1:1,last:t}}d.lastPlayed=new Date().toISOString();return d},
 merge:merge,blank:blank,starsOf:starsOf};
root.InkpotStore=Store;
/* per-puzzle state for the weekly mystery (/whodunit/), kept inside the same player document */
root.InkpotProgress={get:function(id){return Store.load().puzzles[id]||null},
 set:function(id,v){var d=Store.load();d.puzzles[id]=v;if(v&&v.solved){var best={guesses:v.g.length,hints:v.h,ms:(v.ts&&v.t)?v.t-v.ts:null};
   d.bestWeekly[id]=better(d.bestWeekly[id],best)}var done=!!(v&&(v.solved||v.r));if(done)Store.touch(d);Store.save(d,{complete:done})}};
if(typeof module!=='undefined'&&module.exports)module.exports=Store;
})(typeof window!=='undefined'?window:this);
