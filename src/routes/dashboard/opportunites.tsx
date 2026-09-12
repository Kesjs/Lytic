import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/opportunites')({
  component: Page,
})

function Page() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
      <p className="text-sm font-semibold text-ink-primary">Opportunités</p>
      <p className="mt-1 max-w-sm text-sm text-ink-muted">
        Page pas encore connectée aux données réelles — prochaine étape du plan.
      </p>
    </div>
  )
}
