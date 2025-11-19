# Multi-Tenant Portal Setup Guide

This guide will help you create a production-ready multi-tenant portal similar to Holland Industrial Group's auction platform. This architecture works for any business requiring: user authentication, organization management, content listings, and role-based access.

## 📋 Table of Contents

1. [Tech Stack](#tech-stack)
2. [Project Structure](#project-structure)
3. [Initial Setup](#initial-setup)
4. [Database Schema](#database-schema)
5. [Authentication & Authorization](#authentication--authorization)
6. [Frontend Setup](#frontend-setup)
7. [Key Features Implementation](#key-features-implementation)
8. [Deployment](#deployment)
9. [Customization Guide](#customization-guide)

---

## Tech Stack

### Core Technologies
- **Frontend**: Next.js 15 (App Router)
- **UI Framework**: shadcn/ui + Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage, RLS)
- **Language**: TypeScript
- **Deployment**: Vercel (frontend) + DigitalOcean/Supabase Cloud (backend)

### Key Dependencies
```json
{
  "next": "^15.1.3",
  "react": "^19.0.0",
  "typescript": "^5.6.3",
  "@supabase/supabase-js": "^2.47.10",
  "tailwindcss": "^3.4.1",
  "react-hook-form": "^7.54.2",
  "zod": "^3.24.1",
  "framer-motion": "^11.15.0",
  "lucide-react": "^0.468.0"
}
```

---

## Project Structure

```
project-root/
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── (auth)/              # Authentication routes
│   │   │   │   ├── login/
│   │   │   │   ├── signup/
│   │   │   │   └── layout.tsx
│   │   │   ├── (portal)/            # Authenticated routes
│   │   │   │   ├── home/
│   │   │   │   ├── [your-feature]/  # Main feature pages
│   │   │   │   ├── admin/           # Admin-only routes
│   │   │   │   ├── settings/
│   │   │   │   └── layout.tsx
│   │   │   ├── globals.css
│   │   │   └── layout.tsx
│   │   ├── components/
│   │   │   ├── ui/                  # shadcn/ui components
│   │   │   ├── layouts/             # Header, Sidebar
│   │   │   ├── animations/          # FadeIn, HoverScale
│   │   │   └── [feature]/           # Feature-specific components
│   │   ├── lib/
│   │   │   ├── supabase/
│   │   │   │   ├── client.ts        # Browser client
│   │   │   │   └── server.ts        # Server client
│   │   │   ├── auth.ts              # Auth helpers
│   │   │   └── utils.ts             # Utility functions
│   │   └── contexts/
│   │       └── SidebarContext.tsx
│   ├── public/
│   │   └── [your-logo].svg
│   ├── .env.local
│   ├── next.config.ts
│   ├── tailwind.config.ts
│   └── package.json
├── backend/
│   └── supabase/
│       └── functions/               # Edge functions (optional)
├── supabase/
│   └── migrations/                  # Database migrations
├── scripts/
│   └── create-admin.ts              # Admin user creation
└── README.md
```

---

## Initial Setup

### 1. Create Next.js Project

```bash
npx create-next-app@latest frontend --typescript --tailwind --app --no-src-dir
cd frontend
```

### 2. Install Dependencies

```bash
npm install @supabase/supabase-js
npm install react-hook-form @hookform/resolvers zod
npm install framer-motion
npm install lucide-react
npm install date-fns
```

### 3. Install shadcn/ui

```bash
npx shadcn@latest init -y
npx shadcn@latest add button card input label select table badge avatar dialog dropdown-menu separator form calendar
```

### 4. Setup Supabase

1. Create project at https://supabase.com
2. Note your Project URL and anon key
3. Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

---

## Database Schema

### Core Tables (Run in Supabase SQL Editor)

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Organizations (tenants)
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User profiles
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  industry TEXT,
  company_name TEXT,
  is_platform_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Organization memberships
CREATE TABLE org_memberships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'member', 'buyer', 'seller')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, user_id)
);

-- Your main feature table (customize this!)
-- Example: Auctions, Projects, Listings, etc.
CREATE TABLE items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  created_by UUID REFERENCES profiles(id) NOT NULL,
  
  -- Core fields (customize these!)
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'active',
  
  -- Dates (with custom display configs)
  start_at TIMESTAMPTZ,
  end_at TIMESTAMPTZ,
  date_configs JSONB,
  
  -- Media
  main_image_url TEXT,
  gallery_images JSONB,
  
  -- Metadata
  metadata_points JSONB,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Watchlist (optional but recommended)
CREATE TABLE watchlist_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  item_id UUID REFERENCES items(id) ON DELETE CASCADE NOT NULL,
  notes TEXT,
  target_price NUMERIC,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, item_id)
);

-- Approvals workflow (optional)
CREATE TABLE approvals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  item_id UUID REFERENCES items(id) ON DELETE CASCADE NOT NULL,
  requested_by UUID REFERENCES profiles(id) NOT NULL,
  reviewed_by UUID REFERENCES profiles(id),
  status TEXT DEFAULT 'requested' CHECK (status IN ('requested', 'approved', 'rejected')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ
);

-- Storage bucket for user avatars
INSERT INTO storage.buckets (id, name, public) 
VALUES ('user-avatars', 'user-avatars', true);

-- Indexes for performance
CREATE INDEX idx_items_org_id ON items(org_id);
CREATE INDEX idx_items_status ON items(status);
CREATE INDEX idx_items_start_at ON items(start_at);
CREATE INDEX idx_watchlist_user_id ON watchlist_items(user_id);
CREATE INDEX idx_org_memberships_user_id ON org_memberships(user_id);
```

### Row Level Security (RLS) Policies

```sql
-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE watchlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE approvals ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read/update their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Organizations: Users can view orgs they belong to
CREATE POLICY "Users can view their organizations" ON organizations
  FOR SELECT USING (
    id IN (
      SELECT org_id FROM org_memberships 
      WHERE user_id = auth.uid()
    )
  );

-- Org Memberships: Users can view memberships in their orgs
CREATE POLICY "Users can view org memberships" ON org_memberships
  FOR SELECT USING (
    org_id IN (
      SELECT org_id FROM org_memberships 
      WHERE user_id = auth.uid()
    )
  );

-- Items: Users can view items in their orgs
CREATE POLICY "Users can view items in their orgs" ON items
  FOR SELECT USING (
    org_id IN (
      SELECT org_id FROM org_memberships 
      WHERE user_id = auth.uid()
    )
  );

-- Items: Admins can insert/update/delete
CREATE POLICY "Admins can manage items" ON items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM org_memberships 
      WHERE org_memberships.user_id = auth.uid()
      AND org_memberships.org_id = items.org_id
      AND org_memberships.role IN ('admin', 'seller')
    )
  );

-- Watchlist: Users can manage their own watchlist
CREATE POLICY "Users can manage own watchlist" ON watchlist_items
  FOR ALL USING (user_id = auth.uid());

-- Approvals: Users can view/create approvals in their org
CREATE POLICY "Users can view org approvals" ON approvals
  FOR SELECT USING (
    org_id IN (
      SELECT org_id FROM org_memberships 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create approvals" ON approvals
  FOR INSERT WITH CHECK (
    requested_by = auth.uid() AND
    org_id IN (
      SELECT org_id FROM org_memberships 
      WHERE user_id = auth.uid()
    )
  );

-- Storage: Users can upload/view their own avatars
CREATE POLICY "Users can upload own avatar" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'user-avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Anyone can view avatars" ON storage.objects
  FOR SELECT USING (bucket_id = 'user-avatars');
```

---

## Authentication & Authorization

### 1. Supabase Client Setup

**`src/lib/supabase/client.ts`** (Browser)
```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

**`src/lib/supabase/server.ts`** (Server Components)
```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Component, ignore
          }
        },
      },
    }
  )
}
```

### 2. Auth Helpers

**`src/lib/auth.ts`**
```typescript
import { createClient } from '@/lib/supabase/server'

export async function getCurrentUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function getCurrentUserWithAdminStatus() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { user: null, isPlatformAdmin: false }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_platform_admin')
    .eq('id', user.id)
    .single()

  return {
    user,
    isPlatformAdmin: profile?.is_platform_admin || false,
  }
}

export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Unauthorized')
  }
  return user
}

export async function requirePlatformAdmin() {
  const { user, isPlatformAdmin } = await getCurrentUserWithAdminStatus()
  if (!isPlatformAdmin) {
    throw new Error('Unauthorized - Admin only')
  }
  return user
}
```

### 3. Middleware (Route Protection)

**`src/app/middleware.ts`**
```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Protect portal routes
  if (!user && request.nextUrl.pathname.startsWith('/home')) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Redirect authenticated users away from auth pages
  if (user && (request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/signup')) {
    const url = request.nextUrl.clone()
    url.pathname = '/home'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

---

## Frontend Setup

### 1. Layout Structure

**`src/app/(portal)/layout.tsx`** (Authenticated layout with sidebar)
```typescript
import { Sidebar } from '@/components/layouts/Sidebar'
import { Header } from '@/components/layouts/Header'
import { SidebarProvider } from '@/contexts/SidebarContext'
import { NotificationProvider } from '@/components/notifications/NotificationProvider'

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <NotificationProvider>
      <SidebarProvider>
        <div className="flex h-screen overflow-hidden">
          <Sidebar />
          <div className="flex flex-col flex-1 overflow-hidden">
            <Header />
            <main className="flex-1 overflow-y-auto bg-background p-6 md:p-8">
              <div className="max-w-7xl mx-auto">
                {children}
              </div>
            </main>
          </div>
        </div>
      </SidebarProvider>
    </NotificationProvider>
  )
}
```

### 2. Sidebar Component

**`src/components/layouts/Sidebar.tsx`**
```typescript
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Package, Heart, CheckSquare, Settings, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useSidebar } from '@/contexts/SidebarContext'

export function Sidebar() {
  const pathname = usePathname()
  const { isMobileOpen, closeMobile } = useSidebar()

  const navItems = [
    { href: '/home', label: 'Dashboard', icon: Home },
    { href: '/items', label: 'Items', icon: Package },
    { href: '/watchlist', label: 'Watchlist', icon: Heart },
    { href: '/approvals', label: 'Approvals', icon: CheckSquare },
    { href: '/settings', label: 'Settings', icon: Settings },
  ]

  return (
    <>
      {/* Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={closeMobile}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-50
        w-64 bg-card border-r
        transform transition-transform duration-200 ease-in-out
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b">
            <h1 className="text-xl font-bold">Your Brand</h1>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname.startsWith(item.href)
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeMobile}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg
                    transition-colors
                    ${isActive 
                      ? 'bg-primary text-primary-foreground' 
                      : 'hover:bg-muted text-muted-foreground'
                    }
                  `}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              )
            })}
          </nav>
        </div>
      </aside>
    </>
  )
}
```

### 3. Tailwind Config (Light Theme)

**`tailwind.config.ts`**
```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#F6F7F9",
        foreground: "#0e121b",
        card: {
          DEFAULT: "#FFFFFF",
          foreground: "#0e121b",
        },
        primary: {
          DEFAULT: "#176FFF",
          foreground: "#FFFFFF",
        },
        muted: {
          DEFAULT: "#F3F4F6",
          foreground: "#6b7280",
        },
        accent: {
          DEFAULT: "#176FFF",
          foreground: "#FFFFFF",
        },
        destructive: {
          DEFAULT: "#ef4444",
          foreground: "#FFFFFF",
        },
        border: "#E4E7EC",
      },
      borderRadius: {
        lg: "0.5rem",
        md: "0.375rem",
        sm: "0.25rem",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
```

---

## Key Features Implementation

### 1. Multi-Step Signup with Org Creation

**`src/app/(auth)/signup/page.tsx`**
```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function SignupPage() {
  const [step, setStep] = useState(1)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [companyName, setCompanyName] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const handleSignup = async () => {
    // 1. Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (authError || !authData.user) {
      console.error(authError)
      return
    }

    // 2. Create organization
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .insert({ name: companyName })
      .select()
      .single()

    if (orgError || !org) {
      console.error(orgError)
      return
    }

    // 3. Update profile
    await supabase
      .from('profiles')
      .update({
        first_name: firstName,
        last_name: lastName,
        company_name: companyName,
      })
      .eq('id', authData.user.id)

    // 4. Create org membership
    await supabase
      .from('org_memberships')
      .insert({
        org_id: org.id,
        user_id: authData.user.id,
        role: 'admin',
      })

    router.push('/home')
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {step === 1 && (
          <>
            <h1 className="text-2xl font-bold">Create Account</h1>
            <div className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <Button onClick={() => setStep(2)} className="w-full">
                Continue
              </Button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h1 className="text-2xl font-bold">Tell Us About You</h1>
            <div className="space-y-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                  id="companyName"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                />
              </div>
              <Button onClick={handleSignup} className="w-full">
                Create Account
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
```

### 2. Card Grid Layout Pattern

This is the key pattern used throughout for displaying items:

```typescript
<div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
  {items.map((item) => (
    <Card key={item.id}>
      <CardHeader>
        <CardTitle>{item.title}</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Item content */}
      </CardContent>
    </Card>
  ))}
</div>
```

### 3. Date/Time Configuration System

The Holland portal uses a flexible date system that allows custom labels, timezones, and date ranges:

**Database field:**
```sql
date_configs JSONB
-- Structure: {
--   "start": { "label": "Bidding Opens", "timezone": "CT", "through_at": "..." },
--   "end": { "label": "Bidding Closes", "timezone": "CT", "through_at": "..." }
-- }
```

**Component:** `src/components/DateTimeInput.tsx` (see Holland codebase)

### 4. Image Upload to Supabase Storage

```typescript
export async function uploadImage(file: File, bucket: string, userId: string) {
  const supabase = createClient()
  const fileExt = file.name.split('.').pop()
  const fileName = `${userId}/${Date.now()}.${fileExt}`

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(fileName, file)

  if (error) throw error

  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(fileName)

  return publicUrl
}
```

---

## Deployment

### Vercel Deployment

1. **Connect to Git**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/your-repo.git
   git push -u origin main
   ```

2. **Deploy to Vercel**
   - Go to https://vercel.com
   - Import your repository
   - Add environment variables:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Deploy!

3. **Setup Custom Domain** (Optional)
   - Add domain in Vercel settings
   - Update DNS records

### Build Configuration

**`package.json` scripts:**
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit"
  }
}
```

---

## Customization Guide

### Renaming from "Auction" to Your Feature

1. **Database**: Rename `items` table and adjust fields
2. **Routes**: Rename `/auctions` to `/[your-feature]`
3. **Components**: Rename component folders and files
4. **Types**: Update TypeScript interfaces
5. **Sidebar**: Update navigation items

### Adding New Roles

```sql
-- Update role constraint
ALTER TABLE org_memberships 
DROP CONSTRAINT org_memberships_role_check;

ALTER TABLE org_memberships 
ADD CONSTRAINT org_memberships_role_check 
CHECK (role IN ('admin', 'member', 'buyer', 'seller', 'your-new-role'));
```

Then update RLS policies accordingly.

### Color Theme Customization

Edit `tailwind.config.ts`:
```typescript
colors: {
  background: "#YOUR_BG_COLOR",
  foreground: "#YOUR_TEXT_COLOR",
  primary: {
    DEFAULT: "#YOUR_BRAND_COLOR",
    foreground: "#FFFFFF",
  },
  // ... other colors
}
```

### Adding Email Notifications

1. **Install Resend**:
   ```bash
   npm install resend
   ```

2. **Create Email Template**:
   ```typescript
   // src/lib/email.ts
   import { Resend } from 'resend'

   const resend = new Resend(process.env.RESEND_API_KEY)

   export async function sendWelcomeEmail(email: string, name: string) {
     await resend.emails.send({
       from: 'Your App <onboarding@yourapp.com>',
       to: email,
       subject: 'Welcome!',
       html: `<p>Welcome ${name}!</p>`,
     })
   }
   ```

---

## Common Patterns

### Server Component Data Fetching
```typescript
export default async function Page() {
  const supabase = await createClient()
  
  const { data } = await supabase
    .from('items')
    .select('*')
    .order('created_at', { ascending: false })

  return <div>{/* Render data */}</div>
}
```

### Client Component with Form
```typescript
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'

const schema = z.object({
  title: z.string().min(1, 'Required'),
})

export function MyForm() {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: any) => {
    // Handle submission
  }

  return <form onSubmit={handleSubmit(onSubmit)}>{/* Form fields */}</form>
}
```

### Protected Admin Route
```typescript
export default async function AdminPage() {
  await requirePlatformAdmin() // Throws if not admin

  return <div>Admin content</div>
}
```

---

## Testing Checklist

- [ ] User can sign up and create organization
- [ ] User can log in and log out
- [ ] Sidebar navigation works
- [ ] Mobile sidebar toggles correctly
- [ ] Admin can create/edit/delete items
- [ ] Regular users can view items
- [ ] Watchlist functionality works
- [ ] RLS policies prevent cross-org access
- [ ] Image uploads work
- [ ] Profile updates work
- [ ] Build completes without errors
- [ ] Deployment succeeds

---

## Support & Resources

- **Next.js Docs**: https://nextjs.org/docs
- **Supabase Docs**: https://supabase.com/docs
- **shadcn/ui**: https://ui.shadcn.com
- **Tailwind CSS**: https://tailwindcss.com

---

## Quick Start Commands

```bash
# Create project
npx create-next-app@latest your-portal --typescript --tailwind --app

# Install dependencies
cd your-portal
npm install @supabase/supabase-js react-hook-form @hookform/resolvers zod framer-motion lucide-react

# Install UI components
npx shadcn@latest init -y
npx shadcn@latest add button card input label select table badge avatar dialog dropdown-menu

# Start dev server
npm run dev
```

---

## Architecture Decisions

1. **Why Next.js App Router?** 
   - Server Components reduce bundle size
   - Built-in routing and layouts
   - Excellent TypeScript support

2. **Why Supabase?**
   - PostgreSQL with RLS for security
   - Built-in auth and storage
   - Real-time capabilities
   - Generous free tier

3. **Why shadcn/ui?**
   - Copy-paste, not npm install
   - Full customization control
   - Excellent accessibility
   - TypeScript first

4. **Why Multi-Tenancy?**
   - Single codebase for multiple customers
   - RLS ensures data isolation
   - Easy to scale

---

**This guide provides the complete blueprint to replicate the Holland portal architecture. Customize the feature set, branding, and business logic to match your specific use case.**

