import Link from "next/link";
import type {Route} from "next";
import {requireCapability} from "@/lib/admin-access";
import {ReviewWorkflow,ReviewSection} from "@/components/admin/review-ui";

export default async function SpnTierReview(){
 await requireCapability("access_museum");await requireCapability("view_source_data");await requireCapability("view_full_saint_catalog");
 return <div className="admin-stack"><h1>SPN tier review</h1>
  <ReviewWorkflow eyebrow="Source Data" title="Review display tiers" description="Compare current proposals with researched evidence before changing a tier.">
   <ReviewSection title="Download the current review snapshot">
    <p><Link href={"/admin/source-data/museum/spn-proposals" as Route}>Review and confirm an SPN proposal</Link></p>
    <p>The snapshot groups placements by website record and keeps unlinked source rows separate. It includes current tiers, family evidence, published biographies and curator decisions.</p>
    <p>Some records describe deities, sites or combined entries. Review those separately from the human-saint prominence and biography criteria.</p>
    <p><a className="admin-form-button" href="/admin/source-data/museum/tier-review/export">Download SPN tier snapshot</a></p>
    <p>This download changes no tiers, sections, identities or planned locations. Research recommendations still need a supported, current-record decision.</p>
   </ReviewSection>
  </ReviewWorkflow>
  <p><Link href="/admin/source-data/museum">Back to museum source updates</Link></p>
 </div>;
}
