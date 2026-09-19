import { Link } from '@tanstack/react-router'
import {
  Building2,
  Users,
  IndianRupee,
  Wrench,
  UserCheck,
  Receipt,
  ArrowUpRight,
  Plus,
  Banknote,
  Megaphone,
  Search,
  Loader2,
  TrendingUp,
  TrendingDown,
  Clock,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useDashboardSummary } from '@/hooks/dashboard'
import { ThemePreviewPanel } from '@/components/theme-preview-panel'

// Stat card config
const statCards = [
  {
    key: 'totalFlats',
    label: 'Total Flats',
    icon: Building2,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-950',
    format: (v: number) => v.toString(),
  },
  {
    key: 'totalMembers',
    label: 'Total Members',
    icon: Users,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950',
    format: (v: number) => v.toString(),
  },
  {
    key: 'pendingDues',
    label: 'Pending Dues',
    icon: IndianRupee,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50 dark:bg-amber-950',
    format: (v: number) => `₹${v.toLocaleString('en-IN')}`,
    invert: true,
  },
  {
    key: 'openComplaints',
    label: 'Open Complaints',
    icon: Wrench,
    color: 'text-rose-600',
    bgColor: 'bg-rose-50 dark:bg-rose-950',
    format: (v: number) => v.toString(),
    invert: true,
  },
  {
    key: 'todayVisitors',
    label: "Today's Visitors",
    icon: UserCheck,
    color: 'text-violet-600',
    bgColor: 'bg-violet-50 dark:bg-violet-950',
    format: (v: number) => v.toString(),
  },
  {
    key: 'pendingExpenses',
    label: 'Pending Expenses',
    icon: Receipt,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50 dark:bg-orange-950',
    format: (v: number) => `₹${v.toLocaleString('en-IN')}`,
    invert: true,
  },
]

// Activity type config
const activityConfig: Record<string, { icon: string; color: string }> = {
  payment: { icon: '💵', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300' },
  complaint: { icon: '🔧', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300' },
  notice: { icon: '📢', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' },
  visitor: { icon: '🚶', color: 'bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300' },
  expense: { icon: '📄', color: 'bg-muted text-muted-foreground' },
}

function getTimeAgo(date: Date | null): string {
  if (!date) return 'Unknown'
  const now = new Date()
  const diff = now.getTime() - new Date(date).getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
  return 'Just now'
}

export function DashboardPage() {
  const { data, isLoading, error } = useDashboardSummary()

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's what's happening in your society.
        </p>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Error State */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">
              Failed to load dashboard data. Please try again.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      {data && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {statCards.map((stat) => {
              const Icon = stat.icon
              const value = data.stats[stat.key as keyof typeof data.stats]
              const formattedValue = stat.format(value)

              return (
                <Card key={stat.key} className="relative overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.bgColor}`}
                      >
                        <Icon className={`h-5 w-5 ${stat.color}`} />
                      </div>
                      {stat.invert && value > 0 ? (
                        <Badge variant="destructive" className="text-xs">
                          <TrendingUp className="mr-1 h-3 w-3" />
                          Action needed
                        </Badge>
                      ) : value > 0 ? (
                        <Badge variant="secondary" className="text-xs">
                          <TrendingDown className="mr-1 h-3 w-3" />
                          Active
                        </Badge>
                      ) : null}
                    </div>
                    <div className="mt-3">
                      <div className="text-2xl font-bold">{formattedValue}</div>
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
            {/* Recent Activity - Takes 2 columns */}
            <Card className="lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Recent Activity</CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/notices">
                    View all
                    <ArrowUpRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                {data.activities.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Clock className="h-12 w-12 text-muted-foreground/50" />
                    <p className="mt-2 text-sm text-muted-foreground">
                      No recent activity
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {data.activities.map((activity, index) => {
                      const config =
                        activityConfig[activity.type] || activityConfig.notice
                      return (
                        <div
                          key={`${activity.type}-${activity.id}-${index}`}
                          className="flex items-center gap-4"
                        >
                          <div
                            className={`flex h-9 w-9 items-center justify-center rounded-full text-sm ${config.color}`}
                          >
                            {config.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {activity.text}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {getTimeAgo(activity.timestamp)}
                            </p>
                          </div>
                          <Badge variant="outline" className="text-xs capitalize">
                            {activity.type}
                          </Badge>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Theme Preview Panel */}
            <ThemePreviewPanel />

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link to="/members">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Member
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link to="/dues">
                    <Banknote className="mr-2 h-4 w-4" />
                    Record Payment
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link to="/notices">
                    <Megaphone className="mr-2 h-4 w-4" />
                    Post Notice
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link to="/visitors">
                    <Search className="mr-2 h-4 w-4" />
                    Log Visitor
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Bottom Stats Row */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950">
                    <Building2 className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{data.stats.totalFlats}</p>
                    <p className="text-xs text-muted-foreground">Total Flats</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950">
                    <Users className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{data.stats.totalMembers}</p>
                    <p className="text-xs text-muted-foreground">Total Members</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-50 dark:bg-violet-950">
                    <UserCheck className="h-5 w-5 text-violet-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{data.stats.todayVisitors}</p>
                    <p className="text-xs text-muted-foreground">Today's Visitors</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50 dark:bg-orange-950">
                    <Receipt className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      ₹{data.stats.pendingExpenses.toLocaleString('en-IN')}
                    </p>
                    <p className="text-xs text-muted-foreground">Pending Expenses</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
