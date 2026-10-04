import { useEffect, useMemo, useState } from "react";
import type { Lesson } from "@/lib/types";

type Frame = { low: number; high: number; mid: number | null; found: number | null; caption: string; title: string };

function framesFor(arr: number[], target: number): Frame[] {
  const f: Frame[] = [{ low: 0, high: arr.length - 1, mid: null, found: null, title: "Start", caption: `Search space is the whole array (${arr.length} items). Looking for ${target}.` }];
  let low = 0, high = arr.length - 1;
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    f.push({ low, high, mid, found: null, title: "Check the middle", caption: `mid = ${mid} → arr[mid] = ${arr[mid]}. Compare ${target} with ${arr[mid]}.` });
    if (arr[mid] === target) {
      f.push({ low: mid, high: mid, mid, found: mid, title: "Found it", caption: `${target} found at index ${mid} after ${f.filter((x) => x.mid !== null && x.found === null).length} checks.` });
      return f;
    }
    if (target < arr[mid]) {
      f.push({ low, high: mid - 1, mid, found: null, title: "Remove the right half", caption: `${target} < ${arr[mid]}, so everything from index ${mid} rightwards is eliminated.` });
      high = mid - 1;
    } else {
      f.push({ low: mid + 1, high, mid, found: null, title: "Remove the left half", caption: `${target} > ${arr[mid]}, so everything up to index ${mid} is eliminated.` });
      low = mid + 1;
    }
  }
  f.push({ low: 1, high: 0, mid: null, found: null, title: "Not present", caption: "Search space is empty — the target isn't in the array." });
  return f;
}

export function SearchVisual({ visual }: { visual: Lesson["visual"] }) {
  const sorted = visual.array.length >= 3 && visual.array.every((v, i, a) => i === 0 || a[i - 1] <= v) && visual.target !== null;
  const frames = useMemo(() => (sorted ? framesFor(visual.array, visual.target!) : []), [visual, sorted]);
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(false);

  useEffect(() => { setI(0); setPlaying(false); }, [visual]);
  useEffect(() => {
    if (!playing) return;
    if (i >= frames.length - 1) { setPlaying(false); return; }
    const t = setTimeout(() => setI((x) => x + 1), 1400);
    return () => clearTimeout(t);
  }, [playing, i, frames.length]);

  return (
    <div className="space-y-5">
      {sorted && (
        <div className="card-surface p-5 sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm text-muted-foreground">Target: <span className="font-mono font-bold text-primary text-base">{visual.target}</span></div>
            <div className="flex gap-2">
              <button className="btn-ghost" onClick={() => setI((x) => Math.max(0, x - 1))} disabled={i === 0}>Back</button>
              <button className="btn-ghost" onClick={() => { if (i >= frames.length - 1) setI(0); setPlaying((p) => !p); }}>{playing ? "Pause" : i >= frames.length - 1 ? "Replay" : "Play"}</button>
              <button className="btn-ghost" onClick={() => setI((x) => Math.min(frames.length - 1, x + 1))} disabled={i >= frames.length - 1}>Next</button>
            </div>
          </div>
          <div className="mt-6 grid gap-1.5 sm:gap-2" style={{ gridTemplateColumns: `repeat(${visual.array.length}, minmax(0,1fr))` }}>
            {visual.array.map((v, idx) => {
              const fr = frames[i]!;
              const out = idx < fr.low || idx > fr.high;
              const isMid = fr.mid === idx;
              const isFound = fr.found === idx;
              return (
                <div key={idx} className="flex flex-col items-center gap-1.5">
                  <div className={`flex aspect-square w-full items-center justify-center rounded-xl border-2 font-mono text-sm sm:text-lg font-bold transition-all duration-500
                    ${isFound ? "border-success bg-success text-primary-foreground scale-110" : isMid ? "border-electric bg-electric-soft text-primary scale-105" : out ? "border-border bg-muted text-muted-foreground/40 line-through scale-90" : "border-border bg-card text-foreground"}`}>
                    {v}
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground">{idx}</span>
                  <span className="h-3 text-[10px] font-bold text-electric">{fr.low === idx && !out ? "L" : ""}{fr.high === idx && !out ? "H" : ""}</span>
                </div>
              );
            })}
          </div>
          <div className="mt-4 h-2 rounded-full bg-muted overflow-hidden">
            <div className="h-full bg-brand transition-all duration-500" style={{ width: `${(Math.max(0, frames[i]!.high - frames[i]!.low + 1) / visual.array.length) * 100}%` }} />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Remaining search space</p>
          <div key={i} className="mt-4 rounded-xl bg-secondary p-4 animate-pop">
            <div className="text-xs font-bold text-electric">Step {i} of {frames.length - 1} · {frames[i]!.title}</div>
            <p className="mt-1 text-sm">{frames[i]!.caption}</p>
          </div>
        </div>
      )}
      {visual.steps.length > 0 && (
        <ol className="grid gap-3 sm:grid-cols-2">
          {visual.steps.map((s, k) => (
            <li key={k} className="card-surface p-4 flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-bold text-primary-foreground">{k + 1}</span>
              <div><div className="font-semibold text-sm">{s.title}</div><p className="text-sm text-muted-foreground mt-0.5">{s.detail}</p></div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
