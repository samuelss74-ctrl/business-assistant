"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
  isError?: boolean;
};

// Minimal typing for the browser Speech Recognition API (not in lib.dom.d.ts).
type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  start: () => void;
  onresult: ((event: { results: { [i: number]: { [j: number]: { transcript: string } } } }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
};

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [listening, setListening] = useState(false);
  const [micSupported, setMicSupported] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    supabase
      .from("messages")
      .select("id, role, content, created_at")
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        if (data) setMessages(data as ChatMessage[]);
      });

    const w = window as unknown as {
      SpeechRecognition?: new () => SpeechRecognitionLike;
      webkitSpeechRecognition?: new () => SpeechRecognitionLike;
    };
    const SpeechRecognitionCtor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (SpeechRecognitionCtor) {
      // One-time browser feature detection on mount, not a data fetch — safe to setState directly here.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMicSupported(true);
      const recognition = new SpeechRecognitionCtor();
      recognition.lang = "sv-SE";
      recognition.interimResults = false;
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
      };
      recognition.onerror = () => setListening(false);
      recognition.onend = () => setListening(false);
      recognitionRef.current = recognition;
    }
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  function toggleMic() {
    if (!recognitionRef.current) return;
    if (listening) {
      setListening(false);
      return;
    }
    setListening(true);
    recognitionRef.current.start();
  }

  async function sendMessage(e: FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;

    setSending(true);
    setInput("");
    setMessages((prev) => [
      ...prev,
      { id: `local-${Date.now()}`, role: "user", content: text, created_at: new Date().toISOString() },
    ]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          id: data.id ?? `assistant-${Date.now()}`,
          role: "assistant",
          content: res.ok ? data.reply : "Kunde inte svara just nu. Försök igen om en liten stund.",
          created_at: new Date().toISOString(),
          isError: !res.ok,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-error-${Date.now()}`,
          role: "assistant",
          content: "Kunde inte nå assistenten just nu. Försök igen om en liten stund.",
          created_at: new Date().toISOString(),
          isError: true,
        },
      ]);
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="chat-page">
      <div className="chat-messages" ref={scrollRef}>
        {messages.length === 0 && (
          <p className="chat-empty">
            Fråga vad som helst, t.ex. &quot;Har jag fått några viktiga mejl idag?&quot;
          </p>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={`chat-bubble chat-bubble-${m.role}${m.isError ? " chat-bubble-error" : ""}`}
          >
            {m.content}
          </div>
        ))}
        {sending && <div className="chat-bubble chat-bubble-assistant chat-bubble-pending">…</div>}
      </div>
      <form className="chat-input-row" onSubmit={sendMessage}>
        {micSupported && (
          <button
            type="button"
            className={listening ? "mic-button mic-button-active" : "mic-button"}
            onClick={toggleMic}
            aria-label="Prata istället för att skriva"
          >
            <svg viewBox="0 0 24 24" width="17" height="17" fill="none" aria-hidden="true">
              <rect x="9" y="2.5" width="6" height="11" rx="3" fill="currentColor" />
              <path d="M6 11v1a6 6 0 0 0 12 0v-1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              <path d="M12 18.5v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              <path d="M8.5 21.5h7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        )}
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Skriv ett meddelande…"
        />
        <button type="submit" disabled={sending || !input.trim()}>
          Skicka
        </button>
      </form>
    </main>
  );
}
