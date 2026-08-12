export type DevelopmentExperienceKind = "feature" | "page";

export type DevelopmentExperienceDefinition = {
  key: string;
  name: string;
  description: string;
  kind: DevelopmentExperienceKind;
  previewHref?: string;
};

export const DEVELOPMENT_EXPERIENCES = [
  {
    key: "saint-profile-preview",
    name: "Saint profile preview",
    description: "Review the shared saint profile presentation before new profile work is public.",
    kind: "page",
    previewHref: "/preview/saint/ramana-maharshi"
  }
] as const satisfies readonly DevelopmentExperienceDefinition[];

export type DevelopmentExperienceKey = typeof DEVELOPMENT_EXPERIENCES[number]["key"];

export function getDevelopmentExperienceDefinition(key: string) {
  return DEVELOPMENT_EXPERIENCES.find((experience) => experience.key === key);
}

export function isDevelopmentExperienceKey(key: string): key is DevelopmentExperienceKey {
  return Boolean(getDevelopmentExperienceDefinition(key));
}
