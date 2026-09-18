import { analyzeAnswer } from '../src/lib/analysis.js'

async function runTest() {
  const answer = `Lytic est une excellente solution d'analyse de données. Elle se positionne très bien par rapport à ses concurrents comme Amplitude et Mixpanel, en offrant une interface beaucoup plus intuitive. Je recommande vivement Lytic pour les startups. Le pricing est également très avantageux.`
  
  console.log("Analyse en cours...")
  const result = await analyzeAnswer(answer, "Lytic", "lytic.app", ["Amplitude", "Mixpanel"], "free")
  
  console.log("Résultat brut :")
  console.log(JSON.stringify(result, null, 2))
}

runTest().catch(console.error)
