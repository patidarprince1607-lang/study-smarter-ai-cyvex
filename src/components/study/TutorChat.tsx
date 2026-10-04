import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { tutorChat } from "@/lib/learn.functions";
import type { LearnerContext } from "@/lib/types";
import { Markdown } from "./Markdown";

type Msg = { role: "user" | "model"; text: string };
const SUGGEST = ["Why can't I use binary search on an unsorted array?", "Explain mid in simple terms", "Give me a C implementation", "Give me an exam answer"];

export function TutorChat({ ctx, topic, weakArea }: { ctx: LearnerContext; topic: string; weakArea?: string }) {
  const chat = useServerFn(tutorChat);
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { end.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, busy]);
  useEffect(() => { if (open && !busy) inputRef.current?.focus(); }, [open, busy]);

  const send = async (text: string) => {
    if (!text.trim() || busy) return;
    const next = [...msgs, { role: "user" as const, text: text.trim() }];
    setMsgs(next); setInput(""); setBusy(true);
    try {
      const r = await chat({ data: { ctx: { ...ctx, doubt: ctx.doubt || `Learning ${topic}` }, topic, weakArea, messages: next.slice(-20) } });
      setMsgs([...next, { role: "model", text: r.text }]);
    } catch (e: any) {
      setMsgs([...next, { role: "model", text: `⚠️ ${e.message}` }]);
    } finally { setBusy(false); }
  };

  return (
    <>
      <button onClick={() => setOpen((o) => !o)} className="btn-primary fixed bottom-5 right-5 z-40" aria-label="Open AI Tutor">
        {open ? "Close" : "✦ Ask AI Tutor"}
      </button>
      {open && (
        <div className="card-surface fixed bottom-20 right-4 left-4 sm:left-auto z-40 flex h-[70vh] sm:w-[400px] flex-col overflow-hidden animate-pop">
          <div className="bg-brand px-5 py-4 text-primary-foreground">
            <div className="font-bold">AI Tutor</div>
            <div className="text-xs opacity-80">Context: {topic}{weakArea ? ` · weak area: ${weakArea}` : ""} · Gemma 4</div>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {!msgs.length && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Ask a follow-up about {topic}:</p>
                {SUGGEST.map((s) => <button key={s} onClick={() => send(s)} className="chip w-full text-left">{s}</button>)}
              </div>
            )}
            {msgs.map((m, i) => m.role === "user"
              ? <div key={i} className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-sm text-primary-foreground">{m.text}</div>
              : <div key={i} className="max-w-full"><Markdown>{m.text}</Markdown></div>)}
            {busy && <div className="text-sm text-muted-foreground animate-pulse">Tutor is thinking…</div>}
            <div ref={end} />
          </div>
          <form className="flex gap-2 border-t p-3" onSubmit={(e) => { e.preventDefault(); send(input); }}>
            <textarea ref={inputRef} rows={1} value={input} onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
              placeholder="Ask anything…" className="flex-1 resize-none rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:border-electric" />
            <button className="btn-primary !px-4 !py-2 text-sm" disabled={busy || !input.trim()}>Send</button>
          </form>
        </div>
      )}
    </>
  );
}
