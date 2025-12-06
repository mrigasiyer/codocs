const express = require("express");
const http = require("http");
const cors = require("cors");
const session = require("express-session");
const passport = require("passport");
const { Server } = require("socket.io");
const WebSocket = require("ws");
const { setupWSConnection } = require("y-websocket/bin/utils");
const Y = require("yjs");
const jwt = require("jsonwebtoken");
const connectDB = require("./db");
const YDocModel = require("./models/YDoc");
const Room = require("./models/Room");
const User = require("./models/User");
const Message = require("./models/Chat");

// Import auth routes
const authRouter = require("./routes/auth");

// JWT secret (should match auth.js)
const JWT_SECRET = "your-secret-key-for-now";

// Authentication middleware
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId).select("-password");
    if (!user) {
      return res.status(401).json({ error: "Invalid token" });
    }
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ error: "Invalid or expired token" });
  }
};

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Connect to MongoDB
connectDB();

// Configure session middleware
app.use(
  session({
    secret: process.env.SESSION_SECRET || "your-session-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Add auth routes
app.use("/api/auth", authRouter);

// Get rooms accessible to the authenticated user
app.get("/api/rooms", authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;

    const rooms = await Room.find({
      $or: [{ owner: userId }, { "sharedWith.user": userId }],
    })
      .populate("owner", "username displayName")
      .populate("sharedWith.user", "username displayName")
      .sort({ createdAt: -1 });

    res.json(rooms);
  } catch (err) {
    console.error("Error fetching rooms:", err);
    res.status(500).json({ error: "Failed to fetch rooms" });
  }
});

// Create a new room
app.post("/api/rooms", authenticateToken, async (req, res) => {
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ error: "Room name is required" });
  }

  try {
    // Check if room name already exists
    const existingRoom = await Room.findOne({ name });
    if (existingRoom) {
      return res.status(400).json({ error: "Room name already exists" });
    }

    const room = await Room.create({
      name,
      owner: req.user._id,
    });

    await room.populate("owner", "username displayName");
    res.status(201).json(room);
  } catch (err) {
    console.error("Error creating room:", err);
    res.status(500).json({ error: "Error creating room" });
  }
});

// Rename a room (owner only)
app.patch("/api/rooms/:roomName", authenticateToken, async (req, res) => {
  try {
    const { roomName } = req.params;
    const { newName } = req.body;

    if (!newName || !newName.trim()) {
      return res.status(400).json({ error: "New name is required" });
    }

    // Check for name conflict
    const existing = await Room.findOne({ name: newName.trim() });
    if (existing) {
      return res
        .status(400)
        .json({ error: "A room with that name already exists" });
    }

    const room = await Room.findOne({ name: roomName });
    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }

    // Only owner can rename
    if (room.owner.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ error: "Only the owner can rename this room" });
    }

    const oldName = room.name;
    room.name = newName.trim();
    await room.save();

    // Update YDoc key if exists
    try {
      const ydoc = await YDocModel.findOne({ room: oldName });
      if (ydoc) {
        ydoc.room = room.name;
        await ydoc.save();
      }
    } catch (e) {
      console.warn("Failed to update YDoc on rename", e);
    }

    // Update chat messages roomName
    try {
      await Message.updateMany(
        { roomName: oldName },
        { $set: { roomName: room.name } }
      );
    } catch (e) {
      console.warn("Failed to update messages on rename", e);
    }

    await room.populate("owner", "username displayName");
    await room.populate("sharedWith.user", "username displayName");
    return res.json({ message: "Room renamed", room });
  } catch (err) {
    console.error("Error renaming room:", err);
    return res.status(500).json({ error: "Error renaming room" });
  }
});

// Delete a room (owner only)
app.delete("/api/rooms/:roomName", authenticateToken, async (req, res) => {
  try {
    const { roomName } = req.params;
    const room = await Room.findOne({ name: roomName });
    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }

    // Only owner can delete
    if (room.owner.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ error: "Only the owner can delete this room" });
    }

    // Delete room
    await Room.deleteOne({ _id: room._id });

    // Delete YDoc state
    try {
      await YDocModel.deleteOne({ room: room.name });
    } catch (e) {
      console.warn("Failed to delete YDoc on room delete", e);
    }

    // Delete chat messages
    try {
      await Message.deleteMany({ roomName: room.name });
    } catch (e) {
      console.warn("Failed to delete messages on room delete", e);
    }

    return res.json({ message: "Room deleted" });
  } catch (err) {
    console.error("Error deleting room:", err);
    return res.status(500).json({ error: "Error deleting room" });
  }
});

// Share a room with another user
app.post("/api/rooms/:roomName/share", authenticateToken, async (req, res) => {
  const { roomName } = req.params;
  const { username } = req.body;

  if (!username) {
    return res.status(400).json({ error: "Username is required" });
  }

  try {
    const room = await Room.findOne({ name: roomName });
    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }

    // Check if user is the owner
    if (room.owner.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ error: "Only room owner can share the room" });
    }

    // Find the user to share with
    const userToShare = await User.findOne({ username });
    if (!userToShare) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if already shared
    const alreadyShared = room.sharedWith.some(
      (share) =>
        share.user && share.user.toString() === userToShare._id.toString()
    );

    if (alreadyShared) {
      return res
        .status(400)
        .json({ error: "Room already shared with this user" });
    }

    // Add user to shared list
    room.sharedWith.push({
      user: userToShare._id,
      sharedBy: req.user._id,
    });

    await room.save();
    await room.populate("sharedWith.user", "username displayName");

    res.json({ message: "Room shared successfully", room });
  } catch (err) {
    console.error("Error sharing room:", err);
    res.status(500).json({ error: "Error sharing room" });
  }
});

// Remove access from a user
app.delete(
  "/api/rooms/:roomId/share/:userId",
  authenticateToken,
  async (req, res) => {
    const { roomId, userId } = req.params;

    try {
      const room = await Room.findById(roomId);
      if (!room) {
        return res.status(404).json({ error: "Room not found" });
      }

      // Check if user is the owner
      if (room.owner.toString() !== req.user._id.toString()) {
        return res
          .status(403)
          .json({ error: "Only room owner can remove access" });
      }

      // Remove user from shared list
      room.sharedWith = room.sharedWith.filter(
        (share) => share.user.toString() !== userId
      );

      await room.save();
      res.json({ message: "Access removed successfully" });
    } catch (err) {
      console.error("Error removing access:", err);
      res.status(500).json({ error: "Error removing access" });
    }
  }
);

// Search for users by username
app.get("/api/users/search", authenticateToken, async (req, res) => {
  try {
    const { query } = req.query;

    if (!query || query.trim().length < 1) {
      return res.json([]);
    }

    // Search for users by username or displayName, case-insensitive
    // Exclude the current user from results
    const users = await User.find({
      _id: { $ne: req.user._id },
      $or: [
        { username: { $regex: query, $options: "i" } },
        { displayName: { $regex: query, $options: "i" } },
      ],
    })
      .select("username displayName")
      .limit(5); // Limit to 5 results

    res.json(users);
  } catch (err) {
    console.error("Error searching users:", err);
    res.status(500).json({ error: "Error searching users" });
  }
});

// Check if user has access to a specific room
app.get("/api/rooms/:roomName/access", authenticateToken, async (req, res) => {
  const { roomName } = req.params;

  try {
    const room = await Room.findOne({ name: roomName })
      .populate("owner", "username displayName _id")
      .populate("sharedWith.user", "username displayName _id");
    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }

    const userId = req.user._id.toString();
    const ownerId =
      room.owner && room.owner._id
        ? room.owner._id.toString()
        : room.owner.toString();
    const hasAccess =
      ownerId === userId ||
      room.sharedWith.some((share) => {
        if (!share.user) return false; // Skip if user is null
        const sharedUserId = share.user._id
          ? share.user._id.toString()
          : share.user.toString();
        return sharedUserId === userId;
      });

    res.json({ hasAccess, room: hasAccess ? room : null });
  } catch (err) {
    console.error("Error checking access:", err);
    res.status(500).json({ error: "Error checking access" });
  }
});

// Chat API endpoints

// Get chat messages for a room
app.get(
  "/api/rooms/:roomName/messages",
  authenticateToken,
  async (req, res) => {
    try {
      const { roomName } = req.params;
      const userId = req.user._id;

      // Check if user has access to this room
      const room = await Room.findOne({ name: roomName })
        .populate("owner", "username displayName")
        .populate("sharedWith.user", "username displayName");

      if (!room) {
        return res.status(404).json({ error: "Room not found" });
      }

      const ownerId = room.owner._id.toString();
      const hasAccess =
        ownerId === userId.toString() ||
        room.sharedWith.some((share) => {
          if (!share.user) return false; // Skip if user is null
          const sharedUserId = share.user._id
            ? share.user._id.toString()
            : share.user.toString();
          return sharedUserId === userId.toString();
        });

      if (!hasAccess) {
        return res.status(403).json({ error: "Access denied" });
      }

      // Get messages for this room, ordered by timestamp
      const messages = await Message.find({ roomName })
        .populate("user", "username displayName")
        .sort({ timestamp: 1 })
        .limit(100); // Limit to last 100 messages for performance

      res.json(messages);
    } catch (err) {
      console.error("Error fetching messages:", err);
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  }
);

// Send a new message to a room
app.post(
  "/api/rooms/:roomName/messages",
  authenticateToken,
  async (req, res) => {
    try {
      const { roomName } = req.params;
      const { message } = req.body;
      const userId = req.user._id;

      if (!message || !message.trim()) {
        return res.status(400).json({ error: "Message is required" });
      }

      // Check if user has access to this room
      const room = await Room.findOne({ name: roomName })
        .populate("owner", "username displayName")
        .populate("sharedWith.user", "username displayName");

      if (!room) {
        return res.status(404).json({ error: "Room not found" });
      }

      const ownerId = room.owner._id.toString();
      const hasAccess =
        ownerId === userId.toString() ||
        room.sharedWith.some((share) => {
          if (!share.user) return false; // Skip if user is null
          const sharedUserId = share.user._id
            ? share.user._id.toString()
            : share.user.toString();
          return sharedUserId === userId.toString();
        });

      if (!hasAccess) {
        return res.status(403).json({ error: "Access denied" });
      }

      // Create new message
      const newMessage = new Message({
        roomName,
        user: userId,
        username: req.user.username,
        displayName: req.user.displayName,
        message: message.trim(),
      });

      await newMessage.save();

      // Populate the user data for the response
      await newMessage.populate("user", "username displayName");

      // Emit the new message to all connected clients in this room
      io.to(roomName).emit("newMessage", newMessage);

      res.status(201).json(newMessage);
    } catch (err) {
      console.error("Error sending message:", err);
      res.status(500).json({ error: "Failed to send message" });
    }
  }
);

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// Store user information for each socket
const userSockets = new Map(); // socketId -> { userId, username, displayName, currentRoom }

io.on("connection", (socket) => {
  console.log("✅ Socket.io user connected:", socket.id);

  // Handle authentication and user info
  socket.on("authenticate", async (token) => {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await User.findById(decoded.userId).select(
        "username displayName"
      );

      if (user) {
        userSockets.set(socket.id, {
          userId: user._id,
          username: user.username,
          displayName: user.displayName,
          currentRoom: null,
        });
        socket.user = user;
        console.log(
          `🔐 User authenticated: ${user.displayName || user.username}`
        );
      }
    } catch (error) {
      console.log("❌ Authentication failed for socket:", socket.id);
    }
  });

  // Handle joining a room for chat and presence
  socket.on("joinRoom", (roomName) => {
    const userInfo = userSockets.get(socket.id);

    // Leave previous room if any
    if (userInfo && userInfo.currentRoom) {
      socket.leave(userInfo.currentRoom);
      // Notify others in the previous room
      socket.to(userInfo.currentRoom).emit("userLeft", {
        username: userInfo.displayName || userInfo.username,
        message: `${userInfo.displayName || userInfo.username} has left`,
      });
    }

    socket.join(roomName);

    if (userInfo) {
      userInfo.currentRoom = roomName;
      // Notify others in the new room
      socket.to(roomName).emit("userJoined", {
        username: userInfo.displayName || userInfo.username,
        message: `${userInfo.displayName || userInfo.username} has joined`,
      });
    }

    console.log(`👤 User ${socket.id} joined room: ${roomName}`);
  });

  // Handle leaving a room
  socket.on("leaveRoom", (roomName) => {
    const userInfo = userSockets.get(socket.id);
    socket.leave(roomName);

    if (userInfo && userInfo.currentRoom === roomName) {
      userInfo.currentRoom = null;
      // Notify others in the room
      socket.to(roomName).emit("userLeft", {
        username: userInfo.displayName || userInfo.username,
        message: `${userInfo.displayName || userInfo.username} has left`,
      });
    }

    console.log(`👤 User ${socket.id} left room: ${roomName}`);
  });

  socket.on("disconnect", () => {
    const userInfo = userSockets.get(socket.id);

    // Notify others in the current room
    if (userInfo && userInfo.currentRoom) {
      socket.to(userInfo.currentRoom).emit("userLeft", {
        username: userInfo.displayName || userInfo.username,
        message: `${userInfo.displayName || userInfo.username} has left`,
      });
    }

    userSockets.delete(socket.id);
    console.log("❌ Socket.io user disconnected:", socket.id);
  });
});

// ✅ Use y-websocket's built-in WebSocket server
const wss = new WebSocket.Server({ noServer: true });

// Custom persistence handler for y-websocket
const persistence = {
  bindState: async (docName, ydoc) => {
    console.log(`🔧 Binding state for room: ${docName}`);

    try {
      const dbDoc = await YDocModel.findOne({ room: docName });
      if (dbDoc && dbDoc.state && dbDoc.state.length > 0) {
        console.log(
          `📂 Loading state from MongoDB for ${docName}: ${dbDoc.state.length} bytes`
        );
        const state = new Uint8Array(
          dbDoc.state.buffer,
          dbDoc.state.byteOffset,
          dbDoc.state.byteLength
        );
        Y.applyUpdate(ydoc, state);
        console.log(`✅ State loaded successfully for ${docName}`);
      } else {
        console.log(`🆕 No existing state found for ${docName}`);
      }
    } catch (err) {
      console.error(`❌ Error loading state for ${docName}:`, err);
    }
  },

  writeState: async (docName, ydoc) => {
    try {
      const state = Y.encodeStateAsUpdate(ydoc);
      const buffer = Buffer.from(state);

      // Always save the state, even if empty - this ensures empty documents are persisted
      console.log(`💾 Writing state for ${docName}: ${buffer.length} bytes`);

      await YDocModel.findOneAndUpdate(
        { room: docName },
        { state: buffer },
        { upsert: true, new: true }
      );

      console.log(
        `💾 State saved to MongoDB for ${docName}: ${buffer.length} bytes`
      );
    } catch (err) {
      console.error(`❌ Error saving state for ${docName}:`, err);
    }
  },
};

// Set up persistence
require("y-websocket/bin/utils").setPersistence(persistence);

// Handle WebSocket connections
wss.on("connection", setupWSConnection);

// Handle HTTP upgrade to WebSocket
server.on("upgrade", (request, socket, head) => {
  const pathname = request.url;

  console.log(`🔗 WebSocket upgrade request for: ${pathname}`);

  // Let Socket.IO handle its own connections (it uses /socket.io/ path)
  if (pathname.startsWith("/socket.io/")) {
    console.log(`📡 Socket.IO connection detected`);
    return; // Let Socket.IO handle this
  }

  // Handle y-websocket connections for collaborative editing
  // These come in as just the room name (e.g., /mytestroom, /room123, etc.)
  // Extract just the path part (before any query parameters)
  const cleanPath = pathname.split("?")[0];

  // Accept any path that starts with / and doesn't start with /socket.io/
  // This covers room names like /mytestroom, /room123, etc.
  const isRoomPath =
    cleanPath.startsWith("/") && !cleanPath.startsWith("/socket.io/");

  console.log(
    `🔍 Debug - pathname: "${pathname}", cleanPath: "${cleanPath}", isRoomPath: ${isRoomPath}`
  );

  if (isRoomPath) {
    console.log(
      `📝 Y-WebSocket connection for collaborative editing: ${cleanPath}`
    );
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit("connection", ws, request);
    });
    return;
  }

  // Unknown path, destroy connection
  console.log(`❌ Unknown WebSocket path: ${pathname}`);
  socket.destroy();
});

const PORT = 3001;
server.listen(PORT, () =>
  console.log(`🚀 Codocs server running on port ${PORT}`)
);
