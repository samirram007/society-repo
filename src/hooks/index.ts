import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createServerFn } from '@tanstack/react-start'

// ============================================
// SERVER FUNCTIONS - MEMBERS
// ============================================
const getMembers = createServerFn({ method: 'GET' })
  .validator((options?: { page?: number; limit?: number }) => options)
  .handler(async ({ data }) => {
    const { memberService } = await import('@/services')
    return memberService.getAll(data)
  })

const getMember = createServerFn({ method: 'GET' })
  .validator((id: number) => id)
  .handler(async ({ data }) => {
    const { memberService } = await import('@/services')
    return memberService.getById(data)
  })

const createMember = createServerFn({ method: 'POST' })
  .validator((data: any) => data)
  .handler(async ({ data }) => {
    const { memberService } = await import('@/services')
    return memberService.create(data)
  })

const updateMember = createServerFn({ method: 'POST' })
  .validator((data: { id: number; data: any }) => data)
  .handler(async ({ data }) => {
    const { memberService } = await import('@/services')
    return memberService.update(data.id, data.data)
  })

const deleteMember = createServerFn({ method: 'POST' })
  .validator((id: number) => id)
  .handler(async ({ data }) => {
    const { memberService } = await import('@/services')
    return memberService.delete(data)
  })

// ============================================
// SERVER FUNCTIONS - FLATS
// ============================================
const getFlats = createServerFn({ method: 'GET' })
  .validator((options?: { page?: number; limit?: number }) => options)
  .handler(async ({ data }) => {
    const { flatService } = await import('@/services')
    return flatService.getAll(data)
  })

const createFlat = createServerFn({ method: 'POST' })
  .validator((data: any) => data)
  .handler(async ({ data }) => {
    const { flatService } = await import('@/services')
    return flatService.create(data)
  })

const updateFlat = createServerFn({ method: 'POST' })
  .validator((data: { id: number; data: any }) => data)
  .handler(async ({ data }) => {
    const { flatService } = await import('@/services')
    return flatService.update(data.id, data.data)
  })

const deleteFlat = createServerFn({ method: 'POST' })
  .validator((id: number) => id)
  .handler(async ({ data }) => {
    const { flatService } = await import('@/services')
    return flatService.delete(data)
  })

// ============================================
// SERVER FUNCTIONS - INVOICES (replaces Dues)
// ============================================
const getInvoices = createServerFn({ method: 'GET' })
  .validator((options?: { page?: number; limit?: number }) => options)
  .handler(async ({ data }) => {
    const { invoiceService } = await import('@/services')
    return invoiceService.getAll(data)
  })

const getInvoiceSummary = createServerFn({ method: 'GET' })
  .handler(async () => {
    const { invoiceService } = await import('@/services')
    return invoiceService.getSummary()
  })

// ============================================
// SERVER FUNCTIONS - PAYMENTS
// ============================================
const recordPayment = createServerFn({ method: 'POST' })
  .validator((data: any) => data)
  .handler(async ({ data }) => {
    const { paymentService } = await import('@/services')
    return paymentService.create(data)
  })

// ============================================
// SERVER FUNCTIONS - MAINTENANCE REQUESTS
// ============================================
const getMaintenanceRequests = createServerFn({ method: 'GET' })
  .validator((options?: { page?: number; limit?: number }) => options)
  .handler(async ({ data }) => {
    const { maintenanceRequestService } = await import('@/services')
    return maintenanceRequestService.getAll(data)
  })

const createMaintenanceRequest = createServerFn({ method: 'POST' })
  .validator((data: any) => data)
  .handler(async ({ data }) => {
    const { maintenanceRequestService } = await import('@/services')
    return maintenanceRequestService.create(data)
  })

// ============================================
// SERVER FUNCTIONS - NOTICES
// ============================================
const getNotices = createServerFn({ method: 'GET' })
  .validator((options?: { page?: number; limit?: number }) => options)
  .handler(async ({ data }) => {
    const { noticeService } = await import('@/services')
    return noticeService.getAll(data)
  })

const createNotice = createServerFn({ method: 'POST' })
  .validator((data: any) => data)
  .handler(async ({ data }) => {
    const { noticeService } = await import('@/services')
    return noticeService.create(data)
  })

// ============================================
// SERVER FUNCTIONS - MEETINGS
// ============================================
const getMeetings = createServerFn({ method: 'GET' })
  .validator((options?: { page?: number; limit?: number }) => options)
  .handler(async ({ data }) => {
    const { meetingService } = await import('@/services')
    return meetingService.getAll(data)
  })

const createMeeting = createServerFn({ method: 'POST' })
  .validator((data: any) => data)
  .handler(async ({ data }) => {
    const { meetingService } = await import('@/services')
    return meetingService.create(data)
  })

// ============================================
// SERVER FUNCTIONS - VISITORS
// ============================================
const getVisitors = createServerFn({ method: 'GET' })
  .validator((options?: { page?: number; limit?: number }) => options)
  .handler(async ({ data }) => {
    const { visitorService } = await import('@/services')
    return visitorService.getAll(data)
  })

const checkInVisitor = createServerFn({ method: 'POST' })
  .validator((data: any) => data)
  .handler(async ({ data }) => {
    const { visitorService } = await import('@/services')
    return visitorService.checkIn(data)
  })

const checkOutVisitor = createServerFn({ method: 'POST' })
  .validator((id: number) => id)
  .handler(async ({ data }) => {
    const { visitorService } = await import('@/services')
    return visitorService.checkOut(data)
  })

// ============================================
// SERVER FUNCTIONS - EXPENSES
// ============================================
const getExpenses = createServerFn({ method: 'GET' })
  .validator((options?: { page?: number; limit?: number }) => options)
  .handler(async ({ data }) => {
    const { expenseService } = await import('@/services')
    return expenseService.getAll(data)
  })

const getExpensesSummary = createServerFn({ method: 'GET' })
  .handler(async () => {
    const { expenseService } = await import('@/services')
    return expenseService.getSummary()
  })

const approveExpense = createServerFn({ method: 'POST' })
  .validator((data: { id: number; approvedBy: number }) => data)
  .handler(async ({ data }) => {
    const { expenseService } = await import('@/services')
    return expenseService.approveExpense(data.id, data.approvedBy)
  })

// ============================================
// QUERY KEYS
// ============================================
export const queryKeys = {
  members: { all: ['members'] as const, detail: (id: number) => ['members', id] as const },
  flats: { all: ['flats'] as const, detail: (id: number) => ['flats', id] as const },
  invoices: { all: ['invoices'] as const, summary: ['invoices', 'summary'] as const },
  payments: { all: ['payments'] as const },
  maintenance: { all: ['maintenance'] as const },
  notices: { all: ['notices'] as const },
  meetings: { all: ['meetings'] as const },
  visitors: { all: ['visitors'] as const },
  expenses: { all: ['expenses'] as const, summary: ['expenses', 'summary'] as const },
}

// ============================================
// MEMBER HOOKS
// ============================================
export function useMembers(options?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: queryKeys.members.all,
    queryFn: () => getMembers({ data: options }),
  })
}

export function useMember(id: number) {
  return useQuery({
    queryKey: queryKeys.members.detail(id),
    queryFn: () => getMember({ data: id }),
    enabled: !!id,
  })
}

export function useCreateMember() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: any) => createMember({ data }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.members.all }),
  })
}

export function useUpdateMember() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: { id: number; data: any }) => updateMember({ data }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.members.all }),
  })
}

export function useDeleteMember() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteMember({ data: id }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.members.all }),
  })
}

// ============================================
// FLAT HOOKS
// ============================================
export function useFlats(options?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: queryKeys.flats.all,
    queryFn: () => getFlats({ data: options }),
  })
}

export function useCreateFlat() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: any) => createFlat({ data }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.flats.all }),
  })
}

export function useUpdateFlat() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: { id: number; data: any }) => updateFlat({ data }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.flats.all }),
  })
}

export function useDeleteFlat() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteFlat({ data: id }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.flats.all }),
  })
}

// ============================================
// INVOICE HOOKS (replaces Dues)
// ============================================
export function useDues(options?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: queryKeys.invoices.all,
    queryFn: () => getInvoices({ data: options }),
  })
}

export function useDuesSummary() {
  return useQuery({
    queryKey: queryKeys.invoices.summary,
    queryFn: () => getInvoiceSummary({ data: undefined }),
  })
}

// ============================================
// MAINTENANCE HOOKS
// ============================================
export function useMaintenanceRequests(options?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: queryKeys.maintenance.all,
    queryFn: () => getMaintenanceRequests({ data: options }),
  })
}

export function useCreateMaintenanceRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: any) => createMaintenanceRequest({ data }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.maintenance.all }),
  })
}

// ============================================
// NOTICE HOOKS
// ============================================
export function useNotices(options?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: queryKeys.notices.all,
    queryFn: () => getNotices({ data: options }),
  })
}

export function useCreateNotice() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: any) => createNotice({ data }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.notices.all }),
  })
}

// ============================================
// MEETING HOOKS
// ============================================
export function useMeetings(options?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: queryKeys.meetings.all,
    queryFn: () => getMeetings({ data: options }),
  })
}

export function useCreateMeeting() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: any) => createMeeting({ data }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.meetings.all }),
  })
}

// ============================================
// VISITOR HOOKS
// ============================================
export function useVisitors(options?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: queryKeys.visitors.all,
    queryFn: () => getVisitors({ data: options }),
  })
}

export function useCheckInVisitor() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: any) => checkInVisitor({ data }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.visitors.all }),
  })
}

export function useCheckOutVisitor() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => checkOutVisitor({ data: id }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.visitors.all }),
  })
}

// ============================================
// EXPENSE HOOKS
// ============================================
export function useExpenses(options?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: queryKeys.expenses.all,
    queryFn: () => getExpenses({ data: options }),
  })
}

export function useExpensesSummary() {
  return useQuery({
    queryKey: queryKeys.expenses.summary,
    queryFn: () => getExpensesSummary({ data: undefined }),
  })
}

export function useApproveExpense() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: { id: number; approvedBy: number }) => approveExpense({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses.summary })
    },
  })
}

// ============================================
// PAYMENT HOOKS
// ============================================
export function useRecordPayment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: any) => recordPayment({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.payments.all })
    },
  })
}
