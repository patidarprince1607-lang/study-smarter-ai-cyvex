export const LEVELS = ["Beginner", "Intermediate", "Exam-focused"] as const;
export const PREFS = [
  "Simple explanation",
  "Visual learner",
  "Example-based",
  "Code-first",
  "Exam preparation",
] as const;
export const RETEACH_MODES = [
  { id: "analogy", label: "Real-life analogy", icon: "💡" },
  { id: "simpler", label: "Simpler explanation", icon: "🧒" },
  { id: "visual", label: "Visual explanation", icon: "👁" },
  { id: "code", label: "Code example", icon: "💻" },
  { id: "exam", label: "Exam-style explanation", icon: "📝" },
] as const;

export type Level = (typeof LEVELS)[number];
export type Pref = (typeof PREFS)[number];
export type ReteachMode = (typeof RETEACH_MODES)[number]["id"];

export interface MindNode {
  label: string;
  info: string;
  children?: MindNode[];
}

export interface QuizQ {
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
  concept: string;
}

export interface Lesson {
  topic: string;
  diagnosis: string;
  explanation: string;
  analogy: { title: string; text: string };
  notes: { heading: string; body: string; bullets: string[] }[];
  keyPoints: string[];
  mindMap: { center: string; info: string; branches: MindNode[] };
  visual: { title: string; array: number[]; target: number | null; steps: { title: string; detail: string }[] };
  example: { title: string; text: string; code: string; language: string };
  quiz: QuizQ[];
  model?: string;
  source: "gemma" | "sample";
}

export interface WrongAnswer {
  question: string;
  chosen: string;
  correct: string;
  concept: string;
}

export interface LearnerContext {
  doubt: string;
  topic: string;
  level: Level;
  preference: Pref;
}
