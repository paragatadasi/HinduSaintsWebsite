# Airtable Saints Cleanup Workstream

This document records the July 2026 Airtable cleanup workstream: place
normalization, spiritual region grouping, relationship/family graph cleanup,
family-tree exports, and duplicate review links. Airtable remains an
import/reference source only; the website database is still the source of truth
for public pages.

Current status: Airtable has normalized place helpers, active spiritual-region
grouping, partner/incarnation/family relationship helpers, and linked-record
duplicate review matches. The latest family graph covers 78 connected families
and 240 saint records, with 14 families exported as SVG/HTML trees.

## Current Airtable Fields

The `Saints` table currently uses these Airtable helper fields from this
workstream:

- `Place`: original multiple-select field. Leave this untouched as source data.
- `Normalized places`: semicolon-separated full place labels, usually ordered as
  `sacred site, city/town, state, country`. Missing specificity is omitted.
- `Place keys`: semicolon-separated most-specific labels derived from
  `Normalized places`.
- `Spiritual Region`: multiple-select spiritual geography grouping derived from
  `Place keys`.
- `Partner`: same-table linked records for spouse/partner relationships. Used
  when computing family IDs and family-tree connected components.
- `Incarnation`: linked records in the `Saints` table used for incarnation or
  reincarnation associations. This relationship is used in family graphs, but it
  is visually distinct from guru-disciple lineage.
- `Family ID`: deterministic family/component label such as `FAM-001`.
- `Potential duplicate match`: same-table linked records for duplicate review.
  This replaced the earlier checkbox-only `Potential duplicate` field so
  reviewers can click directly to candidate duplicate records.

A temporary `Sacred site` field was created during exploration, but the final
model does not use it. Airtable's metadata API returned `404 NOT_FOUND` when
asked to delete it, so remove it manually in the Airtable UI if it is still
present.

Same-table linked-record fields in Airtable create automatic inverse fields with
names like `From field: Partner`, `From field: Incarnation`, and
`From field: Potential duplicate match`. Those inverse fields are structural
artifacts of Airtable's link model, not separate relationship concepts. Hide
them from editor-facing views if they are visually noisy; do not use them as
independent inputs in scripts or exports.

## Normalized Places

`Normalized places` preserves multiple locations per saint without forcing a
single primary place. Examples:

- `Vrindavan, Uttar Pradesh, India`
- `Nilachal Math, Puri, Odisha, India`
- `Radha Kund, Govardhan, Uttar Pradesh, India`
- `Kodumudi-Noyyal, Tamil Nadu, India`

The cleanup rules used were:

- Keep the original `Place` values as source/reference data.
- Normalize obvious variants such as `Bombay` to `Mumbai`, `Calcutta` to
  `Kolkata`, `Allahabad` to `Prayagraj`, `Bangalore` to `Bengaluru`, `Belgaum`
  to `Belagavi`, `Tumkur` to `Tumakuru`, `Dwaraka` to `Dwarka`, `Gujrat` to
  `Gujarat`, and `Orissa` to `Odisha`.
- Preserve pilgrimage-site specificity instead of collapsing all nearby places
  into a city. For example, `Radha Kund`, `Govardhan`, `Vrindavan`, `Barsana`,
  `Nandgaon`, `Vamshi Vat`, and `Kusum Sarovar` remain distinct labels.
- Convert address-like entries into full labels where possible, such as
  `Nilachal Math, Puri, Odisha, India`.
- Remove broad state/country-only entries when a more specific place already
  contains that state/country for the same saint.
- Remove non-place values from the normalized helper fields. `Deshpande` was
  removed as a non-place.

`Place keys` stores only the most-specific useful label for each normalized
place. Examples:

- `Nilachal Math, Puri, Odisha, India` -> `Nilachal Math`
- `Vrindavan, Uttar Pradesh, India` -> `Vrindavan`
- `Maharashtra, India` -> `Maharashtra`

Use `Place keys` for quick grouping/search. Use `Normalized places` when a
unique geographic label matters.

## Name-Derived Places

After the structured cleanup, saints with blank `Normalized places` were scanned
for place phrases in the Airtable `Name` field. High- and medium-confidence
matches were applied to Airtable.

High-confidence examples:

- `... of Prayagraj` -> `Prayagraj, Uttar Pradesh, India`
- `... of Pune` -> `Pune, Maharashtra, India`
- `... of Kangra` -> `Kangra, Himachal Pradesh, India`
- `... of Vrindavan` -> `Vrindavan, Uttar Pradesh, India`
- `... of Puri` -> `Puri, Odisha, India`

Medium-confidence examples include state-only or country-only names such as
`Andhra Pradesh, India`, `Maharashtra, India`, `Mauritius`, and `Kenya`.

Name-derived updates should still be treated as imported Airtable reference
data. If the CMS already has human-reviewed place relationships, do not
silently overwrite them with these values.

## Confirmed Low-Confidence Updates

After the initial high- and medium-confidence name-derived pass, several
low-confidence candidates were researched manually and then applied to Airtable.
Examples:

- `Baleshwar` -> `Baleshwar (Balasore), Odisha, India`
- `Gambhira Temple` -> `Gambhira Temple, Puri, Odisha, India`
- `Manik Nagar` -> `Maniknagar, Humnabad, Karnataka, India`
- `Bhubaneshwar` -> `Bhubaneswar, Odisha, India`
- `Arilo` -> `Arilo, Cuttack, Odisha, India`
- `Ahraura` -> `Ahraura, Mirzapur, Uttar Pradesh, India`
- `Haridas Thakur Math` -> `Haridas Thakur Math, Puri, Odisha, India`
- `Bhimbetka Caves` -> `Bhimbetka, Raisen, Madhya Pradesh, India`
- `Tapovan Ashram` -> `Tapovan, Rishikesh, Uttarakhand, India`
- `Pashupatinath` -> `Pashupatinath, Kathmandu, Nepal`

This pass updated 20 Airtable saint rows because one confirmed place appeared in
more than one saint name. `Gorakhpur` was also corrected in `Place keys` after a
typo was caught during review.

A later researched pass applied another set of missing-place corrections:

- `Sri Sri Satya Gopal Ji` -> `Aliganj, Prayagraj, Uttar Pradesh, India`
- `Sri Sri 108 Sri Trilokidas` -> `Gadighat, Mailani, Uttar Pradesh, India`
- `Sri Sri 108 Sri Pardeshi Das` -> `Aktahiya, Rudrapur, Uttar Pradesh, India`
- `Sri Shukadevananda Maharaj` -> `Kathog, Jwalamukhi, Himachal Pradesh, India`
  and `Ramni Dham, Jwalamukhi, Himachal Pradesh, India`
- `Sri Gulabrao Maharaj` -> `Madhan, Amravati, Maharashtra, India`
- `Sri Keval Puri Baba (Mahawali Baba)` ->
  `Mahawali, Rupnagar (Ropar), Punjab, India`
- `Sri Kala Baba` -> `Chhatnag, Prayagraj, Uttar Pradesh, India`
- `Sri Sitalcharan Das Babaji Maharaj` ->
  `Nityagor Ashram, Gudivada, Andhra Pradesh, India`
- `Sri Mahant Nilkantanandji` ->
  `Brahmeshwar Ashram, Girnar, Gujarat, India`

Some Airtable names also contained admin notes or slash-separated place hints.
Those were parsed manually rather than treating the full string as a place:

- `Bhubaneswar - or Sri Durga PrasannaParamahansa Deva of Varanasi DOUBLE CHECK`
  was kept as `Bhubaneswar, Odisha, India`; the rest is an admin note.
- `Punjap/ or Puri/ - wandering monk` ->
  `Punjab, India; Puri, Odisha, India`
- `Sasaram/Haridwar` ->
  `Sasaram, Bihar, India; Haridwar, Uttarakhand, India`
- `Puri/Navadwip` ->
  `Puri, Odisha, India; Navadwip, West Bengal, India`
- `Puri/ Vrindavan` ->
  `Puri, Odisha, India; Vrindavan, Uttar Pradesh, India`

A third researched pass added:

- `Sri Yogi Ramaiah` -> `Chettinad, Tamil Nadu, India`
- `Yogini Sri Chandra Kali Prasad Mataji` ->
  `Sri Kali Vanashram, Bhimavaram, Andhra Pradesh, India`
- `Sri Yogiji Maharaj` -> `Gondal, Gujarat, India`
- `Sri Prabhu Datta Brahamchariji` -> `Vrindavan, Uttar Pradesh, India`

A fourth researched pass added:

- `Paramahansa sri lahnuji maharaj` -> `Takarkhed, Maharashtra, India`
- `Sri Gauthama Buddha` -> `Bodh Gaya, Bihar, India`
- `Sri Hanumath Kali Vara Prasada Babuji Maharaj` ->
  `Sri Kali Vanashram, Bhimavaram, Andhra Pradesh, India`
- `Sri Hemalata Thakurani of ???` -> `West Bengal, India`
- `Sri Kripalu Maharaj of (?)` -> `Vrindavan, Uttar Pradesh, India`

## Spiritual Region

`Spiritual Region` groups related places by spiritual geography rather than
administrative geography. It is a multi-select because a saint may have multiple
normalized places.

Examples of current groupings:

- `Braj Mandal`: `Vrindavan`, `Vamshi Vat`, `Brahma Kund`, `Keshi Ghat`,
  `Mathura`, `Govardhan`, `Radha Kund`, `Kusum Sarovar`, `Barsana`,
  `Charan Pahadi`, `Nandgaon`, `Vraj Bhoomi`, `Gokul`
- `Varkari Heartland`: `Pandharpur`, `Alandi`, `Mangalwedha`, `Paithan`,
  `Pusegaon`, `Solapur`, `Miraj`
- `Datta Sampradaya Belt`: `Akkalkot`, `Narsi Village`, `Narsobawadi`,
  `Narasimha Wadi`, `Kolhapur`, `Vishwapandari Ashram`, `Kurvapur`
- `Jagannath-Puri Tradition`: `Puri`, `Nilachal Math`
- `Gaudiya Vaishnava Heartland`: `Navadwip`, `Mayapur`, `Panihati`,
  `Baranagar`, `Serampur`, `Rishra`
- `Char Dham & Upper Himalaya`: `Badrinath`, `Kedarnath`, `Gangotri`,
  `Uttarkashi`, `Bhavishya Badri`
- `Shaiva Siddhanta Heartland`: `Chidambaram`, `Kumbakonam`,
  `Tiruvannamalai`, `Arunachala`, `Thapovanam`
- `Girnar & Nath Tradition`: `Girnar`, `Junagadh`, `Bhavnath`,
  `Lakshman Tekhri`

The initial population updated 913 records. Some place keys remain unmapped
because they are broad state/country entries or because the spiritual region
taxonomy has not yet been expanded for them.

Catch-all regions were added after the initial population so saints with
normalized places do not disappear from regional analysis:

- If a saint has a normalized Indian place in a state but no specific spiritual
  region for that same state, add `<State> General`.
- If a saint already has a specific region for a state, do not also add that
  state's general region.
- Multi-place saints may still receive a general region for a different state
  when they have no specific region in that state.
- Saints outside India but within South Asia are grouped as `South Asia`.
  Current South Asia countries/regions are Bangladesh, Nepal, Pakistan, Sri
  Lanka, and Tibet.
- Remaining international saints are grouped as `Global`.

Because Airtable rejected adding new multiple-select options through record
typecasting and the metadata field-update endpoint did not accept select choice
updates at the time, the catch-all pass created a replacement
`Spiritual Region` field with the expanded option list. A temporary backup field
named `Spiritual Region (pre-general)` existed during that transition. This
pass added catch-all labels to 320 saint records.

`Sri Parvathy Baul of Thiruvananthapuram, Kerala (originally from Bengal)` was
repaired after the catch-all pass because its older normalized value was stored
as `West Bengal; Kerala` without active place keys or spiritual regions. It now
uses separate full normalized lines for `West Bengal, India` and `Kerala, India`
with `West Bengal General` and `Kerala General`.

A later coverage audit found two more rows with normalized place values but no
active place keys or spiritual regions. These were repaired with full normalized
lines and catch-all regions:

- `Sri Baya Baba (Sri Srimad 108 Sachinandan Das Baba) of Bengal` ->
  `West Bengal, India` and `Odisha, India`
- `Sri Srijivasharan Das of Bangladesh, West Bengal` ->
  `West Bengal, India` and `Bangladesh`

The grouped state/region/sampradaya export now includes every Airtable saint
record. Records that still have no normalized place are represented under
`(No Normalized Place)` / `(Needs Place Research)` so they are visible without
inventing geography.

Two rows were later corrected after they were incorrectly grouped as `Global`:

- `Sri Digambar Subaj Giri of Badrinath & Haridwar` had an old helper value of
  `Badrinath, Uttarakhand, India; Chandigarh, India`. It now uses separate
  `Badrinath, Uttarakhand, India` and `Haridwar, Uttarakhand, India` lines with
  `Char Dham & Upper Himalaya` and `Rishikesh-Haridwar Spiritual Corridor`.
- `Sri Naagalinga Swami Sidhar of Puducherry` now uses
  `Puducherry, Puducherry, India` and `Puducherry General` instead of `Global`.
  Adding `Puducherry General` required creating a replacement active
  `Spiritual Region` field. A temporary backup field named
  `Spiritual Region (pre-puducherry 2026-07-05)` existed during that repair.

## Guru, Disciple, and Partner Families

Relationship families are connected components across the Airtable `Master(s)`,
`Disciples`, and `Partner` self-link fields. `Partner` and `Family ID` were
added to the `Saints` table. Family IDs are deterministic labels such as
`FAM-001`, assigned by descending family size, then by the first saint name in
the component. Saints without any guru, disciple, or partner connection are
left blank in `Family ID`.

The first partner links added were:

- `Sri Yogmaya Devi of Puri/ Vrindavan` and
  `Sri Vijay Krishna Goswami of Puri`. Two near-duplicate Yogmaya records were
  linked so both stay in the same family graph.
- `Sri Sri Kiranchand Darveshji of Varanasi` and
  `Sri Mata Saroj Bala Devi of Varanasi`.

The first family pass found 73 connected families covering 212 saint records.
A bio scan for spouse/marriage language found 22 review candidates. These were
exported for review only; no additional partner links were inferred from the
bio text automatically.

The bio scan was later regenerated with candidate matching columns:
`Proposed partner text`, `Matched partner saint`, `Matched partner record ID`,
and `Match confidence`. These matches are heuristic and still require review,
especially deity/spiritual-marriage language and noisy sentence fragments.

Five reviewed spouse candidates from the bio scan were then linked in Airtable
and `Family ID` was recomputed:

- `Sri Satyendranath Swami of Nikamwadi village, Kolhapur` and
  `Sri Balabai of Nikamwadi village, Kolhapur`
- `Sri Ravi Gopalam Nair of Nedumangad, Trivandrum, Kerala` and
  `Sri Parvathy Baul of Thiruvananthapuram, Kerala (originally from Bengal)`
- `Sri Anandamoyi Ma of Bangladesh` and
  `Sri Ramani Mohan Chakrabarti later Bholanath of Haridwar, Dehradun,
  Uttharkand/ Vikrampur, UP`
- `Sri Sita Mai of Bhukum, near Pune` and
  `Sri Ganore Baba of Bhukum, near Pune`
- `Sri Narendra Kumar Geerjanan (Dinesh) of Rose Hill Mauritius` and
  `Sri Rashmanee Geerjanan (Manee) of Rose Hill, Mauritius`

After this pass, Airtable had 75 connected families covering 217 saint records.
A flat export was added where each row is a single saint/category assignment
instead of an aggregated saint-name list.

Narrative family descriptions were then generated from the same family graph.
These descriptions identify likely family heads as records with no master
inside the family and at least one disciple or partner connection, and identify
subgroup heads as records with disciples inside the family.

Relationship reciprocity was audited against live Airtable after identifying a
false one-sided `Disciples` link from `Kuladananda Brahmachari of Puri` to
`Sri Amritananda Natha Saraswati of Devipuram`. That false link was removed from
Kuladananda's Airtable `Disciples` field. The live audit checked 1,399 saint
records and found 112 one-sided guru-disciple links: 89 recorded only in
`Master(s)` and 23 recorded only in `Disciples`. Partner links were fully
reciprocal. The review queue is exported as
`airtable-relationship-reciprocity-audit.csv`.

After removing the false Kuladananda-to-Amritananda link, the remaining
one-sided relationships were reciprocated in Airtable. A verification pass
against live Airtable found zero remaining one-sided `Master(s)`, `Disciples`,
or `Partner` links. The applied reciprocal updates are exported as
`airtable-relationship-reciprocity-updates-applied.csv`.

Bio-derived relationship gaps were then scanned from Airtable `Bio/Info` text.
The scan looks for explicit guru-disciple language such as `disciple of`,
`initiated by`, `guru`, `master`, and weaker clues such as `first met`. These
are proposals only, not Airtable updates, because generic saint names and titles
can create false matches. The full proposal queue is
`airtable-bio-relationship-proposals.csv`; the high/medium confidence subset is
`airtable-bio-relationship-proposals-high-priority.csv`.

The bio-derived proposal queue was also checked against each disciple's existing
`Master(s)` records to identify cases where the proposed guru appears to already
be represented by a similar existing master record. Those likely duplicate or
already-covered rows are exported as
`airtable-bio-proposals-possibly-existing-master-duplicates.csv`. After
deferring to existing master links, the unmatched-only review queues are
`airtable-bio-relationship-proposals-unmatched-only.csv` and
`airtable-bio-relationship-proposals-unmatched-high-priority.csv`.

Nine reviewed bio-derived guru-disciple links were accepted and applied
reciprocally in Airtable, including a corrected target for
`Sri Srila Srimad Bhakti Kamal Madhusudan Goswami Maharaj of Mayapur` to
`Bhaktisiddhanta Sarasvati Thakura Goswami`. The applied update log is
`airtable-bio-relationship-updates-accepted-applied.csv`. Accepted disciples were
removed from the proposal queues. The remaining proposal queue now has 29 rows;
the unmatched-only queue has 23 rows: 5 high confidence, 13 medium confidence,
and 5 low confidence.

Family tree SVGs were generated for connected families with at least four
members. Guru-disciple links are rendered as blue arrows, partner links as pink
dashed lines, and incarnation associations as green dotted lines. Gold nodes
mark inferred family heads; blue nodes mark subgroup heads. The HTML index fits
each tree to its container by default and provides zoom controls.

Tree rendering should follow these layout principles:

- Keep partners on the same generation row and adjacent where possible. Partner
  links should not make one spouse appear spiritually upstream of the other.
  If the same two saints also have an explicit guru-disciple relationship, the
  partner relationship takes visual precedence so the spouse can appear beside
  the guru in a "Guru Ma" role; the guru-disciple link remains visible as a
  secondary relationship.
- Keep same-generation contemporaries on the same row unless an explicit
  guru-disciple relationship requires a vertical generation difference.
- Never collapse an explicit guru-disciple edge into a same-row contemporary
  grouping. Except for the partner/Guru Ma convention above, every recorded guru
  should render at least one generation row above each recorded disciple, even
  when that creates a taller tree.
- The partner/Guru Ma exception applies only to the actual partner pair. Other
  disciples, associates, or contemporaries in the same family must still remain
  on their own generation rows.
- Treat transitive guru-disciple links as secondary shortcuts in the visual
  tree. If a direct guru-disciple edge is already implied by a longer path in
  the same family, use the longer path for the primary tree layout and do not
  draw the shortcut as a full structural edge. This keeps lineage trees from
  crossing themselves when Airtable records both broad lineage affiliation and
  immediate teacher-disciple links.
- Use color coding to distinguish overlapping master lineages in the same tree.
  Each inferred head/root lineage should carry a consistent guru-disciple line
  color through its descendants.
- Do not route lines under unrelated saint nodes. Long or cross-generation
  guru-disciple links should use side lanes or row gaps, and if a single
  outlying relationship causes most other lines to detour, move the outlier to
  its contemporary generation and route that one line instead.
- Use birth and samadhi years as a layout hint when they are available. If a
  direct-disciple leaf of a root guru has no descendants but its active span
  overlaps the terminal generation cohort, place that saint with the terminal
  cohort while preserving the guru-disciple arrow back to the root. This keeps
  long-lived or late-samadhi saints from forcing unrelated senior branches to
  route around them.
- Order sibling branches by their parent lineage where possible, so branches
  descending from different heads do not unnecessarily cross each other.
- For families with multiple root/head saints, place roots with skip-level
  descendant links on the outer side of the root row before roots with simple
  vertical branches. This keeps long side-lane routes from crossing through a
  neighboring root's main branch.
- Incarnation associations should connect saints into the same family, but stay
  visually distinct from guru-disciple lineage. They should be green dotted
  links and should not imply teacher/disciple direction.

The `Incarnation` field was populated for two initial clusters:

- Datta incarnation cluster: `Dattatreya (Girnar)`,
  `Sri Narasimha Saraswati of Lad-Karanja`, `Sri Narasimha Saraswati of
  Narasimha Wadi`, and `Swami Samarth Maharaj of Akkalkot`. `Sripada
  Srivallabha` was not found as a distinct Airtable saint record under the
  checked spelling variants, so no record was created for that name.
- Sai incarnation cluster: `Sri Shirdi Sai Baba of Shirdi`, `Sri Sathya Sai
  Baba of Puttaparthi`, `Sri Sai Leela Amma of Andhra Pradesh`, and `Sri Bala
  Sai Baba of Kurnool`. Other Sai-name records were exported for review rather
  than automatically linked.

After adding incarnation links, the family graph was recomputed from live
Airtable across `Master(s)`, `Disciples`, `Partner`, and `Incarnation`. The
graph had 78 connected families covering 234 saint records. Existing family IDs
were preserved where possible, but splits and merges caused some `FAM-###`
labels to shift.

A later manual relationship pass added three guru-disciple links and two partner
links, then recomputed `Family ID` values and refreshed the family exports:

- `Sri Rajarshi Banamali Roy of Vrindavan` -> `Sri Jagad Bandhu Sundar of
  Faridpur`
- `Sri Daya Mata of Salt Lake City, Utah, USA` -> `Sri Paramahamsa Yogananda of
  Gorakhpur`
- `Sri Lakshmi Mani Devi of Calcutta` -> `Sri Paramahansa Ramakrishna of
  Calcutta`
- `Sri Nityananda Prabhu of Navadwip` <-> `Sri Chaitanya Mahaprabhu of Puri/
  Navadwip`
- `Sri Chaitanya Mahaprabhu of Puri/ Navadwip` <-> `Sri Vishnupriya Devi of
  Navadwip`

After this pass, the graph still had 78 connected families, covering 239 saint
records. The visual export included 14 families with at least four members.

A duplicate cleanup pass then added `Potential duplicate match`, a same-table
linked-record field that points directly to the potential duplicate record(s).
An earlier checkbox field named `Potential duplicate` was retired after the
linked-record field was added, because reviewers need clickable access to the
candidate match rather than a bare boolean flag. The scan links exact
normalized-name matches and a small set of reviewed fuzzy matches. As of the
latest pass, 22 saint records are linked across 11 review groups: 9 exact-name
groups and 2 reviewed fuzzy groups. This is only a review aid; duplicate
records were not merged or deleted.

During the same pass, both duplicate `Sri Rajarshi Banamali Roy of Vrindavan`
records were linked to `Sri Jagad Bandhu Sundar of Faridpur` through
`Master(s)`, and Jagad Bandhu's `Disciples` field was updated reciprocally to
include both records. This keeps both duplicate rows in the family graph until
the editorial team decides which record to preserve or how to merge them.

The two reviewed fuzzy duplicate groups currently flagged are:

- `Sri Bhagat Namdev of Gurudwara Ghoman, Gurdaspur, Punjab` and
  `Namdev (13th century)`. The names are not exact matches, but the date fields
  support treating them as a likely duplicate pair.
- `Sri Hatiram Baba of Tirupati, Andhra Pradesh` and `Sri Hathiram Baba of
  Dalpatpur, Uparhar, Maya, Ayodhya, Uttar Pradesh`. The spelling differs and
  place fields may reflect relic or association context, but the date fields
  support treating them as a likely duplicate pair.

The fuzzy scan also writes review-only candidate pairs to
`airtable-fuzzy-duplicate-candidates.csv`. These are not flagged in Airtable
unless explicitly reviewed, because place strings sometimes describe where a
relic came from rather than where the saint lived.

The main duplicate export includes both `PotentialDuplicateMatchIds` and
`PotentialDuplicateMatchNames` columns so CSV review reflects the clickable
linked-record field now available in Airtable.

Because `Partner`, `Incarnation`, and `Potential duplicate match` are Airtable
same-table linked-record fields, Airtable automatically creates paired inverse
fields such as `From field: Partner`, `From field: Incarnation`, and
`From field: Potential duplicate match`. These are implementation artifacts of
the linked-record relationship, not separate relationship types. They can be
hidden from working views if they are visually noisy, but they should not be
treated as independent data columns in exports or scripts. The archived
`Spiritual Region (pre-puducherry 2026-07-05)` field that existed during the
Puducherry-region repair was different: it was a manual backup copy, not a
structural inverse field. The current Airtable schema inspection shows only the
active `Spiritual Region` field.

After this pass, the graph still has 78 connected families, now covering 240
saint records. The visual export includes 14 families with at least four
members.

## Export Artifacts

The cleanup generated CSVs under `exports/` for review and traceability:

- `airtable-place-normalization-audit.csv`
- `airtable-place-broad-dedupe-changes.csv`
- `airtable-saints-by-place-sampradaya-counts.csv`
- `airtable-saints-by-place-sampradaya.csv`
- `airtable-place-sampradaya-summary-gt2.csv`
- `airtable-place-sampradaya-summary-gt2-wide.csv`
- `airtable-cleaned-place-saint-counts-by-state.csv`
- `airtable-saints-places-sampradayas-guru-disciple.csv`
- `airtable-normalized-places-missing-state-country.csv`
- `airtable-normalized-places-still-missing-state-country.csv`
- `airtable-bengal-place-cleanup.csv`
- `airtable-bengal-final-cleanup.csv`
- `airtable-place-name-clue-cleanup.csv`
- `airtable-place-key-repair-after-clue-cleanup.csv`
- `airtable-final-missing-place-cleanup.csv`
- `airtable-final-broad-dedupe-and-missing-check.csv`
- `airtable-kodumudi-noyyal-correction.csv`
- `airtable-spiritual-region-population.csv`
- `airtable-spiritual-region-unmapped-place-keys.csv`
- `airtable-blank-normalized-place-name-candidates.csv`
- `airtable-blank-place-high-medium-updates.csv`
- `airtable-confirmed-low-place-updates.csv`
- `airtable-researched-missing-place-updates-round-2.csv`
- `airtable-note-style-place-updates.csv`
- `airtable-note-style-place-no-change.csv`
- `airtable-researched-place-updates-round-3.csv`
- `airtable-researched-place-updates-round-4.csv`
- `airtable-saints-by-state-spiritual-region-sampradaya-names.csv`
- `airtable-spiritual-region-general-catchalls.csv`
- `airtable-parvathy-baul-region-repair.csv`
- `airtable-region-coverage-repairs.csv`
- `airtable-state-region-export-coverage-audit.csv`
- `airtable-global-region-corrections.csv`
- `state-region-saints-complete.csv`
- `airtable-saint-families-by-state-region-sampradaya.csv`
- `airtable-saint-family-members.csv`
- `airtable-saint-family-relationship-edges.csv`
- `airtable-potential-married-pairs-bio-scan.csv`
- `airtable-confirmed-partner-pairs-added.csv`
- `airtable-relationship-reciprocity-audit.csv`
- `airtable-relationship-reciprocity-updates-applied.csv`
- `airtable-bio-relationship-proposals.csv`
- `airtable-bio-relationship-proposals-high-priority.csv`
- `airtable-bio-proposals-possibly-existing-master-duplicates.csv`
- `airtable-bio-relationship-updates-accepted-applied.csv`
- `airtable-bio-relationship-proposals-unmatched-only.csv`
- `airtable-bio-relationship-proposals-unmatched-high-priority.csv`
- `airtable-manual-relationship-updates-applied.csv`
- `airtable-potential-duplicate-saints.csv`
- `airtable-fuzzy-duplicate-candidates.csv`
- `airtable-rajarshi-duplicate-guru-update.csv`
- `airtable-incarnation-links-applied.csv`
- `airtable-sai-incarnation-candidates.csv`
- `airtable-family-id-updates-after-incarnation.csv`
- `airtable-saint-families-flat-by-state-region-sampradaya.csv`
- `airtable-saint-family-descriptions.md`
- `airtable-saint-family-descriptions.csv`
- `airtable-saint-family-labels.csv`
- `airtable-saint-family-tree-visuals.csv`
- `family-trees/index.html`
- `family-trees/fam-001-tree.svg` through `family-trees/fam-014-tree.svg`

The `airtable-saint-family-members.csv` export includes `BirthDate`,
`SamadhiDate`, `BirthYear`, and `SamadhiYear` columns from Airtable's
`Birth (YYYY-MM-DD)` and `Samadhi (YYYY-MM-DD)` fields so the tree renderer can
use date-aware placement where available.

These are working artifacts, not public data contracts.

## Maintenance Scripts

The relationship/family-tree workstream now has reusable scripts under
`scripts/`:

- `apply-manual-airtable-relationships-and-refresh-families.mjs`: applies a
  reviewed set of Airtable guru-disciple and partner links, refreshes connected
  family membership from live Airtable, recomputes Airtable `Family ID` values,
  and rewrites `airtable-saint-family-members.csv` plus
  `airtable-saint-family-relationship-edges.csv`. The current script includes
  the July 2026 manual relationship additions listed above. If it is reused for
  a future reviewed batch, update the `guruLinks`, `partnerLinks`, and any
  `explicitRecordIds` disambiguation at the top of the file before running it.
- `flag-airtable-potential-duplicates.mjs`: ensures the Airtable
  `Potential duplicate match` same-table linked-record field exists, links each
  duplicate record to the other record(s) in its exact normalized-name or
  explicitly reviewed fuzzy duplicate group, exports the duplicate review list,
  exports additional fuzzy name/date candidates for review only, and applies the
  special Rajarshi duplicate guru-disciple repair described above. Update the
  explicit fuzzy groups and Rajarshi constants before reusing it for a different
  duplicate repair pass.
- `enrich-family-members-with-airtable-dates.mjs`: reads the current family
  member record IDs from `airtable-saint-family-members.csv`, fetches Airtable's
  `Birth (YYYY-MM-DD)` and `Samadhi (YYYY-MM-DD)` fields, and appends
  `BirthDate`, `SamadhiDate`, `BirthYear`, and `SamadhiYear` columns to the
  local export. Run this after regenerating family membership if the tree layout
  should use date-aware placement.
- `generate-family-tree-exports.mjs`: reads the family member and relationship
  edge CSVs, writes `airtable-saint-family-labels.csv`, clears stale
  `fam-###-tree.svg` files, regenerates the SVG family trees, rewrites
  `airtable-saint-family-tree-visuals.csv`, and rebuilds `family-trees/index.html`.
  Family labels are review proposals: sampradaya labels are used only when a
  sampradaya appears concentrated in one family; otherwise the script proposes
  the clearest senior/root member and marks multi-root cases as `Needs Guidance`.
- `apply-airtable-museum-section-updates.mjs`: applies the reviewed museum
  section proposal fields, generated `Family Label` values, reviewed
  sampradaya corrections, and linkable guru-disciple updates to Airtable. It
  creates the museum helper fields if needed, patches records with `typecast`,
  and writes `airtable-museum-section-updates-applied.csv`. Rows that reference
  absent source figures, such as Sri Aurobindo, are logged and skipped for
  linked-record updates.
- `inspect-airtable-cleanup-fields.mjs`: read-only Airtable metadata inspector
  for the fields touched by this workstream. Use it to confirm whether helper
  fields, inverse linked-record fields, and retired fields are still present.
- `retire-airtable-potential-duplicate-checkbox.mjs`: narrow legacy cleanup
  utility that clears the old `Potential duplicate` checkbox if it exists and
  is still a checkbox. The current inspected schema no longer has that field,
  so this script should normally be a no-op.

Recommended order after live Airtable relationship edits:

1. Run `flag-airtable-potential-duplicates.mjs` only when intentionally
   refreshing duplicate review links or applying its explicit Rajarshi duplicate
   repair.
2. Run `apply-manual-airtable-relationships-and-refresh-families.mjs` if the
   relationship edits are part of a reviewed batch that should update Airtable
   and family IDs.
3. Run `enrich-family-members-with-airtable-dates.mjs` if date columns are
   missing or the family membership export was rewritten without dates.
4. Run `generate-family-tree-exports.mjs` to refresh the visual tree outputs.

## Import Considerations

The local database mirror may be stale after live Airtable cleanup. Before using
the cleaned Airtable fields for CMS import or analysis, run the Airtable mirror
import again against the `Saints` table.

Future CMS import logic can treat `Normalized places` and `Place keys` as safer
candidate place inputs than the original `Place` field, but should still:

- preserve raw Airtable values.
- create website `Place` nodes and `PlaceRelationship` edges from normalized
  labels instead of preserving comma-separated geography as the durable model.
  For example, `Nilachal Math, Puri, Odisha, India` should seed a specific
  `Nilachal Math` place linked upward to `Puri`, `Odisha`, and `India`.
- link saints to the most specific reviewed/imported place candidate and derive
  broader state, country, and spiritual-region associations through the place
  graph.
- create reconciliation issues rather than overwriting reviewed CMS edits.
- keep museum/relic/private collection fields out of public contracts.
- require editorial review for relationship-specific place roles such as birth,
  activity, and samadhi.
