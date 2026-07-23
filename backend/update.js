const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.account.updateMany({ data: { currency: 'EGP' } });
  console.log('Successfully updated all accounts to EGP!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
