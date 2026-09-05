"use client";

import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent } from "react";

type Screen = "title" | "overworld" | "room";
type Pyodide = { runPythonAsync: (code: string) => Promise<unknown> };
declare global { interface Window { loadPyodide?: (options: { indexURL: string }) => Promise<Pyodide> } }

const rooms = [
  { id: 1, name: "THE FALLEN ROOM", lesson: "PRINT · STRINGS · NUMBERS · VARIABLES", x: 8, y: 64 },
  { id: 2, name: "CHOICE CAVES", lesson: "IF · ELIF · ELSE", x: 31, y: 39 },
  { id: 3, name: "ENDLESS HALL", lesson: "FOR · WHILE · RANGE", x: 58, y: 18 },
  { id: 4, name: "THE BAG", lesson: "LISTS · INDEXING", x: 72, y: 61 },
  { id: 5, name: "THE ARCHIVE", lesson: "DICTIONARIES · DATA", x: 43, y: 78 },
  { id: 6, name: "THE WORKSHOP", lesson: "FUNCTIONS · RETURN", x: 12, y: 17 },
];

export default function Home() {
  const [screen, setScreen] = useState<Screen>("title");
  const [unlocked, setUnlocked] = useState(1);
  const [xp, setXp] = useState(0);
  const [code, setCode] = useState("");
  const [output, setOutput] = useState("");
  const [running, setRunning] = useState(false);
  const [ready, setReady] = useState(false);
  const [room, setRoom] = useState(1);
  const [menu, setMenu] = useState<"fight" | "act" | "item" | "mercy" | null>(null);
  const [talk, setTalk] = useState(0);
  const [completed, setCompleted] = useState(false);
  const pyodide = useRef<Pyodide | null>(null);
  const textarea = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const saved = Number(localStorage.getItem("python-underground-unlocked") || "1");
    setUnlocked(Math.max(1, Math.min(6, saved)));
    let cancelled = false;
    const url = "https://cdn.jsdelivr.net/pyodide/v0.27.7/full/";
    const load = async () => {
      try {
        if (!window.loadPyodide) await new Promise<void>((resolve, reject) => {
          const s = document.createElement("script"); s.src = `${url}pyodide.js`; s.async = true;
          s.onload = () => resolve(); s.onerror = () => reject(new Error("Python engine failed to load."));
          document.body.appendChild(s);
        });
        if (!cancelled && window.loadPyodide) { pyodide.current = await window.loadPyodide({ indexURL: url }); setReady(true); }
      } catch { if (!cancelled) setReady(false); }
    };
    void load();
    return () => { cancelled = true; };
  }, []);

  const start = () => { setScreen("overworld"); setMenu(null); };
  const enterRoom = (id: number) => { if (id <= unlocked) { setRoom(id); setScreen("room"); setCode(""); setOutput(""); setMenu(null); setCompleted(false); } };
  const completeRoom = () => {
    const next = Math.min(6, Math.max(unlocked, room + 1));
    setUnlocked(next); setXp(v => Math.min(100, v + 25)); setCompleted(true);
    localStorage.setItem("python-underground-unlocked", String(next));
  };

  const runCode = async () => {
    if (!pyodide.current || running || !code.trim()) return;
    setRunning(true); setOutput("");
    try {
      const wrapped = `import io, contextlib\n_buffer=io.StringIO()\nwith contextlib.redirect_stdout(_buffer), contextlib.redirect_stderr(_buffer):\n    exec(${JSON.stringify(code)}, {})\n_buffer.getvalue()`;
      const result = await pyodide.current.runPythonAsync(wrapped);
      const text = String(result ?? ""); setOutput(text || "[ no output ]");
      if (text.trim()) setXp(v => Math.min(100, v + 10));
    } catch (error) { setOutput(String(error).replace(/^PythonError:\s*/, "")); }
    finally { setRunning(false); }
  };

  const keyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.shiftKey && e.key === "Enter") { e.preventDefault(); void runCode(); return; }
    if (e.key === "Tab") { e.preventDefault(); const a=e.currentTarget.selectionStart,b=e.currentTarget.selectionEnd; setCode(code.slice(0,a)+"    "+code.slice(b)); requestAnimationFrame(()=>textarea.current?.setSelectionRange(a+4,a+4)); }
  };

  if (screen === "title") return (
    <main className="game title-screen">
      <div className="crt" />
      <div className="title-stars" />
      <div className="title-cast"><div className="ghost ghost-a">◢</div><div className="ghost ghost-b">◣</div></div>
      <section className="title-box">
        <div className="tiny">★ A PYTHON LEARNING RPG ★</div>
        <h1>PYTHON<br/><span>UNDERGROUND</span></h1>
        <p className="story">A strange language. A hidden world.<br/>Your choices are made with code.</p>
        <button className="menu-button selected" onClick={start}><b>♥</b> START GAME</button>
        <button className="menu-button" onClick={()=>{setUnlocked(1);localStorage.removeItem("python-underground-unlocked");setXp(0)}}>RESET FILE</button>
        <div className="title-help">[ ENTER ] SELECT &nbsp;&nbsp; [ SHIFT + ENTER ] CAST</div>
      </section>
      <div className="file-slot">FILE 01&nbsp;&nbsp; • &nbsp;&nbsp;LV 1&nbsp;&nbsp; • &nbsp;&nbsp;XP {xp}/100</div>
    </main>
  );

  if (screen === "overworld") return (
    <main className="game overworld">
      <header className="hud"><button onClick={()=>setScreen("title")}>PYTHON★</button><span>THE UNDERGROUND</span><span>LV 1&nbsp;&nbsp; HP 20/20</span></header>
      <section className="world-wrap">
        <div className="map-dialog">
          <div className="face ghost-face">:)</div>
          <div><b>BYTE</b><p>{talk===0 ? "You made it. Don't worry, the rooms only look dangerous." : talk===1 ? "Every room teaches you something. Every spell is real Python." : "The heart moves. The code changes the world."}</p><button onClick={()=>setTalk(v=>(v+1)%3)}>[ TALK ]</button></div>
        </div>
        <div className="world-map">
          <div className="map-name">THE PYTHON UNDERGROUND</div>
          <div className="path path-a"/><div className="path path-b"/><div className="path path-c"/><div className="path path-d"/>
          <div className="player-heart">♥</div>
          {rooms.map(r=><button key={r.id} className={`room-node ${r.id<=unlocked?"unlocked":"locked"}`} style={{left:`${r.x}%`,top:`${r.y}%`}} disabled={r.id>unlocked} onClick={()=>enterRoom(r.id)}><span>{r.id<unlocked?"✓":r.id===unlocked?"♥":"?"}</span><b>{r.name}</b><small>{r.lesson}</small></button>)}
          <div className="save-point" onClick={()=>{localStorage.setItem("python-underground-unlocked",String(unlocked));setTalk(2)}}><div>♥</div><span>SAVE POINT</span></div>
        </div>
      </section>
      <footer className="bottom-hud"><span>XP</span><div className="bar"><i style={{width:`${xp}%`}}/></div><span>{xp}/100</span><span>ROOMS {unlocked}/6</span><span className="objective">OBJECTIVE: EXPLORE • LEARN • SURVIVE</span></footer>
    </main>
  );

  const current = rooms[room-1];
  return (
    <main className="game room-screen">
      <header className="hud"><button onClick={()=>setScreen("overworld")}>← MAP</button><span>ROOM {String(room).padStart(2,"0")} — {current.name}</span><span className={ready?"ready":""}>{ready?"● PYTHON READY":"○ LOADING PYTHON"}</span></header>
      <div className="room-layout">
        <aside className="room-sidebar">
          <div className="side-sprite">◢</div><div className="nameplate">MOSS</div>
          <p className="aside-quote">"I am a very literal creature. Please be specific."</p>
          <div className="stats"><span>LV 1</span><span>HP 20/20</span><span>XP {xp}/100</span></div>
          <div className="quest-box"><b>QUEST</b><br/><br/>{room===1?"Make Python speak.\nLearn your first four spells.":"Clear this room by solving its Python encounter."}</div>
          <div className="inventory"><b>ITEMS</b><br/><span>★ EMPTY POCKET</span><br/><span>★ NOTEBOOK</span></div>
        </aside>
        <section className="room-main">
          <div className="room-banner"><span>AREA 0{room}</span><h1>{room===1?<>THE FIRST<br/><em>ENCOUNTER</em></>:current.name}</h1><p>{room===1?"The first room is quiet. Something is waiting for your command.":`New territory. New Python. ${current.lesson}.`}</p></div>
          <div className="encounter">
            <div className="enemy-stage"><div className="enemy-sprite">◢</div><div className="enemy-name">A WILD BUG APPEARED!</div><p>{menu===null?"It is staring directly at your code.":menu==="fight"?"You chose FIGHT. Your weapon is knowledge.":menu==="act"?"ACT → STUDY. Inspect the creature's weakness.":menu==="item"?"ITEM → NOTEBOOK. Maybe your notes can help.":"MERCY is not available yet. Learn the spell first."}</p></div>
            <div className="battle-menu">
              <button className={menu==="fight"?"active":""} onClick={()=>setMenu("fight")}>FIGHT</button><button className={menu==="act"?"active":""} onClick={()=>setMenu("act")}>ACT</button><button className={menu==="item"?"active":""} onClick={()=>setMenu("item")}>ITEM</button><button className={menu==="mercy"?"active":""} onClick={()=>setMenu("mercy")}>MERCY</button>
            </div>
            {menu && <div className="action-panel"><b>{menu.toUpperCase()}</b><p>{menu==="fight"?"Attack the bug by making Python print exactly what it asks for.":menu==="act"?"Study the four concepts below, then test one in the editor.":menu==="item"?"Notebook tip: quotes make text. Numbers do not need quotes.":"Mercy unlocks after you understand the encounter."}</p></div>}
          </div>
          <div className="lesson-cards">
            <article><span>01</span><h3>PRINT</h3><p>Make Python say something.</p><code>print("hello")</code></article>
            <article><span>02</span><h3>STRINGS</h3><p>Text lives inside quotes.</p><code>"hello"</code></article>
            <article><span>03</span><h3>NUMBERS</h3><p>Python can do arithmetic.</p><code>2 + 3</code></article>
            <article><span>04</span><h3>VARIABLES</h3><p>Give a value a name.</p><code>name = "Moss"</code></article>
          </div>
          <div className="coding-room">
            <div className="coding-head"><b>★ CAST YOUR SPELL</b><span>EMPTY SPELLBOOK</span></div>
            <div className="challenge"><span>♥</span><div><b>THE BUG ASKS:</b><p>{room===1?"Print your name. Anything you choose.":"Use what you learned to complete this room's challenge."}</p></div></div>
            <div className="editor"><div className="numbers">01<br/>02<br/>03<br/>04<br/>05<br/>06</div><textarea ref={textarea} value={code} onChange={e=>setCode(e.target.value)} onKeyDown={keyDown} spellCheck={false} placeholder={'Type your Python here...\n\nTry: print("hello")'} /></div>
            <div className="run-row"><button className="run-button" disabled={!ready||running||!code.trim()} onClick={()=>void runCode()}>{running?"CASTING...":"▶ RUN SPELL"}</button><span>SHIFT + ENTER RUNS &nbsp; • &nbsp; ENTER MAKES A NEW LINE</span></div>
            <div className="output"><div className="output-title"><b>SCREEN</b><button onClick={()=>setOutput("")}>CLEAR</button></div><pre>{output || "_"}</pre></div>
          </div>
          <div className="room-footer"><button onClick={()=>setScreen("overworld")}>← RETURN TO MAP</button><button className={completed?"done":""} onClick={completeRoom}>{completed?"✓ ROOM CLEARED":"I UNDERSTAND →"}</button></div>
          {completed && <div className="unlock-banner">★ ROOM CLEARED ★ &nbsp; +25 XP &nbsp; • &nbsp; {unlocked<6?`AREA ${String(unlocked).padStart(2,"0")} UNLOCKED`:`ALL AREAS UNLOCKED`}</div>}
        </section>
      </div>
    </main>
  );
}
