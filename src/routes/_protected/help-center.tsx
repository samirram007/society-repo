import { createFileRoute } from '@tanstack/react-router'
import HelpCenter from '@/features/help-center'

export const Route = createFileRoute('/_protected/help-center')({
  component: HelpCenter,
})
