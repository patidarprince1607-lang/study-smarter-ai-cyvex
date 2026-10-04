import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { analyzeWeakness, reteach } from "@/lib/learn.functions";
import { RETEACH_MODES, type LearnerContext, type WrongAnswer } from "@/lib/types";
import { Markdown } from "./Markdown";

export function Reteach({ ctx, topic, result, onWeakArea }: {
  ctx: LearnerContext; topic: string;
  result: { score: number; total: number; wrongs: WrongAnswer[] } | null;
  onWeakArea: (w: string) => void;
}) {
  const analyze = useServerFn(analyzeWeakness);
  const teach = useServerFn(reteach);
  const [analysis, setAnalysis] = useState<{ weakArea: string; message: string; recommendedMode: string; model: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<string | null>(null);
  const [out, setOut] = useState<{ text: string; model: string } | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    setAnalysis(null); setOut(null); setMode(null); setErr(null);
    if (!result || !result.wrongs.length) return;
    setLoading(true);
    analyze({ data: { ctx, topic, score: result.score, total: result.total, wrongs: result.wrongs } })
      .then((a) => { setAnalysis(a); onWeakArea(a.weakArea); })
      .catch((e) => setErr(e.message))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result]);

  const choose = async (m: string) => {
    setMode(m); setOut(null); setErr(null);
    try {
      const weak = analysis?.weakArea ?? result?.wrongs[0]?.concept ?? topic;
      setOut(await teach({ data: { ctx, topic, weakArea: weak, mode: m, wrongs: result?.wrongs ?? [] } }));
    } catch (e: any) { setErr(e.message); }
  };

  if (!result)
    return <div className="card-surface p-6 text-sm text-muted-foreground">Finish the quiz above — your AI tutor will analyze your answers and re-teach the concept you found hardest.</div>;

  return (
    <div className="space-y-5">
      {result.wrongs.length > 0 && (
        <div className="card-surface overflow-hidden">
          <div className="bg-warning-soft px-5 py-3 text-sm font-bold text-foreground">🔍 Your AI Tutor noticed a weak area.</div>
          <div className="p-5">
            {loading && <p className="text-sm text-muted-foreground animate-pulse">Gemma 4 is analyzing your mistakes…</p>}
            {analysis && (
              <div className="animate-pop">
                <div className="eyebrow">Weak concept</div>
                <div className="mt-1 text-xl font-bold">{analysis.weakArea}</div>
                <p className="mt-2 text-foreground/80">{analysis.message}</p>
              </div>
            )}
          </div>
        </div>
      )}
      <div>
        <p className="mb-3 text-sm font-semibold">Explain it again using:</p>
        <div className="flex flex-wrap gap-2">
          {RETEACH_MODES.map((m) => (
            <button key={m.id} className="chip" data-active={mode === m.id} onClick={() => choose(m.id)}>
              <span>{m.icon}</span>{m.label}{analysis?.recommendedMode === m.id && <span className="text-[10px] font-bold opacity-70">· suggested</span>}
            </button>
          ))}
        </div>
      </div>
      {err && <div className="rounded-xl bg-destructive-soft p-4 text-sm text-destructive">{err}</div>}
      {mode && !out && !err && <div className="card-surface p-6 text-sm text-muted-foreground animate-pulse">Gemma 4 is re-teaching this a different way…</div>}
      {out && (
        <div className="card-surface p-6 animate-pop">
          <div className="mb-3 text-xs text-muted-foreground">Re-taught by <span className="font-mono">{out.model}</span></div>
          <Markdown>{out.text}</Markdown>
        </div>
      )}
    </div>
  );
}
