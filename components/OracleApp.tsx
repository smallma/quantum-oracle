"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { DivinationButton } from "@/components/DivinationButton";
import { HexagramDisplay } from "@/components/HexagramDisplay";
import { ResultTyping } from "@/components/ResultTyping";
import { YaoLine } from "@/components/YaoLine";
import { castDivination } from "@/lib/divination";
import type { DivinationResult } from "@/lib/types";
import type { InterpretationFact } from "@/lib/types";

type Phase = "idle" | "casting" | "analyzing" | "complete" | "error";
const sleep = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

export function OracleApp() {
  const [question, setQuestion] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [result, setResult] = useState<DivinationResult | null>(null);
  const [revealed, setRevealed] = useState(0);
  const [analysis, setAnalysis] = useState("");
  const [error, setError] = useState("");
  const [facts, setFacts] = useState<InterpretationFact[]>([]);

  const isBusy = phase === "casting" || phase === "analyzing";

  async function beginDivination() {
    if (!question.trim() || isBusy) return;
    setPhase("casting");
    setAnalysis("");
    setError("");
    setFacts([]);
    setRevealed(0);

    const nextResult = castDivination(new Date());
    setResult(nextResult);
    for (let line = 1; line <= 6; line += 1) {
      await sleep(line === 1 ? 500 : 720);
      setRevealed(line);
    }

    await sleep(650);
    setPhase("analyzing");

    try {
      const response = await fetch("/api/divination", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          result: nextResult,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "解析暫時無法抵達");
      setAnalysis(data.analysis);
      setFacts(data.facts ?? []);
      setPhase("complete");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "解析暫時無法抵達");
      setPhase("error");
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden px-5 py-10 sm:px-8">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <div className="grid-overlay" />

      <div className="relative mx-auto max-w-5xl">
        <header className="mb-12 flex items-center justify-between text-[10px] tracking-[0.28em] text-[#8f826a]">
          <span>QUANTUM ORACLE</span>
          <span>大衍 · 時辰 · 易</span>
        </header>

        <section className="mx-auto max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1 }}
            className="seal mx-auto mb-8 grid h-20 w-20 place-items-center rounded-full"
          >
            <span className="font-serif text-4xl text-[#dfbe72]">易</span>
          </motion.div>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 text-[10px] tracking-[0.5em] text-[#a98b52]"
          >
            問心 · 觀變 · 知機
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="font-serif text-4xl leading-tight text-[#f0e5ce] sm:text-6xl"
          >
            心有所問，卦有所應
          </motion.h1>
          <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-[#817c72]">
            靜下來，把真正困擾你的那一句話留在此處。
          </p>
        </section>

        <section className="oracle-card mx-auto mt-10 max-w-2xl p-3 sm:p-4">
          <textarea
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            disabled={isBusy}
            maxLength={300}
            rows={3}
            placeholder="此刻，你最想看清什麼？"
            className="w-full resize-none bg-transparent px-4 py-4 text-base leading-7 text-[#ded6c6] outline-none placeholder:text-[#5e5a53] disabled:opacity-60"
          />
          <DivinationButton
            disabled={!question.trim() || isBusy}
            active={isBusy}
            onClick={beginDivination}
          />
        </section>

        <AnimatePresence>
          {result && revealed > 0 && (
            <motion.section
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mx-auto mt-14 max-w-2xl"
            >
              <div className="mb-7 text-center">
                <p className="text-[10px] tracking-[0.38em] text-[#8e7d5c]">
                  {phase === "casting" ? `第 ${revealed} 爻 · 由地向天` : "卦象已成"}
                </p>
              </div>
              {phase === "casting" ? (
                <div className="flex min-h-64 flex-col-reverse items-center justify-start gap-6 text-[#d8b665]">
                  {result.lines.slice(0, revealed).map((line, index) => (
                    <YaoLine
                      key={index}
                      value={line}
                      moving={line === 6 || line === 9}
                    />
                  ))}
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  <HexagramDisplay
                    label="本卦 · 現況"
                    hexagram={result.primary}
                    movingLines={result.movingLines}
                  />
                  <HexagramDisplay
                    label={result.movingLines.length ? "之卦 · 趨勢" : "之卦 · 無變卦"}
                    hexagram={result.transformed}
                    note={result.movingLines.length
                      ? "由動爻變化後形成，代表後續趨勢。"
                      : "六爻皆靜，沒有形成不同的變卦，因此與本卦相同。"}
                  />
                </div>
              )}
            </motion.section>
          )}
        </AnimatePresence>

        {result && phase !== "casting" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-5 text-center">
            <span className="meta-pill">月建 · {result.monthBranch}</span>
            <span className="meta-pill">日辰 · {result.dayGanZhi}</span>
            <span className="meta-pill">
              動爻 · {result.movingLines.length ? result.movingLines.join("、") : "靜卦"}
            </span>
            <span className="meta-pill">日界 · 子初 23:00</span>
          </motion.div>
        )}

        {(phase === "analyzing" || phase === "complete" || phase === "error") && (
          <motion.section
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            className="oracle-card mx-auto mt-10 max-w-3xl p-7 sm:p-10"
          >
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <p className="text-[10px] tracking-[0.4em] text-[#a88b55]">易理回聲</p>
              {phase === "complete" && (
                <span className="verified-badge">規則判讀 · AI 僅篩選核准依據</span>
              )}
            </div>
            {phase === "analyzing" && (
              <div className="flex items-center gap-3 text-sm text-[#8d8578]">
                <span className="thinking-dot" />
                正在依動爻規則選取經文與核對卦象……
              </div>
            )}
            {phase === "complete" && <ResultTyping text={analysis} />}
            {phase === "complete" && facts.length > 0 && (
              <details className="mt-8 border-t border-[#9f8143]/15 pt-5">
                <summary className="cursor-pointer text-[10px] tracking-[0.3em] text-[#8f826a]">
                  查看本次可追溯事實
                </summary>
                <ul className="mt-4 space-y-2 text-xs leading-6 text-[#817c72]">
                  {facts.map((fact) => <li key={fact.id}>· {fact.statement}</li>)}
                </ul>
              </details>
            )}
            {phase === "error" && (
              <p className="text-sm leading-7 text-[#c99785]">{error}</p>
            )}
          </motion.section>
        )}
      </div>
    </main>
  );
}
