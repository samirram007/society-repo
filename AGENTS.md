# Project knowledge - Society ERP (MyGate Clone)

Full-featured Housing Society Management ERP with Cluster support (manage multiple societies).

## Quickstart
- Setup: `pnpm install`
- Dev: `pnpm dev`
- Build: `pnpm build`
- DB Push: `pnpm db:push`
- DB Studio: `pnpm db:studio`

## Tech Stack
| Feature | Library |
|---------|---------|
| Framework | TanStack Start (React) |
| UI | shadcn/ui + Radix UI |
| Forms | TanStack Form |
| Tables | TanStack Table |
| Data Fetching | TanStack Query |
| State | TanStack Store |
| Validation | Zod |
| Database | Drizzle ORM + MariaDB (port 3307) |
| Auth | JWT (jose) |
| Routing | TanStack Router (file-based) |
| Architecture | Solid (Service-Repository-Interface) |

## Architecture (Solid Pattern)
```
Route → Service → Repository → Drizzle ORM → MariaDB
         ↓
      Validation (Zod)
```

## Project Structure
```
src/
├── db/schemas/       # Database tables (50+)
├── interfaces/       # TypeScript contracts
├── repositories/     # Data access layer
├── services/         # Business logic layer
├── hooks/           # TanStack Query hooks
├── lib/             # Utils, auth, validations, store
├── components/ui/   # shadcn/ui components
├── components/layout/ # Layout components
└── routes/          # File-based routes
```

## Modules (MyGate Features)

### 1. Cluster & Society Management
- Multi-society management from single dashboard
- Society profiles, towers, gates
- Role-based access (Cluster Admin, Society Admin, etc.)

### 2. User & Member Management
- System users with JWT auth
- Members (owners, tenants, committee)
- Family members
- Staff management with attendance

### 3. Property Management
- Flats with details (type, area, maintenance)
- Parking spaces (covered, open, basement)
- Vehicle registration & tracking

### 4. Accounting & Finance (40+ features)
- **Invoicing**: Multiple charge types, auto invoicing, group/targeted invoicing
- **Payments**: UPI, cards, net banking, foreign cards, partial payments
- **Financial Tracking**: General ledger, chart of accounts, journal vouchers
- **Reports**: Balance sheet, P&L, trial balance, GST/TDS reports
- **Budgeting**: Monthly/quarterly/annual budgets
- **Purchases**: Requisitions, POs, vendor management
- **Deposits**: Security deposits, advance payments, fixed deposits

### 5. Security & Access Control (30+ features)
- **Visitor Management**: Pre-approvals, spot entry, guest invitations
- **Daily Help**: Access tracking, attendance, payments
- **Guard Features**: Photo capture, patrolling, offline mode
- **Emergency**: Panic button, child safety alerts
- **Gate Management**: Material gatepass, utility vehicle tracking

### 6. Amenities Module (25+ features)
- Booking with slots, capacity/usage control
- Differential pricing, cooldown periods
- Cancellation limits/charges
- Integrated check-in/out
- Approval workflows, BNPL option

### 7. Helpdesk & Maintenance (20+ features)
- Service requests with categories
- Status tracking, auto escalation
- Staff roster, manual/auto assignment
- Ratings & comments
- Reports: avg closure time, category/tower-wise

### 8. Asset & Inventory (15+ features)
- Asset master with categorization
- AMC reminders, reports
- Inventory with stock tracking
- Purchase requisitions & orders

### 9. Communications (15+ features)
- Notices (targeted by tower/flat)
- Meetings with minutes
- Documents (personal/society/management)
- Polls (opinion/secret/election)
- Surveys, tasks, email campaigns

### 10. Marketplace & Services
- Local services directory
- Product marketplace
- Service reviews

### 11. Pet Directory
- Pet registration
- Pet rules

### 12. System Features
- Audit logs
- System settings
- Holiday calendar
- Fine rules

## Database Tables (60+)
See `src/db/schemas/` for complete schema.

## Conventions
- Use `createFileRoute` for routes
- Use shadcn/ui for UI components
- Use TanStack Query for data fetching
- Use Zod for validation
- Follow Solid architecture (Interface → Repository → Service)
- Never bypass Service layer

## Environment
- MariaDB: localhost:3307
- User: root
- Password: Samir@007
- Database: society_erp
