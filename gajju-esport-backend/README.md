# Gujju Esports Backend

Registration + Knockout Bracket system for gajju-esport website.

## Kya banaya hai

- **Registrations API** — website ke registration form ka data MongoDB mein save hota hai
- **Admin API** — password-protected (JWT). Registrations verify/reject karo, bracket generate karo
- **Bracket API** — verified teams se auto-random ya manual knockout bracket banao, match winners set karo (winner automatically agle round mein chala jata hai)

## Local Setup

```bash
npm install
cp .env.example .env
```

`.env` file kholo aur ye 4 cheezein bharo:

- `MONGODB_URI` — MongoDB Atlas se connection string (Database > Connect > Drivers)
- `JWT_SECRET` — koi bhi lamba random string (jaise password generator se)
- `ADMIN_PASSWORD` — jo password se aap admin panel access karoge
- `PORT` — 5000 default rakh sakte ho

```bash
npm run dev
```

Server `http://localhost:5000` par chalega.

## Deploy on Render (jaisa StudyForge/CineMix mein kiya tha)

1. Is `gajju-esport-backend` folder ko ek naye GitHub repo mein push karo
2. Render.com par **New > Web Service** banao, us repo ko connect karo
3. Build Command: `npm install`
4. Start Command: `npm start`
5. Environment tab mein wahi 4 variables (`MONGODB_URI`, `JWT_SECRET`, `ADMIN_PASSWORD`, `PORT`) add karo
6. Deploy hone ke baad aapko ek URL milega jaise `https://gajju-esport-backend.onrender.com`

Wahi URL frontend (Netlify) mein `API_BASE` variable mein daalna hai.

## API Endpoints

### Public (koi bhi call kar sakta hai)
- `POST /api/registrations` — naya registration submit karo
  ```json
  { "name": "Team Alpha", "gameUid": "12345", "contact": "9999999999", "game": "bgmi", "tier": "tier1", "rankOrTH": "Gold", "utr": "123456789012" }
  ```
- `GET /api/bracket/:game/:tier` — us game/tier ka current bracket dekho (website par dikhane ke liye)

### Admin (pehle login karke token lena hoga)
- `POST /api/admin/login` — `{ "password": "..." }` → `{ "token": "..." }`
- `GET /api/registrations` — sab registrations list (header: `Authorization: Bearer <token>`)
- `PATCH /api/registrations/:id/status` — `{ "status": "verified" }`
- `DELETE /api/registrations/:id`
- `POST /api/bracket/generate` — `{ "game": "bgmi", "tier": "tier1", "mode": "random" }` (verified registrations se auto bracket banata hai)
  - Manual ke liye: `{ "game": "bgmi", "tier": "tier1", "mode": "manual", "teamOrder": ["regId1", "regId2", ...] }`
- `PATCH /api/bracket/:game/:tier/match/:matchId` — `{ "winnerName": "Team Alpha", "winnerId": "regId1" }`
- `DELETE /api/bracket/:game/:tier` — bracket reset/regenerate karne ke liye

## Bracket kaise kaam karta hai

- Teams ki sankhya power-of-2 nahi hai (jaise 5, 6, 7) toh baaki slots "bye" ban jate hain — us team ko automatically agle round mein bhej diya jata hai bina match khele
- Jab admin kisi match ka winner set karta hai, wo automatically agle round ke sahi slot mein chala jata hai
- Har (game + tier) combination ka apna alag bracket hota hai — jaise BGMI Tier 1 aur BGMI Tier 2 ke alag-alag brackets honge
