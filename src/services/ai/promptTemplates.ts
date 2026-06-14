export const GRANT_WRITER_SYSTEM = `You are an expert Canadian nonprofit grant writer with 15 years of experience writing successful grant applications in British Columbia and Alberta.

Your writing is:
- Specific and evidence-based (never vague or generic)
- Aligned with Canadian nonprofit sector terminology
- Compliant with CRA charity guidelines
- Sensitive to BC/AB regional context, priorities, and communities
- Impact-focused with measurable outcomes
- Written in active voice

You adapt your tone based on the funder:
- Community foundations: warm, community-centered, story-driven
- Government funders: formal, evidence-based, policy-aligned
- Arts funders: creative, culturally rich, outcome-focused
- Social service funders: empathy-driven, data-supported, population-specific

Never use corporate jargon. Never use filler phrases like "we are committed to" without backing them up with specifics.
Output ONLY the section content. No headers. No preamble. No commentary.`;

export function buildSectionUserPrompt({
  orgName,
  orgType,
  province,
  mission,
  programDescription,
  funderName,
  funderFocusAreas,
  funderPriorities,
  sectionLabel,
  sectionDescription,
  tone,
  wordTarget,
  existingContent,
  funderRequirements,
}: {
  orgName: string;
  orgType: string;
  province: string;
  mission: string;
  programDescription?: string;
  funderName: string;
  funderFocusAreas: string[];
  funderPriorities?: string;
  sectionLabel: string;
  sectionDescription?: string;
  tone: string;
  wordTarget: number;
  existingContent?: string;
  funderRequirements?: {
    summary?: string | null;
    keyRequirements?: string[];
    fundingPriorities?: string[];
    requiredSections?: Array<{ name: string; wordLimit?: number | null; notes?: string }>;
    importantNotes?: string[];
  } | null;
}): string {
  const reqBlock = funderRequirements
    ? `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
UPLOADED FUNDER REQUIREMENTS (follow these precisely):
${funderRequirements.summary ? `Overview: ${funderRequirements.summary}` : ""}
${funderRequirements.fundingPriorities?.length ? `\nFunding priorities:\n${funderRequirements.fundingPriorities.map((p) => `• ${p}`).join("\n")}` : ""}
${funderRequirements.keyRequirements?.length ? `\nKey requirements:\n${funderRequirements.keyRequirements.map((r) => `• ${r}`).join("\n")}` : ""}
${funderRequirements.requiredSections?.length ? `\nRequired sections:\n${funderRequirements.requiredSections.map((s) => `• ${s.name}${s.wordLimit ? ` (max ${s.wordLimit} words)` : ""}${s.notes ? ` — ${s.notes}` : ""}`).join("\n")}` : ""}
${funderRequirements.importantNotes?.length ? `\nImportant notes:\n${funderRequirements.importantNotes.map((n) => `• ${n}`).join("\n")}` : ""}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`
    : "";

  return `
Organization: ${orgName}
Type: ${orgType} (${province})
Mission: ${mission}
${programDescription ? `Program: ${programDescription}` : ""}

Funder: ${funderName}
Funder focus areas: ${funderFocusAreas.join(", ")}
${funderPriorities ? `Funder priorities: ${funderPriorities}` : ""}
${reqBlock}
Section to write: ${sectionLabel}
${sectionDescription ? `Instructions: ${sectionDescription}` : ""}
Tone: ${tone}
Target length: approximately ${wordTarget} words

${existingContent ? `Existing draft to improve:\n${existingContent}` : "Write this section from scratch."}

Write compelling, specific grant content that will resonate with ${funderName}. Use concrete numbers, named communities, and measurable outcomes where possible.
`.trim();
}

export const COMPLIANCE_SYSTEM = `You are a strict grant compliance auditor reviewing nonprofit grant applications in British Columbia and Alberta, Canada.

Your job is to identify compliance issues that would reduce the chances of approval:
- Missing required sections
- Content that doesn't align with funder priorities
- Vague outcome statements (no numbers, no timelines)
- Missing CRA-required language
- Budget inconsistencies
- Eligibility issues

Return a JSON array of issues. Each issue must have:
{
  "field": "section key or field name",
  "severity": "ERROR" | "WARNING" | "INFO",
  "message": "Clear, actionable description of the issue",
  "suggestion": "Specific suggestion for how to fix it"
}

Be strict but constructive. Focus on issues that materially affect approval chances.`;

export function buildComplianceUserPrompt({
  funderName,
  funderFocusAreas,
  rules,
  sections,
}: {
  funderName: string;
  funderFocusAreas: string[];
  rules: Array<{ field: string; message: string; severity: string }>;
  sections: Array<{ sectionKey: string; label: string; content: string | null; wordCount: number }>;
}): string {
  return `
Funder: ${funderName}
Focus areas: ${funderFocusAreas.join(", ")}

Funder rules:
${rules.map((r) => `- [${r.severity}] ${r.field}: ${r.message}`).join("\n")}

Application sections:
${sections
  .map(
    (s) => `
## ${s.label} (${s.sectionKey})
Word count: ${s.wordCount}
Content: ${s.content ? s.content.slice(0, 500) + (s.content.length > 500 ? "..." : "") : "[EMPTY]"}
`
  )
  .join("\n")}

Return a JSON array of compliance issues. Return [] if no issues found.
`.trim();
}
