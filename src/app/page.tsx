import { redirect } from 'next/navigation';
import { isSystemSetup } from '@/app/actions/auth';

export default async function Home() {
  const setup = await isSystemSetup();
  if (!setup) {
    redirect('/setup');
  }
  redirect('/dashboard');
}
