import React from "react";
import ReactDOM from "react-dom/client"
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from './App.jsx'
import CodeEditor from "./components/CodeEditor.jsx";

ReactDOM.createRoot(document.getElementById('root')).render(

  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/room/:roomId" element={<CodeEditor />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
)

