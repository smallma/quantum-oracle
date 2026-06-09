"use client";

import { useEffect, useState } from "react";

export function ResultTyping({ text }: { text: string }) {
  const [length, setLength] = useState(0);

  useEffect(() => {
    let index = 0;
    const timer = window.setInterval(() => {
      index += 1;
      setLength(index);
      if (index >= text.length) window.clearInterval(timer);
    }, 28);
    return () => window.clearInterval(timer);
  }, [text]);

  const visible = text.slice(0, length);

  return (
    <p className="whitespace-pre-wrap text-[15px] leading-8 text-[#d7d0c2] sm:text-base">
      {visible}
      {visible.length < text.length && <span className="typing-cursor">｜</span>}
    </p>
  );
}
