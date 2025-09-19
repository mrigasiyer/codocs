const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 20,
    },
    password: {
      type: String,
      required: function () {
        return !this.googleId; // Only required if not using Google OAuth
      },
    },
    displayName: {
      type: String,
      required: true,
      trim: true,
    },
    // Google OAuth fields
    googleId: {
      type: String,
      unique: true,
      sparse: true, // Allows multiple null values
    },
    googleEmail: {
      type: String,
      lowercase: true,
      trim: true,
    },
    profilePicture: {
      type: String,
      trim: true,
    },
    authMethod: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving (only for local auth users)
userSchema.pre("save", async function (next) {
  if (!this.isModified("password") || this.authMethod !== "local")
    return next();

  // Validate password length before hashing
  if (this.password && this.password.length < 6) {
    return next(new Error("Password must be at least 6 characters long"));
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
