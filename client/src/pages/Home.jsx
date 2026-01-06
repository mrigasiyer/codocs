import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import ThemeToggle from "../components/ThemeToggle";
import { API_URL } from "../config/api";

export default function Home() {
  const [roomName, setRoomName] = useState("");
  const [roomList, setRoomList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [roomsFilter, setRoomsFilter] = useState("anyone");
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
      const response = await fetch(`${API_URL}/api/rooms`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setRoomList(data);
      } else if (response.status === 401) {
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
      const response = await fetch(`${API_URL}/api/rooms`, {
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
        fetchRooms();
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
        `${API_URL}/api/rooms/${roomName}/share`,
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
        fetchRooms();
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
    navigate("/");
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
        `${API_URL}/api/rooms/${encodeURIComponent(
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
        `${API_URL}/api/rooms/${encodeURIComponent(room.name)}`,
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

  const filteredRooms = roomList.filter((room) => {
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
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="sticky top-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <img
                src="/logo.jpg"
                alt="Codocs"
                className="h-8 w-8 rounded-lg object-cover"
              />
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                Codocs
              </span>
            </div>

            <div className="flex items-center space-x-3">
              <ThemeToggle />
              <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span>{user?.displayName || user?.username}</span>
              </div>
              <button
                onClick={handleLogout}
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            Welcome back, {user?.displayName || user?.username}
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Create or join a room to start collaborating
          </p>
        </div>

        {/* Create Room */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 mb-8">
          <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Create a new room
          </h2>
          <div className="flex gap-3">
            <input
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="Enter room name..."
              className="flex-1 px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white text-sm"
              onKeyDown={(e) => e.key === "Enter" && handleCreateRoom()}
            />
            <button
              onClick={handleCreateRoom}
              disabled={!roomName.trim() || loading}
              className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium text-sm hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creating..." : "Create"}
            </button>
          </div>
        </div>

        {/* Rooms Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          {/* Rooms Header */}
          <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Your Rooms
              </h2>
              <div className="flex items-center gap-2">
                {/* Search */}
                <div className="relative flex-1 sm:flex-none">
                  <svg
                    className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search..."
                    className="w-full sm:w-44 text-sm pl-9 pr-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                {/* Filter */}
                <select
                  value={roomsFilter}
                  onChange={(e) => setRoomsFilter(e.target.value)}
                  className="text-sm px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="anyone">All rooms</option>
                  <option value="owner">My rooms</option>
                  <option value="shared">Shared with me</option>
                </select>
              </div>
            </div>
          </div>

          {/* Room List */}
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {roomList.length === 0 ? (
              <div className="px-5 py-16 text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                </div>
                <p className="text-gray-600 dark:text-gray-300 font-medium">
                  No rooms yet
                </p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                  Create your first room above to get started
                </p>
              </div>
            ) : filteredRooms.length === 0 ? (
              <div className="px-5 py-16 text-center">
                <p className="text-gray-600 dark:text-gray-300 font-medium">
                  No rooms found
                </p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                  Try adjusting your search or filter
                </p>
              </div>
            ) : (
              filteredRooms.map((room) => {
                const isOwner = room.owner && room.owner._id === user.id;
                const isShared = room.sharedWith.some(
                  (share) => share.user && share.user._id === user.id
                );

                return (
                  <div
                    key={room._id}
                    className="flex items-center px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors cursor-pointer group"
                    onClick={() => navigate(`/room/${room.name}`)}
                  >
                    {/* Room Icon */}
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center mr-4 ${
                        isOwner
                          ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                          : "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                      }`}
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                        />
                      </svg>
                    </div>

                    {/* Room Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-gray-900 dark:text-white truncate">
                          {room.name}
                        </h3>
                        <span
                          className={`shrink-0 text-xs px-2 py-0.5 rounded-full ${
                            isOwner
                              ? "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300"
                              : "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300"
                          }`}
                        >
                          {isOwner ? "Owner" : "Shared"}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        {isOwner
                          ? `Created ${new Date(
                              room.createdAt
                            ).toLocaleDateString()}`
                          : `Shared by ${
                              room.owner.displayName || room.owner.username
                            }`}
                      </p>
                    </div>

                    {/* Actions */}
                    <div
                      className="flex items-center gap-1 ml-4"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {isOwner && (
                        <>
                          <button
                            onClick={() => setSharingRoom(room)}
                            className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                            title="Share"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                              />
                            </svg>
                          </button>
                          <div className="relative">
                            <button
                              onClick={() =>
                                setMenuOpenId(
                                  menuOpenId === room._id ? null : room._id
                                )
                              }
                              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                              title="More"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zm6 0a2 2 0 11-4 0 2 2 0 014 0zm6 0a2 2 0 11-4 0 2 2 0 014 0z" />
                              </svg>
                            </button>
                            {menuOpenId === room._id && (
                              <div className="absolute right-0 top-full mt-1 w-32 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20 overflow-hidden">
                                <button
                                  className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                                  onClick={() => requestRenameRoom(room)}
                                >
                                  Rename
                                </button>
                                <button
                                  className="w-full text-left px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                                  onClick={() => deleteRoom(room)}
                                >
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                        </>
                      )}
                      <svg
                        className="w-5 h-5 text-gray-300 dark:text-gray-600 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </main>

      {/* Share Modal */}
      {sharingRoom && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
              Share Room
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              {sharingRoom.name}
            </p>
            <input
              type="text"
              value={shareUsername}
              onChange={(e) => setShareUsername(e.target.value)}
              placeholder="Enter username"
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white text-sm mb-4"
              onKeyDown={(e) =>
                e.key === "Enter" && handleShareRoom(sharingRoom.name)
              }
            />
            <div className="flex gap-3">
              <button
                onClick={() => handleShareRoom(sharingRoom.name)}
                disabled={!shareUsername.trim() || shareLoading}
                className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {shareLoading ? "Sharing..." : "Share"}
              </button>
              <button
                onClick={() => {
                  setSharingRoom(null);
                  setShareUsername("");
                }}
                className="flex-1 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium text-sm hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rename Modal */}
      {renameRoom && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
              Rename Room
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              {renameRoom.name}
            </p>
            <input
              type="text"
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
              placeholder="New room name"
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white text-sm mb-4"
              onKeyDown={(e) => e.key === "Enter" && submitRenameRoom()}
            />
            <div className="flex gap-3">
              <button
                onClick={submitRenameRoom}
                disabled={!newRoomName.trim() || actionLoading}
                className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading ? "Saving..." : "Save"}
              </button>
              <button
                onClick={() => {
                  setRenameRoom(null);
                  setNewRoomName("");
                }}
                className="flex-1 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium text-sm hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
