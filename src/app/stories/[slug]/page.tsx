import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";

const STORIES: Record<string, Story> = {
  "youth-programs-vancouver": {
    title: "Youth Programs in Vancouver",
    tag: "British Columbia",
    tagColor: "#1A6DB5",
    date: "June 2025",
    hero: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1400&q=80",
    intro: "Vancouver is home to some of Canada's most vibrant youth-serving nonprofits. From after-school mentorship to sport and arts programs, organizations across the Lower Mainland are working every day to give young people a future worth believing in.",
    body: [
      {
        heading: "The Growing Need",
        text: "Over 95,000 children and youth in Metro Vancouver live in low-income households. Access to safe, structured programming after school reduces dropout rates, improves mental health outcomes, and builds resilience. Yet most community programs rely almost entirely on grants and donations to stay open.",
      },
      {
        heading: "What's Happening Right Now",
        text: "Several exciting initiatives launched in 2025 are expanding access to youth programming across Vancouver and the Fraser Valley. The City of Vancouver's Community Services Grants recently renewed funding for 34 youth-serving organizations. BC Gaming Grants increased youth sport allocations by 18% this cycle. Vancouver Foundation opened a new stream focused specifically on Indigenous youth leadership.",
      },
      {
        heading: "Programs Making a Difference",
        text: "Organizations like Vancouver Youth Society, MOSAIC BC, and Big Brothers Big Sisters of the Lower Mainland are running programs that blend mentorship, employment readiness, and cultural connection. After-school coding bootcamps in East Vancouver are placing youth directly into tech internships. Cultural dance programs in Richmond are connecting second-generation youth with their heritage while building community belonging.",
      },
      {
        heading: "How Grants Fund This Work",
        text: "Youth programs in Vancouver primarily access funding through BC Ministry of Social Development, Vancouver Foundation, United Way of the Lower Mainland, and City of Vancouver grants. Successful applications demonstrate measurable outcomes — participants served, completion rates, post-program follow-up data. AI-assisted grant writing is helping smaller organizations compete for funding they previously couldn't access.",
      },
    ],
    links: [
      { label: "Vancouver Foundation — Youth Grants", url: "https://vancouverfoundation.ca" },
      { label: "BC Gaming Grants — Youth Sport", url: "https://www2.gov.bc.ca/gov/content/sports-culture/gambling-fundraising/gaming-grants" },
      { label: "United Way Lower Mainland", url: "https://uwlm.ca" },
      { label: "City of Vancouver Community Services Grants", url: "https://vancouver.ca/people-programs/grants.aspx" },
    ],
  },

  "community-partnerships": {
    title: "Community Partnerships That Last",
    tag: "BC & Alberta",
    tagColor: "#6B3DB5",
    date: "June 2025",
    hero: "https://images.unsplash.com/photo-1559027615-cd4628902d4a?auto=format&fit=crop&w=1400&q=80",
    intro: "Across British Columbia and Alberta, nonprofits are discovering that the most durable community change happens not through isolated programs, but through deep, trusted partnerships — between organizations, governments, businesses, and the people they serve.",
    body: [
      {
        heading: "Why Partnerships Matter",
        text: "Single-organization grants are increasingly giving way to collaborative funding models. Funders like Edmonton Community Foundation, Calgary Foundation, and Vancouver Foundation now actively prioritize applications that demonstrate cross-sector partnerships. When a food bank partners with a mental health organization and a housing provider, the outcomes are exponentially stronger than any one agency working alone.",
      },
      {
        heading: "Partnership Models Gaining Momentum",
        text: "Backbone organizations are emerging in both provinces to coordinate collective impact initiatives. In Calgary, the Vibrant Communities network connects over 40 nonprofits in shared data collection and coordinated service delivery. In Vancouver, the Social Purpose Real Estate Collaborative is bringing nonprofits, developers, and credit unions together to preserve affordable community spaces.",
      },
      {
        heading: "Cross-Provincial Initiatives",
        text: "Both BC and Alberta are home to national organizations running coordinated provincial programs. United Way chapters in both provinces collaborate on common measurement frameworks. The BC-Alberta Social Economy Research Alliance supports research that directly informs funder priorities. Indigenous-led organizations are increasingly shaping how partnership models respect and honour community sovereignty.",
      },
      {
        heading: "Securing Funding for Partnership Work",
        text: "Partnership grants require compelling narratives that explain each partner's role, shared governance structures, and unified outcome measurement. Funders want to see memoranda of understanding, joint budget management, and a clear theory of change that only works because multiple organizations are at the table. Grant2Fund'n helps organizations articulate the story of their partnerships in ways that resonate with specific funders.",
      },
    ],
    links: [
      { label: "Edmonton Community Foundation", url: "https://www.ecfoundation.org" },
      { label: "Calgary Foundation", url: "https://calgaryfoundation.org" },
      { label: "Vibrant Communities Calgary", url: "https://www.vibrantcalgary.com" },
      { label: "Vancouver Foundation — Neighbourhoods", url: "https://vancouverfoundation.ca" },
    ],
  },

  "every-child-deserves-support": {
    title: "Every Child Deserves Support",
    tag: "Alberta",
    tagColor: "#B53D3D",
    date: "June 2025",
    hero: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=1400&q=80",
    intro: "In Alberta, one in five children lives in a household experiencing financial hardship. Behind every statistic is a child who deserves access to food, safety, opportunity, and love. Nonprofits across the province are fighting every day to close that gap — and funders are listening.",
    body: [
      {
        heading: "The Reality on the Ground",
        text: "Calgary and Edmonton both carry significant child poverty rates despite being among Canada's wealthiest cities. Indigenous children are disproportionately impacted, with systemic barriers to services and cultural continuity. Rural Alberta faces additional challenges — fewer services, greater distances, and limited access to the coordinated support urban centres can offer.",
      },
      {
        heading: "What Alberta Funders Are Prioritizing",
        text: "The Government of Alberta's Community Initiatives Program (CIP) and Community Facility Enhancement Program (CFEP) together fund hundreds of child and family-serving organizations each year. In 2025, Alberta Gaming, Liquor and Cannabis (AGLC) expanded its Charitable Gaming allocations, with child welfare organizations among the top recipients. The Rozsa Foundation, traditionally an arts funder, launched a new stream supporting children's arts-based therapy.",
      },
      {
        heading: "Programs Changing Lives",
        text: "Wood's Homes in Calgary provides intensive community-based mental health support for children and youth. The Boys & Girls Clubs of Calgary run after-school and summer programs serving thousands of at-risk youth. Métis Nation of Alberta delivers culturally grounded healing programs for Indigenous children reconnecting with language and land. Families First Society in the Peace Region provides home visiting programs for vulnerable newborns and their parents.",
      },
      {
        heading: "Applying for Child and Family Grants",
        text: "Alberta funders expect grant applicants to demonstrate evidence-based programming, community need data, and clear safeguarding policies. Applications must align with provincial child welfare policy frameworks and often require letters of support from referral partners such as schools, hospitals, or Children's Services. Organizations that can show long-term client outcomes — not just outputs — consistently perform better in competitive grant rounds.",
      },
    ],
    links: [
      { label: "Alberta Community Initiatives Program (CIP)", url: "https://www.alberta.ca/community-initiatives-program" },
      { label: "AGLC Charitable Gaming", url: "https://aglc.ca/charitable-gaming" },
      { label: "The Rozsa Foundation", url: "https://www.rozsa.ca" },
      { label: "Calgary Foundation — Children & Families", url: "https://calgaryfoundation.org" },
    ],
  },
};

type Story = {
  title: string;
  tag: string;
  tagColor: string;
  date: string;
  hero: string;
  intro: string;
  body: { heading: string; text: string }[];
  links: { label: string; url: string }[];
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const story = STORIES[slug];
  if (!story) return { title: "Story not found" };
  return {
    title: `${story.title} — Grant2Fund'n`,
    description: story.intro,
  };
}

export default async function StoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const story = STORIES[slug];
  if (!story) notFound();

  return (
    <div style={{ background: "#F7F4EF", minHeight: "100vh" }}>
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 h-16"
        style={{ background: "rgba(247,244,239,0.95)", backdropFilter: "blur(20px)", borderBottom: "1px solid var(--border)" }}>
        <Link href="/" className="flex items-center gap-2.5">
          <img src="/icon.png" alt="Grant2Fund'n" className="h-8 w-8 rounded-xl" />
          <span className="font-serif font-bold text-lg" style={{ color: "var(--navy)" }}>Grant2Fund&apos;n</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/#community" className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>
            ← Back to Community
          </Link>
          <Link href="/register"
            className="text-sm font-semibold px-4 py-2 rounded-xl text-white"
            style={{ background: "linear-gradient(135deg, #C4974A, #A07830)" }}>
            Get started free
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <div className="relative overflow-hidden" style={{ height: "480px", marginTop: "0" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={story.hero} alt={story.title} className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(13,27,42,0.92) 0%, rgba(13,27,42,0.3) 50%, rgba(13,27,42,0.1) 100%)" }} />
        <div className="absolute bottom-0 left-0 right-0 px-6 pb-10 pt-20 max-w-4xl mx-auto w-full">
          <span className="inline-block text-xs font-bold px-3 py-1 rounded-full mb-4"
            style={{ background: story.tagColor, color: "white" }}>
            {story.tag}
          </span>
          <h1 className="font-serif font-bold text-white mb-3"
            style={{ fontSize: "clamp(2rem, 5vw, 3.2rem)", letterSpacing: "-0.02em", lineHeight: 1.15 }}>
            {story.title}
          </h1>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>{story.date}</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-6 py-14">

        {/* Intro */}
        <p className="text-xl leading-relaxed mb-12 font-medium" style={{ color: "var(--navy)" }}>
          {story.intro}
        </p>

        {/* Body sections */}
        <div className="space-y-10">
          {story.body.map((section) => (
            <div key={section.heading}>
              <h2 className="font-serif font-bold text-2xl mb-4" style={{ color: "var(--navy)" }}>
                {section.heading}
              </h2>
              <p className="text-base leading-relaxed" style={{ color: "var(--text-muted)", lineHeight: "1.8" }}>
                {section.text}
              </p>
            </div>
          ))}
        </div>

        {/* Resource links */}
        <div className="mt-14 rounded-2xl p-8" style={{ background: "white", border: "1px solid var(--border)" }}>
          <h3 className="font-serif font-bold text-xl mb-6" style={{ color: "var(--navy)" }}>
            Useful Resources & Links
          </h3>
          <div className="space-y-3">
            {story.links.map((link) => (
              <a key={link.label} href={link.url} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition-colors group"
                style={{ background: "var(--cream)", color: "var(--navy)" }}>
                <span>{link.label}</span>
                <span className="text-xs opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "var(--gold)" }}>
                  Visit →
                </span>
              </a>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-12 rounded-2xl p-8 text-center"
          style={{ background: "linear-gradient(135deg, #0D1B2A, #1A3050)" }}>
          <p className="font-serif font-bold text-white text-2xl mb-3">
            Ready to fund this work?
          </p>
          <p className="text-sm mb-6" style={{ color: "rgba(255,255,255,0.5)" }}>
            Grant2Fund&apos;n helps nonprofits write stronger applications and win more grants — faster.
          </p>
          <Link href="/register"
            className="inline-block font-bold text-sm px-8 py-3 rounded-xl text-white"
            style={{ background: "linear-gradient(135deg, #C4974A, #A07830)" }}>
            Start for free
          </Link>
        </div>

        {/* Other stories */}
        <div className="mt-14">
          <p className="font-semibold text-sm mb-5" style={{ color: "var(--text-muted)" }}>More stories</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(STORIES)
              .filter(([s]) => s !== slug)
              .map(([s, story]) => (
                <Link key={s} href={`/stories/${s}`}
                  className="relative overflow-hidden rounded-2xl group block" style={{ height: "180px" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={story.hero} alt={story.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(13,27,42,0.88) 0%, rgba(13,27,42,0.1) 60%)" }} />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <span className="inline-block text-xs font-bold px-2 py-0.5 rounded-full mb-1.5"
                      style={{ background: story.tagColor, color: "white" }}>{story.tag}</span>
                    <p className="text-white font-semibold text-sm">{story.title}</p>
                  </div>
                </Link>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
