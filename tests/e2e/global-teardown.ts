async function globalTeardown() {
  console.log('🧹 Nettoyage après les tests E2E')
  
  // Nettoyage global si nécessaire
  // Par exemple : purger les utilisateurs de test restants
  
  console.log('✅ Nettoyage terminé')
}

export default globalTeardown