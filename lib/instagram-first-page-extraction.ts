import { compactMetadata, parseInstagramFirstPageMetadata, type InstagramFirstPageMetadata } from "./instagram-metadata";

type RawPayload = Record<string, unknown>;

export type InstagramFirstPageDraft = {
  firstPageText?: string;
  metadata: InstagramFirstPageMetadata;
  source: "stored_text" | "caption" | "openai_vision" | "none";
  imageUrl?: string;
  error?: string;
};

type ExtractionInput = {
  rawPayloadJson?: unknown;
  captionText?: string | null;
  thumbnailUrl?: string | null;
};

type OpenAIResponse = {
  output_text?: string;
  output?: Array<{
    content?: Array<{
      text?: string;
      type?: string;
    }>;
  }>;
  error?: {
    message?: string;
  };
};

const TEXT_KEYS = [
  "firstPageText",
  "first_page_text",
  "firstSlideText",
  "first_slide_text",
  "coverText",
  "cover_text",
  "ocrText",
  "ocr_text",
  "altText",
  "alt_text",
  "accessibilityCaption",
  "accessibility_caption"
];

const IMAGE_KEYS = [
  "firstPageImageUrl",
  "first_page_image_url",
  "firstSlideImageUrl",
  "first_slide_image_url",
  "coverImageUrl",
  "cover_image_url",
  "imageUrl",
  "image_url",
  "mediaUrl",
  "media_url",
  "thumbnailUrl",
  "thumbnail_url"
];

export async function extractInstagramFirstPageDraft({
  rawPayloadJson,
  captionText,
  thumbnailUrl
}: ExtractionInput): Promise<InstagramFirstPageDraft> {
  const raw = getRawPayload(rawPayloadJson);
  const storedText = pickString(raw, TEXT_KEYS);
  const storedDraft = draftFromText(storedText, "stored_text");
  if (storedDraft) return storedDraft;

  const imageUrl = getFirstPageImageUrl(raw, thumbnailUrl);
  if (!imageUrl) {
    const captionDraft = draftFromStrictCaptionText(captionText);
    return captionDraft ?? { metadata: {}, source: "none", error: "No first-page image URL was found in the Instagram import." };
  }
  if (!process.env.OPENAI_API_KEY) {
    return { metadata: {}, source: "none", imageUrl, error: "Set OPENAI_API_KEY to extract first-page text from images." };
  }

  try {
    const extracted = await extractFirstPageWithOpenAI(imageUrl);
    const text = normalizeText(extracted.firstPageText);
    const metadata = compactMetadata({
      ...parseInstagramFirstPageMetadata(text),
      ...extracted.metadata
    });

    return {
      firstPageText: text,
      metadata,
      source: "openai_vision",
      imageUrl
    };
  } catch (error) {
    return {
      metadata: {},
      source: "none",
      imageUrl,
      error: error instanceof Error ? error.message : "Image extraction failed."
    };
  }
}

export function getFirstPageImageUrl(rawPayloadJson: unknown, fallbackUrl?: string | null) {
  const raw = getRawPayload(rawPayloadJson);
  const childImageUrl = getFirstCarouselChildImageUrl(raw);
  return childImageUrl ?? pickString(raw, IMAGE_KEYS) ?? (normalizeText(fallbackUrl ?? undefined) || undefined);
}

function draftFromText(value: string | null | undefined, source: "stored_text" | "caption") {
  const text = normalizeText(value);
  if (!text) return undefined;

  const metadata = parseInstagramFirstPageMetadata(text);
  const fieldCount = [
    metadata.displayName,
    metadata.born,
    metadata.samadhi,
    metadata.keyPlace,
    metadata.tradition,
    metadata.guru
  ].filter(Boolean).length;

  return fieldCount > 1 ? { firstPageText: text, metadata, source } satisfies InstagramFirstPageDraft : undefined;
}

function draftFromStrictCaptionText(value: string | null | undefined) {
  const text = normalizeText(value);
  if (!text) return undefined;

  const explicitFieldCount = text
    .split(/\r?\n/)
    .filter((line) => /^\s*(?:born|samadhi|key\s+place|tradition|guru)\s*[:\-–—]/i.test(line))
    .length;
  if (explicitFieldCount < 2) return undefined;

  return draftFromText(text, "caption");
}

async function extractFirstPageWithOpenAI(imageUrl: string) {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: process.env.OPENAI_FIRST_PAGE_MODEL ?? "gpt-5.5",
      input: [{
        role: "user",
        content: [
          {
            type: "input_text",
            text: [
              "Transcribe the visible text from this Instagram carousel cover image.",
              "Return only JSON with keys: firstPageText, displayName, subtitle, born, samadhi, keyPlace, tradition, guru.",
              "Use null for fields that are not visible. Do not infer or invent missing biographical data."
            ].join(" ")
          },
          {
            type: "input_image",
            image_url: imageUrl
          }
        ]
      }]
    })
  });

  const json = await response.json() as OpenAIResponse;
  if (!response.ok) throw new Error(json.error?.message ?? `OpenAI image extraction failed with status ${response.status}.`);

  const outputText = getOpenAIOutputText(json);
  const parsed = parseJsonObject(outputText);

  return {
    firstPageText: getString(parsed.firstPageText),
    metadata: compactMetadata({
      displayName: getString(parsed.displayName),
      subtitle: getString(parsed.subtitle),
      born: getString(parsed.born),
      samadhi: getString(parsed.samadhi),
      keyPlace: getString(parsed.keyPlace),
      tradition: getString(parsed.tradition),
      guru: getString(parsed.guru)
    })
  };
}

function getOpenAIOutputText(response: OpenAIResponse) {
  const outputText = normalizeText(response.output_text);
  if (outputText) return outputText;

  return normalizeText(response.output?.flatMap((item) => item.content ?? []).map((content) => content.text).filter(Boolean).join("\n"));
}

function parseJsonObject(value: string) {
  const trimmed = value.trim();
  const jsonText = trimmed.startsWith("{") ? trimmed : trimmed.match(/\{[\s\S]*\}/)?.[0];
  if (!jsonText) throw new Error("OpenAI image extraction did not return JSON.");
  const parsed = JSON.parse(jsonText) as unknown;
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("OpenAI image extraction returned invalid JSON.");
  return parsed as Record<string, unknown>;
}

function getRawPayload(value: unknown): RawPayload | undefined {
  return value && typeof value === "object" && !Array.isArray(value) ? value as RawPayload : undefined;
}

function getFirstCarouselChildImageUrl(raw: RawPayload | undefined) {
  const children = getRawPayload(raw?.children);
  const data = Array.isArray(children?.data) ? children.data : undefined;
  const firstChild = data?.find((child) => getRawPayload(child));
  return pickString(getRawPayload(firstChild), IMAGE_KEYS);
}

function pickString(raw: RawPayload | undefined, keys: string[]) {
  if (!raw) return undefined;
  const normalizedKeys = new Set(keys.map((key) => key.toLowerCase()));
  const match = Object.entries(raw).find(([key, value]) => normalizedKeys.has(key.trim().toLowerCase()) && value != null);
  return stringify(match?.[1]);
}

function getString(value: unknown) {
  return typeof value === "string" ? normalizeText(value) || undefined : undefined;
}

function stringify(value: unknown) {
  if (typeof value === "string") return normalizeText(value) || undefined;
  if (typeof value === "number") return String(value);
  return undefined;
}

function normalizeText(value: string | undefined | null) {
  return value?.replace(/\s+/g, " ").trim() ?? "";
}
