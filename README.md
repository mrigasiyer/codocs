# Codocs – Real-Time Collaborative Code Editor

Codocs is a **real-time collaborative code editor** built with **React, Yjs, WebSockets, and MongoDB**. Users can create or join rooms, code together in real time, and have their work persisted in a database.

---

## Features (At current state)

- **Multi-Room Support** → Join or create rooms via `/room/:roomId`
- **Room List** → See available rooms and enter them
- **Live Collaborative Editing** → Multiple users edit the same file in real-time
- **Persistence** → State is stored in MongoDB and restored on reconnect
- **WebSocket Sync** → Efficient CRDT-based synchronization using Yjs
- **Connection Logs** → Debug connection status in dev console

---

## Tech Stack

- **Frontend:** React, Vite, Monaco Editor, React Router
- **Collaboration:** Yjs, y-monaco, y-websocket
- **Backend:** Express, WebSocket (ws), Socket.IO (future events)
- **Database:** MongoDB + Mongoose
- **Dev Tools:** ESLint, dotenv

---

## 🔧 Setup & Running Locally

### 1. Clone Repo

```bash
git clone https://github.com/yourusername/codocs.git
cd codocs
```

### 2. Setup Server

```bash
cd server
npm install
```

##### Create a .env file in the server/ directory:

```env
MONGO_URI=mongodb+srv://<your-mongodb-uri>
```

##### Start the server:

```bash
node index.js
```

##### Expected logs:

```arduino
🔗 Connecting to MongoDB...
✅ MongoDB connected
🚀 Codocs server running on port 3001
```

##### Hot reload (optional):

```bash
npm install -g nodemon
nodemon index.js
```

### 3. Setup Client

```bash
cd ../client
npm install
npm run dev
```

##### Open your browser at:

```arduino
http://localhost:5173/
```
