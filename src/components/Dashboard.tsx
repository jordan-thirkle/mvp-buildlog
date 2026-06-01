import React,{useState,useEffect}from'react';

interface Entry{id:string;type:'build'|'deploy'|'milestone'|'learn';title:string;desc:string;ts:number;url?:string}
const icons:Record<string,string>={build:'🔨',deploy:'🚀',milestone:'🏆',learn:'💡'};

function genId(){return Date.now().toString(36)+Math.random().toString(36).slice(2,7)}

function formatDate(ts:number){return new Date(ts).toLocaleString('en-US',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}

function generateDevlog(entries:Entry[]):string{
  const latest=entries.slice(-5).reverse();
  const lines=latest.map(e=>`- **${e.title}** — ${e.desc} (${formatDate(e.ts)})`).join('\n');
  return `---\ntitle: "Weekly Build Log"\ndescription: "What shipped this week."\npubDate: ${new Date().toISOString()}\ntags: ["Build-in-Public", "Indie"]\n---\n\n## This Week\n\n${lines}\n\nBuilt with [BuildLog](https://buildlog.vercel.app).`;
}

function generateTweet(entry:Entry):string{
  const icon=icons[entry.type]||'';
  const text=`${icon} ${entry.title} — ${entry.desc}`;
  if(entry.url){return `${text} ${entry.url}`}
  if(text.length>260)return text.substring(0,257)+'...';
  return text;
}

function generateThread(entries:Entry[]):string{
  const last5=entries.slice(-5).reverse();
  return `🧵 This week in build:\n\n${last5.map((e,i)=>`${i+1}. ${e.title} — ${e.desc}`).join('\n\n')}\n\nBuilt with BuildLog`;
}

export const Dashboard:React.FC=()=>{
  const [entries,setEntries]=useState<Entry[]>(()=>{
    try{const s=localStorage.getItem('buildlog-entries');return s?JSON.parse(s):[]}catch{return[]}
  });
  const [showAdd,setShowAdd]=useState(false);
  const [newEntry,setNewEntry]=useState<Partial<Entry>>({type:'build',title:'',desc:'',url:''});
  const [activeTab,setActiveTab]=useState<'log'|'devlog'|'tweets'|'export'>('log');
  const [copied,setCopied]=useState(false);

  useEffect(()=>{localStorage.setItem('buildlog-entries',JSON.stringify(entries))},[entries]);

  const add=()=>{
    if(!newEntry.title||!newEntry.desc)return;
    setEntries(p=>[...p,{id:genId(),type:(newEntry.type as Entry['type'])||'build',title:newEntry.title||'',desc:newEntry.desc||'',ts:Date.now(),url:newEntry.url||undefined}]);
    setNewEntry({type:'build',title:'',desc:'',url:''});setShowAdd(false);
  };
  const del=(id:string)=>setEntries(p=>p.filter(e=>e.id!==id));
  const copy=(t:string)=>{navigator.clipboard.writeText(t);setCopied(true);setTimeout(()=>setCopied(false),2000)};

  const recent=[...entries].reverse();

  return <div className="space-y-8">
    <div className="flex flex-wrap items-center gap-3">
      <button onClick={()=>setShowAdd(true)} className="btn">+ Add Entry</button>
      {['log','devlog','tweets','export'].map(t=><button key={t} onClick={()=>setActiveTab(t as any)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab===t?'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20':'text-zinc-500 hover:text-white border border-transparent'}`}>{t==='log'?'Activity':t==='devlog'?'Devlog':'tweets'?t==='tweets'?'X Posts':'Export':'Export'}</button>)}
      <span className="ml-auto text-xs text-zinc-600 font-mono">{entries.length} entries</span>
    </div>

    {activeTab==='log'&&<div className="space-y-2">
      {recent.length===0&&<p className="text-zinc-500 text-sm py-8 text-center">No entries yet. Click "+ Add Entry" to log your first build activity.</p>}
      {recent.map(e=><div key={e.id} className="card flex items-start justify-between gap-3"><div className="flex gap-3 min-w-0"><span className="text-xl mt-0.5">{icons[e.type]}</span><div className="min-w-0"><p className="font-bold text-white text-sm">{e.title}</p><p className="text-zinc-400 text-sm">{e.desc}</p><div className="flex items-center gap-3 mt-1.5 text-xs text-zinc-600"><span className="font-mono">{formatDate(e.ts)}</span>{e.url&&<a href={e.url} target="_blank" rel="noopener" className="text-emerald-500 hover:text-emerald-400">View →</a>}</div></div></div><button onClick={()=>del(e.id)} className="text-zinc-600 hover:text-red-400 text-lg shrink-0">×</button></div>)}
    </div>}

    {activeTab==='devlog'&&<div className="space-y-4">
      <p className="text-zinc-400 text-sm">Auto-generated MDX devlog entry from your last 5 entries. Copy and paste into your Astro/Next.js devlog collection.</p>
      <pre className="card !bg-black/50 text-sm font-mono text-emerald-400 whitespace-pre-wrap overflow-x-auto">{generateDevlog(entries)}</pre>
      <button onClick={()=>copy(generateDevlog(entries))} className="btn2">{copied?'Copied!':'Copy MDX'}</button>
    </div>}

    {activeTab==='tweets'&&<div className="space-y-4">
      <p className="text-zinc-400 text-sm">Ready-to-post X/Twitter thread from your build activity. Click Copy to draft each tweet.</p>
      {recent.slice(0,5).map((e,i)=><div key={e.id} className="card flex justify-between items-start gap-3"><div className="flex gap-2 min-w-0"><span className="text-lg">{icons[e.type]}</span><p className="text-sm text-zinc-300">{generateTweet(e)}</p></div><button onClick={()=>copy(generateTweet(e))} className="btn2 !text-xs !px-3 !py-1.5 shrink-0">{copied?'✓':'Copy'}</button></div>)}
      {entries.length>=2&&<div className="card"><p className="text-xs text-zinc-500 mb-2">Thread version (paste all at once)</p><pre className="text-sm text-zinc-300 whitespace-pre-wrap">{generateThread(entries)}</pre><button onClick={()=>copy(generateThread(entries))} className="btn2 mt-3">Copy Thread</button></div>}
    </div>}

    {activeTab==='export'&&<div className="space-y-4">
      <p className="text-zinc-400 text-sm">Export your build log as JSON or Markdown for use anywhere.</p>
      <div className="flex gap-3"><button onClick={()=>{const b=new Blob([JSON.stringify(entries,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='buildlog.json';a.click()}} className="btn2">Export JSON</button><button onClick={()=>{const md=entries.map(e=>`## ${icons[e.type]} ${e.title}\n${e.desc}\n_${formatDate(e.ts)}_\n${e.url||''}`).join('\n\n');const b=new Blob([md],{type:'text/markdown'});const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='buildlog.md';a.click()}} className="btn2">Export Markdown</button></div>
      <p className="text-xs text-zinc-600">Pro tip: Import this into your Astro devlog collection by saving the MDX output to <code className="text-emerald-500">src/data/devlog/</code></p>
    </div>}

    {showAdd&&<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={e=>{if(e.target===e.currentTarget)setShowAdd(false)}}><div className="card max-w-md w-full space-y-4"><h3 className="text-white text-lg">Log Activity</h3><div><label className="label">Type</label><div className="flex gap-2">{Object.entries(icons).map(([k,v])=><button key={k} onClick={()=>setNewEntry(p=>({...p,type:k as Entry['type']}))} className={`px-3 py-2 rounded-lg text-sm font-medium ${newEntry.type===k?'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20':'text-zinc-500 border border-zinc-800'}`}>{v} {k}</button>)}</div></div><div><label className="label">Title</label><input className="input" placeholder="e.g. Deployed new feature" value={newEntry.title} onChange={e=>setNewEntry(p=>({...p,title:e.target.value}))} onKeyDown={e=>e.key==='Enter'&&add()}/></div><div><label className="label">Description</label><textarea className="input min-h-[80px] !font-sans" placeholder="What happened? Why does it matter?" value={newEntry.desc} onChange={e=>setNewEntry(p=>({...p,desc:e.target.value}))}/></div><div><label className="label">Link (optional)</label><input className="input" placeholder="https://..." value={newEntry.url} onChange={e=>setNewEntry(p=>({...p,url:e.target.value}))}/></div><div className="flex gap-3"><button onClick={add} className="btn flex-1">Add Entry</button><button onClick={()=>setShowAdd(false)} className="btn2 flex-1">Cancel</button></div></div></div>}
  </div>;
};
