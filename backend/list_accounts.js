require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const users = await prisma.user.findMany({
    include: {
      accounts: true,
    },
  });

  console.log('--- ALL USERS & ACCOUNTS IN NEON DATABASE ---');
  for (const u of users) {
    console.log(`User: ${u.email} | Name: ${u.firstName} ${u.lastName} | Role: ${u.role}`);
    for (const acc of u.accounts) {
      console.log(`  -> Account Number: "${acc.accountNumber}" | Balance: ${acc.balance} ${acc.currency} | Status: ${acc.status}`);
    }
  }
  console.log('---------------------------------------------');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
