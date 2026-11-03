import { test, expect } from '@playwright/test';

const API_BASE = 'http://localhost:5000/api';

/**
 * Helper to authenticate a user via the OTP verification endpoint and return JWT token
 */
async function authenticateUser(request: any, email: string) {
  // Request OTP
  const reqRes = await request.post(`${API_BASE}/auth/request-otp`, {
    data: { email },
  });
  expect(reqRes.ok()).toBeTruthy();

  // Verify with dev OTP (123456)
  const verifyRes = await request.post(`${API_BASE}/auth/verify-otp`, {
    data: { email, otp: '123456' },
  });
  expect(verifyRes.ok()).toBeTruthy();
  const json = await verifyRes.json();
  return {
    token: json.data.token,
    user: json.data.user,
  };
}

test.describe('CampusLoop Integration & Core User Flows', () => {
  /**
   * Flow a:
   * Sign up with college email OTP -> post a lost item ->
   * second user registers a matching found item ->
   * first user gets a match notification -> claim passes with the correct answer.
   */
  test('Flow a: Sign up with OTP -> Post lost item -> Matching found item -> Match notification & Claim verification', async ({
    request,
  }) => {
    // 1. Sign up user 1 (Alice)
    const aliceEmail = 'alice.lost@campus.edu';
    const alice = await authenticateUser(request, aliceEmail);
    expect(alice.user.email).toBe(aliceEmail);

    // 2. Alice posts a lost item
    const lostRes = await request.post(`${API_BASE}/lost`, {
      headers: { Authorization: `Bearer ${alice.token}` },
      data: {
        title: 'Sony WH-1000XM4 Noise Cancelling Headphones',
        description: 'Matte black headphones left on table in Central Library Floor 3.',
        category: 'Electronics',
        location: 'Central Library Floor 3',
        dateLost: new Date().toISOString(),
      },
    });
    expect(lostRes.status()).toBe(201);
    const lostItem = (await lostRes.json()).data;
    expect(lostItem.status).toBe('open');

    // 3. User 2 (Bob) signs up and posts a matching found item
    const bobEmail = 'bob.finder@campus.edu';
    const bob = await authenticateUser(request, bobEmail);

    const foundRes = await request.post(`${API_BASE}/found`, {
      headers: { Authorization: `Bearer ${bob.token}` },
      data: {
        title: 'Sony WH-1000XM4 Headphones Found',
        description: 'Found black headphones near Central Library Floor 3 desks.',
        category: 'Electronics',
        location: 'Central Library Floor 3',
        dateFound: new Date().toISOString(),
        holdingLocation: 'with finder',
        secretQuestion: 'What cartoon character sticker is on the right ear cup?',
        secretAnswer: 'Totoro',
      },
    });
    expect(foundRes.status()).toBe(201);
    const foundItem = (await foundRes.json()).data;

    // Secret answer must be hidden from response
    expect(foundItem.secretAnswer).toBeUndefined();

    // 4. Check matches for Alice
    const matchesRes = await request.get(`${API_BASE}/matches`, {
      headers: { Authorization: `Bearer ${alice.token}` },
    });
    expect(matchesRes.ok()).toBeTruthy();
    const matches = (await matchesRes.json()).data;
    const match = matches.find(
      (m: any) => m.lostItemId === lostItem.id || m.foundItemId === foundItem.id
    );
    expect(match).toBeDefined();
    expect(match.score).toBeGreaterThanOrEqual(0.60);

    // 5. Test claim verification: wrong answer must be rejected
    const wrongClaimRes = await request.post(`${API_BASE}/found/${foundItem.id}/claim`, {
      headers: { Authorization: `Bearer ${alice.token}` },
      data: {
        answer: 'Pikachu',
        note: 'Mine!',
      },
    });
    expect(wrongClaimRes.status()).toBe(400);

    // 6. Test claim verification: correct answer approves claim & unlocks finder contacts
    const correctClaimRes = await request.post(`${API_BASE}/found/${foundItem.id}/claim`, {
      headers: { Authorization: `Bearer ${alice.token}` },
      data: {
        answer: 'Totoro',
        note: 'I left them on the desk while studying.',
      },
    });
    expect(correctClaimRes.status()).toBe(200);
    const claimData = (await correctClaimRes.json()).data;
    expect(claimData.success).toBe(true);
    expect(claimData.finderContact).toBeDefined();
    expect(claimData.finderContact.email).toBe(bobEmail);
    expect(claimData.item.status).toBe('reunited');
  });

  /**
   * Flow b:
   * Two users add the same train and date -> they see each other as buddies -> start chat.
   */
  test('Flow b: Two users add same train & date -> Match as Train Buddies -> Start chat conversation', async ({
    request,
  }) => {
    // 1. User 1 (Rohan) logs in and posts trip
    const rohan = await authenticateUser(request, 'rohan.travel@campus.edu');
    const rohanTripRes = await request.post(`${API_BASE}/trips`, {
      headers: { Authorization: `Bearer ${rohan.token}` },
      data: {
        trainNumber: '12951',
        trainName: 'Mumbai Rajdhani',
        fromStation: 'NDLS',
        toStation: 'BCT',
        date: '2026-11-25',
        departureTime: '16:55',
        pnr: '9876543210', // PNR provided in request must NEVER be stored
      },
    });
    expect(rohanTripRes.status()).toBe(201);
    const rohanTrip = (await rohanTripRes.json()).data;
    // Strict privacy guarantee: PNR must never be in database response
    expect((rohanTrip as any).pnr).toBeUndefined();

    // 2. User 2 (Priya) logs in and posts matching trip
    const priya = await authenticateUser(request, 'priya.travel@campus.edu');
    const priyaTripRes = await request.post(`${API_BASE}/trips`, {
      headers: { Authorization: `Bearer ${priya.token}` },
      data: {
        trainNumber: '12951',
        trainName: 'Mumbai Rajdhani',
        fromStation: 'NDLS',
        toStation: 'BCT',
        date: '2026-11-25',
        departureTime: '16:55',
      },
    });
    expect(priyaTripRes.status()).toBe(201);
    const priyaTrip = (await priyaTripRes.json()).data;

    // 3. Rohan discovers Priya as a Train Buddy
    const buddiesRes = await request.get(`${API_BASE}/trips/${rohanTrip.id}/buddies`, {
      headers: { Authorization: `Bearer ${rohan.token}` },
    });
    expect(buddiesRes.ok()).toBeTruthy();
    const buddies = (await buddiesRes.json()).data;
    const match = buddies.find((b: any) => b.trip.userId === priya.user.id);
    expect(match).toBeDefined();

    // Privacy verification: Buddy profile contains display name, but NEVER email or phone
    expect(match.trip.user.name).toBeDefined();
    expect(match.trip.user.email).toBeUndefined();
    expect(match.trip.user.phone).toBeUndefined();

    // 4. Start direct chat conversation between the buddies
    const convRes = await request.post(`${API_BASE}/conversations`, {
      headers: { Authorization: `Bearer ${rohan.token}` },
      data: { recipientId: priya.user.id },
    });
    expect([200, 201]).toContain(convRes.status());
    const conv = (await convRes.json()).data;

    // Send a message
    const msgRes = await request.post(`${API_BASE}/conversations/${conv.id}/messages`, {
      headers: { Authorization: `Bearer ${rohan.token}` },
      data: { content: 'Hey Priya! Saw you are on the Rajdhani on the 25th as well!' },
    });
    expect(msgRes.status()).toBe(201);
    const msg = (await msgRes.json()).data;
    expect(msg.content).toContain('Rajdhani');

    // Priya retrieves message history
    const historyRes = await request.get(`${API_BASE}/conversations/${conv.id}/messages`, {
      headers: { Authorization: `Bearer ${priya.token}` },
    });
    expect(historyRes.ok()).toBeTruthy();
    const history = (await historyRes.json()).data;
    expect(history.some((m: any) => m.id === msg.id)).toBe(true);
  });

  /**
   * Flow c:
   * Create a ride -> second user joins -> seats update to Full -> fare split shows the correct share.
   */
  test('Flow c: Create ride -> Second user joins -> Seats update to FULL -> Fair fare split calculation', async ({
    request,
  }) => {
    // 1. Creator creates a 2-seat ride (1 available seat for passenger)
    const creator = await authenticateUser(request, 'driver.dan@campus.edu');
    const rideRes = await request.post(`${API_BASE}/rides`, {
      headers: { Authorization: `Bearer ${creator.token}` },
      data: {
        origin: 'Campus North Gate',
        destination: 'International Airport Terminal 3',
        departureTime: new Date(Date.now() + 86400000).toISOString(),
        totalSeats: 2,
        estimatedFare: 60.0,
        notes: 'Heading home for holidays, Uber XL.',
      },
    });
    expect(rideRes.status()).toBe(201);
    const ride = (await rideRes.json()).data;
    expect(ride.availableSeats).toBe(1);
    expect(ride.status).toBe('OPEN');

    // 2. Passenger joins ride
    const passenger = await authenticateUser(request, 'passenger.pat@campus.edu');
    const joinRes = await request.post(`${API_BASE}/rides/${ride.id}/join`, {
      headers: { Authorization: `Bearer ${passenger.token}` },
    });
    expect(joinRes.status()).toBe(200);
    const joinData = (await joinRes.json()).data;
    expect(joinData.joined).toBe(true);
    expect(joinData.availableSeats).toBe(0);
    expect(joinData.status).toBe('FULL');

    // 3. Inspect ride detail to verify full status
    const detailRes = await request.get(`${API_BASE}/rides/${ride.id}`);
    expect(detailRes.ok()).toBeTruthy();
    const updatedRide = (await detailRes.json()).data;
    expect(updatedRide.availableSeats).toBe(0);
    expect(updatedRide.status).toBe('FULL');

    // 4. Verify fare split calculation: 60 / 2 = $30.00 each
    const fareSplitRes = await request.get(`${API_BASE}/rides/${ride.id}/fare-split`, {
      headers: { Authorization: `Bearer ${passenger.token}` },
    });
    expect(fareSplitRes.ok()).toBeTruthy();
    const fareData = (await fareSplitRes.json()).data;
    expect(fareData.totalFare).toBe(60);
    expect(fareData.passengerCount).toBe(2);
    expect(fareData.farePerPerson).toBe(30);
    expect(fareData.participants.length).toBe(2);
  });

  /**
   * Flow d:
   * Create a marketplace listing -> another user wishlists it and messages the seller.
   */
  test('Flow d: Create marketplace listing -> Wishlist item -> Message seller in chat', async ({
    request,
  }) => {
    // 1. Seller creates listing
    const seller = await authenticateUser(request, 'seller.sam@campus.edu');
    const listingRes = await request.post(`${API_BASE}/listings`, {
      headers: { Authorization: `Bearer ${seller.token}` },
      data: {
        title: 'Calculus: Early Transcendentals (9th Edition)',
        description: 'Hardcover textbook, clean without annotations.',
        price: 40,
        category: 'Books',
        condition: 'like new',
        imageUrls: ['https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500'],
      },
    });
    expect(listingRes.status()).toBe(201);
    const listing = (await listingRes.json()).data;

    // 2. Buyer views listing and toggles wishlist
    const buyer = await authenticateUser(request, 'buyer.bella@campus.edu');
    const wishlistRes = await request.post(`${API_BASE}/listings/${listing.id}/wishlist`, {
      headers: { Authorization: `Bearer ${buyer.token}` },
    });
    expect(wishlistRes.status()).toBe(200);
    const wishData = (await wishlistRes.json()).data;
    expect(wishData.isWishlisted).toBe(true);

    // Verify item is in buyer's wishlist
    const myWishlistRes = await request.get(`${API_BASE}/wishlist`, {
      headers: { Authorization: `Bearer ${buyer.token}` },
    });
    expect(myWishlistRes.ok()).toBeTruthy();
    const myWishlist = (await myWishlistRes.json()).data;
    expect(myWishlist.some((item: any) => item.id === listing.id)).toBe(true);

    // 3. Buyer starts conversation with seller about the textbook
    const chatRes = await request.post(`${API_BASE}/conversations`, {
      headers: { Authorization: `Bearer ${buyer.token}` },
      data: { recipientId: seller.user.id },
    });
    expect([200, 201]).toContain(chatRes.status());
    const conv = (await chatRes.json()).data;

    const msgRes = await request.post(`${API_BASE}/conversations/${conv.id}/messages`, {
      headers: { Authorization: `Bearer ${buyer.token}` },
      data: { content: 'Hi Sam! Is your Calculus textbook still available to pick up at the library?' },
    });
    expect(msgRes.status()).toBe(201);
    const msg = (await msgRes.json()).data;
    expect(msg.content).toContain('Calculus');
  });

  /**
   * Flow e:
   * User reports a post -> admin removes it.
   */
  test('Flow e: User reports abusive post -> Admin reviews & removes offending content', async ({
    request,
  }) => {
    // 1. Spammer creates abusive listing
    const spammer = await authenticateUser(request, 'spammer@campus.edu');
    const badListingRes = await request.post(`${API_BASE}/listings`, {
      headers: { Authorization: `Bearer ${spammer.token}` },
      data: {
        title: 'Unauthorized exam test bank answers leaked',
        description: 'Direct PDF download for CS101 final.',
        price: 10,
        category: 'Services',
        condition: 'new',
        imageUrls: [],
      },
    });
    expect(badListingRes.status()).toBe(201);
    const badListing = (await badListingRes.json()).data;

    // 2. Student reports the listing
    const reporter = await authenticateUser(request, 'whistleblower@campus.edu');
    const reportRes = await request.post(`${API_BASE}/reports`, {
      headers: { Authorization: `Bearer ${reporter.token}` },
      data: {
        targetType: 'LISTING',
        targetId: badListing.id,
        reason: 'Academic integrity violation / exam leaks',
        details: 'Selling stolen test banks for upcoming exam.',
      },
    });
    expect(reportRes.status()).toBe(201);
    const report = (await reportRes.json()).data;
    expect(report.status).toBe('pending');

    // 3. Admin logs in
    const admin = await authenticateUser(request, 'admin@campus.edu');

    // Admin lists pending reports
    const adminReportsRes = await request.get(`${API_BASE}/admin/reports?status=pending`, {
      headers: { Authorization: `Bearer ${admin.token}` },
    });
    expect(adminReportsRes.ok()).toBeTruthy();
    const reportsList = (await adminReportsRes.json()).data;
    expect(reportsList.some((r: any) => r.id === report.id)).toBe(true);

    // 4. Admin removes offending post
    const deleteRes = await request.delete(`${API_BASE}/admin/posts/listing/${badListing.id}`, {
      headers: { Authorization: `Bearer ${admin.token}` },
    });
    expect(deleteRes.status()).toBe(200);
    const deleteData = (await deleteRes.json()).data;
    expect(deleteData.deleted).toBe(true);

    // Confirm post is gone
    const verifyDeleted = await request.get(`${API_BASE}/listings/${badListing.id}`);
    expect(verifyDeleted.status()).toBe(404);
  });

  /**
   * Security & Privacy Rule Verifications (Requirement 6)
   */
  test('Security: Email domain restriction, PNR privacy, and hidden contact details cannot be bypassed', async ({
    request,
  }) => {
    // 1. Non-campus email domains must be strictly rejected
    const invalidDomainRes = await request.post(`${API_BASE}/auth/request-otp`, {
      data: { email: 'hacker@gmail.com' },
    });
    expect(invalidDomainRes.status()).toBe(400);
    const err = await invalidDomainRes.json();
    expect(err.error.code).toBe('INVALID_EMAIL_DOMAIN');

    // 2. Train buddy trip endpoint rejects storing PNR
    const user = await authenticateUser(request, 'security.tester@campus.edu');
    const tripRes = await request.post(`${API_BASE}/trips`, {
      headers: { Authorization: `Bearer ${user.token}` },
      data: {
        trainNumber: '12952',
        fromStation: 'BCT',
        toStation: 'NDLS',
        date: '2026-11-28',
        pnr: '1234567890',
        seatNumber: 'B3-42',
      },
    });
    expect(tripRes.status()).toBe(201);
    const trip = (await tripRes.json()).data;
    expect((trip as any).pnr).toBeUndefined();
    expect((trip as any).seatNumber).toBeUndefined();

    // 3. Found item details hide finder contact details until verified claim
    const finder = await authenticateUser(request, 'secret.finder@campus.edu');
    const itemRes = await request.post(`${API_BASE}/found`, {
      headers: { Authorization: `Bearer ${finder.token}` },
      data: {
        title: 'Apple Watch Series 9',
        description: 'Found on treadmill in the campus recreation center.',
        category: 'Electronics',
        location: 'Recreation Center Gym',
        dateFound: new Date().toISOString(),
        holdingLocation: 'with finder',
        secretQuestion: 'What engraving is on the back?',
        secretAnswer: 'Class of 2026',
      },
    });
    expect(itemRes.status()).toBe(201);
    const item = (await itemRes.json()).data;

    // Public GET item endpoint does not reveal finder phone or email
    const publicGet = await request.get(`${API_BASE}/found/${item.id}`);
    expect(publicGet.ok()).toBeTruthy();
    const publicItem = (await publicGet.json()).data;
    expect(publicItem.user.email).toBeUndefined();
    expect(publicItem.user.phone).toBeUndefined();
    expect(publicItem.secretAnswer).toBeUndefined();
  });
});
