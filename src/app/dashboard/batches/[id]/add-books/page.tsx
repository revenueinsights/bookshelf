import { redirect } from 'next/navigation';

interface AddBooksPageProps {
  params: Promise<{ id: string }>;
}

export default async function AddBooksPage({ params }: AddBooksPageProps) {
  const { id } = await params;
  redirect(`/dashboard/scanner?batchId=${id}`);
} 