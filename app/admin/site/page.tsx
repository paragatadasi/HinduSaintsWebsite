import { HomepageSettings } from "./homepage-settings";

type AdminSiteHomepagePageProps = {
  searchParams: Promise<{ homepage?: string | string[] }>;
};

export default async function AdminSiteHomepagePage({ searchParams }: AdminSiteHomepagePageProps) {
  const { homepage } = await searchParams;

  return (
    <div className="admin-stack">
      {getSearchParam(homepage) === "saved" ? (
        <p className="admin-notice form-status form-status--success">Homepage settings updated.</p>
      ) : null}
      <HomepageSettings />
    </div>
  );
}

function getSearchParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0]?.trim() ?? "";
  return value?.trim() ?? "";
}
