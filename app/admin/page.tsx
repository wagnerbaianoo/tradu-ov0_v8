// Server Component - SEM "use client"
import AdminClientPage from './admin-client-page';

interface AdminPageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

export default function AdminPage({ searchParams }: AdminPageProps) {
  // Server Component lê os searchParams com segurança
  const initialTab = typeof searchParams.tab === 'string' ? searchParams.tab : undefined;
  
  // Passa como prop para o Client Component
  return <AdminClientPage initialTab={initialTab} />;
}