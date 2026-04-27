// backend/list-users.js
const mongoose = require('mongoose');
require('dotenv').config();

async function listUsers() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Get the raw collection
        const db = mongoose.connection.db;
        const users = await db.collection('users').find({}).toArray();

        console.log(`\n📊 Total users: ${users.length}`);
        console.log('\n📋 Users in database:');
        users.forEach((user, index) => {
            console.log(`\n${index + 1}. Email: ${user.email}`);
            console.log(`   ID: ${user._id}`);
            console.log(`   Name: ${user.name}`);
            console.log(`   Password length: ${user.password ? user.password.length : 'N/A'}`);
            console.log(`   Hashed: ${user.password && user.password.length > 20 ? '✅' : '❌'}`);
        });

        await mongoose.disconnect();
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

listUsers();