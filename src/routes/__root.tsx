import '../app.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  Outlet,
  createRootRouteWithContext,
  HeadContent,
  Scripts,
  Link,
} from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { themeScript } from '@/components/layout/theme-script'

interface RouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<RouterContext>()({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Society ERP - Housing Society Management' },
    ],
  }),
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
})

function NotFoundComponent() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="text-6xl font-bold text-muted-foreground">404</div>
      <h1 className="text-2xl font-semibold">Page Not Found</h1>
      <p className="text-muted-foreground">The page you're looking for doesn't exist.</p>
      <Button asChild>
        <Link to="/">Go to Dashboard</Link>
      </Button>
    </div>
  )
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext()
  return (
    <QueryClientProvider client={queryClient}>
      <html lang="en" suppressHydrationWarning>
        <head>
          <script dangerouslySetInnerHTML={{ __html: themeScript }} />
          <HeadContent />
        </head>
        <body className="bg-background text-foreground" suppressHydrationWarning>
          <Outlet />
          <Scripts />
        </body>
      </html>
    </QueryClientProvider>
  )
}
