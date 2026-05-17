import { auth } from "@/lib/auth";
import { NextRequest } from "next/server";

const SERPER_KEY = process.env.SERPER_API_KEY ?? "";
const MAX_SENTENCES = 8; // limit searches per check to control API usage

function extractSentences(text: string): string[] {
  return text
    .replace(/\n+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.split(" ").length >= 12); // only substantive sentences
}

function wordOverlap(a: string, b: string): number {
  const normalize = (s: string) =>
    s.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter(Boolean);
  const wordsA = new Set(normalize(a));
  const wordsB = normalize(b);
  if (wordsA.size === 0 || wordsB.length === 0) return 0;
  const shared = wordsB.filter((w) => wordsA.has(w)).length;
  return shared / Math.max(wordsA.size, wordsB.length);
}

async function searchSentence(sentence: string): Promise<{
  matched: boolean;
  similarity: number;
  url: string | null;
  sourceName: string | null;
  snippet: string | null;
}> {
  if (!SERPER_KEY) return { matched: false, similarity: 0, url: null, sourceName: null, snippet: null };

  try {
    const res = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: {
        "X-API-KEY": SERPER_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ q: `"${sentence.slice(0, 120)}"`, num: 5, gl: "ca" }),
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) return { matched: false, similarity: 0, url: null, sourceName: null, snippet: null };

    const data = await res.json();
    const results: { title: string; link: string; snippet: string }[] = data.organic ?? [];

    let bestSimilarity = 0;
    let bestResult: (typeof results)[0] | null = null;

    for (const r of results) {
      const sim = wordOverlap(sentence, r.snippet ?? "");
      if (sim > bestSimilarity) {
        bestSimilarity = sim;
        bestResult = r;
      }
    }

    return {
      matched: bestSimilarity >= 0.55,
      similarity: Math.round(bestSimilarity * 100),
      url: bestResult?.link ?? null,
      sourceName: bestResult?.title ?? null,
      snippet: bestResult?.snippet ?? null,
    };
  } catch {
    return { matched: false, similarity: 0, url: null, sourceName: null, snippet: null };
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { text } = await req.json() as { text: string };
  if (!text?.trim()) return Response.json({ error: "No text provided" }, { status: 400 });

  if (!SERPER_KEY) {
    return Response.json({ error: "SERPER_API_KEY is not configured." }, { status: 503 });
  }

  const allSentences = extractSentences(text);
  if (allSentences.length === 0) {
    return Response.json({ score: 0, matches: [], checked: 0, matched: 0 });
  }

  // Sample evenly across the text so we cover intro, middle, and end
  const step = Math.max(1, Math.floor(allSentences.length / MAX_SENTENCES));
  const sampled = allSentences.filter((_, i) => i % step === 0).slice(0, MAX_SENTENCES);

  // Search all sampled sentences in parallel
  const results = await Promise.all(
    sampled.map(async (sentence) => {
      const result = await searchSentence(sentence);
      return { sentence, ...result };
    })
  );

  const matchedResults = results.filter((r) => r.matched);
  const plagiarismScore = Math.round((matchedResults.length / sampled.length) * 100);

  return Response.json({
    score: plagiarismScore,
    checked: sampled.length,
    matched: matchedResults.length,
    matches: matchedResults.map((r) => ({
      sentence: r.sentence,
      similarity: r.similarity,
      url: r.url,
      sourceName: r.sourceName,
      snippet: r.snippet,
    })),
    allResults: results.map((r) => ({
      sentence: r.sentence,
      similarity: r.similarity,
      matched: r.matched,
    })),
  });
}
