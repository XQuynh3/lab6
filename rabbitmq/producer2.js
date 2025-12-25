const amqp = require('amqplib');
require('dotenv').config();

async function start(){
  const conn = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost');
  const ch = await conn.createChannel();
  const queue = 'lab6_queue';
  await ch.assertQueue(queue, { durable: false });

  setInterval(()=>{
    const msg = `Message from Producer 2 -> ${new Date().toISOString()}`;
    ch.sendToQueue(queue, Buffer.from(msg));
    console.log('Sent:', msg);
  },5000);
}

start().catch(err=>{
  console.error('Producer2 error', err);
  process.exit(1);
});
