#!/usr/bin/env node
/* Seed an initial ManagementUser (ADMIN). Idempotent via upsert by email. */
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('../lib/generated/prisma');

async function main() {
  const email = process.env.ADMIN_EMAIL || 'admin@example.com';
  const password = process.env.ADMIN_PASSWORD || 'ChangeMe123!';
  const name = process.env.ADMIN_NAME || 'Administrator';
  const phone = process.env.ADMIN_PHONE || '0000000000';
  const title = process.env.ADMIN_TITLE || 'Admin';

  if (!email || !password) {
    throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD are required');
  }

  const prisma = new PrismaClient();
  try {
    const hash = await bcrypt.hash(password, 10);

    const user = await prisma.managementUser.upsert({
      where: { email },
      update: { name, phone, title, password: hash, role: 'ADMIN' },
      create: { name, phone, title, email, password: hash, role: 'ADMIN' },
    });

    console.log('Seeded admin user:', { id: user.id, email: user.email, name: user.name });
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

