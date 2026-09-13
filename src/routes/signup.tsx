import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/signup')({
  beforeLoad: ({ context }) => {
    if (context.user) {
      throw redirect({ to: '/dashboard' })
    }
    throw redirect({
      to: '/login',
      search: { mode: 'register' },
    })
  },
})
