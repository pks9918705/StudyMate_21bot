// code for mongoose connection

// db.js
const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        // Replace 'your_mongodb_uri' with your actual MongoDB connection string
        const conn = await mongoose.connect(`${process.env.MONGODB_KEY}`, {
            // useNewUrlParser: true,
            // useUnifiedTopology: true,
            serverSelectionTimeoutMS: 50000, // Increase timeout to 50 seconds

        });

        console.log(`MongoDB Connected`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;


// pks9918705

// p29rSzcxNQDSriv2