Lab6 — JWT advanced & RabbitMQ

Quick start:
1. Copy `.env.sample` to `.env` and set values
2. Install deps: `npm install`
3. Setup DB and seed users: `npm run setup` (or `node app.js --setup`)
4. Start app: `npm start`
5. Start RabbitMQ pieces (in separate terminals):
   - `npm run producer1`
   - `npm run producer2`
   - `npm run consumer`

Endpoints:
- POST /login { username, password } -> returns token, role, loginTime, loginAddress
- GET /profile -> protected, returns token payload
- GET /admin -> protected, admin-only

Seeded users:
- admin / 123  (role: admin)
- user  / 123  (role: user)

Notes:
- The login stores token and login metadata in MySQL `tokens` table.
- Consumer saves received messages to MongoDB `messages` collection.
