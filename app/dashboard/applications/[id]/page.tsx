import { ApplicationDetailClient } from "./ApplicationDetailClient";

export default async function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  return <ApplicationDetailClient applicationId={resolvedParams.id} />;
}
