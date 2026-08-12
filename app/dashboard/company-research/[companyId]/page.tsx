import { mockCompanies } from "@/lib/mock-data";
import { CompanyDetailClient } from "./CompanyDetailClient";

export default async function CompanyDetailWorkspace({ params }: { params: Promise<{ companyId: string }> }) {
  const { companyId } = await params;
  const company = (mockCompanies || []).find(c => c.id === companyId) || mockCompanies[0];

  if (!company) {
    return <div className="text-white p-8">Company not found.</div>;
  }

  return <CompanyDetailClient company={company} />;
}
