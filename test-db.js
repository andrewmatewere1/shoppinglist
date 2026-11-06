const dns = require('dns');
// Resolve MongoDB SRV records reliably across all network providers
dns.setServers(['8.8.8.8', '1.1.1.1']);

require('dotenv').config();
const mongoose = require('mongoose');

const uri = process.env.MONGODB_URI;

if (!uri) {
  console.error('Error: MONGODB_URI is not set in .env');
  process.exit(1);
}

if (uri.includes('YOUR_PASSWORD_HERE') || uri.includes('<Authentication>') || uri.includes('<password>')) {
  console.error('Error: MONGODB_URI still contains a placeholder password. Please replace it with your actual password in .env.');
  process.exit(1);
}

console.log('Testing connection to MongoDB...');
console.log('URI format:', uri.replace(/:([^:@]+)@/, ':****@'));

mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 })
  .then(() => {
    console.log(' Connection successful! MongoDB is ready and authenticated.');
    return mongoose.disconnect();
  })
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error(' Connection failed:');
    if (err.message.includes('bad auth') || err.message.includes('Authentication failed')) {
      console.error('-> Authentication failed: Check your username and password.');
    } else if (err.message.includes('ETIMEDOUT') || err.message.includes('Server selection timed out')) {
      console.error('-> Connection timed out: Check your Network Access / IP Whitelist in MongoDB Atlas.');
    } else {
      console.error('->', err.message);
    }
    process.exit(1);
  });
