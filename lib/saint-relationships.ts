import type { RelationshipType } from "@/lib/generated/prisma/client";

export const relationshipTypeOptions: Array<{ value: RelationshipType; label: string }> = [
  { value: "guru", label: "Guru" },
  { value: "disciple", label: "Disciple" },
  { value: "parent", label: "Parent" },
  { value: "child", label: "Child" },
  { value: "father", label: "Father" },
  { value: "mother", label: "Mother" },
  { value: "son", label: "Son" },
  { value: "daughter", label: "Daughter" },
  { value: "husband", label: "Husband" },
  { value: "wife", label: "Wife" },
  { value: "partner", label: "Partner" },
  { value: "incarnation", label: "Incarnation" },
  { value: "family", label: "Family" },
  { value: "influence", label: "Influence" },
  { value: "initiator", label: "Initiator" },
  { value: "patron", label: "Patron" },
  { value: "successor", label: "Successor" },
  { value: "debate_opponent", label: "Debate opponent" },
  { value: "contemporary", label: "Contemporary" },
  { value: "associated", label: "Associated" },
  { value: "lineage", label: "Lineage" },
  { value: "related", label: "Related" },
  { value: "untyped", label: "Untyped" }
];

const reciprocalTypes: Partial<Record<RelationshipType, RelationshipType>> = {
  guru: "disciple",
  disciple: "guru",
  parent: "child",
  child: "parent",
  father: "child",
  mother: "child",
  son: "parent",
  daughter: "parent",
  husband: "wife",
  wife: "husband"
};

export function getReciprocalRelationshipType(type: RelationshipType): RelationshipType {
  return reciprocalTypes[type] ?? type;
}

export function formatRelationshipType(type: RelationshipType) {
  return relationshipTypeOptions.find((option) => option.value === type)?.label ?? type.replace(/_/g, " ");
}
