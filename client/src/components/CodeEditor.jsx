import Editor from "@monaco-editor/react";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { MonacoBinding } from "y-monaco";
import { useParams } from "react-router-dom";
import { useEffect, useRef } from "react";

export default function CodeEditor() {
  const { roomId } = useParams();
  const providerRef = useRef(null);
  const ydocRef = useRef(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (providerRef.current) {
        providerRef.current.disconnect();
      }
    };
  }, []);

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

    provider.on("status", (event) => {
      console.log("Yjs status:", event.status);
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

            // Only set initial content if text is truly empty and this is a new document
            if (currentLength === 0) {
              console.log("📝 Setting initial content for empty document");
              yText.insert(0, "// Start coding together...\n");
            } else {
              console.log(
                "📝 Document already has content, not adding default text"
              );
              console.log("📝 Content length:", currentLength);
              console.log(
                "📝 Content preview:",
                currentContent.substring(0, 100)
              );
            }
          }, 100); // Small delay to ensure full sync

          initializedRef.current = true;
          console.log("✅ Monaco binding completed and initialized");
        } catch (err) {
          console.error("❌ Error creating Monaco binding:", err);
        }
      } else if (isSynced && initializedRef.current) {
        console.log("🔄 Document already initialized, skipping setup");
      }
    });

    // Listen for text changes
    yText.observe((event) => {
      console.log("📝 Text changed:", event.changes);
      console.log("📝 Current text length:", yText.length);
      console.log("📝 Text preview:", yText.toString().substring(0, 100));

      // Log if we're getting duplicate content
      const text = yText.toString();
      const defaultTextCount = (
        text.match(/\/\/ Start coding together\.\.\./g) || []
      ).length;
      if (defaultTextCount > 1) {
        console.warn(
          `⚠️  Warning: Found ${defaultTextCount} instances of default text!`
        );
      }
    });

    // Handle connection errors
    provider.on("connection-error", (err) => {
      console.error("❌ WebSocket connection error:", err);
    });

    // Handle connection close
    provider.on("close", () => {
      console.log("🔌 WebSocket connection closed");
    });

    // Debug: Log document state
    console.log("📄 Initial document state:", {
      roomId,
      textLength: yText.length,
      textContent: yText.toString().substring(0, 100),
    });
  }

  return (
    <Editor
      height="90vh"
      defaultLanguage="javascript"
      defaultValue="// Start coding together..."
      onMount={handleEditorMount}
    />
  );
}
