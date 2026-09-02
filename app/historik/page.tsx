"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

type ActivityEntry = {
  id: string;
  action_type: string;
  summary: string;
  status: "success" | "failed";
  created_at: string;
};

export default function HistorikPage() {
  const [entries, setEntries] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();

    async function load() {
      const { data } = await supabase
        .from("activity_log")
        .select("id, action_type, summary, status, created_at")
        .order("created_at", { ascending: false })
        .limit(100);
      setEntries((data as ActivityEntry[]) ?? []);
      setLoading(false);
    }
    load();

    const channel = supabase
      .channel("activity_log_changes")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "activity_log" }, () => load())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (loading) return <main className="page-container"><p>Laddar…</p></main>;

  return (
    <main className="page-container">
      <h1>Historik</h1>
      {entries.length === 0 && <p className="empty-state">Assistenten har inte gjort något än.</p>}
      <ul className="history-list">
        {entries.map((entry) => (
          <li key={entry.id} className={`history-item history-${entry.status}`}>
            <span className="history-icon">{entry.status === "success" ? "✓" : "✗"}</span>
            <div>
              <p>{entry.summary}</p>
              <time>{new Date(entry.created_at).toLocaleString("sv-SE")}</time>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
