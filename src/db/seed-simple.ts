import mysql from 'mysql2/promise'
import bcrypt from 'bcryptjs'

async function seed() {
  const conn = await mysql.createConnection({
    host: 'localhost', port: 3307, user: 'root', password: 'Samir@007', database: 'society_erp'
  })

  console.log('🌱 Seeding database...\n')

  // Flats
  const [flatRows] = await conn.execute('SELECT COUNT(*) as c FROM flats')
  if (flatRows[0].c === 0) {
    const wings = ['A','B','C','D']
    const types = ['1BHK','2BHK','3BHK','4BHK']
    const areas = [650, 950, 1250, 1800]
    const amounts = [2000, 3000, 4500, 6000]
    for (let floor = 1; floor <= 10; floor++) {
      for (let w = 0; w < 4; w++) {
        await conn.execute(
          'INSERT INTO flats (society_id, flat_number, wing, floor, area, type, maintenance_amount, is_occupied) VALUES (?,?,?,?,?,?,?,?)',
          [1, `${floor}${wings[w]}0${w+1}`, wings[w], floor, areas[w], types[w], amounts[w], 1]
        )
      }
    }
    console.log('✅ Flats: 40 created')
  } else {
    console.log('⏭️  Flats: already exist')
  }

  // Invoices (3 months for 20 flats)
  const [invRows] = await conn.execute('SELECT COUNT(*) as c FROM invoices')
  if (invRows[0].c === 0) {
    const [flats] = await conn.execute('SELECT id, flat_number, maintenance_amount FROM flats LIMIT 20')
    const months = [{ m: 6, p: 'Jun-2025' }, { m: 7, p: 'Jul-2025' }, { m: 8, p: 'Aug-2025' }]
    for (const { m, p } of months) {
      for (const flat of flats) {
        const amt = Number(flat.maintenance_amount)
        const gst = amt * 0.18
        const total = amt + gst
        const paid = m < 8 ? total : Math.random() > 0.4 ? total : 0
        const status = m < 8 ? 'paid' : paid > 0 ? 'paid' : 'pending'
        await conn.execute(
          'INSERT INTO invoices (society_id, flat_id, invoice_number, invoice_date, due_date, subtotal, gst_amount, total_amount, paid_amount, status, period) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
          [1, flat.id, `INV-2025${String(m).padStart(2,'0')}-${flat.flat_number}`, `2025-${String(m).padStart(2,'0')}-01`, `2025-${String(m).padStart(2,'0')}-10`, amt, gst, total, paid, status, p]
        )
      }
    }
    console.log('✅ Invoices: 60 created')
  } else {
    console.log('⏭️  Invoices: already exist')
  }

  // Expenses
  const [expRows] = await conn.execute('SELECT COUNT(*) as c FROM expenses')
  if (expRows[0].c === 0) {
    const exps = [
      ['security', 'Security guard salary - Aug 2025', 35000, 'paid'],
      ['cleaning', 'Housekeeping services - Aug 2025', 12000, 'paid'],
      ['gardening', 'Garden maintenance - Aug 2025', 8500, 'approved'],
      ['electricity', 'Common area electricity - Aug 2025', 18500, 'pending'],
      ['repairs', 'Elevator maintenance contract', 25000, 'pending'],
      ['water', 'Water tank cleaning', 5500, 'paid'],
    ]
    for (const [cat, desc, amt, st] of exps) {
      await conn.execute(
        'INSERT INTO expenses (society_id, category, description, amount, expense_date, status) VALUES (?,?,?,?,?,?)',
        [1, cat, desc, amt, '2025-08-15', st]
      )
    }
    console.log('✅ Expenses: 6 created')
  } else {
    console.log('⏭️  Expenses: already exist')
  }

  // Service Requests
  const [srRows] = await conn.execute('SELECT COUNT(*) as c FROM service_requests')
  if (srRows[0].c === 0) {
    const reqs = [
      [1, 1, 'Water leakage in bathroom', 'Urgent plumbing issue', 'plumbing', 'high', 'open'],
      [2, 2, 'Fan not working in bedroom', 'Ceiling fan stopped', 'electrical', 'medium', 'in_progress'],
      [3, 3, 'Main gate lock jammed', 'Lock needs replacement', 'security', 'urgent', 'open'],
      [4, 4, 'Garden landscaping needed', 'New flower beds required', 'other', 'low', 'resolved'],
      [5, 5, 'Paint peeling in living room', 'Walls need repainting', 'painting', 'low', 'closed'],
    ]
    for (const [fid, uid, title, desc, cat, pri, st] of reqs) {
      await conn.execute(
        'INSERT INTO service_requests (society_id, flat_id, member_id, title, description, category, priority, status) VALUES (?,?,?,?,?,?,?,?)',
        [1, fid, uid, title, desc, cat, pri, st]
      )
    }
    console.log('✅ Service Requests: 5 created')
  } else {
    console.log('⏭️  Service Requests: already exist')
  }

  // Notices
  const [noRows] = await conn.execute('SELECT COUNT(*) as c FROM notices')
  if (noRows[0].c === 0) {
    const notices = [
      ['Annual General Meeting - 25th August', 'AGM will be held on 25th August at 6 PM in community hall. All members are requested to attend.', 1, 'high', 1],
      ['Water Supply Disruption Notice', 'Water supply will be disrupted on 22nd August from 10 AM to 4 PM due to pipeline maintenance.', 1, 'medium', 0],
      ['New Security Protocol', 'Starting 1st September, all visitors must be pre-registered. Walk-in visitors need ID proof.', 1, 'high', 0],
      ['Diwali Celebration Planning', 'We are planning a grand Diwali celebration. Interested members please contact the committee.', 1, 'medium', 0],
    ]
    for (const [t, c, uid, pri, pin] of notices) {
      await conn.execute(
        'INSERT INTO notices (society_id, title, content, posted_by, priority, is_pinned, is_active) VALUES (?,?,?,?,?,?,?)',
        [1, t, c, uid, pri, pin, 1]
      )
    }
    console.log('✅ Notices: 4 created')
  } else {
    console.log('⏭️  Notices: already exist')
  }

  // Meetings
  const [mtRows] = await conn.execute('SELECT COUNT(*) as c FROM meetings')
  if (mtRows[0].c === 0) {
    const meetings = [
      ['Annual General Meeting 2025', 'Budget and elections discussion', '2025-08-25 18:00:00', 'Community Hall', 'scheduled'],
      ['Security Committee Meeting', 'Review security protocols and CCTV', '2025-08-20 17:00:00', 'Meeting Room', 'scheduled'],
      ['Budget Review Meeting', 'Q2 budget review and expense approval', '2025-08-10 16:00:00', 'Community Hall', 'completed'],
    ]
    for (const [t, d, dt, loc, st] of meetings) {
      await conn.execute(
        'INSERT INTO meetings (society_id, title, description, meeting_date, location, organized_by, status) VALUES (?,?,?,?,?,?,?)',
        [1, t, d, dt, loc, 1, st]
      )
    }
    console.log('✅ Meetings: 3 created')
  } else {
    console.log('⏭️  Meetings: already exist')
  }

  // Visitors
  const [viRows] = await conn.execute('SELECT COUNT(*) as c FROM visitors')
  if (viRows[0].c === 0) {
    const visitors = [
      ['Ravi Sharma', '+91 99887 76655', 'Personal visit', 1, '2025-08-19 10:30:00', '2025-08-19 14:45:00', 'MH12AB1234', 'checked_out'],
      ['Neha Gupta', '+91 98765 11111', 'Plumbing repair', 2, '2025-08-19 11:00:00', null, null, 'inside'],
      ['Amazon Delivery', '+91 98765 22222', 'Package delivery', 3, '2025-08-19 12:15:00', '2025-08-19 12:30:00', null, 'checked_out'],
      ['Suresh Electricals', '+91 98765 33333', 'Electrical work', 4, '2025-08-19 09:00:00', null, 'KA01CD5678', 'inside'],
      ['Milkman - Raju', '+91 98765 44444', 'Daily delivery', 5, '2025-08-19 07:00:00', '2025-08-19 07:15:00', null, 'checked_out'],
    ]
    for (const [n, ph, pur, fid, et, ext, vn, st] of visitors) {
      await conn.execute(
        'INSERT INTO visitors (society_id, name, phone, purpose, flat_id, entry_time, exit_time, vehicle_number, status) VALUES (?,?,?,?,?,?,?,?,?)',
        [1, n, ph, pur, fid, et, ext, vn, st]
      )
    }
    console.log('✅ Visitors: 5 created')
  } else {
    console.log('⏭️  Visitors: already exist')
  }

  // Amenities
  const [amRows] = await conn.execute('SELECT COUNT(*) as c FROM amenities')
  if (amRows[0].c === 0) {
    const ams = [
      ['Swimming Pool', 'Olympic size pool', 'sports', 'paid', 200, 30],
      ['Gym', 'Fully equipped gym', 'fitness', 'free', 0, 20],
      ['Community Hall', 'Large hall for events', 'community', 'paid', 500, 100],
      ['Badminton Court', 'Indoor court', 'sports', 'free', 0, 4],
      ['Kids Play Area', 'Outdoor play area', 'kids', 'free', 0, 15],
    ]
    for (const [n, desc, cat, type, price, cap] of ams) {
      await conn.execute(
        'INSERT INTO amenities (society_id, name, description, category, type, price, capacity, is_active) VALUES (?,?,?,?,?,?,?,?)',
        [1, n, desc, cat, type, price, cap, 1]
      )
    }
    console.log('✅ Amenities: 5 created')
  } else {
    console.log('⏭️  Amenities: already exist')
  }

  await conn.end()
  console.log('\n🎉 Seed completed!\n')
  console.log('📋 Credentials: admin@society.com / admin123')
}

seed().catch(console.error)
