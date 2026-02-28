import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const allLogs = await prisma.setLog.count();
  const completedLogs = await prisma.setLog.count({ where: { isCompleted: true } });
  const logsWithWeight = await prisma.setLog.count({ where: { weight: { not: null } } });

  console.log(`Total Logs: ${allLogs}`);
  console.log(`Completed Logs: ${completedLogs}`);
  console.log(`Logs With Weight: ${logsWithWeight}`);

  const sampleLog = await prisma.setLog.findFirst({
    where: { isCompleted: true }
  });
  console.log('Sample Completed Log:', sampleLog);

  const sampleNullWeightLog = await prisma.setLog.findFirst({
    where: { weight: null }
  });
  console.log('Sample Null Weight Log:', sampleNullWeightLog);
}

main().catch(console.error).finally(() => prisma.$disconnect());
