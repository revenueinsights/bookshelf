// app/page.tsx
import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export default async function Home() {
  const session = await getServerSession(authOptions);
  
  // Redirect authenticated users to dashboard, otherwise to sign in
  if (session) {
    redirect('/dashboard');
  } else {
    redirect('/signin');
  }
  
  // This won't be rendered due to redirects, but included as a fallback
  return null;
}