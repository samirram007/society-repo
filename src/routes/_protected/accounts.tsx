import { createFileRoute } from '@tanstack/react-router'
import { AccountsPage } from '@/features/accounts'

export const Route = createFileRoute('/_protected/accounts')({
  component: AccountsPage,
})
