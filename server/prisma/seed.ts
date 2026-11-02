import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding CampusLoop database...');

  // ─── Clean existing data in FK-safe order ────────────────────────────────
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
  await prisma.otpToken.deleteMany();
  await prisma.user.deleteMany();

  // ─── 1. Users ─────────────────────────────────────────────────────────────
  // Merged deduplicated set from both branches.
  // Emails: admin@campus.edu, student@campus.edu, finder@campus.edu (was buddy@campus.edu),
  //         sarah@campus.edu (was jordan@campus.edu / peerUser2).
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@campus.edu',
      name: 'Dean Martinez',
      department: 'Campus Safety',
      year: 'Staff',
      role: 'ADMIN',
      phone: '+15550001111',
      avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
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
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    },
  });

  // finderUser was "Sam Chen / buddy@campus.edu" in my branch and "finder@campus.edu" in remote.
  // Use remote's email to avoid collision.
  const finderUser = await prisma.user.create({
    data: {
      email: 'finder@campus.edu',
      name: 'Sam Chen',
      department: 'Mechanical Engineering',
      year: '2nd Year',
      role: 'USER',
      phone: '+15550003333',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    },
  });

  const peerUser = await prisma.user.create({
    data: {
      email: 'sarah@campus.edu',
      name: 'Sarah Jenkins',
      department: 'Physics',
      year: '4th Year',
      role: 'USER',
      phone: '+15550004444',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    },
  });

  const expiry30Days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  // ─── 2. Lost Items ────────────────────────────────────────────────────────
  await prisma.lostItem.create({
    data: {
      userId: studentUser.id,
      title: 'Sony WH-1000XM4 Noise-Cancelling Headphones',
      description:
        'Matte black over-ear headphones left in the 3rd floor quiet study cubicle near bookshelf #4.',
      category: 'Electronics',
      location: 'Central Library Floor 3',
      dateLost: new Date(Date.now() - 18 * 60 * 60 * 1000),
      imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500',
      status: 'open',
      isExpired: false,
      expiresAt: expiry30Days,
    },
  });

  await prisma.lostItem.create({
    data: {
      userId: peerUser.id,
      title: 'Hydro Flask Water Bottle (Teal, 32oz)',
      description: 'Has various national park stickers on it and a small dent at the bottom.',
      category: 'Personal Belongings',
      location: 'Student Union Cafeteria',
      dateLost: new Date(Date.now() - 48 * 60 * 60 * 1000),
      imageUrl: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=500',
      status: 'open',
      isExpired: false,
      expiresAt: expiry30Days,
    },
  });

  // ─── 3. Found Items (with bcrypt-hashed secret answers) ──────────────────
  // Hashing matches found.routes.ts: bcrypt.hash(answer.trim().toLowerCase(), salt)
  const salt = await bcrypt.genSalt(10);
  const hashedAnswer1 = await bcrypt.hash('totoro', salt);
  const hashedAnswer2 = await bcrypt.hash('4321', salt);

  const foundItem1 = await prisma.foundItem.create({
    data: {
      userId: finderUser.id,
      title: 'Matte Black Wireless Earbuds Case',
      description:
        'Found under desk row 4 after the CS101 lecture. Turned in for safekeeping.',
      category: 'Electronics',
      location: 'Science Complex Auditorium B',
      dateFound: new Date(Date.now() - 4 * 60 * 60 * 1000),
      imageUrl: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500',
      holdingLocation: 'with finder',
      secretQuestion: 'What cartoon sticker is on the back of the case?',
      secretAnswer: hashedAnswer1, // plain: "totoro"
      status: 'open',
      isExpired: false,
      expiresAt: expiry30Days,
    },
  });

  await prisma.foundItem.create({
    data: {
      userId: studentUser.id,
      title: 'Silver TI-84 Plus CE Calculator',
      description:
        'Found in the math lab. Turned in to the department administrative desk.',
      category: 'Electronics',
      location: 'Math Building Room 204',
      dateFound: new Date(Date.now() - 12 * 60 * 60 * 1000),
      imageUrl: 'https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?w=500',
      holdingLocation: 'department',
      secretQuestion: 'What are the last 4 digits etched on the back cover?',
      secretAnswer: hashedAnswer2, // plain: "4321"
      status: 'open',
      isExpired: false,
      expiresAt: expiry30Days,
    },
  });

  // ─── 4. Train Trips (No PNR or seat stored!) ──────────────────────────────
  const trip1 = await prisma.trainTrip.create({
    data: {
      userId: studentUser.id,
      trainNumber: '12951',
      trainName: 'Mumbai Rajdhani Express',
      fromStation: 'NDLS',
      toStation: 'BCT',
      date: '2026-11-20',
      departureTime: '16:55',
    },
  });

  const trip2 = await prisma.trainTrip.create({
    data: {
      userId: finderUser.id,
      trainNumber: '12951',
      trainName: 'Mumbai Rajdhani Express',
      fromStation: 'NDLS',
      toStation: 'BCT',
      date: '2026-11-20',
      departureTime: '16:55',
    },
  });

  // ─── 5. Ride ──────────────────────────────────────────────────────────────
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
    data: { rideId: demoRide.id, userId: studentUser.id },
  });

  await prisma.rideMember.create({
    data: { rideId: demoRide.id, userId: finderUser.id },
  });

  // ─── 6. Ride Group Conversation ───────────────────────────────────────────
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
      { conversationId: rideConv.id, userId: finderUser.id },
    ],
  });

  await prisma.message.create({
    data: {
      conversationId: rideConv.id,
      senderId: studentUser.id,
      content: 'Hey everyone, please be at North Gate by 5:25 AM!',
    },
  });

  // ─── 7. Direct 1-1 Conversation ──────────────────────────────────────────
  const directConv = await prisma.conversation.create({
    data: { isGroup: false },
  });

  await prisma.conversationMember.createMany({
    data: [
      { conversationId: directConv.id, userId: studentUser.id },
      { conversationId: directConv.id, userId: peerUser.id },
    ],
  });

  await prisma.message.create({
    data: {
      conversationId: directConv.id,
      senderId: peerUser.id,
      content: 'Hi! Do you still have that textbook available?',
    },
  });

  // ─── 8. Notifications ────────────────────────────────────────────────────
  await prisma.notification.create({
    data: {
      userId: studentUser.id,
      title: 'New Train Buddy Radar Alert!',
      message: `Sam Chen is also traveling on Train #12951 (NDLS → BCT) on 2026-11-20.`,
      type: 'MATCH',
      link: '/trips',
      isRead: false,
    },
  });

  await prisma.notification.create({
    data: {
      userId: finderUser.id,
      title: 'New Train Buddy Radar Alert!',
      message: `Alex Rivera is also traveling on Train #12951 (NDLS → BCT) on 2026-11-20.`,
      type: 'MATCH',
      link: '/trips',
      isRead: false,
    },
  });

  // ─── 9. Marketplace Listings ─────────────────────────────────────────────
  const listing1 = await prisma.listing.create({
    data: {
      sellerId: peerUser.id,
      title: 'Organic Chemistry: Structure and Function (8th Edition)',
      description:
        'Hardcover textbook. First 3 chapters lightly highlighted in yellow, binding in perfect shape.',
      price: 45.0,
      category: 'Books',
      condition: 'like new',
      imageUrls: ['https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500'],
      status: 'available',
      isExpired: false,
      expiresAt: expiry30Days,
    },
  });

  const listing2 = await prisma.listing.create({
    data: {
      sellerId: studentUser.id,
      title: 'Dell 24" UltraSharp 1080p Monitor with HDMI Cable',
      description:
        'Used for one semester in the dorms. No dead pixels, includes power and HDMI cables.',
      price: 85.0,
      category: 'Electronics',
      condition: 'used',
      imageUrls: ['https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500'],
      status: 'available',
      isExpired: false,
      expiresAt: expiry30Days,
    },
  });

  const listing3 = await prisma.listing.create({
    data: {
      sellerId: finderUser.id,
      title: 'Dorm Desk Lamp with USB-C Charging Port',
      description: 'Adjustable gooseneck LED lamp with 3 color temperatures and dimmer.',
      price: 18.0,
      category: 'Dorm Essentials',
      condition: 'new',
      imageUrls: ['https://images.unsplash.com/photo-1534972195531-a756b1126f24?w=500'],
      status: 'available',
      isExpired: false,
      expiresAt: expiry30Days,
    },
  });

  // ─── 10. Wishlist ─────────────────────────────────────────────────────────
  await prisma.wishlist.create({
    data: {
      userId: studentUser.id,
      listingId: listing1.id,
    },
  });

  // ─── 11. Moderation Report ───────────────────────────────────────────────
  await prisma.report.create({
    data: {
      reporterId: studentUser.id,
      targetType: 'LISTING',
      targetId: listing3.id,
      reason: 'Duplicate listing / spam test',
      details: 'Checking report pipeline in dev',
      status: 'pending',
    },
  });

  // ─── Summary ─────────────────────────────────────────────────────────────
  console.log('✅ Demo data seeded successfully:');
  console.log(`  - Admin:   ${adminUser.email}`);
  console.log(`  - Student: ${studentUser.email}`);
  console.log(`  - Finder:  ${finderUser.email}`);
  console.log(`  - Peer:    ${peerUser.email}`);
  console.log(`  - Train buddies: ${trip1.id.slice(0, 8)}... <-> ${trip2.id.slice(0, 8)}...`);
  console.log(`  - Ride:    ${demoRide.id.slice(0, 8)}... (${demoRide.availableSeats} seats left)`);
  console.log(`  - Listings: ${listing1.id.slice(0, 8)}... ${listing2.id.slice(0, 8)}... ${listing3.id.slice(0, 8)}...`);
  console.log(`  - Found claim demo:`);
  console.log(`      Item: "${foundItem1.title}"`);
  console.log(`      Question: "${foundItem1.secretQuestion}"`);
  console.log(`      Answer (plain): "totoro"`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
