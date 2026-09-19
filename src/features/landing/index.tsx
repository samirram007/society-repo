import { Link } from '@tanstack/react-router'
import {
  Building2, Shield, Users, Home, IndianRupee, Wrench, Megaphone,
  Calendar, CheckCircle2, ArrowRight, Star, Zap, Lock, Dumbbell,
  Car, CreditCard, Bell, FileText, MapPin, Siren, UserCheck,
  Camera, HelpCircle, MessageSquare, Truck, Package, Box, Landmark,
  PartyPopper, Globe, Smartphone, BarChart3, Headphones, Eye,
  Wifi, TrendingUp, Clock, Award, Heart, CircleDot,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

// ============================================
// FEATURES DATA - ALL MODULES
// ============================================
const mainFeatures = [
  {
    icon: Users,
    title: 'Member Management',
    description: 'Manage residents, owners, tenants, and committee members with role-based access control.',
    color: 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400',
    border: 'border-blue-200 dark:border-blue-800',
  },
  {
    icon: Home,
    title: 'Property Management',
    description: 'Track flats, parking spaces, vehicles, and occupancy status across towers.',
    color: 'bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-400',
    border: 'border-green-200 dark:border-green-800',
  },
  {
    icon: IndianRupee,
    title: 'Accounting & Finance',
    description: 'Complete invoicing, payments, ledger, budgeting, GST/TDS reports, and purchase orders.',
    color: 'bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400',
    border: 'border-amber-200 dark:border-amber-800',
  },
  {
    icon: Wrench,
    title: 'Maintenance & Helpdesk',
    description: 'Service requests, staff roster, auto escalation, and maintenance tracking.',
    color: 'bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400',
    border: 'border-purple-200 dark:border-purple-800',
  },
  {
    icon: Shield,
    title: 'Security & Access Control',
    description: 'Visitor management, daily help tracking, gate pass, and CCTV surveillance.',
    color: 'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400',
    border: 'border-red-200 dark:border-red-800',
  },
  {
    icon: Megaphone,
    title: 'Communications',
    description: 'Notices, meetings, documents, polls, surveys, and email campaigns.',
    color: 'bg-pink-50 text-pink-600 dark:bg-pink-950 dark:text-pink-400',
    border: 'border-pink-200 dark:border-pink-800',
  },
  {
    icon: Dumbbell,
    title: 'Amenities Booking',
    description: 'Online booking for sports facilities, community halls, and shared spaces with slot management.',
    color: 'bg-cyan-50 text-cyan-600 dark:bg-cyan-950 dark:text-cyan-400',
    border: 'border-cyan-200 dark:border-cyan-800',
  },
  {
    icon: Siren,
    title: 'Emergency & Facilities',
    description: 'SOS distress alerts, emergency contacts, and nearby facility directory.',
    color: 'bg-orange-50 text-orange-600 dark:bg-orange-950 dark:text-orange-400',
    border: 'border-orange-200 dark:border-orange-800',
  },
  {
    icon: Camera,
    title: 'CCTV & Vigilance',
    description: 'Camera management, zone monitoring, NVR servers, and live view grid.',
    color: 'bg-slate-50 text-slate-600 dark:bg-slate-950 dark:text-slate-400',
    border: 'border-slate-200 dark:border-slate-800',
  },
  {
    icon: Car,
    title: 'Parking & Vehicles',
    description: 'Parking allocation, visitor parking, vehicle registration, and tracking.',
    color: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400',
    border: 'border-indigo-200 dark:border-indigo-800',
  },
  {
    icon: Package,
    title: 'Assets & Inventory',
    description: 'Asset tracking, AMC reminders, inventory management, and purchase orders.',
    color: 'bg-teal-50 text-teal-600 dark:bg-teal-950 dark:text-teal-400',
    border: 'border-teal-200 dark:border-teal-800',
  },
  {
    icon: HelpCircle,
    title: 'Help Center',
    description: 'FAQs, support tickets, contact forms, and in-app notifications.',
    color: 'bg-violet-50 text-violet-600 dark:bg-violet-950 dark:text-violet-400',
    border: 'border-violet-200 dark:border-violet-800',
  },
  {
    icon: PartyPopper,
    title: 'Celebrations & Events',
    description: 'Community events, birthdays, anniversaries, and festive celebrations.',
    color: 'bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-400',
    border: 'border-rose-200 dark:border-rose-800',
  },
  {
    icon: FileText,
    title: 'Documents Management',
    description: 'Secure document storage, folders, sharing, version control, and access logs.',
    color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400',
    border: 'border-emerald-200 dark:border-emerald-800',
  },
  {
    icon: BarChart3,
    title: 'Reports & Analytics',
    description: 'Financial reports, occupancy analytics, maintenance trends, and dashboards.',
    color: 'bg-sky-50 text-sky-600 dark:bg-sky-950 dark:text-sky-400',
    border: 'border-sky-200 dark:border-sky-800',
  },
  {
    icon: Globe,
    title: 'Cluster Management',
    description: 'Manage multiple societies from a single dashboard with cluster-level insights.',
    color: 'bg-fuchsia-50 text-fuchsia-600 dark:bg-fuchsia-950 dark:text-fuchsia-400',
    border: 'border-fuchsia-200 dark:border-fuchsia-800',
  },
]

const highlights = [
  { icon: Smartphone, label: 'Mobile Responsive', desc: 'Works perfectly on any device' },
  { icon: Shield, label: 'RBAC Security', desc: 'Role-based access control' },
  { icon: Bell, label: 'Real-time Alerts', desc: 'Push notifications & SMS' },
  { icon: CreditCard, label: 'Payment Gateway', desc: 'UPI, cards, net banking' },
  { icon: Camera, label: 'CCTV Integration', desc: 'Live camera feeds & monitoring' },
  { icon: Headphones, label: '24/7 Support', desc: 'Help center & ticketing' },
]

const stats = [
  { value: '50+', label: 'Modules' },
  { value: '60+', label: 'Database Tables' },
  { value: '100+', label: 'Features' },
  { value: '24/7', label: 'Access' },
]

const testimonials = [
  {
    name: 'Rajesh Kumar',
    role: 'Secretary, Green Valley Society',
    content: 'Society ERP has transformed how we manage our 200+ flat society. The accounting features alone saved us hours every month.',
    rating: 5,
    avatar: 'RK',
  },
  {
    name: 'Priya Sharma',
    role: 'Resident, Sunshine Towers',
    content: 'The visitor management and amenity booking features are fantastic. Our residents love the ease of use on mobile.',
    rating: 5,
    avatar: 'PS',
  },
  {
    name: 'Amit Patel',
    role: 'Treasurer, Lakewood Apartments',
    content: 'Finally a solution that handles all our financial needs - invoicing, payments, GST reports, everything in one place.',
    rating: 5,
    avatar: 'AP',
  },
]

const techStack = [
  { name: 'React', icon: Zap },
  { name: 'TanStack', icon: TrendingUp },
  { name: 'Drizzle ORM', icon: Database },
  { name: 'MariaDB', icon: CircleDot },
  { name: 'shadcn/ui', icon: Award },
  { name: 'TypeScript', icon: Lock },
]

function Database(props: any) { return <Box {...props} /> }

// ============================================
// MAIN COMPONENT
// ============================================
export function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* ============================================
          HERO SECTION
          ============================================ */}
      <section className="relative overflow-hidden py-20 lg:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-primary/2 to-accent/5" />
        <div className="absolute top-20 left-10 h-72 w-72 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-10 right-10 h-96 w-96 rounded-full bg-accent/5 blur-3xl" />
        <div className="container relative mx-auto px-4">
          <div className="mx-auto max-w-4xl text-center">
            <Badge variant="secondary" className="mb-6 px-4 py-2 text-sm">
              🏠 Complete Housing Society Management ERP
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-7xl">
              Manage Your Society{' '}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Effortlessly</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              A comprehensive ERP solution for housing societies. From member management
              to accounting, security to amenities — everything you need in one powerful platform.
            </p>
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Button size="lg" asChild className="px-8 text-base">
                <Link to="/login">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="px-8 text-base">
                <Link to="/login">View Live Demo</Link>
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="mx-auto mt-16 grid max-w-2xl grid-cols-2 gap-6 lg:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">{stat.value}</div>
                <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================
          HIGHLIGHTS BAR
          ============================================ */}
      <section className="border-y bg-muted/30 py-6">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
            {highlights.map((h) => {
              const Icon = h.icon
              return (
                <div key={h.label} className="flex items-center gap-3">
                  <Icon className="h-5 w-5 text-primary shrink-0" />
                  <div>
                    <p className="text-sm font-medium leading-tight">{h.label}</p>
                    <p className="text-xs text-muted-foreground">{h.desc}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ============================================
          ALL MODULES / FACILITIES SECTION
          ============================================ */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center mb-12">
            <Badge variant="outline" className="mb-4">All Modules</Badge>
            <h2 className="text-3xl font-bold tracking-tight lg:text-4xl">Everything Your Society Needs</h2>
            <p className="mt-4 text-muted-foreground text-lg">
              A complete suite of 16+ modules covering every aspect of housing society management.
            </p>
          </div>
          <div className="mx-auto grid max-w-6xl gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {mainFeatures.map((feature) => {
              const Icon = feature.icon
              return (
                <Card key={feature.title} className={`group border ${feature.border} hover:shadow-lg hover:-translate-y-1 transition-all duration-300`}>
                  <CardContent className="p-5">
                    <div className={`mb-4 inline-flex rounded-xl p-3 ${feature.color} group-hover:scale-110 transition-transform`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="font-semibold text-sm">{feature.title}</h3>
                    <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* ============================================
          HOW IT WORKS
          ============================================ */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center mb-12">
            <Badge variant="outline" className="mb-4">How It Works</Badge>
            <h2 className="text-3xl font-bold tracking-tight lg:text-4xl">Get Started in Minutes</h2>
          </div>
          <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-3">
            {[
              { step: '01', title: 'Create Society', desc: 'Set up your society profile, towers, flats, and gates in minutes.', icon: Building2 },
              { step: '02', title: 'Add Members', desc: 'Invite residents, assign roles, and configure permissions.', icon: Users },
              { step: '03', title: 'Go Live', desc: 'Start managing dues, visitors, maintenance, and more.', icon: Zap },
            ].map((item) => {
              const Icon = item.icon
              return (
                <div key={item.step} className="relative text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                    <Icon className="h-8 w-8 text-primary" />
                  </div>
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 text-6xl font-bold text-primary/10">{item.step}</div>
                  <h3 className="font-semibold text-lg">{item.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{item.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ============================================
          TESTIMONIALS
          ============================================ */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center mb-12">
            <Badge variant="outline" className="mb-4">Testimonials</Badge>
            <h2 className="text-3xl font-bold tracking-tight lg:text-4xl">Trusted by Societies</h2>
            <p className="mt-4 text-muted-foreground">See what our users have to say about Society ERP.</p>
          </div>
          <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3">
            {testimonials.map((testimonial) => (
              <Card key={testimonial.name} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex gap-1 mb-4">
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">"{testimonial.content}"</p>
                  <div className="mt-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-bold">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{testimonial.name}</p>
                      <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================
          TECH STACK
          ============================================ */}
      <section className="py-16 border-y bg-muted/20">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground mb-6">Built with modern technologies</p>
          <div className="flex flex-wrap items-center justify-center gap-6">
            {techStack.map(t => (
              <div key={t.name} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <t.icon className="h-4 w-4" />
                <span className="font-medium">{t.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================
          CTA SECTION
          ============================================ */}
      <section className="py-20 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold tracking-tight lg:text-4xl">Ready to Transform Your Society?</h2>
          <p className="mt-4 text-primary-foreground/80 text-lg max-w-xl mx-auto">
            Join hundreds of societies already using Society ERP to streamline their operations.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button size="lg" variant="secondary" asChild className="px-8 text-base">
              <Link to="/login">
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-primary-foreground/80">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" /> No credit card required
            </span>
            <span className="flex items-center gap-2">
              <Lock className="h-4 w-4" /> Secure & Private
            </span>
            <span className="flex items-center gap-2">
              <Zap className="h-4 w-4" /> Instant Setup
            </span>
          </div>
        </div>
      </section>

      {/* ============================================
          FOOTER
          ============================================ */}
      <footer className="border-t py-12">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Building2 className="h-4 w-4" />
                </div>
                <span className="font-bold text-lg">Society ERP</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Complete housing society management solution. Streamline operations, enhance security, and improve resident experience.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Modules</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Member Management</li>
                <li>Accounting & Finance</li>
                <li>Security & Access</li>
                <li>Maintenance & Helpdesk</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Features</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Amenities Booking</li>
                <li>Visitor Management</li>
                <li>CCTV Monitoring</li>
                <li>Document Management</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Support</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/login" className="hover:text-foreground transition-colors">Help Center</Link></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <Separator className="my-8" />
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Society ERP. Housing Society Management System.
            </p>
            <div className="flex gap-4 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground">Privacy</a>
              <a href="#" className="hover:text-foreground">Terms</a>
              <a href="#" className="hover:text-foreground">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
