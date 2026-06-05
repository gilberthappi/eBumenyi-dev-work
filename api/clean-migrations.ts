// import { PrismaClient } from "@prisma/client";
// import crypto from "crypto";
// import fs from "fs";

// const prisma = new PrismaClient();

// async function cleanMigrations() {
//   try {
//     console.log("Checking migration history...");

//     // Check what migrations need to be removed
//     const problematicMigrations = await prisma.$queryRaw<
//       { migration_name: string; finished_at: Date | null }[]
//     >`
//       SELECT migration_name, finished_at FROM "_prisma_migrations"
//       WHERE migration_name IN ('add_database_driven_reminders', '20260406172739_add', '20260406175347_')
//     `;

//     if (problematicMigrations.length > 0) {
//       console.log("Found problematic migrations:", problematicMigrations);

//       // Delete them
//       const result = await prisma.$executeRaw`
//         DELETE FROM "_prisma_migrations"
//         WHERE migration_name IN ('add_database_driven_reminders', '20260406172739_add', '20260406175347_')
//       `;

//       console.log(`✓ Deleted ${result} migration records`);
//     } else {
//       console.log("✓ No problematic migrations found - database is clean!");
//     }

//     // Update checksum for the main migration if it exists
//     try {
//       const migrationContent = fs.readFileSync(
//         "./prisma/migrations/20260406193515_add_database_driven_reminders/migration.sql",
//         "utf8",
//       );
//       const checksum = crypto
//         .createHash("sha256")
//         .update(migrationContent)
//         .digest("hex");

//       await prisma.$executeRaw`
//         UPDATE "_prisma_migrations"
//         SET checksum = ${checksum}
//         WHERE migration_name = '20260406193515_add_database_driven_reminders'
//       `;

//       console.log("✓ Updated migration checksum");
//     } catch (e) {
//       console.log("(Migration checksum update skipped)");
//     }

//     // Show remaining migrations from 2026-04-06
//     const remaining = await prisma.$queryRaw`
//       SELECT migration_name, finished_at FROM "_prisma_migrations"
//       WHERE migration_name LIKE '20260406%'
//       ORDER BY finished_at DESC
//     `;

//     console.log("Remaining migrations from 2026-04-06:");
//     console.log(remaining);

//     console.log(
//       "\n✓ Migration cleanup complete. You can now run: npm run migrate",
//     );
//   } catch (error) {
//     console.error("Error cleaning migrations:", error);
//     process.exit(1);
//   } finally {
//     await prisma.$disconnect();
//   }
// }

// cleanMigrations();
