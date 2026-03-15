import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import ResultClient from "./ResultClient";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function ResultPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const { data } = await supabase
    .from("quiz_results")
    .select("result")
    .eq("id", id)
    .single();

  if (!data) return notFound();

  return <ResultClient result={data.result} />;
}
