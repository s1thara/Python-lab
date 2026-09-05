"use client";

import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent } from "react";

type Pyodide = { runPythonAsync: (code: string) => Promise<unknown> };
declare global { interface Window { loadPyodide?: (options: { indexURL: string }) => Promise<Pyodide> } }

const areas = [
  ["01", "THE FIRST ROOM", "print · variables · input"], ["02", "THE CHOICE PATH", "if · elif · else"],
  ["03", "THE ENDLESS HALL", "for · while · range"], ["04", "THE BAG", "lists · indexing · change"],
  ["05", "THE ARCHIVE", "dictionaries · data"], ["06", "THE WORKSHOP", "functions · return"],
];

export default function Home() {
  const [screen, setScreen] = useState<"cover" | "map" | "lesson">("cover");
  const [code, setCode] = useState("");
  const [output, setOutput] = useState("");
  const [running, setRunning] = useState(false);
  const [ready, setReady] = useState(false);
  const [xp, setXp] = useState(0);
  const [message, setMessage] = useState(false);
  const pyodide = useRef<Pyodide | null>(null);
  const textarea = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    let cancelled = false;
    const url = "https://cdn.jsdelivr.net/pyodide/v0.27.7/full/";
    const load = async () => {
      try {
        if (!window.loadPyodide) await new Promise<void>((resolve, reject) => { const s = document.createElement("script"); s.src = `${url}pyodide.js`; s.async = true; s.onload = () => resolve(); s.onerror = () => reject(new Error("Python engine failed to load.")); document.body.appendChild(s); });
        if (!cancelled && window.loadPyodide) { pyodide.current = await window.loadPyodide({ indexURL: url }); setReady(true); }
      } catch { if (!cancelled) setReady(false); }
    };
    void load(); return () => { cancelled = true; };
  }, []);

  const runCode = async () => {
    if (!pyodide.current || running || !code.trim()) return;
    setRunning(true); setOutput("");
    try {
      const result = await pyodide.current.runPythonAsync(`import io, contextlib\n_buffer=io.StringIO()\nwith contextlib.redirect_stdout(_buffer), contextlib.redirect_stderr(_buffer):\n    exec(${JSON.stringify(code)}, {})\n_buffer.getvalue()`);
      const text = String(result ?? ""); setOutput(text || "[ no output ]"); if (text.trim()) setXp(v => Math.min(100, v + 10));
    } catch (error) { setOutput(String(error).replace(/^PythonError:\s*/, "")); } finally { setRunning(false); }
  };

  const onEditorKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.shiftKey && e.key === "Enter") { e.preventDefault(); void runCode(); return; }
    if (e.key === "Tab") { e.preventDefault(); const start=e.currentTarget.selectionStart,end=e.currentTarget.selectionEnd; setCode(code.slice(0,start)+"    "+code.slice(end)); requestAnimationFrame(()=>textarea.current?.setSelectionRange(start+4,start+4)); }
  };

  if (screen === "cover") return <main className="rpg cover-screen"><div className="stars" /><div className="cover-monsters"><div className="sprite byte"><i /><i /></div><div className="sprite moss"><i /><i /></div></div><div className="cover-content"><p className="pixel-label">★ A PYTHON ADVENTURE ★</p><h1>PYTHON<br /><span>UNDERGROUND</span></h1><p>You fell into a strange little world.<br />The only way forward is to learn its language.</p><button className="pixel-button" onClick={()=>setScreen("map")}>START GAME</button><small>[ ENTER ] BEGIN &nbsp; [ SHIFT + ENTER ] RUN</small></div><div className="save-chip">FILE 01 • NEW ADVENTURE</div></main>;

  if (screen === "map") return <main className="rpg map-screen"><header className="game-header"><button onClick={()=>setScreen("cover")}>PYTHON★</button><span>AREA 01 / 06</span><span>LV 1 &nbsp; HP 20/20</span></header><section className="map-layout"><div className="dialogue npc"><div className="sprite byte small"><i/><i/></div><div><b>BYTE</b><p>Oh. You&apos;re finally here.</p><p>This place is made of code. Weird, right?</p><p>Walk around. Learn things.</p></div></div><div className="world-room"><div className="room-title">THE PYTHON UNDERGROUND</div><div className="room-grid"/><div className="hero">♥</div><div className="room-sign">[ READ ]<br/><span>EVERYTHING IS CONNECTED.</span></div>{areas.map(([num,title,sub],i)=><button key={num} disabled={i!==0} className={`area-node ${i===0?"open":"locked"}`} onClick={()=>setScreen("lesson")}><b>{num}</b><strong>{title}</strong><small>{sub}</small></button>)}</div></section><footer className="status-bar"><span>XP {xp}/100</span><div className="xp"><i style={{width:`${xp}%`}}/></div><span>♥ 20/20</span><span>OBJECTIVE: LEARN THE BASICS</span></footer></main>;

  return <main className="rpg lesson-screen"><header className="game-header"><button onClick={()=>setScreen("map")}>← MAP</button><span>AREA 01 — THE FIRST ROOM</span><span className={ready?"ready":""}>{ready?"● PYTHON READY":"○ LOADING PYTHON"}</span></header><div className="lesson-grid"><aside className="character-panel"><div className="sprite moss big"><i/><i/></div><div className="nameplate">MOSS</div><p className="character-text">&quot;Coding is just telling a very literal creature exactly what to do.&quot;</p><div className="stat-block"><span>LV 1</span><span>XP {xp}/100</span><span>HP 20/20</span></div><div className="quest"><b>QUEST</b><br/>Make Python speak.<br/>Learn print, strings, numbers & variables.</div></aside><section className="lesson-content"><div className="chapter-head"><span>ROOM 01</span><h1>THE FIRST<br/><em>ENCOUNTER</em></h1><p>Python is a language. These are your first four pieces of vocabulary.</p></div><div className="dialogue lesson-dialogue"><span className="face">◆</span><div><b>BYTE</b><p>Try this spell:</p><code>print(&quot;Hello, world!&quot;)</code><p>Whatever is inside the parentheses appears on your screen.</p></div></div><div className="concept-row"><article><span>01</span><h3>PRINT</h3><p>Shows something.</p><code>print(&quot;hi&quot;)</code></article><article><span>02</span><h3>STRINGS</h3><p>Text inside quotes.</p><code>&quot;hello&quot;</code></article><article><span>03</span><h3>NUMBERS</h3><p>Python can calculate.</p><code>2 + 3</code></article><article><span>04</span><h3>VARIABLES</h3><p>A name holding a value.</p><code>name = &quot;Moss&quot;</code></article></div><div className="battle-card"><div className="battle-top"><span>★ ENCOUNTER: THE FIRST LINE</span><span>{running?"CASTING...":ready?"READY":"WAKING UP..."}</span></div><div className="prompt-box"><span className="heart">♥</span><p><b>MOSS</b> wants you to print your name.</p></div><div className="editor-wrap"><div className="line-numbers">01<br/>02<br/>03<br/>04<br/>05</div><textarea ref={textarea} value={code} onChange={e=>setCode(e.target.value)} onKeyDown={onEditorKeyDown} spellCheck={false} placeholder={'print("Your name")'} /></div><div className="action-row"><button className="pixel-button small-button" onClick={()=>void runCode()} disabled={!ready||running}>{running?"RUNNING...":"RUN CODE"}</button><span>SHIFT + ENTER = RUN</span><span>ENTER = NEW LINE</span></div></div><div className="output-box"><div className="output-head"><span>★ SCREEN OUTPUT</span><button onClick={()=>setOutput("")}>CLEAR</button></div><pre>{output||"_"}</pre></div><div className="lesson-nav"><button onClick={()=>setScreen("map")}>← RETURN TO MAP</button><button onClick={()=>{setMessage(true);setXp(100)}}>I UNDERSTAND →</button></div>{message&&<div className="level-up">★ YOU GOT IT! +100 XP ★ NEXT AREA UNLOCKED IN THE FULL JOURNEY.</div>}</section></div></main>;
}
