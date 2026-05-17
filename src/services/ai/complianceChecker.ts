import { openai, OPENAI_MODEL } from "@/lib/openai";
import { countWords } from "@/lib/utils";
import {
  COMPLIANCE_SYSTEM,
  buildComplianceUserPrompt,
} from "./promptTemplates";

interface ComplianceIssue {
  field: string;
  severity: "ERROR" | "WARNING" | "INFO";
  message: string;
  suggestion: string;
}

interface ComplianceInput {
  funder: {
    name: string;
    focusAreas: string[];
    rules: Array<{
      id: string;
      ruleType: string;
      field: string;
      operator: string;
      value: string;
      severity: string;
      message: string;
    }>;
    sections: Array<{
      sectionKey: string;
      isRequired: boolean;
      minWords: number | null;
      maxWords: number | null;
    }>;
  };
  sections: Array<{
    sectionKey: string;
    label: string;
    content: string | null;
    wordCount: number;
  }>;
}

export async function runComplianceCheck(grant: ComplianceInput): Promise<{
  score: number;
  passedRules: number;
  failedRules: number;
  warningRules: number;
  issues: ComplianceIssue[];
}> {
  const deterministicIssues: ComplianceIssue[] = [];

  // 1. Deterministic checks (fast, no LLM)
  for (const funderSection of grant.funder.sections) {
    const grantSection = grant.sections.find(
      (s) => s.sectionKey === funderSection.sectionKey
    );

    if (funderSection.isRequired && (!grantSection?.content || grantSection.wordCount < 10)) {
      deterministicIssues.push({
        field: funderSection.sectionKey,
        severity: "ERROR",
        message: `Required section "${funderSection.sectionKey.replace(/_/g, " ")}" is empty or too short`,
        suggestion: "Use the AI writer to generate content for this section, or write at least 50 words.",
      });
    }

    if (funderSection.maxWords && grantSection && grantSection.wordCount > funderSection.maxWords) {
      deterministicIssues.push({
        field: funderSection.sectionKey,
        severity: "ERROR",
        message: `Section exceeds maximum word count: ${grantSection.wordCount}/${funderSection.maxWords} words`,
        suggestion: `Reduce this section by ${grantSection.wordCount - funderSection.maxWords} words.`,
      });
    }

    if (funderSection.minWords && grantSection && grantSection.wordCount < funderSection.minWords) {
      deterministicIssues.push({
        field: funderSection.sectionKey,
        severity: "WARNING",
        message: `Section is below minimum word count: ${grantSection.wordCount}/${funderSection.minWords} words`,
        suggestion: `Add at least ${funderSection.minWords - grantSection.wordCount} more words to this section.`,
      });
    }
  }

  // 2. AI-powered content quality check
  let aiIssues: ComplianceIssue[] = [];
  try {
    const response = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        { role: "system", content: COMPLIANCE_SYSTEM },
        {
          role: "user",
          content: buildComplianceUserPrompt({
            funderName: grant.funder.name,
            funderFocusAreas: grant.funder.focusAreas,
            rules: grant.funder.rules,
            sections: grant.sections,
          }),
        },
      ],
      temperature: 0.2,
      response_format: { type: "json_object" },
    });

    const raw = response.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw);
    aiIssues = Array.isArray(parsed) ? parsed : parsed.issues ?? [];
  } catch (err) {
    console.error("AI compliance check failed:", err);
  }

  const allIssues = [...deterministicIssues, ...aiIssues];
  const errors = allIssues.filter((i) => i.severity === "ERROR").length;
  const warnings = allIssues.filter((i) => i.severity === "WARNING").length;
  const totalRules = grant.funder.rules.length + grant.funder.sections.length;

  const score = Math.max(0, Math.min(100, 100 - errors * 15 - warnings * 5));

  return {
    score,
    passedRules: Math.max(0, totalRules - errors - warnings),
    failedRules: errors,
    warningRules: warnings,
    issues: allIssues,
  };
}
