/**
 * Link ebumenyi users without weltelUserId to WelTel.
 *
 *   pnpm run weltel:backfill
 */

import dotenv from "dotenv";
dotenv.config();

import { WeltelBackfillService } from "../src/services/weltelBackfillService";
import { prisma } from "../src/utils/client";

async function main() {
  const result = await WeltelBackfillService.backfillUnlinkedUsers();
  console.log(JSON.stringify(result, null, 2));
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
