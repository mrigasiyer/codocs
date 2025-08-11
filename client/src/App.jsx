import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function App() {
  const [roomName, setRoomName] = useState("");
  const [roomList, setRoomList] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetch("http://localhost:3001/api/rooms")
      .then((res) => res.json())
      .then((data) => {
        console.log("Fetched rooms:", data); 
        setRoomList(data);
      })
      .catch((err) => {
        console.error("❌ Failed to fetch rooms:", err); 
      });
  }, []);

  function handleJoin() {
    if (!roomName.trim()) return;

    fetch("http://localhost:3001/api/rooms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: roomName.trim() }),
    })
      .then((res) => res.json())
      .then(() => {
        navigate(`/room/${roomName.trim()}`);
      })
      .catch((err) => console.error("Error joining room", err));
  }

  return (
    <div style={{ padding: "3rem", textAlign: "center" }}>
      <h1>🧠 Codocs</h1>
      <p>Join or create a collaborative coding room:</p>
      <input
        value={roomName}
        onChange={(e) => setRoomName(e.target.value)}
        placeholder="Enter room name"
        style={{
          padding: "0.5rem 1rem",
          fontSize: "1rem",
          width: "250px",
          marginRight: "0.5rem",
        }}
      />
      <button
        onClick={handleJoin}
        style={{
          padding: "0.5rem 1rem",
          fontSize: "1rem",
          cursor: "pointer",
        }}
      >
        Go →
      </button>
      {roomList.length > 0 && (
        <div style={{ marginTop: "2rem" }}>
          <h3>🌐 Available Rooms:</h3>
          <ul style={{ listStyle: "none", padding: 0 }}>
            {roomList.map((room) => (
              <li key={room._id}>
                <button
                  onClick={() => navigate(`/room/${room.name}`)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "blue",
                    textDecoration: "underline",
                    fontSize: "1rem",
                    cursor: "pointer",
                  }}
                >
                  {room.name}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default App;
