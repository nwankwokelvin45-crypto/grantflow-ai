import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env" });
dotenv.config({ path: ".env.local", override: true });

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL or DIRECT_URL must be set");
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

// ─── Shared section builders ────────────────────────────────────────────────

type S = { key: string; label: string; desc: string; required: boolean; min: number; max: number; order: number };
type R = { type: string; field: string; op: string; val: string; sev: string; msg: string; help?: string };

function stdSections(geo: string): S[] {
  return [
    { key: "executive_summary", label: "Executive Summary", desc: `Concise overview of your project (300–500 words): organization, problem, solution, outcomes, and budget.`, required: true, min: 300, max: 500, order: 0 },
    { key: "community_need", label: "Community Need", desc: `Describe the issue your project addresses in ${geo}. Include local data or evidence.`, required: true, min: 200, max: 450, order: 1 },
    { key: "project_description", label: "Project Description", desc: `Describe your activities, timeline, target population, and geography in ${geo}.`, required: true, min: 300, max: 600, order: 2 },
    { key: "outcomes_evaluation", label: "Outcomes & Evaluation", desc: "List specific measurable outcomes and your evaluation approach.", required: true, min: 200, max: 400, order: 3 },
    { key: "budget_narrative", label: "Budget Narrative", desc: "Justify each budget line item. List all other confirmed funding sources.", required: true, min: 150, max: 350, order: 4 },
  ];
}

function stdRules(geo: string, geoKey: string): R[] {
  return [
    { type: "REQUIRED_SECTION", field: "outcomes_evaluation", op: "NOT_EMPTY", val: "true", sev: "ERROR", msg: "Outcomes & Evaluation section is required" },
    { type: "CONTENT_REQUIRED", field: "community_need", op: "CONTAINS", val: geoKey, sev: "WARNING", msg: `Community Need should reference ${geo} specifically` },
    { type: "CONTENT_REQUIRED", field: "outcomes_evaluation", op: "CONTAINS", val: "participant|person|individual|beneficiar|resident", sev: "WARNING", msg: "Include the number of people who will benefit" },
  ];
}

function artsSections(geo: string): S[] {
  return [
    { key: "organization_mandate", label: "Artistic Mandate", desc: `Describe your organization's artistic mandate and role in ${geo}'s arts ecosystem.`, required: true, min: 200, max: 400, order: 0 },
    { key: "project_description", label: "Project Description", desc: "Describe the artistic project, activities, key artists, and timeline.", required: true, min: 300, max: 600, order: 1 },
    { key: "artistic_merit", label: "Artistic Merit", desc: `Explain the artistic significance of this project and its impact on ${geo} communities.`, required: true, min: 200, max: 400, order: 2 },
    { key: "community_reach", label: "Community Reach & Engagement", desc: "Describe how and how many community members will experience this work.", required: true, min: 150, max: 350, order: 3 },
    { key: "budget_narrative", label: "Budget Narrative", desc: "Justify your budget. List confirmed co-funders.", required: true, min: 100, max: 300, order: 4 },
  ];
}

function housingSections(geo: string): S[] {
  return [
    { key: "project_description", label: "Project Description", desc: `Describe the housing project, target population, location in ${geo}, and activities.`, required: true, min: 300, max: 600, order: 0 },
    { key: "community_need", label: "Housing Need", desc: `Provide evidence of housing need in ${geo}. Include vacancy rates, wait-list data, or community statistics.`, required: true, min: 200, max: 450, order: 1 },
    { key: "target_population", label: "Target Population", desc: "Describe the people to be housed. Include vulnerability indicators and barriers.", required: true, min: 150, max: 350, order: 2 },
    { key: "outcomes_evaluation", label: "Outcomes & Evaluation", desc: "State the number of units/individuals to be housed and your tracking approach.", required: true, min: 150, max: 350, order: 3 },
    { key: "budget_narrative", label: "Budget Narrative", desc: "Provide full project budget, financing structure, and other confirmed funding sources.", required: true, min: 200, max: 450, order: 4 },
  ];
}

function indigenousSections(geo: string): S[] {
  return [
    { key: "organization_background", label: "Organization & Community Background", desc: `Describe your Indigenous organization, the community you represent, and your work in ${geo}.`, required: true, min: 200, max: 450, order: 0 },
    { key: "community_need", label: "Community Need & Priorities", desc: "Describe the need or priority this project addresses, as identified by your community.", required: true, min: 200, max: 450, order: 1 },
    { key: "project_description", label: "Project Description", desc: "Describe the project activities, timeline, and who will benefit.", required: true, min: 300, max: 600, order: 2 },
    { key: "self_determination", label: "Indigenous Self-Determination", desc: "Explain how this project supports Indigenous self-determination, language, or culture.", required: true, min: 150, max: 400, order: 3 },
    { key: "outcomes_evaluation", label: "Outcomes & Evaluation", desc: "Describe expected outcomes and how you will measure them using culturally appropriate methods.", required: true, min: 150, max: 350, order: 4 },
    { key: "budget_narrative", label: "Budget Narrative", desc: "Justify your budget request. Include other funding sources.", required: true, min: 100, max: 300, order: 5 },
  ];
}

// ─── Funders ─────────────────────────────────────────────────────────────────

const funders = [

  // ═══════════════════════════════════════════════════════════
  // BC – EXISTING (kept for completeness, skip logic handles them)
  // ═══════════════════════════════════════════════════════════

  {
    name: "Vancouver Foundation",
    shortName: "VF",
    province: "BC" as const,
    website: "https://www.vancouverfoundation.ca",
    description: "Canada's largest community foundation, supporting nonprofits across BC in arts, environment, health, social services, and more.",
    focusAreas: ["ARTS_CULTURE", "ENVIRONMENT", "HEALTH", "SOCIAL_SERVICES", "EDUCATION", "INDIGENOUS"] as any[],
    fundingTypes: ["PROJECT", "OPERATING", "CAPACITY_BUILDING"] as any[],
    minGrantAmount: 5000, maxGrantAmount: 200000, typicalGrantAmount: 30000,
    deadlineType: "ROLLING" as const,
    deadlineNotes: "Open intake — applications reviewed quarterly",
    eligibleOrgTypes: ["NONPROFIT", "REGISTERED_CHARITY", "SOCIETY", "INDIGENOUS_ORGANIZATION"] as any[],
    sections: [
      { key: "executive_summary", label: "Executive Summary", desc: "Provide a concise overview of your project (300–500 words). Include your organization, the problem you're addressing, proposed solution, expected outcomes, and total budget.", required: true, min: 300, max: 500, order: 0 },
      { key: "organization_background", label: "Organization Background", desc: "Describe your organization's history, mission, programs, and community track record in BC.", required: true, min: 200, max: 400, order: 1 },
      { key: "project_description", label: "Project Description", desc: "Clearly describe project activities, timeline, target population, and geographic area.", required: true, min: 400, max: 750, order: 2 },
      { key: "community_need", label: "Community Need", desc: "Provide evidence of the problem your project addresses. Use BC-specific data.", required: true, min: 200, max: 500, order: 3 },
      { key: "outcomes_evaluation", label: "Outcomes & Evaluation", desc: "List specific measurable outcomes and explain how you will track and evaluate success.", required: true, min: 200, max: 400, order: 4 },
      { key: "budget_narrative", label: "Budget Narrative", desc: "Justify each line item. Explain in-kind contributions and other funding sources.", required: true, min: 150, max: 400, order: 5 },
    ] as S[],
    rules: [
      { type: "WORD_COUNT", field: "executive_summary", op: "BETWEEN", val: "300,500", sev: "ERROR", msg: "Executive summary must be 300–500 words" },
      { type: "REQUIRED_SECTION", field: "outcomes_evaluation", op: "NOT_EMPTY", val: "true", sev: "ERROR", msg: "Outcomes & Evaluation section is required" },
      { type: "CONTENT_REQUIRED", field: "community_need", op: "CONTAINS", val: "data|evidence|research|survey|statistic", sev: "WARNING", msg: "Community Need should cite BC-specific data or research" },
    ] as R[],
  },

  {
    name: "BC Arts Council",
    shortName: "BCAC",
    province: "BC" as const,
    website: "https://www.bcartscouncil.ca",
    description: "The provincial agency for arts funding in BC, supporting professional arts organizations through operating and project grants.",
    focusAreas: ["ARTS_CULTURE"] as any[],
    fundingTypes: ["PROJECT", "OPERATING"] as any[],
    minGrantAmount: 3000, maxGrantAmount: 100000, typicalGrantAmount: 20000,
    deadlineType: "ANNUAL" as const, deadlineMonth: 1,
    deadlineNotes: "Annual intake typically closes in January.",
    eligibleOrgTypes: ["NONPROFIT", "REGISTERED_CHARITY", "SOCIETY"] as any[],
    sections: artsSections("BC"),
    rules: [
      { type: "REQUIRED_SECTION", field: "artistic_merit", op: "NOT_EMPTY", val: "true", sev: "ERROR", msg: "Artistic Merit section is required" },
      { type: "ORG_ELIGIBILITY", field: "registrationType", op: "IS_ONE_OF", val: "NONPROFIT,REGISTERED_CHARITY,SOCIETY", sev: "ERROR", msg: "Applicant must be a registered BC nonprofit, charity, or society" },
      { type: "CONTENT_REQUIRED", field: "artistic_merit", op: "CONTAINS", val: "BC|British Columbia|provincial", sev: "WARNING", msg: "Reference your work's connection to BC" },
    ] as R[],
  },

  {
    name: "United Way of the Lower Mainland",
    shortName: "UWLM",
    province: "BC" as const,
    website: "https://www.uwlm.ca",
    description: "Funds programs addressing poverty, social inclusion, and community resilience across Metro Vancouver and the Fraser Valley.",
    focusAreas: ["SOCIAL_SERVICES", "HEALTH", "EDUCATION", "YOUTH", "SENIORS", "HOUSING"] as any[],
    fundingTypes: ["PROJECT", "OPERATING"] as any[],
    minGrantAmount: 10000, maxGrantAmount: 75000, typicalGrantAmount: 25000,
    deadlineType: "ANNUAL" as const, deadlineMonth: 3,
    deadlineNotes: "Community grants typically open in January and close in March.",
    eligibleOrgTypes: ["NONPROFIT", "REGISTERED_CHARITY", "SOCIETY"] as any[],
    sections: stdSections("Metro Vancouver / Fraser Valley"),
    rules: stdRules("Lower Mainland", "Vancouver|Burnaby|Fraser|Lower Mainland|Surrey"),
  },

  {
    name: "Columbia Basin Trust",
    shortName: "CBT",
    province: "BC" as const,
    website: "https://www.ourtrust.org",
    description: "Supports well-being of Columbia Basin residents through economic, social, and environmental initiatives in the Basin region.",
    focusAreas: ["ENVIRONMENT", "ECONOMIC_DEVELOPMENT", "SOCIAL_SERVICES", "ARTS_CULTURE", "HEALTH"] as any[],
    fundingTypes: ["PROJECT", "CAPACITY_BUILDING", "CAPITAL"] as any[],
    minGrantAmount: 5000, maxGrantAmount: 500000, typicalGrantAmount: 50000,
    deadlineType: "QUARTERLY" as const,
    deadlineNotes: "Community Initiative Fund reviewed quarterly.",
    eligibleOrgTypes: ["NONPROFIT", "REGISTERED_CHARITY", "SOCIETY", "INDIGENOUS_ORGANIZATION", "GOVERNMENT"] as any[],
    sections: stdSections("Columbia Basin"),
    rules: [
      { type: "CONTENT_REQUIRED", field: "project_description", op: "CONTAINS", val: "Columbia Basin|Kootenay|Revelstoke|Castlegar|Trail|Nelson|Creston|Invermere|Golden", sev: "ERROR", msg: "Project must be located in the Columbia Basin region of BC" },
      ...stdRules("Columbia Basin", "Columbia Basin|Kootenay|Basin"),
    ] as R[],
  },

  {
    name: "Real Estate Foundation of BC",
    shortName: "REFBC",
    province: "BC" as const,
    website: "https://www.refbc.com",
    description: "Funds initiatives advancing sustainable land use, housing, and the built environment across BC.",
    focusAreas: ["ENVIRONMENT", "HOUSING", "ECONOMIC_DEVELOPMENT"] as any[],
    fundingTypes: ["PROJECT", "CAPACITY_BUILDING"] as any[],
    minGrantAmount: 10000, maxGrantAmount: 150000, typicalGrantAmount: 40000,
    deadlineType: "BIANNUAL" as const,
    deadlineNotes: "Two intakes per year — typically spring and fall.",
    eligibleOrgTypes: ["NONPROFIT", "REGISTERED_CHARITY", "SOCIETY", "INDIGENOUS_ORGANIZATION"] as any[],
    sections: stdSections("BC"),
    rules: [
      { type: "CONTENT_REQUIRED", field: "project_description", op: "CONTAINS", val: "land|housing|built environment|property|zoning|planning|sustainable", sev: "ERROR", msg: "Project must address land use, housing, or the built environment" },
      ...stdRules("BC", "BC|British Columbia"),
    ] as R[],
  },

  // ═══════════════════════════════════════════════════════════
  // BC – PROVINCIAL GOVERNMENT
  // ═══════════════════════════════════════════════════════════

  {
    name: "BC Community Gaming Grants",
    shortName: "BCCGG",
    province: "BC" as const,
    website: "https://www2.gov.bc.ca/gov/content/sports-culture/gambling-fundraising/gaming-grants",
    description: "The BC Community Gaming Grants program distributes gaming revenue to eligible nonprofits across BC in arts, sports, environment, human and social services, and public safety.",
    focusAreas: ["ARTS_CULTURE", "SPORT_RECREATION", "ENVIRONMENT", "SOCIAL_SERVICES", "HEALTH"] as any[],
    fundingTypes: ["OPERATING", "PROJECT"] as any[],
    minGrantAmount: 2500, maxGrantAmount: 100000, typicalGrantAmount: 20000,
    deadlineType: "ANNUAL" as const, deadlineMonth: 9,
    deadlineNotes: "Applications typically accepted August–September for the following fiscal year.",
    eligibleOrgTypes: ["NONPROFIT", "REGISTERED_CHARITY", "SOCIETY"] as any[],
    sections: [
      { key: "organization_purpose", label: "Organization Purpose & Programs", desc: "Describe your organization's purpose, the programs you deliver, and the communities you serve in BC.", required: true, min: 200, max: 500, order: 0 },
      { key: "grant_purpose", label: "Grant Purpose", desc: "Explain specifically how gaming grant funds will be used. Break down by activity or program area.", required: true, min: 200, max: 450, order: 1 },
      { key: "community_benefit", label: "Community Benefit", desc: "Describe the direct benefit to BC residents. State the number of participants or beneficiaries.", required: true, min: 150, max: 400, order: 2 },
      { key: "budget_narrative", label: "Budget Narrative", desc: "Provide a complete organizational budget. Show revenue sources and expenses. List other gaming grants received.", required: true, min: 150, max: 400, order: 3 },
    ] as S[],
    rules: [
      { type: "REQUIRED_SECTION", field: "community_benefit", op: "NOT_EMPTY", val: "true", sev: "ERROR", msg: "Community Benefit is required for BC Community Gaming Grants" },
      { type: "CONTENT_REQUIRED", field: "community_benefit", op: "CONTAINS", val: "participant|member|resident|person|individual|beneficiar", sev: "WARNING", msg: "State the number of BC residents who will benefit" },
      { type: "ORG_ELIGIBILITY", field: "registrationType", op: "IS_ONE_OF", val: "NONPROFIT,REGISTERED_CHARITY,SOCIETY", sev: "ERROR", msg: "Must be a registered BC nonprofit, charity, or society" },
    ] as R[],
  },

  {
    name: "First Peoples' Cultural Council",
    shortName: "FPCC",
    province: "BC" as const,
    website: "https://fpcc.ca",
    description: "The First Peoples' Cultural Council supports BC Indigenous communities in language revitalization, arts, and cultural heritage through targeted grant programs.",
    focusAreas: ["INDIGENOUS", "ARTS_CULTURE", "EDUCATION"] as any[],
    fundingTypes: ["PROJECT", "CAPACITY_BUILDING"] as any[],
    minGrantAmount: 5000, maxGrantAmount: 50000, typicalGrantAmount: 15000,
    deadlineType: "ANNUAL" as const, deadlineMonth: 3,
    deadlineNotes: "Language and culture grants typically close in March. Check FPCC website for program-specific dates.",
    eligibleOrgTypes: ["INDIGENOUS_ORGANIZATION", "NONPROFIT", "SOCIETY"] as any[],
    sections: indigenousSections("BC"),
    rules: [
      { type: "ORG_ELIGIBILITY", field: "registrationType", op: "IS_ONE_OF", val: "INDIGENOUS_ORGANIZATION,NONPROFIT,SOCIETY", sev: "ERROR", msg: "FPCC grants are for BC First Nations, Métis, and Indigenous organizations" },
      { type: "CONTENT_REQUIRED", field: "self_determination", op: "CONTAINS", val: "language|culture|heritage|traditional|Indigenous|First Nation|Métis", sev: "ERROR", msg: "Must address Indigenous language, culture, or heritage revitalization" },
      { type: "REQUIRED_SECTION", field: "community_need", op: "NOT_EMPTY", val: "true", sev: "ERROR", msg: "Community Need & Priorities section is required" },
    ] as R[],
  },

  {
    name: "BC Ministry of Social Development & Poverty Reduction",
    shortName: "SDPR",
    province: "BC" as const,
    website: "https://www2.gov.bc.ca/gov/content/governments/organizational-structure/ministries-organizations/ministries/social-development-poverty-reduction",
    description: "Provides community development grants to BC nonprofits addressing poverty reduction, food security, and basic needs for vulnerable populations.",
    focusAreas: ["SOCIAL_SERVICES", "FOOD_SECURITY", "HOUSING", "SENIORS", "DISABILITY", "IMMIGRATION"] as any[],
    fundingTypes: ["PROJECT", "OPERATING"] as any[],
    minGrantAmount: 10000, maxGrantAmount: 200000, typicalGrantAmount: 40000,
    deadlineType: "ANNUAL" as const, deadlineMonth: 2,
    deadlineNotes: "Community grants typically open late fall and close in February.",
    eligibleOrgTypes: ["NONPROFIT", "REGISTERED_CHARITY", "SOCIETY", "INDIGENOUS_ORGANIZATION"] as any[],
    sections: stdSections("BC"),
    rules: [
      { type: "CONTENT_REQUIRED", field: "community_need", op: "CONTAINS", val: "poverty|low-income|vulnerable|marginalized|food|housing|barrier", sev: "ERROR", msg: "Project must address poverty reduction or basic needs for vulnerable BC residents" },
      ...stdRules("BC", "BC|British Columbia"),
    ] as R[],
  },

  {
    name: "BC Ministry of Public Safety & Solicitor General",
    shortName: "PSSG",
    province: "BC" as const,
    website: "https://www2.gov.bc.ca/gov/content/governments/organizational-structure/ministries-organizations/ministries/public-safety-solicitor-general",
    description: "Funds BC nonprofits delivering crime prevention, victim services, and public safety programs through the Community Safety and Crime Prevention Grant.",
    focusAreas: ["SOCIAL_SERVICES", "HEALTH", "YOUTH", "INDIGENOUS"] as any[],
    fundingTypes: ["PROJECT", "OPERATING"] as any[],
    minGrantAmount: 5000, maxGrantAmount: 75000, typicalGrantAmount: 20000,
    deadlineType: "ROLLING" as const,
    deadlineNotes: "Rolling intake for victim services and crime prevention. Contact ministry for current priorities.",
    eligibleOrgTypes: ["NONPROFIT", "REGISTERED_CHARITY", "SOCIETY", "INDIGENOUS_ORGANIZATION"] as any[],
    sections: stdSections("BC"),
    rules: [
      { type: "CONTENT_REQUIRED", field: "project_description", op: "CONTAINS", val: "safety|crime|victim|prevention|at-risk|violence|justice", sev: "ERROR", msg: "Project must address public safety, crime prevention, or victim services" },
      ...stdRules("BC", "BC|British Columbia"),
    ] as R[],
  },

  {
    name: "BC Housing",
    shortName: "BCH",
    province: "BC" as const,
    website: "https://www.bchousing.org",
    description: "BC Housing funds nonprofit housing societies and Indigenous organizations to develop and operate affordable, supportive, and transitional housing across BC.",
    focusAreas: ["HOUSING", "SOCIAL_SERVICES", "INDIGENOUS", "HEALTH"] as any[],
    fundingTypes: ["CAPITAL", "OPERATING"] as any[],
    minGrantAmount: 50000, maxGrantAmount: 5000000, typicalGrantAmount: 500000,
    deadlineType: "ROLLING" as const,
    deadlineNotes: "Applications accepted on a rolling basis. Funding available through several programs — check BC Housing website.",
    eligibleOrgTypes: ["NONPROFIT", "REGISTERED_CHARITY", "SOCIETY", "INDIGENOUS_ORGANIZATION"] as any[],
    sections: housingSections("BC"),
    rules: [
      { type: "CONTENT_REQUIRED", field: "project_description", op: "CONTAINS", val: "housing|shelter|units|beds|transitional|supportive|affordable", sev: "ERROR", msg: "Project must address housing, shelter, or supportive housing" },
      { type: "CONTENT_REQUIRED", field: "community_need", op: "CONTAINS", val: "homeless|housing|affordab|waitlist|vacancy|shelter", sev: "WARNING", msg: "Housing need should reference BC housing data or waitlist statistics" },
      { type: "REQUIRED_SECTION", field: "outcomes_evaluation", op: "NOT_EMPTY", val: "true", sev: "ERROR", msg: "Outcomes section is required — state number of units or people housed" },
    ] as R[],
  },

  {
    name: "viaSport BC",
    shortName: "viaSport",
    province: "BC" as const,
    website: "https://www.viasport.ca",
    description: "viaSport BC is the provincial body for community sport and recreation, providing grants that increase participation in sport for all British Columbians.",
    focusAreas: ["SPORT_RECREATION", "YOUTH", "DISABILITY", "INDIGENOUS"] as any[],
    fundingTypes: ["PROJECT", "CAPACITY_BUILDING"] as any[],
    minGrantAmount: 2500, maxGrantAmount: 50000, typicalGrantAmount: 10000,
    deadlineType: "ANNUAL" as const, deadlineMonth: 10,
    deadlineNotes: "BC Sport Participation Program opens September, closes October.",
    eligibleOrgTypes: ["NONPROFIT", "REGISTERED_CHARITY", "SOCIETY", "INDIGENOUS_ORGANIZATION"] as any[],
    sections: [
      { key: "sport_program", label: "Sport Program Description", desc: "Describe the sport or recreation program, the sport/activity, and how it will be delivered in BC.", required: true, min: 200, max: 500, order: 0 },
      { key: "target_population", label: "Target Population", desc: "Describe who will participate — focus on underserved populations (youth, Indigenous, persons with disabilities, newcomers).", required: true, min: 150, max: 350, order: 1 },
      { key: "participation_outcomes", label: "Participation Outcomes", desc: "State the number of new or sustained participants. Describe barriers removed.", required: true, min: 150, max: 350, order: 2 },
      { key: "budget_narrative", label: "Budget Narrative", desc: "Justify program costs. List BC Games, national sport federation, and other funding.", required: true, min: 100, max: 300, order: 3 },
    ] as S[],
    rules: [
      { type: "CONTENT_REQUIRED", field: "target_population", op: "CONTAINS", val: "youth|Indigenous|disabilit|newcomer|underserved|barrier|inclusion", sev: "WARNING", msg: "viaSport prioritizes underserved populations — reference your inclusion approach" },
      { type: "CONTENT_REQUIRED", field: "participation_outcomes", op: "CONTAINS", val: "participant|registration|player|athlete|member", sev: "ERROR", msg: "State the number of sport participants" },
    ] as R[],
  },

  {
    name: "BC Multiculturalism & Anti-Racism Grants",
    shortName: "BCAR",
    province: "BC" as const,
    website: "https://www2.gov.bc.ca/gov/content/governments/multiculturalism-anti-racism",
    description: "BC Government grants supporting multiculturalism, anti-racism, and cross-cultural understanding for newcomers and diverse communities across BC.",
    focusAreas: ["IMMIGRATION", "SOCIAL_SERVICES", "EDUCATION", "ARTS_CULTURE"] as any[],
    fundingTypes: ["PROJECT"] as any[],
    minGrantAmount: 5000, maxGrantAmount: 50000, typicalGrantAmount: 15000,
    deadlineType: "ANNUAL" as const, deadlineMonth: 11,
    deadlineNotes: "Anti-racism and multiculturalism grants typically close in November.",
    eligibleOrgTypes: ["NONPROFIT", "REGISTERED_CHARITY", "SOCIETY", "INDIGENOUS_ORGANIZATION"] as any[],
    sections: stdSections("BC"),
    rules: [
      { type: "CONTENT_REQUIRED", field: "project_description", op: "CONTAINS", val: "multicultural|anti-racism|racism|diversity|newcomer|immigrant|cross-cultural|inclusion", sev: "ERROR", msg: "Project must address multiculturalism, anti-racism, or newcomer inclusion" },
      ...stdRules("BC", "BC|British Columbia"),
    ] as R[],
  },

  // ═══════════════════════════════════════════════════════════
  // BC – FEDERAL FUNDERS
  // ═══════════════════════════════════════════════════════════

  {
    name: "Canada Council for the Arts",
    shortName: "CCA-BC",
    province: "BC" as const,
    website: "https://canadacouncil.ca",
    description: "The federal arts funding body supporting Canadian artistic excellence. BC arts organizations and artists are eligible for all CCA grant programs.",
    focusAreas: ["ARTS_CULTURE"] as any[],
    fundingTypes: ["PROJECT", "OPERATING", "CAPACITY_BUILDING"] as any[],
    minGrantAmount: 5000, maxGrantAmount: 500000, typicalGrantAmount: 40000,
    deadlineType: "BIANNUAL" as const,
    deadlineNotes: "Most programs have spring (February/March) and fall (October) intakes. Deadlines vary by program.",
    eligibleOrgTypes: ["NONPROFIT", "REGISTERED_CHARITY", "SOCIETY", "INDIGENOUS_ORGANIZATION"] as any[],
    sections: artsSections("Canada"),
    rules: [
      { type: "REQUIRED_SECTION", field: "artistic_merit", op: "NOT_EMPTY", val: "true", sev: "ERROR", msg: "Artistic Merit is required for Canada Council applications" },
      { type: "CONTENT_REQUIRED", field: "community_reach", op: "CONTAINS", val: "Canadian|Canada|national|BC|British Columbia|audience", sev: "WARNING", msg: "Reference Canadian audiences or national/BC significance of the work" },
    ] as R[],
  },

  {
    name: "ESDC Community Services Recovery Fund",
    shortName: "ESDC-BC",
    province: "BC" as const,
    website: "https://www.canada.ca/en/employment-social-development.html",
    description: "Employment and Social Development Canada funds BC nonprofits delivering employment, community development, and social inclusion programs.",
    focusAreas: ["SOCIAL_SERVICES", "ECONOMIC_DEVELOPMENT", "YOUTH", "SENIORS", "DISABILITY", "IMMIGRATION"] as any[],
    fundingTypes: ["PROJECT", "OPERATING"] as any[],
    minGrantAmount: 10000, maxGrantAmount: 500000, typicalGrantAmount: 75000,
    deadlineType: "ROLLING" as const,
    deadlineNotes: "ESDC programs have varying intakes. Check canada.ca for current calls for proposals.",
    eligibleOrgTypes: ["NONPROFIT", "REGISTERED_CHARITY", "SOCIETY", "INDIGENOUS_ORGANIZATION"] as any[],
    sections: stdSections("BC"),
    rules: stdRules("BC communities", "BC|British Columbia|Canadian"),
  },

  {
    name: "Women and Gender Equality Canada (WAGE)",
    shortName: "WAGE-BC",
    province: "BC" as const,
    website: "https://women-gender-equality.canada.ca",
    description: "Federal grants advancing gender equality, ending gender-based violence, and supporting women's economic security and leadership in BC.",
    focusAreas: ["SOCIAL_SERVICES", "HEALTH", "EDUCATION", "LGBTQ", "INDIGENOUS"] as any[],
    fundingTypes: ["PROJECT", "CAPACITY_BUILDING"] as any[],
    minGrantAmount: 10000, maxGrantAmount: 300000, typicalGrantAmount: 60000,
    deadlineType: "ANNUAL" as const, deadlineMonth: 3,
    deadlineNotes: "Calls for proposals typically released in fall, with spring deadlines.",
    eligibleOrgTypes: ["NONPROFIT", "REGISTERED_CHARITY", "SOCIETY", "INDIGENOUS_ORGANIZATION"] as any[],
    sections: stdSections("BC"),
    rules: [
      { type: "CONTENT_REQUIRED", field: "project_description", op: "CONTAINS", val: "women|gender|gender-based violence|GBV|feminist|equality|equity|girl", sev: "ERROR", msg: "Project must address gender equality or women's empowerment" },
      ...stdRules("BC", "BC|British Columbia|Canadian"),
    ] as R[],
  },

  {
    name: "Indigenous Services Canada",
    shortName: "ISC-BC",
    province: "BC" as const,
    website: "https://www.canada.ca/en/indigenous-services-canada.html",
    description: "Federal funding for Indigenous communities and organizations in BC for health, education, infrastructure, and community well-being.",
    focusAreas: ["INDIGENOUS", "HEALTH", "EDUCATION", "HOUSING", "SOCIAL_SERVICES"] as any[],
    fundingTypes: ["PROJECT", "OPERATING", "CAPITAL"] as any[],
    minGrantAmount: 10000, maxGrantAmount: 2000000, typicalGrantAmount: 100000,
    deadlineType: "ROLLING" as const,
    deadlineNotes: "Multiple programs with varying intakes. Contact your regional ISC office in BC.",
    eligibleOrgTypes: ["INDIGENOUS_ORGANIZATION", "NONPROFIT"] as any[],
    sections: indigenousSections("BC"),
    rules: [
      { type: "ORG_ELIGIBILITY", field: "registrationType", op: "IS_ONE_OF", val: "INDIGENOUS_ORGANIZATION,NONPROFIT", sev: "ERROR", msg: "ISC funding is for First Nations, Métis, and Inuit organizations" },
      { type: "REQUIRED_SECTION", field: "self_determination", op: "NOT_EMPTY", val: "true", sev: "ERROR", msg: "Self-determination section is required for ISC applications" },
    ] as R[],
  },

  {
    name: "CMHC Community Housing Initiative",
    shortName: "CMHC-BC",
    province: "BC" as const,
    website: "https://www.cmhc-schl.gc.ca",
    description: "Canada Mortgage and Housing Corporation funds affordable and community housing projects in BC through the National Housing Strategy.",
    focusAreas: ["HOUSING", "SOCIAL_SERVICES", "INDIGENOUS"] as any[],
    fundingTypes: ["CAPITAL", "OPERATING"] as any[],
    minGrantAmount: 100000, maxGrantAmount: 10000000, typicalGrantAmount: 1000000,
    deadlineType: "ROLLING" as const,
    deadlineNotes: "NHS programs accept applications on a rolling basis. Contact CMHC BC regional office.",
    eligibleOrgTypes: ["NONPROFIT", "REGISTERED_CHARITY", "SOCIETY", "INDIGENOUS_ORGANIZATION"] as any[],
    sections: housingSections("BC"),
    rules: [
      { type: "CONTENT_REQUIRED", field: "project_description", op: "CONTAINS", val: "affordable|units|housing|shelter|beds|rental|supportive", sev: "ERROR", msg: "Must describe affordable or community housing units" },
      { type: "CONTENT_REQUIRED", field: "community_need", op: "CONTAINS", val: "affordab|homeless|waitlist|housing need|core housing need", sev: "WARNING", msg: "Reference Canada's core housing need indicators" },
    ] as R[],
  },

  {
    name: "National Crime Prevention Strategy",
    shortName: "NCPS-BC",
    province: "BC" as const,
    website: "https://www.publicsafety.gc.ca/cnt/cntrng-crm/crm-prvntn/index-en.aspx",
    description: "Public Safety Canada funds BC organizations delivering evidence-based crime prevention programs targeting youth, Indigenous peoples, and at-risk populations.",
    focusAreas: ["SOCIAL_SERVICES", "YOUTH", "INDIGENOUS", "HEALTH"] as any[],
    fundingTypes: ["PROJECT"] as any[],
    minGrantAmount: 25000, maxGrantAmount: 500000, typicalGrantAmount: 100000,
    deadlineType: "ANNUAL" as const, deadlineMonth: 6,
    deadlineNotes: "Calls for proposals released periodically. Check publicsafety.gc.ca.",
    eligibleOrgTypes: ["NONPROFIT", "REGISTERED_CHARITY", "SOCIETY", "INDIGENOUS_ORGANIZATION", "GOVERNMENT"] as any[],
    sections: stdSections("BC"),
    rules: [
      { type: "CONTENT_REQUIRED", field: "project_description", op: "CONTAINS", val: "crime|prevention|at-risk|youth|gang|violence|justice|reintegration", sev: "ERROR", msg: "Project must address crime prevention or at-risk youth" },
      ...stdRules("BC", "BC|British Columbia|Canadian"),
    ] as R[],
  },

  {
    name: "Canadian Heritage (BC Programs)",
    shortName: "PCH-BC",
    province: "BC" as const,
    website: "https://www.canada.ca/en/canadian-heritage.html",
    description: "Canadian Heritage funds BC arts, culture, sports, and multiculturalism organizations through programs like Building Communities through Arts & Heritage.",
    focusAreas: ["ARTS_CULTURE", "SPORT_RECREATION", "IMMIGRATION", "INDIGENOUS"] as any[],
    fundingTypes: ["PROJECT", "OPERATING"] as any[],
    minGrantAmount: 5000, maxGrantAmount: 200000, typicalGrantAmount: 30000,
    deadlineType: "ANNUAL" as const, deadlineMonth: 2,
    deadlineNotes: "Various program deadlines — typically fall/spring. Check pch.gc.ca for current programs.",
    eligibleOrgTypes: ["NONPROFIT", "REGISTERED_CHARITY", "SOCIETY", "INDIGENOUS_ORGANIZATION"] as any[],
    sections: stdSections("BC / Canada"),
    rules: stdRules("BC communities", "BC|British Columbia|Canadian|Canada"),
  },

  {
    name: "NRC IRAP (BC Programs)",
    shortName: "IRAP-BC",
    province: "BC" as const,
    website: "https://nrc.canada.ca/en/support-technology-innovation/nrc-industrial-research-assistance-program",
    description: "NRC Industrial Research Assistance Program supports BC nonprofits and social enterprises undertaking technology-based innovation and applied research.",
    focusAreas: ["ECONOMIC_DEVELOPMENT", "HEALTH", "ENVIRONMENT"] as any[],
    fundingTypes: ["PROJECT"] as any[],
    minGrantAmount: 50000, maxGrantAmount: 1000000, typicalGrantAmount: 150000,
    deadlineType: "ROLLING" as const,
    deadlineNotes: "Applications accepted on a rolling basis through IRAP advisors.",
    eligibleOrgTypes: ["NONPROFIT", "REGISTERED_CHARITY", "SOCIETY"] as any[],
    sections: [
      { key: "innovation_description", label: "Innovation Description", desc: "Describe the technology or innovation you are developing. Explain what is novel or experimental.", required: true, min: 300, max: 600, order: 0 },
      { key: "project_description", label: "Project Plan", desc: "Outline research activities, milestones, timelines, and team qualifications.", required: true, min: 300, max: 600, order: 1 },
      { key: "outcomes_evaluation", label: "Outcomes & Commercialization", desc: "Describe expected technical outcomes and any paths to adoption or scale.", required: true, min: 200, max: 400, order: 2 },
      { key: "budget_narrative", label: "Budget Narrative", desc: "Justify research costs including personnel, equipment, and direct expenses.", required: true, min: 150, max: 350, order: 3 },
    ] as S[],
    rules: [
      { type: "CONTENT_REQUIRED", field: "innovation_description", op: "CONTAINS", val: "technolog|innovation|research|prototype|software|digital|data|AI|machine learning", sev: "ERROR", msg: "Must describe a technology innovation or applied research activity" },
      { type: "REQUIRED_SECTION", field: "outcomes_evaluation", op: "NOT_EMPTY", val: "true", sev: "ERROR", msg: "Outcomes section is required" },
    ] as R[],
  },

  {
    name: "Pacific Economic Development Canada",
    shortName: "PacifiCan",
    province: "BC" as const,
    website: "https://www.canada.ca/en/pacific-economic-development.html",
    description: "Federal agency investing in BC's economic growth — innovation, clean economy, community economic development, and rural/Indigenous economic opportunities.",
    focusAreas: ["ECONOMIC_DEVELOPMENT", "INDIGENOUS", "ENVIRONMENT"] as any[],
    fundingTypes: ["PROJECT", "CAPITAL", "CAPACITY_BUILDING"] as any[],
    minGrantAmount: 50000, maxGrantAmount: 5000000, typicalGrantAmount: 200000,
    deadlineType: "ROLLING" as const,
    deadlineNotes: "Most programs are intake-driven. Watch PacifiCan website for calls for proposals.",
    eligibleOrgTypes: ["NONPROFIT", "REGISTERED_CHARITY", "SOCIETY", "INDIGENOUS_ORGANIZATION", "COOPERATIVE"] as any[],
    sections: stdSections("BC"),
    rules: [
      { type: "CONTENT_REQUIRED", field: "project_description", op: "CONTAINS", val: "economic|employment|business|community economic|innovation|clean|Indigenous|rural", sev: "ERROR", msg: "Project must address economic development in BC" },
      ...stdRules("BC", "BC|British Columbia"),
    ] as R[],
  },

  // ═══════════════════════════════════════════════════════════
  // BC – MAJOR FOUNDATIONS
  // ═══════════════════════════════════════════════════════════

  {
    name: "Law Foundation of BC",
    shortName: "LFBC",
    province: "BC" as const,
    website: "https://www.lawfoundationbc.org",
    description: "Funds legal aid, law reform, public legal education, and access to justice initiatives across British Columbia.",
    focusAreas: ["SOCIAL_SERVICES", "EDUCATION", "INDIGENOUS", "IMMIGRATION"] as any[],
    fundingTypes: ["PROJECT", "OPERATING", "CAPACITY_BUILDING"] as any[],
    minGrantAmount: 10000, maxGrantAmount: 300000, typicalGrantAmount: 50000,
    deadlineType: "ANNUAL" as const, deadlineMonth: 3,
    deadlineNotes: "Main grant intake typically closes in March.",
    eligibleOrgTypes: ["NONPROFIT", "REGISTERED_CHARITY", "SOCIETY", "INDIGENOUS_ORGANIZATION"] as any[],
    sections: stdSections("BC"),
    rules: [
      { type: "CONTENT_REQUIRED", field: "project_description", op: "CONTAINS", val: "legal|justice|access|law|rights|court|tribunal|advocacy|legal aid", sev: "ERROR", msg: "Project must address legal aid, access to justice, or public legal education" },
      ...stdRules("BC", "BC|British Columbia"),
    ] as R[],
  },

  {
    name: "Victoria Foundation",
    shortName: "VicFdn",
    province: "BC" as const,
    website: "https://victoriafoundation.bc.ca",
    description: "Victoria Foundation supports nonprofits in Greater Victoria and Vancouver Island through community grants in all sectors.",
    focusAreas: ["ARTS_CULTURE", "ENVIRONMENT", "HEALTH", "SOCIAL_SERVICES", "EDUCATION", "SPORT_RECREATION"] as any[],
    fundingTypes: ["PROJECT", "CAPACITY_BUILDING"] as any[],
    minGrantAmount: 5000, maxGrantAmount: 75000, typicalGrantAmount: 20000,
    deadlineType: "ANNUAL" as const, deadlineMonth: 10,
    deadlineNotes: "Vital Victoria Grants program typically closes in October.",
    eligibleOrgTypes: ["NONPROFIT", "REGISTERED_CHARITY", "SOCIETY", "INDIGENOUS_ORGANIZATION"] as any[],
    sections: stdSections("Greater Victoria / Vancouver Island"),
    rules: [
      { type: "CONTENT_REQUIRED", field: "project_description", op: "CONTAINS", val: "Victoria|Vancouver Island|Saanich|Oak Bay|Esquimalt|Langford|Colwood|Sooke|Sidney", sev: "WARNING", msg: "Project should serve Greater Victoria or Vancouver Island" },
      ...stdRules("Victoria", "Victoria|Vancouver Island"),
    ] as R[],
  },

  {
    name: "Vancity Community Foundation",
    shortName: "VCF",
    province: "BC" as const,
    website: "https://www.vancitycommunityfoundation.ca",
    description: "Supports Metro Vancouver nonprofits creating a just and thriving world — focusing on equity, climate justice, and reconciliation.",
    focusAreas: ["SOCIAL_SERVICES", "ENVIRONMENT", "INDIGENOUS", "HOUSING", "ECONOMIC_DEVELOPMENT"] as any[],
    fundingTypes: ["PROJECT", "CAPACITY_BUILDING"] as any[],
    minGrantAmount: 10000, maxGrantAmount: 100000, typicalGrantAmount: 30000,
    deadlineType: "ANNUAL" as const, deadlineMonth: 2,
    deadlineNotes: "Grants typically close in February. Check for thematic streams.",
    eligibleOrgTypes: ["NONPROFIT", "REGISTERED_CHARITY", "SOCIETY", "INDIGENOUS_ORGANIZATION"] as any[],
    sections: stdSections("Metro Vancouver"),
    rules: [
      { type: "CONTENT_REQUIRED", field: "project_description", op: "CONTAINS", val: "equity|justice|climate|reconciliation|Indigenous|BIPOC|systemic|barrier", sev: "WARNING", msg: "Emphasize equity, climate justice, or reconciliation in your project description" },
      ...stdRules("Metro Vancouver", "Vancouver|Metro Vancouver|Lower Mainland"),
    ] as R[],
  },

  {
    name: "McConnell Foundation (BC Programs)",
    shortName: "McConnell",
    province: "BC" as const,
    website: "https://mcconnellfoundation.ca",
    description: "A national foundation with strong BC investment, funding systems-change initiatives in social innovation, reconciliation, and a just transition to sustainability.",
    focusAreas: ["SOCIAL_SERVICES", "ENVIRONMENT", "INDIGENOUS", "ECONOMIC_DEVELOPMENT", "HEALTH"] as any[],
    fundingTypes: ["CAPACITY_BUILDING", "PROJECT"] as any[],
    minGrantAmount: 25000, maxGrantAmount: 500000, typicalGrantAmount: 100000,
    deadlineType: "BIANNUAL" as const,
    deadlineNotes: "McConnell uses a relationship-based, invitation model for larger grants. Smaller grants have open intakes.",
    eligibleOrgTypes: ["NONPROFIT", "REGISTERED_CHARITY", "SOCIETY", "INDIGENOUS_ORGANIZATION"] as any[],
    sections: stdSections("BC / Canada"),
    rules: [
      { type: "CONTENT_REQUIRED", field: "project_description", op: "CONTAINS", val: "systems change|innovation|social enterprise|reconciliation|sustainability|transition", sev: "WARNING", msg: "McConnell prioritizes systems-change, social innovation, and reconciliation" },
      ...stdRules("BC", "BC|British Columbia|Canadian"),
    ] as R[],
  },

  {
    name: "Coast Capital Community Foundation",
    shortName: "CCCF",
    province: "BC" as const,
    website: "https://www.coastcapitalsavings.com/about/community",
    description: "Coast Capital Savings Community Foundation invests in BC nonprofits improving financial well-being and community resilience across Metro Vancouver and BC.",
    focusAreas: ["SOCIAL_SERVICES", "EDUCATION", "YOUTH", "ECONOMIC_DEVELOPMENT"] as any[],
    fundingTypes: ["PROJECT", "CAPACITY_BUILDING"] as any[],
    minGrantAmount: 5000, maxGrantAmount: 50000, typicalGrantAmount: 15000,
    deadlineType: "ANNUAL" as const, deadlineMonth: 9,
    deadlineNotes: "Community grants typically open in summer and close September.",
    eligibleOrgTypes: ["NONPROFIT", "REGISTERED_CHARITY", "SOCIETY"] as any[],
    sections: stdSections("BC"),
    rules: stdRules("BC", "BC|British Columbia|Metro Vancouver"),
  },

  {
    name: "TELUS Friendly Future Foundation (BC)",
    shortName: "TELUS-BC",
    province: "BC" as const,
    website: "https://friendlyfuture.com",
    description: "TELUS Friendly Future Foundation funds BC nonprofits improving health and education outcomes for children, youth, and vulnerable communities.",
    focusAreas: ["HEALTH", "EDUCATION", "YOUTH", "SOCIAL_SERVICES"] as any[],
    fundingTypes: ["PROJECT"] as any[],
    minGrantAmount: 5000, maxGrantAmount: 100000, typicalGrantAmount: 20000,
    deadlineType: "ANNUAL" as const, deadlineMonth: 4,
    deadlineNotes: "Applications typically due in April. Online portal.",
    eligibleOrgTypes: ["NONPROFIT", "REGISTERED_CHARITY"] as any[],
    sections: stdSections("BC"),
    rules: [
      { type: "CONTENT_REQUIRED", field: "target_population", op: "CONTAINS", val: "youth|child|children|mental health|technology|digital|education|health", sev: "WARNING", msg: "TELUS prioritizes youth health, education, and digital inclusion" },
      ...stdRules("BC", "BC|British Columbia"),
    ] as R[],
  },

  // ═══════════════════════════════════════════════════════════
  // BC – MUNICIPAL & REGIONAL
  // ═══════════════════════════════════════════════════════════

  {
    name: "City of Vancouver Grants Program",
    shortName: "COV Grants",
    province: "BC" as const,
    website: "https://vancouver.ca/people-programs/grants.aspx",
    description: "City of Vancouver provides community grants including the Neighbourhood Matching Fund and sector-specific grants for arts, social services, heritage, and environment.",
    focusAreas: ["ARTS_CULTURE", "SOCIAL_SERVICES", "ENVIRONMENT", "INDIGENOUS", "SPORT_RECREATION"] as any[],
    fundingTypes: ["PROJECT", "OPERATING"] as any[],
    minGrantAmount: 2500, maxGrantAmount: 50000, typicalGrantAmount: 10000,
    deadlineType: "ANNUAL" as const, deadlineMonth: 2,
    deadlineNotes: "Most Vancouver grants open in January and close in February. Neighbourhood Matching Fund has two intakes.",
    eligibleOrgTypes: ["NONPROFIT", "REGISTERED_CHARITY", "SOCIETY", "INDIGENOUS_ORGANIZATION"] as any[],
    sections: stdSections("Vancouver"),
    rules: [
      { type: "CONTENT_REQUIRED", field: "project_description", op: "CONTAINS", val: "Vancouver|neighbourhood|community|resident|City of Vancouver", sev: "ERROR", msg: "Project must serve City of Vancouver residents" },
      ...stdRules("Vancouver", "Vancouver|neighbourhood|resident"),
    ] as R[],
  },

  {
    name: "City of Surrey Community Grants",
    shortName: "Surrey Grants",
    province: "BC" as const,
    website: "https://www.surrey.ca/community-recreation/funding-and-grants",
    description: "City of Surrey funds community organizations delivering social services, arts, sport, and recreation programs for Surrey residents.",
    focusAreas: ["SOCIAL_SERVICES", "ARTS_CULTURE", "SPORT_RECREATION", "YOUTH", "SENIORS"] as any[],
    fundingTypes: ["PROJECT", "OPERATING"] as any[],
    minGrantAmount: 2500, maxGrantAmount: 25000, typicalGrantAmount: 8000,
    deadlineType: "ANNUAL" as const, deadlineMonth: 2,
    deadlineNotes: "Applications typically close February.",
    eligibleOrgTypes: ["NONPROFIT", "REGISTERED_CHARITY", "SOCIETY"] as any[],
    sections: stdSections("Surrey"),
    rules: [
      { type: "CONTENT_REQUIRED", field: "project_description", op: "CONTAINS", val: "Surrey|Cloverdale|Newton|Whalley|South Surrey|Fleetwood", sev: "ERROR", msg: "Project must serve City of Surrey residents" },
      ...stdRules("Surrey", "Surrey"),
    ] as R[],
  },

  {
    name: "City of Burnaby Community Grants",
    shortName: "Burnaby Grants",
    province: "BC" as const,
    website: "https://www.burnaby.ca/City-Services/Permits-and-Licences/Grants-and-Funding.html",
    description: "City of Burnaby supports nonprofits providing social services, arts, sport, and community programs for Burnaby residents.",
    focusAreas: ["SOCIAL_SERVICES", "ARTS_CULTURE", "SPORT_RECREATION", "SENIORS", "YOUTH"] as any[],
    fundingTypes: ["PROJECT", "OPERATING"] as any[],
    minGrantAmount: 2000, maxGrantAmount: 20000, typicalGrantAmount: 7500,
    deadlineType: "ANNUAL" as const, deadlineMonth: 3,
    deadlineNotes: "Applications typically close March.",
    eligibleOrgTypes: ["NONPROFIT", "REGISTERED_CHARITY", "SOCIETY"] as any[],
    sections: stdSections("Burnaby"),
    rules: [
      { type: "CONTENT_REQUIRED", field: "project_description", op: "CONTAINS", val: "Burnaby|Metrotown|Brentwood|Deer Lake|Capitol Hill", sev: "ERROR", msg: "Project must serve Burnaby residents" },
      ...stdRules("Burnaby", "Burnaby"),
    ] as R[],
  },

  {
    name: "City of Victoria Community Grants",
    shortName: "Victoria Grants",
    province: "BC" as const,
    website: "https://www.victoria.ca/EN/main/residents/grants.html",
    description: "City of Victoria provides grants to nonprofits delivering services and programs that benefit Victoria residents.",
    focusAreas: ["ARTS_CULTURE", "SOCIAL_SERVICES", "ENVIRONMENT", "SPORT_RECREATION", "HEALTH"] as any[],
    fundingTypes: ["PROJECT", "OPERATING"] as any[],
    minGrantAmount: 2000, maxGrantAmount: 30000, typicalGrantAmount: 8000,
    deadlineType: "ANNUAL" as const, deadlineMonth: 4,
    deadlineNotes: "Applications accepted annually — typically spring intake.",
    eligibleOrgTypes: ["NONPROFIT", "REGISTERED_CHARITY", "SOCIETY"] as any[],
    sections: stdSections("Victoria"),
    rules: [
      { type: "CONTENT_REQUIRED", field: "project_description", op: "CONTAINS", val: "Victoria|James Bay|Fernwood|Hillside|Rock Bay|Fairfield|Downtown Victoria", sev: "ERROR", msg: "Project must serve City of Victoria residents" },
      ...stdRules("Victoria", "Victoria"),
    ] as R[],
  },

  // ═══════════════════════════════════════════════════════════
  // BC – COMMUNITY FOUNDATIONS
  // ═══════════════════════════════════════════════════════════

  {
    name: "SurreyCares Community Foundation",
    shortName: "SCCF",
    province: "BC" as const,
    website: "https://surreycares.com",
    description: "SurreyCares Community Foundation distributes community grants to nonprofits serving Surrey and the surrounding South Fraser area.",
    focusAreas: ["SOCIAL_SERVICES", "HEALTH", "ARTS_CULTURE", "EDUCATION", "ENVIRONMENT"] as any[],
    fundingTypes: ["PROJECT", "CAPACITY_BUILDING"] as any[],
    minGrantAmount: 2500, maxGrantAmount: 25000, typicalGrantAmount: 7500,
    deadlineType: "ANNUAL" as const, deadlineMonth: 3,
    eligibleOrgTypes: ["NONPROFIT", "REGISTERED_CHARITY", "SOCIETY"] as any[],
    sections: stdSections("Surrey / South Fraser"),
    rules: stdRules("Surrey", "Surrey|South Fraser|White Rock|Delta"),
  },

  {
    name: "Prince George Community Foundation",
    shortName: "PGCF",
    province: "BC" as const,
    website: "https://pgcf.ca",
    description: "Supports nonprofits in Prince George and the Central Interior of BC through community grant programs.",
    focusAreas: ["SOCIAL_SERVICES", "ARTS_CULTURE", "SPORT_RECREATION", "ENVIRONMENT", "HEALTH"] as any[],
    fundingTypes: ["PROJECT"] as any[],
    minGrantAmount: 2500, maxGrantAmount: 20000, typicalGrantAmount: 6000,
    deadlineType: "ANNUAL" as const, deadlineMonth: 6,
    eligibleOrgTypes: ["NONPROFIT", "REGISTERED_CHARITY", "SOCIETY", "INDIGENOUS_ORGANIZATION"] as any[],
    sections: stdSections("Prince George / Central Interior"),
    rules: stdRules("Prince George", "Prince George|Central Interior|Cariboo|Northern BC"),
  },

  {
    name: "Sunshine Coast Community Foundation",
    shortName: "SCCF2",
    province: "BC" as const,
    website: "https://www.sunshinecoastcf.ca",
    description: "Distributes community grants on the Sunshine Coast for social services, arts, environment, and recreation.",
    focusAreas: ["SOCIAL_SERVICES", "ARTS_CULTURE", "ENVIRONMENT", "SPORT_RECREATION"] as any[],
    fundingTypes: ["PROJECT"] as any[],
    minGrantAmount: 1000, maxGrantAmount: 10000, typicalGrantAmount: 4000,
    deadlineType: "ANNUAL" as const, deadlineMonth: 4,
    eligibleOrgTypes: ["NONPROFIT", "REGISTERED_CHARITY", "SOCIETY"] as any[],
    sections: stdSections("Sunshine Coast"),
    rules: stdRules("Sunshine Coast", "Sunshine Coast|Sechelt|Gibsons|Pender Harbour"),
  },

  {
    name: "Kootenay Community Foundation",
    shortName: "KCF",
    province: "BC" as const,
    website: "https://www.kootenaycf.ca",
    description: "Supports Kootenay-region nonprofits through annual community grants in social services, arts, environment, and health.",
    focusAreas: ["SOCIAL_SERVICES", "ARTS_CULTURE", "ENVIRONMENT", "HEALTH", "SPORT_RECREATION"] as any[],
    fundingTypes: ["PROJECT"] as any[],
    minGrantAmount: 2500, maxGrantAmount: 15000, typicalGrantAmount: 5000,
    deadlineType: "ANNUAL" as const, deadlineMonth: 9,
    eligibleOrgTypes: ["NONPROFIT", "REGISTERED_CHARITY", "SOCIETY", "INDIGENOUS_ORGANIZATION"] as any[],
    sections: stdSections("Kootenays"),
    rules: stdRules("Kootenays", "Kootenay|Nelson|Trail|Castlegar|Cranbrook|Kimberley|Creston"),
  },

  {
    name: "Okanagan Community Foundation",
    shortName: "OCF",
    province: "BC" as const,
    website: "https://www.okanaganfoundation.com",
    description: "Distributes grants to nonprofits across the Okanagan region in all community sectors.",
    focusAreas: ["SOCIAL_SERVICES", "ARTS_CULTURE", "ENVIRONMENT", "HEALTH", "EDUCATION"] as any[],
    fundingTypes: ["PROJECT", "CAPACITY_BUILDING"] as any[],
    minGrantAmount: 2500, maxGrantAmount: 20000, typicalGrantAmount: 7000,
    deadlineType: "ANNUAL" as const, deadlineMonth: 2,
    eligibleOrgTypes: ["NONPROFIT", "REGISTERED_CHARITY", "SOCIETY"] as any[],
    sections: stdSections("Okanagan"),
    rules: stdRules("Okanagan", "Okanagan|Kelowna|Penticton|Vernon|Summerland|Osoyoos"),
  },

  // ═══════════════════════════════════════════════════════════
  // BC – SECTOR-SPECIFIC
  // ═══════════════════════════════════════════════════════════

  {
    name: "BC Healthy Communities",
    shortName: "BCHC",
    province: "BC" as const,
    website: "https://bchealthycommunities.ca",
    description: "BC Healthy Communities funds projects that create healthy, resilient, and sustainable communities through built environment, food systems, and active living.",
    focusAreas: ["HEALTH", "ENVIRONMENT", "FOOD_SECURITY", "SPORT_RECREATION", "SOCIAL_SERVICES"] as any[],
    fundingTypes: ["PROJECT", "CAPACITY_BUILDING"] as any[],
    minGrantAmount: 5000, maxGrantAmount: 50000, typicalGrantAmount: 15000,
    deadlineType: "ROLLING" as const,
    deadlineNotes: "Applications accepted on a rolling basis. Contact BCHC for current priorities.",
    eligibleOrgTypes: ["NONPROFIT", "REGISTERED_CHARITY", "SOCIETY", "GOVERNMENT", "INDIGENOUS_ORGANIZATION"] as any[],
    sections: stdSections("BC"),
    rules: [
      { type: "CONTENT_REQUIRED", field: "project_description", op: "CONTAINS", val: "health|food|active|built environment|sustainable|community|resilient", sev: "WARNING", msg: "Emphasize healthy communities, active living, or food systems" },
      ...stdRules("BC", "BC|British Columbia"),
    ] as R[],
  },

  {
    name: "Food Banks BC",
    shortName: "FBBC",
    province: "BC" as const,
    website: "https://www.foodbanksbc.com",
    description: "Food Banks BC provides capacity grants and program funding to member food banks and food security organizations across British Columbia.",
    focusAreas: ["FOOD_SECURITY", "SOCIAL_SERVICES", "HEALTH"] as any[],
    fundingTypes: ["OPERATING", "CAPACITY_BUILDING"] as any[],
    minGrantAmount: 2500, maxGrantAmount: 25000, typicalGrantAmount: 8000,
    deadlineType: "ROLLING" as const,
    deadlineNotes: "Rolling intake for member organizations. Must be a registered food bank or food security program.",
    eligibleOrgTypes: ["NONPROFIT", "REGISTERED_CHARITY", "SOCIETY"] as any[],
    sections: stdSections("BC"),
    rules: [
      { type: "CONTENT_REQUIRED", field: "project_description", op: "CONTAINS", val: "food|hunger|food bank|food security|hamper|meal|nutrition|pantry", sev: "ERROR", msg: "Project must address food security or hunger relief" },
      ...stdRules("BC", "BC|British Columbia"),
    ] as R[],
  },

  {
    name: "BC Hydro Community Giving Program",
    shortName: "BCH Community",
    province: "BC" as const,
    website: "https://www.bchydro.com/community.html",
    description: "BC Hydro Community Giving supports nonprofits in BC Hydro service communities addressing environment, safety, and community development.",
    focusAreas: ["ENVIRONMENT", "SOCIAL_SERVICES", "SPORT_RECREATION", "EDUCATION"] as any[],
    fundingTypes: ["PROJECT"] as any[],
    minGrantAmount: 2500, maxGrantAmount: 20000, typicalGrantAmount: 7500,
    deadlineType: "ANNUAL" as const, deadlineMonth: 6,
    deadlineNotes: "Community grants typically open spring and close in June.",
    eligibleOrgTypes: ["NONPROFIT", "REGISTERED_CHARITY", "SOCIETY"] as any[],
    sections: stdSections("BC Hydro service area"),
    rules: stdRules("BC", "BC|British Columbia"),
  },

  // ═══════════════════════════════════════════════════════════
  // AB – EXISTING
  // ═══════════════════════════════════════════════════════════

  {
    name: "Alberta Foundation for the Arts",
    shortName: "AFA",
    province: "AB" as const,
    website: "https://www.affta.ab.ca",
    description: "The provincial funding agency supporting Alberta's arts and cultural sector through operating, project, and individual artist grants.",
    focusAreas: ["ARTS_CULTURE"] as any[],
    fundingTypes: ["PROJECT", "OPERATING"] as any[],
    minGrantAmount: 2000, maxGrantAmount: 75000, typicalGrantAmount: 15000,
    deadlineType: "ANNUAL" as const, deadlineMonth: 2,
    deadlineNotes: "Annual intake typically closes in February.",
    eligibleOrgTypes: ["NONPROFIT", "REGISTERED_CHARITY", "SOCIETY"] as any[],
    sections: artsSections("Alberta"),
    rules: [
      { type: "REQUIRED_SECTION", field: "artistic_merit", op: "NOT_EMPTY", val: "true", sev: "ERROR", msg: "Artistic Merit is required for AFA applications" },
      { type: "CONTENT_REQUIRED", field: "community_reach", op: "CONTAINS", val: "Alberta|AB|Edmonton|Calgary|Albertan", sev: "WARNING", msg: "Emphasize Alberta-specific impact and community benefits" },
    ] as R[],
  },

  {
    name: "United Way Alberta Capital Region",
    shortName: "UWACR",
    province: "AB" as const,
    website: "https://www.youcan.ca",
    description: "Invests in programs reducing poverty and building strong communities across Edmonton and the surrounding region.",
    focusAreas: ["SOCIAL_SERVICES", "HEALTH", "EDUCATION", "YOUTH", "SENIORS", "HOUSING", "FOOD_SECURITY"] as any[],
    fundingTypes: ["PROJECT", "OPERATING"] as any[],
    minGrantAmount: 15000, maxGrantAmount: 100000, typicalGrantAmount: 35000,
    deadlineType: "ANNUAL" as const, deadlineMonth: 4,
    deadlineNotes: "Grant cycle typically opens January and closes April.",
    eligibleOrgTypes: ["NONPROFIT", "REGISTERED_CHARITY", "SOCIETY"] as any[],
    sections: stdSections("Edmonton / Capital Region"),
    rules: stdRules("Edmonton", "Edmonton|Capital Region|Alberta|AB"),
  },

  {
    name: "The Rozsa Foundation",
    shortName: "Rozsa",
    province: "AB" as const,
    website: "https://rozsafoundation.com",
    description: "Supports arts management and cultural leadership in Calgary and Alberta through capacity-building grants.",
    focusAreas: ["ARTS_CULTURE", "ECONOMIC_DEVELOPMENT"] as any[],
    fundingTypes: ["CAPACITY_BUILDING", "PROJECT"] as any[],
    minGrantAmount: 3000, maxGrantAmount: 30000, typicalGrantAmount: 10000,
    deadlineType: "ROLLING" as const,
    deadlineNotes: "Rolling intake — applications reviewed bi-monthly.",
    eligibleOrgTypes: ["NONPROFIT", "REGISTERED_CHARITY", "SOCIETY"] as any[],
    sections: stdSections("Calgary / Alberta"),
    rules: [
      { type: "CONTENT_REQUIRED", field: "project_description", op: "CONTAINS", val: "management|leadership|capacity|governance|training|development|Calgary", sev: "WARNING", msg: "Emphasize arts management and organizational development" },
      { type: "BUDGET_LIMIT", field: "requestedAmount", op: "LESS_THAN", val: "30000", sev: "ERROR", msg: "Rozsa Foundation grants do not exceed $30,000" },
    ] as R[],
  },

  {
    name: "Edmonton Community Foundation",
    shortName: "ECF",
    province: "AB" as const,
    website: "https://www.ecfoundation.org",
    description: "Major community foundation supporting nonprofits across Edmonton and northern Alberta in all community sectors.",
    focusAreas: ["ARTS_CULTURE", "ENVIRONMENT", "HEALTH", "SOCIAL_SERVICES", "EDUCATION", "YOUTH", "SENIORS"] as any[],
    fundingTypes: ["PROJECT", "CAPACITY_BUILDING"] as any[],
    minGrantAmount: 5000, maxGrantAmount: 100000, typicalGrantAmount: 25000,
    deadlineType: "ANNUAL" as const, deadlineMonth: 5,
    deadlineNotes: "Community Grants Program typically closes in May.",
    eligibleOrgTypes: ["NONPROFIT", "REGISTERED_CHARITY", "SOCIETY", "INDIGENOUS_ORGANIZATION"] as any[],
    sections: stdSections("Edmonton / Northern Alberta"),
    rules: stdRules("Edmonton", "Edmonton|northern Alberta|AB"),
  },

  {
    name: "Calgary Foundation",
    shortName: "CF",
    province: "AB" as const,
    website: "https://www.calgaryfoundation.org",
    description: "One of Canada's largest community foundations, supporting nonprofits in Calgary and southern Alberta across all sectors.",
    focusAreas: ["ARTS_CULTURE", "ENVIRONMENT", "HEALTH", "SOCIAL_SERVICES", "HOUSING", "EDUCATION", "INDIGENOUS"] as any[],
    fundingTypes: ["PROJECT", "OPERATING", "CAPACITY_BUILDING"] as any[],
    minGrantAmount: 10000, maxGrantAmount: 200000, typicalGrantAmount: 40000,
    deadlineType: "ANNUAL" as const, deadlineMonth: 9,
    deadlineNotes: "Community Grants typically close in September.",
    eligibleOrgTypes: ["NONPROFIT", "REGISTERED_CHARITY", "SOCIETY", "INDIGENOUS_ORGANIZATION"] as any[],
    sections: stdSections("Calgary / Southern Alberta"),
    rules: [
      { type: "CONTENT_REQUIRED", field: "project_description", op: "CONTAINS", val: "equity|diversity|inclusion|Indigenous|accessible|barrier", sev: "WARNING", msg: "Include equity and inclusion language — Calgary Foundation requires an EDI section" },
      ...stdRules("Calgary", "Calgary|southern Alberta|Calgarian|AB"),
    ] as R[],
  },

  // ═══════════════════════════════════════════════════════════
  // AB – PROVINCIAL GOVERNMENT
  // ═══════════════════════════════════════════════════════════

  {
    name: "Community Facility Enhancement Program (CFEP)",
    shortName: "CFEP",
    province: "AB" as const,
    website: "https://www.alberta.ca/community-facility-enhancement-program.aspx",
    description: "CFEP provides capital grants to Alberta nonprofits to build, renovate, or buy community facilities — including small grants (up to $125K) and large grants (over $125K).",
    focusAreas: ["ARTS_CULTURE", "SPORT_RECREATION", "SOCIAL_SERVICES", "EDUCATION"] as any[],
    fundingTypes: ["CAPITAL"] as any[],
    minGrantAmount: 3000, maxGrantAmount: 1500000, typicalGrantAmount: 75000,
    deadlineType: "BIANNUAL" as const,
    deadlineNotes: "Two intakes per year — spring and fall. Check Alberta Government website for exact dates.",
    eligibleOrgTypes: ["NONPROFIT", "REGISTERED_CHARITY", "SOCIETY", "INDIGENOUS_ORGANIZATION", "GOVERNMENT"] as any[],
    sections: [
      { key: "project_description", label: "Facility Project Description", desc: "Describe the facility, the proposed construction/renovation/purchase, and its location in Alberta.", required: true, min: 300, max: 600, order: 0 },
      { key: "community_need", label: "Community Need", desc: "Explain the need for this facility in your Alberta community. Include usage data and current limitations.", required: true, min: 200, max: 450, order: 1 },
      { key: "community_usage", label: "Community Usage & Benefit", desc: "Describe who will use this facility. State expected annual users and how the facility serves the community.", required: true, min: 150, max: 350, order: 2 },
      { key: "project_viability", label: "Project Viability & Sustainability", desc: "Demonstrate your organization's ability to complete and sustain this facility long-term.", required: true, min: 150, max: 350, order: 3 },
      { key: "budget_narrative", label: "Budget Narrative", desc: "Provide a complete capital budget. List municipal, provincial, and other confirmed funding.", required: true, min: 150, max: 400, order: 4 },
    ] as S[],
    rules: [
      { type: "CONTENT_REQUIRED", field: "project_description", op: "CONTAINS", val: "construction|renovation|renovation|facility|building|purchase|capital|infrastructure", sev: "ERROR", msg: "CFEP funds capital projects — construction, renovation, or purchase of facilities" },
      { type: "CONTENT_REQUIRED", field: "community_usage", op: "CONTAINS", val: "user|visitor|participant|resident|Albertan", sev: "WARNING", msg: "State the number of Albertans who will use this facility annually" },
    ] as R[],
  },

  {
    name: "Community Initiatives Program (CIP)",
    shortName: "CIP-AB",
    province: "AB" as const,
    website: "https://www.alberta.ca/community-initiatives-program.aspx",
    description: "CIP provides Alberta nonprofits with project and operating grants to deliver community, cultural, arts, sport, and recreation programs across the province.",
    focusAreas: ["ARTS_CULTURE", "SPORT_RECREATION", "SOCIAL_SERVICES", "ENVIRONMENT", "HEALTH", "EDUCATION"] as any[],
    fundingTypes: ["PROJECT", "OPERATING"] as any[],
    minGrantAmount: 1000, maxGrantAmount: 75000, typicalGrantAmount: 15000,
    deadlineType: "ANNUAL" as const, deadlineMonth: 11,
    deadlineNotes: "Applications for the following fiscal year typically close in November.",
    eligibleOrgTypes: ["NONPROFIT", "REGISTERED_CHARITY", "SOCIETY", "INDIGENOUS_ORGANIZATION"] as any[],
    sections: stdSections("Alberta"),
    rules: stdRules("Alberta", "Alberta|AB|Albertan"),
  },

  {
    name: "Other Initiatives Program (OIP)",
    shortName: "OIP-AB",
    province: "AB" as const,
    website: "https://www.alberta.ca/other-initiatives-program.aspx",
    description: "OIP funds larger Alberta projects (over $75,000) that do not fit CIP, including major arts, cultural, and community development initiatives.",
    focusAreas: ["ARTS_CULTURE", "SPORT_RECREATION", "SOCIAL_SERVICES", "ECONOMIC_DEVELOPMENT"] as any[],
    fundingTypes: ["PROJECT", "CAPITAL"] as any[],
    minGrantAmount: 75000, maxGrantAmount: 500000, typicalGrantAmount: 150000,
    deadlineType: "ANNUAL" as const, deadlineMonth: 11,
    deadlineNotes: "Same intake cycle as CIP — typically November deadline.",
    eligibleOrgTypes: ["NONPROFIT", "REGISTERED_CHARITY", "SOCIETY", "INDIGENOUS_ORGANIZATION", "GOVERNMENT"] as any[],
    sections: stdSections("Alberta"),
    rules: [
      { type: "BUDGET_LIMIT", field: "requestedAmount", op: "GREATER_THAN", val: "74999", sev: "WARNING", msg: "OIP is for projects over $75,000. Use CIP for smaller amounts." },
      ...stdRules("Alberta", "Alberta|AB"),
    ] as R[],
  },

  {
    name: "Cultural Heritage Initiatives Program",
    shortName: "CHIP-AB",
    province: "AB" as const,
    website: "https://www.alberta.ca/cultural-heritage-initiatives-program.aspx",
    description: "Funds Alberta nonprofits and municipalities to restore, preserve, and celebrate Alberta's historical and cultural heritage assets.",
    focusAreas: ["ARTS_CULTURE", "INDIGENOUS", "EDUCATION"] as any[],
    fundingTypes: ["PROJECT", "CAPITAL"] as any[],
    minGrantAmount: 5000, maxGrantAmount: 150000, typicalGrantAmount: 30000,
    deadlineType: "ANNUAL" as const, deadlineMonth: 3,
    deadlineNotes: "Applications typically close in March.",
    eligibleOrgTypes: ["NONPROFIT", "REGISTERED_CHARITY", "SOCIETY", "INDIGENOUS_ORGANIZATION", "GOVERNMENT"] as any[],
    sections: stdSections("Alberta"),
    rules: [
      { type: "CONTENT_REQUIRED", field: "project_description", op: "CONTAINS", val: "heritage|historic|cultural|restoration|preservation|archive|tradition|Indigenous culture", sev: "ERROR", msg: "Project must address cultural heritage preservation or restoration" },
      ...stdRules("Alberta", "Alberta|AB"),
    ] as R[],
  },

  {
    name: "Alberta Gaming, Liquor & Cannabis Community Grants",
    shortName: "AGLC Grants",
    province: "AB" as const,
    website: "https://aglc.ca/charitable-gaming/charitable-gaming-overview",
    description: "AGLC distributes charitable gaming proceeds to Alberta nonprofits through bingo and casino licensing programs across multiple categories.",
    focusAreas: ["ARTS_CULTURE", "SPORT_RECREATION", "SOCIAL_SERVICES", "HEALTH", "EDUCATION"] as any[],
    fundingTypes: ["OPERATING", "PROJECT"] as any[],
    minGrantAmount: 1000, maxGrantAmount: 200000, typicalGrantAmount: 25000,
    deadlineType: "ROLLING" as const,
    deadlineNotes: "Charitable gaming licensing is an ongoing process. Contact AGLC for eligibility.",
    eligibleOrgTypes: ["NONPROFIT", "REGISTERED_CHARITY", "SOCIETY"] as any[],
    sections: stdSections("Alberta"),
    rules: stdRules("Alberta", "Alberta|AB|Albertan"),
  },

  {
    name: "Alberta Indigenous Relations Grants",
    shortName: "AIR Grants",
    province: "AB" as const,
    website: "https://www.alberta.ca/indigenous-relations.aspx",
    description: "Government of Alberta grants supporting Indigenous communities, organizations, and reconciliation initiatives across Alberta.",
    focusAreas: ["INDIGENOUS", "SOCIAL_SERVICES", "EDUCATION", "ECONOMIC_DEVELOPMENT", "HEALTH"] as any[],
    fundingTypes: ["PROJECT", "CAPACITY_BUILDING"] as any[],
    minGrantAmount: 10000, maxGrantAmount: 300000, typicalGrantAmount: 50000,
    deadlineType: "ROLLING" as const,
    deadlineNotes: "Multiple programs with rolling or annual intakes. Contact Alberta Indigenous Relations.",
    eligibleOrgTypes: ["INDIGENOUS_ORGANIZATION", "NONPROFIT", "SOCIETY"] as any[],
    sections: indigenousSections("Alberta"),
    rules: [
      { type: "ORG_ELIGIBILITY", field: "registrationType", op: "IS_ONE_OF", val: "INDIGENOUS_ORGANIZATION,NONPROFIT,SOCIETY", sev: "ERROR", msg: "Must be an Indigenous organization or serve Indigenous Albertans" },
      { type: "REQUIRED_SECTION", field: "self_determination", op: "NOT_EMPTY", val: "true", sev: "ERROR", msg: "Self-determination section is required" },
    ] as R[],
  },

  {
    name: "Alberta Municipal Affairs Community Grants",
    shortName: "AMA Grants",
    province: "AB" as const,
    website: "https://www.alberta.ca/municipal-affairs.aspx",
    description: "Alberta Municipal Affairs provides capacity-building and community development grants to municipalities and nonprofits strengthening local governance and communities.",
    focusAreas: ["SOCIAL_SERVICES", "ECONOMIC_DEVELOPMENT", "SPORT_RECREATION", "ARTS_CULTURE"] as any[],
    fundingTypes: ["PROJECT", "CAPACITY_BUILDING"] as any[],
    minGrantAmount: 5000, maxGrantAmount: 100000, typicalGrantAmount: 25000,
    deadlineType: "ANNUAL" as const, deadlineMonth: 4,
    deadlineNotes: "Grant programs vary. Check Alberta Municipal Affairs website for current opportunities.",
    eligibleOrgTypes: ["NONPROFIT", "REGISTERED_CHARITY", "SOCIETY", "GOVERNMENT"] as any[],
    sections: stdSections("Alberta"),
    rules: stdRules("Alberta", "Alberta|AB|municipality|municipal"),
  },

  // ═══════════════════════════════════════════════════════════
  // AB – FEDERAL FUNDERS
  // ═══════════════════════════════════════════════════════════

  {
    name: "Canada Council for the Arts (AB)",
    shortName: "CCA-AB",
    province: "AB" as const,
    website: "https://canadacouncil.ca",
    description: "The federal arts funding body supporting Canadian artistic excellence. Alberta arts organizations and artists are eligible for all CCA grant programs.",
    focusAreas: ["ARTS_CULTURE"] as any[],
    fundingTypes: ["PROJECT", "OPERATING", "CAPACITY_BUILDING"] as any[],
    minGrantAmount: 5000, maxGrantAmount: 500000, typicalGrantAmount: 40000,
    deadlineType: "BIANNUAL" as const,
    deadlineNotes: "Spring (February/March) and fall (October) intakes for most programs.",
    eligibleOrgTypes: ["NONPROFIT", "REGISTERED_CHARITY", "SOCIETY", "INDIGENOUS_ORGANIZATION"] as any[],
    sections: artsSections("Canada / Alberta"),
    rules: [
      { type: "REQUIRED_SECTION", field: "artistic_merit", op: "NOT_EMPTY", val: "true", sev: "ERROR", msg: "Artistic Merit is required for Canada Council applications" },
      { type: "CONTENT_REQUIRED", field: "community_reach", op: "CONTAINS", val: "Canadian|Canada|Alberta|national|audience", sev: "WARNING", msg: "Reference Canadian audiences or national/Alberta significance" },
    ] as R[],
  },

  {
    name: "ESDC Community Programs (AB)",
    shortName: "ESDC-AB",
    province: "AB" as const,
    website: "https://www.canada.ca/en/employment-social-development.html",
    description: "Employment and Social Development Canada funds Alberta nonprofits delivering employment, skills, and social inclusion programs.",
    focusAreas: ["SOCIAL_SERVICES", "ECONOMIC_DEVELOPMENT", "YOUTH", "SENIORS", "DISABILITY", "IMMIGRATION"] as any[],
    fundingTypes: ["PROJECT", "OPERATING"] as any[],
    minGrantAmount: 10000, maxGrantAmount: 500000, typicalGrantAmount: 75000,
    deadlineType: "ROLLING" as const,
    deadlineNotes: "Multiple ESDC programs with varying intakes. Check canada.ca.",
    eligibleOrgTypes: ["NONPROFIT", "REGISTERED_CHARITY", "SOCIETY", "INDIGENOUS_ORGANIZATION"] as any[],
    sections: stdSections("Alberta"),
    rules: stdRules("Alberta communities", "Alberta|AB|Canadian"),
  },

  {
    name: "Indigenous Services Canada (AB)",
    shortName: "ISC-AB",
    province: "AB" as const,
    website: "https://www.canada.ca/en/indigenous-services-canada.html",
    description: "Federal funding for Indigenous communities and organizations in Alberta for health, education, housing, and community well-being.",
    focusAreas: ["INDIGENOUS", "HEALTH", "EDUCATION", "HOUSING", "SOCIAL_SERVICES"] as any[],
    fundingTypes: ["PROJECT", "OPERATING", "CAPITAL"] as any[],
    minGrantAmount: 10000, maxGrantAmount: 2000000, typicalGrantAmount: 100000,
    deadlineType: "ROLLING" as const,
    deadlineNotes: "Multiple programs with varying intakes. Contact ISC Alberta regional office.",
    eligibleOrgTypes: ["INDIGENOUS_ORGANIZATION", "NONPROFIT"] as any[],
    sections: indigenousSections("Alberta"),
    rules: [
      { type: "ORG_ELIGIBILITY", field: "registrationType", op: "IS_ONE_OF", val: "INDIGENOUS_ORGANIZATION,NONPROFIT", sev: "ERROR", msg: "ISC funding is for First Nations, Métis, and Inuit organizations" },
    ] as R[],
  },

  {
    name: "CMHC National Housing Strategy (AB)",
    shortName: "CMHC-AB",
    province: "AB" as const,
    website: "https://www.cmhc-schl.gc.ca",
    description: "Canada Mortgage and Housing Corporation funds affordable and community housing projects in Alberta through the National Housing Strategy.",
    focusAreas: ["HOUSING", "SOCIAL_SERVICES", "INDIGENOUS"] as any[],
    fundingTypes: ["CAPITAL", "OPERATING"] as any[],
    minGrantAmount: 100000, maxGrantAmount: 10000000, typicalGrantAmount: 1000000,
    deadlineType: "ROLLING" as const,
    deadlineNotes: "NHS programs accept applications on a rolling basis. Contact CMHC Alberta region.",
    eligibleOrgTypes: ["NONPROFIT", "REGISTERED_CHARITY", "SOCIETY", "INDIGENOUS_ORGANIZATION"] as any[],
    sections: housingSections("Alberta"),
    rules: [
      { type: "CONTENT_REQUIRED", field: "project_description", op: "CONTAINS", val: "affordable|units|housing|shelter|beds|rental|supportive", sev: "ERROR", msg: "Must describe affordable or community housing units" },
    ] as R[],
  },

  {
    name: "Prairies Economic Development Canada",
    shortName: "PrairiesCan",
    province: "AB" as const,
    website: "https://www.canada.ca/en/prairies-economic-development.html",
    description: "Federal agency investing in Alberta's economy — innovation, diversification, clean energy, and community economic development.",
    focusAreas: ["ECONOMIC_DEVELOPMENT", "INDIGENOUS", "ENVIRONMENT"] as any[],
    fundingTypes: ["PROJECT", "CAPITAL", "CAPACITY_BUILDING"] as any[],
    minGrantAmount: 50000, maxGrantAmount: 5000000, typicalGrantAmount: 200000,
    deadlineType: "ROLLING" as const,
    deadlineNotes: "Most programs are intake-driven. Watch PrairiesCan website for calls for proposals.",
    eligibleOrgTypes: ["NONPROFIT", "REGISTERED_CHARITY", "SOCIETY", "INDIGENOUS_ORGANIZATION", "COOPERATIVE"] as any[],
    sections: stdSections("Alberta"),
    rules: [
      { type: "CONTENT_REQUIRED", field: "project_description", op: "CONTAINS", val: "economic|employment|business|innovation|diversification|clean|community economic|rural", sev: "ERROR", msg: "Project must address economic development in Alberta" },
      ...stdRules("Alberta", "Alberta|AB"),
    ] as R[],
  },

  {
    name: "Canadian Heritage (AB Programs)",
    shortName: "PCH-AB",
    province: "AB" as const,
    website: "https://www.canada.ca/en/canadian-heritage.html",
    description: "Canadian Heritage funds Alberta arts, culture, sports, and multiculturalism organizations through federal programs.",
    focusAreas: ["ARTS_CULTURE", "SPORT_RECREATION", "IMMIGRATION", "INDIGENOUS"] as any[],
    fundingTypes: ["PROJECT", "OPERATING"] as any[],
    minGrantAmount: 5000, maxGrantAmount: 200000, typicalGrantAmount: 30000,
    deadlineType: "ANNUAL" as const, deadlineMonth: 2,
    deadlineNotes: "Various program deadlines — typically fall/spring. Check pch.gc.ca.",
    eligibleOrgTypes: ["NONPROFIT", "REGISTERED_CHARITY", "SOCIETY", "INDIGENOUS_ORGANIZATION"] as any[],
    sections: stdSections("Alberta / Canada"),
    rules: stdRules("Alberta communities", "Alberta|AB|Canadian|Canada"),
  },

  // ═══════════════════════════════════════════════════════════
  // AB – MAJOR FOUNDATIONS
  // ═══════════════════════════════════════════════════════════

  {
    name: "Alberta Law Foundation",
    shortName: "ALF",
    province: "AB" as const,
    website: "https://www.albertalawfoundation.org",
    description: "Funds legal education, legal aid, law reform, and access to justice initiatives across Alberta.",
    focusAreas: ["SOCIAL_SERVICES", "EDUCATION", "INDIGENOUS", "IMMIGRATION"] as any[],
    fundingTypes: ["PROJECT", "OPERATING", "CAPACITY_BUILDING"] as any[],
    minGrantAmount: 10000, maxGrantAmount: 500000, typicalGrantAmount: 60000,
    deadlineType: "ANNUAL" as const, deadlineMonth: 10,
    deadlineNotes: "Main grant intake typically closes in October.",
    eligibleOrgTypes: ["NONPROFIT", "REGISTERED_CHARITY", "SOCIETY", "INDIGENOUS_ORGANIZATION"] as any[],
    sections: stdSections("Alberta"),
    rules: [
      { type: "CONTENT_REQUIRED", field: "project_description", op: "CONTAINS", val: "legal|justice|access|law|rights|court|tribunal|advocacy|legal aid", sev: "ERROR", msg: "Project must address legal aid, access to justice, or legal education" },
      ...stdRules("Alberta", "Alberta|AB"),
    ] as R[],
  },

  {
    name: "Suncor Energy Foundation",
    shortName: "Suncor Fdn",
    province: "AB" as const,
    website: "https://sustainability.suncor.com/communities",
    description: "Suncor Energy Foundation invests in communities where Suncor operates in Alberta, focusing on environmental stewardship, Indigenous communities, and education.",
    focusAreas: ["ENVIRONMENT", "INDIGENOUS", "EDUCATION", "ECONOMIC_DEVELOPMENT"] as any[],
    fundingTypes: ["PROJECT", "CAPACITY_BUILDING"] as any[],
    minGrantAmount: 10000, maxGrantAmount: 250000, typicalGrantAmount: 50000,
    deadlineType: "ANNUAL" as const, deadlineMonth: 3,
    deadlineNotes: "Community investment applications typically close in March.",
    eligibleOrgTypes: ["NONPROFIT", "REGISTERED_CHARITY", "SOCIETY", "INDIGENOUS_ORGANIZATION"] as any[],
    sections: stdSections("Alberta"),
    rules: [
      { type: "CONTENT_REQUIRED", field: "project_description", op: "CONTAINS", val: "environment|Indigenous|education|energy|sustainability|Alberta|Wood Buffalo|Fort McMurray", sev: "WARNING", msg: "Suncor prioritizes environment, Indigenous communities, and education in Alberta operations areas" },
      ...stdRules("Alberta", "Alberta|AB"),
    ] as R[],
  },

  {
    name: "ATCO Foundation",
    shortName: "ATCO",
    province: "AB" as const,
    website: "https://www.atco.com/community",
    description: "ATCO Foundation supports Alberta nonprofits in community service, education, Indigenous partnerships, and emergency preparedness.",
    focusAreas: ["SOCIAL_SERVICES", "EDUCATION", "INDIGENOUS", "HEALTH"] as any[],
    fundingTypes: ["PROJECT"] as any[],
    minGrantAmount: 5000, maxGrantAmount: 50000, typicalGrantAmount: 15000,
    deadlineType: "ANNUAL" as const, deadlineMonth: 6,
    deadlineNotes: "Community grants typically close in June.",
    eligibleOrgTypes: ["NONPROFIT", "REGISTERED_CHARITY", "SOCIETY", "INDIGENOUS_ORGANIZATION"] as any[],
    sections: stdSections("Alberta"),
    rules: stdRules("Alberta", "Alberta|AB"),
  },

  {
    name: "TELUS Friendly Future Foundation (AB)",
    shortName: "TELUS-AB",
    province: "AB" as const,
    website: "https://friendlyfuture.com",
    description: "TELUS Friendly Future Foundation funds Alberta nonprofits improving health and education outcomes for children, youth, and vulnerable communities.",
    focusAreas: ["HEALTH", "EDUCATION", "YOUTH", "SOCIAL_SERVICES"] as any[],
    fundingTypes: ["PROJECT"] as any[],
    minGrantAmount: 5000, maxGrantAmount: 100000, typicalGrantAmount: 20000,
    deadlineType: "ANNUAL" as const, deadlineMonth: 4,
    deadlineNotes: "Applications typically due April. Online portal.",
    eligibleOrgTypes: ["NONPROFIT", "REGISTERED_CHARITY"] as any[],
    sections: stdSections("Alberta"),
    rules: stdRules("Alberta", "Alberta|AB"),
  },

  {
    name: "Shell Canada Foundation",
    shortName: "Shell Fdn",
    province: "AB" as const,
    website: "https://www.shell.ca/community",
    description: "Shell Canada invests in Alberta communities near its operations, supporting education, environment, and Indigenous partnerships.",
    focusAreas: ["EDUCATION", "ENVIRONMENT", "INDIGENOUS", "ECONOMIC_DEVELOPMENT"] as any[],
    fundingTypes: ["PROJECT"] as any[],
    minGrantAmount: 5000, maxGrantAmount: 100000, typicalGrantAmount: 25000,
    deadlineType: "ANNUAL" as const, deadlineMonth: 9,
    deadlineNotes: "Community investment typically reviewed in fall.",
    eligibleOrgTypes: ["NONPROFIT", "REGISTERED_CHARITY", "SOCIETY", "INDIGENOUS_ORGANIZATION"] as any[],
    sections: stdSections("Alberta"),
    rules: stdRules("Alberta", "Alberta|AB"),
  },

  {
    name: "Enbridge Community Investment",
    shortName: "Enbridge",
    province: "AB" as const,
    website: "https://www.enbridge.com/community",
    description: "Enbridge Community Investment supports Alberta nonprofits in environmental, Indigenous, safety, and community development programs.",
    focusAreas: ["ENVIRONMENT", "INDIGENOUS", "SOCIAL_SERVICES", "ECONOMIC_DEVELOPMENT"] as any[],
    fundingTypes: ["PROJECT"] as any[],
    minGrantAmount: 5000, maxGrantAmount: 75000, typicalGrantAmount: 20000,
    deadlineType: "ANNUAL" as const, deadlineMonth: 4,
    deadlineNotes: "Community investment applications typically due in spring.",
    eligibleOrgTypes: ["NONPROFIT", "REGISTERED_CHARITY", "SOCIETY", "INDIGENOUS_ORGANIZATION"] as any[],
    sections: stdSections("Alberta"),
    rules: stdRules("Alberta", "Alberta|AB"),
  },

  {
    name: "Imperial Oil Community Fund",
    shortName: "Imperial",
    province: "AB" as const,
    website: "https://www.imperialoil.ca/community",
    description: "Imperial Oil supports Alberta communities through grants focused on education, environment, and Indigenous community development.",
    focusAreas: ["EDUCATION", "ENVIRONMENT", "INDIGENOUS"] as any[],
    fundingTypes: ["PROJECT"] as any[],
    minGrantAmount: 5000, maxGrantAmount: 75000, typicalGrantAmount: 20000,
    deadlineType: "ANNUAL" as const, deadlineMonth: 6,
    deadlineNotes: "Community fund applications reviewed annually.",
    eligibleOrgTypes: ["NONPROFIT", "REGISTERED_CHARITY", "SOCIETY", "INDIGENOUS_ORGANIZATION"] as any[],
    sections: stdSections("Alberta"),
    rules: stdRules("Alberta", "Alberta|AB"),
  },

  {
    name: "Servus Credit Union Community Fund",
    shortName: "Servus",
    province: "AB" as const,
    website: "https://www.servus.ca/community",
    description: "Servus Credit Union supports Alberta nonprofits through community grants in social services, arts, sport, and education.",
    focusAreas: ["SOCIAL_SERVICES", "ARTS_CULTURE", "SPORT_RECREATION", "EDUCATION", "YOUTH"] as any[],
    fundingTypes: ["PROJECT"] as any[],
    minGrantAmount: 2500, maxGrantAmount: 25000, typicalGrantAmount: 8000,
    deadlineType: "ANNUAL" as const, deadlineMonth: 3,
    deadlineNotes: "Community grants typically close in March.",
    eligibleOrgTypes: ["NONPROFIT", "REGISTERED_CHARITY", "SOCIETY"] as any[],
    sections: stdSections("Alberta"),
    rules: stdRules("Alberta", "Alberta|AB"),
  },

  // ═══════════════════════════════════════════════════════════
  // AB – MUNICIPAL
  // ═══════════════════════════════════════════════════════════

  {
    name: "City of Calgary Community Investment Program",
    shortName: "Calgary CIP",
    province: "AB" as const,
    website: "https://www.calgary.ca/csps/cns/funding.html",
    description: "City of Calgary funds nonprofits delivering arts, culture, social services, and community programs for Calgary residents through the Community Investment Program.",
    focusAreas: ["ARTS_CULTURE", "SOCIAL_SERVICES", "SPORT_RECREATION", "INDIGENOUS", "HEALTH"] as any[],
    fundingTypes: ["OPERATING", "PROJECT"] as any[],
    minGrantAmount: 5000, maxGrantAmount: 100000, typicalGrantAmount: 20000,
    deadlineType: "ANNUAL" as const, deadlineMonth: 10,
    deadlineNotes: "Applications typically close October for the following year's funding.",
    eligibleOrgTypes: ["NONPROFIT", "REGISTERED_CHARITY", "SOCIETY", "INDIGENOUS_ORGANIZATION"] as any[],
    sections: stdSections("Calgary"),
    rules: [
      { type: "CONTENT_REQUIRED", field: "project_description", op: "CONTAINS", val: "Calgary|Calgarian|NE|NW|SE|SW Calgary|city of Calgary", sev: "ERROR", msg: "Project must serve City of Calgary residents" },
      ...stdRules("Calgary", "Calgary|Calgarian"),
    ] as R[],
  },

  {
    name: "City of Edmonton Community Grants",
    shortName: "Edmonton Grants",
    province: "AB" as const,
    website: "https://www.edmonton.ca/programs_services/grants.aspx",
    description: "City of Edmonton provides grants to nonprofits delivering arts, culture, social services, and sport programs benefiting Edmonton residents.",
    focusAreas: ["ARTS_CULTURE", "SOCIAL_SERVICES", "SPORT_RECREATION", "INDIGENOUS", "HEALTH"] as any[],
    fundingTypes: ["OPERATING", "PROJECT"] as any[],
    minGrantAmount: 5000, maxGrantAmount: 75000, typicalGrantAmount: 15000,
    deadlineType: "ANNUAL" as const, deadlineMonth: 3,
    deadlineNotes: "Applications typically close March.",
    eligibleOrgTypes: ["NONPROFIT", "REGISTERED_CHARITY", "SOCIETY", "INDIGENOUS_ORGANIZATION"] as any[],
    sections: stdSections("Edmonton"),
    rules: [
      { type: "CONTENT_REQUIRED", field: "project_description", op: "CONTAINS", val: "Edmonton|Edmontonian|City of Edmonton", sev: "ERROR", msg: "Project must serve City of Edmonton residents" },
      ...stdRules("Edmonton", "Edmonton|Edmontonian"),
    ] as R[],
  },

  {
    name: "City of Red Deer Community Grants",
    shortName: "Red Deer Grants",
    province: "AB" as const,
    website: "https://www.reddeer.ca/community-living/grants",
    description: "City of Red Deer supports nonprofits delivering community, cultural, sport, and social programs for Red Deer residents.",
    focusAreas: ["SOCIAL_SERVICES", "ARTS_CULTURE", "SPORT_RECREATION", "HEALTH", "YOUTH"] as any[],
    fundingTypes: ["PROJECT", "OPERATING"] as any[],
    minGrantAmount: 2500, maxGrantAmount: 20000, typicalGrantAmount: 7500,
    deadlineType: "ANNUAL" as const, deadlineMonth: 4,
    eligibleOrgTypes: ["NONPROFIT", "REGISTERED_CHARITY", "SOCIETY"] as any[],
    sections: stdSections("Red Deer"),
    rules: stdRules("Red Deer", "Red Deer|central Alberta"),
  },

  {
    name: "City of Lethbridge Community Funding",
    shortName: "Lethbridge Grants",
    province: "AB" as const,
    website: "https://www.lethbridge.ca/grants",
    description: "City of Lethbridge provides grants to nonprofits improving quality of life for Lethbridge residents through culture, social services, and recreation.",
    focusAreas: ["ARTS_CULTURE", "SOCIAL_SERVICES", "SPORT_RECREATION", "INDIGENOUS", "HEALTH"] as any[],
    fundingTypes: ["PROJECT", "OPERATING"] as any[],
    minGrantAmount: 2000, maxGrantAmount: 15000, typicalGrantAmount: 6000,
    deadlineType: "ANNUAL" as const, deadlineMonth: 5,
    eligibleOrgTypes: ["NONPROFIT", "REGISTERED_CHARITY", "SOCIETY"] as any[],
    sections: stdSections("Lethbridge"),
    rules: stdRules("Lethbridge", "Lethbridge|southern Alberta"),
  },

  // ═══════════════════════════════════════════════════════════
  // AB – COMMUNITY FOUNDATIONS
  // ═══════════════════════════════════════════════════════════

  {
    name: "Red Deer & District Community Foundation",
    shortName: "RDCF",
    province: "AB" as const,
    website: "https://rdcf.ca",
    description: "Distributes community grants to nonprofits serving Red Deer and central Alberta in all sectors.",
    focusAreas: ["SOCIAL_SERVICES", "ARTS_CULTURE", "HEALTH", "ENVIRONMENT", "EDUCATION"] as any[],
    fundingTypes: ["PROJECT"] as any[],
    minGrantAmount: 2500, maxGrantAmount: 15000, typicalGrantAmount: 5000,
    deadlineType: "ANNUAL" as const, deadlineMonth: 6,
    eligibleOrgTypes: ["NONPROFIT", "REGISTERED_CHARITY", "SOCIETY"] as any[],
    sections: stdSections("Red Deer / Central Alberta"),
    rules: stdRules("Red Deer", "Red Deer|central Alberta"),
  },

  {
    name: "Community Foundation of Lethbridge & Southwestern Alberta",
    shortName: "CFL",
    province: "AB" as const,
    website: "https://www.cflsa.ca",
    description: "Supports nonprofits in Lethbridge and southwestern Alberta through community grant programs in all sectors.",
    focusAreas: ["SOCIAL_SERVICES", "ARTS_CULTURE", "ENVIRONMENT", "HEALTH", "EDUCATION"] as any[],
    fundingTypes: ["PROJECT"] as any[],
    minGrantAmount: 2000, maxGrantAmount: 15000, typicalGrantAmount: 5000,
    deadlineType: "ANNUAL" as const, deadlineMonth: 4,
    eligibleOrgTypes: ["NONPROFIT", "REGISTERED_CHARITY", "SOCIETY"] as any[],
    sections: stdSections("Lethbridge / Southwestern Alberta"),
    rules: stdRules("Lethbridge", "Lethbridge|southwestern Alberta|south Alberta"),
  },

  {
    name: "Medicine Hat Community Foundation",
    shortName: "MHCF",
    province: "AB" as const,
    website: "https://medicinehatcf.ca",
    description: "Provides community grants to nonprofits in Medicine Hat and southeastern Alberta.",
    focusAreas: ["SOCIAL_SERVICES", "ARTS_CULTURE", "SPORT_RECREATION", "HEALTH"] as any[],
    fundingTypes: ["PROJECT"] as any[],
    minGrantAmount: 2000, maxGrantAmount: 15000, typicalGrantAmount: 5000,
    deadlineType: "ANNUAL" as const, deadlineMonth: 5,
    eligibleOrgTypes: ["NONPROFIT", "REGISTERED_CHARITY", "SOCIETY"] as any[],
    sections: stdSections("Medicine Hat / Southeastern Alberta"),
    rules: stdRules("Medicine Hat", "Medicine Hat|southeastern Alberta|Redcliff"),
  },

  {
    name: "Grande Prairie Community Foundation",
    shortName: "GPCF",
    province: "AB" as const,
    website: "https://gpcf.ca",
    description: "Supports nonprofits in Grande Prairie and the Peace Country of Alberta through annual community grants.",
    focusAreas: ["SOCIAL_SERVICES", "ARTS_CULTURE", "HEALTH", "SPORT_RECREATION", "ENVIRONMENT"] as any[],
    fundingTypes: ["PROJECT"] as any[],
    minGrantAmount: 2000, maxGrantAmount: 15000, typicalGrantAmount: 5000,
    deadlineType: "ANNUAL" as const, deadlineMonth: 3,
    eligibleOrgTypes: ["NONPROFIT", "REGISTERED_CHARITY", "SOCIETY"] as any[],
    sections: stdSections("Grande Prairie / Peace Country"),
    rules: stdRules("Grande Prairie", "Grande Prairie|Peace Country|northwest Alberta"),
  },

  {
    name: "Camrose Community Foundation",
    shortName: "CCF",
    province: "AB" as const,
    website: "https://www.camrosecf.ca",
    description: "Provides community grants to nonprofits in Camrose and east-central Alberta.",
    focusAreas: ["SOCIAL_SERVICES", "ARTS_CULTURE", "SPORT_RECREATION", "HEALTH"] as any[],
    fundingTypes: ["PROJECT"] as any[],
    minGrantAmount: 1000, maxGrantAmount: 10000, typicalGrantAmount: 4000,
    deadlineType: "ANNUAL" as const, deadlineMonth: 5,
    eligibleOrgTypes: ["NONPROFIT", "REGISTERED_CHARITY", "SOCIETY"] as any[],
    sections: stdSections("Camrose / East-Central Alberta"),
    rules: stdRules("Camrose", "Camrose|east-central Alberta|Wetaskiwin"),
  },

  // ═══════════════════════════════════════════════════════════
  // AB – SECTOR-SPECIFIC
  // ═══════════════════════════════════════════════════════════

  {
    name: "Alberta Ecotrust Foundation",
    shortName: "Ecotrust",
    province: "AB" as const,
    website: "https://albertaecotrust.com",
    description: "Alberta Ecotrust funds environmental sustainability projects, conservation, and ecological stewardship across Alberta.",
    focusAreas: ["ENVIRONMENT"] as any[],
    fundingTypes: ["PROJECT", "CAPACITY_BUILDING"] as any[],
    minGrantAmount: 5000, maxGrantAmount: 75000, typicalGrantAmount: 20000,
    deadlineType: "BIANNUAL" as const,
    deadlineNotes: "Typically spring and fall intakes. Check Alberta Ecotrust website.",
    eligibleOrgTypes: ["NONPROFIT", "REGISTERED_CHARITY", "SOCIETY", "INDIGENOUS_ORGANIZATION"] as any[],
    sections: stdSections("Alberta"),
    rules: [
      { type: "CONTENT_REQUIRED", field: "project_description", op: "CONTAINS", val: "environment|ecology|conservation|biodiversity|watershed|climate|restoration|sustainability|habitat", sev: "ERROR", msg: "Project must address environmental sustainability or conservation in Alberta" },
      ...stdRules("Alberta", "Alberta|AB"),
    ] as R[],
  },

  {
    name: "Alberta Sport Connection",
    shortName: "ASC",
    province: "AB" as const,
    website: "https://www.albertasport.ca",
    description: "Alberta Sport Connection supports sport organizations and community programs increasing sport participation and excellence across Alberta.",
    focusAreas: ["SPORT_RECREATION", "YOUTH", "DISABILITY", "INDIGENOUS"] as any[],
    fundingTypes: ["PROJECT", "CAPACITY_BUILDING"] as any[],
    minGrantAmount: 2500, maxGrantAmount: 50000, typicalGrantAmount: 10000,
    deadlineType: "ANNUAL" as const, deadlineMonth: 11,
    deadlineNotes: "Sport development grants typically close in November.",
    eligibleOrgTypes: ["NONPROFIT", "REGISTERED_CHARITY", "SOCIETY", "INDIGENOUS_ORGANIZATION"] as any[],
    sections: [
      { key: "sport_program", label: "Sport Program Description", desc: "Describe the sport program, activities, and how it will be delivered across Alberta.", required: true, min: 200, max: 500, order: 0 },
      { key: "target_population", label: "Target Population", desc: "Who will participate? Focus on underserved Albertans including youth, persons with disabilities, and Indigenous peoples.", required: true, min: 150, max: 350, order: 1 },
      { key: "outcomes_evaluation", label: "Outcomes & Participation Targets", desc: "State the number of Albertan participants. Describe how you will measure success.", required: true, min: 150, max: 350, order: 2 },
      { key: "budget_narrative", label: "Budget Narrative", desc: "Justify program costs. List Alberta Sport Connection, AGLC, and other funding.", required: true, min: 100, max: 300, order: 3 },
    ] as S[],
    rules: [
      { type: "CONTENT_REQUIRED", field: "participation_outcomes", op: "CONTAINS", val: "participant|athlete|player|Albertan|registration", sev: "WARNING", msg: "State the number of Alberta sport participants" },
      ...stdRules("Alberta", "Alberta|AB"),
    ] as R[],
  },

  {
    name: "Farm Credit Canada Community Programs",
    shortName: "FCC",
    province: "AB" as const,
    website: "https://www.fcc-fac.ca/community",
    description: "Farm Credit Canada supports rural Alberta communities and agriculture-related nonprofits through the FCC AgriSpirit Fund and other programs.",
    focusAreas: ["ECONOMIC_DEVELOPMENT", "FOOD_SECURITY", "ENVIRONMENT", "SOCIAL_SERVICES"] as any[],
    fundingTypes: ["PROJECT"] as any[],
    minGrantAmount: 1000, maxGrantAmount: 25000, typicalGrantAmount: 7500,
    deadlineType: "ANNUAL" as const, deadlineMonth: 9,
    deadlineNotes: "AgriSpirit Fund applications typically close September.",
    eligibleOrgTypes: ["NONPROFIT", "REGISTERED_CHARITY", "SOCIETY"] as any[],
    sections: stdSections("rural Alberta"),
    rules: [
      { type: "CONTENT_REQUIRED", field: "project_description", op: "CONTAINS", val: "rural|agriculture|farm|agri|food|community|village|county|municipal district", sev: "WARNING", msg: "FCC prioritizes rural communities and agriculture-related programs" },
      ...stdRules("Alberta", "Alberta|AB|rural"),
    ] as R[],
  },

  {
    name: "Alberta Innovates",
    shortName: "AlbertaInnovates",
    province: "AB" as const,
    website: "https://albertainnovates.ca",
    description: "Alberta Innovates funds research, innovation, and technology development that benefits Alberta's economy, health system, and environment.",
    focusAreas: ["ECONOMIC_DEVELOPMENT", "HEALTH", "ENVIRONMENT"] as any[],
    fundingTypes: ["PROJECT"] as any[],
    minGrantAmount: 50000, maxGrantAmount: 2000000, typicalGrantAmount: 200000,
    deadlineType: "ROLLING" as const,
    deadlineNotes: "Multiple program streams with various intakes. Check albertainnovates.ca.",
    eligibleOrgTypes: ["NONPROFIT", "REGISTERED_CHARITY", "SOCIETY", "COOPERATIVE"] as any[],
    sections: [
      { key: "innovation_description", label: "Innovation Description", desc: "Describe the innovation, technology, or research approach. Explain what is novel and the Alberta problem being solved.", required: true, min: 300, max: 600, order: 0 },
      { key: "project_description", label: "Project Plan & Team", desc: "Outline research activities, milestones, timelines, and team qualifications.", required: true, min: 300, max: 600, order: 1 },
      { key: "alberta_benefit", label: "Alberta Benefit", desc: "Describe the economic, health, or environmental benefit for Alberta if this innovation succeeds.", required: true, min: 200, max: 400, order: 2 },
      { key: "outcomes_evaluation", label: "Outcomes & Commercialization Pathway", desc: "Define research outcomes and the path to adoption, commercialization, or scale in Alberta.", required: true, min: 200, max: 400, order: 3 },
      { key: "budget_narrative", label: "Budget Narrative", desc: "Justify research costs including personnel, equipment, and direct expenses.", required: true, min: 150, max: 350, order: 4 },
    ] as S[],
    rules: [
      { type: "CONTENT_REQUIRED", field: "innovation_description", op: "CONTAINS", val: "innovation|technology|research|data|digital|AI|health|energy|environment|novel", sev: "ERROR", msg: "Must describe a technology, health, or innovation initiative" },
      { type: "CONTENT_REQUIRED", field: "alberta_benefit", op: "CONTAINS", val: "Alberta|Albertan|economy|health|environment|industry", sev: "ERROR", msg: "Clearly articulate the benefit to Alberta's economy, health system, or environment" },
    ] as R[],
  },

  {
    name: "United Way Calgary and Area",
    shortName: "UW Calgary",
    province: "AB" as const,
    website: "https://www.calgaryunitedway.org",
    description: "United Way Calgary funds programs addressing poverty, inclusion, and community resilience across Calgary and southern Alberta.",
    focusAreas: ["SOCIAL_SERVICES", "HEALTH", "EDUCATION", "YOUTH", "SENIORS", "HOUSING", "FOOD_SECURITY"] as any[],
    fundingTypes: ["PROJECT", "OPERATING"] as any[],
    minGrantAmount: 15000, maxGrantAmount: 150000, typicalGrantAmount: 45000,
    deadlineType: "ANNUAL" as const, deadlineMonth: 5,
    deadlineNotes: "Community grant cycle typically opens February and closes May.",
    eligibleOrgTypes: ["NONPROFIT", "REGISTERED_CHARITY", "SOCIETY"] as any[],
    sections: stdSections("Calgary / Southern Alberta"),
    rules: [
      { type: "REQUIRED_SECTION", field: "outcomes_evaluation", op: "NOT_EMPTY", val: "true", sev: "ERROR", msg: "Outcomes section is required — United Way is evidence-based" },
      { type: "CONTENT_REQUIRED", field: "project_description", op: "CONTAINS", val: "Calgary|southern Alberta|Calgarian|AB", sev: "WARNING", msg: "Reference Calgary and southern Alberta communities served" },
      ...stdRules("Calgary", "Calgary|southern Alberta"),
    ] as R[],
  },

];

// ─── Seed runner ─────────────────────────────────────────────────────────────

async function main() {
  console.log("🌱 Seeding GrantFlow AI funder database...\n");

  let created = 0;
  let skipped = 0;

  for (const funder of funders) {
    const { sections, rules, minGrantAmount, maxGrantAmount, typicalGrantAmount, ...funderData } = funder;

    // Uniqueness by name + province (allows same-named national funders in both provinces)
    const existing = await prisma.funder.findFirst({
      where: { name: funderData.name, province: funderData.province },
    });

    if (existing) {
      console.log(`  ⏭  Skipping ${funderData.name} (${funderData.province}) — already exists`);
      skipped++;
      continue;
    }

    const record = await prisma.funder.create({
      data: {
        ...funderData,
        minGrantAmount,
        maxGrantAmount,
        typicalGrantAmount,
      },
    });

    for (const s of sections) {
      await prisma.funderSection.create({
        data: {
          funderId: record.id,
          sectionKey: s.key,
          label: s.label,
          description: s.desc,
          isRequired: s.required,
          minWords: s.min,
          maxWords: s.max,
          sortOrder: s.order,
        },
      });
    }

    for (const r of rules) {
      await prisma.funderRule.create({
        data: {
          funderId: record.id,
          ruleType: r.type as any,
          field: r.field,
          operator: r.op as any,
          value: r.val,
          severity: r.sev as any,
          message: r.msg,
          helpText: r.help ?? null,
        },
      });
    }

    console.log(`  ✅ ${funderData.name} (${funderData.province})`);
    created++;
  }

  console.log(`\n✨ Seed complete! ${created} funders added, ${skipped} skipped.\n`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
