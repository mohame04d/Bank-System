const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const bcrypt = require('bcryptjs');

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:root@localhost:5432/bank_system?schema=public';
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const hashedPassword = await bcrypt.hash('password123', 10);

  // Test User 1
  const user1 = await prisma.user.upsert({
    where: { email: 'test1@bank.com' },
    update: {},
    create: {
      email: 'test1@bank.com',
      passwordHash: hashedPassword,
      firstName: 'Test',
      lastName: 'User 1',
      accounts: {
        create: {
          accountNumber: '1111111111',
          balance: 5000.0,
          type: 'CHECKING',
        },
      },
    },
  });

  // Test User 2
  const user2 = await prisma.user.upsert({
    where: { email: 'test2@bank.com' },
    update: {},
    create: {
      email: 'test2@bank.com',
      passwordHash: hashedPassword,
      firstName: 'Test',
      lastName: 'User 2',
      accounts: {
        create: {
          accountNumber: '2222222222',
          balance: 0.0,
          type: 'CHECKING',
        },
      },
    },
  });

  console.log('✅ Test accounts created successfully!');
  console.log('------------------------------------');
  console.log('👤 Sender (User 1):');
  console.log('Email: test1@bank.com');
  console.log('Password: password123');
  console.log('Account Number: 1111111111');
  console.log('Balance: $5000');
  console.log('------------------------------------');
  console.log('👤 Receiver (User 2):');
  console.log('Email: test2@bank.com');
  console.log('Password: password123');
  console.log('Account Number: 2222222222');
  console.log('Balance: $0');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
