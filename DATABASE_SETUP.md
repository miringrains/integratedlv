# Database Setup Instructions

## Execute the Schema

The complete database schema is in `supabase/migrations/001_initial_schema.sql`.

To execute it on your Supabase project:

1. Go to https://supabase.com/dashboard/project/tzlkmyqemdpmmrmwesuy
2. Navigate to the SQL Editor
3. Copy the entire contents of `supabase/migrations/001_initial_schema.sql`
4. Paste and run the SQL

This will create:
- All tables (organizations, profiles, locations, hardware, SOPs, tickets, etc.)
- All RLS policies for multi-tenant security
- Storage buckets for avatars and attachments
- Indexes for performance
- Triggers for auto-updating timestamps and ticket numbers
- Functions for timing analytics

## Verify Setup

After execution, verify:
- All tables exist
- RLS is enabled on all tables
- Storage buckets are created
- Triggers are active

## Initial Admin User

After signup, you'll need to manually set a user as platform admin:

```sql
UPDATE profiles 
SET is_platform_admin = true 
WHERE email = 'your-admin-email@example.com';
```

