/**
 * Backfill sectionNumber for all existing sections.
 *
 * Before this migration, sections had no order field and were implicitly
 * sorted by createdAt. This script assigns sectionNumber 1, 2, 3… per
 * course using that same createdAt order so existing content keeps its
 * original visual sequence.
 *
 * Run once after deploying the add-section-number migration:
 *   pnpm run backfill:section-numbers
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const courses = await prisma.course.findMany({
    select: { id: true, title: true },
  });

  console.log(`Found ${courses.length} course(s). Starting backfill…\n`);

  let totalUpdated = 0;

  for (const course of courses) {
    const sections = await prisma.section.findMany({
      where: { courseId: course.id },
      orderBy: { createdAt: "asc" },
      select: { id: true, title: true, sectionNumber: true },
    });

    if (sections.length === 0) continue;

    const alreadyNumbered = sections.every((s, i) => s.sectionNumber === i + 1);
    if (alreadyNumbered) {
      console.log(`  ✓ "${course.title}" — already numbered, skipped`);
      continue;
    }

    for (let i = 0; i < sections.length; i++) {
      await prisma.section.update({
        where: { id: sections[i].id },
        data: { sectionNumber: i + 1 },
      });
    }

    totalUpdated += sections.length;
    console.log(
      `  ✓ "${course.title}" — assigned numbers to ${sections.length} section(s)`,
    );
  }

  console.log(`\nDone. Updated ${totalUpdated} section(s) in total.`);
}

main()
  .catch((err) => {
    console.error("Backfill failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
