import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { triggerSiteCrawl, processNextPage } from '~/lib/crawler/orchestrate'

// Extrait de TechnicalAuditCard : la logique de déclenchement/poll du crawl
// est identique que ce soit depuis la carte compacte de l'Accueil ou depuis
// la page Audit technique dédiée — un seul endroit pour ne pas la dupliquer.
export function useTechnicalAuditCheck(brandId: string) {
  const queryClient = useQueryClient()
  const [isChecking, setIsChecking] = useState(false)

  const checkMutation = useMutation({
    mutationFn: () => triggerSiteCrawl({ data: { brandId } }),
    onSuccess: async (result) => {
      setIsChecking(true)
      let done = false
      const runId = result.runId

      while (!done) {
        try {
          const res = await processNextPage({ data: { runId } })
          done = res.done
        } catch (err) {
          console.error(err)
          break
        }
      }

      setIsChecking(false)
      queryClient.invalidateQueries({ queryKey: ['bot-access'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-home'] })
      toast.success('Audit technique terminé')
    },
    onError: (err: Error) => {
      setIsChecking(false)
      toast.error(err.message || 'Erreur lors de la vérification')
    },
  })

  return {
    runAudit: () => checkMutation.mutate(),
    isRunning: checkMutation.isPending || isChecking,
  }
}
