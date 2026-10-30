import { CompanyDetailClient } from "./CompanyDetailClient";

export default async function CompanyDetailWorkspace({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) {
  const { companyId } = await params;
  return <CompanyDetailClient companyId={companyId} />;
}
