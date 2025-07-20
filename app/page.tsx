import { redirect } from 'next/navigation';

export default function HomePage() {
  // Redirect to inbox as the main app page
  redirect('/inbox');
}