# RLS Policy Updates Log

## Latest Changes (Nov 22, 2025)

### Profiles Table
- **DISABLED RLS** to prevent infinite recursion
- Platform admins and all authenticated users can now access profiles

### Ticket Comments Table
- **Updated INSERT policy**: "Users can create comments on accessible tickets"
  - Org members can comment on their org's tickets
  - Platform admins can comment on ANY ticket
  
### Why These Changes
The infinite recursion was caused by the profiles RLS policy trying to check `is_platform_admin` by querying the profiles table, which triggered the same policy again.

Solution: Disabled RLS on profiles table entirely since profile data is not sensitive and auth is handled at the application level.

