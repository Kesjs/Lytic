import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load env
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const BRAND_NAME = 'Nooma';

async function main() {
  console.log("🚀 Starting DB seed for rich dashboard...");

  // 1. Get user
  const { data: users, error: userError } = await supabase.auth.admin.listUsers();
  if (userError || !users.users.length) {
    console.error("No users found in auth.users. Please sign up at least one user.");
    return;
  }
  const targetUser = users.users.find(u => u.email === 'ken2001babatounde@gmail.com');
  if (!targetUser) {
    console.error("User ken2001babatounde@gmail.com not found!");
    return;
  }
  const userId = targetUser.id;

  // 2. Clear old demo brand (any previous seed name — Lumail ou Nooma)
  const { data: oldBrands } = await supabase
    .from('brands')
    .select('id, name')
    .in('name', ['Lumail', BRAND_NAME])
    .eq('owner_id', userId);

  if (oldBrands && oldBrands.length > 0) {
    for (const b of oldBrands) {
      console.log(`🧹 Deleting old demo brand "${b.name}"...`);
      await supabase.from('brands').delete().eq('id', b.id);
    }
  }

  // 3. Create new Brand
  const { data: brand, error: brandError } = await supabase
    .from('brands')
    .insert({
      owner_id: userId,
      name: BRAND_NAME
    })
    .select('id')
    .single();

  if (brandError || !brand) throw brandError;
  const brandId = brand.id;
  console.log(`✅ Brand ${BRAND_NAME} created (${brandId})`);

  // 4. Create Competitors — même catégorie (boîte de réception collaborative
  // / support client) que l'ancien seed, avec Crisp en plus pour ancrer le
  // marché français que cible Reflet en priorité.
  const competitors = ['Zendesk', 'Intercom', 'Front', 'Crisp'];
  const { data: comps, error: compError } = await supabase
    .from('competitors')
    .insert(competitors.map(name => ({ brand_id: brandId, name })))
    .select('id, name');

  if (compError || !comps) throw compError;
  console.log("✅ Competitors created");

  // 5. Create Questions — 50 questions réalistes en français, réparties par
  // catégorie, pour alimenter une vraie pagination (5/page → 10 pages).
  const questionsData: { text: string; category: string; weight: number }[] = [
    // Général
    { text: "Quel est le meilleur outil de boîte de réception collaborative en 2026 ?", category: "Général", weight: 1.1 },
    { text: "Quel logiciel de support client choisir pour une petite équipe ?", category: "Général", weight: 1.0 },
    { text: "Quels sont les outils les plus utilisés pour le support client ?", category: "Général", weight: 1.1 },
    { text: "Quelle plateforme de helpdesk est la plus simple à prendre en main ?", category: "Général", weight: 1.0 },
    { text: "Quel outil recommandez-vous pour centraliser les emails d'une équipe ?", category: "Général", weight: 1.0 },
    { text: "Quels logiciels permettent de gérer les tickets clients efficacement ?", category: "Général", weight: 1.0 },
    { text: "Quelle est la meilleure alternative à une boîte mail partagée classique ?", category: "Général", weight: 1.0 },
    { text: "Quel outil choisir pour améliorer la réactivité du support client ?", category: "Général", weight: 1.0 },

    // Comparaisons
    { text: "Comment Nooma se compare-t-il à Front ?", category: "Comparaison", weight: 1.3 },
    { text: "Nooma vs Intercom : lequel choisir pour une startup ?", category: "Comparaison", weight: 1.3 },
    { text: "Quelles sont les différences entre Nooma et Zendesk ?", category: "Comparaison", weight: 1.2 },
    { text: "Nooma ou Crisp : quel outil pour une équipe support en France ?", category: "Comparaison", weight: 1.2 },
    { text: "Front vs Zendesk vs Nooma, lequel a le meilleur rapport qualité-prix ?", category: "Comparaison", weight: 1.2 },
    { text: "Quel outil est le plus rapide à déployer : Nooma ou Intercom ?", category: "Comparaison", weight: 1.1 },

    // Alternatives
    { text: "Quelles sont les alternatives à Zendesk pour les petites équipes ?", category: "Alternatives", weight: 1.0 },
    { text: "Quelles alternatives existent à Intercom en 2026 ?", category: "Alternatives", weight: 1.0 },
    { text: "Quel outil français peut remplacer Front ?", category: "Alternatives", weight: 1.1 },
    { text: "Existe-t-il une alternative européenne à Intercom pour le RGPD ?", category: "Alternatives", weight: 1.2 },
    { text: "Quelles solutions alternatives à un helpdesk classique existent pour une agence ?", category: "Alternatives", weight: 1.0 },
    { text: "Quel outil choisir à la place de Zendesk quand le budget est limité ?", category: "Alternatives", weight: 1.0 },

    // Sécurité / conformité
    { text: "Nooma est-il conforme au RGPD ?", category: "Sécurité", weight: 1.4 },
    { text: "Nooma est-il sécurisé pour une utilisation en entreprise ?", category: "Sécurité", weight: 1.4 },
    { text: "Quels outils de support client hébergent leurs données en Europe ?", category: "Sécurité", weight: 1.2 },
    { text: "Nooma propose-t-il l'authentification à deux facteurs ?", category: "Sécurité", weight: 1.1 },
    { text: "Quel logiciel de helpdesk est le plus adapté aux exigences de sécurité enterprise ?", category: "Sécurité", weight: 1.2 },

    // Tarification
    { text: "Combien coûte un logiciel de ticketing pour une équipe de 5 personnes ?", category: "Tarification", weight: 1.1 },
    { text: "Quel est le prix de Nooma par mois ?", category: "Tarification", weight: 1.2 },
    { text: "Quel outil de support client offre le meilleur rapport qualité-prix pour une PME ?", category: "Tarification", weight: 1.1 },
    { text: "Existe-t-il un outil de boîte de réception collaborative gratuit ou pas cher ?", category: "Tarification", weight: 1.0 },
    { text: "Nooma propose-t-il un essai gratuit ?", category: "Tarification", weight: 1.0 },

    // Fonctionnalités
    { text: "Quel outil de support client s'intègre le mieux avec Slack ?", category: "Fonctionnalités", weight: 1.0 },
    { text: "Quelle plateforme permet la collaboration en temps réel sur les emails clients ?", category: "Fonctionnalités", weight: 1.0 },
    { text: "Quel logiciel propose les meilleures automatisations pour le support client ?", category: "Fonctionnalités", weight: 1.0 },
    { text: "Nooma propose-t-il une API pour s'intégrer à un CRM existant ?", category: "Fonctionnalités", weight: 1.0 },
    { text: "Quel outil gère le mieux les tickets multicanal (email, chat, réseaux sociaux) ?", category: "Fonctionnalités", weight: 1.0 },
    { text: "Quelle plateforme propose un chatbot IA intégré pour le support client ?", category: "Fonctionnalités", weight: 1.1 },
    { text: "Nooma permet-il de créer des réponses automatiques personnalisées ?", category: "Fonctionnalités", weight: 0.9 },

    // Cas d'usage / secteurs
    { text: "Quel outil de support client recommandez-vous pour une agence marketing ?", category: "Cas d'usage", weight: 1.1 },
    { text: "Quel logiciel choisir pour le support client d'une boutique e-commerce ?", category: "Cas d'usage", weight: 1.0 },
    { text: "Quel outil de ticketing convient le mieux à une startup SaaS en croissance ?", category: "Cas d'usage", weight: 1.1 },
    { text: "Quelle solution de support client est adaptée à une équipe 100% remote ?", category: "Cas d'usage", weight: 1.0 },
    { text: "Quel outil de boîte de réception collaborative recommandez-vous pour une agence digitale ?", category: "Cas d'usage", weight: 1.0 },

    // Avis / réputation
    { text: "Que pensent les utilisateurs de Nooma ?", category: "Avis", weight: 1.0 },
    { text: "Nooma est-il fiable pour gérer un volume important de tickets ?", category: "Avis", weight: 1.0 },
    { text: "Quels sont les avantages et inconvénients de Nooma ?", category: "Avis", weight: 1.1 },
    { text: "Nooma est-il recommandé pour les grandes entreprises ?", category: "Avis", weight: 1.0 },

    // Support & onboarding
    { text: "Combien de temps faut-il pour migrer vers Nooma depuis Zendesk ?", category: "Onboarding", weight: 0.9 },
    { text: "Nooma propose-t-il un support client réactif ?", category: "Onboarding", weight: 1.0 },
    { text: "Quel outil de support client est le plus facile à onboarder pour une équipe non technique ?", category: "Onboarding", weight: 1.0 },
    { text: "Nooma est-il disponible en français ?", category: "Onboarding", weight: 1.0 },
  ];

  const { data: questions, error: qError } = await supabase
    .from('questions')
    .insert(questionsData.map((q, i) => ({ brand_id: brandId, text: q.text, position: i })))
    .select('id, text');

  if (qError || !questions) throw qError;
  console.log(`✅ ${questions.length} questions created`);

  // 6. Create Measurement Runs
  const numRuns = 7;
  let latestRunId = '';

  for (let i = numRuns - 1; i >= 0; i--) {
    const daysAgo = i * 5; // e.g. 30, 25, 20, 15, 10, 5, 0 days ago
    const scoreBase = 65 + ((numRuns - i) * 4); // Score improves over time: 65 -> 93
    const runScore = Math.min(100, scoreBase + Math.floor(Math.random() * 5));

    const { data: run, error: runError } = await supabase.from('measurement_runs').insert({
      brand_id: brandId,
      status: 'success',
      started_at: new Date(Date.now() - (daysAgo * 86400000) - 3600000).toISOString(),
      completed_at: new Date(Date.now() - (daysAgo * 86400000)).toISOString(),
      questions_total: questions.length,
      questions_completed: questions.length,
      score: runScore,
      score_delta: i === numRuns - 1 ? null : Math.floor(Math.random() * 5) + 1
    })
    .select('id')
    .single();

    if (runError || !run) throw runError;

    if (i === 0) {
      latestRunId = run.id;
    }
  }

  const runId = latestRunId;
  console.log("✅ Measurement Runs created");

  // 7. Create Observations (Samples)
  const engines = ['ChatGPT', 'Claude', 'Perplexity', 'Copilot'];

  console.log("⏳ Generating observations...");

  for (const q of questions) {
    for (const engine of engines) {
      // Biais volontaire vers un dashboard convaincant (destiné au hero du
      // site), mais moins caricatural que l'ancien seed : Claude n'est plus
      // "toujours 100%", pour rester crédible sur une capture d'écran.
      let isMentioned = Math.random() > 0.12; // ~88%
      let isRecommended = isMentioned && Math.random() > 0.22; // ~78% si mentionné

      if (engine === 'Claude') { isMentioned = Math.random() > 0.05; isRecommended = isMentioned && Math.random() > 0.1; }
      if (engine === 'Copilot') { isMentioned = Math.random() > 0.35; isRecommended = isMentioned && Math.random() > 0.45; }

      let rawAnswer = "";
      if (isRecommended) {
        rawAnswer = `Je recommande **${BRAND_NAME}** pour ce cas d'usage. L'interface est moderne, rapide, et la collaboration en équipe sur les emails est particulièrement fluide. Zendesk reste solide pour du ticketing classique, mais ${BRAND_NAME} se distingue sur la boîte de réception partagée.`;
      } else if (isMentioned) {
        rawAnswer = `Vous pouvez regarder du côté de Front, Zendesk, ou ${BRAND_NAME}. ${BRAND_NAME} est un outil plus récent, efficace pour les petites équipes, mais avec moins de fonctionnalités enterprise qu'Intercom.`;
      } else {
        rawAnswer = `Les leaders du marché sur ce sujet sont Zendesk et Intercom. Pour une jeune entreprise, Front reste également un très bon choix.`;
      }

      const simulatedThemesOptions = [
        ['tarification', 'coût', 'prix'],
        ['interface', 'ux', "facilité d'utilisation"],
        ['sécurité', 'rgpd', 'conformité'],
        ['collaboration', 'équipe', 'partage'],
        ['support client', 'ticketing', 'automatisation'],
        ['intégrations', 'api', 'crm'],
      ];

      const obsThemes: string[] = [];
      const numThemes = Math.floor(Math.random() * 2) + 2; // 2 ou 3
      const shuffledOptions = [...simulatedThemesOptions].sort(() => 0.5 - Math.random());
      for (let i = 0; i < numThemes; i++) {
        const syns = shuffledOptions[i];
        obsThemes.push(syns[Math.floor(Math.random() * syns.length)]);
      }

      const { data: obs, error: obsError } = await supabase
        .from('observations')
        .insert({
          run_id: runId,
          question_id: q.id,
          engine,
          brand_mentioned: isMentioned,
          brand_recommended: isRecommended,
          brand_position: isMentioned ? Math.floor(Math.random() * 3) + 1 : null,
          raw_answer: rawAnswer,
          samples_count: 1,
          themes: obsThemes
        })
        .select('id')
        .single();

      if (obsError) throw obsError;

      for (const comp of comps) {
        if (rawAnswer.includes(comp.name)) {
          await supabase.from('observation_competitors').insert({
            observation_id: obs.id,
            competitor_id: comp.id,
            mentioned: true,
            recommended: rawAnswer.includes(`${comp.name} est solide`) || rawAnswer.includes(`leaders du marché sur ce sujet sont ${comp.name}`)
          });
        }
      }
    }
  }
  console.log("✅ Observations injected");

  // 8. Create Opportunities
  await supabase.from('opportunities').insert([
    {
      brand_id: brandId,
      title: "Manque de visibilité sur Microsoft Copilot",
      priority: 'high',
      confidence: 0.85,
      status: 'open',
      observations_count: 4,
      reason: `Copilot ne mentionne ${BRAND_NAME} que dans environ 30% des cas, et lui préfère souvent Front.`,
      proposed_direction: `Créer une page dédiée "${BRAND_NAME} vs Front" avec un balisage schema.org clair.`
    },
    {
      brand_id: brandId,
      title: "Renforcer les mentions sur la conformité RGPD",
      priority: 'medium',
      confidence: 0.72,
      status: 'open',
      observations_count: 2,
      reason: `Les IA doutent des capacités "Entreprise" et "RGPD" de ${BRAND_NAME}.`,
      proposed_direction: "Ajouter une section dédiée hébergement européen et conformité RGPD sur la page d'accueil."
    },
    {
      brand_id: brandId,
      title: "Se positionner face à Crisp",
      priority: 'low',
      confidence: 0.60,
      status: 'open',
      observations_count: 1,
      reason: "Crisp émerge comme une alternative montante dans les requêtes liées à la tarification et au marché français.",
      proposed_direction: "Lancer une page comparative ciblée soulignant les avantages tarifaires et l'hébergement en France."
    }
  ]);
  console.log("✅ Opportunities injected");

  // 9. Create Events
  await supabase.from('events').insert([
    { brand_id: brandId, title: 'Nouveau scan terminé', type: 'info', source_type: 'measurement_run', show_history: true },
    { brand_id: brandId, title: 'Opportunité détectée (Copilot)', type: 'success', source_type: 'opportunity', show_history: true },
    { brand_id: brandId, title: 'Baisse de recommandation sur ChatGPT', type: 'warning', source_type: 'system', show_history: true },
    { brand_id: brandId, title: 'Amélioration de la visibilité face à Crisp', type: 'success', source_type: 'system', show_history: true },
    { brand_id: brandId, title: 'Nouvelle question suivie ajoutée', type: 'info', source_type: 'system', show_history: true }
  ]);
  console.log("✅ Events injected");

  // 9.5 Create Bot Access
  await supabase.from('brand_bot_access').insert([
    {
      brand_id: brandId,
      checked_at: new Date().toISOString(),
      llms_txt_found: true,
      bot_rules: {
        "GPTBot": "allowed",
        "ClaudeBot": "allowed",
        "Google-Extended": "disallowed",
        "PerplexityBot": "allowed",
        "OAI-SearchBot": "disallowed"
      }
    }
  ]);
  console.log("✅ Bot Access injected");

  // 10. Create Site Pages
  await supabase.from('site_pages').insert([
    { brand_id: brandId, url: `https://${BRAND_NAME.toLowerCase()}.com`, status: 'ok', is_spa: false },
    { brand_id: brandId, url: `https://${BRAND_NAME.toLowerCase()}.com/pricing`, status: 'ok', is_spa: false },
    { brand_id: brandId, url: `https://${BRAND_NAME.toLowerCase()}.com/about`, status: 'ok', is_spa: false }
  ]);
  console.log("✅ Site Pages injected");

  console.log("🎉 Seed finished successfully!");
}

main().catch(console.error);
