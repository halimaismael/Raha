// Crée un compte usager de démo pour tester l'app mobile directement,
// sans passer par le formulaire d'inscription.
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const phone = '+269 300 00 00';
  const passwordHash = await bcrypt.hash('demo1234', 10);

  const existing = await prisma.user.findUnique({ where: { phone } });
  if (existing) {
    console.log('ℹ️  Le compte de démo existe déjà :', phone);
    return;
  }

  await prisma.user.create({
    data: {
      firstName: 'Ali',
      lastName: 'Demo',
      phone,
      passwordHash,
    },
  });

  console.log('✅ Compte usager de démo créé.');
  console.log('   Téléphone :', phone);
  console.log('   Mot de passe : demo1234');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
