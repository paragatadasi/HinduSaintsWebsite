ALTER TABLE "MuseumIntakeMedia" DROP CONSTRAINT "MuseumIntakeMedia_kind_check";
ALTER TABLE "MuseumIntakeMedia" ADD CONSTRAINT "MuseumIntakeMedia_kind_check"
  CHECK ("kind" IN ('relic', 'saint_portrait', 'bio_document', 'relic_document'));
