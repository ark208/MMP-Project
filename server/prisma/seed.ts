import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clean existing data
  await prisma.report.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversationMember.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.wishlist.deleteMany();
  await prisma.listing.deleteMany();
  await prisma.rideMember.deleteMany();
  await prisma.ride.deleteMany();
  await prisma.trainTrip.deleteMany();
  await prisma.foundItem.deleteMany();
  await prisma.lostItem.deleteMany();
  await prisma.user.deleteMany();

  // Create demo users with department and year
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@campus.edu',
      name: 'Campus Admin',
      department: 'Campus Safety',
      year: 'Staff',
      role: 'ADMIN',
      phone: '+15550001111',
    },
  });

  const studentUser = await prisma.user.create({
    data: {
      email: 'student@campus.edu',
      name: 'Alex Rivera',
      department: 'Computer Science',
      year: '3rd Year',
      role: 'USER',
      phone: '+15550002222',
    },
  });

  const peerUser = await prisma.user.create({
    data: {
      email: 'buddy@campus.edu',
      name: 'Sam Chen',
      department: 'Mechanical Engineering',
      year: '2nd Year',
      role: 'USER',
      phone: '+15550003333',
    },
  });

  const peerUser2 = await prisma.user.create({
    data: {
      email: 'jordan@campus.edu',
      name: 'Jordan Lee',
      department: 'Physics',
      year: '4th Year',
      role: 'USER',
      phone: '+15550004444',
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

  // Seed Train Trips (No PNR or seat stored!)
  await prisma.trainTrip.create({
    data: {
      userId: studentUser.id,
      trainNumber: '12951',
      trainName: 'Express Express',
      fromStation: 'NDLS',
      toStation: 'BCT',
      date: '2026-11-20',
      departureTime: '16:55',
    },
  });

  await prisma.trainTrip.create({
    data: {
      userId: peerUser.id,
      trainNumber: '12951',
      trainName: 'Express Express',
      fromStation: 'NDLS',
      toStation: 'BCT',
      date: '2026-11-20',
      departureTime: '16:55',
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

  await prisma.rideMember.create({
    data: {
      rideId: demoRide.id,
      userId: studentUser.id,
    },
  });

  await prisma.rideMember.create({
    data: {
      rideId: demoRide.id,
      userId: peerUser.id,
    },
  });

  // Seed Ride Group Conversation
  const rideConv = await prisma.conversation.create({
    data: {
      isGroup: true,
      title: 'Ride to Airport Terminal 2',
      rideId: demoRide.id,
    },
  });

  await prisma.conversationMember.createMany({
    data: [
      { conversationId: rideConv.id, userId: studentUser.id },
      { conversationId: rideConv.id, userId: peerUser.id },
    ],
  });

  // Seed Message
  await prisma.message.create({
    data: {
      conversationId: rideConv.id,
      senderId: studentUser.id,
      content: 'Hey everyone, please be at North Gate by 5:25 AM!',
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
