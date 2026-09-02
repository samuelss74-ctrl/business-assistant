import { NextRequest, NextResponse } from "next/server";
import { getSupabaseSessionClient } from "@/lib/supabase-server";
import { callN8n } from "@/lib/n8n";

type ChatRouterResponse = {
  reply: string;
};

export async function POST(request: NextRequest) {
  const supabase = await getSupabaseSessionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Inte inloggad." }, { status: 401 });
  }

  const { message } = await request.json();
  if (typeof message !== "string" || !message.trim()) {
    return NextResponse.json({ error: "Meddelande saknas." }, { status: 400 });
  }

  await supabase.from("messages").insert({ user_id: user.id, role: "user", content: message });

  let reply: string;
  try {
    const result = await callN8n<ChatRouterResponse>("chat-router", {
      user_id: user.id,
      message,
    });
    reply = result.reply;
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "n8n svarade inte." },
      { status: 502 }
    );
  }

  const { data: saved } = await supabase
    .from("messages")
    .insert({ user_id: user.id, role: "assistant", content: reply })
    .select("id")
    .single();

  return NextResponse.json({ reply, id: saved?.id });
}
