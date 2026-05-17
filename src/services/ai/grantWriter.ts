import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import {
  GRANT_WRITER_SYSTEM,
  buildSectionUserPrompt,
} from "./promptTemplates";

interface GrantWriterInput {
  grant: {
    organization: {
      name: string;
      registrationType: string;
      province: string;
      missionStatement: string | null;
      programDescription: string | null;
    };
    funder: {
      name: string;
      focusAreas: string[];
      sections: Array<{
        sectionKey: string;
        label: string;
        description: string | null;
      }>;
    };
    sections: Array<{
      sectionKey: string;
      content: string | null;
    }>;
  };
  sectionKey: string;
  tone: "professional" | "warm" | "formal";
  wordTarget: number;
}

export function buildGrantWriterMessages(
  input: GrantWriterInput
): ChatCompletionMessageParam[] {
  const { grant, sectionKey, tone, wordTarget } = input;
  const { organization, funder, sections } = grant;

  const funderSection = funder.sections.find((s) => s.sectionKey === sectionKey);
  const existingSection = sections.find((s) => s.sectionKey === sectionKey);

  const userPrompt = buildSectionUserPrompt({
    orgName: organization.name,
    orgType: organization.registrationType,
    province: organization.province,
    mission: organization.missionStatement ?? "Serving our community",
    programDescription: organization.programDescription ?? undefined,
    funderName: funder.name,
    funderFocusAreas: funder.focusAreas,
    sectionLabel: funderSection?.label ?? sectionKey,
    sectionDescription: funderSection?.description ?? undefined,
    tone,
    wordTarget,
    existingContent: existingSection?.content ?? undefined,
  });

  return [
    { role: "system", content: GRANT_WRITER_SYSTEM },
    { role: "user", content: userPrompt },
  ];
}
