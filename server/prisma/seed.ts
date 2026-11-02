import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding CampusLoop Phase 1 database...');

  // Clean existing tables in proper order
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
  await prisma.otpToken.deleteMany();
  await prisma.user.deleteMany();

  // 1. Seed Users
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@campus.edu',
      name: 'Dean Martinez',
      role: 'ADMIN',
      phone: '+15550001111',
      avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
    },
  });

  const studentUser = await prisma.user.create({
    data: {
      email: 'student@campus.edu',
      name: 'Alex Rivera',
      role: 'USER',
      phone: '+15550002222',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    },
  });

  const finderUser = await prisma.user.create({
    data: {
      email: 'finder@campus.edu',
      name: 'Sam Chen',
      role: 'USER',
      phone: '+15550003333',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    },
  });

  const peerUser = await prisma.user.create({
    data: {
      email: 'sarah@campus.edu',
      name: 'Sarah Jenkins',
      role: 'USER',
      phone: '+15550004444',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    },
  });

  const expiry30Days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  // 2. Seed Lost Items
  await prisma.lostItem.create({
    data: {
      userId: studentUser.id,
      title: 'Sony WH-1000XM4 Noise-Cancelling Headphones',
      description: 'Matte black over-ear headphones left in the 3rd floor quiet study cubicle near bookshelf #4.',
      category: 'Electronics',
      location: 'Central Library Floor 3',
      dateLost: new Date(Date.now() - 18 * 60 * 60 * 1000), // 18 hrs ago
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
      dateLost: new Date(Date.now() - 48 * 60 * 60 * 1000), // 2 days ago
      imageUrl: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=500',
      status: 'open',
      isExpired: false,
      expiresAt: expiry30Days,
    },
  });

  // 3. Seed Found Items with Secret Question & Hashed Answer
  const salt = await bcrypt.genSalt(10);
  const hashedAnswer1 = await bcrypt.hash('totoro', salt);
  const hashedAnswer2 = await bcrypt.hash('4321', salt);

  const foundItem1 = await prisma.foundItem.create({
    data: {
      userId: finderUser.id,
      title: 'Matte Black Wireless Earbuds Case',
      description: 'Found under desk row 4 after the CS101 lecture. Turned in for safekeeping.',
      category: 'Electronics',
      location: 'Science Complex Auditorium B',
      dateFound: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hrs ago
      imageUrl: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500',
      holdingLocation: 'with finder',
      secretQuestion: 'What cartoon sticker is on the back of the case?',
      secretAnswer: hashedAnswer1, // answer is "totoro"
      status: 'open',
      isExpired: false,
      expiresAt: expiry30Days,
    },
  });

  await prisma.foundItem.create({
    data: {
      userId: studentUser.id,
      title: 'Silver TI-84 Plus CE Calculator',
      description: 'Found in the math lab. Turned in to the department administrative desk.',
      category: 'Electronics',
      location: 'Math Building Room 204',
      dateFound: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hrs ago
      imageUrl: 'https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?w=500',
      holdingLocation: 'department',
      secretQuestion: 'What are the last 4 digits etched on the back cover?',
      secretAnswer: hashedAnswer2, // answer is "4321"
      status: 'open',
      isExpired: false,
      expiresAt: expiry30Days,
    },
  });

  // 4. Seed Marketplace Listings
  const listing1 = await prisma.listing.create({
    data: {
      sellerId: peerUser.id,
      title: 'Organic Chemistry: Structure and Function (8th Edition)',
      description: 'Hardcover textbook. First 3 chapters lightly highlighted in yellow, binding in perfect shape.',
      price: 45.0,
      category: 'Books',
      condition: 'like new',
      imageUrls: [
        'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500',
      ],
      status: 'available',
      isExpired: false,
      expiresAt: expiry30Days,
    },
  });

  const listing2 = await prisma.listing.create({
    data: {
      sellerId: studentUser.id,
      title: 'Dell 24" UltraSharp 1080p Monitor with HDMI Cable',
      description: 'Used for one semester in the dorms. No dead pixels, includes power and HDMI cables.',
      price: 85.0,
      category: 'Electronics',
      condition: 'used',
      imageUrls: [
        'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500',
      ],
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
      imageUrls: [
        'https://images.unsplash.com/photo-1534972195531-a756b1126f24?w=500',
      ],
      status: 'available',
      isExpired: false,
      expiresAt: expiry30Days,
    },
  });

  // 5. Seed Wishlist
  await prisma.wishlist.create({
    data: {
      userId: studentUser.id,
      listingId: listing1.id,
    },
  });

  // 6. Seed Moderation Report
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

  console.log('✅ Phase 1 demo data successfully seeded:');
  console.log(` - Admin: ${adminUser.email}`);
  console.log(` - Students: ${studentUser.email}, ${finderUser.email}, ${peerUser.email}`);
  console.log(` - Found Item claim demo:`);
  console.log(`     Item: "${foundItem1.title}"`);
  console.log(`     Question: "${foundItem1.secretQuestion}"`);
  console.log(`     Answer: "totoro"`);
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
