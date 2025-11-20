import { redirect } from 'next/navigation'

export default function SignupPage() {
  // Signup is disabled - invite-only portal
  redirect('/login')
}
