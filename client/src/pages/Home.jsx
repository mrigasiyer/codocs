import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import ThemeToggle from "../components/ThemeToggle";

export default function Home() {
  const [roomName, setRoomName] = useState("");
  const [roomList, setRoomList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [roomsFilter, setRoomsFilter] = useState("anyone"); // 'owner' | 'shared' | 'anyone'
  const [searchQuery, setSearchQuery] = useState("");
  const [sharingRoom, setSharingRoom] = useState(null);
  const [shareUsername, setShareUsername] = useState("");
  const [shareLoading, setShareLoading] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [renameRoom, setRenameRoom] = useState(null);
  const [newRoomName, setNewRoomName] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
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

  const requestRenameRoom = (room) => {
    setRenameRoom(room);
    setNewRoomName(room.name);
    setMenuOpenId(null);
  };

  const submitRenameRoom = async () => {
    if (!renameRoom || !newRoomName.trim()) return;
    setActionLoading(true);
    try {
      const response = await fetch(
        `http://localhost:3001/api/rooms/${encodeURIComponent(
          renameRoom.name
        )}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ newName: newRoomName.trim() }),
        }
      );
      if (response.ok) {
        await response.json();
        await fetchRooms();
        setRenameRoom(null);
        setNewRoomName("");
      } else {
        const err = await response.json();
        alert(err.error || "Failed to rename room");
      }
    } catch (e) {
      console.error("Rename error", e);
      alert("Network error renaming room");
    } finally {
      setActionLoading(false);
    }
  };

  const deleteRoom = async (room) => {
    if (!room) return;
    if (!confirm(`Delete room "${room.name}"? This cannot be undone.`)) return;
    setActionLoading(true);
    try {
      const response = await fetch(
        `http://localhost:3001/api/rooms/${encodeURIComponent(room.name)}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.ok) {
        await response.json();
        await fetchRooms();
      } else {
        const err = await response.json();
        alert(err.error || "Failed to delete room");
      }
    } catch (e) {
      console.error("Delete error", e);
      alert("Network error deleting room");
    } finally {
      setActionLoading(false);
    }
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
          <div className="px-6 py-4 border-b border-slate-200 dark:border-gray-700 flex items-center justify-between gap-3">
            <h3 className="text-lg font-medium text-slate-900 dark:text-white">
              Recent Rooms
            </h3>
            <div className="flex items-center gap-3">
              <div className="relative hidden sm:block">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search documents..."
                  className="w-56 text-sm pl-9 pr-3 py-1.5 rounded-md border border-slate-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-slate-800 dark:text-gray-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-400 dark:placeholder-gray-400"
                />
                <svg
                  className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-gray-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.5 3a5.5 5.5 0 013.983 9.357l3.08 3.08a.75.75 0 11-1.06 1.06l-3.08-3.08A5.5 5.5 0 118.5 3zm0 1.5a4 4 0 100 8 4 4 0 000-8z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="relative">
                <span className="sr-only">Filter rooms</span>
                <select
                  id="roomsFilter"
                  aria-label="Filter rooms"
                  value={roomsFilter}
                  onChange={(e) => setRoomsFilter(e.target.value)}
                  className="appearance-none text-sm pl-3 pr-8 py-1.5 rounded-md border border-slate-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-slate-800 dark:text-gray-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 hover:bg-slate-50 dark:hover:bg-gray-600 transition-colors"
                >
                  <option value="owner">Owned by me</option>
                  <option value="shared">Shared with me</option>
                  <option value="anyone">Owned by anyone</option>
                </select>
                <svg
                  className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 dark:text-gray-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.08 1.04l-4.25 4.25a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
          </div>
          <div className="p-6">
            {roomList.length === 0 ? (
              <div className="text-slate-500 dark:text-gray-400 text-center py-10">
                <div className="text-4xl mb-2">✨</div>
                <p>No rooms yet. Create your first room above!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {roomList
                  .filter((room) => {
                    const query = searchQuery.trim().toLowerCase();
                    if (query) {
                      const name = (room.name || "").toLowerCase();
                      if (!name.includes(query)) return false;
                    }
                    const isOwner = room.owner && room.owner._id === user.id;
                    const isShared = room.sharedWith.some(
                      (share) => share.user && share.user._id === user.id
                    );
                    if (roomsFilter === "owner") return isOwner;
                    if (roomsFilter === "shared") return isShared && !isOwner;
                    return true; // anyone
                  })
                  .map((room) => {
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
                          {isOwner && (
                            <div className="relative">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setMenuOpenId(
                                    menuOpenId === room._id ? null : room._id
                                  );
                                }}
                                className="p-1 rounded hover:bg-slate-200 dark:hover:bg-gray-600 text-slate-600 dark:text-gray-300"
                                aria-haspopup="menu"
                                aria-expanded={menuOpenId === room._id}
                                title="More actions"
                              >
                                <svg
                                  className="w-5 h-5"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                  aria-hidden="true"
                                >
                                  <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zm6 0a2 2 0 11-4 0 2 2 0 014 0zm6 0a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                              </button>
                              {menuOpenId === room._id && (
                                <div
                                  className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-700 rounded-md shadow-lg ring-1 ring-slate-200 dark:ring-gray-600 z-10"
                                  role="menu"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <button
                                    className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-gray-600 text-slate-700 dark:text-gray-200 rounded-t-md"
                                    onClick={() => requestRenameRoom(room)}
                                    role="menuitem"
                                  >
                                    Rename
                                  </button>
                                  <button
                                    className="w-full text-left px-3 py-2 text-sm hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded-b-md"
                                    onClick={() => deleteRoom(room)}
                                    role="menuitem"
                                  >
                                    Delete
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                          <span className="text-slate-400 dark:text-gray-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                            →
                          </span>
                        </div>
                      </div>
                    );
                  })}

                {/* Empty state when no rooms match filter */}
                {roomList.filter((room) => {
                  const query = searchQuery.trim().toLowerCase();
                  if (query) {
                    const name = (room.name || "").toLowerCase();
                    if (!name.includes(query)) return false;
                  }
                  const isOwner = room.owner && room.owner._id === user.id;
                  const isShared = room.sharedWith.some(
                    (share) => share.user && share.user._id === user.id
                  );
                  if (roomsFilter === "owner") return isOwner;
                  if (roomsFilter === "shared") return isShared && !isOwner;
                  return true;
                }).length === 0 && (
                  <div className="text-slate-500 dark:text-gray-400 text-center py-10">
                    <div className="text-4xl mb-2">🔎</div>
                    <p>No rooms match your search and filter.</p>
                  </div>
                )}
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

      {/* Rename Room Modal */}
      {renameRoom && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96 max-w-md mx-4 shadow-xl ring-1 ring-slate-200 dark:ring-gray-700">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              Rename Room
            </h3>
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="newRoomName"
                  className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1"
                >
                  New name
                </label>
                <input
                  type="text"
                  id="newRoomName"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white shadow-sm"
                  placeholder="Enter new room name"
                  onKeyDown={(e) => e.key === "Enter" && submitRenameRoom()}
                />
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={submitRenameRoom}
                  disabled={!newRoomName.trim() || actionLoading}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {actionLoading ? "Saving..." : "Save"}
                </button>
                <button
                  onClick={() => {
                    setRenameRoom(null);
                    setNewRoomName("");
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
