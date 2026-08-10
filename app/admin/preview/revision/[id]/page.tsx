import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EditorialRevisionPreviewFrame } from "@/components/admin/editorial-revision-preview-frame";
import { PlaceDetailPageContent } from "@/components/places/place-detail-page";
import { SaintDetailPageContent } from "@/components/saints/saint-detail-page";
import { TraditionPageLayouts } from "@/components/traditions/tradition-page-layouts";
import { assertSaintsVisibleToUser, requireCapability } from "@/lib/admin-access";
import { getEditorialRevisionPreview } from "@/lib/editorial-revision-preview";
import { getPlaceDetailTemplateContent, getSaintDetailTemplateContent, getTraditionDetailTemplateContent } from "@/lib/site-content";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function EditorialRevisionPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireCapability("edit_long_form_content");

  const { id } = await params;
  const preview = await getEditorialRevisionPreview(id);
  if (!preview) notFound();
  if (preview.entityType === "saint") await assertSaintsVisibleToUser(user, [preview.entityId]);

  return (
    <EditorialRevisionPreviewFrame
      backHref={preview.backHref}
      entityType={preview.entityType}
      revisionStatus={preview.revisionStatus}
      title={preview.title}
    >
      {preview.entityType === "saint" ? (
        <SaintDetailPageContent relatedSaints={preview.relatedSaints} rootElement="div" saint={preview.content} template={getSaintDetailTemplateContent()} />
      ) : null}
      {preview.entityType === "tradition" ? (
        <TraditionPageLayouts rootElement="div" tradition={preview.content} template={getTraditionDetailTemplateContent()} />
      ) : null}
      {preview.entityType === "place" ? (
        <PlaceDetailPageContent place={preview.content} rootElement="div" template={getPlaceDetailTemplateContent()} />
      ) : null}
    </EditorialRevisionPreviewFrame>
  );
}
