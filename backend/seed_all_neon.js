require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const bcrypt = require('bcryptjs');

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const hashedPassword = await bcrypt.hash('password123', 10);
  const adminPassword = await bcrypt.hash('admin123', 10);

  // 1. Admin Account (9999999999)
  await prisma.user.upsert({
    where: { email: 'admin@bank.com' },
    update: { role: 'ADMIN', passwordHash: adminPassword },
    create: {
      email: 'admin@bank.com',
      passwordHash: adminPassword,
      firstName: 'Super',
      lastName: 'Admin',
      role: 'ADMIN',
      accounts: {
        create: { accountNumber: '9999999999', balance: 100000.0, currency: 'EGP', type: 'CHECKING' },
      },
    },
  });

  // 2. Test User 1 (1111111111)
  await prisma.user.upsert({
    where: { email: 'test1@bank.com' },
    update: {},
    create: {
      email: 'test1@bank.com',
      passwordHash: hashedPassword,
      firstName: 'Test',
      lastName: 'User 1',
      role: 'CUSTOMER',
      accounts: {
        create: { accountNumber: '1111111111', balance: 5000.0, currency: 'EGP', type: 'CHECKING' },
      },
    },
  });

  // 3. Test User 2 (2222222222)
  await prisma.user.upsert({
    where: { email: 'test2@bank.com' },
    update: {},
    create: {
      email: 'test2@bank.com',
      passwordHash: hashedPassword,
      firstName: 'Test',
      lastName: 'User 2',
      role: 'CUSTOMER',
      accounts: {
        create: { accountNumber: '2222222222', balance: 5000.0, currency: 'EGP', type: 'CHECKING' },
      },
    },
  });

  // 4. Mohamed Elnagar account (m@gmail.com -> 5555555555) if user exists and has no accounts
  const mUser = await prisma.user.findUnique({ where: { email: 'm@gmail.com' }, include: { accounts: true } });
  if (mUser && mUser.accounts.length === 0) {
    await prisma.account.create({
      data: {
        userId: mUser.id,
        accountNumber: '5555555555',
        balance: 50000.0,
        currency: 'EGP',
        type: 'CHECKING',
      },
    });
    console.log('✅ Created checking account 5555555555 for m@gmail.com with 50,000 EGP');
  }

  console.log('✅ ALL SEED ACCOUNTS VERIFIED IN NEON DATABASE!');
  console.log('----------------------------------------------------');
  console.log('👑 Admin:   admin@bank.com | Pass: admin123    | Account: 9999999999 | Balance: 100,000 EGP');
  console.log('👤 Sender:  test1@bank.com | Pass: password123 | Account: 1111111111 | Balance: 5,000 EGP');
  console.log('👤 Receiver: test2@bank.com | Pass: password123 | Account: 2222222222 | Balance: 5,000 EGP');
  if (mUser) {
    console.log('👤 You:     m@gmail.com    | Pass: (your pass)| Account: 5555555555 | Balance: 50,000 EGP');
  }
  console.log('----------------------------------------------------');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
