const amqp = require('amqplib');
const mongo = require('../db/mongo');
const Message = require('../models/message.model');
require('dotenv').config();

async function start(){
  await mongo.connect();
  const conn = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost');
  const ch = await conn.createChannel();
  const queue = 'lab6_queue';
  await ch.assertQueue(queue, { durable: false });

  console.log('Consumer waiting for messages...');
  ch.consume(queue, async (msg) => {
    if (msg !== null) {
      const content = msg.content.toString();
      console.log('Received:', content);
      try {
        await Message.create({ source: 'RabbitMQ', content });
      } catch (err) {
        console.error('Save to Mongo failed:', err);
      }
      ch.ack(msg);
    }
  });
}

start().catch(err=>{
  console.error('Consumer error', err);
  process.exit(1);
});
