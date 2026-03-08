import { NextResponse } from "next/server";
import { createSupabaseClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { updateBKT } from "@/lib/bkt/engine";
import { DEFAULT_BKT_PARAMS } from "@/lib/bkt/types";
import type { Strategy } from "@/lib/sudoku/types";

/** GET /api/bkt - Return current user's BKT probabilities for all strategies. */
export async function GET() {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createSupabaseClient();
  const { data, error } = await supabase
    .from("bkt_probabilities")
    .select("*")
    .eq("user_id", user.id)
    .order("knowledge_component");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ probabilities: data ?? [] });
}

/** DELETE /api/bkt - Delete all BKT rows for the current user (reset mastery). */
export async function DELETE() {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createSupabaseClient();
  const { error } = await supabase
    .from("bkt_probabilities")
    .delete()
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

/** POST /api/bkt - Record an observation and update mastery. */
export async function POST(request: Request) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { knowledge_component: Strategy; correct: boolean; used_hint?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { knowledge_component, correct, used_hint = false } = body;
  if (!knowledge_component || typeof correct !== "boolean") {
    return NextResponse.json(
      { error: "knowledge_component and correct are required" },
      { status: 400 }
    );
  }

  const valid = ["naked_single", "hidden_single", "naked_pair", "hidden_pair"] as const;
  if (!valid.includes(knowledge_component)) {
    return NextResponse.json({ error: "Invalid knowledge_component" }, { status: 400 });
  }

  const supabase = await createSupabaseClient();

  // Fetch existing row
  const { data: existing, error: fetchError } = await supabase
    .from("bkt_probabilities")
    .select("*")
    .eq("user_id", user.id)
    .eq("knowledge_component", knowledge_component)
    .maybeSingle();

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  const params = existing ? {
    p_transit: Number(existing.p_transit),
    p_guess: Number(existing.p_guess),
    p_slip: Number(existing.p_slip),
  } : {
    p_transit: DEFAULT_BKT_PARAMS.p_transit,
    p_guess: DEFAULT_BKT_PARAMS.p_guess,
    p_slip: DEFAULT_BKT_PARAMS.p_slip,
  };

  const priorProb = existing ? Number(existing.mastery_probability) : DEFAULT_BKT_PARAMS.p_learned;
  const newMastery = updateBKT(priorProb, params, correct, used_hint);

  if (existing) {
    const { data: updated, error: updateError } = await supabase
      .from("bkt_probabilities")
      .update({
        mastery_probability: newMastery,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }
    return NextResponse.json({ probability: updated });
  }

  const { data: inserted, error: insertError } = await supabase
    .from("bkt_probabilities")
    .insert({
      user_id: user.id,
      knowledge_component,
      p_learned: DEFAULT_BKT_PARAMS.p_learned,
      p_transit: DEFAULT_BKT_PARAMS.p_transit,
      p_guess: DEFAULT_BKT_PARAMS.p_guess,
      p_slip: DEFAULT_BKT_PARAMS.p_slip,
      mastery_probability: newMastery,
    })
    .select()
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }
  return NextResponse.json({ probability: inserted });
}
