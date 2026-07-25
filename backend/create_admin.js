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
  const hashedPassword = await bcrypt.hash('admin123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@bank.com' },
    update: {
      role: 'ADMIN',
      passwordHash: hashedPassword,
    },
    create: {
      email: 'admin@bank.com',
      passwordHash: hashedPassword,
      firstName: 'Super',
      lastName: 'Admin',
      role: 'ADMIN',
      accounts: {
        create: {
          accountNumber: '9999999999',
          balance: 100000.0,
          currency: 'EGP',
          type: 'CHECKING',
        },
      },
    },
  });

  console.log('✅ Admin account created/updated successfully in Neon Database!');
  console.log('------------------------------------');
  console.log('📧 Email:    admin@bank.com');
  console.log('🔑 Password: admin123');
  console.log('👑 Role:     ADMIN');
  console.log('💰 Balance:  100,000 EGP');
  console.log('------------------------------------');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
