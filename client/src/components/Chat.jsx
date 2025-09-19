import { useState, useEffect, useRef } from "react";
import { useAuth } from "../hooks/useAuth";
import { useTheme } from "../hooks/useTheme";
import { io } from "socket.io-client";

export default function Chat({ roomName, isVisible, onToggle }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [socket, setSocket] = useState(null);
  const messagesEndRef = useRef(null);
  const { token, user } = useAuth();
  const { theme } = useTheme();

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize socket connection
  useEffect(() => {
    if (roomName) {
      const newSocket = io("http://localhost:3001", {
        auth: {
          token: token,
        },
      });

      newSocket.on("connect", () => {
        console.log("Connected to chat server");
        // Authenticate with the server
        newSocket.emit("authenticate", token);
        // Join room after authentication
        setTimeout(() => {
          newSocket.emit("joinRoom", roomName);
        }, 100);
      });

      newSocket.on("newMessage", (message) => {
        setMessages((prev) => [...prev, message]);
      });

      // Listen for user join/leave events
      newSocket.on("userJoined", (data) => {
        if (window.addNotification) {
          window.addNotification(data.message, "join", 4000);
        }
      });

      newSocket.on("userLeft", (data) => {
        if (window.addNotification) {
          window.addNotification(data.message, "leave", 4000);
        }
      });

      newSocket.on("disconnect", () => {
        console.log("Disconnected from chat server");
      });

      setSocket(newSocket);

      return () => {
        newSocket.emit("leaveRoom", roomName);
        newSocket.disconnect();
      };
    }
  }, [roomName, token]);

  // Fetch chat history
  useEffect(() => {
    const fetchMessages = async () => {
      if (!roomName) return;

      try {
        setLoading(true);
        const response = await fetch(
          `http://localhost:3001/api/rooms/${roomName}/messages`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          setMessages(data);
        } else {
          console.error("Failed to fetch messages");
        }
      } catch (error) {
        console.error("Error fetching messages:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [roomName, token]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !socket) return;

    try {
      const response = await fetch(
        `http://localhost:3001/api/rooms/${roomName}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ message: newMessage.trim() }),
        }
      );

      if (response.ok) {
        setNewMessage("");
      } else {
        console.error("Failed to send message");
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString();
    }
  };

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={onToggle}
          className="bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          title="Open Chat"
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
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-80 h-96 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 flex flex-col z-50">
      {/* Chat Header */}
      <div className="bg-blue-600 text-white p-3 rounded-t-lg flex justify-between items-center">
        <h3 className="font-semibold">Chat - {roomName}</h3>
        <button
          onClick={onToggle}
          className="text-white hover:text-gray-200 focus:outline-none"
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
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 py-8">
            <div className="text-4xl mb-2">💬</div>
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message, index) => {
            const isCurrentUser = message.user._id === user.id;
            const showDate =
              index === 0 ||
              formatDate(message.timestamp) !==
                formatDate(messages[index - 1].timestamp);

            return (
              <div key={message._id}>
                {showDate && (
                  <div className="text-center text-xs text-gray-400 dark:text-gray-500 py-2">
                    {formatDate(message.timestamp)}
                  </div>
                )}
                <div
                  className={`flex ${
                    isCurrentUser ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-xs px-3 py-2 rounded-lg ${
                      isCurrentUser
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
                    }`}
                  >
                    {!isCurrentUser && (
                      <div className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
                        {message.user.displayName || message.user.username}
                      </div>
                    )}
                    <div className="text-sm">{message.message}</div>
                    <div
                      className={`text-xs mt-1 ${
                        isCurrentUser
                          ? "text-blue-100"
                          : "text-gray-500 dark:text-gray-400"
                      }`}
                    >
                      {formatTime(message.timestamp)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-700">
        <form onSubmit={handleSendMessage} className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
            disabled={!socket}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || !socket}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
