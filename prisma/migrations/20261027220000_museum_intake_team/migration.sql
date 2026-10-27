CREATE TABLE "MuseumIntakeTeamMember" (
 "userId" TEXT NOT NULL, "museumId" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "MuseumIntakeTeamMember_pkey" PRIMARY KEY ("userId","museumId"),
 CONSTRAINT "MuseumIntakeTeamMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
 CONSTRAINT "MuseumIntakeTeamMember_museumId_fkey" FOREIGN KEY ("museumId") REFERENCES "Museum"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "MuseumIntakeTeamMember_museumId_idx" ON "MuseumIntakeTeamMember"("museumId");
-- Authorized27Oct: existing Museum Assistants join SPN intake only; future accounts require explicit assignment.
INSERT INTO "MuseumIntakeTeamMember" ("userId","museumId")
 SELECT u.id,m.id FROM "User" u CROSS JOIN "Museum" m
 WHERE 'museum_assistant'=ANY(u.roles) AND m.slug='spn' AND m."archivedAt" IS NULL
 ON CONFLICT ("userId","museumId") DO NOTHING;
