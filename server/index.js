const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const WebSocket = require("ws");
const { setupWSConnection } = require("y-websocket/bin/utils");
const Y = require("yjs");
const connectDB = require("./db");
const YDocModel = require("./models/YDoc");
const Room = require("./models/Room");

// Import auth routes
const authRouter = require("./routes/auth");

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Connect to MongoDB
connectDB();

// Add auth routes
app.use("/api/auth", authRouter);

app.get("/api/rooms", async (req, res) => {
  try {
    const rooms = await Room.find().sort({ createdAt: -1 });
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch rooms" });
  }
});

app.post("/api/rooms/", async (req, res) => {
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ error: "Room name is required" });
  }

  try {
    let room = await Room.findOne({ name });

    if (!room) {
      room = await Room.create({ name });
    }

    res.json(room);
  } catch (err) {
    res.status(500).json({ error: "Error creating room" });
  }
});

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

io.on("connection", (socket) => {
  console.log("✅ Socket.io user connected:", socket.id);
  socket.on("disconnect", () =>
    console.log("❌ Socket.io user disconnected:", socket.id)
  );
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

  if (pathname === "/") {
    // Handle root path
    socket.destroy();
    return;
  }

  console.log(`🔗 WebSocket upgrade request for: ${pathname}`);

  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit("connection", ws, request);
  });
});

const PORT = 3001;
server.listen(PORT, () =>
  console.log(`🚀 Codocs server running on port ${PORT}`)
);
