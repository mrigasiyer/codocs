const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const WebSocket = require("ws");
const Y = require("yjs");
const connectDB = require("./db");
const YDocModel = require("./models/YDoc");
const Room = require("./models/Room");

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Connect to MongoDB
connectDB();

app.get("/api/rooms", async (req, res) => {
  try{
    const rooms = await Room.find().sort({ createdAt: -1 });
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch rooms"});
  }
});

app.post("/api/rooms/", async(req, res) => {
  const { name } = req.body;

  if(!name) {
    return res.status(400).json({ error: "Room name is required" });
  }

  try{
    let room = await Room.findOne({ name });

    if(!room) {
      room = await Room.create({ name });
    }

    res.json(room);
  } catch (err) {
    res.status(500).json({ error : "Error creating room"})
  }


})

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

io.on("connection", (socket) => {
  console.log("✅ Socket.io user connected:", socket.id);
  socket.on("disconnect", () => console.log("❌ Socket.io user disconnected:", socket.id));
});

const wss = new WebSocket.Server({ server });

// ✅ Main Yjs Persistence Logic
async function setupWSConnection(ws, roomName) {
  let doc = new Y.Doc();

  // 🔹 Load full state from MongoDB if exists
  try {
    const dbDoc = await YDocModel.findOne({ room: roomName });
    if (dbDoc && dbDoc.state) {
      console.log("📂 Loading state from MongoDB...");
      const uint8State = new Uint8Array(dbDoc.state.buffer, dbDoc.state.byteOffset, dbDoc.state.byteLength);
      Y.applyUpdate(doc, uint8State);
    } else {
      console.log("🆕 Creating new room in DB...");
      await YDocModel.create({
        room: roomName,
        state: Buffer.from(Y.encodeStateAsUpdate(doc)),
      });
    }
  } catch (err) {
    console.error("❌ Error loading state:", err);
  }

  // 🔹 Send current state to new client
  ws.send(Y.encodeStateAsUpdate(doc));

  ws.on("message", async (message) => {
    try {
      const update = new Uint8Array(message);
      Y.applyUpdate(doc, update);

      // Broadcast update to all other clients
      wss.clients.forEach((client) => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(message);
        }
      });

      // ✅ Save full state to MongoDB
      const fullState = Buffer.from(Y.encodeStateAsUpdate(doc));
      await YDocModel.findOneAndUpdate(
        { room: roomName },
        { state: fullState },
        { upsert: true }
      );
      console.log(`💾 Saved full state to MongoDB (${fullState.length} bytes)`);
    } catch (err) {
      console.error("❌ Error processing Yjs update:", err);
    }
  });
}

// ✅ Handle new WebSocket connections
wss.on("connection", (ws) => {
  console.log("🔗 Yjs client connected");
  setupWSConnection(ws, "codocs-room");
});

const PORT = 3001;
server.listen(PORT, () => console.log(`🚀 Codocs server running on port ${PORT}`));
