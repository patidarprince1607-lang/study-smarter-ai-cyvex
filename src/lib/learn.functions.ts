import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { callGemma, callGemmaJson } from "./gemma.server";
import type { Lesson, MindNode, QuizQ } from "./types";

const ctxSchema = z.object({
  doubt: z.string().min(3).max(2000),
  topic: z.string().max(120),
  level: z.string().max(40),
  preference: z.string().max(40),
});

const SYSTEM = `You are Study Smarter, an adaptive AI tutor for college students. You diagnose the exact misconception behind a student's doubt and teach it in the student's preferred style and level.`;

function learnerBlock(d: z.infer<typeof ctxSchema>) {
  return `STUDENT CONTEXT
- Topic (may be blank; infer it from the doubt): ${d.topic || "(infer)"}
- Student's own doubt: """${d.doubt}"""
- Learner level: ${d.level}
- Learning preference: ${d.preference}`;
}

const str = (v: unknown, f = "") => (typeof v === "string" ? v : f);
const arr = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);

function normNode(n: any): MindNode {
  return { label: str(n?.label, "Concept").slice(0, 40), info: str(n?.info), children: arr<any>(n?.children).slice(0, 4).map((c) => ({ label: str(c?.label, "Idea").slice(0, 40), info: str(c?.info) })) };
}

export const generateLesson = createServerFn({ method: "POST" })
  .inputValidator((d) => ctxSchema.parse(d))
  .handler(async ({ data }): Promise<Lesson> => {
    const prompt = `${SYSTEM}

${learnerBlock(data)}

Create a complete personalized learning journey that directly answers THIS student's doubt (not a generic overview). Adapt depth to the level and style to the preference (Code-first => lead with code; Visual learner => describe pictures/step traces; Exam preparation => crisp marks-oriented points).

Return ONLY one JSON object, no prose, with exactly this shape:
{
  "topic": "short topic name, e.g. Binary Search",
  "diagnosis": "1-2 sentences: what the student already understands and the precise gap behind their doubt",
  "explanation": "personalized markdown explanation (150-300 words) answering the doubt directly",
  "analogy": { "title": "short title", "text": "a real-life analogy (80-140 words) suited to the preference" },
  "notes": [ { "heading": "section heading", "body": "markdown paragraph(s)", "bullets": ["revision point", "..."] } ],
  "keyPoints": ["exam/interview point", "..."],
  "mindMap": { "center": "topic", "info": "one-line summary", "branches": [ { "label": "Branch", "info": "1 sentence", "children": [ { "label": "Sub-idea", "info": "1 sentence" } ] } ] },
  "visual": { "title": "visual title", "array": [sorted integers or empty], "target": integer or null, "steps": [ { "title": "Step title", "detail": "what changes and why" } ] },
  "example": { "title": "worked example title", "text": "markdown walk-through of a concrete example", "code": "code snippet or empty string", "language": "c|python|java|sql|text" },
  "quiz": [ { "question": "tests understanding, not memorization", "options": ["A","B","C","D"], "answerIndex": 0, "explanation": "why the answer is right and others wrong", "concept": "short name of the sub-concept tested" } ]
}
Rules:
- notes: 6-8 sections that read like real college study notes, teaching from the beginning (what it is, why it works, the key intuition behind the doubt, step-by-step procedure, a worked example, complexity/properties, common mistakes). Body may use markdown.
- keyPoints: 5-7 concise revision points.
- mindMap: exactly 5 branches, each with 1-4 children; labels at most 3 words.
- visual: if the topic is searching/sorting an array, give a sorted array of 8 integers and a target that exists in it (e.g. binary search: [5,9,14,18,23,31,42,57] target 23); otherwise array [] and target null. 4-6 steps.
- quiz: exactly 4 questions with 4 options; vary answerIndex; at least two questions probe the student's specific doubt.
- Use the language requested in the doubt if code is requested (e.g. C).`;

    const { data: raw, model } = await callGemmaJson<any>(prompt);
    const quiz: QuizQ[] = arr<any>(raw.quiz)
      .map((q) => ({
        question: str(q?.question),
        options: arr<string>(q?.options).map(String).slice(0, 4),
        answerIndex: Number(q?.answerIndex) || 0,
        explanation: str(q?.explanation),
        concept: str(q?.concept, "Core idea"),
      }))
      .filter((q) => q.question && q.options.length >= 2 && q.answerIndex < q.options.length)
      .slice(0, 5);
    const array = arr<number>(raw.visual?.array).map(Number).filter((n) => Number.isFinite(n)).slice(0, 12);
    return {
      topic: str(raw.topic, data.topic || "Your topic"),
      diagnosis: str(raw.diagnosis),
      explanation: str(raw.explanation),
      analogy: { title: str(raw.analogy?.title, "In real life"), text: str(raw.analogy?.text) },
      notes: arr<any>(raw.notes).map((n) => ({ heading: str(n?.heading), body: str(n?.body), bullets: arr<string>(n?.bullets).map(String) })),
      keyPoints: arr<string>(raw.keyPoints).map(String),
      mindMap: { center: str(raw.mindMap?.center, str(raw.topic, "Topic")).slice(0, 30), info: str(raw.mindMap?.info), branches: arr<any>(raw.mindMap?.branches).slice(0, 6).map(normNode) },
      visual: {
        title: str(raw.visual?.title, "See it step by step"),
        array,
        target: raw.visual?.target == null || raw.visual?.target === "" ? null : Number(raw.visual.target),
        steps: arr<any>(raw.visual?.steps).map((s) => ({ title: str(s?.title), detail: str(s?.detail) })),
      },
      example: { title: str(raw.example?.title, "Worked example"), text: str(raw.example?.text), code: str(raw.example?.code), language: str(raw.example?.language, "text") },
      quiz,
      model,
      source: "gemma",
    };
  });

const wrongSchema = z.array(z.object({ question: z.string(), chosen: z.string(), correct: z.string(), concept: z.string() })).max(10);

export const analyzeWeakness = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ ctx: ctxSchema, topic: z.string(), score: z.number(), total: z.number(), wrongs: wrongSchema }).parse(d))
  .handler(async ({ data }) => {
    const prompt = `${SYSTEM}

${learnerBlock(data.ctx)}
Lesson topic: ${data.topic}
Quiz score: ${data.score}/${data.total}
Mistakes:
${data.wrongs.map((w, i) => `${i + 1}. Q: ${w.question}\n   Student chose: ${w.chosen}\n   Correct: ${w.correct}\n   Concept: ${w.concept}`).join("\n")}

Analyze the pattern behind these mistakes. Return ONLY JSON:
{ "weakArea": "short name of the weak concept", "message": "2 sentences addressed to the student: what they seem comfortable with and what precisely needs more practice", "recommendedMode": "analogy|simpler|visual|code|exam" }`;
    const { data: raw, model } = await callGemmaJson<any>(prompt);
    return { weakArea: str(raw.weakArea, data.wrongs[0]?.concept), message: str(raw.message), recommendedMode: str(raw.recommendedMode, "analogy"), model };
  });

const MODE_TEXT: Record<string, string> = {
  analogy: "a fresh real-life analogy (different from any used before), mapped step by step back to the concept",
  simpler: "the simplest possible explanation, like to a 12-year-old, short sentences, no jargon",
  visual: "a visual explanation using ASCII diagrams / step traces in code blocks showing what changes at each step",
  code: "a minimal, commented code example plus a dry-run trace that exposes the weak concept",
  exam: "an exam-style answer: definition, key points, a short derivation/justification and a 'common mistakes' list",
};

export const reteach = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ ctx: ctxSchema, topic: z.string(), weakArea: z.string(), mode: z.string(), wrongs: wrongSchema }).parse(d))
  .handler(async ({ data }) => {
    const prompt = `${SYSTEM}

${learnerBlock(data.ctx)}
Lesson topic: ${data.topic}
Detected weak concept: ${data.weakArea}
Questions the student got wrong:
${data.wrongs.map((w) => `- ${w.question} (chose "${w.chosen}", correct "${w.correct}")`).join("\n") || "- none"}

Re-teach ONLY the weak concept differently than a standard explanation, using ${MODE_TEXT[data.mode] ?? MODE_TEXT['simpler']}.
Directly address why the chosen wrong answers were tempting but wrong. End with one quick self-check question (answer hidden under a line "Answer:"). Respond in markdown, 180-320 words.`;
    return callGemma([{ role: "user", text: prompt }], 0.8);
  });

export const tutorChat = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z.object({
      ctx: ctxSchema,
      topic: z.string(),
      weakArea: z.string().optional(),
      messages: z.array(z.object({ role: z.enum(["user", "model"]), text: z.string().max(4000) })).min(1).max(30),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    const preamble = `${SYSTEM}

${learnerBlock(data.ctx)}
Current lesson topic: ${data.topic}
${data.weakArea ? `Known weak area: ${data.weakArea}` : ""}

Answer the student's follow-up questions in this context, concisely (under 250 words unless code or an exam answer is requested), in markdown. Acknowledge this setup with "Ready."`;
    return callGemma([{ role: "user", text: preamble }, { role: "model", text: "Ready." }, ...data.messages], 0.7);
  });
