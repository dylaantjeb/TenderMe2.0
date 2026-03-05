import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'demo@tenderme.nl';
  const password = 'Demo1234!';

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`Demo account already exists: ${email}`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const organization = await prisma.organization.create({
    data: {
      name: 'TenderMe Demo',
      slug: 'tenderme-demo',
      tier: 'PRO',
    },
  });

  const user = await prisma.user.create({
    data: {
      name: 'Demo Gebruiker',
      email,
      passwordHash,
      role: 'OWNER',
      tier: 'PRO',
      organizationId: organization.id,
    },
  });

  console.log('Demo account created successfully!');
  console.log(`  Email:    ${email}`);
  console.log(`  Password: ${password}`);
  console.log(`  User ID:  ${user.id}`);
  console.log(`  Org:      ${organization.name}`);
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
