import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useRef, useState } from "react";
import { generateLesson } from "@/lib/learn.functions";
import { SAMPLE_LESSON } from "@/lib/sample-lesson";
import { LEVELS, PREFS, type Lesson, type Level, type Pref, type WrongAnswer } from "@/lib/types";
import { Markdown } from "@/components/study/Markdown";
import { MindMap } from "@/components/study/MindMap";
import { SearchVisual } from "@/components/study/SearchVisual";
import { Quiz } from "@/components/study/Quiz";
import { Reteach } from "@/components/study/Reteach";
import { TutorChat } from "@/components/study/TutorChat";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Study Smarter – AI Learning Engine" },
      { name: "description", content: "Turn any doubt into a personalized learning journey: notes, mind map, visuals, adaptive quiz and AI re-teaching." },
      { property: "og:title", content: "Study Smarter – AI Learning Engine" },
      { property: "og:description", content: "Don't just get an answer. Learn it your way." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const SUBJECTS = ["DSA", "Python", "DBMS", "Operating Systems", "Mathematics"];
const SECTIONS = [["explain", "Explanation"], ["notes", "Notes"], ["mindmap", "Mind Map"], ["visual", "Visual"], ["reallife", "Real life"], ["quiz", "Quiz"], ["reteach", "Re-teach"]] as const;
const DEFAULT_DOUBT = "I understand the definition of binary search, but I don't understand why we check the middle element first.";

function Index() {
  const gen = useServerFn(generateLesson);
  const [subject, setSubject] = useState("DSA");
  const [doubt, setDoubt] = useState(DEFAULT_DOUBT);
  const [level, setLevel] = useState<Level>("Beginner");
  const [pref, setPref] = useState<Pref>("Visual learner");
  const [lesson, setLesson] = useState<Lesson>(SAMPLE_LESSON);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [result, setResult] = useState<{ score: number; total: number; wrongs: WrongAnswer[] } | null>(null);
  const [weakArea, setWeakArea] = useState<string | undefined>();
  const lessonRef = useRef<HTMLDivElement>(null);
  const tutorRef = useRef<HTMLDivElement>(null);

  const ctx = { doubt, topic: lesson.topic, level, preference: pref };

  const teach = async () => {
    if (doubt.trim().length < 3) return;
    setLoading(true); setErr(null);
    try {
      const l = await gen({ data: { doubt: doubt.trim(), topic: subject === "DSA" ? "" : subject, level, preference: pref } });
      setLesson(l); setResult(null); setWeakArea(undefined);
      setTimeout(() => lessonRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    } catch (e: any) { setErr(e.message ?? "Something went wrong"); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand font-extrabold text-primary-foreground">S</div>
            <div className="leading-tight"><div className="font-extrabold">Study Smarter</div><div className="text-[9px] font-bold tracking-[0.2em] text-electric">AI LEARNING ENGINE</div></div>
          </div>
          <span className="hidden sm:inline-flex rounded-full bg-electric-soft px-3 py-1 text-xs font-semibold text-accent-foreground">Powered by Gemma 4</span>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-glow">
        <div className="mx-auto max-w-4xl px-5 pt-16 pb-12 text-center sm:pt-24">
          <div className="eyebrow">Your AI tutor that adapts to how YOU learn</div>
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-6xl">Don't just get an answer.<br /><span className="text-brand">Learn it your way.</span></h1>
          <p className="mx-auto mt-5 max-w-xl text-muted-foreground">Study Smarter turns your doubt into a personalized journey — notes, a connected mind map, visuals, a quiz, and re-teaching where you struggle.</p>
          <button className="btn-primary mt-8" onClick={() => tutorRef.current?.scrollIntoView({ behavior: "smooth" })}>Start AI Learning →</button>
          <div className="mt-8 flex flex-wrap justify-center gap-2">
            {SUBJECTS.map((s) => <button key={s} className="chip" data-active={subject === s} onClick={() => setSubject(s)}>{s}</button>)}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">Featured topic: <b className="text-primary">Binary Search</b></p>
        </div>
      </section>

      {/* Tutor input */}
      <section ref={tutorRef} className="mx-auto max-w-4xl scroll-mt-20 px-5 pb-12">
        <div className="card-surface p-6 sm:p-8">
          <h2 className="text-2xl font-extrabold">What are you struggling with?</h2>
          <p className="mt-1 text-sm text-muted-foreground">Type your own doubt — it's sent to Gemma 4 exactly as you write it.</p>
          <textarea value={doubt} onChange={(e) => setDoubt(e.target.value)} rows={3} maxLength={2000}
            className="mt-5 w-full resize-none rounded-xl border-2 bg-background p-4 text-base outline-none transition focus:border-electric" placeholder="e.g. Why does binary search need a sorted array?" />
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <div><div className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Learner level</div>
              <div className="flex flex-wrap gap-2">{LEVELS.map((l) => <button key={l} className="chip" data-active={level === l} onClick={() => setLevel(l)}>{l}</button>)}</div></div>
            <div><div className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Learning preference</div>
              <div className="flex flex-wrap gap-2">{PREFS.map((p) => <button key={p} className="chip" data-active={pref === p} onClick={() => setPref(p)}>{p}</button>)}</div></div>
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <button className="btn-primary" onClick={teach} disabled={loading || doubt.trim().length < 3}>{loading ? "Gemma 4 is building your lesson…" : "✦ Teach me"}</button>
            {loading && <span className="text-sm text-muted-foreground animate-pulse">Diagnosing your doubt → writing notes → mapping concepts → generating quiz</span>}
          </div>
          {err && <div className="mt-4 rounded-xl bg-destructive-soft p-4 text-sm text-destructive">{err}</div>}
        </div>
      </section>

      {/* Lesson */}
      <div ref={lessonRef} className="scroll-mt-16">
        <nav className="sticky top-[57px] z-20 border-y bg-background/90 backdrop-blur">
          <div className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-5 py-2">
            {SECTIONS.map(([id, label]) => <a key={id} href={`#${id}`} className="whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-primary">{label}</a>)}
          </div>
        </nav>

        <main className="mx-auto max-w-6xl space-y-16 px-5 py-12">
          <div className={`rounded-xl px-4 py-3 text-sm ${lesson.source === "gemma" ? "bg-success-soft" : "bg-warning-soft"}`}>
            {lesson.source === "gemma"
              ? <>✓ Generated live by <b className="font-mono">{lesson.model}</b> from your doubt, level ({level}) and preference ({pref}).</>
              : <>Sample lesson (pre-written) shown for preview. Click <b>✦ Teach me</b> to generate your own with Gemma 4.</>}
          </div>

          <Section id="explain" eyebrow="Personalized explanation" title={lesson.topic}>
            <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
              <div className="rounded-2xl bg-ink p-5 text-ink-foreground">
                <div className="text-xs font-bold uppercase tracking-wider opacity-70">AI diagnosis</div>
                <p className="mt-2 text-sm leading-relaxed">{lesson.diagnosis}</p>
              </div>
              <div className="card-surface p-6"><Markdown>{lesson.explanation}</Markdown></div>
            </div>
          </Section>

          <Section id="notes" eyebrow="Detailed notes" title="Your study notes">
            <div className="grid gap-4 md:grid-cols-2">
              {lesson.notes.map((n, i) => (
                <article key={i} className="card-surface p-6">
                  <div className="flex items-center gap-3"><span className="font-mono text-xs font-bold text-electric">{String(i + 1).padStart(2, "0")}</span><h3 className="font-bold">{n.heading}</h3></div>
                  <div className="mt-3"><Markdown>{n.body}</Markdown></div>
                  {n.bullets.length > 0 && <ul className="mt-3 space-y-1 border-t pt-3 text-sm">{n.bullets.map((b, k) => <li key={k} className="flex gap-2"><span className="text-electric">▸</span>{b}</li>)}</ul>}
                </article>
              ))}
            </div>
            {lesson.keyPoints.length > 0 && (
              <div className="mt-5 rounded-2xl border-2 border-dashed border-electric/40 bg-electric-soft p-6">
                <div className="font-bold text-primary">📌 Exam / Interview points</div>
                <ul className="mt-3 grid gap-2 sm:grid-cols-2 text-sm">{lesson.keyPoints.map((k, i) => <li key={i} className="flex gap-2"><span className="font-bold text-electric">✓</span>{k}</li>)}</ul>
              </div>
            )}
          </Section>

          <Section id="mindmap" eyebrow="Connected mind map" title="See how it all connects">
            <MindMap map={lesson.mindMap} />
          </Section>

          <Section id="visual" eyebrow="Visual explanation" title={lesson.visual.title || "See the search space shrink."}>
            <SearchVisual visual={lesson.visual} />
          </Section>

          <Section id="reallife" eyebrow="Example" title="Understand it in real life">
            <div className="grid gap-5 lg:grid-cols-2">
              <div className="card-surface p-6"><div className="text-3xl">💡</div><h3 className="mt-2 font-bold">{lesson.analogy.title}</h3><p className="mt-2 leading-relaxed text-foreground/80">{lesson.analogy.text}</p></div>
              <div className="card-surface p-6">
                <h3 className="font-bold">{lesson.example.title}</h3>
                <div className="mt-2"><Markdown>{lesson.example.text}</Markdown></div>
                {lesson.example.code && <div className="mt-3"><Markdown>{"```" + lesson.example.language + "\n" + lesson.example.code + "\n```"}</Markdown></div>}
              </div>
            </div>
          </Section>

          <Section id="quiz" eyebrow="Adaptive quiz" title="Test your understanding">
            <div className="max-w-2xl"><Quiz quiz={lesson.quiz} onFinish={(score, wrongs) => setResult({ score, total: lesson.quiz.length, wrongs })} /></div>
          </Section>

          <Section id="reteach" eyebrow="Adaptive re-teaching" title="Learn it a different way">
            <div className="max-w-3xl"><Reteach ctx={ctx} topic={lesson.topic} result={result} onWeakArea={setWeakArea} /></div>
          </Section>
        </main>
      </div>

      {/* Differentiator */}
      <section className="border-t bg-secondary">
        <div className="mx-auto max-w-5xl px-5 py-16 text-center">
          <div className="eyebrow">Why Study Smarter?</div>
          <h2 className="mt-3 text-3xl font-extrabold">From answering questions to building understanding.</h2>
          <div className="mt-10 grid gap-5 md:grid-cols-[1fr_2fr]">
            <Flow title="Normal AI" steps={["Question", "Answer"]} muted />
            <Flow title="Study Smarter" steps={["Doubt", "Understand learner", "Teach", "Visualize", "Practice", "Detect weakness", "Re-teach"]} />
          </div>
        </div>
      </section>
      <footer className="py-8 text-center text-xs text-muted-foreground">Study Smarter · AI Learning Engine · Hackathon prototype</footer>

      <TutorChat ctx={ctx} topic={lesson.topic} weakArea={weakArea} />
    </div>
  );
}

function Section({ id, eyebrow, title, children }: { id: string; eyebrow: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-32">
      <div className="eyebrow">{eyebrow}</div>
      <h2 className="mt-1 mb-6 text-2xl font-extrabold sm:text-3xl">{title}</h2>
      {children}
    </section>
  );
}

function Flow({ title, steps, muted }: { title: string; steps: string[]; muted?: boolean }) {
  return (
    <div className={`card-surface p-6 ${muted ? "opacity-70" : "border-electric"}`}>
      <div className={`font-bold ${muted ? "text-muted-foreground" : "text-primary"}`}>{title}</div>
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
        {steps.map((s, i) => (
          <span key={s} className="flex items-center gap-2">
            <span className={`rounded-full px-3 py-1.5 text-sm font-semibold ${muted ? "bg-muted" : "bg-brand text-primary-foreground"}`}>{s}</span>
            {i < steps.length - 1 && <span className="text-electric">→</span>}
          </span>
        ))}
      </div>
    </div>
  );
}
