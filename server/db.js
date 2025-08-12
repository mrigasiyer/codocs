const mongoose = require("mongoose");
require("dotenv").config();



const uri = process.env.MONGO_URI;

const connectDB = async () => {
  try {
    console.log("🔗 Connecting to MongoDB...");
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("✅ MongoDB connected");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
  }
};

module.exports = connectDB;
