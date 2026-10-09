/* Inkpot Lane endless puzzle levels: deterministic generators + a verifier gate. Runs in the browser (/play/) and in node
   (site/levels_record.js writes the verification record that site/levels_crosscheck.py re-checks independently).

   level number + type -> seed -> puzzle. A puzzle is served ONLY if verify() passes: a word search where every listed word
   appears exactly once in the grid (in any of the 8 directions) and only in a direction the level allows, with the hidden
   message (when there is one) spelled exactly by the leftover letters; a whodunit where exactly one suspect fits every clue,
   every clue rules out somebody no other clue rules out (no padding clue) and no clue sits on a tie. If a seed fails, the
   next attempt seed is tried, deterministically, so level N is always the same puzzle and always exists.
   No Math.random anywhere: the same level is the same puzzle on every device. */
(function(root){
'use strict';
var VERSION=1;
/* ------------------------------------------------------------------ seeded random */
function hash(s){var h=2166136261>>>0;for(var i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)>>>0}return h>>>0}
function rng(seed){var a=seed>>>0;return function(){a=(a+0x6D2B79F5)>>>0;var t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296}}
function ri(r,a,b){return a+Math.floor(r()*(b-a+1))}
function pick(r,arr){return arr[Math.floor(r()*arr.length)]}
function shuffle(r,arr){var a=arr.slice();for(var i=a.length-1;i>0;i--){var j=Math.floor(r()*(i+1));var t=a[i];a[i]=a[j];a[j]=t}return a}

/* ------------------------------------------------------------------ word search */
var THEMES={
 'In the garden':['TROWEL','SEEDLING','COMPOST','TULIP','HEDGE','ROSEBUD','DAISY','PANSY','WATERING','SHED','RAKE','BORDER','POTTING','LAVENDER','THYME','ORCHARD','ACORN','BEETLE','ROBIN','PATH','GATE','BLOSSOM','FERN','IVY','MARIGOLD'],
 'In the kitchen':['KETTLE','TEAPOT','LADLE','WHISK','PANTRY','SAUCER','TOASTER','APRON','RECIPE','OVEN','FLOUR','BUTTER','SCONE','JAM','SPOON','COLANDER','GRATER','SKILLET','PITCHER','CUPBOARD','STOVE','MUFFIN','HONEY','PORRIDGE','CRUMB'],
 'A winter walk':['SNOWFALL','MITTENS','SCARF','SLEDGE','ICICLE','FROST','LANTERN','BOOTS','COCOA','FIRESIDE','PINECONE','BLANKET','CHIMNEY','SNOWDRIFT','WOOLLY','CANDLE','HEARTH','SHOVEL','JACKET','POLAR','GLACIER','FLURRY','HUSH','STARLIT','CABIN'],
 'Christmas eve':['STOCKING','TINSEL','REINDEER','SLEIGH','CAROL','HOLLY','WREATH','BAUBLE','RIBBON','PRESENT','CRACKER','MANGER','STAR','ANGEL','GINGER','MISTLETOE','CHESTNUT','BELLS','SNOWMAN','TOFFEE','PUDDING','CANDLES','ELVES','PARCEL','WRAPPING'],
 'Around the village':['BAKERY','LIBRARY','STEEPLE','MARKET','COTTAGE','BRIDGE','POSTBOX','INN','SQUARE','FOUNTAIN','MEADOW','CHAPEL','STATION','SCHOOL','DAIRY','MILL','POND','LANE','BENCH','CLOCK','FERRY','HARBOUR','FORGE','GREEN','TAVERN'],
 'By the sea':['SEAGULL','PEBBLE','SHELL','HARBOUR','ANCHOR','LIGHTHOUSE','TIDE','DRIFTWOOD','PIER','SANDCASTLE','CRAB','OYSTER','SAILOR','ROWBOAT','BREEZE','CLIFF','DUNE','KELP','LOBSTER','COVE','JETTY','BUOY','STARFISH','SURF','NETS'],
 'Birds in the hedge':['WREN','ROBIN','THRUSH','SPARROW','FINCH','BLACKBIRD','STARLING','MAGPIE','PIGEON','SWALLOW','OWL','HERON','KESTREL','LINNET','CHAFFINCH','NUTHATCH','JAY','DOVE','LARK','WARBLER','GOLDCREST','CUCKOO','PHEASANT','ROOK','SWIFT'],
 'On the bookshelf':['NOVEL','CHAPTER','POETRY','ATLAS','JOURNAL','DIARY','FABLE','MYSTERY','LEGEND','PAGES','SPINE','INDEX','PREFACE','AUTHOR','LIBRARY','STORY','RIDDLE','SONNET','LETTER','MAP','GLOSSARY','EPILOGUE','VOLUME','ALMANAC','BOOKMARK'],
 'Teatime':['TEACUP','SCONES','CREAM','BISCUIT','SUGAR','LEMON','MILK','CRUMPET','SANDWICH','DOILY','TRAY','NAPKIN','EARLGREY','CAKESTAND','SPONGE','MACAROON','TART','SAUCER','KETTLE','INFUSER','STRAINER','HONEY','SHORTBREAD','TEACOSY','ECLAIR'],
 'Weather watch':['RAINBOW','THUNDER','DRIZZLE','SUNSHINE','BREEZE','CLOUD','STORM','MIST','FOG','HAIL','SLEET','GALE','TORNADO','DEW','PUDDLE','UMBRELLA','FORECAST','MONSOON','HUMID','LIGHTNING','DROUGHT','CHILL','SHOWER','WINDY','SUNNY'],
 'An autumn day':['MAPLE','HARVEST','PUMPKIN','APPLES','ACORNS','BONFIRE','CIDER','SCARECROW','HAYRIDE','LEAVES','CHESTNUT','SQUASH','ORCHARD','RUSSET','CRISP','WOODLAND','MUSHROOM','HEDGEHOG','SQUIRREL','TWILIGHT','KNITTING','PIE','BARN','GOURD','AMBER'],
 'On the farm':['TRACTOR','HAYSTACK','PADDOCK','CHICKEN','ROOSTER','DUCKLING','PIGLET','SHEEPDOG','STABLE','FURROW','BARLEY','WHEAT','PLOUGH','SILO','FARMER','HEN','GOAT','CALF','LAMB','MEADOW','GATEPOST','DAIRY','EGGS','BUCKET','FENCE'],
 'Music room':['PIANO','VIOLIN','CELLO','FLUTE','TRUMPET','DRUM','HARP','CHOIR','MELODY','RHYTHM','TEMPO','CHORD','BALLAD','ANTHEM','LUTE','BANJO','TUBA','OBOE','SCALE','LYRICS','ORGAN','CONCERT','DUET','ENCORE','CLARINET'],
 'The detective':['CLUE','ALIBI','SUSPECT','MOTIVE','WITNESS','LOCKET','FOOTPRINT','LETTER','SECRET','DIARY','CIPHER','RIDDLE','MAGNIFY','SLEUTH','HUNCH','PUZZLE','CONSTABLE','KEYHOLE','LANTERN','SHADOW','EVIDENCE','INKPOT','NOTEBOOK','DISGUISE','CASE'],
 'Baking day':['DOUGH','YEAST','OVEN','PASTRY','ICING','SPRINKLES','ROLLINGPIN','MIXING','CINNAMON','NUTMEG','VANILLA','RAISIN','LOAF','BRIOCHE','CRUST','CUPCAKE','MERINGUE','FUDGE','TREACLE','BATTER','KNEAD','WHISK','SPATULA','TIMER','CRUMBLE'],
 'A long journey':['SUITCASE','TICKET','PASSPORT','PLATFORM','CARRIAGE','COMPASS','LUGGAGE','POSTCARD','VOYAGE','HARBOUR','STEAMER','RAILWAY','STATION','ROUTE','INN','LANDMARK','HIGHWAY','CANAL','ISLAND','TRAVELLER','JOURNEY','MAPS','SATCHEL','HORIZON','DEPARTURE'],
 'Sewing basket':['NEEDLE','THREAD','THIMBLE','BUTTON','BOBBIN','PATTERN','QUILT','STITCH','SCISSORS','PINCUSHION','FABRIC','LACE','RIBBON','HEM','SEAM','TAPE','ZIPPER','EMBROIDER','CROCHET','YARN','KNIT','FELT','VELVET','LINEN','COTTON'],
 'Woodland walk':['BADGER','FOX','DEER','BRAMBLE','MOSS','TOADSTOOL','STREAM','BIRCH','OAK','WILLOW','FERNS','TRAIL','CLEARING','OWL','HOLLOW','PINE','ROOTS','BARK','THICKET','ACORN','RABBIT','BLUEBELL','STUMP','GLADE','LICHEN']
};
var BANNED=['DAMN','HELL','PISS','SHIT','FUCK','CUNT','COCK','DICK','TWAT','SLUT','WHORE','BITCH','FART','POOP','ARSE','KILL','DIE','DEAD','NAZI','RAPE','ANAL','SEX','PORN','BUTT','TITS','BOOB','FAG','NIGGER','NIGGA','SPIC','KIKE','PAKI','GOOK','WANK','CRAP'];
/* hidden messages: our own short lines (no quotations), used when a level hides a message in the leftover letters */
var MESSAGES=['Tea is better in good company','Every clue was hiding in plain sight','The kettle sang and the rain stopped','A quiet evening is a gift','Small steps still reach the hilltop','The old clock kept its secret','Look twice and you will see','Snow fell softly on the village','Read the clue exactly','The answer was under the doormat','Bread rises when you wait','A robin sang by the garden gate','The lantern glowed until dawn','Keep the best puzzle for last','Somebody left the door ajar','Warm socks and a good book','The postman knew everyone','The lighthouse blinked twice','A friend in need brings cake','Fortune favours the patient solver','The moon rose over the harbour','Count the stars before you sleep','The map was folded wrong','Every street has a story','The baker woke before the sun','The ink was still wet','Footprints led to the shed','A slow walk clears the mind','The church bell rang at noon','Hot cocoa fixes most things','The best finds are slow ones','The garden remembers every season','One more puzzle before bed','The cat sat on the clue','The fog hid the little boat','Mind the third step on the stair','Pockets full of acorns','The library smelled of rain','A good mystery takes its time','The choir sang in the snow','Grandma always knew the answer','The parcel came without a name','Lights went on along the lane','The kettle is never wrong','A puzzle a day keeps boredom away','Patience opens every lock','The village slept under snow','Breakfast waits for no detective','The ferry left at seven','Under the stairs is a door'];
var DIRS={E:[0,1],S:[1,0],SE:[1,1],NE:[-1,1],W:[0,-1],N:[-1,0],NW:[-1,-1],SW:[1,-1]};
var DIR_WORDS={E:'left to right',S:'down',SE:'diagonally down to the right',NE:'diagonally up to the right',W:'right to left',N:'up',NW:'diagonally up to the left',SW:'diagonally down to the left'};
var ALL8=['E','S','SE','NE','W','N','NW','SW'];
function letters(s){return s.toUpperCase().replace(/[^A-Z]/g,'')}
function isBoss(n){return n%10===0}

/* the difficulty curve for word search (documented in the spec, site/content/review/challenge_spec_2026-10-10.md) */
function wsParams(n){
 var p={size:8,words:6,minLen:4,maxLen:7,dirs:['E','S'],overlap:false,decoys:0,message:false,reverseHeavy:false,mix:false,twist:''};
 if(n<=2){p.size=8;p.words=n===1?6:7}
 else if(n<=5){p.size=9;p.words=7+(n>=4?1:0);p.dirs=['E','S','SE'];if(n===3)p.twist='New: words can run diagonally.'}
 else if(n<=9){p.size=10;p.words=8+(n>=8?1:0);p.dirs=['E','S','SE','N'];if(n>=8)p.dirs.push('W');p.maxLen=8;
  if(n===6)p.twist='New: words can run upwards.';if(n===8)p.twist='New: words can run backwards, right to left.'}
 else if(n===10){p.size=10;p.words=10;p.dirs=['E','S','SE','N','W'];p.maxLen=8}
 else if(n<=19){p.size=11;p.words=9+Math.floor((n-11)/3);p.dirs=['E','S','SE','N','W','NE'];if(n>=14)p.dirs.push('SW');if(n>=17)p.dirs.push('NW');
  p.overlap=true;p.maxLen=8;if(n===11)p.twist='New: words can share letters, and run diagonally up.';if(n===14)p.twist='New: words can run diagonally down to the left.';if(n===17)p.twist='Now words can run in all eight directions.'}
 else if(n===20){p.size=12;p.words=13;p.dirs=ALL8;p.overlap=true;p.maxLen=9}
 else if(n<=29){p.size=12;p.words=11+Math.floor((n-21)/4);p.dirs=ALL8;p.overlap=true;p.maxLen=9;p.decoys=2+Math.floor((n-21)/3);
  if(n===21)p.twist='New: decoys. Some near-misses (a word missing its last letter) are hidden in the grid.'}
 else if(n<=50){p.size=n<=40?13:14;p.words=12+Math.floor((n-30)/5);p.dirs=ALL8;p.overlap=true;p.maxLen=10;p.decoys=4;
  p.message=(n%2===1)||isBoss(n);p.reverseHeavy=n>40&&n%3===0;if(p.message){p.size=11;p.words=Math.min(p.words,12)}
  if(n===30)p.twist='New: a hidden message. When every word is found, the leftover letters, read row by row, spell a message.';
  if(n===42)p.twist='New: most words run backwards on some levels.'}
 else{var k=n-50;p.size=Math.min(15,14+Math.floor(k/25));p.words=Math.min(20,15+Math.floor(k/20));p.dirs=ALL8;p.overlap=true;p.maxLen=10;
  var m=n%4;p.decoys=m===0?6:3;p.message=m===1;p.reverseHeavy=m===2;p.mix=m===3;if(p.message){p.size=12;p.words=Math.min(p.words,14);p.decoys=0}if(n===53)p.twist='New: two themes in one grid.'}
 if(isBoss(n)&&n>=20){p.words+=1;p.decoys=Math.max(p.decoys,3)}
 return p}

function countOcc(grid,w){var N=grid.length,hits=[];for(var r=0;r<N;r++)for(var c=0;c<N;c++){if(grid[r][c]!==w[0])continue;
  for(var d in DIRS){var dr=DIRS[d][0],dc=DIRS[d][1],ok=true;for(var i=0;i<w.length;i++){var rr=r+dr*i,cc=c+dc*i;if(rr<0||cc<0||rr>=N||cc>=N||grid[rr][cc]!==w[i]){ok=false;break}}
   if(ok)hits.push({r:r,c:c,d:d})}}return hits}
function lineStrings(grid){var N=grid.length,out=[],r,c;for(r=0;r<N;r++)out.push(grid[r].join(''));for(c=0;c<N;c++){var s='';for(r=0;r<N;r++)s+=grid[r][c];out.push(s)}
 for(var k=-(N-1);k<N;k++){var a='',b='';for(r=0;r<N;r++){c=r+k;if(c>=0&&c<N)a+=grid[r][c];c=N-1-r+k;if(c>=0&&c<N)b+=grid[r][c]}out.push(a,b)}
 return out.concat(out.map(function(s){return s.split('').reverse().join('')}))}

function genWordSearch(n,attempt){
 var p=wsParams(n),r=rng(hash('ws|'+VERSION+'|'+n+'|'+attempt)),names=Object.keys(THEMES);
 var theme=pick(r,names),theme2=(p.mix||p.message)?pick(r,names.filter(function(x){return x!==theme})):null;
 var pool=THEMES[theme].concat(theme2?THEMES[theme2]:[]).filter(function(w){return w.length>=p.minLen&&w.length<=Math.min(p.maxLen,p.size)});
 pool=shuffle(r,pool);var chosen=[];
 pool.forEach(function(w){if(chosen.length>=p.words)return;var rw=w.split('').reverse().join('');if(w===rw)return;
  if(chosen.some(function(x){return x.indexOf(w)>-1||w.indexOf(x)>-1||x.indexOf(rw)>-1||rw.indexOf(x)>-1}))return;chosen.push(w)});
 if(chosen.length<p.words)return null;
 chosen.sort(function(a,b){return b.length-a.length});
 var N=p.size,grid=[],own=[];for(var i=0;i<N;i++){grid.push(new Array(N).fill(''))}
 var placed={},revDirs=['W','N','NW','SW'];
 function place(w,pref){var done=false,dirs=p.dirs;
  if(p.reverseHeavy&&r()<0.6){var rv=dirs.filter(function(d){return revDirs.indexOf(d)>-1});if(rv.length)dirs=rv}
  for(var t=0;t<300&&!done;t++){var d=(pref&&t<200&&dirs.indexOf(pref)>-1)?pref:pick(r,dirs),dr=DIRS[d][0],dc=DIRS[d][1],rr=ri(r,0,N-1),cc=ri(r,0,N-1);
   var er=rr+dr*(w.length-1),ec=cc+dc*(w.length-1);if(er<0||ec<0||er>=N||ec>=N)continue;var ok=true,shared=0;
   for(var k=0;k<w.length;k++){var g=grid[rr+dr*k][cc+dc*k];if(g&&g!==w[k]){ok=false;break}if(g)shared++}
   if(!ok||(shared&&!p.overlap)||shared>=w.length-1)continue;
   for(k=0;k<w.length;k++)grid[rr+dr*k][cc+dc*k]=w[k];placed[w]={r:rr,c:cc,d:d,len:w.length};done=true}
  return done}
 /* directions dealt round-robin so the words spread across and down instead of stacking in rows */
 var cyc=shuffle(r,p.dirs);for(var wi=0;wi<chosen.length;wi++){if(!place(chosen[wi],cyc[wi%cyc.length]))return null}
 /* every direction the level announces is used at least once (cold-reader check: a promised diagonal must be there) */
 var usedD={};chosen.forEach(function(w){usedD[placed[w].d]=1});if(chosen.length>=p.dirs.length&&p.dirs.some(function(d){return !usedD[d]}))return null;
 function emptyCount(){var e=0;for(var y=0;y<N;y++)for(var x=0;x<N;x++)if(!grid[y][x])e++;return e}
 /* hidden-message levels: keep adding listed words until the empty cells match a message length exactly */
 if(p.message){var lens={};MESSAGES.forEach(function(m){lens[letters(m).length]=1});var maxL=Math.max.apply(null,Object.keys(lens).map(Number)),minL=Math.min.apply(null,Object.keys(lens).map(Number));
  var extra=pool.filter(function(w){return chosen.indexOf(w)<0}),xi=0;
  while(!(lens[emptyCount()]&&emptyCount()<=maxL)){if(emptyCount()<minL||xi>=extra.length)return null;var w2=extra[xi++],rw2=w2.split('').reverse().join('');
   if(w2===rw2||chosen.some(function(x){return x.indexOf(w2)>-1||w2.indexOf(x)>-1||x.indexOf(rw2)>-1||rw2.indexOf(x)>-1}))continue;
   var save=grid.map(function(g){return g.slice()});if(place(w2)){if(emptyCount()<minL){grid=save;delete placed[w2];continue}chosen.push(w2)}}}
 /* decoys: a near-miss (the word without its last letter) placed where the free cells allow; it must not complete the word */
 var decoys=[];for(var dk=0;dk<p.decoys;dk++){var dw=pick(r,chosen).slice(0,-1);if(dw.length<3)continue;
  for(var t2=0;t2<200;t2++){var d2=pick(r,p.dirs),a=DIRS[d2],r0=ri(r,0,N-1),c0=ri(r,0,N-1),e0=r0+a[0]*(dw.length-1),e1=c0+a[1]*(dw.length-1);
   if(e0<0||e1<0||e0>=N||e1>=N)continue;var free=true;for(var q=0;q<dw.length;q++){if(grid[r0+a[0]*q][c0+a[1]*q]){free=false;break}}
   if(!free)continue;for(q=0;q<dw.length;q++)grid[r0+a[0]*q][c0+a[1]*q]=dw[q];decoys.push(dw);break}}
 /* fill: a hidden message in the empty cells (row by row) or random letters */
 var empties=[];for(var y=0;y<N;y++)for(var x=0;x<N;x++)if(!grid[y][x])empties.push([y,x]);
 var message='';
 if(p.message){var fits=MESSAGES.filter(function(m){return letters(m).length===empties.length});if(!fits.length)return null;message=pick(r,fits);
  var ml=letters(message);empties.forEach(function(e,i){grid[e[0]][e[1]]=ml[i]})}
 else{var AL='EEEEAAAIIOOUTTNNRRSSLLHDCMPBGFYWKVJXQZ';empties.forEach(function(e){grid[e[0]][e[1]]=AL[Math.floor(r()*AL.length)]})}
 var rows=grid.map(function(g){return g.join('')});
 var words=chosen.slice().sort();
 return {type:'ws',level:n,attempt:attempt,size:N,theme:theme+(theme2?' and '+theme2.toLowerCase():''),rows:rows,words:words,
  place:words.map(function(w){return placed[w]}),dirs:p.dirs,message:message,decoys:decoys,twist:p.twist,boss:isBoss(n),
  target:targetTime('ws',n)}}

function verifyWordSearch(P){var errs=[],N=P.size,grid=P.rows.map(function(s){return s.split('')});
 if(P.rows.length!==N||P.rows.some(function(s){return s.length!==N||/[^A-Z]/.test(s)}))errs.push('grid is not N x N capital letters');
 var used={};
 P.words.forEach(function(w,i){var h=countOcc(grid,w);if(h.length!==1){errs.push(w+' appears '+h.length+' times');return}
  if(P.dirs.indexOf(h[0].d)<0)errs.push(w+' runs '+h[0].d+', not an allowed direction');
  var pl=P.place[i];if(!pl||pl.r!==h[0].r||pl.c!==h[0].c||pl.d!==h[0].d)errs.push(w+' position record does not match the grid');
  for(var k=0;k<w.length;k++)used[(h[0].r+DIRS[h[0].d][0]*k)+','+(h[0].c+DIRS[h[0].d][1]*k)]=1});
 if(P.message){var left='';for(var r=0;r<N;r++)for(var c=0;c<N;c++)if(!used[r+','+c])left+=grid[r][c];if(left!==letters(P.message))errs.push('leftover letters do not spell the message')}
 var lines=lineStrings(grid).join('|');BANNED.forEach(function(b){if(lines.indexOf(b)>-1)errs.push('contains a word we never print')});
 return errs}

/* ------------------------------------------------------------------ whodunit (elimination) */
var FIRST=['Agnes','Walter','June','Felix','Rosa','Tom','Edith','Arthur','Mabel','Ravi','Ingrid','Samuel','Priya','Hugo','Clara','Kofi','Nora','Leon','Grace','Omar','Ivy','Bernard','Lucia','Ezra','Hattie','Desmond','Mei','Rupert','Ada','Tobias','Elsie','Jonah','Marta','Percy','Zara','Cyril','Wren','Dmitri','Flora','Malik','Beatrix','Otis','Sunita','Alfie','Lena','Gus','Matilda','Kenji','Olive','Reuben','Freya','Ahmed','Maud','Silas','Esme','Rafael','Dot','Ivor','Yara','Ned'];
var JOBS=['baker','postman','florist','librarian','lamplighter','carpenter','teacher','nurse','potter','tailor','gardener','chemist','vet','painter','cook','farmer','grocer','barber','clockmaker','beekeeper','bus driver','choir leader','toymaker','fisher','blacksmith','organist','milkman','butcher','dentist','bookbinder','cobbler','glassblower','innkeeper','ferryman','weaver','map maker'];
var COLOURS=['red','green','blue','yellow','white','grey','plum','orange','brown','pink'];
var ITEMS=['basket','umbrella','lantern','parcel','satchel','thermos','walking stick','music case'];
var STREETS=['Mill Lane','Church Street','Rose Terrace','Bridge Road','Market Row','Elm Walk'];
var LOST=[['the prize marrow','the village hall'],['the brass bell','the church porch'],['the cherry cake','the tea room'],['the music box','the toy shop'],['the golden key','the library'],['the silver teapot','the inn'],['the snow globe','the post office'],['the lucky horseshoe','the forge'],['the treasure map','the museum'],['the wedding cake topper','the bakery'],['the pocket watch','the clock shop'],['the first-prize rosette','the flower show'],['the lighthouse logbook','the harbour office'],['the jar of honey','the market'],['the choir\'s songbook','the chapel']];
function art(w){return (/^[aeiou]/i.test(w)?'an ':'a ')+w}
function clock(m){var h=Math.floor(m/60),mm=m%60;return (h>12?h-12:h)+':'+(mm<10?'0':'')+mm+(h>=12?' pm':' am')}

function wdParams(n){
 var p={sus:5,lo:4,hi:4,kinds:['neqC','after','before','neqJ'],cols:['job','colour','time'],decoy:false,twist:''};
 if(n===1){p.kinds=['neqC','after','before','beforeP','neqJ']}
 else if(n===2){p.sus=6;p.kinds=['neqC','eqC','after','before','beforeP','afterP','neqJ']}
 else if(n<=4){p.sus=6;p.lo=4;p.hi=5;p.cols=['job','colour','item','time'];p.kinds=['neqC','eqC','after','before','beforeP','afterP','neqJ','neqI','eqI'];if(n===3)p.twist='New: a fourth column, what each person carried.'}
 else if(n<=9){p.sus=7;p.lo=5;p.hi=n<=6?5:6;p.cols=['job','colour','item','time'];p.kinds=['neqC','eqC','anyC','after','before','beforeP','afterP','neqJ','neqI','anyI','ifCthenT'];
  if(n===5)p.twist='New: an "if" clue. It only rules out someone who matches its first half and breaks its second half. Everyone else is unaffected.';if(n>=7){p.cols.push('street');p.decoy=true}if(n===7)p.twist='New: a column that no clue uses. Not every fact matters.'}
 else if(n===10){p.sus=8;p.lo=6;p.hi=7;p.cols=['job','colour','item','time','street'];p.decoy=true;p.kinds=['neqC','eqC','anyC','after','before','beforeP','afterP','neqJ','neqI','anyI','ifCthenT','ifIthenT']}
 else if(n<=29){p.sus=n<20?8+Math.floor((n-11)/5):(n===20?10:10+Math.floor((n-21)/5));p.lo=6;p.hi=n<20?7:8;p.cols=['job','colour','item','time','street'];p.decoy=n%2===1;
  p.kinds=['neqC','eqC','anyC','after','before','beforeP','afterP','neqJ','neqI','anyI','ifCthenT','ifIthenT','neqS','anyS'];if(!p.decoy){}if(n===12)p.twist='New: a clue can be about the street someone lives on.'}
 else{var k=n-30;p.sus=Math.min(18,12+Math.floor(k/10));p.lo=7+Math.min(2,Math.floor(k/20));p.hi=p.lo+2;p.cols=['job','colour','item','time','street'];p.decoy=n%3===0;
  p.kinds=['neqC','eqC','anyC','after','before','beforeP','afterP','neqJ','neqI','anyI','ifCthenT','ifIthenT','neqS','anyS']}
 if(isBoss(n)&&n>=20){p.sus+=1;p.lo+=1;p.hi+=1}
 if(p.decoy&&p.cols.indexOf('street')<0)p.cols.push('street');
 return p}

/* a rule is plain data; holds(rule, suspect, suspects) is the one place its meaning is defined */
function holds(R,s,S){switch(R.k){
 case 'neq':return s[R.a]!==R.v; case 'eq':return s[R.a]===R.v; case 'any':return R.v.indexOf(s[R.a])>-1;
 case 'after':return s.time>R.t; case 'before':return s.time<R.t;
 case 'beforeP':return s.time<S.filter(function(x){return x.job===R.job})[0].time;
 case 'afterP':return s.time>S.filter(function(x){return x.job===R.job})[0].time;
 case 'if':return s[R.a]!==R.v||(R.then==='before'?s.time<R.t:s.time>R.t)}throw new Error('rule')}
var ATTR_WORD={colour:'scarf',item:'',street:''};
function clueText(R){switch(R.k){
 case 'neq':return R.a==='colour'?'They were not wearing '+art(R.v)+' scarf.':R.a==='job'?'They are not the '+R.v+'.':R.a==='item'?'They were not carrying '+art(R.v)+'.':'They do not live on '+R.v+'.';
 case 'eq':return R.a==='colour'?'They wore '+art(R.v)+' scarf.':'They were carrying '+art(R.v)+'.';
 case 'any':return R.a==='colour'?'Their scarf was '+R.v[0]+' or '+R.v[1]+'.':R.a==='item'?'They carried '+art(R.v[0])+' or '+art(R.v[1])+'.':'They live on '+R.v[0]+' or '+R.v[1]+'.';
 case 'after':return 'They left after '+clock(R.t)+'.'; case 'before':return 'They left before '+clock(R.t)+'.';
 case 'beforeP':return 'They left before the '+R.job+' did.'; case 'afterP':return 'They left after the '+R.job+' did.';
 case 'if':return 'If they '+(R.a==='colour'?'wore '+art(R.v)+' scarf':'carried '+art(R.v))+', they left '+R.then+' '+clock(R.t)+'.'}}
function because(R,s,S){var n=s.name;switch(R.k){
 case 'neq':return R.a==='colour'?n+' wore '+art(R.v)+' scarf.':R.a==='job'?n+' is the '+R.v+'.':R.a==='item'?n+' was carrying '+art(R.v)+'.':n+' lives on '+R.v+'.';
 case 'eq':case 'any':return R.a==='colour'?n+' wore '+art(s.colour)+' scarf.':R.a==='item'?n+' carried '+art(s.item)+'.':n+' lives on '+s.street+'.';
 case 'after':return n+' left at '+clock(s.time)+', which is not after '+clock(R.t)+'.';
 case 'before':return n+' left at '+clock(s.time)+', which is not before '+clock(R.t)+'.';
 case 'beforeP':case 'afterP':var o=S.filter(function(x){return x.job===R.job})[0];if(o===s)return n+' is the '+R.job+', and nobody leaves '+(R.k==='beforeP'?'before':'after')+' themselves.';
  return n+' left at '+clock(s.time)+' and the '+R.job+' left at '+clock(o.time)+'.';
 case 'if':return n+(R.a==='colour'?' wore '+art(R.v)+' scarf':' carried '+art(R.v))+' and left at '+clock(s.time)+', which is not '+R.then+' '+clock(R.t)+'.'}}

function kkey(R){return R.k+(R.a?':'+R.a:'')}
function genWhodunit(n,attempt){
 var p=wdParams(n),r=rng(hash('wd|'+VERSION+'|'+n+'|'+attempt)),N=p.sus;
 var names=shuffle(r,FIRST).slice(0,N),jobs=shuffle(r,JOBS).slice(0,N);
 var nCol=Math.min(COLOURS.length,Math.max(3,Math.ceil(N*0.6))),cols=shuffle(r,COLOURS).slice(0,nCol),items=shuffle(r,ITEMS).slice(0,Math.max(3,Math.ceil(N*0.5))),streets=shuffle(r,STREETS).slice(0,Math.max(3,Math.ceil(N*0.4)));
 var times=shuffle(r,(function(){var a=[];for(var m=17*60;m<=21*60;m+=5)if(m%30!==0)a.push(m);return a})()).slice(0,N).sort(function(a,b){return a-b});
 var S=names.map(function(nm,i){return{name:nm,job:jobs[i],colour:pick(r,cols),item:pick(r,items),street:pick(r,streets),time:0}});
 shuffle(r,times).forEach(function(t,i){S[i].time=t});
 var C=ri(r,0,N-1),cul=S[C];
 /* candidate clues: true of the culprit, removing at least one suspect */
 var cand=[];function add(R){if(!holds(R,cul,S))return;var m=S.map(function(s){return holds(R,s,S)});if(m.every(Boolean))return;cand.push({R:R,m:m})}
 var halfHours=[];for(var h=17*60;h<=21*60;h+=30)halfHours.push(h);
 p.kinds.forEach(function(k){
  if(k==='neqC')cols.forEach(function(v){add({k:'neq',a:'colour',v:v})});
  if(k==='eqC')add({k:'eq',a:'colour',v:cul.colour});
  if(k==='anyC')cols.forEach(function(v){if(v!==cul.colour)add({k:'any',a:'colour',v:shuffle(r,[cul.colour,v])})});
  if(k==='after')halfHours.forEach(function(t){add({k:'after',t:t})});
  if(k==='before')halfHours.forEach(function(t){add({k:'before',t:t})});
  if(k==='beforeP')S.forEach(function(o){add({k:'beforeP',job:o.job})});
  if(k==='afterP')S.forEach(function(o){add({k:'afterP',job:o.job})});
  if(k==='neqJ')S.forEach(function(o){if(o!==cul)add({k:'neq',a:'job',v:o.job})});
  if(k==='neqI'&&p.cols.indexOf('item')>-1)items.forEach(function(v){add({k:'neq',a:'item',v:v})});
  if(k==='eqI'&&p.cols.indexOf('item')>-1)add({k:'eq',a:'item',v:cul.item});
  if(k==='anyI'&&p.cols.indexOf('item')>-1)items.forEach(function(v){if(v!==cul.item)add({k:'any',a:'item',v:shuffle(r,[cul.item,v])})});
  if(k==='ifCthenT')cols.forEach(function(v){halfHours.forEach(function(t){add({k:'if',a:'colour',v:v,then:'before',t:t});add({k:'if',a:'colour',v:v,then:'after',t:t})})});
  if(k==='ifIthenT'&&p.cols.indexOf('item')>-1)items.forEach(function(v){halfHours.forEach(function(t){add({k:'if',a:'item',v:v,then:'before',t:t});add({k:'if',a:'item',v:v,then:'after',t:t})})});
  if(k==='neqS'&&!p.decoy)streets.forEach(function(v){add({k:'neq',a:'street',v:v})});
  if(k==='anyS'&&!p.decoy)streets.forEach(function(v){if(v!==cul.street)add({k:'any',a:'street',v:shuffle(r,[cul.street,v])})});
 });
 if(!cand.length)return null;
 /* greedy cover, then prune leave-one-out redundancy (random order) - the book's witness standard */
 var chosen=[],alive=S.map(function(_,i){return i!==C});
 for(var g=0;g<60&&alive.some(Boolean);g++){var useful=cand.filter(function(c){return chosen.indexOf(c)<0&&c.m.some(function(x,i){return alive[i]&&!x})});
  if(!useful.length)return null;
  /* prefer clues that remove few people (more clues, each doing a little, reads like a real case) and kinds not used yet */
  var used={};chosen.forEach(function(c){used[kkey(c.R)]=(used[kkey(c.R)]||0)+1});
  var ifMax=n<5?0:(n<30?1:2),jobMax=n<20?1:2,nIf=chosen.filter(function(c){return c.R.k==='if'}).length;
  useful=useful.filter(function(c){return !(c.R.k==='if'&&nIf>=ifMax)&&!(kkey(c.R)==='neq:job'&&(used['neq:job']||0)>=jobMax)});if(!useful.length)return null;
  var score=function(c){return (used[kkey(c.R)]||0)*1.2+c.m.filter(function(x){return!x}).length+r()*1.5};
  useful.forEach(function(c){c.sc=score(c)});useful.sort(function(a,b){return a.sc-b.sc});
  var c=useful[Math.min(useful.length-1,Math.floor(Math.pow(r(),2)*Math.min(useful.length,5)))];chosen.push(c);c.m.forEach(function(x,i){if(!x)alive[i]=false})}
 if(alive.some(Boolean))return null;
 var changed=true;while(changed){changed=false;var order=shuffle(r,chosen.map(function(_,i){return i}));
  for(var oi=0;oi<order.length;oi++){var drop=order[oi],rest=chosen.filter(function(_,i){return i!==drop});
   var surv=S.map(function(_,i){return rest.every(function(c){return c.m[i]})}).filter(Boolean).length;if(surv===1){chosen=rest;changed=true;break}}}
 if(chosen.length<p.lo-(n>=10?1:0)||chosen.length>p.hi+1)return null;   /* the clue count is a soft target from level 10: -1..+1 */
 /* at most one if-clue below level 30, two after; no two clues of the same rule twice */
 var ifs=chosen.filter(function(c){return c.R.k==='if'}).length;if(ifs>(n<30?1:2))return null;
 if(n<5&&ifs)return null;
 /* variety: no clue kind more than ~45% of the clues, at most one 'not the <job>' clue (two from level 20), 3+ kinds from level 3 */
 var cnt={};chosen.forEach(function(c){cnt[kkey(c.R)]=(cnt[kkey(c.R)]||0)+1});
 var maxSame=Math.max(2,Math.ceil(chosen.length*0.45));if(Object.keys(cnt).some(function(k){return cnt[k]>maxSame}))return null;
 if((cnt['neq:job']||0)>(n<20?1:2))return null;if(Object.keys(cnt).length<(n<=2?2:3))return null;
 /* cold-reader check (10 Oct): from level 2 at least one clue must rule out two or more people, so no level is a plain
    one-clue-one-person list; a level that announces a new feature must actually use it */
 if(n>=2&&!chosen.some(function(c){return c.m.filter(function(x){return!x}).length>=2}))return null;
 if(n===3&&!chosen.some(function(c){return c.R.a==='item'}))return null;
 if(n===5&&!ifs)return null;
 chosen=shuffle(r,chosen);
 /* teaching order on early levels: a time clue first */
 if(n<=5){chosen.sort(function(a,b){return (a.R.k==='after'||a.R.k==='before'?0:1)-(b.R.k==='after'||b.R.k==='before'?0:1)})}
 var lost=pick(r,LOST);
 var clues=chosen.map(function(c){return{text:clueText(c.R),rule:c.R}});
 var columns=p.cols.slice();
 return {type:'wd',level:n,attempt:attempt,question:'Who took '+lost[0]+'?',place:lost[1],
  story:'At closing time '+lost[0]+' was gone from '+lost[1]+'. '+N+' people had been in that evening, and each left once, at the time shown. One of them took it.',
  suspects:S.map(function(s){return{name:s.name,job:s.job,colour:s.colour,item:s.item,street:s.street,time:s.time,left:clock(s.time)}}),
  columns:columns,decoyColumn:p.decoy?'street':'',clues:clues,culprit:C,twist:p.twist,boss:isBoss(n),target:targetTime('wd',n)}}

function verifyWhodunit(P){var errs=[],S=P.suspects,N=S.length;
 if(new Set(S.map(function(s){return s.name})).size!==N)errs.push('duplicate names');
 if(new Set(S.map(function(s){return s.job})).size!==N)errs.push('duplicate jobs');
 if(new Set(S.map(function(s){return s.time})).size!==N)errs.push('two people left at the same time');
 var M=P.clues.map(function(c){return S.map(function(s){return holds(c.rule,s,S)})});
 var surv=S.map(function(_,i){return M.every(function(m){return m[i]})});var idx=[];surv.forEach(function(x,i){if(x)idx.push(i)});
 if(idx.length!==1||idx[0]!==P.culprit)errs.push('answer is not unique: '+idx.length+' fit');
 M.forEach(function(m,k){var wit=S.some(function(_,i){return !m[i]&&M.every(function(m2,j){return j===k||m2[i]})});if(!wit)errs.push('clue '+(k+1)+' is padding (rules out nobody that another clue does not)')});
 P.clues.forEach(function(c,k){var t=c.rule.t;if(t!==undefined&&S.some(function(s){return s.time===t}))errs.push('clue '+(k+1)+' names a time someone left at exactly');
  if(c.text!==clueText(c.rule))errs.push('clue '+(k+1)+' text does not match its rule');
  if(P.decoyColumn&&c.rule.a===P.decoyColumn)errs.push('a clue uses the decoy column')});
 return errs}

function explain(P){/* generated, never hand-written: why each wrong suspect is out, and the walk-through */
 var S=P.suspects,M=P.clues.map(function(c){return S.map(function(s){return holds(c.rule,s,S)})}),out={},walk=[];
 S.forEach(function(s,i){if(i===P.culprit)return;for(var k=0;k<M.length;k++)if(!M[k][i]){out[i]={c:k+1,t:'Clue '+(k+1)+' rules out '+s.name+'. '+because(P.clues[k].rule,s,S)};break}});
 P.clues.forEach(function(c,k){S.forEach(function(s,i){if(out[i]&&out[i].c===k+1)walk.push('Clue '+(k+1)+': '+because(c.rule,s,S))})});
 walk.push(S[P.culprit].name+' is the only one left.');return{wrong:out,walk:walk}}

function targetTime(type,n){/* the aim for a first-time player, in minutes (a design target, never shown as a statistic) */
 var b=n<=5?[0.5,1]:n<=10?[1,2]:n<=20?[2,3]:n<=30?[3,5]:n<=50?[4,7]:[6,10];return b}

function level(type,n){if(!(n>=1))throw new Error('level must be 1 or more');n=Math.floor(n);
 for(var a=0;a<400;a++){var P=type==='ws'?genWordSearch(n,a):genWhodunit(n,a);if(!P)continue;
  var e=type==='ws'?verifyWordSearch(P):verifyWhodunit(P);if(!e.length){if(type==='wd'){var x=explain(P);P.wrong=x.wrong;P.walk=x.walk}P.verified=true;return P}}
 throw new Error('no verified puzzle for '+type+' level '+n)}

var API={VERSION:VERSION,level:level,wsParams:wsParams,wdParams:wdParams,verifyWordSearch:verifyWordSearch,verifyWhodunit:verifyWhodunit,
 holds:holds,clock:clock,DIR_WORDS:DIR_WORDS,DIRS:DIRS,isBoss:isBoss,THEMES:THEMES,MESSAGES:MESSAGES};
if(typeof module!=='undefined'&&module.exports)module.exports=API;else root.InkpotLevels=API;
})(this);
