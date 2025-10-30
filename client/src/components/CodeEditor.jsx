import Editor from "@monaco-editor/react";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { MonacoBinding } from "y-monaco";
import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useTheme } from "../hooks/useTheme";
import Chat from "./Chat";

export default function CodeEditor() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const { theme } = useTheme();
  const providerRef = useRef(null);
  const ydocRef = useRef(null);
  const initializedRef = useRef(false);
  const editorRef = useRef(null);
  const decorationsRef = useRef({}); // userId -> decorationIds
  const contentWidgetsRef = useRef({}); // userId -> widget record
  const typingTimeoutRef = useRef(null);
  const styleElRef = useRef(null);
  const [connectionStatus, setConnectionStatus] =
    useState("Checking access...");
  const [isConnected, setIsConnected] = useState(false);
  const [showStatusText, setShowStatusText] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [roomInfo, setRoomInfo] = useState(null);
  const [showSharedModal, setShowSharedModal] = useState(false);
  const [shareEmail, setShareEmail] = useState("");
  const [sharing, setSharing] = useState(false);
  const shareEmailRef = useRef(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [showChat, setShowChat] = useState(false);
  const [showConsole, setShowConsole] = useState(false);
  const [consoleHeight, setConsoleHeight] = useState(200);
  const [isResizing, setIsResizing] = useState(false);
  const [consoleOutput, setConsoleOutput] = useState([]);
  const statusHideTimeoutRef = useRef(null);
  const resizeRef = useRef(null);
  const [showFileMenu, setShowFileMenu] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFileName, setExportFileName] = useState("");
  const [exportFileType, setExportFileType] = useState("js");

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

  // Focus email input when modal opens and reset when it closes
  useEffect(() => {
    if (showSharedModal) {
      // Small delay to ensure modal is rendered
      setTimeout(() => {
        if (shareEmailRef.current) {
          shareEmailRef.current.focus();
        }
      }, 200);
    } else {
      // Reset email when modal closes
      setShareEmail("");
    }
  }, [showSharedModal]);

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
      // Remove any cursor decorations
      try {
        const editor = editorRef.current;
        const decorationsByUser = decorationsRef.current; // copy ref value
        if (editor && decorationsByUser) {
          Object.values(decorationsByUser).forEach((ids) => {
            editor.deltaDecorations(ids, []);
          });
        }
      } catch (e) {
        console.warn("Failed clearing decorations on unmount", e);
      }
      // Remove content widgets
      try {
        const editor = editorRef.current;
        const widgetsByUser = contentWidgetsRef.current; // copy ref value
        if (editor && widgetsByUser) {
          Object.values(widgetsByUser).forEach((rec) => {
            try {
              editor.removeContentWidget(rec.widget);
            } catch (err) {
              console.warn("Failed to remove content widget", err);
            }
          });
        }
      } catch (e) {
        console.warn("Failed removing content widgets on unmount", e);
      }
      // Remove injected style
      if (styleElRef.current && styleElRef.current.parentNode) {
        styleElRef.current.parentNode.removeChild(styleElRef.current);
        styleElRef.current = null;
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (statusHideTimeoutRef.current) {
        clearTimeout(statusHideTimeoutRef.current);
      }
    };
  }, []);

  // Show status text while connecting/disconnected, hide shortly after connected
  useEffect(() => {
    if (isConnected) {
      setShowStatusText(true);
      if (statusHideTimeoutRef.current) {
        clearTimeout(statusHideTimeoutRef.current);
      }
      statusHideTimeoutRef.current = setTimeout(() => {
        setShowStatusText(false);
      }, 2000);
    } else {
      if (statusHideTimeoutRef.current) {
        clearTimeout(statusHideTimeoutRef.current);
      }
      setShowStatusText(true);
    }
  }, [isConnected, connectionStatus]);

  const isOwner = !!(
    roomInfo &&
    roomInfo.owner &&
    roomInfo.owner._id === user?.id
  );

  // Handle console resize
  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsResizing(true);
  };

  const handleMouseMove = (e) => {
    if (!isResizing) return;

    const newHeight = window.innerHeight - e.clientY - 88; // 88px for header
    const minHeight = 100;
    const maxHeight = window.innerHeight - 200; // Leave some space for editor

    if (newHeight >= minHeight && newHeight <= maxHeight) {
      setConsoleHeight(newHeight);
    }
  };

  const handleMouseUp = () => {
    setIsResizing(false);
  };

  useEffect(() => {
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "ns-resize";
      document.body.style.userSelect = "none";
    } else {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing]);

  // Execute code from editor
  const executeEditorCode = (code) => {
    if (!code.trim()) return;

    // Capture console.log output
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;
    const originalInfo = console.info;

    const capturedOutput = [];

    console.log = (...args) => {
      originalLog(...args);
      capturedOutput.push({ type: "log", message: args.join(" ") });
    };

    console.error = (...args) => {
      originalError(...args);
      capturedOutput.push({ type: "error", message: args.join(" ") });
    };

    console.warn = (...args) => {
      originalWarn(...args);
      capturedOutput.push({ type: "warn", message: args.join(" ") });
    };

    console.info = (...args) => {
      originalInfo(...args);
      capturedOutput.push({ type: "info", message: args.join(" ") });
    };

    try {
      // Create a safe execution context
      const result = new Function(code)();

      // Add captured console output
      capturedOutput.forEach((output) => {
        setConsoleOutput((prev) => [
          ...prev,
          {
            id: Date.now() + Math.random(),
            type: output.type,
            message: output.message,
            timestamp: new Date().toLocaleTimeString(),
          },
        ]);
      });

      if (result !== undefined) {
        setConsoleOutput((prev) => [
          ...prev,
          {
            id: Date.now() + Math.random(),
            type: "result",
            message: String(result),
            timestamp: new Date().toLocaleTimeString(),
          },
        ]);
      }
    } catch (error) {
      setConsoleOutput((prev) => [
        ...prev,
        {
          id: Date.now() + Math.random(),
          type: "error",
          message: error.message,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    } finally {
      // Restore original console methods
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
      console.info = originalInfo;
    }
  };

  const handleOpenRename = () => {
    if (!isOwner || !roomInfo?.name) return;
    setNewRoomName(roomInfo.name);
    setShowRenameModal(true);
    setShowFileMenu(false);
  };

  const handleOpenExport = () => {
    setExportFileName(roomId || "code");
    setShowExportModal(true);
    setShowFileMenu(false);
  };

  const handleExportFile = () => {
    const code = editorRef.current?.getValue() || "";
    if (!code.trim()) {
      alert("No code to export!");
      return;
    }

    const fileName = exportFileName.trim() || "code";
    const fullFileName = `${fileName}.${exportFileType}`;

    // Create a blob with the code content
    const blob = new Blob([code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);

    // Create a temporary link and trigger download
    const link = document.createElement("a");
    link.href = url;
    link.download = fullFileName;
    document.body.appendChild(link);
    link.click();

    // Cleanup
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setShowExportModal(false);
  };

  const submitRename = async () => {
    if (!newRoomName.trim()) return;
    setActionLoading(true);
    try {
      const resp = await fetch(
        `http://localhost:3001/api/rooms/${encodeURIComponent(roomId)}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ newName: newRoomName.trim() }),
        }
      );
      if (resp.ok) {
        await resp.json();
        setShowRenameModal(false);
        // Navigate to new route so providers reconnect with the new name
        navigate(`/room/${newRoomName.trim()}`);
      } else {
        const err = await resp.json();
        alert(err.error || "Failed to rename room");
      }
    } catch (e) {
      console.error("Rename error", e);
      alert("Network error renaming room");
    } finally {
      setActionLoading(false);
    }
  };

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

  function hexToRgba(hex, alpha) {
    let c = hex.replace("#", "");
    if (c.length === 3) {
      c = c
        .split("")
        .map((x) => x + x)
        .join("");
    }
    const r = parseInt(c.substring(0, 2), 16);
    const g = parseInt(c.substring(2, 4), 16);
    const b = parseInt(c.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  function getInitials(name) {
    const n = (name || "").trim();
    if (!n) return "?";
    const parts = n.split(/\s+/);
    const first = parts[0]?.[0] || "";
    const last = parts[1]?.[0] || "";
    return (first + last).toUpperCase() || first.toUpperCase();
  }

  // Share room with a user
  const shareRoom = async (email) => {
    if (!email.trim()) return;

    setSharing(true);
    try {
      const response = await fetch(
        `http://localhost:3001/api/rooms/${roomId}/share`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ email: email.trim() }),
        }
      );

      if (response.ok) {
        await response.json();
        // Refresh room info to show updated sharing
        const roomResponse = await fetch(
          `http://localhost:3001/api/rooms/${roomId}/access`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (roomResponse.ok) {
          const roomData = await roomResponse.json();
          setRoomInfo(roomData.room);
        }
        setShareEmail("");
        alert(`Room shared successfully with ${email}`);
      } else {
        const errorData = await response.json();
        alert(`Failed to share room: ${errorData.error}`);
      }
    } catch (error) {
      console.error("Error sharing room:", error);
      alert("Error sharing room. Please try again.");
    } finally {
      setSharing(false);
    }
  };

  function ensureBaseCursorStylesInjected() {
    if (styleElRef.current) return;
    const styleEl = document.createElement("style");
    styleEl.type = "text/css";
    styleEl.innerHTML = `
      .yselection { position: relative; }
      /* Solid caret line */
      .ycursor-caret { display: inline-block; width: 2px; height: 1.2em; background: currentColor; vertical-align: text-top; }

      /* Google Docs-like bubble above caret (compact by default) */
      .ycursor-bubble { position: absolute; transform: translate(-50%, -2px); top: 0; height: 14px; border-radius: 6px; color: #fff; font-size: 10px; line-height: 14px; white-space: nowrap; box-shadow: 0 2px 6px rgba(0,0,0,0.18); pointer-events: auto; display: inline-flex; align-items: center; border: 1px solid var(--yc, #555); background: transparent; }
      .ycursor-bubble .cap { display: block; width: 8px; height: 100%; border-radius: 6px; background: var(--yc, #555); }
      .ycursor-bubble .label { display: none; padding: 0 6px; font-weight: 700; letter-spacing: 0.1px; }
      .ycursor-bubble[data-active="1"] { background: var(--yc, #555); }
      .ycursor-bubble[data-active="1"] .cap { display: none; }
      .ycursor-bubble[data-active="1"] .label { display: inline; }
      .ycursor-bubble:hover { background: var(--yc, #555); }
      .ycursor-bubble:hover .cap { display: none; }
      .ycursor-bubble:hover .label { display: inline; }
    `;
    document.head.appendChild(styleEl);
    styleElRef.current = styleEl;
  }

  function upsertUserCursorStyles(userId, color) {
    ensureBaseCursorStylesInjected();
    const id = String(userId || "anonymous");
    const existing = document.getElementById(`ycursor-style-${id}`);
    const rgba = hexToRgba(color, 0.18);
    const css = `
      .ycursor-caret-${id} { color: ${color}; }
      .yselection-${id} { background: ${rgba}; }
      .ycursor-label-${id} { --yc: ${color}; }
    `;
    if (existing) {
      existing.textContent = css;
      return;
    }
    const styleEl = document.createElement("style");
    styleEl.type = "text/css";
    styleEl.id = `ycursor-style-${id}`;
    styleEl.textContent = css;
    document.head.appendChild(styleEl);
  }

  function handleEditorMount(editor) {
    editorRef.current = editor;
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

    function publishLocalSelection(partial = {}) {
      try {
        const model = editor.getModel();
        const sel = editor.getSelection();
        const existing = awareness.getLocalState() || {};
        const payload = { ...existing, ...partial };
        if (model && sel) {
          const anchorOffset = model.getOffsetAt({
            lineNumber: sel.selectionStartLineNumber,
            column: sel.selectionStartColumn,
          });
          const headOffset = model.getOffsetAt({
            lineNumber: sel.positionLineNumber,
            column: sel.positionColumn,
          });
          payload.selection = {
            anchor: anchorOffset,
            head: headOffset,
          };
        }
        awareness.setLocalState(payload);
      } catch (e) {
        console.warn("Failed to publish local selection", e);
      }
    }

    function setTypingActive() {
      publishLocalSelection({ typing: true });
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        publishLocalSelection({ typing: false });
      }, 900);
    }

    function ensureTypingLabel(userObj, position, isActive) {
      const editor = editorRef.current;
      if (!editor) return;
      const id = userObj.id;
      const key = String(id);
      const color = userObj.color || getColorForId(userObj.id || userObj.name);
      upsertUserCursorStyles(userObj.id, color);

      let rec = contentWidgetsRef.current[key];
      if (!rec) {
        const dom = document.createElement("div");
        dom.className = `ycursor-bubble ycursor-label-${key}`;
        dom.setAttribute("data-active", isActive ? "1" : "0");

        const cap = document.createElement("span");
        cap.className = "cap";

        const label = document.createElement("span");
        label.className = "label";
        label.textContent = userObj.name;

        dom.appendChild(cap);
        dom.appendChild(label);

        const widgetRecord = { position, dom, manualActive: false };
        const widget = {
          getId: () => `ycursor-label-${key}`,
          getDomNode: () => dom,
          getPosition: () => ({
            position: widgetRecord.position,
            preference: [
              window.monaco?.editor?.ContentWidgetPositionPreference?.ABOVE,
              0,
            ].filter(Boolean),
          }),
        };
        widgetRecord.widget = widget;
        try {
          editor.addContentWidget(widget);
        } catch (e) {
          console.warn("Failed to add content widget", e);
        }
        // Toggle expand on click
        dom.addEventListener("click", (ev) => {
          ev.stopPropagation();
          widgetRecord.manualActive = !widgetRecord.manualActive;
          dom.setAttribute(
            "data-active",
            widgetRecord.manualActive ? "1" : "0"
          );
          try {
            editor.layoutContentWidget(widget);
          } catch (e) {
            console.warn("Failed to layout content widget after click", e);
          }
        });
        contentWidgetsRef.current[key] = widgetRecord;
        rec = widgetRecord;
      }

      // update position and active state (typing OR manual toggle)
      rec.position = position;
      const effectiveActive = isActive || rec.manualActive;
      rec.dom.setAttribute("data-active", effectiveActive ? "1" : "0");
      try {
        editor.layoutContentWidget(rec.widget);
      } catch (e) {
        console.warn("Failed to layout content widget", e);
      }
    }

    function removeTypingLabel(userObj) {
      const editor = editorRef.current;
      if (!editor) return;
      const key = String(userObj.id);
      const rec = contentWidgetsRef.current[key];
      if (rec) {
        try {
          editor.removeContentWidget(rec.widget);
        } catch (e) {
          console.warn("Failed to remove content widget", e);
        }
        delete contentWidgetsRef.current[key];
      }
    }

    function renderRemoteCursors() {
      const editor = editorRef.current;
      const model = editor?.getModel();
      if (!editor || !model) return;
      const clientId = awareness.clientID;
      const states = awareness.getStates();

      states.forEach((state, key) => {
        if (key === clientId) return; // skip local
        const u = state?.user;
        const sel = state?.selection;
        if (
          !u ||
          !sel ||
          typeof sel.anchor !== "number" ||
          typeof sel.head !== "number"
        ) {
          // Clear decorations for this user if present
          const prev = decorationsRef.current[u?.id];
          if (prev) {
            try {
              editor.deltaDecorations(prev, []);
            } catch (e) {
              console.warn("Failed to clear user decorations", e);
            }
            delete decorationsRef.current[u.id];
          }
          removeTypingLabel({ id: u?.id });
          return;
        }

        const color = u.color || getColorForId(u.id || u.name);
        upsertUserCursorStyles(u.id, color);

        const anchorPos = model.getPositionAt(sel.anchor);
        const headPos = model.getPositionAt(sel.head);

        const startPos = sel.anchor <= sel.head ? anchorPos : headPos;
        const endPos = sel.anchor <= sel.head ? headPos : anchorPos;

        const newDecorations = [];

        // Selection highlight (only if not collapsed)
        if (sel.anchor !== sel.head) {
          newDecorations.push({
            range: {
              startLineNumber: startPos.lineNumber,
              startColumn: startPos.column,
              endLineNumber: endPos.lineNumber,
              endColumn: endPos.column,
            },
            options: {
              className: `yselection yselection-${u.id}`,
              isWholeLine: false,
            },
          });
        }

        // Caret at head position (always visible)
        const caretPos = headPos;
        newDecorations.push({
          range: {
            startLineNumber: caretPos.lineNumber,
            startColumn: caretPos.column,
            endLineNumber: caretPos.lineNumber,
            endColumn: caretPos.column,
          },
          options: {
            afterContentClassName: `ycursor-caret ycursor-caret-${u.id}`,
            hoverMessage: [{ value: `${u.name}` }],
            stickiness: 1,
          },
        });

        const prev = decorationsRef.current[u.id] || [];
        let applied = [];
        try {
          applied = editor.deltaDecorations(prev, newDecorations);
        } catch (e) {
          console.warn("Failed to apply decorations", e);
        }
        decorationsRef.current[u.id] = applied;

        // Typing label: always render a bubble; expand when typing or on hover
        const isActive = !!state?.typing;
        ensureTypingLabel(u, headPos, isActive);
      });
    }

    awareness.on("change", () => {
      updateOnlineUsers();
      renderRemoteCursors();
    });

    editor.onDidChangeCursorSelection(() => {
      publishLocalSelection();
    });
    editor.onDidChangeCursorPosition(() => {
      publishLocalSelection();
    });
    editor.onDidFocusEditorText(() => {
      publishLocalSelection();
    });
    editor.onDidType(() => {
      setTypingActive();
    });
    editor.onKeyDown(() => {
      setTypingActive();
    });

    // Initial publish and render
    publishLocalSelection();
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

            // Document is ready - render cursors
            renderRemoteCursors();
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
      // re-render remote cursors to keep positions correct
      try {
        renderRemoteCursors();
      } catch (e) {
        console.warn("Failed to re-render remote cursors after text change", e);
      }
      console.log("📝 Text changed:", event.changes);
    });

    // Handle connection errors
    provider.on("connection-error", (err) => {
      console.error("❌ WebSocket connection error:", err);
      setConnectionStatus("Connection Error");
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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300">
            Checking access...
          </h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">🚫</div>
          <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">🔒</div>
          <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
            No Access
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
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

  // Modal component
  const SharedWithModal = () => {
    if (!showSharedModal || !roomInfo) return null;

    const owner = roomInfo.owner;
    const shared = roomInfo.sharedWith || [];

    const handleShare = (e) => {
      e.preventDefault();
      if (shareEmail.trim() && !sharing) {
        shareRoom(shareEmail);
      }
    };

    return (
      <div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        onClick={() => setShowSharedModal(false)}
      >
        <div
          className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96 max-w-md mx-4 max-h-[80vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Share Room
            </h3>
            <button
              onClick={() => setShowSharedModal(false)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <div className="space-y-4">
            {/* Share with new user */}
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                Share with someone new
              </div>
              <form
                onSubmit={handleShare}
                className="flex space-x-2"
                onKeyDown={(e) => e.stopPropagation()}
              >
                <input
                  ref={shareEmailRef}
                  key="share-email-input"
                  type="email"
                  value={shareEmail}
                  onChange={(e) => setShareEmail(e.target.value)}
                  onKeyDown={(e) => {
                    e.stopPropagation();
                    e.nativeEvent.stopImmediatePropagation();
                  }}
                  onKeyUp={(e) => {
                    e.stopPropagation();
                    e.nativeEvent.stopImmediatePropagation();
                  }}
                  onInput={(e) => e.stopPropagation()}
                  placeholder="Enter username"
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  autoComplete="email"
                />
                <button
                  type="submit"
                  disabled={sharing || !shareEmail.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sharing ? "Sharing..." : "Share"}
                </button>
              </form>
            </div>

            {/* Owner */}
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                Owner
              </div>
              <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded">
                <span className="text-gray-900 dark:text-white text-sm">
                  {owner?.displayName || owner?.username}
                </span>
                <span className="text-xs text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900 px-2 py-0.5 rounded-full">
                  Owner
                </span>
              </div>
            </div>

            {/* Shared with */}
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                Shared with
              </div>
              {shared.length === 0 ? (
                <div className="text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded">
                  Not shared with anyone yet
                </div>
              ) : (
                <div className="space-y-2">
                  {shared.map(
                    (s) =>
                      s.user && (
                        <div
                          key={s.user._id}
                          className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded"
                        >
                          <span className="text-gray-900 dark:text-white text-sm">
                            {s.user.displayName || s.user.username}
                          </span>
                          <span className="text-xs text-gray-600 dark:text-gray-400">
                            {new Date(s.sharedAt).toLocaleDateString()}
                          </span>
                        </div>
                      )
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      {/* Header Bar */}
      <div className="relative z-20 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        {/* Top Row - Room Name and Actions */}
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Document Icon - Clickable Home Button */}
            <button
              onClick={() => navigate("/")}
              className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center hover:bg-blue-700 transition-colors"
              title="Home"
            >
              <svg
                className="w-5 h-5 text-white"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                  clipRule="evenodd"
                />
              </svg>
            </button>

            {/* Room Name */}
            <h1 className="text-xl font-medium text-gray-900 dark:text-white">
              {roomId}
            </h1>
          </div>

          {/* Right Side - Status and Collaboration */}
          <div className="flex items-center space-x-3">
            {/* Connection Status */}
            <div className="flex items-center space-x-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  isConnected ? "bg-green-500" : "bg-red-500"
                }`}
              ></div>
              {(!isConnected || showStatusText) && (
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  {connectionStatus}
                </span>
              )}
            </div>

            {/* Online Users */}
            <div className="hidden sm:flex items-center space-x-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Online:
              </span>
              <div className="flex items-center -space-x-2">
                {onlineUsers.map((u) => (
                  <div key={`${u.id}-${u.name}`} className="relative group">
                    <div
                      className="relative inline-flex items-center justify-center h-6 w-6 rounded-full ring-2 ring-white dark:ring-gray-800 text-white text-[10px] font-medium"
                      title={u.name}
                      aria-label={u.name}
                      style={{ backgroundColor: u.color }}
                    >
                      {getInitials(u.name)}
                    </div>
                    <div className="pointer-events-none absolute z-50 top-2 left-1/2 -translate-x-1/2 translate-y-full whitespace-nowrap rounded px-2 py-1 text-xs text-white bg-gray-900/90 dark:bg-gray-100/90 dark:text-gray-900 opacity-0 group-hover:opacity-100 transition-opacity shadow-md">
                      {u.name}
                      <div className="absolute left-1/2 -top-1 -translate-x-1/2 border-4 border-transparent border-b-gray-900/90 dark:border-b-gray-100/90"></div>
                    </div>
                  </div>
                ))}
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {onlineUsers.length}
              </span>
            </div>

            {/* Chat Button removed per layout change */}

            {/* Console Button */}
            <button
              onClick={() => setShowConsole(!showConsole)}
              className={`p-2 rounded-md transition-colors ${
                showConsole
                  ? "bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
              title={showConsole ? "Hide console" : "Show console"}
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
                  d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </button>

            {/* Share Button */}
            {hasAccess && (
              <button
                onClick={() => setShowSharedModal(true)}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
                title="Share room"
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
                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684z"
                  />
                </svg>
              </button>
            )}

            {/* Chat Toggle (moved to top bar next to Share) */}
            <button
              onClick={() => setShowChat(!showChat)}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
              title={showChat ? "Hide chat" : "Show chat"}
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
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Bottom Row - File Menu */}
        <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              {/* File menu */}
              <div className="relative">
                <button
                  onClick={() => setShowFileMenu((v) => !v)}
                  className="px-3 py-1 text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
                  title="File"
                >
                  File
                  <span className="ml-1">▾</span>
                </button>
                {showFileMenu && (
                  <div
                    className="absolute left-0 mt-2 w-52 bg-white dark:bg-gray-800 rounded-md shadow-lg ring-1 ring-gray-200 dark:ring-gray-700 z-50"
                    role="menu"
                  >
                    <button
                      onClick={handleOpenExport}
                      className="w-full text-left px-3 py-2 text-sm text-gray-800 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700"
                      role="menuitem"
                    >
                      Export Code
                    </button>
                    <button
                      onClick={handleOpenRename}
                      disabled={!isOwner}
                      className={`w-full text-left px-3 py-2 text-sm ${
                        isOwner
                          ? "text-gray-800 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700"
                          : "text-gray-400 dark:text-gray-500 cursor-not-allowed"
                      }`}
                      role="menuitem"
                    >
                      Rename
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col h-[calc(100vh-88px)]">
        {/* Editor Section */}
        <div
          className="relative"
          style={{
            height: showConsole ? `calc(100% - ${consoleHeight}px)` : "100%",
          }}
        >
          <Editor
            height="100%"
            defaultLanguage="javascript"
            theme={theme === "dark" ? "vs-dark" : "light"}
            onMount={handleEditorMount}
          />
        </div>

        {/* Console Panel - Always present but can be collapsed */}
        <div
          className="bg-gray-900 border-t border-gray-700 flex flex-col"
          style={{
            height: showConsole ? `${consoleHeight}px` : "0px",
            overflow: "hidden",
          }}
        >
          {/* Resize Handle */}
          {showConsole && (
            <div
              ref={resizeRef}
              onMouseDown={handleMouseDown}
              className="h-1 bg-gray-600 hover:bg-gray-500 cursor-ns-resize flex items-center justify-center group"
            >
              <div className="w-8 h-0.5 bg-gray-400 group-hover:bg-gray-300 rounded"></div>
            </div>
          )}

          {/* Console Header */}
          <div className="bg-gray-800 text-white px-4 py-2 flex justify-between items-center border-b border-gray-700">
            <div className="flex items-center space-x-3">
              <h3 className="font-semibold">Console</h3>
              <div className="flex items-center space-x-2 text-xs text-gray-400">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Ready</span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setConsoleOutput([])}
                className="text-gray-400 hover:text-white text-sm px-2 py-1 rounded hover:bg-gray-700"
                title="Clear console"
              >
                Clear
              </button>
              <button
                onClick={() => setShowConsole(false)}
                className="text-gray-400 hover:text-white focus:outline-none p-1 rounded hover:bg-gray-700"
                title="Hide console"
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
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Console Output */}
          <div className="flex-1 overflow-y-auto p-3 space-y-1 font-mono text-sm">
            {consoleOutput.length === 0 ? (
              <div className="text-gray-500 text-center py-8">
                <div className="text-2xl mb-2">⚡</div>
                <p>Console ready. Click Run to execute your code.</p>
              </div>
            ) : (
              consoleOutput.map((item) => (
                <div key={item.id} className="flex items-start space-x-2">
                  <span className="text-gray-500 text-xs mt-0.5 min-w-[40px]">
                    {item.timestamp}
                  </span>
                  <span
                    className={`flex-1 ${
                      item.type === "error"
                        ? "text-red-400"
                        : item.type === "warn"
                        ? "text-yellow-400"
                        : item.type === "info"
                        ? "text-blue-400"
                        : item.type === "input"
                        ? "text-green-400"
                        : item.type === "result"
                        ? "text-white"
                        : "text-gray-300"
                    }`}
                  >
                    {item.message}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      {/* Rename Modal */}
      {showRenameModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowRenameModal(false)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96 max-w-md mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Rename Room
              </h3>
              <button
                onClick={() => setShowRenameModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="rename-input"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  New name
                </label>
                <input
                  id="rename-input"
                  type="text"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && submitRename()}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter new room name"
                  autoFocus
                />
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={submitRename}
                  disabled={!newRoomName.trim() || actionLoading}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {actionLoading ? "Saving..." : "Save"}
                </button>
                <button
                  onClick={() => setShowRenameModal(false)}
                  className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Export Modal */}
      {showExportModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowExportModal(false)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96 max-w-md mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Export Code
              </h3>
              <button
                onClick={() => setShowExportModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="export-filename"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  File name
                </label>
                <input
                  id="export-filename"
                  type="text"
                  value={exportFileName}
                  onChange={(e) => setExportFileName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleExportFile()}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter file name"
                  autoFocus
                />
              </div>
              <div>
                <label
                  htmlFor="export-filetype"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  File type
                </label>
                <select
                  id="export-filetype"
                  value={exportFileType}
                  onChange={(e) => setExportFileType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="js">JavaScript (.js)</option>
                  <option value="jsx">React (.jsx)</option>
                  <option value="ts">TypeScript (.ts)</option>
                  <option value="tsx">React TypeScript (.tsx)</option>
                  <option value="py">Python (.py)</option>
                  <option value="java">Java (.java)</option>
                  <option value="cpp">C++ (.cpp)</option>
                  <option value="c">C (.c)</option>
                  <option value="html">HTML (.html)</option>
                  <option value="css">CSS (.css)</option>
                  <option value="json">JSON (.json)</option>
                  <option value="xml">XML (.xml)</option>
                  <option value="md">Markdown (.md)</option>
                  <option value="txt">Text (.txt)</option>
                </select>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handleExportFile}
                  disabled={!exportFileName.trim()}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Export
                </button>
                <button
                  onClick={() => setShowExportModal(false)}
                  className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <SharedWithModal />
      <Chat
        roomName={roomId}
        isVisible={showChat}
        onToggle={() => setShowChat(!showChat)}
      />
      {/* Floating Run Button (bottom-right) */}
      <button
        onClick={() => {
          const code = editorRef.current?.getValue() || "";
          executeEditorCode(code);
          if (!showConsole) setShowConsole(true);
        }}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-green-600 hover:bg-green-700 text-white shadow-lg focus:outline-none focus:ring-2 focus:ring-green-500 flex items-center justify-center"
        title="Run Code"
        aria-label="Run code"
      >
        <svg
          className="w-6 h-6"
          fill="currentColor"
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path d="M6.5 5.5v9l8-4.5-8-4.5z" />
        </svg>
      </button>
    </div>
  );
}
