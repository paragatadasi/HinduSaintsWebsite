import { IndexHeroSettings } from "../index-hero-settings";

type AdminDirectoryHeadersPageProps = {
  searchParams: Promise<{ heroes?: string | string[] }>;
};

export default async function AdminDirectoryHeadersPage({ searchParams }: AdminDirectoryHeadersPageProps) {
  const { heroes } = await searchParams;

  return (
    <div className="admin-stack">
      {getSearchParam(heroes) === "saved" ? (
        <p className="admin-notice form-status form-status--success">Directory hero images updated.</p>
      ) : null}
      <IndexHeroSettings />
    </div>
  );
}

function getSearchParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0]?.trim() ?? "";
  return value?.trim() ?? "";
}
