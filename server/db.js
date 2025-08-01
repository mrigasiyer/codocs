const mongoose = require("mongoose");


const connectDB = async () => {
  try {
    console.log("🔗 Connecting to MongoDB...");
    await mongoose.connect("mongodb://localhost:27017/codocs", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log("✅ MongoDB connected");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
  }
};

module.exports = connectDB;
