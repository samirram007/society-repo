import { useQuery } from '@tanstack/react-query'
import { createServerFn } from '@tanstack/react-start'

// ============================================
// DASHBOARD SERVER FUNCTION
// ============================================
const getDashboardSummary = createServerFn({ method: 'GET' })
  .handler(async () => {
    const { db } = await import('@/db')
    const { flats, members, invoices, serviceRequests, visitors, expenses, notices } = await import('@/db/schema')
    const { count, eq, sql, desc } = await import('drizzle-orm')

    try {
      // Count totals
      const [flatCount] = await db.select({ count: count() }).from(flats)
      const [memberCount] = await db.select({ count: count() }).from(members)

      // Pending dues (using invoices table)
      const [pendingDuesResult] = await db
        .select({
          total: sql<string>`COALESCE(SUM(CAST(${invoices.totalAmount} AS DECIMAL) - CAST(${invoices.paidAmount} AS DECIMAL)), 0)`,
        })
        .from(invoices)
        .where(sql`${invoices.status} IN ('pending', 'overdue', 'partial')`)

      // Open complaints
      const [openComplaints] = await db
        .select({ count: count() })
        .from(serviceRequests)
        .where(sql`${serviceRequests.status} IN ('open', 'in_progress', 'reopened')`)

      // Today's visitors
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const [todayVisitors] = await db
        .select({ count: count() })
        .from(visitors)
        .where(sql`${visitors.entryTime} >= ${today}`)

      // Pending expenses
      const [pendingExpenses] = await db
        .select({
          total: sql<string>`COALESCE(SUM(CAST(${expenses.amount} AS DECIMAL)), 0)`,
        })
        .from(expenses)
        .where(eq(expenses.status, 'pending'))

      // Recent notices
      const recentNotices = await db
        .select({
          id: notices.id,
          text: notices.title,
          type: sql<string>`'notice'`.as('type'),
          timestamp: notices.createdAt,
        })
        .from(notices)
        .orderBy(desc(notices.createdAt))
        .limit(5)

      // Recent visitors
      const recentVisitors = await db
        .select({
          id: visitors.id,
          text: sql<string>`CONCAT(${visitors.name}, ' visiting Flat ', ${visitors.flatId})`.as('text'),
          type: sql<string>`'visitor'`.as('type'),
          timestamp: visitors.createdAt,
        })
        .from(visitors)
        .orderBy(desc(visitors.createdAt))
        .limit(5)

      // Combine and sort activities
      const activities = [...recentNotices, ...recentVisitors]
        .sort((a, b) => new Date(b.timestamp ?? 0).getTime() - new Date(a.timestamp ?? 0).getTime())
        .slice(0, 10)

      return {
        stats: {
          totalFlats: flatCount?.count ?? 0,
          totalMembers: memberCount?.count ?? 0,
          pendingDues: Number(pendingDuesResult?.total ?? 0),
          openComplaints: openComplaints?.count ?? 0,
          todayVisitors: todayVisitors?.count ?? 0,
          pendingExpenses: Number(pendingExpenses?.total ?? 0),
        },
        activities: activities.map((a) => ({
          id: a.id,
          type: a.type,
          text: a.text,
          timestamp: a.timestamp,
        })),
      }
    } catch (error) {
      console.error('Dashboard query error:', error)
      return {
        stats: {
          totalFlats: 0,
          totalMembers: 0,
          pendingDues: 0,
          openComplaints: 0,
          todayVisitors: 0,
          pendingExpenses: 0,
        },
        activities: [],
      }
    }
  })

// ============================================
// DASHBOARD HOOK
// ============================================
export function useDashboardSummary() {
  return useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: () => getDashboardSummary({ data: undefined }),
    refetchInterval: 30000,
    retry: false,
  })
}
