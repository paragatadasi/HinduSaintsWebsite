# Vrindavan Sikh data reconciliation - 21 October 2026

## Applied live through protected admin workflows

Paragata Dasi approved the Sikh display tiers, verified identity/relationship links, and the targeted fixed-vitrine revision. These are already saved website database changes; this document is an audit, not a replay script or migration.

- Inventory source row 174 (`cmus5tiu904cy07p7qxwgsn8u`) now links to existing published Guru Hargobind (`cmus3rwpg002907o5vur47sj4`, `sri-guru-hargobind-ji-amritsar`). The live profile identifies the sixth Sikh Guru, son of Guru Arjan, 1595-1644. No canonical saint or physical relic was created. Identity coverage is 414 confirmed source rows and 35 pending, representing 401 distinct linked website saints.
- Sikh & Punjab Traditions contains eight saints: Nanak, Amar Das, Arjan, Hargobind and Gobind Singh are Featured (Primary); Mata Sahib Kaur, Mai Desan and Piara Singh are Secondary. Display-family membership, public profiles and source geography were preserved. Existing Arjan Featured classification did not require a redundant edit.
- Three canonical relationships were saved with status published but public visibility disabled: Arjan -> Hargobind `successor` (certain); Gobind Singh -> Mata Sahib Kaur `wife` (certain); Gobind Singh -> Mai Desan `disciple` (traditional). The related-person type is relative to the source saint. Only one directed row was created per relationship. Source URLs and curator review provenance are retained in the relationship notes. Piara has no invented historical disciple or succession edge.

## Targeted planned-destination revision

The Sikh section is fixed to Vitrine 11 because a relic is permanently installed there. All changes below are Planned destinations. No physical implementation, object merge, shelf position or move confirmation was recorded.

| Group | Previous destination | Saved destination | Saints |
| --- | --- | --- | ---: |
| Dattatreya Incarnations & Lineages | 11 | 1 | 8 |
| Polai Tata, Chille Maharaj, Jnaneshwar Hari Katkar | 11 | 12 | 3 |
| Existing Meher/Shirdi operational display | 10 | 2 | 5 |
| Nagananda | 1 | 2 | 1 |
| Guru Arjan | 6 | 11 | 1 |
| Separately labelled Udasi Ramji | 6 | 11 | 1 |
| Six previously unplanned Sikh records | Unplanned | 11 | 6 |
| Newly linked Hargobind | Unplanned | 11 | 1 |

The eight Datta anchors are Dattatreya, Narasimha Saraswati, Akkalkot Maharaj, Dattatreya Sonar, Tembe Swami, Pant Maharaj, Balappa and Gangadhara. The five-record Meher/Shirdi operational cohort retains Meher Baba, Shirdi Sai, Upasani, Babajan and Tajuddin. Its existing family label is not certification that these five people are the historical roster of Five Perfect Masters.

Saved section areas: Sikh `[11]`, Udasin `[11]`, Datta `[1,12]`, Maharashtra Guru Lineages `[2,9,10]`, Andhra `[2]`. Other reservations and destinations were preserved. The accepted plan was never cleared or regenerated.

Final live verification: 401 saints, 356 planned, 45 unplanned. Nineteen existing planned destinations were replaced and seven destinations added, including newly linked Hargobind. All 25 vitrine map counts matched the expected result:

- Vitrine 1: 8 Datta anchors; Vitrine 2: 8 (five Meher/Shirdi plus three Andhra); Vitrine 6: 0; Vitrine 10: 14; Vitrine 11: 9 (eight Sikh and separately labelled Udasi Ramji); Vitrine 12: 13.
- Unchanged counts: 0=0, 3=18, 4=18, 5=23, 7=19, 8=20, 9=19, 13=1, 14=15, 15=19, 16=18, 17=23, 18=23, 19=22, 20=17, 21=11, 22=10, 23=12, 24=16.

Each group was inspected against current UI evidence and saved through current server revision checks. The first Datta area request was unconfirmed; a fresh reload proved it had not persisted before a fresh retry succeeded. One Gobind tier request similarly required a fresh re-read and retry after a temporary interruption. No unconfirmed mutation was blindly replayed.

## Remaining work and boundaries

- The full ten-Guru succession context is not complete. Confirmed canonical records currently support the Arjan -> Hargobind immediate edge. Angad, individual Ram Das, Har Rai, Har Krishan and Tegh Bahadur were not found as individual identities in the reviewed catalogue. Missing intermediates must be labelled research/context nodes or independently verified canonical records; do not connect visible Gurus across gaps as immediate successors. The composite Ram Das/Arjan draft is not an individual Ram Das identity.
- Mata Bindu source row 179 is preserved and unlinked. A current full-catalogue search for Bindu returned zero website records. Her Bhakti Marga context is curator-confirmed, but no substitute identity or new canonical saint was created. Source-only section proposals are not supported by the current confirmed-saint proposal reader.
- Existing research/low-confidence flags were retained; display tiers and destination approval do not silently resolve geography or research issues.
- Photograph tagging/configuration and column-E packaging evidence are separate concepts. Frame/Small Frame counts do not establish photo presence, dimensions or capacity. Citra owns the separate UI correction for the obsolete photo-pending message and fixed-vitrine guards.
- Source shelf labels preserve row/position precision: `3` means row 3, position unknown; `3.2` means row 3, position 2. Five rows is an editable working assumption. Planned shelves remain blank until explicitly assigned.

Research sources: [Sikh Guru succession order](https://www.sikhmissionarysociety.org/sms/smspublications/thegurusway/chapter15/), [Mata Sahib Kaur spouse context](https://www.sikhdharma.org/mata-sahib-devan-mother-of-the-sikhs/), [SGPC January 2018 Gazette](https://sgpc.net/gazette/2018/January/January-English.pdf), [Mai Desan traditional disciple context](https://www.worldgurudwaras.com/gurudwara-sri-guru-gobind-singh-chak-fateh-singh-wala/).

Private local audit artifacts and screenshots are retained in the task's `vrindavan-reconciliation-2026-10-20` artifact directory. No credentials or production connection information are included here.
