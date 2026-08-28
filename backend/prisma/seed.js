// Données de démonstration enrichies : plusieurs agences, particuliers,
// véhicules variés et trajets multiples en Grande Comore.
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

function inDays(n, hour = 9, minute = 0) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  d.setHours(hour, minute, 0, 0);
  return d;
}

// Crée un enregistrement seulement s'il n'existe pas déjà (basé sur une contrainte unique),
// pour pouvoir relancer ce script sans jamais planter sur des doublons.
async function safeCreate(fn, label) {
  try {
    return await fn();
  } catch (err) {
    if (err.code === 'P2002') {
      console.log(`↷ Déjà existant, ignoré : ${label}`);
      return null;
    }
    throw err;
  }
}

async function main() {
  const passwordHash = await bcrypt.hash('password123', 10);

  // ---------- AGENCES ----------
  const agency1 = await safeCreate(() => prisma.agency.create({
    data: {
      name: 'Transport Karthala Express',
      description: "Liaisons quotidiennes Moroni - Mitsamiouli - Foumbouni",
      city: 'Moroni', phone: '+269 333 00 00', type: 'AGENCE', status: 'APPROVED',
      admins: { create: { name: 'Ahmed Said', email: 'admin@karthala.km', passwordHash, role: 'OWNER' } },
    },
  }), 'Transport Karthala Express') || await prisma.agency.findFirst({ where: { name: 'Transport Karthala Express' } });

  const agency2 = await safeCreate(() => prisma.agency.create({
    data: {
      name: 'Ngazi Taxi VIP',
      description: 'Taxis premium et location à la journée pour cérémonies',
      city: 'Moroni', phone: '+269 333 11 11', type: 'AGENCE', status: 'APPROVED',
      admins: { create: { name: 'Fatima Ali', email: 'admin@ngazitaxi.km', passwordHash, role: 'OWNER' } },
    },
  }), 'Ngazi Taxi VIP') || await prisma.agency.findFirst({ where: { name: 'Ngazi Taxi VIP' } });

  const agency3 = await safeCreate(() => prisma.agency.create({
    data: {
      name: 'Comores Travel Agency',
      description: 'Transferts aéroport, excursions et location longue durée',
      city: 'Moroni', phone: '+269 333 22 22', type: 'AGENCE', status: 'APPROVED',
      admins: { create: { name: 'Youssouf Ali', email: 'admin@comorestravel.km', passwordHash, role: 'OWNER' } },
    },
  }), 'Comores Travel Agency') || await prisma.agency.findFirst({ where: { name: 'Comores Travel Agency' } });

  // ---------- PARTICULIERS ----------
  const particulier1 = await safeCreate(() => prisma.agency.create({
    data: {
      name: 'Faouzi Madi', description: 'Toyota Corolla récente, disponible le week-end',
      city: 'Moroni', phone: '+269 332 10 10', type: 'PARTICULIER', status: 'APPROVED',
      admins: { create: { name: 'Faouzi Madi', email: 'faouzi.madi@comoromove.km', passwordHash, role: 'OWNER' } },
    },
  }), 'Faouzi Madi') || await prisma.agency.findFirst({ where: { name: 'Faouzi Madi' } });

  const particulier2 = await safeCreate(() => prisma.agency.create({
    data: {
      name: 'Ahmed Soilihi', description: 'Renault Clio, idéale pour vos courses en ville',
      city: 'Moroni', phone: '+269 332 20 20', type: 'PARTICULIER', status: 'APPROVED',
      admins: { create: { name: 'Ahmed Soilihi', email: 'ahmed.soilihi@comoromove.km', passwordHash, role: 'OWNER' } },
    },
  }), 'Ahmed Soilihi') || await prisma.agency.findFirst({ where: { name: 'Ahmed Soilihi' } });

  const particulier3 = await safeCreate(() => prisma.agency.create({
    data: {
      name: 'Nadia Bacar', description: 'Hyundai Tucson, parfaite pour les familles',
      city: 'Mitsamiouli', phone: '+269 332 30 30', type: 'PARTICULIER', status: 'APPROVED',
      admins: { create: { name: 'Nadia Bacar', email: 'nadia.bacar@comoromove.km', passwordHash, role: 'OWNER' } },
    },
  }), 'Nadia Bacar') || await prisma.agency.findFirst({ where: { name: 'Nadia Bacar' } });

  // ---------- VEHICULES ----------
  const bus1 = await safeCreate(() => prisma.vehicle.create({
    data: { agencyId: agency1.id, type: 'BUS', brand: 'Toyota', model: 'Coaster', plateNumber: 'AB-1234-KM',
      seatCapacity: 25, basePrice: 1500, features: ['Climatisation', 'Musique'], status: 'ACTIVE' },
  }), 'Bus AB-1234-KM') || await prisma.vehicle.findUnique({ where: { plateNumber: 'AB-1234-KM' } });
  const bus2 = await safeCreate(() => prisma.vehicle.create({
    data: { agencyId: agency1.id, type: 'BUS', brand: 'Toyota', model: 'Hiace', plateNumber: 'AB-5566-KM',
      seatCapacity: 18, basePrice: 1200, features: ['Climatisation'], status: 'ACTIVE' },
  }), 'Bus AB-5566-KM') || await prisma.vehicle.findUnique({ where: { plateNumber: 'AB-5566-KM' } });
  const bus3 = await safeCreate(() => prisma.vehicle.create({
    data: { agencyId: agency3.id, type: 'BUS', brand: 'Mercedes', model: 'Sprinter', plateNumber: 'CD-7788-KM',
      seatCapacity: 20, basePrice: 1800, features: ['Climatisation', 'Wifi', 'USB'], status: 'ACTIVE' },
  }), 'Bus CD-7788-KM') || await prisma.vehicle.findUnique({ where: { plateNumber: 'CD-7788-KM' } });

  const taxi1 = await safeCreate(() => prisma.vehicle.create({
    data: { agencyId: agency2.id, type: 'TAXI', brand: 'BMW', model: 'Série 3', plateNumber: 'CD-5678-KM',
      seatCapacity: 4, basePrice: 25000, features: ['Climatisation', 'Cuir', 'Wifi'], status: 'ACTIVE' },
  }), 'Taxi CD-5678-KM') || await prisma.vehicle.findUnique({ where: { plateNumber: 'CD-5678-KM' } });
  await safeCreate(() => prisma.vehicle.create({
    data: { agencyId: agency2.id, type: 'TAXI', brand: 'Mercedes', model: 'Classe E', plateNumber: 'CD-9012-KM',
      seatCapacity: 4, basePrice: 30000, features: ['Climatisation', 'Cuir', 'Chauffeur en costume'], status: 'ACTIVE' },
  }), 'Taxi CD-9012-KM');

  const voit1 = await safeCreate(() => prisma.vehicle.create({
    data: { agencyId: agency3.id, type: 'VOITURE', brand: 'Mercedes', model: 'Classe E', plateNumber: 'EF-1111-KM',
      seatCapacity: 4, basePrice: 35000, features: ['Climatisation', 'Cuir', 'Chauffeur costume'], status: 'ACTIVE',
      currentLat: -11.7042, currentLng: 43.2402 },
  }), 'Voiture EF-1111-KM') || await prisma.vehicle.findUnique({ where: { plateNumber: 'EF-1111-KM' } });
  await safeCreate(() => prisma.vehicle.create({
    data: { agencyId: particulier1.id, type: 'VOITURE', brand: 'Toyota', model: 'Corolla 2026', plateNumber: 'GH-2222-KM',
      seatCapacity: 4, basePrice: 25000, features: ['Climatisation'], status: 'ACTIVE',
      currentLat: -11.71, currentLng: 43.24 },
  }), 'Voiture GH-2222-KM');
  await safeCreate(() => prisma.vehicle.create({
    data: { agencyId: particulier2.id, type: 'VOITURE', brand: 'Renault', model: 'Clio 2026', plateNumber: 'GH-3333-KM',
      seatCapacity: 4, basePrice: 18000, features: ['Climatisation'], status: 'ACTIVE',
      currentLat: -11.86, currentLng: 43.35 },
  }), 'Voiture GH-3333-KM');
  await safeCreate(() => prisma.vehicle.create({
    data: { agencyId: particulier3.id, type: 'VOITURE', brand: 'Hyundai', model: 'Tucson 2026', plateNumber: 'GH-4444-KM',
      seatCapacity: 5, basePrice: 35000, features: ['Climatisation', '4x4'], status: 'ACTIVE',
      currentLat: -11.38, currentLng: 43.28 },
  }), 'Voiture GH-4444-KM');
  await safeCreate(() => prisma.vehicle.create({
    data: { agencyId: agency3.id, type: 'VOITURE', brand: 'Mercedes', model: 'Classe S Mariage', plateNumber: 'EF-5555-KM',
      seatCapacity: 4, basePrice: 45000, features: ['Décoration mariage', 'Climatisation', 'Chauffeur'], status: 'ACTIVE' },
  }), 'Voiture EF-5555-KM');

  await safeCreate(() => prisma.vehicle.create({
    data: { agencyId: agency1.id, type: 'CAMION', brand: 'Isuzu', model: 'NPR', plateNumber: 'EF-9012-KM',
      seatCapacity: 2, basePrice: 35000, features: ['Hayon élévateur'], status: 'ACTIVE' },
  }), 'Camion EF-9012-KM');
  await safeCreate(() => prisma.vehicle.create({
    data: { agencyId: agency3.id, type: 'CAMION', brand: 'Mitsubishi', model: 'Canter', plateNumber: 'EF-6789-KM',
      seatCapacity: 2, basePrice: 40000, features: ['Grand volume', 'Bâché'], status: 'ACTIVE' },
  }), 'Camion EF-6789-KM');

  // ---------- CHAUFFEURS ----------
  await safeCreate(() => prisma.driver.create({ data: { agencyId: agency1.id, vehicleId: bus1.id, name: 'Said Ahmed', phone: '+269 333 44 55', licenseNumber: 'PL-001-KM', rating: 4.8 } }), 'Chauffeur Said Ahmed');
  await safeCreate(() => prisma.driver.create({ data: { agencyId: agency2.id, vehicleId: taxi1.id, name: 'Ibrahim Msa', phone: '+269 333 66 77', licenseNumber: 'PL-002-KM', rating: 4.9 } }), 'Chauffeur Ibrahim Msa');
  await safeCreate(() => prisma.driver.create({ data: { agencyId: agency3.id, vehicleId: voit1.id, name: 'Kamal Djae', phone: '+269 333 88 99', licenseNumber: 'PL-003-KM', rating: 5.0 } }), 'Chauffeur Kamal Djae');

  // ---------- TRAJETS PROGRAMMÉS (bus) — toujours ajoutés (pas de contrainte unique, donc pas de doublon détecté) ----------
  const existingTripsCount = await prisma.trip.count();
  if (existingTripsCount < 10) {
    const routes = [
      { origin: 'Moroni - Gare routière', oLat: -11.7042, oLng: 43.2402, dest: 'Mitsamiouli', dLat: -11.3833, dLng: 43.2833, price: 1500, vehicle: bus1, dist: 35 },
      { origin: 'Moroni - Gare routière', oLat: -11.7042, oLng: 43.2402, dest: 'Foumbouni', dLat: -11.8833, dLng: 43.6167, price: 1800, vehicle: bus2, dist: 42 },
      { origin: 'Mitsamiouli', oLat: -11.3833, oLng: 43.2833, dest: 'Moroni - Gare routière', dLat: -11.7042, dLng: 43.2402, price: 1500, vehicle: bus1, dist: 35 },
      { origin: 'Aéroport de Moroni', oLat: -11.75, oLng: 43.35, dest: 'Moroni centre', dLat: -11.7042, dLng: 43.2402, price: 2000, vehicle: bus3, dist: 12 },
      { origin: 'Moroni - Gare routière', oLat: -11.7042, oLng: 43.2402, dest: 'Mbéni', dLat: -11.62, dLng: 43.36, price: 1200, vehicle: bus2, dist: 20 },
    ];
    for (let i = 0; i < routes.length; i++) {
      const r = routes[i];
      if (!r.vehicle) continue;
      for (const dayOffset of [1, 2, 3]) {
        await prisma.trip.create({
          data: {
            agencyId: r.vehicle.agencyId, vehicleId: r.vehicle.id,
            originName: r.origin, originLat: r.oLat, originLng: r.oLng,
            destinationName: r.dest, destinationLat: r.dLat, destinationLng: r.dLng,
            departureTime: inDays(dayOffset, 8 + i),
            distanceKm: r.dist, pricePerSeat: r.price, totalSeats: r.vehicle.seatCapacity,
          },
        });
      }
    }
  } else {
    console.log('↷ Trajets déjà nombreux, ajout ignoré (relancez avec une base vide pour regénérer).');
  }

  console.log('✅ Données de démonstration synchronisées.');
  console.log('Comptes de démo (mot de passe: password123) :');
  console.log('   Agence      : admin@karthala.km / admin@ngazitaxi.km / admin@comorestravel.km');
  console.log('   Particulier : faouzi.madi@comoromove.km / ahmed.soilihi@comoromove.km / nadia.bacar@comoromove.km');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
