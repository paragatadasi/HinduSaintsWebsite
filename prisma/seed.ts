import { PrismaClient } from "@prisma/client";
import { toSlug } from "../lib/slugs";

const prisma = new PrismaClient();

async function main() {
  const advaita = await prisma.sampradaya.upsert({
    where: { slug: "advaita-vedanta" },
    update: {},
    create: {
      slug: "advaita-vedanta",
      name: "Advaita Vedanta",
      alternateNames: ["Advaita"],
      shortDescription: "A non-dual Vedantic tradition emphasizing the identity of Atman and Brahman.",
      status: "published",
      publishedAt: new Date()
    }
  });

  const ramana = await prisma.saint.upsert({
    where: { slug: "sri-ramana-maharshi" },
    update: {},
    create: {
      slug: toSlug("Sri Ramana Maharshi"),
      canonicalName: "Ramana Maharshi",
      displayName: "Sri Ramana Maharshi",
      shortDescription: "A sage of Arunachala whose teaching centered on self-inquiry and abiding in the Self.",
      eraLabel: "1879-1950",
      status: "published",
      featured: true,
      launchMvp: true,
      publishedAt: new Date(),
      sampradayas: {
        create: {
          sampradayaId: advaita.id,
          isPrimary: true
        }
      },
      aliases: {
        create: [
          { alias: "Bhagavan Sri Ramana", aliasType: "title" },
          { alias: "Ramana", aliasType: "alternate_spelling" }
        ]
      }
    }
  });

  await prisma.biography.upsert({
    where: { saintId_slug: { saintId: ramana.id, slug: "launch-biography" } },
    update: {},
    create: {
      saintId: ramana.id,
      title: "Launch biography",
      slug: "launch-biography",
      bodyMarkdown: "This is placeholder Markdown for a reviewed biography.",
      status: "needs_review"
    }
  });

  await prisma.instagramItem.upsert({
    where: { instagramUrl: "https://www.instagram.com/p/example/" },
    update: {},
    create: {
      instagramUrl: "https://www.instagram.com/p/example/",
      instagramShortcode: "example",
      type: "post",
      extractedSaintName: "Ramana Maharshi",
      status: "suggested",
      matchConfidence: "high",
      saints: {
        create: {
          saintId: ramana.id,
          matchStatus: "suggested",
          matchConfidence: "high",
          isPrimary: true
        }
      }
    }
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
