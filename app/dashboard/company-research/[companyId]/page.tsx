import { mockCompanies } from "@/lib/mock-data";
import { CompanyDetailClient } from "./CompanyDetailClient";

export default async function CompanyDetailWorkspace({ params }: { params: Promise<{ companyId: string }> }) {
  const { companyId } = await params;
  // In a real app, this would be a server-side DB fetch:
  // const { data: company } = await supabase.from('companies').select('*').eq('id', companyId).single();
  const company = mockCompanies.find(c => c.id === companyId);

  if (!company) {
    return <div className="text-white p-8">Company not found.</div>;
  }

  return <CompanyDetailClient company={company} />;
}
