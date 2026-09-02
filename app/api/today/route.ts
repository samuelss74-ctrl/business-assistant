import { NextResponse } from "next/server";
import { getSupabaseSessionClient } from "@/lib/supabase-server";
import { callN8n } from "@/lib/n8n";

type TodayResponse = {
  events: { time: string; title: string; location?: string }[];
  important_emails: { from: string; subject: string; summary: string }[];
};

export async function GET() {
  const supabase = await getSupabaseSessionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Inte inloggad." }, { status: 401 });
  }

  try {
    const today = await callN8n<TodayResponse>("today", { user_id: user.id });
    return NextResponse.json(today);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "n8n svarade inte." },
      { status: 502 }
    );
  }
}
