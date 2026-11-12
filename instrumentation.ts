import { PHASE_PRODUCTION_BUILD } from "next/constants";

export async function register() {
  if (
    process.env.NEXT_RUNTIME === "nodejs" &&
    process.env.NODE_ENV === "production" &&
    process.env.NEXT_PHASE !== PHASE_PRODUCTION_BUILD
  ) {
    const { startFeedbackRetention } = await import("./lib/feedback-retention");
    startFeedbackRetention();
  }
}
