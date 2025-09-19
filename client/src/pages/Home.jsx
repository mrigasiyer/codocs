import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import ThemeToggle from "../components/ThemeToggle";

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
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur border-b border-slate-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <img
                src="/logo.jpg"
                alt="Codocs logo"
                className="h-9 w-9 rounded-md object-cover mr-3 shadow-sm ring-1 ring-slate-200 dark:ring-gray-600"
              />
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white leading-tight">
                  Codocs
                </h1>
                <span className="block text-xs sm:text-sm text-slate-500 dark:text-gray-400">
                  Welcome, {user?.displayName || user?.username}!
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 shadow-sm"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Create New Room */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm ring-1 ring-slate-200 dark:ring-gray-700 p-6 mb-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                Create New Room
              </h2>
              <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">
                Spin up a collaborative coding room and invite teammates.
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="Enter room name"
              className="flex-1 px-3 py-2 border border-slate-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white shadow-sm"
              onKeyDown={(e) => e.key === "Enter" && handleCreateRoom()}
            />
            <button
              onClick={handleCreateRoom}
              disabled={!roomName.trim() || loading}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {loading ? "Creating..." : "Create"}
            </button>
          </div>
        </div>

        {/* Available Rooms */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm ring-1 ring-slate-200 dark:ring-gray-700">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-slate-900 dark:text-white">
              Recent Rooms
            </h3>
          </div>
          <div className="p-6">
            {roomList.length === 0 ? (
              <div className="text-slate-500 dark:text-gray-400 text-center py-10">
                <div className="text-4xl mb-2">✨</div>
                <p>No rooms yet. Create your first room above!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {roomList.map((room) => {
                  const isOwner = room.owner && room.owner._id === user.id;
                  const isShared = room.sharedWith.some(
                    (share) => share.user && share.user._id === user.id
                  );
                  const accessType = isOwner
                    ? "Owner"
                    : isShared
                    ? "Shared"
                    : "Shared";

                  return (
                    <div
                      key={room._id}
                      className="group flex items-center justify-between p-3 bg-slate-50 dark:bg-gray-700 rounded-md hover:bg-white dark:hover:bg-gray-600 transition-colors ring-1 ring-slate-200 dark:ring-gray-600 hover:ring-blue-200 dark:hover:ring-blue-400"
                    >
                      <div
                        className="flex-1 cursor-pointer"
                        onClick={() => navigate(`/room/${room.name}`)}
                      >
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium text-slate-900 dark:text-white">
                            {room.name}
                          </h4>
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${
                              isOwner
                                ? "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
                                : isShared
                                ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
                                : "bg-slate-100 dark:bg-gray-600 text-slate-800 dark:text-gray-200"
                            }`}
                          >
                            {accessType}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-gray-300">
                          {isOwner
                            ? "You created this room"
                            : `Created by ${
                                room.owner.displayName || room.owner.username
                              }`}
                        </p>
                        <p className="text-xs text-slate-400 dark:text-gray-500">
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
                            className="text-blue-700 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 text-sm px-2 py-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20"
                          >
                            Share
                          </button>
                        )}
                        <span className="text-slate-400 dark:text-gray-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                          →
                        </span>
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96 max-w-md mx-4 shadow-xl ring-1 ring-slate-200 dark:ring-gray-700">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              Share Room: {sharingRoom.name}
            </h3>
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="shareUsername"
                  className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1"
                >
                  Username
                </label>
                <input
                  type="text"
                  id="shareUsername"
                  value={shareUsername}
                  onChange={(e) => setShareUsername(e.target.value)}
                  placeholder="Enter username to share with"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white shadow-sm"
                  onKeyDown={(e) =>
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
                  className="flex-1 bg-slate-200 dark:bg-gray-600 text-slate-700 dark:text-gray-300 px-4 py-2 rounded-md hover:bg-slate-300 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-slate-500"
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
