"use client";

import { useEffect, useRef, useState } from "react";

type Pyodide = { runPythonAsync: (code: string) => Promise<unknown> };

declare global { interface Window { loadPyodide?: (options: { indexURL: string }) => Promise<Pyodide> } }

const lessons = [
  { id: "basics", label: "PYTHON BASICS", sub: "Print · Variables · Input", status: "current" },
  { id: "logic", label: "MAKING DECISIONS", sub: "if · elif · else", status: "locked" },
  { id: "loops", label: "LOOPS", sub: "for · while · range", status: "locked" },
  { id: "lists", label: "LISTS", sub: "Store · Find · Change", status: "locked" },
  { id: "dictionaries", label: "DICTIONARIES", sub: "Keys · Values · Data", status: "locked" },
  { id: "functions", label: "FUNCTIONS", sub: "Build your own tools", status: "locked" },
];

export default function Home() {
  const [screen, setScreen] = useState<"cover" | "map" | "lesson">("cover");
  const [code, setCode] = useState('print("Hello, world!")');
  const [output, setOutput] = useState("");
  const [running, setRunning] = useState(false);
  const [ready, setReady] = useState(false);
  const [completed, setCompleted] = useState(false);
  const pyodide = useRef<Pyodide | null>(null);
  const textarea = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/pyodide/v0.27.7/full/pyodide.js";
    script.async = true;
    script.onload = async () => {
      if (window.loadPyodide) {
        pyodide.current = await window.loadPyodide({ indexURL: "https://cdn.jsdelivr.net/pyodide/v0.27.7/full/" });
        setReady(true);
      }
    };
    document.body.appendChild(script);
    return () => { script.remove(); };
  }, []);

  const runCode = async () => {
    if (!pyodide.current || running) return;
    setRunning(true);
    setOutput("");
    try {
      const result = await pyodide.current.runPythonAsync(`
import io, contextlib
_buffer = io.StringIO()
with contextlib.redirect_stdout(_buffer), contextlib.redirect_stderr(_buffer):
    exec(${JSON.stringify(code)})
_buffer.getvalue()
`);
      const text = String(result ?? "");
      setOutput(text || "(ran successfully — no output)");
      if (code.includes("print") && text.trim()) {
        setCompleted(true);
        localStorage.setItem("python-lab-basics", "complete");
      }
    } catch (error) {
      setOutput(String(error).replace(/^PythonError:\s*/, ""));
    } finally { setRunning(false); }
  };

  const onEditorKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.shiftKey && e.key === "Enter") {
      e.preventDefault();
      void runCode();
    }
    if (e.key === "Tab") {
      e.preventDefault();
      const start = e.currentTarget.selectionStart;
      const end = e.currentTarget.selectionEnd;
      const next = code.slice(0, start) + "    " + code.slice(end);
      setCode(next);
      requestAnimationFrame(() => {
        textarea.current?.setSelectionRange(start + 4, start + 4);
      });
    }
  };

  useEffect(() => {
    setCompleted(localStorage.getItem("python-lab-basics") === "complete");
  }, []);

  if (screen === "cover") return (
    <main className="cover page-shell">
      <div className="grain" />
      <div className="cover-orbit orbit-one" /><div className="cover-orbit orbit-two" />
      <div className="cover-content">
        <div className="eyebrow">A SMALL WORLD OF CODE</div>
        <h1>PYTHON</h1>
        <div className="rule" />
        <p className="tagline">Learn by making.</p>
        <p className="intro">A journey from knowing nothing<br />to building your own things.</p>
        <button className="begin" onClick={() => setScreen("map")}>BEGIN <span>→</span></button>
        <p className="hint">NO PRIOR PYTHON EXPERIENCE REQUIRED</p>
      </div>
      <div className="corner-mark">01 / 06</div>
    </main>
  );

  if (screen === "map") return (
    <main className="map page-shell">
      <header className="topbar"><button className="wordmark" onClick={() => setScreen("cover")}>PYTHON<span>.</span></button><div className="progress">JOURNEY <span>01 / 06</span></div></header>
      <section className="map-intro"><p className="eyebrow">YOUR JOURNEY</p><h2>THE WORLD IS<br /><em>UNWRITTEN.</em></h2><p>Each place teaches you something you can use in the next.</p></section>
      <section className="world-map" aria-label="Python course map">
        <div className="path path-a" /><div className="path path-b" /><div className="path path-c" />
        <button className="node node-basics active" onClick={() => setScreen("lesson")}><span className="node-dot">●</span><b>01</b><strong>PYTHON BASICS</strong><small>PRINT · VARIABLES · INPUT</small></button>
        <button className="node node-logic locked"><span className="node-dot">○</span><b>02</b><strong>DECISIONS</strong><small>IF · ELIF · ELSE</small></button>
        <button className="node node-loops locked"><span className="node-dot">○</span><b>03</b><strong>LOOPS</strong><small>FOR · WHILE · RANGE</small></button>
        <button className="node node-lists locked"><span className="node-dot">○</span><b>04</b><strong>LISTS</strong><small>STORE · FIND · CHANGE</small></button>
        <button className="node node-data locked"><span className="node-dot">○</span><b>05</b><strong>DATA</strong><small>DICTIONARIES</small></button>
        <button className="node node-functions locked"><span className="node-dot">○</span><b>06</b><strong>FUNCTIONS</strong><small>BUILD YOUR OWN TOOLS</small></button>
        <div className="map-star">✦</div><div className="map-note">THE FIRST STEP<br /><span>IS THE STRANGEST.</span></div>
      </section>
      <footer className="map-footer"><span>6 AREAS</span><span>1 UNLOCKED</span><span>BUILD · EXPLORE · UNDERSTAND</span></footer>
    </main>
  );

  return (
    <main className="lesson page-shell">
      <header className="topbar lesson-bar"><button className="back" onClick={() => setScreen("map")}>← MAP</button><div className="lesson-title">01 — PYTHON BASICS</div><div className="status"><i className={ready ? "online" : "loading"} /> {ready ? "PYTHON READY" : "LOADING PYTHON"}</div></header>
      <div className="lesson-layout">
        <aside className="lesson-side"><p className="eyebrow">AREA 01</p><h2>Python<br />Basics</h2><div className="side-rule" /><p>Start here. Everything later grows from these pieces.</p><div className="mini-list"><span className="done">01 PRINT</span><span>02 VARIABLES</span><span>03 STRINGS</span><span>04 NUMBERS</span><span>05 INPUT</span><span>06 OPERATORS</span></div></aside>
        <section className="lesson-main">
          <div className="lesson-copy"><p className="eyebrow">FIRST CONCEPT</p><h1>MAKE PYTHON<br /><em>SPEAK.</em></h1><p>Python can display something on your screen using a function called <code>print()</code>.</p></div>
          <div className="example"><span>EXAMPLE</span><pre>print("Hello, world!")</pre></div>
          <div className="try-card">
            <div className="try-head"><div><span className="eyebrow">YOUR TURN</span><h3>Print your name.</h3></div><span className="shortcut">SHIFT + ENTER <b>↵</b></span></div>
            <div className="editor-wrap"><div className="line-numbers">{code.split("\n").map((_, i) => <span key={i}>{String(i + 1).padStart(2, "0")}</span>)}</div><textarea ref={textarea} value={code} onChange={e => setCode(e.target.value)} onKeyDown={onEditorKeyDown} spellCheck={false} aria-label="Python code editor" /></div>
            <div className="run-row"><button className="run" onClick={() => void runCode()} disabled={!ready || running}>{running ? "RUNNING…" : "RUN  ▶"}</button><span>{ready ? "Runs in your browser." : "Starting your Python engine…"}</span></div>
          </div>
          <div className="output"><div className="output-label">OUTPUT</div><pre>{output || "Your output will appear here."}</pre></div>
          {completed && <div className="success"><span>✓</span><div><strong>It worked.</strong><small>You just ran your first Python program.</small></div><button onClick={() => setScreen("map")}>RETURN TO MAP →</button></div>}
        </section>
      </div>
    </main>
  );
}
