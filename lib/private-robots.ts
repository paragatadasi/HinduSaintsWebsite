import type { Metadata } from "next";

const privateRobotsRules = {
  index: false,
  follow: false,
  noarchive: true,
  nosnippet: true,
  noimageindex: true,
  nocache: true
} as const;

export const PRIVATE_ROBOTS: Metadata["robots"] = {
  ...privateRobotsRules,
  googleBot: privateRobotsRules
};
