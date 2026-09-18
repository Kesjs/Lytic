export const en = {
  hero: {
    eyebrow: 'Test your brand',
    title: {
      part1: "Make your brand the only answer ",
      highlight: "AI",
      part2: " gives."
    },
    description: "Reflet measures your visibility in AI responses, compares your ranking with competitors, and turns every gap into actionable insights.",
    primaryCta: "Analyze my site",
    secondaryCta: "View product",
    previewLabel: "Reflet Dashboard — Overview",
    previewAnnotation: "The Reflet dashboard",
    previewBadge: "Live score · 72/100",
    freeToStart: "Free to start. No credit card required."
  },
  navbar: {
    product: "Product",
    productOverview: "Overview",
    productAiVisibility: "AI Visibility",
    productQuestions: "Questions & Tracking",
    productEvidence: "Evidence & Gaps",
    productHistory: "Site History",
    resources: "Resources",
    resourcesBlog: "Blog",
    resourcesGuides: "Guides",
    resourcesStudies: "Studies",
    resourcesGlossary: "Glossary",
    pricing: "Pricing",
    dashboard: "Dashboard",
    goToDashboard: "Go to Dashboard",
    login: "Log in",
    start: "Get Started"
  },
  problem: {
    heading: "Your website knows what you sell. ChatGPT might say otherwise.",
    items: [
      { title: 'Invisible', body: "Your brand is missing from relevant AI recommendations." },
      { title: 'Poorly positioned', body: "It ranks far behind other alternatives." },
      { title: 'Misunderstood', body: "Your site has a clear offering, but the AI responses don't reflect it accurately." }
    ],
    footer: "Reflet measures this gap instead of asking you to guess it."
  },
  howItWorks: {
    heading: "How it works",
    subheading: "You pick the questions. Our engine handles the rest.",
    steps: [
      {
        title: "Smart Onboarding",
        description: "Enter your domain. Reflet analyzes your site and automatically generates the most strategic questions.",
        benefits: ["AI-driven intent generation", "Highly precise semantic targeting", "No complex setup required"]
      },
      {
        title: "Measurement & Analysis",
        description: "Our engine regularly prompts LLMs and cross-references their answers with your website's evolution.",
        benefits: ["Clear visibility and recommendation score", "Deterministic change detection ($0)", "Automated sentiment analysis"]
      },
      {
        title: "Actionable Opportunities",
        description: "Get clear recommendations (before/after) to fix your gaps and hack the LLM algorithm.",
        benefits: ["Detailed technical evidence", "Competitor comparison", "Maintain your competitive edge"]
      }
    ],
    opportunities: {
      tag: "Actionable Recommendations",
      heading: "Turn every gap into a clear action item",
      description: "Reflet doesn't just point out flaws: every anomaly is converted into a prioritized recommendation with a confidence score.",
      previewLabel: "Opportunities Page — Concrete Recommendations",
      previewBadge: "Priority Opportunities"
    }
  },
  questionEngine: {
    heading: "The right questions before the right answers.",
    description: "Reflet doesn't just ask ChatGPT to talk about you — it asks the exact questions your prospects would actually ask.",
    badExample: "\"Tell me about SIKKA\"",
    goodExample: "\"Which invoicing software would you recommend to a craftsman in Benin?\""
  },
  metrics: {
    heading: "What Reflet measures",
    subheading: "The 4 pillars of your visibility across major language models.",
    items: [
      { title: 'Presence', body: 'Is your brand mentioned in AI responses?' },
      { title: 'Recommendation', body: 'Is it proposed as the ideal solution, or just neutrally listed?' },
      { title: 'Positioning', body: 'Where does it appear when a list of solutions is generated?' },
      { title: 'Competition', body: 'Which competitors appear instead of you, or more frequently?' }
    ],
    benchmark: {
      tag: "Real-world Benchmark",
      heading: "Compare your presence against direct competitors",
      description: "Every score traces back to the original prompt and the raw AI response — monitor your mention and recommendation gaps against market alternatives.",
      previewLabel: "Competitive Benchmark — NovaPay vs Qonto",
      previewBadge: "Benchmark vs Qonto"
    }
  },
  history: {
    tag: "Continuous Monitoring",
    heading: "Your visibility isn't a static number.",
    description: "Reflet automatically monitors your site and queries AI models at regular intervals. Every new mention, rank gain, or loss is archived with its date and impact.",
    previewLabel: "Event feed — History page",
    previewBadge: "Continuous Audit"
  },
  pricing: {
    heading: "Simple pricing, no surprises",
    subheading: "Start measuring your real AI impact today.",
    monthly: "Monthly",
    annual: "Annually",
    free: {
      name: "Free",
      description: "To get a real glimpse of your visibility, no strings attached.",
      price: "€0",
      noCard: "No credit card required",
      cta: "Start for free",
      features: [
        { label: '1 tracked site' },
        { label: '1 tracked question' },
        { label: '1 measurement (one-time snapshot)' },
        { label: 'Score + 1 competitor visible' },
        { label: 'AI Bots Access', detail: 'Crawl authorization for GPTBot, ClaudeBot, and PerplexityBot on your indexable content.' }
      ]
    },
    pro: {
      name: "Pro",
      recommended: "Recommended plan",
      description: "Ideal for brands wanting to master their visibility.",
      priceMonthly: "€49",
      priceAnnual: "€39",
      perMonth: "/month",
      billedAnnually: "Billed €468 yearly (save 20%)",
      cta: "Start with Pro",
      features: [
        { label: '1 tracked site' },
        { label: "Up to 50 questions" },
        { label: 'Automatic verification', detail: 'Daily check of your site, automatic remeasurement as soon as a change is detected.' },
        { label: 'ChatGPT probing' },
        { label: 'Positioning analysis' },
        { label: 'Opportunity detection' }
      ]
    },
    enterprise: {
      name: "Enterprise",
      description: "For agencies and large organizations with complex needs.",
      price: "Custom",
      cta: "Contact sales",
      features: [
        { label: 'Multi-site & multi-brand' },
        { label: 'Unlimited questions' },
        { label: 'Full API access' },
        { label: 'Multi-engine AI (on roadmap)' },
        { label: 'Dedicated support (Slack/Email)' },
        { label: 'SSO & SLA guaranteed', detail: 'Single Sign-On (SSO/SAML) and contractual Service Level Agreement (SLA), with priority support.' }
      ]
    }
  },
  faq: {
    tag: "FAQ",
    heading: "Questions, answers.",
    description: "The questions we get asked the most. Still stuck? Contact us.",
    items: [
      {
        q: "What exactly does Reflet measure?",
        a: "Reflet measures your brand's presence, recommendation rate, and ranking in AI-generated responses (like ChatGPT), as well as your competitors' presence."
      },
      {
        q: "Does Reflet use ChatGPT directly?",
        a: "Yes, Reflet prompts ChatGPT with the exact questions your prospects would actually ask, and then analyzes the answers."
      },
      {
        q: "Why do AI responses vary?",
        a: "Generative models can produce different answers from one prompt to the next. Reflet measures these variations over time rather than just taking a single snapshot."
      },
      {
        q: "How does Reflet pick the questions?",
        a: "Reflet analyzes your website to understand your offering, and then generates questions that accurately represent what your prospects would search for."
      },
      {
        q: "Does Reflet detect changes to my website?",
        a: "Yes, Reflet automatically monitors your site and flags any detected changes."
      },
      {
        q: "Do I have to manually declare every change?",
        a: "No, monitoring is fully automatic — you don't have to do anything."
      },
      {
        q: "Can I try Reflet for free?",
        a: "Yes, the Free plan lets you track one question and get a real glimpse of your visibility, without a credit card."
      },
      {
        q: "Does Reflet guarantee a position in ChatGPT?",
        a: "No. Reflet measures and explains your current visibility, providing actionable insights to help you improve it, but no one can guarantee a specific rank in a generative model."
      }
    ]
  },
  ctaFinal: {
    heading: "Find out what ChatGPT is saying about your brand.",
    subheading: "Analyze your site, select your key questions, and get your first AI visibility score today.",
    cta: "Analyze my site"
  },
  footer: {
    columns: {
      product: {
        title: "Product",
        links: ["Overview", "AI Visibility", "Questions & Tracking", "Evidence & Gaps", "Site History"]
      },
      resources: {
        title: "Resources",
        links: ["Blog", "Guides", "Studies", "Glossary"]
      },
      company: {
        title: "Company",
        links: ["About", "Contact"]
      },
      legal: {
        title: "Legal",
        links: ["Privacy", "Terms"]
      }
    },
    copyright: "© 2026 Reflet — Measure. Understand. Improve."
  }
};
