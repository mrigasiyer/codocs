const express = require("express");
const jwt = require("jsonwebtoken");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/User");
const router = express.Router();

// JWT secret (we'll move this to environment variables later)
const JWT_SECRET = "your-secret-key-for-now";

// Configure Passport
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID || "your-google-client-id",
      clientSecret:
        process.env.GOOGLE_CLIENT_SECRET || "your-google-client-secret",
      callbackURL: "/api/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user already exists with this Google ID
        let user = await User.findOne({ googleId: profile.id });

        if (user) {
          return done(null, user);
        }

        // Check if user exists with same email
        user = await User.findOne({ email: profile.emails[0].value });

        if (user) {
          // Link Google account to existing user
          user.googleId = profile.id;
          user.googleEmail = profile.emails[0].value;
          user.profilePicture = profile.photos[0]?.value;
          user.authMethod = "google";
          await user.save();
          return done(null, user);
        }

        // Create new user
        const username = profile.emails[0].value.split("@")[0];
        let uniqueUsername = username;
        let counter = 1;

        // Ensure username is unique
        while (await User.findOne({ username: uniqueUsername })) {
          uniqueUsername = `${username}${counter}`;
          counter++;
        }

        user = new User({
          email: profile.emails[0].value,
          username: uniqueUsername,
          displayName: profile.displayName,
          googleId: profile.id,
          googleEmail: profile.emails[0].value,
          profilePicture: profile.photos[0]?.value,
          authMethod: "google",
        });

        await user.save();
        done(null, user);
      } catch (error) {
        done(error, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Register new user
router.post("/register", async (req, res) => {
  try {
    const { email, username, password, displayName } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      return res.status(400).json({
        error: "User with this email or username already exists",
      });
    }

    // Create new user
    const user = new User({
      email,
      username,
      password,
      displayName,
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(201).json({
      message: "User created successfully",
      token,
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Error creating user" });
  }
});

// Login user
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Generate JWT token
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Error logging in" });
  }
});

// Google OAuth routes
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/login?error=google_auth_failed",
  }),
  async (req, res) => {
    try {
      // Generate JWT token
      const token = jwt.sign({ userId: req.user._id }, JWT_SECRET, {
        expiresIn: "7d",
      });

      // Redirect to frontend with token
      const redirectUrl = `${
        process.env.FRONTEND_URL || "http://localhost:5173"
      }?token=${token}&user=${encodeURIComponent(
        JSON.stringify({
          id: req.user._id,
          email: req.user.email,
          username: req.user.username,
          displayName: req.user.displayName,
          profilePicture: req.user.profilePicture,
          authMethod: req.user.authMethod,
        })
      )}`;

      res.redirect(redirectUrl);
    } catch (error) {
      console.error("Google OAuth callback error:", error);
      res.redirect(
        `${
          process.env.FRONTEND_URL || "http://localhost:5173"
        }/login?error=oauth_error`
      );
    }
  }
);

module.exports = router;
