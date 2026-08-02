"use client";

import { Image } from "lucide-react";
import { useState } from "react";
import { SearchableMultiSelect, type SearchableMultiSelectOption } from "@/components/ui/searchable-multi-select";
import { HomeBannerFocalPicker } from "./home-banner-focal-picker";
import { HomeBannerUploader } from "./home-banner-uploader";

type Placement = {
  traditionId: string;
  bannerImageId?: string;
  bannerImage?: {
    url: string;
    altText?: string;
  };
  focalX: number;
  focalY: number;
  focalWidth: number;
  focalHeight: number;
};

type FeaturedTraditionPlacementsEditorProps = {
  initialPlacements: Placement[];
  options: SearchableMultiSelectOption[];
};

const MAX_PLACEMENTS = 5;

export function FeaturedTraditionPlacementsEditor({ initialPlacements, options }: FeaturedTraditionPlacementsEditorProps) {
  const [selectedTraditionIds, setSelectedTraditionIds] = useState(initialPlacements.map((placement) => placement.traditionId));
  const placementsByTraditionId = new Map(initialPlacements.map((placement) => [placement.traditionId, placement]));

  return (
    <div className="form-stack">
      <SearchableMultiSelect
        defaultSelectedValues={selectedTraditionIds}
        label="Traditions"
        maxSelected={MAX_PLACEMENTS}
        name="featuredTraditionId"
        onSelectionChange={setSelectedTraditionIds}
        options={options}
        placeholder="Search traditions"
        renderHiddenInputs={false}
        reorderable
        selectedLabel="Featured traditions"
      />
      {selectedTraditionIds.length >= MAX_PLACEMENTS ? (
        <p className="admin-notice">The homepage supports five featured-tradition placements.</p>
      ) : null}
      <div className="home-featured-placement-list">
        {selectedTraditionIds.map((traditionId, index) => {
          const placement = placementsByTraditionId.get(traditionId);
          const option = options.find((candidate) => candidate.value === traditionId);
          const fieldPrefix = `featuredTraditionFocal${index}`;

          return (
            <section className="home-featured-placement" key={traditionId}>
              <input name="featuredTraditionId" type="hidden" value={traditionId} />
              <div className="home-featured-placement__heading">
                <span className="home-featured-placement__icon" aria-hidden="true"><Image size={18} /></span>
                <div>
                  <div className="eyebrow">Placement {index + 1}{index === 0 ? " · Large card" : " · Small card"}</div>
                  <h4>{option?.label ?? "Selected tradition"}</h4>
                </div>
              </div>
              <div className="home-config-media">
                {placement?.bannerImage ? (
                  <HomeBannerFocalPicker
                    altText={placement.bannerImage.altText ?? `${option?.label ?? "Tradition"} homepage banner`}
                    defaultArea={{
                      x: placement.focalX,
                      y: placement.focalY,
                      width: placement.focalWidth,
                      height: placement.focalHeight
                    }}
                    fieldNamePrefix={fieldPrefix}
                    imageUrl={placement.bannerImage.url}
                  />
                ) : (
                  <>
                    <input name={`${fieldPrefix}X`} type="hidden" value={50} />
                    <input name={`${fieldPrefix}Y`} type="hidden" value={50} />
                    <input name={`${fieldPrefix}Width`} type="hidden" value={60} />
                    <input name={`${fieldPrefix}Height`} type="hidden" value={60} />
                    <p className="empty-note">No banner selected for this placement.</p>
                  </>
                )}
                <HomeBannerUploader
                  allowClear
                  defaultBannerImageId={placement?.bannerImageId ?? ""}
                  fieldName="featuredTraditionBannerImageId"
                  uploadLabel={`${option?.label ?? "tradition"} homepage banner`}
                />
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
