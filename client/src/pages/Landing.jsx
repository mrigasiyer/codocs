import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import ThemeToggle from "../components/ThemeToggle";

export default function Landing() {
  const navigate = useNavigate();
  const [scrollY, setScrollY] = useState(0);
  const [typedText, setTypedText] = useState("");
  const [cursorVisible, setCursorVisible] = useState(true);
  const [activeSection, setActiveSection] = useState("home");

  const fullText = "const magic = 'Real-time collaboration';";

  // Typing animation effect
  useEffect(() => {
    let timeout;
    if (typedText.length < fullText.length) {
      timeout = setTimeout(() => {
        setTypedText(fullText.slice(0, typedText.length + 1));
      }, 100);
    }
    return () => clearTimeout(timeout);
  }, [typedText]);

  // Cursor blink effect
  useEffect(() => {
    const interval = setInterval(() => {
      setCursorVisible((v) => !v);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Scroll tracking
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);

      // Update active section based on scroll position
      const sections = ["home", "stats", "features", "demo"];
      const current = sections.find((section) => {
        const element = document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          return rect.top <= 100 && rect.bottom >= 100;
        }
        return false;
      });
      if (current) setActiveSection(current);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Smooth scroll to section
  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Parallax offset for floating elements
  const parallaxOffset = scrollY * 0.5;

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 overflow-hidden">
      {/* Floating Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute top-20 left-10 w-72 h-72 bg-blue-400/10 dark:bg-blue-600/10 rounded-full blur-3xl"
          style={{ transform: `translateY(${parallaxOffset * 0.5}px)` }}
        ></div>
        <div
          className="absolute top-1/3 right-20 w-96 h-96 bg-purple-400/10 dark:bg-purple-600/10 rounded-full blur-3xl"
          style={{ transform: `translateY(${parallaxOffset * 0.3}px)` }}
        ></div>
        <div
          className="absolute bottom-20 left-1/3 w-80 h-80 bg-pink-400/10 dark:bg-pink-600/10 rounded-full blur-3xl"
          style={{ transform: `translateY(${-parallaxOffset * 0.4}px)` }}
        ></div>
      </div>

      {/* Header with Navigation */}
      <header className="fixed top-0 w-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800 z-50">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <img
                src="/logo.jpg"
                alt="Codocs"
                className="h-8 w-8 rounded-md object-cover ring-2 ring-blue-500/20"
              />
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                Codocs
              </span>
            </div>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-8">
              <button
                onClick={() => scrollToSection("home")}
                className={`text-sm font-medium transition-colors ${
                  activeSection === "home"
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                Home
              </button>
              <button
                onClick={() => scrollToSection("stats")}
                className={`text-sm font-medium transition-colors ${
                  activeSection === "stats"
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                Why Codocs
              </button>
              <button
                onClick={() => scrollToSection("features")}
                className={`text-sm font-medium transition-colors ${
                  activeSection === "features"
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                Features
              </button>
              <button
                onClick={() => scrollToSection("demo")}
                className={`text-sm font-medium transition-colors ${
                  activeSection === "demo"
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                Demo
              </button>
            </div>

            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <button
                onClick={() => navigate("/login")}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Sign in
              </button>
              <button
                onClick={() => navigate("/login?mode=register")}
                className="px-4 py-2 text-sm font-medium bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg shadow-blue-500/25"
              >
                Get Started
              </button>
            </div>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section
        id="home"
        className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 min-h-screen flex items-center"
      >
        <div className="max-w-7xl mx-auto w-full">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Text Content */}
            <div className="space-y-8">
              <div
                className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-full border border-blue-200 dark:border-blue-800"
                style={{
                  animation: "fadeInUp 0.6s ease-out",
                }}
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>
                <span className="text-sm font-medium text-blue-600 dark:text-blue-400 font-mono">
                  // sync: true
                </span>
              </div>

              <h1
                className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 dark:text-white leading-tight"
                style={{
                  animation: "fadeInUp 0.6s ease-out 0.1s both",
                }}
              >
                <span className="font-mono">{"> "}</span>Code together,
                <br />
                <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 dark:from-blue-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
                  ship faster
                </span>
                <span className="animate-pulse">_</span>
              </h1>

              <p
                className="max-w-2xl text-xl text-gray-600 dark:text-gray-400 leading-relaxed"
                style={{
                  animation: "fadeInUp 0.6s ease-out 0.2s both",
                }}
              >
                A collaborative code editor powered by{" "}
                <span className="font-mono text-blue-600 dark:text-blue-400">
                  CRDT magic
                </span>
                . Write, share, and execute code with your team in real-time.{" "}
                <span className="font-mono text-gray-500 dark:text-gray-500">
                  // No git push required
                </span>
              </p>

              <div
                className="flex flex-col sm:flex-row items-start sm:items-center gap-4"
                style={{
                  animation: "fadeInUp 0.6s ease-out 0.3s both",
                }}
              >
                <button
                  onClick={() => navigate("/login?mode=register")}
                  className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 shadow-xl shadow-blue-500/25 flex items-center space-x-2"
                >
                  <span className="font-mono">$ start hacking</span>
                  <svg
                    className="w-5 h-5 group-hover:translate-x-1 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                </button>
                <div className="flex items-center space-x-3 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex -space-x-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 ring-2 ring-white dark:ring-gray-900 flex items-center justify-center text-white text-xs font-bold">
                      &lt;/&gt;
                    </div>
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 ring-2 ring-white dark:ring-gray-900 flex items-center justify-center text-white text-xs font-bold">
                      {}
                    </div>
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-pink-600 ring-2 ring-white dark:ring-gray-900 flex items-center justify-center text-white text-xs font-bold">
                      []
                    </div>
                  </div>
                  <span className="font-medium font-mono">
                    <span className="text-purple-600 dark:text-purple-400">
                      const
                    </span>{" "}
                    fun ={" "}
                    <span className="text-green-600 dark:text-green-400">
                      true
                    </span>
                    ;
                  </span>
                </div>
              </div>
            </div>

            {/* Right Column - Animated Code Editor */}
            <div
              className="relative"
              style={{
                animation: "fadeInRight 0.8s ease-out 0.4s both",
              }}
            >
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000 animate-pulse"></div>
                <div className="relative bg-gray-900 rounded-2xl overflow-hidden border border-gray-800 shadow-2xl">
                  {/* Window Controls */}
                  <div className="flex items-center justify-between px-4 py-3 bg-gray-800 border-b border-gray-700">
                    <div className="flex space-x-2">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    </div>
                    <div className="flex-1 text-center">
                      <span className="text-xs text-gray-400 font-mono">
                        project.js
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                        <span className="text-xs text-gray-400">Sarah</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <span className="text-xs text-gray-400">You</span>
                      </div>
                    </div>
                  </div>
                  {/* Code Content with Typing Animation */}
                  <div className="p-6 font-mono text-sm">
                    <div className="space-y-2">
                      <div className="flex">
                        <span className="text-gray-600 w-8 text-right mr-4">
                          1
                        </span>
                        <span className="text-blue-300">{typedText}</span>
                        <span
                          className={`inline-block w-2 h-5 bg-green-500 ml-1 ${
                            cursorVisible ? "opacity-100" : "opacity-0"
                          }`}
                        ></span>
                      </div>
                      <div className="flex">
                        <span className="text-gray-600 w-8 text-right mr-4">
                          2
                        </span>
                      </div>
                      <div className="flex">
                        <span className="text-gray-600 w-8 text-right mr-4">
                          3
                        </span>
                        <span className="text-purple-400">function</span>
                        <span className="text-yellow-300 ml-2">
                          collaborate
                        </span>
                        <span className="text-white">() {"{"}</span>
                      </div>
                      <div className="flex">
                        <span className="text-gray-600 w-8 text-right mr-4">
                          4
                        </span>
                        <span className="text-purple-400 ml-4">return</span>
                        <span className="text-green-300 ml-2">
                          "Build amazing things"
                        </span>
                        <span className="text-white">;</span>
                      </div>
                      <div className="flex">
                        <span className="text-gray-600 w-8 text-right mr-4">
                          5
                        </span>
                        <span className="text-white">{"}"}</span>
                      </div>
                      <div className="flex opacity-60 items-center">
                        <span className="text-gray-600 w-8 text-right mr-4">
                          6
                        </span>
                        <span className="text-gray-500">
                          // Sarah is typing...
                        </span>
                        <span className="ml-2 inline-flex h-2 w-2 rounded-full bg-blue-500 animate-pulse"></span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Codocs Section */}
      <section
        id="stats"
        className="relative py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900"
      >
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              <span className="font-mono text-purple-600 dark:text-purple-400">
                if
              </span>{" "}
              (needCollaboration){" "}
              <span className="font-mono text-blue-600 dark:text-blue-400">
                {"{"}
              </span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto font-mono">
              <span className="text-green-600 dark:text-green-400">return</span>{" "}
              <span className="text-orange-500 dark:text-orange-400">
                "Codocs"
              </span>
              ; <span className="text-gray-400">// Stop juggling tools</span>
            </p>
          </div>

          {/* Problem vs Solution Grid */}
          <div className="grid lg:grid-cols-2 gap-12 mb-16">
            {/* The Problem */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border-2 border-red-200 dark:border-red-900/50">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-red-600 dark:text-red-400"
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
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white font-mono">
                  <span className="text-red-600 dark:text-red-400">try</span>{" "}
                  {"{"}
                </h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <span className="text-red-500 font-mono mt-0.5">✗</span>
                  <p className="text-gray-600 dark:text-gray-400 font-mono text-sm">
                    Email code snippets back && forth
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="text-red-500 font-mono mt-0.5">✗</span>
                  <p className="text-gray-600 dark:text-gray-400 font-mono text-sm">
                    context.switch(slack, zoom, ide)
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="text-red-500 font-mono mt-0.5">✗</span>
                  <p className="text-gray-600 dark:text-gray-400 font-mono text-sm">
                    await team.push(){" "}
                    <span className="text-gray-500">// waiting...</span>
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="text-red-500 font-mono mt-0.5">✗</span>
                  <p className="text-gray-600 dark:text-gray-400 font-mono text-sm">
                    conversations.scatter(){" "}
                    <span className="text-gray-500">// lost context</span>
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="text-red-500 font-mono mt-0.5">✗</span>
                  <p className="text-gray-600 dark:text-gray-400 font-mono text-sm">
                    visibility = null{" "}
                    <span className="text-gray-500">
                      // can't see teammates
                    </span>
                  </p>
                </div>
              </div>
              <p className="mt-4 text-red-600 dark:text-red-400 font-mono text-sm">
                {"}"}{" "}
                <span className="text-purple-600 dark:text-purple-400">
                  catch
                </span>{" "}
                (frustration) {"{"}
              </p>
            </div>

            {/* The Solution */}
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-8 border-2 border-green-200 dark:border-green-900/50">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-green-600 dark:text-green-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white font-mono">
                  <span className="text-green-600 dark:text-green-400">
                    return
                  </span>{" "}
                  codocs();
                </h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <span className="text-green-600 dark:text-green-400 font-mono mt-0.5">
                    ✓
                  </span>
                  <p className="text-gray-700 dark:text-gray-300 font-mono text-sm font-medium">
                    realTime.sync(){" "}
                    <span className="text-gray-500">// instant updates</span>
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="text-green-600 dark:text-green-400 font-mono mt-0.5">
                    ✓
                  </span>
                  <p className="text-gray-700 dark:text-gray-300 font-mono text-sm font-medium">
                    oneWindow(chat, code, console)
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="text-green-600 dark:text-green-400 font-mono mt-0.5">
                    ✓
                  </span>
                  <p className="text-gray-700 dark:text-gray-300 font-mono text-sm font-medium">
                    !commits.required{" "}
                    <span className="text-gray-500">// auto-sync magic</span>
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="text-green-600 dark:text-green-400 font-mono mt-0.5">
                    ✓
                  </span>
                  <p className="text-gray-700 dark:text-gray-300 font-mono text-sm font-medium">
                    context.preserve(){" "}
                    <span className="text-gray-500">// chat + code</span>
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="text-green-600 dark:text-green-400 font-mono mt-0.5">
                    ✓
                  </span>
                  <p className="text-gray-700 dark:text-gray-300 font-mono text-sm font-medium">
                    team.cursors.visible{" "}
                    <span className="text-gray-500">// see everyone</span>
                  </p>
                </div>
              </div>
              <p className="mt-4 text-blue-600 dark:text-blue-400 font-mono text-sm">
                {"}"} <span className="text-gray-500">// problem solved</span>
              </p>
            </div>
          </div>

          {/* Use Cases */}
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition-all hover:shadow-lg group">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                Interview Candidates
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Give coding challenges and watch candidates solve them live.
                Perfect for technical interviews.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:border-purple-500 dark:hover:border-purple-500 transition-all hover:shadow-lg group">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                Pair Programming
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Debug together, share ideas, and write better code as a team in
                real-time.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:border-pink-500 dark:hover:border-pink-500 transition-all hover:shadow-lg group">
              <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-pink-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                Teaching & Workshops
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Guide students through coding exercises. Everyone learns
                together in one shared space.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Bento Grid */}
      <section id="features" className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Everything you need{" "}
              <span className="font-mono text-blue-600 dark:text-blue-400">
                &&
              </span>{" "}
              nothing you don't
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 font-mono">
              <span className="text-purple-600 dark:text-purple-400">
                const
              </span>{" "}
              features ={" "}
              <span className="text-green-600 dark:text-green-400">
                ['powerful', 'simple', 'fast']
              </span>
              ;
            </p>
          </div>

          {/* Bento Grid Layout */}
          <div className="grid md:grid-cols-3 gap-6">
            {/* Large Feature Card - Spans 2 columns */}
            <div className="md:col-span-2 group bg-gradient-to-br from-blue-500 to-purple-600 p-8 rounded-2xl text-white relative overflow-hidden hover:scale-[1.02] transition-transform">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
              <div className="relative z-10">
                <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center mb-6">
                  <svg
                    className="w-7 h-7"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-3 font-mono">
                  ⚡ CRDT-Powered Sync
                </h3>
                <p className="text-blue-100 text-lg mb-6">
                  Built on Yjs CRDT for{" "}
                  <span className="font-mono bg-white/10 px-2 py-1 rounded">
                    O(1)
                  </span>{" "}
                  merge complexity. Zero conflicts, zero lag.
                </p>
                <div className="flex items-center space-x-2 text-sm">
                  <div className="px-3 py-1 bg-white/20 backdrop-blur rounded-full font-mono">
                    WebSocket
                  </div>
                  <div className="px-3 py-1 bg-white/20 backdrop-blur rounded-full font-mono">
                    CRDT
                  </div>
                </div>
              </div>
            </div>

            {/* Square Feature Card */}
            <div className="group bg-white dark:bg-gray-800 p-8 rounded-2xl border-2 border-gray-200 dark:border-gray-700 hover:border-purple-500 dark:hover:border-purple-500 transition-all hover:shadow-xl">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Live Cursors
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                See exactly where your teammates are working in real-time.
              </p>
            </div>

            {/* Tall Feature Card */}
            <div className="md:row-span-2 group bg-gradient-to-br from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20 p-8 rounded-2xl border-2 border-green-200 dark:border-green-800 hover:border-green-500 dark:hover:border-green-500 transition-all">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-teal-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <svg
                  className="w-6 h-6 text-white"
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
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Built-in Console
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Run JavaScript code directly in the browser. Test ideas without
                leaving the editor.
              </p>
              <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm">
                <div className="text-green-400">
                  &gt; console.log("Hello!");
                </div>
                <div className="text-gray-400">Hello!</div>
                <div className="text-green-400 mt-2">&gt; 2 + 2</div>
                <div className="text-blue-400">4</div>
              </div>
            </div>

            {/* Wide Feature Card */}
            <div className="md:col-span-2 group bg-white dark:bg-gray-800 p-8 rounded-2xl border-2 border-gray-200 dark:border-gray-700 hover:border-orange-500 dark:hover:border-orange-500 transition-all hover:shadow-xl">
              <div className="flex items-start space-x-6">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <svg
                    className="w-6 h-6 text-white"
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
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    Team Chat
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Discuss code changes without switching apps. Keep
                    conversations in context with your code.
                  </p>
                </div>
              </div>
            </div>

            {/* More Feature Cards */}
            <div className="group bg-gradient-to-br from-indigo-500 to-blue-600 p-6 rounded-2xl text-white hover:scale-[1.02] transition-transform">
              <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center mb-4">
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
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-bold mb-2">Secure Sharing</h3>
              <p className="text-indigo-100 text-sm">
                Control who sees your code. Share rooms with teammates, revoke
                access anytime.
              </p>
            </div>

            <div className="group bg-white dark:bg-gray-800 p-6 rounded-2xl border-2 border-gray-200 dark:border-gray-700 hover:border-yellow-500 dark:hover:border-yellow-500 transition-all">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                Dark Mode
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Beautiful themes that adapt to your preference, day or night.
              </p>
            </div>

            <div className="group bg-white dark:bg-gray-800 p-6 rounded-2xl border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition-all">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                Export Code
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Download your work in multiple formats. Take it wherever you go.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Demo Section */}
      <section
        id="demo"
        className="relative py-20 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-800/50"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              <span className="font-mono text-blue-600 dark:text-blue-400">
                function
              </span>{" "}
              howItWorks(){" "}
              <span className="font-mono text-purple-600 dark:text-purple-400">
                {"{"}
              </span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 font-mono">
              <span className="text-gray-500">
                // Three steps to collaborative coding
              </span>
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold flex-shrink-0 font-mono">
                  1
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 font-mono">
                    <span className="text-purple-600 dark:text-purple-400">
                      const
                    </span>{" "}
                    room = createRoom();
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Spin up a collaborative session in seconds.{" "}
                    <span className="font-mono text-gray-500">
                      // Zero config
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white font-bold flex-shrink-0 font-mono">
                  2
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 font-mono">
                    room.invite(teammates);
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Share your room link. They'll see changes{" "}
                    <span className="font-mono text-blue-600 dark:text-blue-400">
                      instantly
                    </span>
                    .
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center text-white font-bold flex-shrink-0 font-mono">
                  3
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 font-mono">
                    <span className="text-green-600 dark:text-green-400">
                      while
                    </span>
                    (coding) buildCoolStuff();
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Write, edit, run code together. Live cursors + chat{" "}
                    <span className="font-mono text-purple-600 dark:text-purple-400">
                      &&
                    </span>{" "}
                    console.
                  </p>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl blur-2xl opacity-20"></div>
              <div className="relative bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-2xl border border-gray-200 dark:border-gray-700">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                      A
                    </div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-1/2"></div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center text-white font-bold">
                      B
                    </div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-2"></div>
                      <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-1/3"></div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white font-bold">
                      C
                    </div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6 mb-2"></div>
                      <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-2/3"></div>
                    </div>
                  </div>
                </div>
                <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
                  <span className="inline-flex items-center space-x-1">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    <span>3 people coding together</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl blur-3xl opacity-20"></div>
            <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-12 shadow-2xl">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 font-mono">
                <span className="text-blue-200">while</span>(true){" "}
                <span className="text-yellow-300">{"{"}</span>
              </h2>
              <p className="text-xl text-blue-100 mb-8 font-mono">
                &nbsp;&nbsp;collaborate();{" "}
                <span className="text-blue-300">// Start building</span>
              </p>
              <button
                onClick={() => navigate("/login?mode=register")}
                className="group px-8 py-4 bg-white text-blue-600 rounded-xl font-semibold text-lg hover:bg-gray-100 transition-all transform hover:scale-105 shadow-xl flex items-center space-x-2 mx-auto font-mono"
              >
                <span>$ codocs --init</span>
                <svg
                  className="w-5 h-5 group-hover:translate-x-1 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </button>
              <p className="mt-4 text-blue-100 font-mono text-sm">
                <span className="text-yellow-300">{"}"}</span>{" "}
                <span className="text-blue-300">// Free forever</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-800 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex items-center space-x-3">
              <img
                src="/logo.jpg"
                alt="Codocs"
                className="h-8 w-8 rounded-md object-cover"
              />
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                Codocs
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              © 2024 Codocs. Built for developers, by developers.
            </p>
          </div>
        </div>
      </footer>

      {/* Back to Top Button */}
      {scrollY > 500 && (
        <button
          onClick={() => scrollToSection("home")}
          className="fixed bottom-8 right-8 w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full shadow-xl hover:scale-110 transition-transform flex items-center justify-center z-50"
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
              d="M5 10l7-7m0 0l7 7m-7-7v18"
            />
          </svg>
        </button>
      )}

      {/* CSS Animations */}
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeInRight {
          from {
            opacity: 0;
            transform: translateX(30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
}
