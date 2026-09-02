"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

type PendingAction = {
  id: string;
  tier: "green" | "yellow" | "red";
  type: string;
  summary: string;
  payload: { detail?: string; actions?: { label: string; decision: string }[] };
  status: string;
  created_at: string;
};

const DEFAULT_ACTIONS = [
  { label: "Acceptera", decision: "approve" },
  { label: "Tacka nej", decision: "reject" },
  { label: "Fråga mig", decision: "ask" },
];

export default function AttGoraPage() {
  const [items, setItems] = useState<PendingAction[]>([]);
  const [resolving, setResolving] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();

    async function load() {
      const { data } = await supabase
        .from("pending_actions")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      setItems((data as PendingAction[]) ?? []);
      setLoading(false);
    }
    load();

    const channel = supabase
      .channel("pending_actions_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "pending_actions" }, () => load())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function resolve(id: string, decision: string) {
    setResolving(id);
    try {
      const res = await fetch(`/api/actions/${id}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision }),
      });
      if (res.ok) {
        setItems((prev) => prev.filter((item) => item.id !== id));
      }
    } finally {
      setResolving(null);
    }
  }

  if (loading) return <main className="page-container"><p>Laddar…</p></main>;

  return (
    <main className="page-container">
      <h1>Att göra</h1>
      {items.length === 0 && <p className="empty-state">Inget väntar på ditt beslut just nu.</p>}
      <div className="card-list">
        {items.map((item) => (
          <div key={item.id} className={`action-card tier-${item.tier}`}>
            <div className="action-card-header">
              <span className={`tier-badge tier-badge-${item.tier}`}>{item.tier}</span>
              <strong>{item.summary}</strong>
            </div>
            {item.payload?.detail && <p className="action-card-detail">{item.payload.detail}</p>}
            <div className="action-card-buttons">
              {(item.payload?.actions ?? DEFAULT_ACTIONS).map((action) => (
                <button
                  key={action.decision}
                  onClick={() => resolve(item.id, action.decision)}
                  disabled={resolving === item.id}
                >
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
