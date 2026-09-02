import { NextRequest, NextResponse } from "next/server";
import { getSupabaseSessionClient } from "@/lib/supabase-server";
import { callN8n } from "@/lib/n8n";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await getSupabaseSessionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Inte inloggad." }, { status: 401 });
  }

  const { decision } = await request.json();
  if (!["approve", "reject", "ask"].includes(decision)) {
    return NextResponse.json({ error: "Ogiltigt beslut." }, { status: 400 });
  }

  const { data: action, error: fetchError } = await supabase
    .from("pending_actions")
    .select("*")
    .eq("id", id)
    .single();
  if (fetchError || !action) {
    return NextResponse.json({ error: "Åtgärden hittades inte." }, { status: 404 });
  }

  const status = decision === "approve" ? "approved" : decision === "reject" ? "rejected" : "pending";
  await supabase
    .from("pending_actions")
    .update({ status, resolved_at: decision === "ask" ? null : new Date().toISOString() })
    .eq("id", id);

  if (decision === "ask") {
    return NextResponse.json({ status });
  }

  try {
    await callN8n("execute-action", {
      user_id: user.id,
      action_id: id,
      type: action.type,
      decision,
      payload: action.payload,
    });
  } catch (err) {
    await supabase.from("pending_actions").update({ status: "failed" }).eq("id", id);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "n8n kunde inte utföra åtgärden." },
      { status: 502 }
    );
  }

  return NextResponse.json({ status: "executed" });
}
