import Editor from "@monaco-editor/react";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { MonacoBinding } from "y-monaco";
import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "../contexts/AuthContext";

export default function CodeEditor() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const providerRef = useRef(null);
  const ydocRef = useRef(null);
  const initializedRef = useRef(false);
  const [connectionStatus, setConnectionStatus] =
    useState("Checking access...");
  const [isConnected, setIsConnected] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [roomInfo, setRoomInfo] = useState(null);
  const [showSharedModal, setShowSharedModal] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);

  // Check room access on mount
  useEffect(() => {
    const checkRoomAccess = async () => {
      try {
        const response = await fetch(
          `http://localhost:3001/api/rooms/${roomId}/access`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          if (data.hasAccess) {
            setHasAccess(true);
            setRoomInfo(data.room);
            setLoading(false);
          } else {
            setError("You don't have access to this room");
            setLoading(false);
          }
        } else if (response.status === 401) {
          navigate("/login");
        } else {
          setError("Room not found or access denied");
          setLoading(false);
        }
      } catch (err) {
        console.error("Error checking room access:", err);
        setError("Error checking room access");
        setLoading(false);
      }
    };

    checkRoomAccess();
  }, [roomId, token, navigate]);

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (providerRef.current) {
        try {
          providerRef.current.awareness.setLocalState(null);
        } catch (e) {
          console.warn("Failed to clear local awareness state on unmount", e);
        }
        providerRef.current.disconnect();
      }
    };
  }, []);

  function getColorForId(id) {
    const colors = [
      "#2563eb",
      "#16a34a",
      "#dc2626",
      "#7c3aed",
      "#db2777",
      "#ea580c",
      "#0891b2",
      "#4f46e5",
    ];
    let hash = 0;
    for (let i = 0; i < String(id || "").length; i++) {
      hash = (hash << 5) - hash + String(id)[i].charCodeAt(0);
      hash |= 0;
    }
    const idx = Math.abs(hash) % colors.length;
    return colors[idx];
  }

  function getInitials(name) {
    const n = (name || "").trim();
    if (!n) return "?";
    const parts = n.split(/\s+/);
    const first = parts[0]?.[0] || "";
    const last = parts[1]?.[0] || "";
    return (first + last).toUpperCase() || first.toUpperCase();
  }

  function handleEditorMount(editor) {
    console.log("🚀 Editor mounted for room:", roomId);
    console.log("🔄 Initialization ref state:", initializedRef.current);

    const ydoc = new Y.Doc();
    ydocRef.current = ydoc;
    console.log("📄 New Y.Doc created");

    // ✅ Connect to Yjs server with room ID in the path
    const provider = new WebsocketProvider(
      `ws://localhost:3001/`,
      roomId,
      ydoc
    );
    providerRef.current = provider;

    const yText = ydoc.getText("monaco"); // Use consistent text name

    // Presence: set local user state and subscribe to awareness changes
    const awareness = provider.awareness;
    try {
      const displayName = user?.displayName || user?.username || "User";
      awareness.setLocalStateField("user", {
        id: user?.id,
        name: displayName,
        color: getColorForId(user?.id || displayName),
      });
    } catch (e) {
      console.warn("Unable to set local awareness state", e);
    }

    const updateOnlineUsers = () => {
      const states = Array.from(awareness.getStates().values());
      const users = states
        .map((s) => s.user)
        .filter(Boolean)
        .reduce((acc, u) => {
          if (!acc.find((x) => x.id === u.id && x.name === u.name)) {
            acc.push(u);
          }
          return acc;
        }, []);
      setOnlineUsers(users);
    };

    awareness.on("change", updateOnlineUsers);
    updateOnlineUsers();

    provider.on("status", (event) => {
      console.log("Yjs status:", event.status);
      if (event.status === "connected") {
        setConnectionStatus("Connected, syncing...");
        setIsConnected(true);
      } else if (event.status === "disconnected") {
        setConnectionStatus("Disconnected");
        setIsConnected(false);
      } else if (event.status === "connecting") {
        setConnectionStatus("Connecting...");
        setIsConnected(false);
      }
    });

    provider.on("sync", (isSynced) => {
      console.log("🔄 Yjs sync status:", isSynced);
      if (isSynced && !initializedRef.current) {
        console.log("✅ Yjs synced with server");
        console.log("📝 Current text content:", yText.toString());
        console.log("📝 Text length before binding:", yText.length);

        try {
          new MonacoBinding(
            yText,
            editor.getModel(),
            new Set([editor]),
            provider.awareness
          );

          // Wait a bit to ensure the document is fully loaded from the server
          setTimeout(() => {
            const currentLength = yText.length;
            const currentContent = yText.toString();
            console.log("📝 Final text length after sync:", currentLength);
            console.log(
              "📝 Final text content after sync:",
              currentContent.substring(0, 100)
            );

            // Document is ready - no need to add default text
            console.log("📝 Document ready, no default text needed");
            setConnectionStatus("Connected");
          }, 100); // Small delay to ensure full sync

          initializedRef.current = true;
          console.log("✅ Monaco binding completed and initialized");
        } catch (err) {
          console.error("❌ Error creating Monaco binding:", err);
        }
      } else if (isSynced && initializedRef.current) {
        console.log("🔄 Document already initialized, skipping setup");
        setConnectionStatus("Connected");
        setIsConnected(true);
      }
    });

    // Listen for text changes
    yText.observe((event) => {
      console.log("📝 Text changed:", event.changes);
      console.log("📝 Current text length:", yText.length);
      console.log("📝 Text preview:", yText.toString().substring(0, 100));
    });

    // Handle connection errors
    provider.on("connection-error", (err) => {
      console.error("❌ WebSocket connection error:", err);
      setConnectionStatus("Connection Error");
      setIsConnected(false);
    });

    // Handle connection close
    provider.on("close", () => {
      console.log("🔌 WebSocket connection closed");
      setConnectionStatus("Disconnected");
      setIsConnected(false);
    });

    // Cleanup listeners on editor dispose/unmount scenario
    editor.onDidDispose(() => {
      try {
        awareness.off("change", updateOnlineUsers);
      } catch (e) {
        console.warn("Failed to detach awareness change listener", e);
      }
    });

    // Debug: Log document state
    console.log("📄 Initial document state:", {
      roomId,
      textLength: yText.length,
      textContent: yText.toString().substring(0, 100),
    });
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-700">
            Checking access...
          </h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">🚫</div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate("/")}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">🔒</div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            No Access
          </h2>
          <p className="text-gray-600 mb-4">
            You don't have permission to access this room.
          </p>
          <button
            onClick={() => navigate("/")}
            className="text-sm bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Connection Status Bar */}
      <div className="relative z-20 bg-gray-100 px-4 py-2 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div
            className={`w-2 h-2 rounded-full ${
              isConnected ? "bg-green-500" : "bg-red-500"
            }`}
          ></div>
          <span className="text-sm text-gray-600">{connectionStatus}</span>
          <div className="hidden sm:flex items-center space-x-2 ml-4">
            <span className="text-xs text-gray-500">Online:</span>
            <div className="flex items-center -space-x-2">
              {onlineUsers.map((u) => (
                <div key={`${u.id}-${u.name}`} className="relative group">
                  <div
                    className="relative inline-flex items-center justify-center h-6 w-6 rounded-full ring-2 ring-white text-white text-[10px] font-medium"
                    title={u.name}
                    aria-label={u.name}
                    style={{ backgroundColor: u.color }}
                  >
                    {getInitials(u.name)}
                  </div>
                  <div className="pointer-events-none absolute z-50 top-2 left-1/2 -translate-x-1/2 translate-y-full whitespace-nowrap rounded px-2 py-1 text-xs text-white bg-gray-900/90 opacity-0 group-hover:opacity-100 transition-opacity shadow-md">
                    {u.name}
                    <div className="absolute left-1/2 -top-1 -translate-x-1/2 border-4 border-transparent border-b-gray-900/90"></div>
                  </div>
                </div>
              ))}
            </div>
            <span className="text-xs text-gray-500">{onlineUsers.length}</span>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <span className="text-xs text-gray-500">Room: {roomId}</span>
          {hasAccess && (
            <button
              onClick={() => setShowSharedModal(true)}
              className="text-sm bg-gray-200 text-gray-800 px-3 py-1.5 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
            >
              Shared with
            </button>
          )}
          <button
            onClick={() => navigate("/")}
            className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Home
          </button>
        </div>
      </div>

      <Editor
        height="calc(90vh - 48px)"
        defaultLanguage="javascript"
        onMount={handleEditorMount}
      />
      <SharedWithModal />
    </div>
  );

  // Modal
  function SharedWithModal() {
    if (!showSharedModal || !roomInfo) return null;

    const owner = roomInfo.owner;
    const shared = roomInfo.sharedWith || [];

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-96 max-w-md mx-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Shared access
          </h3>
          <div className="space-y-4">
            <div>
              <div className="text-sm text-gray-500 mb-1">Owner</div>
              <div className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded">
                <span className="text-gray-900 text-sm">
                  {owner?.displayName || owner?.username}
                </span>
                <span className="text-xs text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                  Owner
                </span>
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-1">Shared with</div>
              {shared.length === 0 ? (
                <div className="text-sm text-gray-500 bg-gray-50 px-3 py-2 rounded">
                  Not shared with anyone
                </div>
              ) : (
                <div className="space-y-2">
                  {shared.map((s) => (
                    <div
                      key={s.user._id}
                      className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded"
                    >
                      <span className="text-gray-900 text-sm">
                        {s.user.displayName || s.user.username}
                      </span>
                      <span className="text-xs text-gray-600">
                        {new Date(s.sharedAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowSharedModal(false)}
                className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
