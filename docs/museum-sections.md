# Museum section planning

This guide defines the editorial intent for Airtable museum-section fields and gives the archivalist a working structure for grouping saints into broad, visitor-intuitive museum sections.

Airtable remains an import and review source. These fields are planning metadata for museum organization and should not expose private museum or relic details publicly.

## Airtable fields

Create these fields on the Airtable saints table:

- `Primary Museum Section`: single select. The best recommended placement.
- `Alternative Museum Sections`: multiple select. Other viable placements that use the same section vocabulary.
- `Museum Section Tier`: single select with `Featured`, `Secondary`, `Tertiary`.
- `Museum Section Rationale`: long text. Brief explanation of why the section and tier were proposed.
- `Museum Section Confidence`: single select with `High`, `Medium`, `Low`.
- `Museum Section Internal Placement Note`: long text. Optional note about where the saint belongs inside the section, especially when family, region, and sampradaya pull in different directions.

## Assignment principles

Museum sections are broad controlled categories, not one-to-one copies of spiritual regions. They may be based on sampradaya, family, movement, sacred geography, or a higher-level regional devotional cluster.

Use this priority order:

1. Family overrides geography.
2. Sampradaya can define a section when it is intuitive for visitors.
3. Spiritual region provides the main fallback when family and sampradaya do not clearly decide placement.
4. Alternatives preserve other legitimate ways to place the saint, especially when museum space or physical adjacency may matter.

Every saint should receive a `Primary Museum Section`, even if confidence is low. Use alternatives and rationale to surface uncertainty.

The family override should be strict for real devotional, guru-disciple, partner, incarnation, or lineage clusters. The main case where strict family override should be questioned is data hygiene: accidental duplicate clusters, source URLs treated as saints, vague association-only links, or families that are clearly artifacts of incomplete cleanup. In those cases, assign according to the best family hypothesis, mark confidence low, and explain the concern.

## Tiering model

Use tiers to help the archivalist organize each physical section.

- `Featured`: major anchor figures, lineage heads, incarnation centers, or saints who define the visitor's understanding of the section.
- `Secondary`: close disciples, partners, successors, family members, direct associates, or saints strongly tied to the featured figures.
- `Tertiary`: related saints, regional comparanda, loose sampradaya connections, later followers, or saints whose presence helps complete the section but should not drive its structure.

When family is the primary reason for placement, tiering should usually follow the family tree: family heads and widely recognized figures are featured; direct disciples and immediate successors are secondary; wider descendants and contextual relations are tertiary.

## Initial museum section vocabulary

This starting vocabulary is intentionally broad. The archivalist can split, merge, or rename sections after seeing density and physical space constraints.

- `Gaudiya Vaishnava`
- `Varkari`
- `Datta Tradition`
- `Ramanandi`
- `Rama & Avadh`
- `Braj & Krishna Bhakti`
- `Jagannath-Puri & Odisha`
- `Kashi & Ascetic Lineages`
- `Rishikesh-Haridwar & Himalayan Monastic Lineages`
- `Girnar & Nath Traditions`
- `Maharashtra Guru Lineages`
- `Ramana & Arunachala`
- `Sri Vaishnava & South Indian Vaishnava Traditions`
- `Shaiva Siddhanta & Tamil Traditions`
- `Andhra Avadhuta & Datta-Advaita Lineages`
- `Gujarat & Swaminarayan Traditions`
- `Sikh & Punjab Traditions`
- `Bengal Shakta, Baul & Modern Saints`
- `Buddhist Saints`
- `Udasin Saints`
- `Bhakti Marga & Mauritius Lineage`
- `Global & Diaspora Lineages`
- `Needs Research`

## Section notes

### Gaudiya Vaishnava

Use for Chaitanya, Nityananda, the Vrindavan Goswamis, Navadwip-Mayapur figures, Gaudiya math lineages, and closely related Bengal-Braj-Puri Gaudiya families.

Featured candidates include Sri Chaitanya Mahaprabhu, Sri Nityananda Prabhu, the Goswamis of Vrindavan, Bhaktisiddhanta Sarasvati Thakura, A. C. Bhaktivedanta Swami Prabhupada, and major lineage heads from the large Gaudiya family clusters.

Secondary candidates include direct disciples, successors, major babajis, Gaudiya math acharyas, and associated Puri/Odisha or Navadwip figures.

Tertiary candidates include saints with weaker Gaudiya affiliation, geographically adjacent Bengal/Odisha saints, or records where sampradaya is Gaudiya but family linkage is incomplete.

Organize internally by subgroups: Navadwip-Mayapur, Vrindavan Goswamis, Puri-Odisha Gaudiya lineages, global Gaudiya expansion, and smaller Bengal devotional families. Keep these subgroups adjacent rather than splitting the section too early.

### Varkari

Use for Pandharpur/Vitthal-centered saints and Varkari devotional families. This should usually aggregate by movement rather than by small local geographies inside Maharashtra.

Featured candidates include major Varkari anchors such as Tukaram, Namdev-related records, and other widely recognized Pandharpur-centered saints.

Secondary candidates include direct family or lineage associates, saints from nearby Maharashtra devotional centers, and clearly Varkari-linked followers.

Tertiary candidates include Maharashtra saints whose spiritual region touches Varkari Heartland but whose family points elsewhere. If a saint belongs to a strong non-Varkari family, keep the family primary and place `Varkari` as an alternative.

### Datta Tradition

Use for Dattatreya, Narasimha Saraswati, Swami Samarth, Akkalkot, Narsobawadi, Kolhapur, Kurvapur, and related Datta-family or Datta-region saints.

Featured candidates include Dattatreya, Narasimha Saraswati, Swami Samarth Maharaj of Akkalkot, and other incarnation-center figures in the Datta family cluster.

Secondary candidates include close disciples, successors, Akkalkot and Narsobawadi associates, and saints whose primary family is Datta even when their place points to Girnar, Maharashtra, Gujarat, or Karnataka.

Tertiary candidates include Maharashtra or Andhra saints with Datta adjacency but no strong family tie.

### Kriya Yoga

Kriya Yoga is currently grouped into `Rishikesh-Haridwar & Himalayan Monastic Lineages` rather than maintained as a separate top-level museum section. Use the Kriya family as an internal subgroup within that broader Himalayan/monastic section.

Featured candidates include Mahavatar Kriya Babaji, Sri Lahiri Mahasaya, Sri Yukteswar Giri, Paramahamsa Yogananda, and central global lineage figures.

Secondary candidates include direct disciples, successors, and family-linked Kriya teachers even when their geography points to Bengal, Kashi, Puri, Gorakhpur, the Himalayas, or global diaspora centers.

Tertiary candidates include saints with only a weak Kriya association or uncertain sampradaya fields.

### Ramanandi

Use when Ramanandi identity or family clearly leads the placement. Do not force every Rama-bhakti or Braj saint into this section if a stronger family section exists.

Featured candidates should be family heads, major Ramanandi acharyas, and recognized Tyagi or Akhara anchors.

Secondary candidates include direct disciples and nearby family-linked saints.

Tertiary candidates include sampradaya-only Ramanandi links where there is not yet an explicit relationship narrative between individual saints, plus Ramanandi-linked saints whose geography would also support Braj, Kashi, Chitrakoot, or Avadh placement.

Use the virtual curatorial family `CUR-FAM-RAMANANDACHARYA` for Sri Ravidas of Varanasi, Sri Kabhir Devji of Varanasi, and Sri Mira Bai of Rajasthan. Ramanandacharya is the common guru of Ravidas and Kabhir Devji and the founder of the Ramanandi Sampradaya, but he is not represented as a saint row because his relics are not in the table. Mira Bai should be represented as a disciple of Ravidas in relationship update proposals.

For museum layout, place Ramanandi near `Rama & Avadh`, `Braj & Krishna Bhakti`, and `Kashi & Ascetic Lineages`. This adjacency handles many edge cases better than splitting too finely.

### Rama & Avadh

Use for saints whose visitor-facing context is Ayodhya, Avadh, Rama bhakti, Chitrakoot, or Tulsidas-related devotional geography, unless a strong family places them in Ramanandi or another section.

Featured candidates include Tulsidas-related records and major Rama-bhakti anchors.

Secondary and tertiary candidates should be organized by Ayodhya, Chitrakoot, Kashi connections, and family proximity.

### Braj & Krishna Bhakti

Use for Vrindavan, Barsana, Govardhan, Mathura, and broader Krishna-bhakti saints when Gaudiya, Ramanandi, Nimbarka, or another family/sampradaya does not more strongly decide placement.

Featured candidates should be the saints most recognizable through Braj itself.

Secondary candidates include closely associated Braj disciples and families.

Tertiary candidates include saints for whom Braj is an important alternative placement but not the family-led primary section.

### Jagannath-Puri & Odisha

Use for Puri, Jagannath, Odisha devotional lineages, and saints whose family is Odisha-centered without a stronger Gaudiya or Kriya placement.

Featured candidates include major Puri and Jagannath-centered saints.

Secondary candidates include Odisha disciples, ashram families, and regional devotional clusters.

Tertiary candidates include saints with Puri as a major life-place but whose family belongs primarily to Gaudiya Vaishnava or Kriya Yoga. In those cases, use this as an alternative.

### Kashi & Ascetic Lineages

Use for Varanasi/Kashi saints, renunciant lineages, akhara-related saints, and saints where Kashi is the dominant visitor-facing anchor.

Featured candidates include major Kashi figures and lineage heads.

Secondary candidates include disciples, ashram associates, and saints whose Kashi identity is strong but family is incomplete.

Tertiary candidates include saints with Kashi as an alternative to Ramanandi, Kriya, or broader ascetic sections.

### Rishikesh-Haridwar & Himalayan Monastic Lineages

Use for Rishikesh, Haridwar, Uttarakhand, upper Himalayan monastic corridors, Kriya Yoga, and modern monastic lineages such as Sivananda when family points there.

Featured candidates include Mahavatar Kriya Babaji, Lahiri Mahasaya, Sri Yukteswar Giri, Paramahamsa Yogananda, Swami Sivananda Saraswati of Rishikesh, and other strong lineage heads.

Secondary candidates include direct disciples, successors, and close ashram associates.

Tertiary candidates include saints with Himalayan geography but stronger family placement elsewhere.

### Girnar & Nath Traditions

Use for Girnar, Nath, Juna Akhara, and related Gujarat/Maharashtra Shaiva ascetic clusters when family or tradition points there.

Featured candidates include Girnar and Nath lineage heads.

Secondary candidates include disciples and local ashram or akhara associates.

Tertiary candidates include saints with only geographic or weak ascetic affinity.

### Maharashtra Guru Lineages

Use for Maharashtra devotional and guru families that are not better placed in Varkari, Datta, or another specific section. Shirdi and related modern guru centers are part of this section because Shirdi is within Maharashtra and the surrounding Maharashtra networks are more intuitive together than split apart.

Featured candidates include major family heads such as Samarth Ramdas, Shirdi Sai Baba, Upasni Maharaj, Hazrat Babajan, Hazrat Tajuddin Baba, Narayan Maharaj of Khedgoan Bed, Bhagavan Nityananda of Ganeshpuri, Gajanan Maharaj, and other strong Maharashtra-centered lineage anchors when not better split.

Secondary candidates include disciples and direct family members.

Tertiary candidates include regional Maharashtra saints whose exact family is unclear.

Use `CUR-FAM-FIVE-PERFECT-MASTERS` as an internal subgroup for Shirdi Sai Baba, Upasni Maharaj, Hazrat Babajan, Hazrat Tajuddin Baba, Narayan Maharaj of Khedgoan Bed, and Meher Baba. Hazrat Babajan should be represented as guru of Meher Baba in relationship update proposals. This subgroup helps explain the Meher Baba-era connection without splitting Shirdi and Maharashtra into separate top-level museum sections.

### Ramana & Arunachala

Use for Ramana Maharshi, Arunachala, Tiruvannamalai, and direct Ramana-family or Ramana-sampradaya saints.

Featured candidates include Ramana Maharshi and the strongest direct associates.

Secondary candidates include disciples, close family associates, and nearby Arunachala-linked figures.

Tertiary candidates include South Indian Advaita or contemplative saints whose family is weak but who are meaningful nearby.

### Sri Vaishnava & South Indian Vaishnava Traditions

Use for Sri Vaishnava, Ramanuja, Tirumala, and South Indian Vaishnava saints when family or sampradaya is stronger than generic southern geography.

Organize internally by Sri Vaishnava/Ramanuja, Tirumala-Vaishnava region, and related southern Vaishnava families.

### Shaiva Siddhanta & Tamil Traditions

Use for Tamil Shaiva, Shaiva Siddhanta, Kumbakonam, Tiruvannamalai-adjacent but non-Ramana saints, and southern Shaiva families.

Keep close to `Ramana & Arunachala` if physical layout supports it, but avoid merging them unless space requires it.

### Andhra Avadhuta & Datta-Advaita Lineages

Use for Andhra avadhuta, Datta-Advaita, Coastal Andhra, and Andhra General clusters that do not belong to a stronger family section.

Featured candidates should be the best-known Andhra anchors and clear family heads.

Secondary candidates include disciples and center-linked saints.

Tertiary candidates include general Andhra saints with weak family data.

### Gujarat & Swaminarayan Traditions

Use for Gujarat saints, Swaminarayan, Pushkar/Rajputana-adjacent western devotional clusters when family and tradition point west.

If Girnar/Nath is the stronger family or visitor context, use `Girnar & Nath Traditions` as primary and this as an alternative.

Use `CUR-FAM-SWAMINARAYAN-BAPS-GURUS` as an internal featured subgroup for present key Swaminarayan/BAPS guru records. Current matched records are Bhagwan Swaminarayan, Yogiji Maharaj, and Pramukh Swami Maharaj. These should be tagged with `Swaminarayan` sampradaya in Airtable where the source export currently says `(No Sampradaya)`.

Do not create museum proposals for absent rows. In the current export, Gunatitanand Swami, Shastri Yagnapurushdas/Shastriji Maharaj, and Mahant Swami Maharaj were not found; add them to the subgroup later if relic rows are added.

### Sikh & Punjab Traditions

Use for Sikh, Punjab, and Punjab-centered saints when the visitor-facing context is clearly Sikh/Punjab devotional history. Use `Udasin Saints` as the primary section for explicitly Udasin records, with this section as an adjacent or alternative placement when Punjab history is important.

### Bengal Shakta, Baul & Modern Saints

Use for Bengal saints that do not belong primarily to Gaudiya Vaishnava, Ramakrishna/Tota Puri-style family clusters, or another stronger section.

Organize internally by Baul, Shakta/Tantric, Kolkata spiritual sphere, Bangladesh/South Asia, and modern Bengal saints.

Use `CUR-FAM-AUROBINDO-INTEGRAL-YOGA` as an internal modern-family bridge for Sri Mirra Alfassa, Sri Dadaji Dilip Kumar Roy, and Sri Indira Devi. Sri Aurobindo is the absent source figure because his relics are not represented in the table; Dadaji Dilip Kumar Roy should be understood as Sri Aurobindo's disciple and Indira Devi's guru, while Sri Mirra Alfassa should be understood as Sri Aurobindo's spiritual partner/coworker.

Featured candidates for this subgroup include Sri Mirra Alfassa. Secondary candidates include Dadaji Dilip Kumar Roy and Indira Devi. Keep `Shaiva Siddhanta & Tamil Traditions` and `Maharashtra Guru Lineages` as adjacent or alternative contexts for Auroville/Puducherry and Pune, but keep the family together in the primary recommendation.

### Buddhist Saints

Use for Gautama Buddha and records explicitly identified as Buddhist saints. This section is intentionally a top-level museum section because Buddhist identity is clearer to browse as its own tradition than as a generic global or regional category.

Featured candidates include Gautama Buddha and any clearly identified Buddhist anchor figures.

Secondary candidates include named Buddhist saints with strong biographical identity or direct tradition context.

Tertiary candidates include unidentified Buddhist relic records or saints whose Buddhist connection is plausible but thinly described.

Place this section near `Bihar`, `Kashi & Ascetic Lineages`, or broader renunciant material if the physical layout needs a geographic bridge, but do not bury Buddhist records under `Global & Diaspora Lineages`.

### Udasin Saints

Use for Baba Udasin and records explicitly tied to the Udasin Sampradaya or Udasin ashram context. This should be a distinct section for now because the relationship is not always visible from place data alone.

Featured candidates include Baba Udasin and the clearest Udasin lineage anchors.

Secondary candidates include named Udasin saints with strong ashram, disciple, or sampradaya context.

Tertiary candidates include Udasin-associated saints where the record is mostly geographic or the lineage relationship needs archival review.

Keep this section physically near `Sikh & Punjab Traditions`, `Kashi & Ascetic Lineages`, or `Rishikesh-Haridwar & Himalayan Monastic Lineages` depending on space, because those adjacent sections can carry Punjab, ascetic, and Himalayan overlaps without forcing a merge.

### Bhakti Marga & Mauritius Lineage

Use for saints affiliated with the project's lineage, Bhakti Marga, and the Mauritius-centered devotional context connected to the country of the Founder. This is an explicit curatorial section because the current data mostly presents these saints as `Global`, Kenya, Brazil, Suriname, or Mauritius records, which does not capture the intended museum relationship.

Initial included saints:

- Arav Das of Salvador, Brazil
- Kaji of Kenya
- Mr Natwarlal Shah (Mzee) of Kenya
- Mrs Kasturben Natwarlal Shah (Mauri) of Kenya
- Anuraagini Dasi - Manju Komalram of Mauritius
- Sri Gurudev Veervasantha of Surinam, Mauritius
- Sri Narendra Kumar Geerjanan (Dinesh) of Rose Hill Mauritius
- Sri Rashmanee Geerjanan (Manee) of Rose Hill, Mauritius

Featured candidates should be the saints most important to the Bhakti Marga and Mauritius lineage story, especially those with direct devotional significance to the Founder or the living lineage context.

Secondary candidates include the Rose Hill Mauritius partner-family, Kenya-connected devotees, and other direct lineage-affiliated saints.

Tertiary candidates include diaspora-related saints whose geography is Brazil, Kenya, Suriname, or Mauritius but whose museum relevance is primarily through this lineage context.

Use `Global & Diaspora Lineages` as an alternative when a saint's public geography or diaspora transmission is also important, but keep this section as primary for the listed saints unless the archivalist later decides to split the section.

### Global & Diaspora Lineages

Use sparingly. Prefer the family section when a global figure belongs to Gaudiya, Kriya, Sivananda, or another strong lineage. Use `Global & Diaspora Lineages` when the saint's primary museum story is diaspora transmission or when geography cannot usefully anchor the visitor experience.

### Needs Research

Use only when the data cannot support a meaningful primary placement. Still add alternatives if any family, sampradaya, or region hint is present.

## Alternative section guidance

Alternatives should explain real placement flexibility, not uncertainty alone.

Good alternatives:

- A family-led primary with a region-led alternative.
- A sampradaya-led primary with a sacred geography alternative.
- A region-led primary with a movement or family alternative.
- A low-confidence primary with two plausible categories for archival review.

Avoid alternatives that are only raw state names unless the state label is also a meaningful museum grouping. Prefer higher-level sections.

## Examples

Gaudiya family members in Odisha should usually have `Gaudiya Vaishnava` as primary because family overrides geography. `Jagannath-Puri & Odisha` can be an alternative and internal placement note.

Kriya Yoga figures with Varanasi, Serampur, Puri, or USA geography should stay in `Kriya Yoga` as primary. Their places can guide internal labels and alternatives.

Ramanandi saints from Braj or Kashi should stay in `Ramanandi` if family/sampradaya is strong. If the Ramanandi signal is thin and the saint is visitor-facing as a Braj or Kashi saint, use the region section as primary and `Ramanandi` as an alternative.

A Varkari saint in a small family should usually stay `Varkari`; a saint merely passing through Varkari Heartland but belonging to a strong Datta or Maharashtra guru family should follow the family primary and use `Varkari` as an alternative if useful.
