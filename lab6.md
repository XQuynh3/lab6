Lab6_Exercises — JWT nâng cao & RabbitMQ (2 Producers – 1 Consumer)
📌 Mục lục

Tổng quan yêu cầu

Biến môi trường cần thiết (.env)

Cấu trúc thư mục đề xuất

Database schema (MySQL)

JWT mở rộng — thêm loginTime & loginAddress vào Token + DB

Phân quyền (admin/user) — role-based access

Endpoint /admin — chặn user thường

RabbitMQ — 2 Producers + 1 Consumer (MongoDB storage)

Chạy thử & ví dụ request/response

Gợi ý middleware & best practices

1️⃣ Tổng quan yêu cầu

Dựa trên Lab6 (JWT & RabbitMQ) thực hiện các yêu cầu sau:

Task	Yêu cầu
Exercise 1	Lưu thêm loginTime + loginAddress vào JWT & DB khi user login
Exercise 2	Thêm role (admin, user) → Lưu DB & JWT → Tạo /admin và chặn user truy cập
Exercise 3	Tạo hệ thống RabbitMQ với 2 producers gửi message và 1 consumer nhận

Công nghệ sử dụng:

Node.js + Express

MySQL (JWT phần)

MongoDB (Message Queue phần)

RabbitMQ (Message Queue core)

2️⃣ Biến môi trường cần thiết .env
PORT=3000

# JWT
JWT_SECRET=your_secret_key

# MySQL
DB_HOST=localhost
DB_PORT=3306
DB_NAME=jwt_auth
DB_USER=root
DB_PASSWORD=yourpassword

# RabbitMQ
RABBITMQ_URL=amqp://localhost

# MongoDB
MONGO_URI=mongodb://127.0.0.1:27017/lab6_messages

3️⃣ Cấu trúc thư mục đề xuất
Lab6/
├─ .env
├─ app.js
├─ package.json
│
├─ db/
│  ├─ mysql.js
│  └─ mongo.js
│
├─ auth/
│  ├─ jwt.middleware.js
│  └─ admin.middleware.js
│
├─ routes/
│  ├─ auth.routes.js
│  ├─ admin.routes.js
│  └─ mq.routes.js
│
├─ rabbitmq/
│  ├─ producer1.js
│  ├─ producer2.js
│  └─ consumer.js
│
└─ models/
   ├─ user.model.sql.md   # lưu schema & ghi chú
   └─ message.model.js    # MongoDB schema for consumer

4️⃣ Database schema (MySQL)
CREATE DATABASE IF NOT EXISTS jwt_auth;
USE jwt_auth;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin','user') DEFAULT 'user'
);

CREATE TABLE tokens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  token VARCHAR(500) NOT NULL,
  login_time DATETIME,
  login_address VARCHAR(255),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

5️⃣ Exercise 1 — JWT mở rộng
📍 Thêm loginTime & loginAddress khi login
const payload = {
  id: user.id,
  username: user.username,
  role: user.role,
  loginTime: new Date(),
  loginAddress: req.ip
};

const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" });

await db.execute(
  "INSERT INTO tokens (user_id, token, login_time, login_address) VALUES (?, ?, ?, ?)",
  [user.id, token, payload.loginTime, payload.loginAddress]
);

📍 Kiểm tra token hợp lệ
function authenticateToken(req,res,next){
  const authHeader = req.headers.authorization;
  if(!authHeader) return res.status(401).json({message:"No token"});

  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.JWT_SECRET, (err, user)=>{
    if(err) return res.status(403).json({message:"Invalid token"});
    req.user = user;
    next();
  });
}

6️⃣ Exercise 2 — Phân quyền (Role-based Access)
📍 Middleware chặn user thường
function authorizeAdmin(req, res, next) {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Access denied (Admins only)" });
  }
  next();
}

📍 Payload JWT phải có role
const payload = { id:user.id, username:user.username, role:user.role }; // required

7️⃣ Endpoint /admin
app.get("/admin",
  authenticateToken,
  authorizeAdmin,
  (req,res)=> res.json({message:"Welcome, Admin!", user:req.user})
);


❌ Khi user role = user
→ Response:

{ "message": "Access denied (Admins only)" }

8️⃣ Exercise 3 — RabbitMQ (2P → 1C)
📍 MongoDB Model
const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  source: String,
  content: String,
  receivedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Message", messageSchema);

📍 Producer 1
const amqp = require("amqplib");

async function start(){
  const conn = await amqp.connect(process.env.RABBITMQ_URL);
  const ch = await conn.createChannel();
  const queue = "lab6_queue";
  await ch.assertQueue(queue);

  setInterval(()=>{
    const msg = "Hello from Producer 1";
    ch.sendToQueue(queue, Buffer.from(msg));
    console.log("Sent:", msg);
  },3000);
}
start();

📍 Producer 2
setInterval(()=>{
  const msg = "Message from Producer 2 -> " + new Date().toISOString();
  ch.sendToQueue(queue, Buffer.from(msg));
  console.log("Sent:", msg);
},5000);

📍 Consumer
const Message = require("../models/message.model");

ch.consume(queue, async(msg)=>{
  const content = msg.content.toString();
  console.log("Received:", content);

  await Message.create({
    source: "RabbitMQ",
    content
  });

  ch.ack(msg);
});


🎯 Kết quả:

Producer1 gửi mỗi 3s

Producer2 gửi mỗi 5s

Consumer lưu vào MongoDB

9️⃣ Hướng dẫn chạy & test
🔧 Cài đặt
npm install express mysql2 mongoose amqplib jsonwebtoken dotenv

▶️ Chạy từng phần:
node app.js           # chạy API (JWT)
node rabbitmq/producer1.js
node rabbitmq/producer2.js
node rabbitmq/consumer.js

🧪 Test JWT

Đăng nhập

curl -X POST http://localhost:3000/login \
-H "Content-Type: application/json" \
-d '{"username":"admin","password":"123"}'


Trả về:

{
 "token":"<JWT>",
 "role":"admin",
 "loginTime":"2025-02-01T12:00:00.000Z",
 "loginAddress":"::1"
}


Test Admin

curl http://localhost:3000/admin -H "Authorization: Bearer <JWT>"

🔟 Gợi ý Middleware / Best Practices

Tự động revoke token khi user logout

Rate limit login endpoint

Lưu user-agent để theo dõi device

Tách services/ để chia code rõ ràng hơn