// Server Component - SEM "use client"
import AdminClientPage from './admin-client-page';

interface AdminPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  // Server Component lê os searchParams com segurança
  const resolvedSearchParams = await searchParams;
  const initialTab = typeof resolvedSearchParams.tab === 'string' ? resolvedSearchParams.tab : undefined;
  
  // Passa como prop para o Client Component
  return <AdminClientPage initialTab={initialTab} />;
}