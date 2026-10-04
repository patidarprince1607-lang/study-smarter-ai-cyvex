import { useEffect, useState } from "react";
import type { QuizQ, WrongAnswer } from "@/lib/types";

export function Quiz({ quiz, onFinish }: { quiz: QuizQ[]; onFinish: (score: number, wrongs: WrongAnswer[]) => void }) {
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [wrongs, setWrongs] = useState<WrongAnswer[]>([]);
  const [done, setDone] = useState(false);

  useEffect(() => { setI(0); setPicked(null); setScore(0); setWrongs([]); setDone(false); }, [quiz]);

  if (!quiz.length) return <p className="text-muted-foreground">No quiz available.</p>;
  const q = quiz[i];

  const pick = (k: number) => {
    if (picked !== null) return;
    setPicked(k);
    if (k === q.answerIndex) setScore((s) => s + 1);
    else setWrongs((w) => [...w, { question: q.question, chosen: q.options[k], correct: q.options[q.answerIndex], concept: q.concept }]);
  };
  const next = () => {
    if (i + 1 < quiz.length) { setI(i + 1); setPicked(null); }
    else { setDone(true); onFinish(score, wrongs); }
  };

  if (done)
    return (
      <div className="card-surface p-6 text-center animate-pop">
        <div className="text-5xl font-extrabold text-brand">{score}/{quiz.length}</div>
        <p className="mt-2 text-muted-foreground">{wrongs.length ? "Your AI tutor is analyzing your mistakes below." : "Perfect score — you can still try another explanation style below."}</p>
        <button className="btn-ghost mt-4" onClick={() => { setI(0); setPicked(null); setScore(0); setWrongs([]); setDone(false); }}>Retake quiz</button>
      </div>
    );

  return (
    <div className="card-surface p-5 sm:p-7">
      <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
        <span>Question {i + 1} of {quiz.length} · <span className="text-electric">{q.concept}</span></span>
        <span>Score {score}</span>
      </div>
      <div className="mt-2 h-1.5 rounded-full bg-muted"><div className="h-full rounded-full bg-brand transition-all" style={{ width: `${(i / quiz.length) * 100}%` }} /></div>
      <h4 className="mt-5 text-lg font-bold leading-snug">{q.question}</h4>
      <div className="mt-4 grid gap-2.5">
        {q.options.map((o, k) => {
          const state = picked === null ? "" : k === q.answerIndex ? "border-success bg-success-soft" : k === picked ? "border-destructive bg-destructive-soft" : "opacity-60";
          return (
            <button key={k} onClick={() => pick(k)} disabled={picked !== null}
              className={`flex items-start gap-3 rounded-xl border-2 p-3.5 text-left text-sm transition-all ${picked === null ? "hover:border-electric hover:bg-electric-soft" : ""} ${state}`}>
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-bold">{String.fromCharCode(65 + k)}</span>
              <span>{o}</span>
            </button>
          );
        })}
      </div>
      {picked !== null && (
        <div className={`mt-4 rounded-xl p-4 text-sm animate-pop ${picked === q.answerIndex ? "bg-success-soft" : "bg-destructive-soft"}`}>
          <div className={`font-bold ${picked === q.answerIndex ? "text-success" : "text-destructive"}`}>{picked === q.answerIndex ? "Correct!" : "Not quite."}</div>
          <p className="mt-1 text-foreground/80">{q.explanation}</p>
          <button className="btn-primary mt-3 !py-2 !px-4 text-sm" onClick={next}>{i + 1 < quiz.length ? "Next question" : "See results"}</button>
        </div>
      )}
    </div>
  );
}
