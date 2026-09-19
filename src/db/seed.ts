import { db } from './index'
import {
  clusters,
  societies,
  towers,
  gates,
  users,
  roles,
  userRoles,
  members,
  familyMembers,
  flats,
  parkingSpaces,
  vehicles,
  chargeHeads,
  invoices,
  invoiceItems,
  payments,
  expenses,
  vendors,
  serviceRequests,
  serviceCategories,
  notices,
  meetings,
  visitors,
  amenities,
  amenitySlots,
  amenityBookings,
  staff,
  staffAttendance,
  staffSalaries,
  staffLeaves,
  celebrations,
  celebrationAttendees,
  celebrationBudgets,
  celebrationTasks,
  pets,
  marketplaceProducts,
  localServices,
  holidays,
  fineRules,
  memberEmergencyContacts as emergencyContacts,
  dailyHelp,
  preApprovals,
  auditLogs,
} from './schema'
import bcrypt from 'bcryptjs'
import { count as drizzleCount, eq } from 'drizzle-orm'

function pick<T>(arr: T[], idx: number): T | undefined {
  return arr[idx % arr.length]
}

async function seed() {
  console.log('🌱 Seeding database with comprehensive data...')

  try {
    // ============================================
    // 1. CLUSTER
    // ============================================
    const [cluster] = await db.insert(clusters).values({
      name: 'Green Valley Properties',
      description: 'Premium residential complex management',
      contactEmail: 'admin@greenvalley.com',
      contactPhone: '+91 22 2678 9000',
      address: '101 Business Park, Andheri East',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400069',
      totalSocieties: 1,
    }).execute()
    const clusterId = Number(cluster.insertId)
    console.log('✅ Cluster created')

    // ============================================
    // 2. SOCIETY
    // ============================================
    const [society] = await db.insert(societies).values({
      clusterId,
      name: 'Green Valley Society',
      registrationNumber: 'SOC/2020/12345',
      address: '123 MG Road, Andheri West',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400058',
      contactEmail: 'admin@greenvalley.com',
      contactPhone: '+91 22 2678 9012',
      totalFlats: 120,
      totalTowers: 4,
      totalMembers: 95,
      foundingYear: 2018,
      area: 2.5,
      bankName: 'HDFC Bank',
      bankAccountNumber: '50100012345678',
      bankIfsc: 'HDFC0001234',
      gstNumber: '27AABCT1234F1Z5',
      panNumber: 'AABCT1234F',
      maintenanceDay: 10,
      lateFeePercentage: 2,
      gracePeriodDays: 5,
    }).execute()
    const societyId = Number(society.insertId)
    console.log('✅ Society created')


    // ============================================
    // 3. TOWERS & GATES
    // ============================================
    const towerData = [
      { name: 'Tower A', totalFloors: 10, flatsPerFloor: 4, totalFlats: 40, hasLift: true, hasCctv: true, hasFireAlarm: true },
      { name: 'Tower B', totalFloors: 10, flatsPerFloor: 4, totalFlats: 40, hasLift: true, hasCctv: true, hasFireAlarm: true },
      { name: 'Tower C', totalFloors: 10, flatsPerFloor: 4, totalFlats: 40, hasLift: true, hasCctv: true, hasFireAlarm: true },
      { name: 'Tower D', totalFloors: 8, flatsPerFloor: 3, totalFlats: 24, hasLift: true, hasCctv: true, hasFireAlarm: true },
    ]
    const towerIds: number[] = []
    for (const t of towerData) {
      const [tower] = await db.insert(towers).values({ societyId, ...t }).execute()
      towerIds.push(Number(tower.insertId))
    }

    const gateData = [
      { name: 'Main Gate', type: 'main' as const, hasBoomBarrier: true, hasCctv: true, location: 'South' },
      { name: 'Service Gate', type: 'service' as const, hasBoomBarrier: false, hasCctv: true, location: 'East' },
      { name: 'Pedestrian Gate', type: 'pedestrian' as const, hasBoomBarrier: false, hasCctv: true, location: 'West' },
      { name: 'Emergency Gate', type: 'emergency' as const, hasBoomBarrier: false, hasCctv: true, location: 'North' },
    ]
    const gateIds: number[] = []
    for (const g of gateData) {
      const [gate] = await db.insert(gates).values({ societyId, ...g }).execute()
      gateIds.push(Number(gate.insertId))
    }
    console.log('✅ Towers & Gates created')

    // ============================================
    // 4. ROLES
    // ============================================
    const [roleCount] = await db.select({ count: drizzleCount() }).from(roles)
    if (roleCount.count === 0) {
      await db.insert(roles).values([
        { name: 'cluster_admin', description: 'Cluster administrator', level: 0 },
        { name: 'society_admin', description: 'Society administrator', level: 1 },
        { name: 'chairman', description: 'Society chairman', level: 2 },
        { name: 'secretary', description: 'Society secretary', level: 3 },
        { name: 'treasurer', description: 'Society treasurer', level: 3 },
        { name: 'committee_member', description: 'Committee member', level: 4 },
        { name: 'owner', description: 'Flat owner', level: 5 },
        { name: 'tenant', description: 'Flat tenant', level: 6 },
      ]).execute()
    }
    console.log('✅ Roles created')

    // ============================================
    // 5. USERS (40 users)
    // ============================================
    const adminHash = await bcrypt.hash('admin123', 10)
    const residentHash = await bcrypt.hash('resident123', 10)

    const firstNames = [
      'Rajesh', 'Priya', 'Amit', 'Sneha', 'Vikram', 'Anita', 'Suresh', 'Meera', 'Rahul', 'Deepak',
      'Kavita', 'Manoj', 'Pooja', 'Vikas', 'Neha', 'Sanjay', 'Geeta', 'Prakash', 'Sunita', 'Anil',
      'Ritu', 'Karan', 'Divya', 'Mohan', 'Pallavi', 'Ashok', 'Swati', 'Ravi', 'Neelam', 'Tarun',
      'Kamini', 'Ajay', 'Seema', 'Nitin', 'Rekha', 'Vijay', 'Priti', 'Mangesh', 'Lata', 'Bhushan',
    ]
    const lastNames = [
      'Kumar', 'Sharma', 'Patel', 'Reddy', 'Singh', 'Desai', 'Patel', 'Nair', 'Verma', 'Joshi',
      'Rao', 'Singh', 'Gupta', 'Mishra', 'Joshi', 'Kulkarni', 'Iyer', 'Bhatt', 'Kapoor', 'Thakur',
      'Malhotra', 'Mehta', 'Chandra', 'Kulkarni', 'Deshpande', 'Naik', 'Pandey', 'Tiwari', 'Rathod', 'Choudhary',
      'Sawant', 'Gawde', 'Shinde', 'More', 'Jadhav', 'Bansal', 'Saxena', 'Deshmukh', 'Khandekar', 'Hegde',
    ]
    const genders = ['male', 'female'] as const

    const userRoles: Array<{ role: string; permissions?: string }> = [
      { role: 'developer' },  // 0: Rajesh - Developer (full access)
      { role: 'admin' },      // 1: Priya - Admin
      { role: 'super_admin' }, // 2: Amit - Super Admin
      { role: 'super_admin' }, // 3: Sneha - Super Admin
      { role: 'staff' },      // 4: Vikram - Staff (security)
      { role: 'staff' },      // 5: Anita - Staff (housekeeping)
      { role: 'member' },     // 6: Suresh - Member (owner)
      { role: 'member' },     // 7: Meera - Member (owner)
      { role: 'member' },     // 8: Rahul - Member (tenant)
      { role: 'member' },     // 9: Deepak - Member (owner)
      { role: 'member' },     // 10: Kavita - Member (owner)
      { role: 'member' },     // 11: Manoj - Member (owner)
      { role: 'member' },     // 12: Pooja - Member (owner)
      { role: 'member' },     // 13: Vikas - Member (tenant)
      { role: 'member' },     // 14: Neha - Member (owner)
    ]
    const userData = firstNames.map((fn, i) => ({
      email: `${fn.toLowerCase()}@society.com`,
      passwordHash: i === 0 ? adminHash : residentHash,
      firstName: fn,
      lastName: lastNames[i],
      phone: `+91 98765 ${String(43210 + i * 3).padStart(5, '0')}`,
      gender: genders[i % 2],
      role: userRoles[i % userRoles.length]?.role || 'member',
    }))

    const existingUsers = await db.select({ email: users.email }).from(users)
    const existingEmails = new Set(existingUsers.map(u => u.email))
    const usersToInsert = userData.filter(u => !existingEmails.has(u.email))
    if (usersToInsert.length > 0) {
      await db.insert(users).values(usersToInsert).execute()
    }
    console.log(`✅ Users created (${usersToInsert.length} new)`)

    const allUsers = await db.select().from(users)
    const userMap = new Map(allUsers.map(u => [u.email, u.id]))

    // ============================================
    // 6. FLATS (40 flats across 4 towers, most occupied)
    // ============================================
    const [flatCount] = await db.select({ count: drizzleCount() }).from(flats)
    if (flatCount.count === 0) {
      const flatData: any[] = []
      const wings = ['A', 'B', 'C', 'D']
      const types = ['1BHK', '2BHK', '3BHK', '4BHK'] as const
      const areas: Record<string, number> = { '1BHK': 650, '2BHK': 950, '3BHK': 1250, '4BHK': 1800 }
      const maintAmounts: Record<string, number> = { '1BHK': 2000, '2BHK': 3000, '3BHK': 4500, '4BHK': 6000 }
      const facings = ['North', 'South', 'East', 'West']
      const ownerNames = [
        'Rajesh Kumar', 'Priya Sharma', 'Amit Patel', 'Sneha Reddy', 'Vikram Singh',
        'Anita Desai', 'Suresh Patel', 'Meera Nair', 'Rahul Verma', 'Deepak Joshi',
        'Kavita Rao', 'Manoj Singh', 'Pooja Gupta', 'Vikas Mishra', 'Neha Joshi',
        'Sanjay Kulkarni', 'Geeta Iyer', 'Prakash Bhatt', 'Sunita Kapoor', 'Anil Thakur',
        'Ritu Malhotra', 'Karan Mehta', 'Divya Chandra', 'Mohan Kulkarni', 'Pallavi Deshpande',
        'Ashok Naik', 'Swati Pandey', 'Ravi Tiwari', 'Neelam Rathod', 'Tarun Choudhary',
        'Kamini Sawant', 'Ajay Gawde', 'Seema Shinde', 'Nitin More', 'Rekha Jadhav',
        'Vijay Bansal', 'Priti Saxena', 'Mangesh Deshmukh', 'Lata Khandekar', 'Bhushan Hegde',
      ]
      const tenantNames = [
        null, null, null, null, 'Vikram Singh',
        null, null, null, 'Rahul Verma', null,
        null, null, null, null, 'Vikas Mishra',
        null, null, null, null, null,
        null, null, null, null, null,
        null, null, null, null, null,
        null, null, null, null, null,
        null, null, null, null, null,
      ]

      for (let floor = 1; floor <= 10; floor++) {
        for (let w = 0; w < wings.length; w++) {
          const type = types[w % 4]
          const flatIdx = (floor - 1) * 4 + w
          flatData.push({
            societyId,
            towerId: towerIds[Math.floor((floor - 1) / 3)],
            flatNumber: `${floor}${wings[w]}0${(w % 4) + 1}`,
            wing: wings[w],
            floor,
            area: areas[type],
            carpetArea: areas[type] * 0.75,
            type,
            facing: facings[w % 4],
            maintenanceAmount: maintAmounts[type],
            sinkingFundAmount: maintAmounts[type] * 0.1,
            waterCharges: 300,
            ownerName: ownerNames[flatIdx],
            tenantName: tenantNames[flatIdx],
            isOccupied: flatIdx < 38,
            hasParking: true,
            hasBalcony: type !== '1BHK',
            isActive: true,
          })
        }
      }
      await db.insert(flats).values(flatData).execute()
    }
    console.log('✅ Flats created')

    const allFlats = await db.select().from(flats)

    // ============================================
    // 7. MEMBERS (40 members)
    // ============================================
    const [memberCount] = await db.select({ count: drizzleCount() }).from(members)
    if (memberCount.count === 0) {
      const roles_data = ['chairman', 'secretary', 'treasurer', 'committee_member', 'owner', 'tenant'] as const
      const occupations = ['Business', 'Software Engineer', 'Doctor', 'CA', 'Teacher', 'Marketing Manager', 'Lawyer', 'Retired', 'Designer', 'Data Analyst', 'Architect', 'HR Manager', 'Pilot', 'Entrepreneur', 'Banker', 'Consultant', 'Professor', 'Chef', 'Journalist', 'Nurse']
      const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
      const pans = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

      const memberData = allUsers.slice(0, 40).map((u, i) => {
        const flat = allFlats[i]
        if (!flat) return null
        const roleIdx = i === 0 ? 0 : i === 1 ? 1 : i === 2 ? 2 : i === 3 ? 3 : i < 6 ? 4 : 5
        return {
          societyId,
          userId: u.id,
          flatId: flat.id,
          firstName: u.firstName,
          lastName: u.lastName,
          phone: u.phone,
          role: roles_data[roleIdx] as any,
          residentType: (roleIdx >= 5 ? 'tenant' : 'owner') as any,
          occupation: occupations[i % occupations.length],
          bloodGroup: bloodGroups[i % bloodGroups.length],
          panNumber: `${pans[i % 26]}${pans[(i + 1) % 26]}${pans[(i + 2) % 26]}${pans[(i + 3) % 26]}1234F`,
          securityDeposit: roleIdx >= 5 ? 25000 : 30000 + (i % 5) * 5000,
          moveInDate: new Date(2018 + Math.floor(i / 10), i % 12, 1 + (i % 28)),
          emergencyContactName: `Emergency ${u.firstName}`,
          emergencyContactPhone: `+91 98765 ${String(99900 + i).padStart(5, '0')}`,
          emergencyContactRelation: 'Spouse',
          isActive: true,
        }
      }).filter(Boolean) as any[]

      await db.insert(members).values(memberData).execute()
    }
    console.log('✅ Members created')

    const allMembers = await db.select().from(members).where(eq(members.isActive, true))

    // ============================================
    // 8. FAMILY MEMBERS (30 entries)
    // ============================================
    const [familyCount] = await db.select({ count: drizzleCount() }).from(familyMembers)
    if (familyCount.count === 0 && allMembers.length > 0) {
      const familyNames = [
        'Sunita', 'Arjun', 'Ishita', 'Rohan', 'Karan', 'Tanvi', 'Aditya', 'Neha', 'Sakshi', 'Aarav',
        'Diya', 'Vihaan', 'Ananya', 'Kabir', 'Myra', 'Advait', 'Aisha', 'Reyansh', 'Saanvi', 'Vivaan',
        'Prisha', 'Shaurya', 'Aanya', 'Atharv', 'Aarohi', 'Dhruv', 'Navya', 'Arnav', 'Anvi', 'Kiaan',
      ]
      const relationships = ['Spouse', 'Son', 'Daughter', 'Spouse', 'Daughter', 'Son', 'Spouse', 'Daughter', 'Son', 'Spouse']
      const familyData = allMembers.slice(0, 30).map((m, i) => ({
        memberId: m.id,
        firstName: familyNames[i],
        lastName: m.lastName,
        relationship: relationships[i % relationships.length],
        phone: `+91 98765 ${String(43230 + i).padStart(5, '0')}`,
        gender: i % 2 === 0 ? 'female' as const : 'male' as const,
      }))
      await db.insert(familyMembers).values(familyData).execute()
    }
    console.log('✅ Family Members created')

    // ============================================
    // 9. STAFF (12 staff)
    // ============================================
    const [staffCount] = await db.select({ count: drizzleCount() }).from(staff)
    if (staffCount.count === 0) {
      const staffData = [
        { firstName: 'Ramesh', lastName: 'Yadav', department: 'security' as const, designation: 'Security Head', shift: 'Day', salary: 18000, phone: '+91 98765 50001' },
        { firstName: 'Suresh', lastName: 'Kumar', department: 'security' as const, designation: 'Security Guard', shift: 'Night', salary: 12000, phone: '+91 98765 50002' },
        { firstName: 'Anil', lastName: 'Sharma', department: 'security' as const, designation: 'Security Guard', shift: 'Day', salary: 12000, phone: '+91 98765 50003' },
        { firstName: 'Ram', lastName: 'Prasad', department: 'housekeeping' as const, designation: 'Housekeeping Head', shift: 'Day', salary: 15000, phone: '+91 98765 50004' },
        { firstName: 'Sita', lastName: 'Devi', department: 'housekeeping' as const, designation: 'Housekeeping Staff', shift: 'Day', salary: 10000, phone: '+91 98765 50005' },
        { firstName: 'Ganesh', lastName: 'Patil', department: 'maintenance' as const, designation: 'Maintenance Supervisor', shift: 'Day', salary: 16000, phone: '+91 98765 50006' },
        { firstName: 'Vinod', lastName: 'Kamble', department: 'maintenance' as const, designation: 'Electrician', shift: 'Day', salary: 14000, phone: '+91 98765 50007' },
        { firstName: 'Bharat', lastName: 'Joshi', department: 'gardening' as const, designation: 'Gardener', shift: 'Day', salary: 11000, phone: '+91 98765 50008' },
        { firstName: 'Sunil', lastName: 'Deshmukh', department: 'security' as const, designation: 'Night Supervisor', shift: 'Night', salary: 15000, phone: '+91 98765 50009' },
        { firstName: 'Geeta', lastName: 'More', department: 'housekeeping' as const, designation: 'Housekeeping Staff', shift: 'Morning', salary: 10000, phone: '+91 98765 50010' },
        { firstName: 'Prakash', lastName: 'Naik', department: 'maintenance' as const, designation: 'Plumber', shift: 'Day', salary: 14000, phone: '+91 98765 50011' },
        { firstName: 'Manisha', lastName: 'Bansal', department: 'gardening' as const, designation: 'Landscaper', shift: 'Day', salary: 12000, phone: '+91 98765 50012' },
      ]
      await db.insert(staff).values(staffData.map(s => ({ societyId, ...s, joiningDate: new Date(2019, 0, 1) }))).execute()
    }
    console.log('✅ Staff created')

    const allStaff = await db.select().from(staff)

    // ============================================
    // 9b. STAFF ATTENDANCE (last 14 days)
    // ============================================
    const [attendanceCount] = await db.select({ count: drizzleCount() }).from(staffAttendance)
    if (attendanceCount.count === 0 && allStaff.length > 0) {
      const attendanceData: any[] = []
      const now = new Date()
      for (let d = 0; d < 14; d++) {
        const date = new Date(now)
        date.setDate(date.getDate() - d)
        date.setHours(0, 0, 0, 0)
        if (date.getDay() === 0) continue // Skip Sundays for non-security
        for (const s of allStaff) {
          if (s.department === 'security') {
            const checkIn = new Date(date)
            checkIn.setHours(d % 3 === 0 ? 7 : 8, d % 2 === 0 ? 0 : 30, 0, 0)
            const checkOut = new Date(date)
            checkOut.setHours(19 + d % 2, 0, 0, 0)
            attendanceData.push({
              staffId: s.id, date, checkIn,
              checkOut: d > 0 ? checkOut : undefined,
              status: d % 5 === 0 ? 'late' : 'present',
              overtimeHours: d % 4 === 0 ? '1.5' : '0',
            })
          } else if (d < 10) {
            const checkIn = new Date(date)
            checkIn.setHours(9, 0, 0, 0)
            const checkOut = new Date(date)
            checkOut.setHours(18, 0, 0, 0)
            attendanceData.push({
              staffId: s.id, date, checkIn,
              checkOut: d > 0 ? checkOut : undefined,
              status: d % 7 === 0 ? 'half_day' : 'present',
              overtimeHours: '0',
            })
          }
        }
      }
      await db.insert(staffAttendance).values(attendanceData).execute()
    }
    console.log('✅ Staff Attendance created')

    // ============================================
    // 9c. STAFF SALARIES (6 months)
    // ============================================
    const [salaryCount] = await db.select({ count: drizzleCount() }).from(staffSalaries)
    if (salaryCount.count === 0 && allStaff.length > 0) {
      const now = new Date()
      const salaryData: any[] = []
      for (let m = 0; m < 6; m++) {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - m, 1)
        const monthStr = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`
        for (const s of allStaff) {
          const basic = Number(s.salary || 0)
          const allowances = Math.round(basic * 0.1)
          const deductions = Math.round(basic * 0.12)
          const ot = m === 0 ? Math.round(basic * 0.05) : 0
          const netPay = basic + allowances - deductions + ot
          salaryData.push({
            staffId: s.id, month: monthStr,
            basicSalary: basic.toString(),
            allowances: allowances.toString(),
            deductions: deductions.toString(),
            overtime: ot.toString(),
            netPay: netPay.toString(),
            paymentMethod: 'bank_transfer',
            status: m === 0 ? 'pending' : 'paid',
            paymentDate: m > 0 ? new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 5) : undefined,
          })
        }
      }
      await db.insert(staffSalaries).values(salaryData).execute()
    }
    console.log('✅ Staff Salaries created')

    // 9d. STAFF LEAVES
    const [leaveCount] = await db.select({ count: drizzleCount() }).from(staffLeaves)
    if (leaveCount.count === 0 && allStaff.length > 0) {
      const leaveData = [
        { staffId: allStaff[0]?.id, startDate: new Date(2025, 7, 10), endDate: new Date(2025, 7, 11), reason: 'Personal work', type: 'casual' as const, status: 'approved' as const, approvedBy: 1 },
        { staffId: allStaff[3]?.id, startDate: new Date(2025, 7, 15), endDate: new Date(2025, 7, 15), reason: 'Medical appointment', type: 'sick' as const, status: 'approved' as const, approvedBy: 1 },
        { staffId: allStaff[5]?.id, startDate: new Date(2025, 7, 20), endDate: new Date(2025, 7, 22), reason: 'Family function', type: 'casual' as const, status: 'pending' as const },
        { staffId: allStaff[1]?.id, startDate: new Date(2025, 8, 1), endDate: new Date(2025, 8, 3), reason: 'Festival', type: 'earned' as const, status: 'pending' as const },
        { staffId: allStaff[7]?.id, startDate: new Date(2025, 8, 5), endDate: new Date(2025, 8, 5), reason: 'Personal errand', type: 'casual' as const, status: 'approved' as const, approvedBy: 1 },
        { staffId: allStaff[10]?.id, startDate: new Date(2025, 8, 10), endDate: new Date(2025, 8, 12), reason: 'Wedding ceremony', type: 'earned' as const, status: 'approved' as const, approvedBy: 1 },
        { staffId: allStaff[4]?.id, startDate: new Date(2025, 7, 25), endDate: new Date(2025, 7, 26), reason: 'Fever', type: 'sick' as const, status: 'approved' as const, approvedBy: 1 },
        { staffId: allStaff[8]?.id, startDate: new Date(2025, 8, 15), endDate: new Date(2025, 8, 15), reason: 'Household work', type: 'casual' as const, status: 'pending' as const },
      ]
      await db.insert(staffLeaves).values(leaveData).execute()
    }
    console.log('✅ Staff Leaves created')

    // ============================================
    // 9e. CELEBRATIONS & EVENTS (10 events)
    // ============================================
    const [celebCount] = await db.select({ count: drizzleCount() }).from(celebrations)
    if (celebCount.count === 0) {
      const celebData = [
        { societyId, title: 'Ganesh Chaturthi Celebration', description: 'Annual Ganesh Chaturthi celebration with idol installation, aarti, and prasad distribution.', category: 'religious' as const, subcategory: 'Ganesh Puja', eventDate: new Date(2025, 8, 15), startTime: '09:00', endTime: '21:00', location: 'Club House & Garden', status: 'planned' as const, maxAttendees: 200, contactPerson: 'Rajesh Kumar', contactPhone: '+91 98765 43210' },
        { societyId, title: 'Diwali Mela & Celebration', description: 'Grand Diwali celebration with cultural programs, diya decoration, food stalls, and fireworks.', category: 'festival' as const, subcategory: 'Diwali', eventDate: new Date(2025, 9, 20), startTime: '17:00', endTime: '23:00', location: 'Party Lawn', status: 'planned' as const, maxAttendees: 300, contactPerson: 'Priya Sharma', contactPhone: '+91 98765 43211' },
        { societyId, title: 'Holi Celebration', description: 'Colorful Holi celebration with organic colors, music, and refreshments.', category: 'festival' as const, subcategory: 'Holi', eventDate: new Date(2026, 2, 10), startTime: '08:00', endTime: '13:00', location: 'Open Ground', status: 'planned' as const, maxAttendees: 250, contactPerson: 'Amit Patel', contactPhone: '+91 98765 43212' },
        { societyId, title: 'New Year Party 2025', description: 'Ring in the new year with DJ, dinner, and dancing.', category: 'party' as const, subcategory: 'New Year', eventDate: new Date(2025, 11, 31), startTime: '20:00', endTime: '02:00', location: 'Club House', status: 'planned' as const, maxAttendees: 150, contactPerson: 'Neha Joshi', contactPhone: '+91 98765 43213' },
        { societyId, title: 'Satyanarayan Puja', description: 'Monthly Satyanarayan Puja for prosperity.', category: 'puja' as const, subcategory: 'Satyanarayan Puja', eventDate: new Date(2025, 7, 25), startTime: '10:00', endTime: '13:00', location: 'Tower A Lobby', status: 'confirmed' as const, contactPerson: 'Sita Devi', contactPhone: '+91 98765 43214' },
        { societyId, title: 'Independence Day Flag Hoisting', description: 'Flag hoisting ceremony followed by cultural performances.', category: 'cultural' as const, subcategory: 'Independence Day', eventDate: new Date(2025, 7, 15), startTime: '08:00', endTime: '11:00', location: 'Main Gate Area', status: 'completed' as const, contactPerson: 'Rajesh Kumar', contactPhone: '+91 98765 43210' },
        { societyId, title: 'Children Day Celebration', description: 'Fun activities, games, and prizes for all children.', category: 'social' as const, subcategory: 'Children Day', eventDate: new Date(2025, 10, 14), startTime: '16:00', endTime: '20:00', location: 'Party Lawn', status: 'planned' as const, maxAttendees: 100, contactPerson: 'Priya Sharma', contactPhone: '+91 98765 43211' },
        { societyId, title: 'Annual Day Celebration', description: 'Annual society celebration with award ceremony and dinner.', category: 'social' as const, subcategory: 'Annual Day', eventDate: new Date(2025, 11, 15), startTime: '18:00', endTime: '23:00', location: 'Club House & Lawn', status: 'planned' as const, maxAttendees: 200, contactPerson: 'Amit Patel', contactPhone: '+91 98765 43212' },
        { societyId, title: 'Republic Day Flag Hoisting', description: 'Republic Day celebration with patriotic performances.', category: 'cultural' as const, subcategory: 'Republic Day', eventDate: new Date(2026, 0, 26), startTime: '08:00', endTime: '11:00', location: 'Main Gate Area', status: 'planned' as const, maxAttendees: 200, contactPerson: 'Rajesh Kumar', contactPhone: '+91 98765 43210' },
        { societyId, title: 'Makar Sankranti Celebration', description: 'Kite flying and tilgul distribution for all residents.', category: 'festival' as const, subcategory: 'Makar Sankranti', eventDate: new Date(2026, 0, 14), startTime: '07:00', endTime: '12:00', location: 'Terrace & Open Ground', status: 'planned' as const, maxAttendees: 200, contactPerson: 'Sanjay Kulkarni', contactPhone: '+91 98765 43215' },
      ]
      await db.insert(celebrations).values(celebData).execute()

      const allCelebs = await db.select().from(celebrations)
      const satPuja = allCelebs.find(c => c.subcategory === 'Satyanarayan Puja')
      if (satPuja && allMembers.length > 0) {
        const attData = allMembers.slice(0, 12).map((m, i) => ({ celebrationId: satPuja.id, memberId: m.id, flatId: m.flatId, status: i < 8 ? 'going' as const : 'maybe' as const, guestCount: i < 4 ? 1 : 0 }))
        await db.insert(celebrationAttendees).values(attData).execute()
      }

      const diwali = allCelebs.find(c => c.subcategory === 'Diwali')
      if (diwali) {
        await db.insert(celebrationBudgets).values([
          { celebrationId: diwali.id, category: 'Decoration', description: 'Lighting, rangoli materials', estimatedAmount: '15000', status: 'approved' as const },
          { celebrationId: diwali.id, category: 'Food & Drinks', description: 'Snacks, sweets for 200 people', estimatedAmount: '40000', status: 'pending' as const },
          { celebrationId: diwali.id, category: 'Sound / Music', description: 'DJ and sound system', estimatedAmount: '10000', status: 'pending' as const },
          { celebrationId: diwali.id, category: 'Photography', description: 'Event photographer', estimatedAmount: '5000', status: 'pending' as const },
          { celebrationId: diwali.id, category: 'Miscellaneous', description: 'Prizes, firecrackers', estimatedAmount: '8000', status: 'pending' as const },
        ]).execute()
      }

      const ganesh = allCelebs.find(c => c.subcategory === 'Ganesh Puja')
      if (ganesh) {
        await db.insert(celebrationTasks).values([
          { celebrationId: ganesh.id, title: 'Book Ganesh idol', priority: 'high' as const, status: 'completed' as const, completedAt: new Date() },
          { celebrationId: ganesh.id, title: 'Arrange pandit for puja', priority: 'high' as const, status: 'completed' as const, completedAt: new Date() },
          { celebrationId: ganesh.id, title: 'Decorate pandal', priority: 'medium' as const, status: 'pending' as const, dueDate: new Date(2025, 8, 14) },
          { celebrationId: ganesh.id, title: 'Arrange prasad materials', priority: 'medium' as const, status: 'pending' as const, dueDate: new Date(2025, 8, 14) },
          { celebrationId: ganesh.id, title: 'Coordinate with security', priority: 'low' as const, status: 'pending' as const, dueDate: new Date(2025, 8, 13) },
          { celebrationId: ganesh.id, title: 'Setup sound system', priority: 'low' as const, status: 'pending' as const, dueDate: new Date(2025, 8, 15) },
        ]).execute()
      }
    }
    console.log('✅ Celebrations created')

    // ============================================
    // 10. PARKING & VEHICLES (50 spaces, 15 vehicles)
    // ============================================
    const [parkingCount] = await db.select({ count: drizzleCount() }).from(parkingSpaces)
    if (parkingCount.count === 0) {
      const parkingData: any[] = []
      const sections = ['A', 'B', 'C']
      const floors = ['G', 'B1', 'B2']

      allFlats.slice(0, 30).forEach((flat, i) => {
        parkingData.push({
          societyId, flatId: flat.id,
          slotNumber: `${sections[i % 3]}${floors[Math.floor(i / 10)]}-${String(i + 1).padStart(3, '0')}`,
          floor: floors[Math.floor(i / 10)],
          section: sections[i % 3],
          type: i % 3 === 0 ? 'covered' : 'open',
          vehicleType: i % 4 === 0 ? 'bike' : 'car',
          isVisitorParking: false, isOccupied: true,
          monthlyCharges: i % 3 === 0 ? '1500' : '1000',
        })
      })
      for (let i = 0; i < 20; i++) {
        parkingData.push({
          societyId,
          slotNumber: `VP-${String(i + 1).padStart(3, '0')}`,
          type: 'open', vehicleType: 'car',
          isVisitorParking: true, isOccupied: false,
        })
      }
      await db.insert(parkingSpaces).values(parkingData).execute()

      const vehicleBrands = ['Maruti', 'Honda', 'Toyota', 'Hyundai', 'Bajaj', 'TVS', 'Suzuki', 'KTM', 'Royal Enfield', 'Ather', 'Tata', 'Kia', 'Mahindra', 'Hero', 'Yamaha']
      const vehicleModels = ['Swift', 'City', 'Innova', 'Creta', 'Pulsar', 'Ntorq', 'Access', 'Duke', 'Classic', '450X', 'Nexon', 'Seltos', 'XUV700', 'Splendor', 'MT-15']
      const vehicleColors = ['White', 'Black', 'Silver', 'Red', 'Blue', 'Grey', 'Green', 'White', 'Black', 'Orange', 'White', 'Red', 'Grey', 'Black', 'Blue']

      const vehicleData = allMembers.slice(0, 15).map((m, i) => ({
        memberId: m.id, flatId: m.flatId!,
        vehicleNumber: `MH${12 + (i % 5)}${String.fromCharCode(65 + i)}${String(1000 + i * 111).slice(0, 4)}`,
        type: (i % 3 === 0 ? 'car' : i % 3 === 1 ? 'bike' : 'scooter') as any,
        brand: vehicleBrands[i],
        model: vehicleModels[i],
        color: vehicleColors[i],
        yearOfManufacture: 2018 + (i % 7),
        fuelType: i % 4 === 0 ? 'electric' : i % 3 === 0 ? 'diesel' : 'petrol',
        isPrimary: true,
      }))
      await db.insert(vehicles).values(vehicleData).execute()
    }
    console.log('✅ Parking & Vehicles created')

    // ============================================
    // 11. VENDORS (12 vendors)
    // ============================================
    const [vendorCount] = await db.select({ count: drizzleCount() }).from(vendors)
    if (vendorCount.count === 0) {
      const vendorData = [
        { name: 'SecureGuard Services', category: 'security', contactPerson: 'Ravi Sharma', phone: '+91 98765 10001', gstNumber: '27AABCS1234F1Z5' },
        { name: 'CleanPro Solutions', category: 'cleaning', contactPerson: 'Amit Kumar', phone: '+91 98765 10002', gstNumber: '27AABCC1234F1Z5' },
        { name: 'Green Gardens', category: 'gardening', contactPerson: 'Suresh Patel', phone: '+91 98765 10003', gstNumber: '27AABCG1234F1Z5' },
        { name: 'LiftTech India', category: 'maintenance', contactPerson: 'Vikram Singh', phone: '+91 98765 10004', gstNumber: '27AABCL1234F1Z5' },
        { name: 'BEST Electricity', category: 'electricity', contactPerson: 'Office', phone: '+91 22 2678 1234' },
        { name: 'AquaClean', category: 'water', contactPerson: 'Prakash Mehta', phone: '+91 98765 10006', gstNumber: '27AABCA1234F1Z5' },
        { name: 'Mumbai Painters', category: 'painting', contactPerson: 'Rajesh Verma', phone: '+91 98765 10007' },
        { name: 'SafeHome Insurance', category: 'insurance', contactPerson: 'Anita Deshmukh', phone: '+91 98765 10008' },
        { name: 'PowerGrid Solutions', category: 'electrical', contactPerson: 'Nitin Rao', phone: '+91 98765 10009', gstNumber: '27AABCP1234F1Z5' },
        { name: 'Mumbai Gas Agency', category: 'gas', contactPerson: 'Kiran Shah', phone: '+91 98765 10010' },
        { name: 'TechFix Repairs', category: 'maintenance', contactPerson: 'Arun Joshi', phone: '+91 98765 10011', gstNumber: '27AABCT1234F1Z6' },
        { name: 'QuickFix Plumbing', category: 'plumbing', contactPerson: 'Deepak Gupta', phone: '+91 98765 10012', gstNumber: '27AABCQ1234F1Z5' },
      ]
      await db.insert(vendors).values(vendorData.map(v => ({ societyId, ...v }))).execute()
    }
    console.log('✅ Vendors created')

    const allVendors = await db.select().from(vendors)

    // ============================================
    // 12. CHARGE HEADS & INVOICES (6 months)
    // ============================================
    const [chargeCount] = await db.select({ count: drizzleCount() }).from(chargeHeads)
    if (chargeCount.count === 0) {
      await db.insert(chargeHeads).values([
        { societyId, name: 'Monthly Maintenance', code: 'MM', type: 'maintenance' as const, calculationType: 'fixed' as const, defaultAmount: 3000, gstRate: 18, isRecurring: true },
        { societyId, name: 'Sinking Fund', code: 'SF', type: 'sinking_fund' as const, calculationType: 'fixed' as const, defaultAmount: 500, isRecurring: true },
        { societyId, name: 'Parking Charges', code: 'PK', type: 'parking' as const, calculationType: 'fixed' as const, defaultAmount: 1000, isRecurring: true },
        { societyId, name: 'Water Charges', code: 'WC', type: 'water' as const, calculationType: 'fixed' as const, defaultAmount: 300, isRecurring: true },
        { societyId, name: 'Electricity Charges', code: 'EL', type: 'electricity' as const, calculationType: 'fixed' as const, defaultAmount: 500, isRecurring: true },
        { societyId, name: 'Late Payment Penalty', code: 'LP', type: 'penalty' as const, calculationType: 'percentage' as const, defaultAmount: 0, gstRate: 0, isRecurring: false },
      ]).execute()
    }
    console.log('✅ Charge Heads created')

    const allChargeHeads = await db.select().from(chargeHeads)
    const [invoiceCount] = await db.select({ count: drizzleCount() }).from(invoices)

    if (invoiceCount.count === 0) {
      const months = [
        { month: 3, year: 2025, period: 'Mar-2025' },
        { month: 4, year: 2025, period: 'Apr-2025' },
        { month: 5, year: 2025, period: 'May-2025' },
        { month: 6, year: 2025, period: 'Jun-2025' },
        { month: 7, year: 2025, period: 'Jul-2025' },
        { month: 8, year: 2025, period: 'Aug-2025' },
      ]

      for (const { month, year, period } of months) {
        const invoiceDate = new Date(year, month - 1, 1)
        const dueDate = new Date(year, month - 1, 10)

        for (const flat of allFlats.slice(0, 35)) {
          const amount = Number(flat.maintenanceAmount) + 500 + 300 + 500
          const gstAmount = amount * 0.18
          const totalAmount = amount + gstAmount

          // Randomize payment status: older months more likely paid
          const monthsAgo = 8 - month
          const isPaid = monthsAgo > 1 ? true : monthsAgo === 1 ? Math.random() > 0.3 : Math.random() > 0.6

          const [invoice] = await db.insert(invoices).values({
            societyId, flatId: flat.id,
            memberId: allMembers.find(m => m.flatId === flat.id)?.id,
            invoiceNumber: `INV-${year}${String(month).padStart(2, '0')}-${flat.flatNumber}`,
            invoiceDate, dueDate,
            subtotal: amount, gstAmount, totalAmount,
            paidAmount: isPaid ? totalAmount : '0',
            status: isPaid ? 'paid' : 'draft',
            period, year, month,
          }).execute()

          for (const head of allChargeHeads.filter(h => h.type !== 'penalty')) {
            await db.insert(invoiceItems).values({
              invoiceId: Number(invoice.insertId),
              chargeHeadId: head.id,
              description: head.name,
              quantity: 1,
              rate: Number(head.defaultAmount),
              amount: Number(head.defaultAmount),
              gstRate: Number(head.gstRate),
              gstAmount: Number(head.defaultAmount) * Number(head.gstRate) / 100,
            }).execute()
          }
        }
      }
    }
    console.log('✅ Invoices created (6 months)')

    // ============================================
    // 13. PAYMENTS (40+ payments)
    // ============================================
    const [paymentCount] = await db.select({ count: drizzleCount() }).from(payments)
    if (paymentCount.count === 0) {
      const paidInvoices = await db.select().from(invoices).where(eq(invoices.status, 'paid'))
      const paymentData = paidInvoices.slice(0, 40).map((inv, i) => ({
        societyId, invoiceId: inv.id,
        memberId: allMembers[i % allMembers.length]?.id || 1,
        amount: Number(inv.totalAmount),
        paymentMethod: (['upi', 'bank_transfer', 'online', 'cheque', 'cash', 'upi', 'online', 'bank_transfer'] as const)[i % 8],
        transactionId: `TXN${2025}${String(i + 1000).padStart(6, '0')}`,
        paymentDate: new Date(2025, 2 + Math.floor(i / 12), 5 + (i % 25)),
        status: 'completed' as const,
      }))
      await db.insert(payments).values(paymentData).execute()
    }
    console.log('✅ Payments created')

    // ============================================
    // 14. EXPENSES (25 expenses)
    // ============================================
    const [expenseCount] = await db.select({ count: drizzleCount() }).from(expenses)
    if (expenseCount.count === 0) {
      const expenseData = [
        { category: 'security' as const, description: 'Security services - Aug 2025', amount: 42000, gstAmount: 0, totalAmount: 42000, vendorId: allVendors[0]?.id, status: 'paid' as const },
        { category: 'cleaning' as const, description: 'Housekeeping services - Aug 2025', amount: 15000, gstAmount: 2700, totalAmount: 17700, vendorId: allVendors[1]?.id, status: 'paid' as const },
        { category: 'gardening' as const, description: 'Garden maintenance - Aug 2025', amount: 8500, gstAmount: 1530, totalAmount: 10030, vendorId: allVendors[2]?.id, status: 'approved' as const },
        { category: 'electricity' as const, description: 'Common area electricity bill - Aug', amount: 28500, gstAmount: 0, totalAmount: 28500, vendorId: allVendors[4]?.id, status: 'pending' as const },
        { category: 'repairs' as const, description: 'Elevator maintenance contract', amount: 25000, gstAmount: 4500, totalAmount: 27000, vendorId: allVendors[3]?.id, status: 'paid' as const },
        { category: 'water' as const, description: 'Water tank cleaning', amount: 5500, gstAmount: 990, totalAmount: 6490, vendorId: allVendors[5]?.id, status: 'paid' as const },
        { category: 'insurance' as const, description: 'Building insurance premium', amount: 45000, gstAmount: 8100, totalAmount: 53100, vendorId: allVendors[7]?.id, status: 'paid' as const },
        { category: 'maintenance' as const, description: 'Plumbing repairs - Tower A', amount: 3200, gstAmount: 576, totalAmount: 3776, status: 'pending' as const },
        { category: 'cleaning' as const, description: 'Pressure washing - parking', amount: 4500, gstAmount: 810, totalAmount: 5310, vendorId: allVendors[1]?.id, status: 'approved' as const },
        { category: 'salary' as const, description: 'Staff salary - Aug 2025', amount: 156000, gstAmount: 0, totalAmount: 156000, status: 'paid' as const },
        { category: 'security' as const, description: 'Security services - Jul 2025', amount: 42000, gstAmount: 0, totalAmount: 42000, vendorId: allVendors[0]?.id, status: 'paid' as const },
        { category: 'electricity' as const, description: 'Common area electricity - Jul', amount: 32000, gstAmount: 0, totalAmount: 32000, vendorId: allVendors[4]?.id, status: 'paid' as const },
        { category: 'cleaning' as const, description: 'Housekeeping - Jul 2025', amount: 15000, gstAmount: 2700, totalAmount: 17700, vendorId: allVendors[1]?.id, status: 'paid' as const },
        { category: 'gardening' as const, description: 'Garden maintenance - Jul', amount: 8500, gstAmount: 1530, totalAmount: 10030, vendorId: allVendors[2]?.id, status: 'paid' as const },
        { category: 'salary' as const, description: 'Staff salary - Jul 2025', amount: 156000, gstAmount: 0, totalAmount: 156000, status: 'paid' as const },
        { category: 'maintenance' as const, description: 'AC servicing - Tower B common areas', amount: 8000, gstAmount: 1440, totalAmount: 9440, vendorId: allVendors[10]?.id, status: 'paid' as const },
        { category: 'repairs' as const, description: 'Plumbing emergency - Tower C', amount: 2200, gstAmount: 396, totalAmount: 2596, vendorId: allVendors[11]?.id, status: 'paid' as const },
        { category: 'water' as const, description: 'Borewell maintenance', amount: 7500, gstAmount: 1350, totalAmount: 8850, vendorId: allVendors[5]?.id, status: 'paid' as const },
        { category: 'electricity' as const, description: 'DG set fuel and maintenance', amount: 12000, gstAmount: 0, totalAmount: 12000, vendorId: allVendors[8]?.id, status: 'approved' as const },
        { category: 'cleaning' as const, description: 'Deep cleaning - all towers', amount: 18000, gstAmount: 3240, totalAmount: 21240, vendorId: allVendors[1]?.id, status: 'pending' as const },
        { category: 'maintenance' as const, description: 'Painting - Tower A lobby', amount: 35000, gstAmount: 6300, totalAmount: 41300, vendorId: allVendors[6]?.id, status: 'pending' as const },
        { category: 'security' as const, description: 'Security cameras maintenance', amount: 8500, gstAmount: 1530, totalAmount: 10030, vendorId: allVendors[9]?.id, status: 'approved' as const },
        { category: 'water' as const, description: 'Water pump repair', amount: 4200, gstAmount: 756, totalAmount: 4956, vendorId: allVendors[11]?.id, status: 'paid' as const },
        { category: 'repairs' as const, description: 'Gate barrier repair', amount: 6500, gstAmount: 1170, totalAmount: 7670, vendorId: allVendors[3]?.id, status: 'approved' as const },
        { category: 'other' as const, description: 'Office supplies and printing', amount: 3500, gstAmount: 630, totalAmount: 4130, status: 'paid' as const },
      ]
      await db.insert(expenses).values(expenseData.map((e, i) => ({
        societyId,
        expenseDate: new Date(2025, 3 + Math.floor(i / 5), 1 + (i % 28)),
        ...e,
      }))).execute()
    }
    console.log('✅ Expenses created')

    // ============================================
    // 14b. BANK ACCOUNTS
    // ============================================
    const { bankAccounts: bankAccountsTable } = await import('./schema')
    const [bankCount] = await db.select({ count: drizzleCount() }).from(bankAccountsTable)
    if (bankCount.count === 0) {
      await db.insert(bankAccountsTable).values([
        { societyId, bankName: 'HDFC Bank', accountNumber: '50100012345678', ifscCode: 'HDFC0001234', branch: 'Andheri West', accountType: 'current' as const, balance: 2850000, openingBalance: 2500000 },
        { societyId, bankName: 'ICICI Bank', accountNumber: '12345678901234', ifscCode: 'ICIC0001234', branch: 'Andheri East', accountType: 'savings' as const, balance: 1250000, openingBalance: 1000000 },
        { societyId, bankName: 'SBI', accountNumber: '30123456789', ifscCode: 'SBIN0001234', branch: 'MIDC', accountType: 'fixed_deposit' as const, balance: 5000000, openingBalance: 5000000 },
      ]).execute()
    }
    console.log('✅ Bank Accounts created')

    // ============================================
    // 14c. ACCOUNT HEADS
    // ============================================
    const { accountHeads: accountHeadsTable } = await import('./schema')
    const [headCount] = await db.select({ count: drizzleCount() }).from(accountHeadsTable)
    if (headCount.count === 0) {
      await db.insert(accountHeadsTable).values([
        { societyId, name: 'Bank Account - HDFC', code: '1001', type: 'asset' as const, currentBalance: 2850000 },
        { societyId, name: 'Bank Account - ICICI', code: '1002', type: 'asset' as const, currentBalance: 1250000 },
        { societyId, name: 'Fixed Deposits', code: '1003', type: 'asset' as const, currentBalance: 5000000 },
        { societyId, name: 'Accounts Receivable', code: '1004', type: 'asset' as const, currentBalance: 185000 },
        { societyId, name: 'Security Deposits', code: '2001', type: 'liability' as const, currentBalance: 450000 },
        { societyId, name: 'Advance Payments', code: '2002', type: 'liability' as const, currentBalance: 125000 },
        { societyId, name: 'Maintenance Income', code: '3001', type: 'income' as const, currentBalance: 890000 },
        { societyId, name: 'Parking Income', code: '3002', type: 'income' as const, currentBalance: 120000 },
        { societyId, name: 'Amenity Income', code: '3003', type: 'income' as const, currentBalance: 45000 },
        { societyId, name: 'Security Expense', code: '4001', type: 'expense' as const, currentBalance: 168000 },
        { societyId, name: 'Electricity Expense', code: '4002', type: 'expense' as const, currentBalance: 228000 },
        { societyId, name: 'Maintenance Expense', code: '4003', type: 'expense' as const, currentBalance: 85000 },
      ]).execute()
    }
    console.log('✅ Account Heads created')

    // ============================================
    // 14d. JOURNAL VOUCHERS (8 vouchers)
    // ============================================
    const { journalVouchers: journalVouchersTable } = await import('./schema')
    const [voucherCount] = await db.select({ count: drizzleCount() }).from(journalVouchersTable)
    if (voucherCount.count === 0) {
      const allHeads = await db.select().from(accountHeadsTable)
      await db.insert(journalVouchersTable).values([
        { societyId, voucherNumber: 'JV-2025-001', date: new Date(2025, 3, 1), type: 'journal' as const, narration: 'Opening balance transfer', debitAccountHeadId: allHeads[0]?.id, creditAccountHeadId: allHeads[6]?.id, amount: 500000, status: 'posted' as const },
        { societyId, voucherNumber: 'JV-2025-002', date: new Date(2025, 4, 5), type: 'receipt' as const, narration: 'Maintenance collection - May', debitAccountHeadId: allHeads[0]?.id, creditAccountHeadId: allHeads[6]?.id, amount: 185000, status: 'posted' as const },
        { societyId, voucherNumber: 'JV-2025-003', date: new Date(2025, 5, 10), type: 'payment' as const, narration: 'Security vendor payment - Jun', debitAccountHeadId: allHeads[9]?.id, creditAccountHeadId: allHeads[0]?.id, amount: 42000, status: 'posted' as const },
        { societyId, voucherNumber: 'JV-2025-004', date: new Date(2025, 6, 15), type: 'payment' as const, narration: 'Electricity bill - Jul', debitAccountHeadId: allHeads[10]?.id, creditAccountHeadId: allHeads[0]?.id, amount: 28500, status: 'posted' as const },
        { societyId, voucherNumber: 'JV-2025-005', date: new Date(2025, 6, 20), type: 'adjustment' as const, narration: 'Security deposit refund', debitAccountHeadId: allHeads[4]?.id, creditAccountHeadId: allHeads[0]?.id, amount: 25000, status: 'posted' as const },
        { societyId, voucherNumber: 'JV-2025-006', date: new Date(2025, 7, 1), type: 'receipt' as const, narration: 'Parking income collection', debitAccountHeadId: allHeads[0]?.id, creditAccountHeadId: allHeads[7]?.id, amount: 30000, status: 'posted' as const },
        { societyId, voucherNumber: 'JV-2025-007', date: new Date(2025, 7, 5), type: 'payment' as const, narration: 'Elevator maintenance payment', debitAccountHeadId: allHeads[11]?.id, creditAccountHeadId: allHeads[0]?.id, amount: 25000, status: 'posted' as const },
        { societyId, voucherNumber: 'JV-2025-008', date: new Date(2025, 7, 15), type: 'journal' as const, narration: 'Transfer to sinking fund', debitAccountHeadId: allHeads[0]?.id, creditAccountHeadId: allHeads[2]?.id, amount: 100000, status: 'approved' as const },
      ]).execute()
    }
    console.log('✅ Journal Vouchers created')

    // ============================================
    // 14e. RECURRING EXPENSES
    // ============================================
    const { recurringExpenses: recurringExpensesTable } = await import('./schema')
    const [recurringCount] = await db.select({ count: drizzleCount() }).from(recurringExpensesTable)
    if (recurringCount.count === 0) {
      await db.insert(recurringExpensesTable).values([
        { societyId, vendorId: allVendors[0]?.id, category: 'security', description: 'Monthly security services', amount: 42000, frequency: 'monthly' as const, nextDueDate: new Date(2025, 8, 1), totalPaid: 6 },
        { societyId, vendorId: allVendors[1]?.id, category: 'cleaning', description: 'Monthly housekeeping', amount: 15000, frequency: 'monthly' as const, nextDueDate: new Date(2025, 8, 1), totalPaid: 6 },
        { societyId, vendorId: allVendors[2]?.id, category: 'gardening', description: 'Monthly garden maintenance', amount: 8500, frequency: 'monthly' as const, nextDueDate: new Date(2025, 8, 1), totalPaid: 6 },
        { societyId, vendorId: allVendors[3]?.id, category: 'repairs', description: 'Quarterly elevator maintenance', amount: 25000, frequency: 'quarterly' as const, nextDueDate: new Date(2025, 9, 1), totalPaid: 2 },
        { societyId, vendorId: allVendors[7]?.id, category: 'insurance', description: 'Annual building insurance', amount: 45000, frequency: 'yearly' as const, nextDueDate: new Date(2026, 0, 1), totalPaid: 1 },
        { societyId, vendorId: allVendors[4]?.id, category: 'electricity', description: 'Monthly electricity bill', amount: 30000, frequency: 'monthly' as const, nextDueDate: new Date(2025, 8, 5), totalPaid: 6 },
        { societyId, vendorId: allVendors[5]?.id, category: 'water', description: 'Monthly water supply charges', amount: 8000, frequency: 'monthly' as const, nextDueDate: new Date(2025, 8, 1), totalPaid: 6 },
      ]).execute()
    }
    console.log('✅ Recurring Expenses created')

    // ============================================
    // 15. SERVICE CATEGORIES & REQUESTS (20 requests)
    // ============================================
    const [catCount] = await db.select({ count: drizzleCount() }).from(serviceCategories)
    if (catCount.count === 0) {
      await db.insert(serviceCategories).values([
        { societyId, name: 'Plumbing', icon: '🔧', color: '#3B82F6', slaHours: 24 },
        { societyId, name: 'Electrical', icon: '⚡', color: '#F59E0B', slaHours: 24 },
        { societyId, name: 'Carpentry', icon: '🪚', color: '#10B981', slaHours: 48 },
        { societyId, name: 'Painting', icon: '🎨', color: '#8B5CF6', slaHours: 72 },
        { societyId, name: 'Cleaning', icon: '🧹', color: '#06B6D4', slaHours: 24 },
        { societyId, name: 'Security', icon: '🛡️', color: '#EF4444', slaHours: 4 },
        { societyId, name: 'Gardening', icon: '🌿', color: '#22C55E', slaHours: 48 },
        { societyId, name: 'Other', icon: '📋', color: '#6B7280', slaHours: 72 },
      ]).execute()
    }

    const allCategories = await db.select().from(serviceCategories)
    const [srCount] = await db.select({ count: drizzleCount() }).from(serviceRequests)
    if (srCount.count === 0 && allMembers.length > 0) {
      const srData = [
        { flatId: allFlats[5]?.id, memberId: allMembers[2]?.id, categoryId: allCategories[0]?.id, title: 'Water leakage in bathroom', description: 'Water leaking from ceiling near shower.', priority: 'high' as const, status: 'open' as const },
        { flatId: allFlats[10]?.id, memberId: allMembers[3]?.id, categoryId: allCategories[1]?.id, title: 'Fan not working in bedroom', description: 'Ceiling fan stopped working.', priority: 'medium' as const, status: 'in_progress' as const },
        { flatId: allFlats[15]?.id, memberId: allMembers[4]?.id, categoryId: allCategories[5]?.id, title: 'Main gate lock jammed', description: 'Gate lock needs replacement.', priority: 'urgent' as const, status: 'open' as const },
        { flatId: allFlats[20]?.id, memberId: allMembers[0]?.id, categoryId: allCategories[6]?.id, title: 'Garden landscaping needed', description: 'New flower beds required.', priority: 'low' as const, status: 'resolved' as const, rating: 5, resolutionNotes: 'Completed successfully' },
        { flatId: allFlats[25]?.id, memberId: allMembers[5]?.id, categoryId: allCategories[3]?.id, title: 'Paint peeling in living room', description: 'Moisture damage to walls.', priority: 'low' as const, status: 'closed' as const },
        { flatId: allFlats[30]?.id, memberId: allMembers[6]?.id, categoryId: allCategories[0]?.id, title: 'AC not cooling properly', description: 'AC running but not cooling.', priority: 'medium' as const, status: 'open' as const },
        { flatId: allFlats[35]?.id, memberId: allMembers[7]?.id, categoryId: allCategories[4]?.id, title: 'Common area cleaning', description: '3rd floor common area dirty.', priority: 'medium' as const, status: 'in_progress' as const },
        { flatId: allFlats[0]?.id, memberId: allMembers[1]?.id, categoryId: allCategories[2]?.id, title: 'Door frame repair', description: 'Wooden door frame damaged.', priority: 'low' as const, status: 'open' as const },
        { flatId: allFlats[7]?.id, memberId: allMembers[7]?.id, categoryId: allCategories[0]?.id, title: 'Kitchen sink blockage', description: 'Water not draining from kitchen sink.', priority: 'high' as const, status: 'open' as const },
        { flatId: allFlats[12]?.id, memberId: allMembers[11]?.id, categoryId: allCategories[1]?.id, title: 'Power outage in flat', description: 'MCB keeps tripping.', priority: 'urgent' as const, status: 'in_progress' as const },
        { flatId: allFlats[18]?.id, memberId: allMembers[17]?.id, categoryId: allCategories[4]?.id, title: 'Pest control needed', description: 'Ants and cockroaches in kitchen.', priority: 'medium' as const, status: 'open' as const },
        { flatId: allFlats[22]?.id, memberId: allMembers[21]?.id, categoryId: allCategories[2]?.id, title: 'Window grill repair', description: 'Rusted window grill in balcony.', priority: 'low' as const, status: 'resolved' as const, rating: 4 },
        { flatId: allFlats[3]?.id, memberId: allMembers[3]?.id, categoryId: allCategories[5]?.id, title: 'Visitor parking violation', description: 'Non-resident parked in resident slot.', priority: 'medium' as const, status: 'closed' as const },
        { flatId: allFlats[28]?.id, memberId: allMembers[27]?.id, categoryId: allCategories[0]?.id, title: 'Geyser not heating', description: 'Water heater not working since morning.', priority: 'high' as const, status: 'open' as const },
        { flatId: allFlats[33]?.id, memberId: allMembers[32]?.id, categoryId: allCategories[1]?.id, title: 'Street light not working', description: 'Street light near Tower D entrance off.', priority: 'medium' as const, status: 'in_progress' as const },
        { flatId: allFlats[8]?.id, memberId: allMembers[8]?.id, categoryId: allCategories[3]?.id, title: 'Staircase painting required', description: 'Tower B staircase walls need repainting.', priority: 'low' as const, status: 'open' as const },
        { flatId: allFlats[14]?.id, memberId: allMembers[14]?.id, categoryId: allCategories[6]?.id, title: 'Tree branch falling hazard', description: 'Large tree branch overhanging Tower C.', priority: 'high' as const, status: 'open' as const },
        { flatId: allFlats[24]?.id, memberId: allMembers[24]?.id, categoryId: allCategories[4]?.id, title: 'Elevator deep cleaning', description: 'Elevator in Tower A needs deep cleaning.', priority: 'medium' as const, status: 'on_hold' as const },
        { flatId: allFlats[37]?.id, memberId: allMembers[37]?.id, categoryId: allCategories[7]?.id, title: 'CCTV not recording', description: 'Camera near service gate not recording.', priority: 'high' as const, status: 'in_progress' as const },
        { flatId: allFlats[4]?.id, memberId: allMembers[4]?.id, categoryId: allCategories[0]?.id, title: 'Toilet seat replacement', description: 'Cracked toilet seat in master bathroom.', priority: 'low' as const, status: 'resolved' as const, rating: 5, resolutionNotes: 'Replaced with new seat' },
      ]
      await db.insert(serviceRequests).values(srData.map((sr, i) => ({
        societyId, ...sr,
        ticketNumber: `TKT-2025-${String(1000 + i).padStart(4, '0')}`,
        assignedTo: pick(allStaff, i)?.id,
        createdAt: new Date(2025, 5 + Math.floor(i / 7), 1 + (i % 28)),
      }))).execute()
    }
    console.log('✅ Service Requests created (20)')

    // ============================================
    // 16. NOTICES (15 notices)
    // ============================================
    const [noticeCount] = await db.select({ count: drizzleCount() }).from(notices)
    if (noticeCount.count === 0 && allMembers.length > 0) {
      await db.insert(notices).values([
        { societyId, title: 'Annual General Meeting - 25th August', content: 'AGM will be held on 25th August at 6 PM. Agenda: budget approval, elections, infrastructure proposals.', postedBy: allMembers[0]?.id, priority: 'high' as const, isPinned: true, targetAudience: 'all' as const, isActive: true },
        { societyId, title: 'Water Supply Disruption Notice', content: 'Pipeline maintenance on 22nd Aug, 10 AM - 4 PM. Store water accordingly.', postedBy: allMembers[2]?.id, priority: 'medium' as const, targetAudience: 'all' as const, isActive: true },
        { societyId, title: 'New Security Protocol', content: 'Starting 1st Sept, all visitors must be pre-registered through the society app.', postedBy: allMembers[0]?.id, priority: 'high' as const, targetAudience: 'all' as const, isActive: true },
        { societyId, title: 'Garden Maintenance Schedule', content: 'Garden maintained every Tuesday and Thursday. Please keep common areas clean.', postedBy: allMembers[2]?.id, priority: 'low' as const, targetAudience: 'all' as const, isActive: true },
        { societyId, title: 'Diwali Celebration Planning', content: 'Grand Diwali celebration with cultural programs and fireworks. Volunteers needed.', postedBy: allMembers[2]?.id, priority: 'medium' as const, targetAudience: 'all' as const, isActive: true },
        { societyId, title: 'Monthly Maintenance Reminder', content: 'August maintenance due by 10th. Late fee of 2% after due date.', postedBy: allMembers[3]?.id, priority: 'medium' as const, targetAudience: 'all' as const, isActive: true },
        { societyId, title: 'CCTV Installation Update', content: 'New cameras installed at all entry points. System fully operational.', postedBy: allMembers[0]?.id, priority: 'low' as const, targetAudience: 'all' as const, isActive: true },
        { societyId, title: 'Tower B Lift Maintenance', content: 'Lift #2 in Tower B will be under maintenance on 30th Aug, 9 AM - 5 PM.', postedBy: allMembers[0]?.id, priority: 'high' as const, targetAudience: 'specific_tower' as const, isActive: true },
        { societyId, title: 'Car Wash Day', content: 'Monthly car wash on 1st Sunday. Bring vehicles to parking area by 8 AM.', postedBy: allMembers[2]?.id, priority: 'low' as const, targetAudience: 'all' as const, isActive: true },
        { societyId, title: 'Garbage Collection Timing Update', content: 'New garbage collection timing: 7-9 AM and 6-8 PM. Please segregate waste.', postedBy: allMembers[3]?.id, priority: 'medium' as const, targetAudience: 'all' as const, isActive: true },
        { societyId, title: 'Fitness Boot Camp', description: 'Free fitness boot camp every Saturday morning at 6 AM in the garden.', content: 'Join us for a free fitness boot camp every Saturday at 6 AM.', postedBy: allMembers[8]?.id, priority: 'low' as const, targetAudience: 'all' as const, isActive: true },
        { societyId, title: 'Rooftop Solar Panel Installation', content: 'Solar panels being installed on Tower A and B rooftops next month.', postedBy: allMembers[0]?.id, priority: 'medium' as const, targetAudience: 'all' as const, isActive: true },
        { societyId, title: 'Children Art Competition', content: 'Art competition for kids under 12. Registration at society office.', postedBy: allMembers[11]?.id, priority: 'low' as const, targetAudience: 'all' as const, isActive: true },
        { societyId, title: 'Fire Safety Drill - 5th Sept', content: 'Mandatory fire safety drill on 5th Sept at 4 PM. All residents must participate.', postedBy: allMembers[0]?.id, priority: 'high' as const, targetAudience: 'all' as const, isActive: true },
        { societyId, title: 'Society Rule Book Update', content: 'Updated rule book available at the office. Key changes: pet policy, parking rules.', postedBy: allMembers[0]?.id, priority: 'medium' as const, targetAudience: 'all' as const, isActive: true },
      ]).execute()
    }
    console.log('✅ Notices created (15)')

    // ============================================
    // 17. MEETINGS (10 meetings)
    // ============================================
    const [meetingCount] = await db.select({ count: drizzleCount() }).from(meetings)
    if (meetingCount.count === 0 && allMembers.length > 0) {
      await db.insert(meetings).values([
        { societyId, title: 'Annual General Meeting 2025', description: 'Annual budget, new projects, elections.', meetingDate: new Date(2025, 7, 25, 18, 0), location: 'Community Hall', organizedBy: allMembers[0]?.id, status: 'scheduled' as const },
        { societyId, title: 'Security Committee Meeting', description: 'Security protocols and CCTV review.', meetingDate: new Date(2025, 7, 20, 17, 0), location: 'Meeting Room', organizedBy: allMembers[2]?.id, status: 'scheduled' as const },
        { societyId, title: 'Budget Review Meeting', description: 'Q2 budget review and expense approval.', meetingDate: new Date(2025, 7, 10, 16, 0), location: 'Community Hall', organizedBy: allMembers[3]?.id, status: 'completed' as const },
        { societyId, title: 'Emergency Maintenance Meeting', description: 'Urgent repairs in Tower B.', meetingDate: new Date(2025, 6, 25, 19, 0), location: 'Online (Zoom)', organizedBy: allMembers[0]?.id, status: 'completed' as const },
        { societyId, title: 'Garden Beautification Planning', description: 'Planning for new plants and landscaping.', meetingDate: new Date(2025, 8, 5, 17, 30), location: 'Community Hall', organizedBy: allMembers[2]?.id, status: 'scheduled' as const },
        { societyId, title: 'Fire Safety Committee Meeting', description: 'Fire safety equipment audit and drill planning.', meetingDate: new Date(2025, 8, 1, 17, 0), location: 'Meeting Room', organizedBy: allMembers[0]?.id, status: 'scheduled' as const },
        { societyId, title: 'New Amenities Discussion', description: 'Discussion on adding swimming pool and gym upgrades.', meetingDate: new Date(2025, 6, 15, 18, 0), location: 'Community Hall', organizedBy: allMembers[3]?.id, status: 'completed' as const },
        { societyId, title: 'Festival Planning Committee', description: 'Planning for Ganesh Chaturthi and Diwali celebrations.', meetingDate: new Date(2025, 7, 15, 17, 0), location: 'Party Lawn', organizedBy: allMembers[2]?.id, status: 'completed' as const },
        { societyId, title: 'Parking Rules Review', description: 'Review and update parking allocation rules.', meetingDate: new Date(2025, 8, 10, 16, 30), location: 'Meeting Room', organizedBy: allMembers[0]?.id, status: 'scheduled' as const },
        { societyId, title: 'Quarterly Financial Review', description: 'Q3 financial performance and projections.', meetingDate: new Date(2025, 9, 1, 17, 0), location: 'Community Hall', organizedBy: allMembers[3]?.id, status: 'scheduled' as const },
      ]).execute()
    }
    console.log('✅ Meetings created (10)')

    // ============================================
    // 18. VISITORS (25 visitors)
    // ============================================
    const [visitorCount] = await db.select({ count: drizzleCount() }).from(visitors)
    if (visitorCount.count === 0 && allMembers.length > 0) {
      const visitorNames = [
        'Ravi Sharma', 'Neha Gupta', 'Amazon Delivery', 'Suresh Electricals', 'Milkman Raju',
        'Dr. Mehta', 'Flipkart Delivery', 'Swiggy Delivery', 'Zomato Delivery', 'Carpenter Mohan',
        'Plumber Raju', 'Painting Contractor', 'Interior Designer', 'TV Repair Guy', 'AC Service Technician',
        'Gas Cylinder Delivery', 'Courier - BlueDart', 'Courier - DTDC', 'Grocery Delivery', 'Friend - Rahul',
        'Cousin - Priya', 'Uncle - Mahesh', 'Aunt - Shobha', 'Security Auditor', 'Bank Representative',
      ]
      const purposes = [
        'Personal visit', 'Package delivery', 'Package delivery', 'Maintenance', 'Daily milk delivery',
        'Medical visit', 'Package delivery', 'Food delivery', 'Food delivery', 'Carpentry work',
        'Plumbing repair', 'Painting quote', 'Interior consultation', 'TV repair', 'AC servicing',
        'Gas delivery', 'Document delivery', 'Document delivery', 'Grocery delivery', 'Personal visit',
        'Family visit', 'Family visit', 'Family visit', 'Security audit', 'Bank work',
      ]
      const statuses = ['checked_out', 'inside', 'checked_out', 'inside', 'checked_out',
        'inside', 'checked_out', 'checked_out', 'checked_out', 'inside',
        'inside', 'checked_out', 'inside', 'checked_out', 'inside',
        'checked_out', 'checked_out', 'checked_out', 'checked_out', 'inside',
        'inside', 'inside', 'checked_out', 'inside', 'checked_out',
      ]

      const visitorData = visitorNames.map((name, i) => ({
        societyId, name, phone: `+91 99887 ${String(70000 + i).padStart(5, '0')}`,
        purpose: purposes[i],
        flatId: allFlats[i % allFlats.length]?.id || allFlats[0]?.id,
        visitingMemberId: allMembers[i % Math.min(allMembers.length, 15)]?.id,
        gateId: gateIds[i % gateIds.length],
        entryTime: new Date(2025, 7, 18 + Math.floor(i / 8), 7 + (i % 14), (i * 13) % 60),
        exitTime: statuses[i] === 'checked_out' ? new Date(2025, 7, 18 + Math.floor(i / 8), 10 + (i % 10), (i * 7) % 60) : undefined,
        vehicleNumber: i % 3 === 0 ? `MH${12 + (i % 5)}${String.fromCharCode(65 + i)}${String(1000 + i * 77).slice(0, 4)}` : undefined,
        status: statuses[i] as any,
        noOfVisitors: i % 5 === 0 ? 3 : i % 3 === 0 ? 2 : 1,
      }))
      await db.insert(visitors).values(visitorData).execute()
    }
    console.log('✅ Visitors created (25)')

    // ============================================
    // 19. AMENITIES (8 amenities)
    // ============================================
    const [amenityCount] = await db.select({ count: drizzleCount() }).from(amenities)
    if (amenityCount.count === 0) {
      const amenityData = [
        { name: 'Swimming Pool', description: 'Olympic size pool with kids pool', category: 'sports' as const, type: 'paid' as const, price: 200, capacity: 30, requiresApproval: true, maxBookingDuration: 120, maxBookingsPerDay: 3, maxCancellations: 2, cancellationCharge: 100, allowGuests: true, maxGuests: 3 },
        { name: 'Gym', description: 'Fully equipped gym with trainer', category: 'fitness' as const, type: 'free' as const, price: 0, capacity: 20, requiresApproval: false, maxBookingDuration: 60, maxBookingsPerDay: 2 },
        { name: 'Community Hall', description: 'Large hall with projector and sound', category: 'community' as const, type: 'paid' as const, price: 500, capacity: 100, requiresApproval: true, maxBookingDuration: 240, maxBookingsPerDay: 1, maxCancellations: 1, cancellationCharge: 250, allowGuests: true, maxGuests: 50 },
        { name: 'Badminton Court', description: 'Indoor badminton court', category: 'sports' as const, type: 'free' as const, price: 0, capacity: 4, requiresApproval: false, maxBookingDuration: 60, maxBookingsPerDay: 2 },
        { name: 'Kids Play Area', description: 'Outdoor play area for children', category: 'kids' as const, type: 'free' as const, price: 0, capacity: 15, requiresApproval: false, maxBookingDuration: 120 },
        { name: 'Party Lawn', description: 'Open lawn for parties', category: 'recreation' as const, type: 'paid' as const, price: 1000, capacity: 50, requiresApproval: true, maxBookingDuration: 360, maxBookingsPerDay: 1, cancellationCharge: 500, allowGuests: true, maxGuests: 30 },
        { name: 'Yoga Room', description: 'Dedicated yoga and meditation room', category: 'fitness' as const, type: 'free' as const, price: 0, capacity: 10, requiresApproval: false, maxBookingDuration: 60, maxBookingsPerDay: 3 },
        { name: 'Library', description: 'Quiet reading room with books', category: 'community' as const, type: 'free' as const, price: 0, capacity: 8, requiresApproval: false, maxBookingDuration: 120 },
      ]
      await db.insert(amenities).values(amenityData.map(a => ({ societyId, ...a }))).execute()
      const insertedAmenities = await db.select().from(amenities)

      for (const amenity of insertedAmenities) {
        const slots = []
        for (let hour = 6; hour < 22; hour += 2) {
          slots.push({
            amenityId: amenity.id,
            startTime: `${String(hour).padStart(2, '0')}:00`,
            endTime: `${String(hour + 2).padStart(2, '0')}:00`,
            price: 0, maxCapacity: 5,
          })
        }
        await db.insert(amenitySlots).values(slots).execute()
      }
    }
    console.log('✅ Amenities created')

    // ============================================
    // 20. AMENITY BOOKINGS (15 bookings)
    // ============================================
    const [bookingCount] = await db.select({ count: drizzleCount() }).from(amenityBookings)
    if (bookingCount.count === 0 && allMembers.length > 0) {
      const allAmenities = await db.select().from(amenities)
      const bookingStatuses = ['confirmed', 'completed', 'confirmed', 'pending', 'completed', 'confirmed', 'completed', 'cancelled', 'confirmed', 'completed', 'pending', 'confirmed', 'completed', 'confirmed', 'completed'] as const
      const bookingData = allMembers.slice(0, 15).map((m, i) => ({
        amenityId: allAmenities[i % allAmenities.length]?.id || 1,
        memberId: m.id,
        flatId: m.flatId || allFlats[0]?.id,
        bookingDate: new Date(2025, 7, 18 + (i % 10)),
        startTime: `${String(6 + (i % 8) * 2).padStart(2, '0')}:00`,
        endTime: `${String(8 + (i % 8) * 2).padStart(2, '0')}:00`,
        guests: i % 4 === 0 ? 3 : 1,
        totalAmount: [200, 0, 500, 0, 0, 1000, 0, 0, 200, 0, 0, 500, 0, 200, 0][i],
        status: bookingStatuses[i],
      }))
      await db.insert(amenityBookings).values(bookingData).execute()
    }
    console.log('✅ Amenity Bookings created (15)')

    // ============================================
    // 21. PETS (12 pets)
    // ============================================
    const [petCount] = await db.select({ count: drizzleCount() }).from(pets)
    if (petCount.count === 0 && allMembers.length > 0) {
      await db.insert(pets).values([
        { memberId: allMembers[1]?.id, flatId: allFlats[0]?.id, name: 'Buddy', type: 'dog' as const, breed: 'Golden Retriever', age: 3, weight: 30, color: 'Golden', gender: 'male' as const, vaccinationStatus: 'Up to date' },
        { memberId: allMembers[4]?.id, flatId: allFlats[3]?.id, name: 'Whiskers', type: 'cat' as const, breed: 'Persian', age: 2, weight: 5, color: 'White', gender: 'female' as const, vaccinationStatus: 'Up to date' },
        { memberId: allMembers[6]?.id, flatId: allFlats[5]?.id, name: 'Tweety', type: 'bird' as const, breed: 'Canary', age: 1, weight: 0.03, color: 'Yellow', gender: 'male' as const, vaccinationStatus: 'N/A' },
        { memberId: allMembers[8]?.id, flatId: allFlats[7]?.id, name: 'Nemo', type: 'fish' as const, breed: 'Clownfish', age: 1, weight: 0.01, color: 'Orange', gender: 'male' as const, vaccinationStatus: 'N/A' },
        { memberId: allMembers[10]?.id, flatId: allFlats[9]?.id, name: 'Max', type: 'dog' as const, breed: 'Labrador', age: 5, weight: 35, color: 'Black', gender: 'male' as const, vaccinationStatus: 'Up to date' },
        { memberId: allMembers[12]?.id, flatId: allFlats[11]?.id, name: 'Lucy', type: 'cat' as const, breed: 'Siamese', age: 3, weight: 4, color: 'Cream', gender: 'female' as const, vaccinationStatus: 'Up to date' },
        { memberId: allMembers[14]?.id, flatId: allFlats[13]?.id, name: 'Rocky', type: 'dog' as const, breed: 'German Shepherd', age: 4, weight: 38, color: 'Black & Tan', gender: 'male' as const, vaccinationStatus: 'Up to date' },
        { memberId: allMembers[16]?.id, flatId: allFlats[15]?.id, name: 'Molly', type: 'dog' as const, breed: 'Beagle', age: 2, weight: 12, color: 'Tricolor', gender: 'female' as const, vaccinationStatus: 'Up to date' },
        { memberId: allMembers[18]?.id, flatId: allFlats[17]?.id, name: 'Kiwi', type: 'bird' as const, breed: 'Parrot', age: 5, weight: 0.3, color: 'Green', gender: 'male' as const, vaccinationStatus: 'N/A' },
        { memberId: allMembers[20]?.id, flatId: allFlats[19]?.id, name: 'Bruno', type: 'dog' as const, breed: 'Pomeranian', age: 1, weight: 3, color: 'Orange', gender: 'male' as const, vaccinationStatus: 'Up to date' },
        { memberId: allMembers[22]?.id, flatId: allFlats[21]?.id, name: 'Cleo', type: 'cat' as const, breed: 'Ragdoll', age: 2, weight: 6, color: 'Seal Point', gender: 'female' as const, vaccinationStatus: 'Up to date' },
        { memberId: allMembers[24]?.id, flatId: allFlats[23]?.id, name: 'Goldie', type: 'fish' as const, breed: 'Goldfish', age: 1, weight: 0.02, color: 'Gold', gender: 'male' as const, vaccinationStatus: 'N/A' },
      ]).execute()
    }
    console.log('✅ Pets created (12)')

    // ============================================
    // 22. HOLIDAYS
    // ============================================
    const [holidayCount] = await db.select({ count: drizzleCount() }).from(holidays)
    if (holidayCount.count === 0) {
      await db.insert(holidays).values([
        { societyId, name: 'Independence Day', date: new Date(2025, 7, 15), type: 'public' as const },
        { societyId, name: 'Ganesh Chaturthi', date: new Date(2025, 8, 27), type: 'public' as const },
        { societyId, name: 'Gandhi Jayanti', date: new Date(2025, 9, 2), type: 'public' as const },
        { societyId, name: 'Dussehra', date: new Date(2025, 9, 20), type: 'public' as const },
        { societyId, name: 'Diwali', date: new Date(2025, 9, 31), type: 'public' as const },
        { societyId, name: 'Society Founding Day', date: new Date(2025, 0, 15), type: 'society' as const },
        { societyId, name: 'Republic Day', date: new Date(2026, 0, 26), type: 'public' as const },
        { societyId, name: 'Holi', date: new Date(2026, 2, 10), type: 'public' as const },
        { societyId, name: 'Ambedkar Jayanti', date: new Date(2025, 3, 14), type: 'public' as const },
        { societyId, name: 'May Day', date: new Date(2025, 4, 1), type: 'society' as const },
      ]).execute()
    }
    console.log('✅ Holidays created (10)')

    // ============================================
    // 23. FINE RULES
    // ============================================
    const [fineCount] = await db.select({ count: drizzleCount() }).from(fineRules)
    if (fineCount.count === 0) {
      await db.insert(fineRules).values([
        { societyId, name: 'Late Payment Fee', description: 'Fee for late maintenance payment', type: 'percentage' as const, percentage: 2, maxAmount: 1000, triggerOn: 'late_payment', gracePeriodDays: 5 },
        { societyId, name: 'Noise Violation', description: 'Fine for noise during restricted hours (10 PM - 7 AM)', type: 'flat_amount' as const, amount: 500, triggerOn: 'noise' },
        { societyId, name: 'Parking Violation', description: 'Fine for parking in non-allotted space', type: 'flat_amount' as const, amount: 200, triggerOn: 'parking' },
        { societyId, name: 'Pet Rule Violation', description: 'Fine for not cleaning up after pets', type: 'flat_amount' as const, amount: 300, triggerOn: 'pet_violation' },
        { societyId, name: 'Common Area Damage', description: 'Fine for damage to common areas', type: 'flat_amount' as const, amount: 1000, triggerOn: 'damage' },
        { societyId, name: 'Littering Fine', description: 'Fine for littering in common areas', type: 'flat_amount' as const, amount: 200, triggerOn: 'littering' },
        { societyId, name: 'Unauthorized Construction', description: 'Fine for unauthorized modifications', type: 'flat_amount' as const, amount: 5000, triggerOn: 'unauthorized_construction' },
      ]).execute()
    }
    console.log('✅ Fine Rules created (7)')

    // ============================================
    // 24. EMERGENCY CONTACTS
    // ============================================
    const [ecCount] = await db.select({ count: drizzleCount() }).from(emergencyContacts)
    if (ecCount.count === 0 && allMembers.length > 0) {
      const ecData = allMembers.slice(0, 15).map((m, i) => ({
        memberId: m.id,
        name: m.emergencyContactName || `Emergency Contact ${i + 1}`,
        phone: m.emergencyContactPhone || `+91 98765 ${String(99900 + i).padStart(5, '0')}`,
        relationship: m.emergencyContactRelation || 'Spouse',
        isPrimary: true,
      }))
      await db.insert(emergencyContacts).values(ecData).execute()
    }
    console.log('✅ Emergency Contacts created (15)')

    // ============================================
    // 25. DAILY HELP (10 entries)
    // ============================================
    const [dailyHelpCount] = await db.select({ count: drizzleCount() }).from(dailyHelp)
    if (dailyHelpCount.count === 0 && allMembers.length > 0) {
      const dailyHelpData = [
        { memberId: allMembers[1]?.id, name: 'Lakshmi Bai', phone: '+91 98765 60001', type: 'maid' as const, timings: '8:00 AM - 12:00 PM' },
        { memberId: allMembers[3]?.id, name: 'Renuka Devi', phone: '+91 98765 60002', type: 'maid' as const, timings: '9:00 AM - 1:00 PM' },
        { memberId: allMembers[5]?.id, name: 'Prakash Yadav', phone: '+91 98765 60003', type: 'cook' as const, timings: '6:00 AM - 9:00 AM' },
        { memberId: allMembers[7]?.id, name: 'Sarojini Patil', phone: '+91 98765 60004', type: 'maid' as const, timings: '8:00 AM - 12:00 PM' },
        { memberId: allMembers[9]?.id, name: 'Asha Jadhav', phone: '+91 98765 60005', type: 'nurse' as const, timings: '7:00 AM - 7:00 PM' },
        { memberId: allMembers[11]?.id, name: 'Baburao More', phone: '+91 98765 60006', type: 'driver' as const, timings: '8:00 AM - 6:00 PM' },
        { memberId: allMembers[13]?.id, name: 'Sunita Pawar', phone: '+91 98765 60007', type: 'maid' as const, timings: '7:00 AM - 11:00 AM' },
        { memberId: allMembers[15]?.id, name: 'Mangal Kute', phone: '+91 98765 60008', type: 'other' as const, timings: '6:00 AM - 7:00 AM' },
        { memberId: allMembers[17]?.id, name: 'Kamalakar Shinde', phone: '+91 98765 60009', type: 'other' as const, timings: 'Flexible' },
        { memberId: allMembers[19]?.id, name: 'Ramesh Gaikwad', phone: '+91 98765 60010', type: 'other' as const, timings: 'Flexible' },
      ]
      await db.insert(dailyHelp).values(dailyHelpData).execute()
    }
    console.log('✅ Daily Help created (10)')

    // ============================================
    // 26. PRE-APPROVALS (8 entries)
    // ============================================
    const [preApprovalCount] = await db.select({ count: drizzleCount() }).from(preApprovals)
    if (preApprovalCount.count === 0 && allMembers.length > 0) {
      const preApprovalData = [
        { visitorName: 'Neha Gupta', visitorPhone: '+91 98765 11111', visitorType: 'guest' as const, flatId: allFlats[5]?.id, memberId: allMembers[5]?.id, validFrom: new Date(2025, 7, 20), validUntil: new Date(2025, 7, 21), status: 'used' as const },
        { visitorName: 'Suresh Electricals', visitorPhone: '+91 98765 33333', visitorType: 'vendor' as const, flatId: allFlats[20]?.id, memberId: allMembers[20]?.id, validFrom: new Date(2025, 7, 22), validUntil: new Date(2025, 7, 22), status: 'used' as const },
        { visitorName: 'Amazon Delivery', visitorPhone: '+91 98765 22222', visitorType: 'delivery' as const, flatId: allFlats[10]?.id, memberId: allMembers[10]?.id, validFrom: new Date(2025, 7, 23), validUntil: new Date(2025, 7, 23), status: 'used' as const },
        { visitorName: 'Carpenter Ramesh', visitorPhone: '+91 98765 44444', visitorType: 'vendor' as const, flatId: allFlats[25]?.id, memberId: allMembers[25]?.id, validFrom: new Date(2025, 7, 25), validUntil: new Date(2025, 7, 26), status: 'active' as const },
        { visitorName: 'AC Service Team', visitorPhone: '+91 98765 55555', visitorType: 'vendor' as const, flatId: allFlats[30]?.id, memberId: allMembers[30]?.id, validFrom: new Date(2025, 7, 24), validUntil: new Date(2025, 7, 24), status: 'used' as const },
        { visitorName: 'Painting Team', visitorPhone: '+91 98765 66666', visitorType: 'vendor' as const, flatId: allFlats[8]?.id, memberId: allMembers[8]?.id, validFrom: new Date(2025, 8, 1), validUntil: new Date(2025, 8, 5), status: 'active' as const },
        { visitorName: 'Plumber Raju', visitorPhone: '+91 98765 77777', visitorType: 'vendor' as const, flatId: allFlats[15]?.id, memberId: allMembers[15]?.id, validFrom: new Date(2025, 8, 10), validUntil: new Date(2025, 8, 15), status: 'active' as const },
        { visitorName: 'Movers & Packers', visitorPhone: '+91 98765 88888', visitorType: 'vendor' as const, flatId: allFlats[35]?.id, memberId: allMembers[35]?.id, validFrom: new Date(2025, 8, 20), validUntil: new Date(2025, 8, 21), status: 'active' as const },
      ]
      await db.insert(preApprovals).values(preApprovalData).execute()
    }
    console.log('✅ Pre-Approvals created (8)')

    // ============================================
    // 27. MARKETPLACE PRODUCTS (8 products)
    // ============================================
    const [mpCount] = await db.select({ count: drizzleCount() }).from(marketplaceProducts)
    if (mpCount.count === 0 && allMembers.length > 0) {
      const mpData = [
        { sellerId: allMembers[1]?.id, title: 'IKEA Bookshelf', description: 'BILLY bookcase, white, barely used', price: 3500, category: 'furniture' as const, condition: 'like_new' as const, status: 'active' as const },
        { sellerId: allMembers[3]?.id, title: 'Children Bicycle', description: 'Hero 20-inch cycle, 6 months old', price: 2500, category: 'other' as const, condition: 'good' as const, status: 'active' as const },
        { sellerId: allMembers[5]?.id, title: 'Standing Fan', description: 'Havells Turbo 400W stand fan', price: 1200, category: 'electronics' as const, condition: 'good' as const, status: 'active' as const },
        { sellerId: allMembers[7]?.id, title: 'Office Chair', description: 'Ergonomic mesh chair with armrest', price: 4000, category: 'furniture' as const, condition: 'like_new' as const, status: 'sold' as const },
        { sellerId: allMembers[9]?.id, title: 'Microwave Oven', description: 'Samsung 20L microwave, 1 year old', price: 4500, category: 'electronics' as const, condition: 'good' as const, status: 'active' as const },
        { sellerId: allMembers[11]?.id, title: 'Yoga Mat & Accessories', description: 'Premium yoga mat with blocks and strap', price: 800, category: 'other' as const, condition: 'new' as const, status: 'active' as const },
        { sellerId: allMembers[13]?.id, title: 'Table Tennis Set', description: 'STIGA table tennis bats and balls', price: 600, category: 'other' as const, condition: 'good' as const, status: 'active' as const },
        { sellerId: allMembers[15]?.id, title: 'Study Table', description: 'Wooden study table with drawers', price: 3000, category: 'furniture' as const, condition: 'fair' as const, status: 'active' as const },
      ]
      await db.insert(marketplaceProducts).values(mpData.map(p => ({ societyId, ...p }))).execute()
    }
    console.log('✅ Marketplace Products created (8)')

    // ============================================
    // 28. LOCAL SERVICES (8 services)
    // ============================================
    const [lsCount] = await db.select({ count: drizzleCount() }).from(localServices)
    if (lsCount.count === 0 && allMembers.length > 0) {
      const lsData = [
        { name: 'Raju Plumbing Services', category: 'plumber' as const, phone: '+91 98765 70001', rating: '4.00', totalReviews: 25, isVerified: true },
        { name: 'Electrical Works by Nitin', category: 'electrician' as const, phone: '+91 98765 70002', rating: '4.50', totalReviews: 18, isVerified: true },
        { name: 'Home Cleaning Solutions', category: 'maid' as const, phone: '+91 98765 70003', rating: '4.20', totalReviews: 30, isVerified: true },
        { name: 'Mumbai Painters', category: 'painter' as const, phone: '+91 98765 70004', rating: '3.80', totalReviews: 12, isVerified: false },
        { name: 'Tutor Me - Home Tuitions', category: 'tutor' as const, phone: '+91 98765 70005', rating: '4.90', totalReviews: 20, isVerified: true },
        { name: 'Prakash Carpenter', category: 'other' as const, phone: '+91 98765 70006', rating: '4.30', totalReviews: 15, isVerified: true },
        { name: 'SafePest Control', category: 'other' as const, phone: '+91 98765 70007', rating: '4.10', totalReviews: 22, isVerified: true },
        { name: 'Morning Yoga with Geeta', category: 'yoga' as const, phone: '+91 98765 70008', rating: '5.00', totalReviews: 35, isVerified: true },
      ]
      await db.insert(localServices).values(lsData.map(s => ({ societyId, ...s }))).execute()
    }
    console.log('✅ Local Services created (8)')

    // ============================================
    // 29. AUDIT LOGS (20 entries)
    // ============================================
    const [auditCount] = await db.select({ count: drizzleCount() }).from(auditLogs)
    if (auditCount.count === 0) {
      const auditActions = [
        { action: 'login', entityType: 'user', entityId: 1, ipAddress: '192.168.1.100' },
        { action: 'create', entityType: 'invoice', entityId: 1, newValues: '{"amount": 4860}' },
        { action: 'update', entityType: 'member', entityId: 1, oldValues: '{"role": "owner"}', newValues: '{"role": "chairman"}' },
        { action: 'payment_received', entityType: 'payment', entityId: 1, newValues: '{"amount": 4860, "method": "upi"}' },
        { action: 'create', entityType: 'notice', entityId: 1, newValues: '{"title": "AGM Notice"}' },
        { action: 'update', entityType: 'flat', entityId: 5, oldValues: '{"isOccupied": false}', newValues: '{"isOccupied": true}' },
        { action: 'login', entityType: 'user', entityId: 2, ipAddress: '192.168.1.105' },
        { action: 'create', entityType: 'service_request', entityId: 1, newValues: '{"title": "Water leakage"}' },
        { action: 'update', entityType: 'service_request', entityId: 1, oldValues: '{"status": "open"}', newValues: '{"status": "in_progress"}' },
        { action: 'payment_received', entityType: 'payment', entityId: 5, newValues: '{"amount": 5400, "method": "bank_transfer"}' },
        { action: 'create', entityType: 'visitor', entityId: 1, newValues: '{"name": "Ravi Sharma"}' },
        { action: 'update', entityType: 'visitor', entityId: 1, oldValues: '{"status": "inside"}', newValues: '{"status": "checked_out"}' },
        { action: 'login', entityType: 'user', entityId: 3, ipAddress: '192.168.1.110' },
        { action: 'create', entityType: 'amenity_booking', entityId: 1, newValues: '{"amenity": "Pool"}' },
        { action: 'cancel', entityType: 'amenity_booking', entityId: 1, oldValues: '{"status": "confirmed"}', newValues: '{"status": "cancelled"}' },
        { action: 'create', entityType: 'expense', entityId: 5, newValues: '{"amount": 25000, "category": "repairs"}' },
        { action: 'approve', entityType: 'expense', entityId: 5, newValues: '{"status": "approved"}' },
        { action: 'update', entityType: 'tower', entityId: 1, oldValues: '{"hasLift": false}', newValues: '{"hasLift": true}' },
        { action: 'login', entityType: 'user', entityId: 4, ipAddress: '192.168.1.115' },
        { action: 'create', entityType: 'marketplace_product', entityId: 1, newValues: '{"title": "IKEA Bookshelf", "price": 3500}' },
      ]
      await db.insert(auditLogs).values(auditActions.map((a, i) => ({
        societyId, userId: (i % 4) + 1,
        ...a,
        createdAt: new Date(2025, 5 + Math.floor(i / 5), 1 + (i % 28)),
      }))).execute()
    }
    console.log('✅ Audit Logs created (20)')

    console.log('')
    console.log('🎉 Comprehensive seed completed!')
    console.log('')
    console.log('📋 Demo Credentials (all passwords: admin123 or resident123):')
    console.log('')
    console.log('   🔧 Developer:  rajesh@society.com / admin123')
    console.log('   👑 Admin:      priya@society.com / resident123')
    console.log('   ⭐ SuperAdmin: amit@society.com / resident123')
    console.log('   🛡️  Staff:      vikram@society.com / resident123')
    console.log('   👤 Member:     suresh@society.com / resident123')
    console.log('')
    console.log('📊 Data Summary:')
    console.log('   - 1 Cluster with 1 Society')
    console.log('   - 4 Towers with 40 Flats (38 occupied)')
    console.log('   - 4 Gates')
    console.log('   - 40 Users with roles')
    console.log('   - 40 Members with 30 family members')
    console.log('   - 12 Staff with 14 days attendance')
    console.log('   - 6 months of salaries')
    console.log('   - 10 Celebrations with budgets & tasks')
    console.log('   - 50 Parking Spaces & 15 Vehicles')
    console.log('   - 12 Vendors')
    console.log('   - 6 months of Invoices (210+ total)')
    console.log('   - 40+ Payments recorded')
    console.log('   - 25 Expenses')
    console.log('   - 3 Bank Accounts')
    console.log('   - 12 Account Heads')
    console.log('   - 8 Journal Vouchers')
    console.log('   - 7 Recurring Expenses')
    console.log('   - 8 Service Categories & 20 Requests')
    console.log('   - 15 Notices')
    console.log('   - 10 Meetings')
    console.log('   - 25 Visitors')
    console.log('   - 8 Amenities with slots & 15 Bookings')
    console.log('   - 12 Pets')
    console.log('   - 10 Holidays')
    console.log('   - 7 Fine Rules')
    console.log('   - 15 Emergency Contacts')
    console.log('   - 10 Daily Help entries')
    console.log('   - 8 Pre-Approvals')
    console.log('   - 8 Marketplace Products')
    console.log('   - 8 Local Services')
    console.log('   - 20 Audit Logs')

  } catch (error) {
    console.error('❌ Seed failed:', error)
    throw error
  }
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
