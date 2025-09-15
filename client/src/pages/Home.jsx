import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function Home() {
  const [roomName, setRoomName] = useState("");
  const [roomList, setRoomList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sharingRoom, setSharingRoom] = useState(null);
  const [shareUsername, setShareUsername] = useState("");
  const [shareLoading, setShareLoading] = useState(false);
  const navigate = useNavigate();
  const { user, token, logout } = useAuth();

  const fetchRooms = useCallback(async () => {
    try {
      const response = await fetch("http://localhost:3001/api/rooms", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setRoomList(data);
      } else if (response.status === 401) {
        // Token expired or invalid
        logout();
        navigate("/login");
      }
    } catch (error) {
      console.error("Error fetching rooms:", error);
    }
  }, [token, logout, navigate]);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  const handleCreateRoom = async () => {
    if (!roomName.trim()) return;

    setLoading(true);
    try {
      const response = await fetch("http://localhost:3001/api/rooms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: roomName.trim() }),
      });

      if (response.ok) {
        await response.json();
        setRoomName("");
        fetchRooms(); // Refresh the list
        navigate(`/room/${roomName.trim()}`);
      } else {
        const error = await response.json();
        alert(error.error || "Error creating room");
      }
    } catch (error) {
      console.error("Error creating room:", error);
      alert("Network error creating room");
    } finally {
      setLoading(false);
    }
  };

  const handleShareRoom = async (roomName) => {
    if (!shareUsername.trim()) return;

    setShareLoading(true);
    try {
      const response = await fetch(
        `http://localhost:3001/api/rooms/${roomName}/share`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ username: shareUsername.trim() }),
        }
      );

      if (response.ok) {
        await response.json();
        alert(`Room shared successfully with ${shareUsername}!`);
        setSharingRoom(null);
        setShareUsername("");
        fetchRooms(); // Refresh the list
      } else {
        const error = await response.json();
        alert(error.error || "Error sharing room");
      }
    } catch (error) {
      console.error("Error sharing room:", error);
      alert("Network error sharing room");
    } finally {
      setShareLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-3xl font-bold text-gray-900">🧠 Codocs</h1>
              <span className="ml-4 text-sm text-gray-500">
                Welcome, {user?.displayName || user?.username}!
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Create New Room */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Create New Room
          </h2>
          <div className="flex space-x-4">
            <input
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="Enter room name"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyPress={(e) => e.key === "Enter" && handleCreateRoom()}
            />
            <button
              onClick={handleCreateRoom}
              disabled={!roomName.trim() || loading}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creating..." : "Create"}
            </button>
          </div>
        </div>

        {/* Available Rooms */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Available Rooms
            </h3>
          </div>
          <div className="p-6">
            {roomList.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No rooms available. Create your first room above!
              </p>
            ) : (
              <div className="space-y-3">
                {roomList.map((room) => {
                  const isOwner = room.owner._id === user.id;
                  const isShared = room.sharedWith.some(
                    (share) => share.user._id === user.id
                  );
                  const accessType = isOwner
                    ? "Owner"
                    : isShared
                    ? "Shared"
                    : "Shared";

                  return (
                    <div
                      key={room._id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-md hover:bg-gray-100"
                    >
                      <div
                        className="flex-1 cursor-pointer"
                        onClick={() => navigate(`/room/${room.name}`)}
                      >
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium text-gray-900">
                            {room.name}
                          </h4>
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${
                              isOwner
                                ? "bg-blue-100 text-blue-800"
                                : isShared
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {accessType}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500">
                          {isOwner
                            ? "You created this room"
                            : `Created by ${
                                room.owner.displayName || room.owner.username
                              }`}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(room.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {isOwner && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSharingRoom(room);
                            }}
                            className="text-blue-600 hover:text-blue-800 text-sm px-2 py-1 rounded hover:bg-blue-50"
                          >
                            Share
                          </button>
                        )}
                        <span className="text-blue-600">→</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Share Room Modal */}
      {sharingRoom && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Share Room: {sharingRoom.name}
            </h3>
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="shareUsername"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Username
                </label>
                <input
                  type="text"
                  id="shareUsername"
                  value={shareUsername}
                  onChange={(e) => setShareUsername(e.target.value)}
                  placeholder="Enter username to share with"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyPress={(e) =>
                    e.key === "Enter" && handleShareRoom(sharingRoom.name)
                  }
                />
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => handleShareRoom(sharingRoom.name)}
                  disabled={!shareUsername.trim() || shareLoading}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {shareLoading ? "Sharing..." : "Share"}
                </button>
                <button
                  onClick={() => {
                    setSharingRoom(null);
                    setShareUsername("");
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
