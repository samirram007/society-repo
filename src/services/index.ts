import {
  memberRepository,
  flatRepository,
  invoiceRepository,
  paymentRepository,
  maintenanceRequestRepository,
  noticeRepository,
  meetingRepository,
  visitorRepository,
  expenseRepository,
} from '@/repositories'

// ============================================
// MEMBER SERVICE
// ============================================
export const memberService = {
  async getAll(options?: { page?: number; limit?: number }) {
    return memberRepository.findAll(options)
  },

  async getById(id: number) {
    return memberRepository.findById(id)
  },

  async create(data: any) {
    return memberRepository.create(data)
  },

  async update(id: number, data: any) {
    return memberRepository.update(id, data)
  },

  async delete(id: number) {
    return memberRepository.delete(id)
  },

  async count() {
    return memberRepository.count()
  },
}

// ============================================
// FLAT SERVICE
// ============================================
export const flatService = {
  async getAll(options?: { page?: number; limit?: number }) {
    return flatRepository.findAll(options)
  },

  async getById(id: number) {
    return flatRepository.findById(id)
  },

  async create(data: any) {
    return flatRepository.create(data)
  },

  async update(id: number, data: any) {
    return flatRepository.update(id, data)
  },

  async delete(id: number) {
    return flatRepository.delete(id)
  },

  async count() {
    return flatRepository.count()
  },
}

// ============================================
// INVOICE SERVICE (replaces DueService)
// ============================================
export const invoiceService = {
  async getAll(options?: { page?: number; limit?: number }) {
    return invoiceRepository.findAll(options)
  },

  async getById(id: number) {
    return invoiceRepository.findById(id)
  },

  async create(data: any) {
    return invoiceRepository.create(data)
  },

  async update(id: number, data: any) {
    return invoiceRepository.update(id, data)
  },

  async delete(id: number) {
    return invoiceRepository.delete(id)
  },

  async getSummary() {
    return invoiceRepository.getSummary()
  },

  async count() {
    return invoiceRepository.count()
  },
}

// ============================================
// PAYMENT SERVICE
// ============================================
export const paymentService = {
  async getAll(options?: { page?: number; limit?: number }) {
    return paymentRepository.findAll(options)
  },

  async getById(id: number) {
    return paymentRepository.findById(id)
  },

  async create(data: any) {
    const payment = await paymentRepository.create(data)

    // Update invoice status if invoiceId is provided
    if (data.invoiceId) {
      const invoice = await invoiceRepository.findById(data.invoiceId)
      if (invoice) {
        const newPaidAmount = Number(invoice.paidAmount) + data.amount
        const newStatus = newPaidAmount >= Number(invoice.totalAmount) ? 'paid' : 'partial'
        await invoiceRepository.update(invoice.id, {
          paidAmount: newPaidAmount,
          status: newStatus,
        })
      }
    }

    return payment
  },

  async update(id: number, data: any) {
    return paymentRepository.update(id, data)
  },

  async delete(id: number) {
    return paymentRepository.delete(id)
  },
}

// ============================================
// MAINTENANCE REQUEST SERVICE
// ============================================
export const maintenanceRequestService = {
  async getAll(options?: { page?: number; limit?: number }) {
    return maintenanceRequestRepository.findAll(options)
  },

  async getById(id: number) {
    return maintenanceRequestRepository.findById(id)
  },

  async create(data: any) {
    return maintenanceRequestRepository.create(data)
  },

  async update(id: number, data: any) {
    return maintenanceRequestRepository.update(id, data)
  },

  async delete(id: number) {
    return maintenanceRequestRepository.delete(id)
  },

  async count() {
    return maintenanceRequestRepository.count()
  },
}

// ============================================
// NOTICE SERVICE
// ============================================
export const noticeService = {
  async getAll(options?: { page?: number; limit?: number }) {
    return noticeRepository.findAll(options)
  },

  async getById(id: number) {
    return noticeRepository.findById(id)
  },

  async create(data: any) {
    return noticeRepository.create(data)
  },

  async update(id: number, data: any) {
    return noticeRepository.update(id, data)
  },

  async delete(id: number) {
    return noticeRepository.delete(id)
  },
}

// ============================================
// MEETING SERVICE
// ============================================
export const meetingService = {
  async getAll(options?: { page?: number; limit?: number }) {
    return meetingRepository.findAll(options)
  },

  async getById(id: number) {
    return meetingRepository.findById(id)
  },

  async create(data: any) {
    return meetingRepository.create(data)
  },

  async update(id: number, data: any) {
    return meetingRepository.update(id, data)
  },

  async delete(id: number) {
    return meetingRepository.delete(id)
  },
}

// ============================================
// VISITOR SERVICE
// ============================================
export const visitorService = {
  async getAll(options?: { page?: number; limit?: number }) {
    return visitorRepository.findAll(options)
  },

  async getById(id: number) {
    return visitorRepository.findById(id)
  },

  async create(data: any) {
    return visitorRepository.create(data)
  },

  async update(id: number, data: any) {
    return visitorRepository.update(id, data)
  },

  async delete(id: number) {
    return visitorRepository.delete(id)
  },

  async checkIn(data: any) {
    return visitorRepository.create({
      ...data,
      entryTime: new Date(),
      status: 'inside',
    })
  },

  async checkOut(id: number) {
    return visitorRepository.update(id, {
      exitTime: new Date(),
      status: 'checked_out',
    })
  },
}

// ============================================
// EXPENSE SERVICE
// ============================================
export const expenseService = {
  async getAll(options?: { page?: number; limit?: number }) {
    return expenseRepository.findAll(options)
  },

  async getById(id: number) {
    return expenseRepository.findById(id)
  },

  async create(data: any) {
    return expenseRepository.create(data)
  },

  async update(id: number, data: any) {
    return expenseRepository.update(id, data)
  },

  async delete(id: number) {
    return expenseRepository.delete(id)
  },

  async approveExpense(id: number, approvedBy: number) {
    return expenseRepository.update(id, {
      approvedBy,
      status: 'approved',
    })
  },

  async markAsPaid(id: number) {
    return expenseRepository.update(id, {
      status: 'paid',
    })
  },

  async getSummary() {
    return expenseRepository.getSummary()
  },
}
