const graph = new Map([
  [0, { h: 0, a: [[0,1],[1,2]] }], [1, { h:.10, a:[[0,3],[1,4]] }],
  [2, { h:-.05, a:[[0,4],[1,5]] }], [3, { t:1 }], [4, { t:.25 }],
  [5, { h:-.10, a:[[0,6],[1,2]] }], [6, { t:-.5 }],
  [10,{ h:.05, a:[[0,11],[1,12]] }], [11,{ t:.6 }], [12,{ t:-.2 }]
]);
function err(code){ const e=new Error(code); e.code=code; throw e; }
function ok(x,m){ if(!x) throw new Error(m); }
function throws(fn,code){ try{fn();}catch(e){ok(e.code===code,'expected '+code+', got '+e.code);return;}throw new Error('expected '+code); }
function key(r){return r.s+':'+r.g;}
function cp(r){return {s:r.s,g:r.g};}

class Session {
  constructor(o={}){
    this.cap=o.cap||7; this.maxEpoch=o.maxEpoch||Number.MAX_SAFE_INTEGER; this.maxRank=o.maxRank||Number.MAX_SAFE_INTEGER;
    this.epoch=1; this.rankGen=0; this.completed=0; this.stale=0; this.evals=0; this.allocs=0; this.reuses=0; this.reroots=0; this.rankSorts=0;
    this.pending=new Map(); this.nextWork=1; this.byState=new Map(); this.slots=Array.from({length:this.cap},(_,s)=>({s,g:1,n:null,used:false}));
    this.free=Array.from({length:this.cap},(_,i)=>this.cap-1-i); this.lastRank=null; this.root=this.node(0);
  }
  resolve(r){const x=this.slots[r.s];return x&&x.n&&x.g===r.g?x.n:null;}
  node(state){let r=this.byState.get(state);if(r&&this.resolve(r))return cp(r);if(!this.free.length)err('NODE_CAPACITY');
    const s=this.free.pop(),x=this.slots[s];if(x.used)this.reuses++;x.used=true;r={s,g:x.g};
    x.n={state,ref:r,v:0,e:null,eval:false,value:0};this.byState.set(state,cp(r));this.allocs++;return cp(r);
  }
  expand(r){const n=this.resolve(r);if(!n)err('STALE_REF');if(n.e)return n;const d=graph.get(n.state);if(!d)err('BAD_STATE');
    n.e=(d.a||[]).map(([action,next])=>({action,next,c:null,v:0,res:0,sum:0}));return n;
  }
  child(n,i){const e=n.e[i];if(e.c&&this.resolve(e.c))return cp(e.c);e.c=this.node(e.next);return cp(e.c);}
  value(r){const n=this.resolve(r);if(n.eval)return n.value;const d=graph.get(n.state);n.value=d.t!==undefined?d.t:(d.h||0);n.eval=true;if(d.t===undefined)this.evals++;return n.value;}
  choose(n){for(let i=0;i<n.e.length;i++)if(n.e[i].v+n.e[i].res===0)return i;let bi=0,bs=-1e99;
    const pv=n.v+n.e.reduce((a,e)=>a+e.res,0);for(let i=0;i<n.e.length;i++){const e=n.e[i],load=e.v+e.res,mean=e.v?e.sum/e.v:0;
      const s=mean+1.10*Math.sqrt(Math.log(pv+2)/load);if(s>bs||(s===bs&&e.action<n.e[bi].action)){bs=s;bi=i;}}return bi;}
  begin(){const epoch=this.epoch,nodes=[cp(this.root)],edges=[],seen=new Set([key(this.root)]);let r=cp(this.root),val=0;
    for(let depth=0;depth<16;depth++){const n=this.resolve(r),d=graph.get(n.state);if(d.t!==undefined){val=d.t;break;}this.expand(r);const i=this.choose(n),e=n.e[i];e.res++;edges.push([cp(r),i]);
      const c=this.child(n,i);if(seen.has(key(c))){val=0;break;}nodes.push(cp(c));seen.add(key(c));r=c;const cn=this.resolve(c);if(cn.v===0){val=this.value(c);break;}}
    const w={id:this.nextWork++,epoch,nodes,edges,val};this.pending.set(w.id,w);return w;}
  release(w){for(const [r,i] of w.edges){const n=this.resolve(r);if(n&&n.e[i].res)n.e[i].res--;}}
  commit(w){if(!this.pending.has(w.id))err('UNKNOWN_WORK');if(w.epoch!==this.epoch){this.release(w);this.pending.delete(w.id);this.stale++;return false;}
    for(const [r,i] of w.edges){const n=this.resolve(r),e=n.e[i];if(!e.res)err('RESERVATION');e.res--;e.v++;e.sum+=w.val;}for(const r of w.nodes)this.resolve(r).v++;
    this.pending.delete(w.id);this.completed++;return true;}
  search(n,cad=0){for(let i=0;i<n;i++){ok(this.commit(this.begin()),'serial work went stale');if(cad&&this.completed%cad===0)this.rank();}if(!this.lastRank||this.lastRank.epoch!==this.epoch||this.lastRank.completed!==this.completed)this.rank();}
  rank(){if(this.rankGen>=this.maxRank)err('RANK_EXHAUSTED');const n=this.resolve(this.root);if(!n)err('STALE_ROOT');this.rankSorts++;const entries=(n.e||[]).map(e=>({action:e.action,visits:e.v,mean:e.v?e.sum/e.v:null,inFlight:e.res}));
    entries.sort((a,b)=>b.visits-a.visits||((b.mean??-1e99)-(a.mean??-1e99))||a.action-b.action);this.rankGen++;this.lastRank=Object.freeze({epoch:this.epoch,generation:this.rankGen,root:n.state,completed:this.completed,entries:Object.freeze(entries.map(Object.freeze))});return this.lastRank;}
  canRoot(){if(this.epoch>=this.maxEpoch)err('EPOCH_EXHAUSTED');}
  advance(r){this.canRoot();if(!this.resolve(r))err('STALE_NEW_ROOT');this.epoch++;this.root=cp(r);this.reroots++;}
  reroot(action){this.canRoot();const n=this.expand(this.root),i=n.e.findIndex(e=>e.action===action);if(i<0)err('BAD_ACTION');this.advance(this.child(n,i));}
  replace(state){this.canRoot();this.advance(this.node(state));}
  refs(state){const r=this.byState.get(state);return r&&this.resolve(r)?cp(r):null;}
  reclaim(){if(this.pending.size)return {deferred:true,reclaimed:0};const live=new Set(),stack=[cp(this.root)];while(stack.length){const r=stack.pop();if(live.has(key(r)))continue;const n=this.resolve(r);if(!n)continue;live.add(key(r));for(const e of n.e||[])if(e.c&&this.resolve(e.c))stack.push(cp(e.c));}
    let count=0;for(const x of this.slots){if(!x.n||live.has(key(x.n.ref)))continue;const st=x.n.state,r=this.byState.get(st);if(r&&key(r)===key(x.n.ref))this.byState.delete(st);x.n=null;x.g++;this.free.push(x.s);count++;}return {deferred:false,reclaimed:count};}
  count(){return this.slots.filter(x=>x.n).length;}
  reservations(){let z=0;for(const x of this.slots)for(const e of x.n?.e||[])z+=e.res;return z;}
  digest(){return JSON.stringify({epoch:this.epoch,root:this.resolve(this.root).state,completed:this.completed,nodes:this.slots.filter(x=>x.n).map(x=>({state:x.n.state,g:x.g,v:x.n.v,e:(x.n.e||[]).map(e=>[e.action,e.c?this.resolve(e.c)?.state:null,e.v,e.res,e.sum])})).sort((a,b)=>a.state-b.state)});}
}

const tests=[];function test(id,fn){tests.push([id,fn]);}
test('ranking-publication-readonly',()=>{const s=new Session(),d=s.digest();const r=s.rank();ok(r.entries.length===0,'fresh rank should have no materialized actions');ok(s.digest()===d,'ranking publication mutated search state');});
test('live-ranking-running',()=>{const s=new Session();s.search(128,64);const a=s.lastRank,old=JSON.stringify(a.entries);s.search(384,64);ok(a.generation<s.lastRank.generation,'rank gen');ok(JSON.stringify(a.entries)===old,'snapshot mutated');ok(a.epoch===1&&s.lastRank.epoch===1,'epoch');ok(s.lastRank.entries[0].action===0,'top action');});
test('ranking-cadence-decoupled',()=>{const a=new Session(),b=new Session();a.search(512,1);b.search(512,64);ok(a.digest()===b.digest(),'cadence changed search');ok(a.rankSorts===512&&b.rankSorts===8,'sort counts');});
test('transposition-edge-local',()=>{const s=new Session();s.search(1024,128);ok(s.count()===7,'duplicate node');const a=s.resolve(s.refs(1)).e[1],b=s.resolve(s.refs(2)).e[0];ok(s.resolve(a.c).state===4&&s.resolve(b.c).state===4,'no shared child');ok(a.v>0&&b.v>0,'no edge stats');});
test('reroot-reuse',()=>{const s=new Session();s.search(1024,128);const r=key(s.refs(2)),ev=s.evals,al=s.allocs,old=s.lastRank;s.reroot(1);ok(old.epoch===1&&s.epoch===2,'old rank not distinguishable');s.search(256,64);ok(key(s.refs(2))===r&&s.evals===ev&&s.allocs===al,'reuse lost');ok(s.lastRank.epoch===2,'new rank epoch');});
test('stale-work-rejected',()=>{const s=new Session();s.search(256,64);const done=s.completed,work=Array.from({length:32},()=>s.begin());s.reroot(1);for(const w of work)ok(!s.commit(w),'stale applied');ok(s.completed===done&&s.stale===32&&s.reservations()===0,'stale accounting');});
test('reclaim-generation-reuse',()=>{const s=new Session(),stale=s.refs(0);s.search(1024,128);const w=s.begin();s.reroot(1);ok(s.reclaim().deferred,'reclaim did not defer');ok(!s.commit(w),'old work applied');const x=s.reclaim();ok(x.reclaimed===3&&s.count()===4,'reclaim count');s.replace(10);s.search(128,32);ok(s.count()===7&&s.reuses>=3,'slot reuse');ok(s.resolve(stale)===null,'stale ref resurrected');});
test('many-epoch-bounded-memory',()=>{const s=new Session({maxEpoch:4096});s.search(1024,128);const al=s.allocs,ev=s.evals;s.reroot(1);for(let i=0;i<1000;i++){s.search(8,8);s.reroot(1);ok(s.count()===7,'growth');}s.search(8,8);ok(s.epoch===1002&&s.allocs===al&&s.evals===ev,'session reuse');});
test('epoch-exhaustion-no-side-effect',()=>{const a=new Session({maxEpoch:1}),d=a.digest();throws(()=>a.reroot(0),'EPOCH_EXHAUSTED');ok(a.digest()===d&&a.resolve(a.root).e===null,'rejected reroot mutated');const b=new Session({maxEpoch:1}),bd=b.digest(),al=b.allocs;throws(()=>b.replace(10),'EPOCH_EXHAUSTED');ok(b.digest()===bd&&b.allocs===al&&!b.refs(10),'replacement mutated');});
test('ranking-exhaustion-no-side-effect',()=>{const s=new Session({maxRank:2});s.rank();const x=s.rank();throws(()=>s.rank(),'RANK_EXHAUSTED');ok(s.lastRank===x&&s.rankGen===2,'rank mutated');});
test('oracle-sensitivity',()=>{const s=new Session();s.search(512,64);ok(s.lastRank.entries[0].action===0,'baseline oracle');ok(s.lastRank.entries[0].action!==1,'bad oracle accepted');});

let pass=0;for(const [id,fn] of tests){try{fn();pass++;console.log('test='+id+' result=pass');}catch(e){console.log('test='+id+' result=fail error='+JSON.stringify(e.stack||String(e)));}}
console.log('capsule=session-001 expected='+tests.length+' discovered='+tests.length+' executed='+tests.length+' passed='+pass+' failed='+(tests.length-pass)+' required_skipped=0 conditional_skipped=0 optional_skipped=0 not_discovered=0');
process.exitCode=pass===tests.length?0:1;
