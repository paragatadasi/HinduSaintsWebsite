UPDATE "SiteConfig"
SET
  "aboutSectionBodies" = ARRAY[
    E'This is our vision: a one-stop hub for everything saints. Biographies, teachings, relationships, stories and the connections between them.\n\nA single place where inspired seekers can meet and fall in love with saints from across the vast span of San' || chr(257) || 'tana Dharma' || chr(8212) || 'and follow the trail of love to their own Sadguru.',
    'Hindu Saints began as a personal archive' || chr(8212) || 'a way to understand how gurus, lineages and places meet across generations. It has grown into a carefully researched, freely accessible home for stories that deserve to remain alive.',
    'This project is offered in devotion to our beloved Guruji, Paramahamsa Vishwananda. His simple message' || chr(8212) || 'Just Love' || chr(8212) || 'guides everything we do.'
  ]::TEXT[],
  "aboutDiscoveryTitle" = 'Three ways into a vast tradition',
  "aboutDiscoveryItemTitles" = ARRAY['Saints', 'Traditions', 'Sacred Map']::TEXT[],
  "aboutDiscoveryItemBodies" = ARRAY[
    'Explore the lives of realised souls from across traditions.',
    'Enter living lineages and the teachings they carry.',
    'Discover places connected to saints and seekers.'
  ]::TEXT[],
  "aboutDiscoveryItemHrefs" = ARRAY['/saints', '/traditions', '/map']::TEXT[],
  "aboutDiscoveryItemIcons" = ARRAY['sparkles', 'book', 'map']::TEXT[];
