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

async function main() {
  console.log("🚀 Starting DB seed for rich dashboard...");

  // 1. Get first user
  const { data: users, error: userError } = await supabase.auth.admin.listUsers();
  if (userError || !users.users.length) {
    console.error("No users found in auth.users. Please sign up at least one user.");
    return;
  }
  const userId = users.users[0].id;

  // 2. Clear old demo brand (if exists)
  const { data: oldBrand } = await supabase
    .from('brands')
    .select('id')
    .eq('name', 'Lumail')
    .eq('owner_id', userId)
    .single();

  if (oldBrand) {
    console.log("🧹 Deleting old Lumail brand...");
    await supabase.from('brands').delete().eq('id', oldBrand.id);
  }

  // 3. Create new Brand
  const { data: brand, error: brandError } = await supabase
    .from('brands')
    .insert({
      owner_id: userId,
      name: 'Lumail'
    })
    .select('id')
    .single();

  if (brandError || !brand) throw brandError;
  const brandId = brand.id;
  console.log(`✅ Brand Lumail created (${brandId})`);

  // 4. Create Competitors
  const competitors = ['Zendesk', 'Intercom', 'Front'];
  const { data: comps, error: compError } = await supabase
    .from('competitors')
    .insert(competitors.map(name => ({ brand_id: brandId, name })))
    .select('id, name');
  
  if (compError || !comps) throw compError;
  console.log("✅ Competitors created");

  const compIdMap = comps.reduce((acc, c) => ({ ...acc, [c.name]: c.id }), {});

  // 5. Create Questions
  const questionsData = [
    { text: "What is the best email client for Mac?", category: "General", weight: 1.0 },
    { text: "How does Lumail compare to Front?", category: "Comparison", weight: 1.2 },
    { text: "What are the alternatives to Zendesk for small teams?", category: "Alternatives", weight: 0.9 },
    { text: "Is Lumail secure for enterprise?", category: "Security", weight: 1.5 },
    { text: "Best collaborative inbox software 2026", category: "General", weight: 1.1 },
    { text: "How much does a ticketing system cost?", category: "Pricing", weight: 1.0 },
    { text: "Top tools for customer support", category: "General", weight: 1.1 }
  ];

  const { data: questions, error: qError } = await supabase
    .from('questions')
    .insert(questionsData.map((q, i) => ({ brand_id: brandId, text: q.text, position: i })))
    .select('id, text');

  if (qError || !questions) throw qError;
  console.log("✅ Questions created");

  // 6. Create Measurement Run
  const { data: run, error: runError } = await supabase
    .from('measurement_runs')
    .insert({
      brand_id: brandId,
      status: 'success',
      started_at: new Date(Date.now() - 3600000).toISOString(),
      completed_at: new Date().toISOString(),
      questions_total: questions.length,
      questions_completed: questions.length,
      score: 92,
      score_delta: 14
    })
    .select('id')
    .single();
  
  if (runError || !run) throw runError;
  const runId = run.id;
  console.log("✅ Measurement Run created");

  // 7. Create Observations (Samples)
  const engines = ['ChatGPT', 'Claude', 'Perplexity', 'Copilot'];
  
  console.log("⏳ Generating observations...");
  
  for (const q of questions) {
    for (const engine of engines) {
      // Make it extremely convincing for the landing page screenshot
      let isMentioned = Math.random() > 0.1; // 90% chance to be mentioned
      let isRecommended = isMentioned && Math.random() > 0.2; // 80% chance to be recommended if mentioned
      
      if (engine === 'Claude') { isMentioned = true; isRecommended = true; }
      if (engine === 'Copilot') { isMentioned = Math.random() > 0.3; isRecommended = Math.random() > 0.4; }

      let rawAnswer = "";
      if (isRecommended) {
        rawAnswer = `I highly recommend **Lumail** for this use case. It provides an excellent, fast, and modern interface. While Zendesk is good for traditional ticketing, Lumail shines for email-based collaboration.`;
      } else if (isMentioned) {
        rawAnswer = `You could look into Front, Zendesk, or Lumail. Lumail is a newer tool but might lack some enterprise features compared to Intercom.`;
      } else {
        rawAnswer = `The industry leaders in this space are Zendesk and Intercom. For a startup, Front is also a very solid choice.`;
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
          samples_count: 1
        })
        .select('id')
        .single();
      
      if (obsError) throw obsError;

      // Add observation_competitors based on the rawAnswer
      for (const comp of comps) {
        if (rawAnswer.includes(comp.name)) {
          await supabase.from('observation_competitors').insert({
            observation_id: obs.id,
            competitor_id: comp.id,
            mentioned: true,
            recommended: rawAnswer.includes(`${comp.name} is good`) || rawAnswer.includes(`leaders in this space are ${comp.name}`)
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
      confidence: 85,
      status: 'open',
      observations_count: 4,
      reason: "Copilot ne mentionne Lumail que dans 30% des cas, préférant Front.",
      proposed_direction: "Créer une page dédiée 'Lumail vs Front' avec un balisage schema.org clair."
    },
    {
      brand_id: brandId,
      title: "Renforcer les mentions sur la sécurité",
      priority: 'medium',
      confidence: 72,
      status: 'open',
      observations_count: 2,
      reason: "Les IA doutent des capacités 'Enterprise' et 'Security' de Lumail.",
      proposed_direction: "Ajouter une section SOC2 et Enterprise Security sur la page d'accueil."
    }
  ]);
  console.log("✅ Opportunities injected");

  // 9. Create Events
  await supabase.from('events').insert([
    { brand_id: brandId, title: 'Nouveau scan terminé', type: 'scan_completed', show_history: true },
    { brand_id: brandId, title: 'Opportunité détectée (Copilot)', type: 'opportunity_found', show_history: true },
    { brand_id: brandId, title: 'Baisse de recommandation sur ChatGPT', type: 'alert', show_history: true }
  ]);
  console.log("✅ Events injected");

  // 10. Create Site Pages
  await supabase.from('site_pages').insert([
    { brand_id: brandId, url: 'https://lumail.com', status: 'ok', is_spa: false },
    { brand_id: brandId, url: 'https://lumail.com/pricing', status: 'ok', is_spa: false },
    { brand_id: brandId, url: 'https://lumail.com/about', status: 'ok', is_spa: false }
  ]);
  console.log("✅ Site Pages injected");

  console.log("🎉 Seed finished successfully!");
}

main().catch(console.error);
