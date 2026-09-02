"use client";

import { useEffect, useState } from "react";

type TodayData = {
  events: { time: string; title: string; location?: string }[];
  important_emails: { from: string; subject: string; summary: string }[];
};

export default function IdagPage() {
  const [data, setData] = useState<TodayData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/today");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Kunde inte hämta dagens information.");
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Okänt fel.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // Fetch-on-mount pattern — load() sets loading/error state before its first await.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  return (
    <main className="page-container">
      <div className="page-header-row">
        <h1>Idag</h1>
        <button onClick={load} disabled={loading}>
          {loading ? "Uppdaterar…" : "Uppdatera"}
        </button>
      </div>

      {error && <p className="error-state">{error}</p>}

      <section>
        <h2>Kalender</h2>
        {data?.events.length ? (
          <ul className="today-list">
            {data.events.map((e, i) => (
              <li key={i}>
                <strong>{e.time}</strong> — {e.title}
                {e.location && <span className="today-location"> ({e.location})</span>}
              </li>
            ))}
          </ul>
        ) : (
          !loading && <p className="empty-state">Inga händelser idag.</p>
        )}
      </section>

      <section>
        <h2>Viktiga mejl</h2>
        {data?.important_emails.length ? (
          <ul className="today-list">
            {data.important_emails.map((mail, i) => (
              <li key={i}>
                <strong>{mail.from}</strong>: {mail.subject}
                <p className="today-mail-summary">{mail.summary}</p>
              </li>
            ))}
          </ul>
        ) : (
          !loading && <p className="empty-state">Inga viktiga mejl just nu.</p>
        )}
      </section>
    </main>
  );
}
