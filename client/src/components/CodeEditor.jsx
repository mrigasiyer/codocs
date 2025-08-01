import Editor from "@monaco-editor/react";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { MonacoBinding } from "y-monaco";

export default function CodeEditor() {
  function handleEditorMount(editor) {
    const ydoc = new Y.Doc();

    // ✅ Connect to Yjs server
    const provider = new WebsocketProvider(
      "ws://localhost:3001",
      "codocs-room",
      ydoc
    );

    const yText = ydoc.getText("codocs");

    provider.on("status", (event) => {
      console.log("Yjs status:", event.status);
    });

    new MonacoBinding(
      yText,
      editor.getModel(),
      new Set([editor]),
      provider.awareness
    );
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
