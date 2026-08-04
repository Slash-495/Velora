import { mockApplications } from "@/lib/mock-data";
import { ApplicationDetailClient } from "./ApplicationDetailClient";

export default async function ApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const application = mockApplications.find(a => a.id === resolvedParams.id) || mockApplications[0];

  return <ApplicationDetailClient application={application} />;
}
