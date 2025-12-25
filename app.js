require('dotenv').config();
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
const mysql = require('./db/mysql');
const mongo = require('./db/mongo');
const authRoutes = require('./routes/auth.routes');
const adminRoutes = require('./routes/admin.routes');

app.use(express.json());

app.use('/', authRoutes);
app.use('/', adminRoutes);

if (process.argv.includes('--setup')) {
  // run setup then exit
  (async () => {
    try {
      await require('./routes/auth.routes').setupDb();
      console.log('Setup completed.');
      process.exit(0);
    } catch (err) {
      console.error('Setup failed:', err);
      process.exit(1);
    }
  })();
} else {
  // connect mongo and start server
  mongo.connect().then(()=>{
    app.listen(port, ()=> console.log(`App listening on ${port}`));
  }).catch(err=>{
    console.error('Mongo connection failed:', err);
    app.listen(port, ()=> console.log(`App listening on ${port} (Mongo connection failed)`));
  });
}

module.exports = app;
