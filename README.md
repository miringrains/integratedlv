# Integrated LV Client Portal

A production-ready multi-tenant support portal for low-voltage infrastructure management, built with Next.js 15, Supabase, and TypeScript.

## 🚀 Features

### ✅ Completed

- **Multi-Tenant Architecture**: Secure organization-based data isolation
- **Authentication System**: Email/password login with multi-step signup
- **Role-Based Access Control**: Platform Admin, Org Admin, and Employee roles
- **Location Management**: Full CRUD for store/site locations with manager information
- **Hardware Inventory**: Complete device tracking with specifications, status, and maintenance records
- **Modern UI**: Clean interface with Integrated LV branding (military green #3A443E + orange #FF6F12)
- **Responsive Design**: Mobile-friendly sidebar navigation and layouts
- **Database**: Complete PostgreSQL schema with RLS policies and triggers
- **Auto-generated Ticket Numbers**: TKT-YYYYMMDD-NNNNNN format
- **Timing Analytics**: Automated tracking of response and resolution times

### 🚧 To Be Completed

- **SOPs (Standard Operating Procedures)**: Create and manage troubleshooting guides
- **SOP Acknowledgment**: Force users to review SOPs before creating tickets
- **Care Log Tickets**: Full ticketing system with SOP-first workflow
- **Photo Uploads**: Supabase Storage integration for ticket attachments
- **Admin Dashboard**: User management and analytics for org admins
- **Ticket Metrics Display**: Visual dashboards for timing analytics

## 🛠 Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **UI Components**: shadcn/ui + Tailwind CSS
- **Icons**: Lucide React
- **Form Handling**: React Hook Form + Zod
- **Animations**: Framer Motion

## 📦 Installation

### Prerequisites

- Node.js 18+ and npm
- Supabase account and project
- Git

### Setup Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/miringrains/integratedlv.git
   cd integratedlv
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Copy `.env.local.example` to `.env.local` and update with your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://tzlkmyqemdpmmrmwesuy.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

4. **Apply database schema**
   
   The complete database schema is in `supabase/migrations/001_initial_schema.sql`.
   
   Execute via Supabase Dashboard SQL Editor or use the Supabase CLI:
   ```bash
   # Using Supabase CLI
   supabase db push
   ```

5. **Create storage buckets**
   
   In Supabase Dashboard → Storage, create three buckets:
   - `user-avatars` (public)
   - `ticket-attachments` (private)
   - `hardware-photos` (private)

6. **Run development server**
   ```bash
   npm run dev
   ```
   
   Open [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
integratedlv/
├── src/
│   ├── app/
│   │   ├── (auth)/                 # Authentication pages
│   │   │   ├── login/
│   │   │   └── signup/
│   │   ├── (portal)/               # Authenticated pages
│   │   │   ├── home/
│   │   │   ├── locations/
│   │   │   ├── hardware/
│   │   │   ├── sops/              # To be built
│   │   │   ├── care-logs/         # To be built
│   │   │   └── admin/             # To be built
│   │   └── api/                   # API routes
│   ├── components/
│   │   ├── ui/                    # shadcn/ui components
│   │   ├── layouts/               # Sidebar, Header
│   │   └── forms/                 # Reusable form components
│   ├── lib/
│   │   ├── supabase/              # Supabase clients
│   │   ├── queries/               # Database query functions
│   │   ├── auth.ts                # Auth helpers
│   │   ├── storage.ts             # File upload helpers
│   │   └── utils.ts               # Utilities
│   ├── types/
│   │   └── database.ts            # TypeScript types
│   └── contexts/
│       └── SidebarContext.tsx
├── public/                         # Static assets (logos)
├── supabase/
│   └── migrations/                # Database migrations
└── README.md
```

## 🗄 Database Schema

### Core Tables

- **organizations**: Multi-tenant root
- **profiles**: User accounts
- **org_memberships**: User roles per organization
- **locations**: Store/site locations
- **location_assignments**: Employee location access
- **hardware**: Equipment inventory
- **sops**: Standard operating procedures
- **hardware_sops**: Many-to-many SOP associations
- **care_log_tickets**: Support tickets
- **ticket_events**: Audit trail
- **ticket_attachments**: File uploads
- **ticket_timing_analytics**: Performance metrics

### Security

- Row Level Security (RLS) enabled on all tables
- Multi-tenant data isolation enforced at database level
- Employee location restrictions
- Role-based access control

## 👥 User Roles

1. **Platform Admin**
   - Full system access
   - Can create organizations
   - Manage all settings

2. **Org Admin**
   - Full access within their organization
   - Manage locations, hardware, SOPs
   - Manage users and tickets
   - View analytics

3. **Employee**
   - Access only to assigned locations
   - Create care log tickets
   - View hardware at their locations
   - View and acknowledge SOPs

## 🎨 Branding

- **Primary Color**: Military Green (#3A443E)
- **Accent Color**: Orange (#FF6F12)
- **Base**: White/Gray tones
- **Logos**: 
  - Dark logo for light backgrounds: `64da6112cec570b31b32f76d_ilv2.svg`
  - White logo for dark backgrounds: `64da9f27fb4e049b5cd05ea6_ilv3.svg`

## 🔐 Initial Admin Setup

After first user signs up, manually set them as platform admin:

```sql
UPDATE profiles 
SET is_platform_admin = true 
WHERE email = 'admin@yourcompany.com';
```

## 📝 Development Workflow

1. Create locations for your organization
2. Add hardware inventory to each location
3. Create SOPs for common hardware issues
4. Employees submit tickets following SOP-first workflow
5. Admins manage and resolve tickets

## 🚀 Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy!

### Environment Variables for Production

```env
NEXT_PUBLIC_SUPABASE_URL=your-production-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-production-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-production-service-key
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

## 📚 Key Dependencies

- `next`: ^15.1.3
- `react`: ^19.0.0
- `@supabase/supabase-js`: ^2.47.10
- `@supabase/ssr`: ^0.5.2
- `tailwindcss`: ^3.4.1
- `react-hook-form`: ^7.54.2
- `zod`: ^3.24.1
- `framer-motion`: ^11.15.0
- `lucide-react`: ^0.468.0

## 🔧 Common Commands

```bash
# Development
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Type checking
npm run type-check

# Linting
npm run lint
```

## 📖 Next Steps

To complete the portal, implement:

1. **SOPs Module**: See `src/app/(portal)/sops/` (planned structure)
2. **SOP Acknowledgment Modal**: Force SOP review before ticket creation
3. **Ticket System**: Full care log workflow with status management
4. **Photo Upload**: Integrate Supabase Storage for attachments
5. **Admin Dashboard**: User management and ticket analytics
6. **Metrics Display**: Visual timing analytics dashboards

## 🤝 Support

For issues or questions about Integrated LV Client Portal:

- Check the `DATABASE_SETUP.md` for database configuration
- Review the `PORTAL_SETUP_GUIDE.md` for architecture details
- Contact Integrated LV support

## 📄 License

Proprietary - Integrated LV

---

**Built with ❤️ for Integrated LV by the development team**

## 🌐 Live Deployment

This application is deployed on Vercel and connected to the GitHub repository for automatic deployments.

