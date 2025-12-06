import { useNavigate } from "react-router-dom";
import { useTheme } from "../hooks/useTheme";
import ThemeToggle from "../components/ThemeToggle";

export default function Landing() {
  const navigate = useNavigate();
  const { theme } = useTheme();

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Header */}
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
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-8">
            <div className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-full border border-blue-200 dark:border-blue-800">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                Real-time collaboration
              </span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 dark:text-white leading-tight">
              Code together,
              <br />
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 dark:from-blue-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
                ship faster
              </span>
            </h1>

            <p className="max-w-2xl mx-auto text-xl text-gray-600 dark:text-gray-400 leading-relaxed">
              A collaborative code editor that feels like magic. Write, share,
              and execute code with your team in real-time. No setup, no
              hassle.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => navigate("/login?mode=register")}
                className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 shadow-xl shadow-blue-500/25 flex items-center space-x-2"
              >
                <span>Start coding now</span>
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
              <button className="px-8 py-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl font-semibold text-lg border-2 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all flex items-center space-x-2">
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
                <span>Watch demo</span>
              </button>
            </div>
          </div>

          {/* Code Preview Card */}
          <div className="mt-16 max-w-5xl mx-auto">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
              <div className="relative bg-gray-900 rounded-2xl overflow-hidden border border-gray-800 shadow-2xl">
                {/* Window Controls */}
                <div className="flex items-center space-x-2 px-4 py-3 bg-gray-800 border-b border-gray-700">
                  <div className="flex space-x-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  </div>
                  <div className="flex-1 text-center">
                    <span className="text-xs text-gray-400 font-mono">
                      collaborative-project.js
                    </span>
                  </div>
                </div>
                {/* Code Content */}
                <div className="p-6 font-mono text-sm">
                  <div className="space-y-2">
                    <div className="flex">
                      <span className="text-gray-600 w-8 text-right mr-4">
                        1
                      </span>
                      <span className="text-purple-400">const</span>
                      <span className="text-blue-300 ml-2">teamwork</span>
                      <span className="text-white ml-2">=</span>
                      <span className="text-green-300 ml-2">
                        () =&gt; {"{"}
                      </span>
                    </div>
                    <div className="flex">
                      <span className="text-gray-600 w-8 text-right mr-4">
                        2
                      </span>
                      <span className="text-purple-400 ml-4">return</span>
                      <span className="text-green-300 ml-2">
                        "Build amazing things together"
                      </span>
                      <span className="text-white">;</span>
                    </div>
                    <div className="flex">
                      <span className="text-gray-600 w-8 text-right mr-4">
                        3
                      </span>
                      <span className="text-green-300">{"}"}</span>
                      <span className="text-white">;</span>
                    </div>
                    <div className="flex opacity-60">
                      <span className="text-gray-600 w-8 text-right mr-4">
                        4
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-gray-600 w-8 text-right mr-4">
                        5
                      </span>
                      <span className="text-gray-500">// Sarah is typing...</span>
                      <span className="ml-2 inline-flex h-2 w-2 rounded-full bg-blue-500 animate-pulse"></span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-800/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Everything you need to collaborate
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Powerful features that make coding together effortless
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="group bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition-all hover:shadow-lg">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
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
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Lightning Fast
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Built on Yjs for instant synchronization. See changes as they
                happen, with zero lag.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-purple-500 dark:hover:border-purple-500 transition-all hover:shadow-lg">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
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
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Live Cursors
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                See exactly where your teammates are working. No more "who
                edited what?"
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-green-500 dark:hover:border-green-500 transition-all hover:shadow-lg">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-teal-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
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
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Built-in Console
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Run JavaScript code directly in the browser. Test ideas without
                leaving the editor.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="group bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-orange-500 dark:hover:border-orange-500 transition-all hover:shadow-lg">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
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
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Team Chat
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Discuss code changes without switching apps. Keep conversations
                in context.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="group bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-indigo-500 dark:hover:border-indigo-500 transition-all hover:shadow-lg">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
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
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Secure Sharing
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Control who sees your code. Share rooms with teammates, revoke
                access anytime.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="group bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-yellow-500 dark:hover:border-yellow-500 transition-all hover:shadow-lg">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
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
                    d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Dark Mode
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Easy on the eyes, day or night. Beautiful themes that adapt to
                your preference.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl blur-3xl opacity-20"></div>
            <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-12 shadow-2xl">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Ready to code together?
              </h2>
              <p className="text-xl text-blue-100 mb-8">
                Join developers who are shipping faster with Codocs
              </p>
              <button
                onClick={() => navigate("/login?mode=register")}
                className="group px-8 py-4 bg-white text-blue-600 rounded-xl font-semibold text-lg hover:bg-gray-100 transition-all transform hover:scale-105 shadow-xl flex items-center space-x-2 mx-auto"
              >
                <span>Get started for free</span>
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
    </div>
  );
}

