import { auth } from "@/lib/auth";
import { openai } from "@/lib/openai";
import { NextRequest } from "next/server";

// Strip HTML down to readable text
function extractText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<nav[\s\S]*?<\/nav>/gi, " ")
    .replace(/<footer[\s\S]*?<\/footer>/gi, " ")
    .replace(/<header[\s\S]*?<\/header>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s{2,}/g, " ")
    .trim()
    .slice(0, 10000);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { url, name, province } = await req.json() as { url: string; name: string; province: string };
  if (!url) return Response.json({ error: "url required" }, { status: 400 });

  // Normalize URL
  const fullUrl = /^https?:\/\//i.test(url) ? url : `https://${url}`;

  // Fetch the website server-side (no CORS restriction)
  let pageText = "";
  try {
    const res = await fetch(fullUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; Grant2FundnBot/1.0; +https://grant2fundn.ca)",
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "en-CA,en;q=0.9",
      },
      signal: AbortSignal.timeout(12000),
    });
    if (res.ok) {
      const html = await res.text();
      pageText = extractText(html);
    }
  } catch (err) {
    console.warn("[scrape-funder] fetch error:", err);
    // Continue — AI will do its best with just the name/province
  }

  const systemPrompt = `You are a grant research expert for Canadian nonprofits. Extract structured grant funder information and return ONLY valid JSON matching the exact schema below.

Valid focusAreas values (use only these exact strings): ARTS_CULTURE, ENVIRONMENT, HEALTH, SOCIAL_SERVICES, EDUCATION, INDIGENOUS, SPORT_RECREATION, ECONOMIC_DEVELOPMENT, HOUSING, FOOD_SECURITY, SENIORS, YOUTH, DISABILITY, IMMIGRATION, LGBTQ, ANIMAL_WELFARE, OTHER

Valid fundingTypes values: PROJECT, OPERATING, CAPITAL, CAPACITY_BUILDING, EMERGENCY

Valid deadlineType values: ANNUAL, ROLLING, BIANNUAL, QUARTERLY, CLOSED

Valid eligibleOrgTypes values: NONPROFIT, REGISTERED_CHARITY, SOCIETY, INDIGENOUS_ORGANIZATION, GOVERNMENT, COOPERATIVE

Return JSON with this exact structure:
{
  "description": "string (2-4 sentences about the funder and their grant programs)",
  "focusAreas": ["string[]"],
  "fundingTypes": ["string[]"],
  "minGrantAmount": number or null,
  "maxGrantAmount": number or null,
  "deadlineType": "string",
  "deadlineNotes": "string or null",
  "eligibleOrgTypes": ["string[]"],
  "contactEmail": "string or null",
  "acceptsOnlineApps": true or false,
  "sections": [
    {
      "sectionKey": "snake_case_key",
      "label": "Section Label",
      "description": "What this section should contain",
      "isRequired": true,
      "minWords": number or null,
      "maxWords": number or null,
      "sortOrder": number
    }
  ]
}`;

  const userPrompt = pageText
    ? `Funder name: ${name}\nProvince: ${province}\n\nWebsite content:\n${pageText}`
    : `Funder name: ${name}\nProvince: ${province}\n\nNo website content could be fetched. Use your knowledge of this funder to fill in the information as accurately as possible.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    const data = JSON.parse(raw);

    return Response.json({ ok: true, data, url: fullUrl });
  } catch (err) {
    console.error("[scrape-funder] OpenAI error:", err);
    return Response.json({ error: "AI extraction failed" }, { status: 500 });
  }
}
