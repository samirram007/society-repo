import { useState, useEffect } from 'react'
import {
  Landmark,
  Plus,
  Loader2,
  Search,
  X,
  Edit,
  Trash2,
  Download,
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { orpc } from '@/server/client'
import { MemberPicker } from '@/components/member-picker'

// ============================================
// TYPES
// ============================================
interface AccountHead {
  id: number
  societyId: number
  name: string
  code?: string
  type: string
  description?: string
  currentBalance: number
  isActive: boolean
  createdAt: string
}

interface JournalVoucher {
  id: number
  societyId: number
  voucherNumber: string
  date: string
  type: string
  narration?: string
  debitAccountHeadId?: number
  creditAccountHeadId?: number
  amount: number
  status: string
  createdAt: string
}

interface BankAccount {
  id: number
  societyId: number
  bankName: string
  accountNumber?: string
  ifscCode?: string
  branch?: string
  accountType: string
  balance: number
  openingBalance: number
  isActive: boolean
  createdAt: string
}

// ============================================
// CONSTANTS
// ============================================
const typeColors: Record<string, string> = {
  asset: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  liability: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  income: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  expense: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
}

const voucherTypeColors: Record<string, string> = {
  journal: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  receipt: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  payment: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  contra: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  adjustment: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
}

const statusColors: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  approved: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  posted: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
}

const accountTypes = ['asset', 'liability', 'income', 'expense']
const voucherTypes = ['journal', 'receipt', 'payment', 'contra', 'adjustment']

// ============================================
// MAIN COMPONENT
// ============================================
export function AccountsPage() {
  // State
  const [accountHeads, setAccountHeads] = useState<AccountHead[]>([])
  const [journalVouchers, setJournalVouchers] = useState<JournalVoucher[]>([])
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([])
  const [bankSummary, setBankSummary] = useState({ totalBalance: 0, totalOpening: 0, accountCount: 0 })
  const [securityDeposits, setSecurityDeposits] = useState<any[]>([])
  const [advancePayments, setAdvancePayments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [tabValue, setTabValue] = useState('overview')

  // Dialog states
  const [createAccountOpen, setCreateAccountOpen] = useState(false)
  const [editAccountOpen, setEditAccountOpen] = useState(false)
  const [createVoucherOpen, setCreateVoucherOpen] = useState(false)
  const [createBankOpen, setCreateBankOpen] = useState(false)
  const [editBankOpen, setEditBankOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [deleteType, setDeleteType] = useState('')

  // Security deposit dialog states
  const [createDepositOpen, setCreateDepositOpen] = useState(false)
  const [depositForm, setDepositForm] = useState({ memberId: '', type: 'move_in', amount: '', notes: '' })

  // Advance payment dialog states
  const [createAdvanceOpen, setCreateAdvanceOpen] = useState(false)
  const [advanceForm, setAdvanceForm] = useState({ memberId: '', amount: '', type: '' })

  // Form states
  const [accountForm, setAccountForm] = useState({
    name: '',
    code: '',
    type: 'asset',
    description: '',
  })

  const [voucherForm, setVoucherForm] = useState({
    voucherNumber: '',
    date: '',
    type: 'journal',
    narration: '',
    amount: '',
  })

  const [bankForm, setBankForm] = useState({
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    branch: '',
    accountType: 'savings',
    openingBalance: '',
  })

  const [submitting, setSubmitting] = useState(false)

  // Fetch data
  const fetchData = async () => {
    try {
      const [heads, vouchers, banks, summary, deposits, advances] = await Promise.all([
        orpc.accountHeads.list({}),
        orpc.journalVouchers.list({}),
        orpc.bankAccounts.list({}),
        orpc.bankAccounts.summary({}),
        orpc.securityDeposits.list({}),
        orpc.advancePayments.list({}),
      ])
      setAccountHeads(heads || [])
      setJournalVouchers(vouchers || [])
      setBankAccounts(banks || [])
      setBankSummary(summary || { totalBalance: 0, totalOpening: 0, accountCount: 0 })
      setSecurityDeposits(deposits || [])
      setAdvancePayments(advances || [])
    } catch (error) {
      console.error('Failed to fetch accounting data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Calculate summary
  const totalAssets = accountHeads.filter(a => a.type === 'asset').reduce((s, a) => s + Number(a.currentBalance || 0), 0)
  const totalLiabilities = accountHeads.filter(a => a.type === 'liability').reduce((s, a) => s + Number(a.currentBalance || 0), 0)
  const totalIncome = accountHeads.filter(a => a.type === 'income').reduce((s, a) => s + Number(a.currentBalance || 0), 0)
  const totalExpenses = accountHeads.filter(a => a.type === 'expense').reduce((s, a) => s + Number(a.currentBalance || 0), 0)
  const netWorth = totalAssets - totalLiabilities
  const profit = totalIncome - totalExpenses

  // Submit create account head
  const handleCreateAccount = async () => {
    if (!accountForm.name) return
    setSubmitting(true)
    try {
      await orpc.accountHeads.create({
        societyId: 1,
        name: accountForm.name,
        code: accountForm.code || undefined,
        type: accountForm.type as any,
        description: accountForm.description || undefined,
      })
      setCreateAccountOpen(false)
      setAccountForm({ name: '', code: '', type: 'asset', description: '' })
      fetchData()
    } catch (error) {
      console.error('Failed to create account head:', error)
    } finally {
      setSubmitting(false)
    }
  }

  // Submit create journal voucher
  const handleCreateVoucher = async () => {
    if (!voucherForm.voucherNumber || !voucherForm.amount) return
    setSubmitting(true)
    try {
      await orpc.journalVouchers.create({
        societyId: 1,
        voucherNumber: voucherForm.voucherNumber,
        date: voucherForm.date || new Date().toISOString(),
        type: voucherForm.type as any,
        narration: voucherForm.narration || undefined,
        amount: Number(voucherForm.amount),
      })
      setCreateVoucherOpen(false)
      setVoucherForm({ voucherNumber: '', date: '', type: 'journal', narration: '', amount: '' })
      fetchData()
    } catch (error) {
      console.error('Failed to create voucher:', error)
    } finally {
      setSubmitting(false)
    }
  }

  // Edit account head
  const handleEditAccount = async () => {
    if (!accountForm.name || !selectedItem) return
    setSubmitting(true)
    try {
      await orpc.accountHeads.update({
        id: selectedItem.id,
        data: {
          name: accountForm.name,
          code: accountForm.code || undefined,
          type: accountForm.type,
          description: accountForm.description || undefined,
        },
      })
      setEditAccountOpen(false)
      fetchData()
    } catch (error) {
      console.error('Failed to update account:', error)
    } finally {
      setSubmitting(false)
    }
  }

  // Create bank account
  const handleCreateBank = async () => {
    if (!bankForm.bankName) return
    setSubmitting(true)
    try {
      await orpc.bankAccounts.create({
        societyId: 1,
        bankName: bankForm.bankName,
        accountNumber: bankForm.accountNumber || undefined,
        ifscCode: bankForm.ifscCode || undefined,
        branch: bankForm.branch || undefined,
        accountType: bankForm.accountType as any,
        openingBalance: bankForm.openingBalance ? Number(bankForm.openingBalance) : undefined,
      })
      setCreateBankOpen(false)
      setBankForm({ bankName: '', accountNumber: '', ifscCode: '', branch: '', accountType: 'savings', openingBalance: '' })
      fetchData()
    } catch (error) {
      console.error('Failed to create bank account:', error)
    } finally {
      setSubmitting(false)
    }
  }

  // Edit bank account
  const handleEditBank = async () => {
    if (!bankForm.bankName || !selectedItem) return
    setSubmitting(true)
    try {
      await orpc.bankAccounts.update({
        id: selectedItem.id,
        data: {
          bankName: bankForm.bankName,
          accountNumber: bankForm.accountNumber || undefined,
          ifscCode: bankForm.ifscCode || undefined,
          branch: bankForm.branch || undefined,
          accountType: bankForm.accountType,
        },
      })
      setEditBankOpen(false)
      fetchData()
    } catch (error) {
      console.error('Failed to update bank account:', error)
    } finally {
      setSubmitting(false)
    }
  }

  // Create security deposit
  const handleCreateDeposit = async () => {
    if (!depositForm.memberId || !depositForm.amount) return
    setSubmitting(true)
    try {
      await orpc.securityDeposits.create({
        societyId: 1,
        memberId: Number(depositForm.memberId),
        type: depositForm.type as any,
        amount: Number(depositForm.amount),
        notes: depositForm.notes || undefined,
      })
      setCreateDepositOpen(false)
      setDepositForm({ memberId: '', type: 'move_in', amount: '', notes: '' })
      fetchData()
    } catch (error) {
      console.error('Failed to create security deposit:', error)
    } finally {
      setSubmitting(false)
    }
  }

  // Create advance payment
  const handleCreateAdvance = async () => {
    if (!advanceForm.memberId || !advanceForm.amount) return
    setSubmitting(true)
    try {
      await orpc.advancePayments.create({
        societyId: 1,
        memberId: Number(advanceForm.memberId),
        amount: Number(advanceForm.amount),
        type: advanceForm.type || undefined,
      })
      setCreateAdvanceOpen(false)
      setAdvanceForm({ memberId: '', amount: '', type: '' })
      fetchData()
    } catch (error) {
      console.error('Failed to create advance payment:', error)
    } finally {
      setSubmitting(false)
    }
  }

  // Delete item
  const handleDelete = async () => {
    if (!selectedItem) return
    setSubmitting(true)
    try {
      if (deleteType === 'account') {
        await orpc.accountHeads.delete({ id: selectedItem.id })
      } else if (deleteType === 'voucher') {
        await orpc.journalVouchers.delete({ id: selectedItem.id })
      } else if (deleteType === 'bank') {
        await orpc.bankAccounts.delete({ id: selectedItem.id })
      }
      setDeleteDialogOpen(false)
      fetchData()
    } catch (error) {
      console.error('Failed to delete:', error)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Accounts</h1>
          <p className="text-muted-foreground">Chart of accounts, journal entries, and banking</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Assets</p>
                <p className="text-2xl font-bold text-blue-600">₹{totalAssets.toLocaleString('en-IN')}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Liabilities</p>
                <p className="text-2xl font-bold text-red-600">₹{totalLiabilities.toLocaleString('en-IN')}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50 dark:bg-red-950">
                <TrendingDown className="h-5 w-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Net Worth</p>
                <p className="text-2xl font-bold text-green-600">₹{netWorth.toLocaleString('en-IN')}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 dark:bg-green-950">
                <Wallet className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Bank Balance</p>
                <p className="text-2xl font-bold">₹{bankSummary.totalBalance.toLocaleString('en-IN')}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50 dark:bg-purple-950">
                <Landmark className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={tabValue} onValueChange={setTabValue}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="accounts">Chart of Accounts ({accountHeads.length})</TabsTrigger>
          <TabsTrigger value="vouchers">Journal Vouchers ({journalVouchers.length})</TabsTrigger>
          <TabsTrigger value="banking">Banking ({bankAccounts.length})</TabsTrigger>
          <TabsTrigger value="deposits">Security Deposits ({securityDeposits.length})</TabsTrigger>
          <TabsTrigger value="advances">Advance Payments ({advancePayments.length})</TabsTrigger>
        </TabsList>

        {/* ============================================
            OVERVIEW TAB
            ============================================ */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Income vs Expenses */}
            <Card>
              <CardHeader>
                <CardTitle>Income vs Expenses</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Income</span>
                  <span className="font-medium text-green-600">₹{totalIncome.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Expenses</span>
                  <span className="font-medium text-red-600">₹{totalExpenses.toLocaleString('en-IN')}</span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex items-center justify-between font-semibold">
                    <span>Net Profit</span>
                    <span className={profit >= 0 ? 'text-green-600' : 'text-red-600'}>
                      ₹{profit.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Vouchers */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Vouchers</CardTitle>
              </CardHeader>
              <CardContent>
                {journalVouchers.slice(0, 5).length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No vouchers yet</p>
                ) : (
                  <div className="space-y-3">
                    {journalVouchers.slice(0, 5).map((v) => (
                      <div key={v.id} className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{v.voucherNumber}</p>
                          <p className="text-xs text-muted-foreground">{v.narration || v.type}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">₹{Number(v.amount).toLocaleString('en-IN')}</p>
                          <Badge className={`${statusColors[v.status] || ''} border-0 text-xs`}>{v.status}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ============================================
            CHART OF ACCOUNTS TAB
            ============================================ */}
        <TabsContent value="accounts" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setCreateAccountOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Account Head
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Balance</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {accountHeads.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">
                          <p className="text-sm text-muted-foreground">No account heads found</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      accountHeads.map((head) => (
                        <TableRow key={head.id}>
                          <TableCell>
                            <span className="font-mono text-sm">{head.code || '-'}</span>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{head.name}</p>
                              {head.description && (
                                <p className="text-xs text-muted-foreground">{head.description}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={`${typeColors[head.type] || ''} border-0`}>
                              {head.type?.charAt(0).toUpperCase() + head.type?.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className={`font-medium ${Number(head.currentBalance) >= 0 ? '' : 'text-red-600'}`}>
                              ₹{Number(head.currentBalance || 0).toLocaleString('en-IN')}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => {
                                  setSelectedItem(head)
                                  setAccountForm({ name: head.name, code: head.code || '', type: head.type, description: head.description || '' })
                                  setEditAccountOpen(true)
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive"
                                onClick={() => {
                                  setSelectedItem(head)
                                  setDeleteType('account')
                                  setDeleteDialogOpen(true)
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============================================
            JOURNAL VOUCHERS TAB
            ============================================ */}
        <TabsContent value="vouchers" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setCreateVoucherOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Voucher
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Voucher #</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Narration</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {journalVouchers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center">
                          <p className="text-sm text-muted-foreground">No journal vouchers found</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      journalVouchers.map((voucher) => (
                        <TableRow key={voucher.id}>
                          <TableCell>
                            <span className="font-mono text-sm font-medium">{voucher.voucherNumber}</span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">{new Date(voucher.date).toLocaleDateString('en-IN')}</span>
                          </TableCell>
                          <TableCell>
                            <Badge className={`${voucherTypeColors[voucher.type] || ''} border-0`}>
                              {voucher.type?.charAt(0).toUpperCase() + voucher.type?.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">{voucher.narration || '-'}</span>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="font-medium">₹{Number(voucher.amount).toLocaleString('en-IN')}</span>
                          </TableCell>
                          <TableCell>
                            <Badge className={`${statusColors[voucher.status] || ''} border-0`}>
                              {voucher.status?.charAt(0).toUpperCase() + voucher.status?.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive"
                              onClick={() => {
                                setSelectedItem(voucher)
                                setDeleteType('voucher')
                                setDeleteDialogOpen(true)
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============================================
            BANKING TAB
            ============================================ */}
        <TabsContent value="banking" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => {
              setBankForm({ bankName: '', accountNumber: '', ifscCode: '', branch: '', accountType: 'savings', openingBalance: '' })
              setCreateBankOpen(true)
            }}>
              <Plus className="mr-2 h-4 w-4" />
              Add Bank Account
            </Button>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Bank Accounts</CardTitle>
              <CardDescription>Society bank account balances</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : bankAccounts.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No bank accounts found</p>
              ) : (
                <div className="space-y-4">
                  {bankAccounts.map((bank) => (
                    <div key={bank.id} className="flex items-center justify-between rounded-lg border p-4">
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                          <Landmark className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{bank.bankName}</p>
                          <p className="text-sm text-muted-foreground">
                            {bank.accountNumber ? `****${bank.accountNumber.slice(-4)}` : '-'}
                            {bank.ifscCode && ` · ${bank.ifscCode}`}
                          </p>
                          <p className="text-xs text-muted-foreground capitalize">{bank.accountType}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-2xl font-bold">₹{Number(bank.balance || 0).toLocaleString('en-IN')}</p>
                          <p className="text-xs text-muted-foreground">
                            Opening: ₹{Number(bank.openingBalance || 0).toLocaleString('en-IN')}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => {
                              setSelectedItem(bank)
                              setBankForm({
                                bankName: bank.bankName,
                                accountNumber: bank.accountNumber || '',
                                ifscCode: bank.ifscCode || '',
                                branch: bank.branch || '',
                                accountType: bank.accountType || 'savings',
                                openingBalance: '',
                              })
                              setEditBankOpen(true)
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => {
                              setSelectedItem(bank)
                              setDeleteType('bank')
                              setDeleteDialogOpen(true)
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============================================
            SECURITY DEPOSITS TAB
            ============================================ */}
        <TabsContent value="deposits" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setCreateDepositOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Security Deposit
            </Button>
          </div>
          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Member</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Returned</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {securityDeposits.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center">
                          <p className="text-sm text-muted-foreground">No security deposits found</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      securityDeposits.map((dep: any) => (
                        <TableRow key={dep.id}>
                          <TableCell><span className="font-medium">Member #{dep.memberId}</span></TableCell>
                          <TableCell><Badge variant="outline" className="capitalize">{dep.type?.replace('_', ' ')}</Badge></TableCell>
                          <TableCell className="text-right"><span className="font-medium">₹{Number(dep.amount).toLocaleString('en-IN')}</span></TableCell>
                          <TableCell><Badge className={dep.status === 'held' ? 'bg-amber-100 text-amber-700 border-0' : dep.status === 'returned' ? 'bg-green-100 text-green-700 border-0' : 'bg-blue-100 text-blue-700 border-0'}>{dep.status?.replace('_', ' ')}</Badge></TableCell>
                          <TableCell className="text-right"><span className="text-sm">₹{Number(dep.returnAmount || 0).toLocaleString('en-IN')}</span></TableCell>
                          <TableCell><span className="text-sm text-muted-foreground max-w-[150px] truncate block">{dep.notes || '-'}</span></TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={async () => { await orpc.securityDeposits.delete({ id: dep.id }); fetchData() }}><Trash2 className="h-4 w-4" /></Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============================================
            ADVANCE PAYMENTS TAB
            ============================================ */}
        <TabsContent value="advances" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setCreateAdvanceOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Advance Payment
            </Button>
          </div>
          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Member</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">Used</TableHead>
                      <TableHead className="text-right">Balance</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {advancePayments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center">
                          <p className="text-sm text-muted-foreground">No advance payments found</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      advancePayments.map((adv: any) => (
                        <TableRow key={adv.id}>
                          <TableCell><span className="font-medium">Member #{adv.memberId}</span></TableCell>
                          <TableCell><span className="text-sm text-muted-foreground capitalize">{adv.type || '-'}</span></TableCell>
                          <TableCell className="text-right"><span className="font-medium">₹{Number(adv.amount).toLocaleString('en-IN')}</span></TableCell>
                          <TableCell className="text-right"><span className="text-sm text-red-600">₹{Number(adv.usedAmount || 0).toLocaleString('en-IN')}</span></TableCell>
                          <TableCell className="text-right"><span className="font-bold">₹{Number(adv.balance).toLocaleString('en-IN')}</span></TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={async () => { await orpc.advancePayments.delete({ id: adv.id }); fetchData() }}><Trash2 className="h-4 w-4" /></Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ============================================
          CREATE SECURITY DEPOSIT DIALOG
          ============================================ */}
      <Dialog open={createDepositOpen} onOpenChange={setCreateDepositOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Add Security Deposit</DialogTitle>
            <DialogDescription>Record a security deposit from a member</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <MemberPicker
              value={depositForm.memberId}
              onChange={(v) => setDepositForm({ ...depositForm, memberId: v })}
              label="Member"
              required
            />
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type *</Label>
                <Select value={depositForm.type} onValueChange={(val) => setDepositForm({ ...depositForm, type: val })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="move_in">Move-in</SelectItem>
                    <SelectItem value="amenity">Amenity</SelectItem>
                    <SelectItem value="parking">Parking</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Amount (₹) *</Label>
                <Input type="number" value={depositForm.amount} onChange={(e) => setDepositForm({ ...depositForm, amount: e.target.value })} min="0" placeholder="0" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Input value={depositForm.notes} onChange={(e) => setDepositForm({ ...depositForm, notes: e.target.value })} placeholder="Optional notes" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDepositOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateDeposit} disabled={submitting || !depositForm.memberId || !depositForm.amount}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Deposit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============================================
          CREATE ADVANCE PAYMENT DIALOG
          ============================================ */}
      <Dialog open={createAdvanceOpen} onOpenChange={setCreateAdvanceOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Add Advance Payment</DialogTitle>
            <DialogDescription>Record an advance payment from a member</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <MemberPicker
              value={advanceForm.memberId}
              onChange={(v) => setAdvanceForm({ ...advanceForm, memberId: v })}
              label="Member"
              required
            />
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Amount (₹) *</Label>
                <Input type="number" value={advanceForm.amount} onChange={(e) => setAdvanceForm({ ...advanceForm, amount: e.target.value })} min="0" placeholder="0" />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Input value={advanceForm.type} onChange={(e) => setAdvanceForm({ ...advanceForm, type: e.target.value })} placeholder="e.g. Maintenance" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateAdvanceOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateAdvance} disabled={submitting || !advanceForm.memberId || !advanceForm.amount}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Advance
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============================================
          CREATE ACCOUNT HEAD DIALOG
          ============================================ */}
      <Dialog open={createAccountOpen} onOpenChange={setCreateAccountOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Add Account Head</DialogTitle>
            <DialogDescription>Create a new account in the chart of accounts</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                value={accountForm.name}
                onChange={(e) => setAccountForm({ ...accountForm, name: e.target.value })}
                placeholder="e.g. Maintenance Income"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Code</Label>
                <Input
                  value={accountForm.code}
                  onChange={(e) => setAccountForm({ ...accountForm, code: e.target.value })}
                  placeholder="e.g. 3001"
                />
              </div>
              <div className="space-y-2">
                <Label>Type *</Label>
                <Select value={accountForm.type} onValueChange={(val) => setAccountForm({ ...accountForm, type: val })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {accountTypes.map((t) => (
                      <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={accountForm.description}
                onChange={(e) => setAccountForm({ ...accountForm, description: e.target.value })}
                placeholder="Optional description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateAccountOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateAccount} disabled={submitting || !accountForm.name}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============================================
          CREATE JOURNAL VOUCHER DIALOG
          ============================================ */}
      <Dialog open={createVoucherOpen} onOpenChange={setCreateVoucherOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Create Journal Voucher</DialogTitle>
            <DialogDescription>Record a new journal entry</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Voucher Number *</Label>
                <Input
                  value={voucherForm.voucherNumber}
                  onChange={(e) => setVoucherForm({ ...voucherForm, voucherNumber: e.target.value })}
                  placeholder="e.g. JV-001"
                />
              </div>
              <div className="space-y-2">
                <Label>Date *</Label>
                <Input
                  type="date"
                  value={voucherForm.date}
                  onChange={(e) => setVoucherForm({ ...voucherForm, date: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type *</Label>
                <Select value={voucherForm.type} onValueChange={(val) => setVoucherForm({ ...voucherForm, type: val })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {voucherTypes.map((t) => (
                      <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Amount (₹) *</Label>
                <Input
                  type="number"
                  value={voucherForm.amount}
                  onChange={(e) => setVoucherForm({ ...voucherForm, amount: e.target.value })}
                  placeholder="0"
                  min="0"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Narration</Label>
              <Input
                value={voucherForm.narration}
                onChange={(e) => setVoucherForm({ ...voucherForm, narration: e.target.value })}
                placeholder="Description of the entry"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateVoucherOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateVoucher} disabled={submitting || !voucherForm.voucherNumber || !voucherForm.amount}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Voucher
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============================================
          EDIT ACCOUNT HEAD DIALOG
          ============================================ */}
      <Dialog open={editAccountOpen} onOpenChange={setEditAccountOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Edit Account Head</DialogTitle>
            <DialogDescription>Update account details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                value={accountForm.name}
                onChange={(e) => setAccountForm({ ...accountForm, name: e.target.value })}
                placeholder="e.g. Maintenance Income"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Code</Label>
                <Input
                  value={accountForm.code}
                  onChange={(e) => setAccountForm({ ...accountForm, code: e.target.value })}
                  placeholder="e.g. 3001"
                />
              </div>
              <div className="space-y-2">
                <Label>Type *</Label>
                <Select value={accountForm.type} onValueChange={(val) => setAccountForm({ ...accountForm, type: val })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {accountTypes.map((t) => (
                      <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={accountForm.description}
                onChange={(e) => setAccountForm({ ...accountForm, description: e.target.value })}
                placeholder="Optional description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditAccountOpen(false)}>Cancel</Button>
            <Button onClick={handleEditAccount} disabled={submitting || !accountForm.name}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============================================
          CREATE/EDIT BANK ACCOUNT DIALOG
          ============================================ */}
      <Dialog open={createBankOpen || editBankOpen} onOpenChange={(open) => {
        if (!open) { setCreateBankOpen(false); setEditBankOpen(false) }
      }}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>{editBankOpen ? 'Edit Bank Account' : 'Add Bank Account'}</DialogTitle>
            <DialogDescription>{editBankOpen ? 'Update bank account details' : 'Add a new society bank account'}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Bank Name *</Label>
              <Input
                value={bankForm.bankName}
                onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })}
                placeholder="e.g. SBI, HDFC"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Account Number</Label>
                <Input
                  value={bankForm.accountNumber}
                  onChange={(e) => setBankForm({ ...bankForm, accountNumber: e.target.value })}
                  placeholder="Account number"
                />
              </div>
              <div className="space-y-2">
                <Label>IFSC Code</Label>
                <Input
                  value={bankForm.ifscCode}
                  onChange={(e) => setBankForm({ ...bankForm, ifscCode: e.target.value.toUpperCase() })}
                  placeholder="e.g. SBIN0001234"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Branch</Label>
                <Input
                  value={bankForm.branch}
                  onChange={(e) => setBankForm({ ...bankForm, branch: e.target.value })}
                  placeholder="Branch name"
                />
              </div>
              <div className="space-y-2">
                <Label>Account Type</Label>
                <Select value={bankForm.accountType} onValueChange={(val) => setBankForm({ ...bankForm, accountType: val })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="savings">Savings</SelectItem>
                    <SelectItem value="current">Current</SelectItem>
                    <SelectItem value="fixed_deposit">Fixed Deposit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {createBankOpen && (
              <div className="space-y-2">
                <Label>Opening Balance (₹)</Label>
                <Input
                  type="number"
                  value={bankForm.openingBalance}
                  onChange={(e) => setBankForm({ ...bankForm, openingBalance: e.target.value })}
                  placeholder="0"
                  min="0"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setCreateBankOpen(false); setEditBankOpen(false) }}>Cancel</Button>
            <Button onClick={editBankOpen ? handleEditBank : handleCreateBank} disabled={submitting || !bankForm.bankName}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editBankOpen ? 'Update Account' : 'Add Account'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============================================
          DELETE DIALOG
          ============================================ */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Item</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this item? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
