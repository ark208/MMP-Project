import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clean existing data
  await prisma.report.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversationParticipant.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.wishlist.deleteMany();
  await prisma.listing.deleteMany();
  await prisma.ridePassenger.deleteMany();
  await prisma.ride.deleteMany();
  await prisma.trainTrip.deleteMany();
  await prisma.foundItem.deleteMany();
  await prisma.lostItem.deleteMany();
  await prisma.user.deleteMany();

  // Create demo users
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@campus.edu',
      name: 'Campus Admin',
      role: 'ADMIN',
      phone: '+15550001111',
    },
  });

  const studentUser = await prisma.user.create({
    data: {
      email: 'student@campus.edu',
      name: 'Alex Rivera',
      role: 'USER',
      phone: '+15550002222',
    },
  });

  const peerUser = await prisma.user.create({
    data: {
      email: 'buddy@campus.edu',
      name: 'Sam Chen',
      role: 'USER',
      phone: '+15550003333',
    },
  });

  // Seed Lost Item
  await prisma.lostItem.create({
    data: {
      userId: studentUser.id,
      title: 'Matte Black Sony WH-1000XM4 Headphones',
      description: 'Left on the 3rd floor of the main library near the quiet study cubicles.',
      category: 'Electronics',
      location: 'Central Library Floor 3',
      dateLost: new Date(Date.now() - 24 * 60 * 60 * 1000),
      status: 'OPEN',
    },
  });

  // Seed Found Item
  await prisma.foundItem.create({
    data: {
      userId: peerUser.id,
      title: 'Over-ear Sony Headphones in Black Pouch',
      description: 'Found on table 12 in the library quiet section. Turned in to desk.',
      category: 'Electronics',
      location: 'Central Library Floor 3',
      dateFound: new Date(Date.now() - 12 * 60 * 60 * 1000),
      status: 'OPEN',
    },
  });

  // Seed Train Trip
  await prisma.trainTrip.create({
    data: {
      userId: studentUser.id,
      trainNumber: '12951',
      trainName: 'Express Express',
      originStation: 'NDLS',
      destinationStation: 'BCT',
      departureDate: '2026-11-20',
      departureTime: '16:55',
      coach: 'B4',
      seat: '32',
      notes: 'Going home for Thanksgiving break! Let me know if anyone wants to grab dinner at the junction.',
    },
  });

  // Seed Ride
  const demoRide = await prisma.ride.create({
    data: {
      creatorId: studentUser.id,
      origin: 'Campus North Gate',
      destination: 'International Airport Terminal 2',
      departureTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      totalSeats: 4,
      availableSeats: 2,
      estimatedFare: 60.0,
      status: 'OPEN',
      notes: 'Split Uber XL fare. Leaving promptly at 5:30 AM.',
    },
  });

  await prisma.ridePassenger.create({
    data: {
      rideId: demoRide.id,
      userId: studentUser.id,
    },
  });

  await prisma.ridePassenger.create({
    data: {
      rideId: demoRide.id,
      userId: peerUser.id,
    },
  });

  // Seed Marketplace Listing
  await prisma.listing.create({
    data: {
      sellerId: studentUser.id,
      title: 'Organic Chemistry Structure & Function (8th Edition)',
      description: 'Hardcover textbook in like-new condition. Highlighted first 2 chapters only.',
      price: 35.0,
      category: 'Books',
      condition: 'LIKE_NEW',
      imageUrls: ['https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500'],
      status: 'AVAILABLE',
    },
  });

  console.log('✅ Demo data seeded successfully:');
  console.log(` - Admin: ${adminUser.email}`);
  console.log(` - Student: ${studentUser.email}`);
  console.log(` - Peer: ${peerUser.email}`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

