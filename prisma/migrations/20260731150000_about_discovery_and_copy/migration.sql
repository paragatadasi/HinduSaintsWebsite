ALTER TABLE "SiteConfig"
ADD COLUMN "aboutDiscoveryTitle" TEXT,
ADD COLUMN "aboutDiscoveryItemTitles" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "aboutDiscoveryItemBodies" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "aboutDiscoveryItemHrefs" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "aboutDiscoveryItemIcons" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

UPDATE "SiteConfig"
SET
  "aboutEyebrow" = 'A living devotional archive',
  "aboutTitle" = 'The stories of saints, carried forward.',
  "aboutIntroduction" = 'Hindu Saints brings together lives, traditions, places and teachings in one contemplative home—made for seekers, students and the simply curious.',
  "aboutSectionTitles" = ARRAY[
    'A quiet place to learn, remember and return.',
    'Built from devotion, shaped by curiosity.',
    'Grounded in grace.'
  ]::TEXT[],
  "aboutSectionBodies" = ARRAY[
    'This is our vision: a one-stop hub for everything saints. Biographies, teachings, relationships, stories and the connections between them.\n\nA single place where inspired seekers can meet and fall in love with saints from across the vast span of Sanātana Dharma—and follow the trail of love to their own Sadguru.',
    'Hindu Saints began as a personal archive—a way to understand how gurus, lineages and places meet across generations. It has grown into a carefully researched, freely accessible home for stories that deserve to remain alive.',
    'This project is offered in devotion to our beloved Guruji, Paramahamsa Vishwananda. His simple message—Just Love—guides everything we do.'
  ]::TEXT[],
  "aboutDiscoveryTitle" = 'Four ways into a vast tradition',
  "aboutDiscoveryItemTitles" = ARRAY['Saints', 'Traditions', 'Sacred Map', 'Wisdom']::TEXT[],
  "aboutDiscoveryItemBodies" = ARRAY[
    'Explore the lives of realised souls from across traditions.',
    'Enter living lineages and the teachings they carry.',
    'Discover places connected to saints and seekers.',
    'Be inspired by timeless teachings and stories.'
  ]::TEXT[],
  "aboutDiscoveryItemHrefs" = ARRAY['/saints', '/traditions', '/map', '/saints']::TEXT[],
  "aboutDiscoveryItemIcons" = ARRAY['sparkles', 'book', 'map', 'flame']::TEXT[];
