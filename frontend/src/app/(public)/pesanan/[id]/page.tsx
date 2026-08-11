import DetailPesananContent from "./DetailPesananContent";

export const metadata = {
  title: "Detail Pesanan | AgroWaste",
};

export default async function DetailPesananPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  return <DetailPesananContent id={resolvedParams.id} />;
}
