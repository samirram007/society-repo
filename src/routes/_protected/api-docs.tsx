import { createFileRoute } from '@tanstack/react-router'
import { ApiDocsPage } from '@/features/api-docs'

export const Route = createFileRoute('/_protected/api-docs')({
  component: ApiDocsPage,
})
