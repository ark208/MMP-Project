# CampusLoop API Contract

This document serves as the single source of truth for both the frontend (`/client`) and backend (`/server`) of CampusLoop.

---

## 1. Response Envelope

All API endpoints strictly follow a standard response envelope.

### 1.1 Success Response

HTTP Status: `200 OK` or `201 Created`

```json
{
  "data": { ... }
}
```

*Note: For endpoints returning a collection or list, `data` is an array or an object containing `items` and pagination metadata `meta`.*

### 1.2 Error Response

HTTP Status: `4xx` (Client error) or `5xx` (Server error)

```json
{
  "error": {
    "code": "BAD_REQUEST",
    "message": "Human-readable description of the error",
    "details": null
  }
}
```

Standard error codes:
- `BAD_REQUEST` (400) - Missing or invalid payload/parameters
- `UNAUTHORIZED` (401) - Missing, expired, or invalid JWT
- `FORBIDDEN` (403) - Insufficient permissions or account banned
- `NOT_FOUND` (404) - Resource does not exist
- `CONFLICT` (409) - State conflict (e.g. ride is full, already claimed)
- `INTERNAL_SERVER_ERROR` (500) - Unhandled server exception

---

## 2. Authentication

Authentication uses JSON Web Tokens (JWT).

- Protected routes require the JWT to be supplied in the HTTP `Authorization` request header:
  ```http
  Authorization: Bearer <jwt_token>
  ```
- Unauthenticated requests to protected endpoints return:
  ```json
  {
    "error": {
      "code": "UNAUTHORIZED",
      "message": "Authorization header missing or invalid"
    }
  }
  ```
- Admin endpoints additionally check that the authenticated user possesses `role: "ADMIN"`. Non-admin requests return `403 FORBIDDEN`.

---

## 3. Endpoints

### 3.1 Authentication

#### `POST /api/auth/request-otp`
Sends a one-time passcode to the specified university email.
- **Auth**: Public
- **Request Body**:
  ```json
  {
    "email": "student@campus.edu"
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "data": {
      "message": "OTP sent successfully",
      "email": "student@campus.edu"
    }
  }
  ```

#### `POST /api/auth/verify-otp`
Verifies OTP code and returns a session JWT. Creates user profile if new.
- **Auth**: Public
- **Request Body**:
  ```json
  {
    "email": "student@campus.edu",
    "otp": "123456"
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "data": {
      "token": "eyJhbGciOi...",
      "user": {
        "id": "usr_123",
        "email": "student@campus.edu",
        "name": "Jane Doe",
        "phone": "+1234567890",
        "avatarUrl": "https://...",
        "role": "USER",
        "isBanned": false,
        "createdAt": "2026-11-01T12:00:00.000Z",
        "updatedAt": "2026-11-01T12:00:00.000Z"
      }
    }
  }
  ```

#### `GET /api/me`
Fetches the current authenticated user profile.
- **Auth**: Required (`Bearer <token>`)
- **Response `200 OK`**:
  ```json
  {
    "data": {
      "id": "usr_123",
      "email": "student@campus.edu",
      "name": "Jane Doe",
      "phone": "+1234567890",
      "avatarUrl": "https://...",
      "role": "USER",
      "isBanned": false,
      "createdAt": "2026-11-01T12:00:00.000Z",
      "updatedAt": "2026-11-01T12:00:00.000Z"
    }
  }
  ```

---

### 3.2 File Uploads

#### `POST /api/uploads`
Uploads a single image file for post attachments or profile avatars.
- **Auth**: Required
- **Request Headers**: `Content-Type: multipart/form-data`
- **Request Body**: Form field `file` containing image file (`jpg`, `jpeg`, `png`, `webp`). Max 5MB.
- **Response `201 Created`**:
  ```json
  {
    "data": {
      "url": "https://cdn.campusloop.internal/uploads/img_456.jpg"
    }
  }
  ```

---

### 3.3 Module: Lost & Found

#### `POST /api/lost`
Reports a lost item.
- **Auth**: Required
- **Request Body**:
  ```json
  {
    "title": "Black AirPods Pro Case",
    "description": "Lost near Student Union 2nd floor lounge. Has a blue carabiner.",
    "category": "Electronics",
    "location": "Student Union",
    "dateLost": "2026-11-01T14:30:00.000Z",
    "imageUrl": "https://cdn.campusloop.internal/uploads/img_456.jpg"
  }
  ```
- **Response `201 Created`**:
  ```json
  {
    "data": {
      "id": "lost_001",
      "userId": "usr_123",
      "title": "Black AirPods Pro Case",
      "description": "Lost near Student Union 2nd floor lounge.",
      "category": "Electronics",
      "location": "Student Union",
      "dateLost": "2026-11-01T14:30:00.000Z",
      "imageUrl": "https://cdn.campusloop.internal/uploads/img_456.jpg",
      "status": "OPEN",
      "matchedFoundItemId": null,
      "createdAt": "2026-11-01T15:00:00.000Z",
      "updatedAt": "2026-11-01T15:00:00.000Z"
    }
  }
  ```

#### `GET /api/lost`
Lists lost items with optional filters (`status`, `category`, `q`).
- **Auth**: Public or Optional
- **Query Params**: `?status=OPEN&category=Electronics&q=AirPods`
- **Response `200 OK`**:
  ```json
  {
    "data": [
      {
        "id": "lost_001",
        "userId": "usr_123",
        "user": {
          "id": "usr_123",
          "name": "Jane Doe",
          "email": "student@campus.edu",
          "avatarUrl": "https://..."
        },
        "title": "Black AirPods Pro Case",
        "description": "Lost near Student Union 2nd floor lounge.",
        "category": "Electronics",
        "location": "Student Union",
        "dateLost": "2026-11-01T14:30:00.000Z",
        "imageUrl": "https://...",
        "status": "OPEN",
        "matchedFoundItemId": null,
        "createdAt": "2026-11-01T15:00:00.000Z",
        "updatedAt": "2026-11-01T15:00:00.000Z"
      }
    ]
  }
  ```

#### `GET /api/lost/:id`
Retrieves a specific lost item by ID.
- **Auth**: Public or Optional
- **Response `200 OK`**:
  ```json
  {
    "data": {
      "id": "lost_001",
      "userId": "usr_123",
      "title": "Black AirPods Pro Case",
      "description": "Lost near Student Union 2nd floor lounge.",
      "category": "Electronics",
      "location": "Student Union",
      "dateLost": "2026-11-01T14:30:00.000Z",
      "imageUrl": "https://...",
      "status": "OPEN",
      "matchedFoundItemId": null,
      "createdAt": "2026-11-01T15:00:00.000Z",
      "updatedAt": "2026-11-01T15:00:00.000Z"
    }
  }
  ```

#### `PATCH /api/lost/:id/status`
Updates status of a lost item (`OPEN`, `RESOLVED`, `CLOSED`). Only the owner or an admin can update.
- **Auth**: Required
- **Request Body**:
  ```json
  {
    "status": "RESOLVED"
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "data": {
      "id": "lost_001",
      "status": "RESOLVED",
      "updatedAt": "2026-11-01T16:00:00.000Z"
    }
  }
  ```

---

#### `POST /api/found`
Reports a found item. Triggers automatic similarity matching against open lost items.
- **Auth**: Required
- **Request Body**:
  ```json
  {
    "title": "AirPods case found",
    "description": "Black casing found under table in Student Union.",
    "category": "Electronics",
    "location": "Student Union",
    "dateFound": "2026-11-01T14:45:00.000Z",
    "imageUrl": "https://cdn.campusloop.internal/uploads/img_789.jpg"
  }
  ```
- **Response `201 Created`**:
  ```json
  {
    "data": {
      "id": "found_101",
      "userId": "usr_999",
      "title": "AirPods case found",
      "description": "Black casing found under table.",
      "category": "Electronics",
      "location": "Student Union",
      "dateFound": "2026-11-01T14:45:00.000Z",
      "imageUrl": "https://cdn.campusloop.internal/uploads/img_789.jpg",
      "status": "OPEN",
      "claimedByUserId": null,
      "createdAt": "2026-11-01T15:10:00.000Z",
      "updatedAt": "2026-11-01T15:10:00.000Z"
    }
  }
  ```

#### `GET /api/found`
Lists found items with optional filters (`status`, `category`, `q`).
- **Auth**: Public or Optional
- **Query Params**: `?status=OPEN&category=Electronics`
- **Response `200 OK`**:
  ```json
  {
    "data": [
      {
        "id": "found_101",
        "userId": "usr_999",
        "title": "AirPods case found",
        "description": "Black casing found under table.",
        "category": "Electronics",
        "location": "Student Union",
        "dateFound": "2026-11-01T14:45:00.000Z",
        "imageUrl": "https://...",
        "status": "OPEN",
        "claimedByUserId": null,
        "createdAt": "2026-11-01T15:10:00.000Z",
        "updatedAt": "2026-11-01T15:10:00.000Z"
      }
    ]
  }
  ```

#### `GET /api/found/:id`
Retrieves a single found item by ID.
- **Auth**: Public or Optional
- **Response `200 OK`**:
  ```json
  {
    "data": {
      "id": "found_101",
      "userId": "usr_999",
      "title": "AirPods case found",
      "description": "Black casing found under table.",
      "category": "Electronics",
      "location": "Student Union",
      "dateFound": "2026-11-01T14:45:00.000Z",
      "imageUrl": "https://...",
      "status": "OPEN",
      "claimedByUserId": null,
      "createdAt": "2026-11-01T15:10:00.000Z",
      "updatedAt": "2026-11-01T15:10:00.000Z"
    }
  }
  ```

#### `POST /api/found/:id/claim`
Submits a claim request for a found item with proof of ownership.
- **Auth**: Required
- **Request Body**:
  ```json
  {
    "note": "Serial number is ABCD-1234, has a scratch on the back right hinge.",
    "proofImageUrl": "https://cdn.campusloop.internal/uploads/proof.jpg"
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "data": {
      "id": "found_101",
      "status": "CLAIMED",
      "claimedByUserId": "usr_123",
      "claimNote": "Serial number is ABCD-1234..."
    }
  }
  ```

#### `PATCH /api/found/:id/status`
Updates status of a found item (`OPEN`, `CLAIMED`, `RESOLVED`). Only the poster or admin can update.
- **Auth**: Required
- **Request Body**:
  ```json
  {
    "status": "RESOLVED"
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "data": {
      "id": "found_101",
      "status": "RESOLVED",
      "updatedAt": "2026-11-01T16:00:00.000Z"
    }
  }
  ```

---

### 3.4 Module: Campus Marketplace

#### `POST /api/listings`
Creates a new marketplace listing.
- **Auth**: Required
- **Request Body**:
  ```json
  {
    "title": "Calculus: Early Transcendentals 9th Ed",
    "description": "Mint condition textbook, no markings inside.",
    "price": 45.00,
    "category": "Books",
    "condition": "LIKE_NEW",
    "imageUrls": [
      "https://cdn.campusloop.internal/uploads/book1.jpg"
    ]
  }
  ```
- **Response `201 Created`**:
  ```json
  {
    "data": {
      "id": "list_301",
      "sellerId": "usr_123",
      "title": "Calculus: Early Transcendentals 9th Ed",
      "description": "Mint condition textbook...",
      "price": 45.00,
      "category": "Books",
      "condition": "LIKE_NEW",
      "imageUrls": ["https://..."],
      "status": "AVAILABLE",
      "createdAt": "2026-11-01T12:00:00.000Z",
      "updatedAt": "2026-11-01T12:00:00.000Z"
    }
  }
  ```

#### `GET /api/listings`
Queries active marketplace listings with filtering.
- **Auth**: Public or Optional
- **Query Params**:
  - `category` (string, optional)
  - `minPrice` (number, optional)
  - `maxPrice` (number, optional)
  - `q` (string, text search in title/desc)
  - `page` (number, default: 1)
  - `limit` (number, default: 20)
- **Response `200 OK`**:
  ```json
  {
    "data": {
      "items": [
        {
          "id": "list_301",
          "sellerId": "usr_123",
          "seller": {
            "id": "usr_123",
            "name": "Jane Doe",
            "email": "student@campus.edu",
            "avatarUrl": "https://..."
          },
          "title": "Calculus: Early Transcendentals 9th Ed",
          "description": "Mint condition textbook...",
          "price": 45.00,
          "category": "Books",
          "condition": "LIKE_NEW",
          "imageUrls": ["https://..."],
          "status": "AVAILABLE",
          "isWishlisted": false,
          "createdAt": "2026-11-01T12:00:00.000Z",
          "updatedAt": "2026-11-01T12:00:00.000Z"
        }
      ],
      "meta": {
        "page": 1,
        "limit": 20,
        "total": 1,
        "totalPages": 1
      }
    }
  }
  ```

#### `GET /api/listings/:id`
Retrieves single listing details.
- **Auth**: Public or Optional (checks wishlist status if token present)
- **Response `200 OK`**:
  ```json
  {
    "data": {
      "id": "list_301",
      "sellerId": "usr_123",
      "seller": {
        "id": "usr_123",
        "name": "Jane Doe",
        "email": "student@campus.edu",
        "avatarUrl": "https://..."
      },
      "title": "Calculus: Early Transcendentals 9th Ed",
      "description": "Mint condition textbook...",
      "price": 45.00,
      "category": "Books",
      "condition": "LIKE_NEW",
      "imageUrls": ["https://..."],
      "status": "AVAILABLE",
      "isWishlisted": false,
      "createdAt": "2026-11-01T12:00:00.000Z",
      "updatedAt": "2026-11-01T12:00:00.000Z"
    }
  }
  ```

#### `PATCH /api/listings/:id`
Updates listing fields or status (`AVAILABLE`, `RESERVED`, `SOLD`).
- **Auth**: Required (Owner or Admin)
- **Request Body**:
  ```json
  {
    "price": 40.00,
    "status": "RESERVED"
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "data": {
      "id": "list_301",
      "price": 40.00,
      "status": "RESERVED",
      "updatedAt": "2026-11-01T16:00:00.000Z"
    }
  }
  ```

#### `DELETE /api/listings/:id`
Deletes a listing.
- **Auth**: Required (Owner or Admin)
- **Response `200 OK`**:
  ```json
  {
    "data": {
      "id": "list_301",
      "deleted": true
    }
  }
  ```

#### `POST /api/listings/:id/wishlist`
Adds listing to authenticated user's wishlist.
- **Auth**: Required
- **Response `200 OK`**:
  ```json
  {
    "data": {
      "listingId": "list_301",
      "isWishlisted": true
    }
  }
  ```

#### `DELETE /api/listings/:id/wishlist`
Removes listing from authenticated user's wishlist.
- **Auth**: Required
- **Response `200 OK`**:
  ```json
  {
    "data": {
      "listingId": "list_301",
      "isWishlisted": false
    }
  }
  ```

#### `GET /api/wishlist`
Fetches all wishlisted listings for the authenticated user.
- **Auth**: Required
- **Response `200 OK`**:
  ```json
  {
    "data": [
      {
        "id": "list_301",
        "title": "Calculus: Early Transcendentals 9th Ed",
        "price": 40.00,
        "category": "Books",
        "imageUrls": ["https://..."],
        "status": "AVAILABLE"
      }
    ]
  }
  ```

---

### 3.5 Module: Train Buddy Radar

#### `POST /api/trips`
Posts an upcoming train journey.
- **Auth**: Required
- **Request Body**:
  ```json
  {
    "trainNumber": "12951",
    "trainName": "Mumbai Rajdhani",
    "originStation": "NDLS",
    "destinationStation": "BCT",
    "departureDate": "2026-11-15",
    "departureTime": "16:55",
    "coach": "B4",
    "seat": "42",
    "notes": "Looking for fellow batchmates traveling back home!"
  }
  ```
- **Response `201 Created`**:
  ```json
  {
    "data": {
      "id": "trip_501",
      "userId": "usr_123",
      "trainNumber": "12951",
      "trainName": "Mumbai Rajdhani",
      "originStation": "NDLS",
      "destinationStation": "BCT",
      "departureDate": "2026-11-15",
      "departureTime": "16:55",
      "coach": "B4",
      "seat": "42",
      "notes": "Looking for fellow batchmates...",
      "createdAt": "2026-11-01T12:00:00.000Z",
      "updatedAt": "2026-11-01T12:00:00.000Z"
    }
  }
  ```

#### `GET /api/trips/mine`
Retrieves all train journeys posted by the authenticated user.
- **Auth**: Required
- **Response `200 OK`**:
  ```json
  {
    "data": [
      {
        "id": "trip_501",
        "trainNumber": "12951",
        "trainName": "Mumbai Rajdhani",
        "originStation": "NDLS",
        "destinationStation": "BCT",
        "departureDate": "2026-11-15",
        "departureTime": "16:55",
        "coach": "B4",
        "seat": "42"
      }
    ]
  }
  ```

#### `GET /api/trips/:id/buddies`
Discovers potential train buddies on the same train/route and departure date.
- **Auth**: Required
- **Response `200 OK`**:
  ```json
  {
    "data": [
      {
        "trip": {
          "id": "trip_502",
          "userId": "usr_456",
          "user": {
            "id": "usr_456",
            "name": "Alex Smith",
            "avatarUrl": "https://..."
          },
          "trainNumber": "12951",
          "trainName": "Mumbai Rajdhani",
          "originStation": "NDLS",
          "destinationStation": "BCT",
          "departureDate": "2026-11-15",
          "departureTime": "16:55",
          "coach": "B4",
          "seat": "38"
        },
        "isSameCoach": true,
        "distanceHours": 0
      }
    ]
  }
  ```

#### `DELETE /api/trips/:id`
Deletes a posted train trip.
- **Auth**: Required (Owner or Admin)
- **Response `200 OK`**:
  ```json
  {
    "data": {
      "id": "trip_501",
      "deleted": true
    }
  }
  ```

---

### 3.6 Module: Ride Splitting

#### `POST /api/rides`
Creates a new ride share offer/request.
- **Auth**: Required
- **Request Body**:
  ```json
  {
    "origin": "North Campus Gate 1",
    "destination": "Airport Terminal 3",
    "departureTime": "2026-11-10T06:00:00.000Z",
    "totalSeats": 4,
    "estimatedFare": 80.00,
    "notes": "Leaving promptly at 6 AM. 1 large suitcase per person."
  }
  ```
- **Response `201 Created`**:
  ```json
  {
    "data": {
      "id": "ride_701",
      "creatorId": "usr_123",
      "origin": "North Campus Gate 1",
      "destination": "Airport Terminal 3",
      "departureTime": "2026-11-10T06:00:00.000Z",
      "totalSeats": 4,
      "availableSeats": 3,
      "estimatedFare": 80.00,
      "status": "OPEN",
      "notes": "Leaving promptly...",
      "createdAt": "2026-11-01T12:00:00.000Z",
      "updatedAt": "2026-11-01T12:00:00.000Z"
    }
  }
  ```

#### `GET /api/rides`
Lists open rides, filterable by date, destination, and origin.
- **Auth**: Public or Optional
- **Query Params**: `?origin=North+Campus&destination=Airport&date=2026-11-10`
- **Response `200 OK`**:
  ```json
  {
    "data": [
      {
        "id": "ride_701",
        "creatorId": "usr_123",
        "creator": {
          "id": "usr_123",
          "name": "Jane Doe",
          "avatarUrl": "https://..."
        },
        "origin": "North Campus Gate 1",
        "destination": "Airport Terminal 3",
        "departureTime": "2026-11-10T06:00:00.000Z",
        "totalSeats": 4,
        "availableSeats": 3,
        "estimatedFare": 80.00,
        "status": "OPEN",
        "passengers": [
          {
            "id": "rp_1",
            "userId": "usr_123",
            "user": { "id": "usr_123", "name": "Jane Doe" },
            "joinedAt": "2026-11-01T12:00:00.000Z"
          }
        ]
      }
    ]
  }
  ```

#### `POST /api/rides/:id/join`
Joins an open ride as a passenger. Decrements availableSeats.
- **Auth**: Required
- **Response `200 OK`**:
  ```json
  {
    "data": {
      "id": "ride_701",
      "availableSeats": 2,
      "joined": true
    }
  }
  ```

#### `POST /api/rides/:id/leave`
Leaves a joined ride. Increments availableSeats.
- **Auth**: Required
- **Response `200 OK`**:
  ```json
  {
    "data": {
      "id": "ride_701",
      "availableSeats": 3,
      "left": true
    }
  }
  ```

#### `PATCH /api/rides/:id/status`
Updates status of a ride (`OPEN`, `FULL`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`).
- **Auth**: Required (Ride creator or Admin)
- **Request Body**:
  ```json
  {
    "status": "COMPLETED"
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "data": {
      "id": "ride_701",
      "status": "COMPLETED",
      "updatedAt": "2026-11-10T07:30:00.000Z"
    }
  }
  ```

#### `GET /api/rides/:id/fare-split`
Calculates real-time equal split of estimatedFare among all confirmed passengers and creator.
- **Auth**: Required
- **Response `200 OK`**:
  ```json
  {
    "data": {
      "rideId": "ride_701",
      "totalFare": 80.00,
      "passengerCount": 2,
      "farePerPerson": 40.00,
      "participants": [
        {
          "userId": "usr_123",
          "name": "Jane Doe",
          "amount": 40.00
        },
        {
          "userId": "usr_456",
          "name": "Alex Smith",
          "amount": 40.00
        }
      ]
    }
  }
  ```

---

### 3.7 In-App Chat

#### `GET /api/conversations`
Retrieves all conversation threads for the current authenticated user.
- **Auth**: Required
- **Response `200 OK`**:
  ```json
  {
    "data": [
      {
        "id": "conv_001",
        "participantIds": ["usr_123", "usr_456"],
        "participants": [
          { "id": "usr_456", "name": "Alex Smith", "avatarUrl": "https://..." }
        ],
        "lastMessage": {
          "id": "msg_901",
          "conversationId": "conv_001",
          "senderId": "usr_456",
          "content": "Are you still offering the ride?",
          "createdAt": "2026-11-01T15:30:00.000Z"
        },
        "updatedAt": "2026-11-01T15:30:00.000Z"
      }
    ]
  }
  ```

#### `POST /api/conversations`
Initiates or retrieves an existing direct conversation with another user.
- **Auth**: Required
- **Request Body**:
  ```json
  {
    "recipientId": "usr_456"
  }
  ```
- **Response `201 Created` (or `200 OK` if exists)**:
  ```json
  {
    "data": {
      "id": "conv_001",
      "participantIds": ["usr_123", "usr_456"],
      "createdAt": "2026-11-01T15:00:00.000Z"
    }
  }
  ```

#### `GET /api/conversations/:id/messages`
Retrieves message history for a conversation.
- **Auth**: Required (Must be a conversation participant)
- **Query Params**: `?limit=50&before=2026-11-01T15:30:00.000Z`
- **Response `200 OK`**:
  ```json
  {
    "data": [
      {
        "id": "msg_901",
        "conversationId": "conv_001",
        "senderId": "usr_456",
        "sender": {
          "id": "usr_456",
          "name": "Alex Smith"
        },
        "content": "Are you still offering the ride?",
        "createdAt": "2026-11-01T15:30:00.000Z"
      }
    ]
  }
  ```

#### `POST /api/conversations/:id/messages`
Sends a message in a conversation. Also emits a real-time `message:new` event via Socket.io.
- **Auth**: Required
- **Request Body**:
  ```json
  {
    "content": "Yes, leaving tomorrow at 6 AM!"
  }
  ```
- **Response `201 Created`**:
  ```json
  {
    "data": {
      "id": "msg_902",
      "conversationId": "conv_001",
      "senderId": "usr_123",
      "content": "Yes, leaving tomorrow at 6 AM!",
      "createdAt": "2026-11-01T15:32:00.000Z"
    }
  }
  ```

---

### 3.8 Notifications

#### `GET /api/notifications`
Fetches user notifications.
- **Auth**: Required
- **Response `200 OK`**:
  ```json
  {
    "data": [
      {
        "id": "notif_001",
        "userId": "usr_123",
        "title": "Possible Item Match!",
        "message": "A found item matching 'AirPods' was recently posted.",
        "type": "MATCH",
        "link": "/lost-found/found/found_101",
        "isRead": false,
        "createdAt": "2026-11-01T15:15:00.000Z"
      }
    ]
  }
  ```

#### `PATCH /api/notifications/:id/read`
Marks a notification as read.
- **Auth**: Required
- **Response `200 OK`**:
  ```json
  {
    "data": {
      "id": "notif_001",
      "isRead": true
    }
  }
  ```

---

### 3.9 Reports & Admin Panel

#### `POST /api/reports`
Submits a moderation report against any item, ride, or user.
- **Auth**: Required
- **Request Body**:
  ```json
  {
    "targetType": "LISTING",
    "targetId": "list_301",
    "reason": "Scam / suspected counterfeit",
    "details": "Price is suspicious and photos are from Google images."
  }
  ```
- **Response `201 Created`**:
  ```json
  {
    "data": {
      "id": "rep_801",
      "reporterId": "usr_123",
      "targetType": "LISTING",
      "targetId": "list_301",
      "reason": "Scam / suspected counterfeit",
      "status": "PENDING",
      "createdAt": "2026-11-01T16:00:00.000Z"
    }
  }
  ```

#### `GET /api/admin/reports`
Fetches all open or filtered moderation reports.
- **Auth**: Required (Admin only)
- **Query Params**: `?status=PENDING&targetType=LISTING`
- **Response `200 OK`**:
  ```json
  {
    "data": [
      {
        "id": "rep_801",
        "reporterId": "usr_123",
        "reporter": {
          "id": "usr_123",
          "name": "Jane Doe",
          "email": "student@campus.edu"
        },
        "targetType": "LISTING",
        "targetId": "list_301",
        "reason": "Scam / suspected counterfeit",
        "details": "Price is suspicious and photos are from Google images.",
        "status": "PENDING",
        "createdAt": "2026-11-01T16:00:00.000Z"
      }
    ]
  }
  ```

#### `DELETE /api/admin/posts/:type/:id`
Admin moderation deletion of offending content.
- **Auth**: Required (Admin only)
- **Path Params**:
  - `type`: `lost` | `found` | `listing` | `ride`
  - `id`: The UUID of the post
- **Response `200 OK`**:
  ```json
  {
    "data": {
      "type": "listing",
      "id": "list_301",
      "deleted": true
    }
  }
  ```

#### `PATCH /api/admin/users/:id/ban`
Bans or unbans a user account from the platform.
- **Auth**: Required (Admin only)
- **Request Body**:
  ```json
  {
    "isBanned": true,
    "reason": "Repeated policy violations"
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "data": {
      "id": "usr_999",
      "isBanned": true,
      "updatedAt": "2026-11-01T16:30:00.000Z"
    }
  }
  ```

---

## 4. Socket.io Real-Time Events

Websocket connection URL: `ws://<host>:<port>` with handshake auth:
```javascript
const socket = io(SERVER_URL, {
  auth: {
    token: "<jwt_token>"
  }
});
```

### 4.1 Server to Client Events

#### `message:new`
Emitted to conversation participants when a new message is posted.
- **Payload**:
  ```json
  {
    "id": "msg_902",
    "conversationId": "conv_001",
    "senderId": "usr_123",
    "sender": {
      "id": "usr_123",
      "name": "Jane Doe",
      "avatarUrl": "https://..."
    },
    "content": "Yes, leaving tomorrow at 6 AM!",
    "createdAt": "2026-11-01T15:32:00.000Z"
  }
  ```

#### `notification:new`
Emitted directly to a specific user's private socket room (`user:<userId>`).
- **Payload**:
  ```json
  {
    "id": "notif_001",
    "userId": "usr_123",
    "title": "Possible Item Match!",
    "message": "A found item matching 'AirPods' was recently posted.",
    "type": "MATCH",
    "link": "/lost-found/found/found_101",
    "isRead": false,
    "createdAt": "2026-11-01T15:15:00.000Z"
  }
  ```

#### `ride:updated`
Emitted to ride subscribers (`ride:<rideId>`) whenever seats, status, or passengers change.
- **Payload**:
  ```json
  {
    "id": "ride_701",
    "creatorId": "usr_123",
    "origin": "North Campus Gate 1",
    "destination": "Airport Terminal 3",
    "departureTime": "2026-11-10T06:00:00.000Z",
    "totalSeats": 4,
    "availableSeats": 2,
    "estimatedFare": 80.00,
    "status": "OPEN",
    "passengers": [
      { "userId": "usr_123", "joinedAt": "2026-11-01T12:00:00.000Z" },
      { "userId": "usr_456", "joinedAt": "2026-11-01T15:30:00.000Z" }
    ],
    "updatedAt": "2026-11-01T15:30:00.000Z"
  }
  ```

### 4.2 Client to Server Events

- `chat:join`: `(conversationId: string)` - Join conversation room
- `chat:leave`: `(conversationId: string)` - Leave conversation room
- `ride:subscribe`: `(rideId: string)` - Subscribe to real-time seat and status updates
- `ride:unsubscribe`: `(rideId: string)` - Unsubscribe from updates

---

## 5. TypeScript Shared Types

For direct import and full TypeScript definitions corresponding to this contract, refer to:
[`/docs/types.ts`](./types.ts).

