import { useState, useRef, useEffect } from 'react'
import { sendMessage } from '../services/chatApi'

const QUICK_ACTIONS = [
  '🗂️ Create a new board',
  '📁 Add a bucket',
  '📋 Add task ',
  '🗑️ Delete a task'
]

export default function Chatbot() {
  const [open, setOpen] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const [dark, setDark] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  /* ---------- Persist Chat & Theme ---------- */
  useEffect(() => {
    const saved = localStorage.getItem('planner_ai_chat')
    const theme = localStorage.getItem('planner_ai_theme')
    if (saved) setMessages(JSON.parse(saved))
    if (theme) setDark(theme === 'dark')
  }, [])

  useEffect(() => {
    localStorage.setItem('planner_ai_chat', JSON.stringify(messages))
  }, [messages])

  useEffect(() => {
    localStorage.setItem('planner_ai_theme', dark ? 'dark' : 'light')
  }, [dark])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  /* ---------- Send Message ---------- */
  const handleSend = async text => {
    const msg = text ?? input
    if (!msg.trim() || loading) return

    setMessages(prev => [...prev, { role: 'user', text: msg }])
    setInput('')
    setLoading(true)

    try {
      const reply = await sendMessage(msg)
      setMessages(prev => [...prev, { role: 'bot', text: reply }])
    } catch {
      setMessages(prev => [
        ...prev,
        { role: 'bot', text: '⚠️ Unable to respond right now.' }
      ])
    } finally {
      setLoading(false)
    }
  }

  /* ---------- Theme Styles ---------- */
  const panel = dark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
  const chatBg = dark ? 'bg-gray-900' : 'bg-gray-50'
  const inputBg = dark
    ? 'bg-gray-700 border-gray-600 text-white'
    : 'bg-white'

  return (
    <div className="fixed bottom-6 right-6 z-50 font-inter">
      {/* CHAT PANEL */}
      {open && (
        <div
          className={`${
            fullscreen
              ? 'w-screen h-screen bottom-0 right-0 fixed'
              : 'w-[440px] h-[620px]'
          } ${panel} rounded-xl shadow-2xl flex flex-col overflow-hidden`}
        >
          {/* HEADER */}
          <div className="px-5 py-4 border-b flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold">
                Planner AI 🤖
              </h2>
              <p className="text-xs opacity-70">
                Smart task & board assistant
              </p>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <button
                onClick={() => setDark(!dark)}
                title="Toggle theme"
              >
                {dark ? '🌙' : '☀️'}
              </button>
              <button
                onClick={() => setFullscreen(!fullscreen)}
                title="Toggle fullscreen"
              >
                {fullscreen ? '🗗' : '🗖'}
              </button>
              <button onClick={() => setOpen(false)}>✕</button>
            </div>
          </div>

          {/* CHAT AREA */}
          <div
            className={`flex-1 px-5 py-4 overflow-y-auto space-y-4 ${chatBg}`}
          >
            {messages.length === 0 && (
              <>
                <p className="text-center text-sm opacity-60 mt-10">
                  👋 Hi! I can help you manage boards, buckets, and tasks.
                </p>

                {/* QUICK ACTIONS */}
                <div className="mt-6 flex flex-wrap gap-2 justify-center">
                  {QUICK_ACTIONS.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => handleSend(q)}
                      className="px-3 py-1.5 text-xs border rounded-full hover:bg-indigo-600 hover:text-white transition"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </>
            )}

            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${
                  m.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[75%] px-4 py-2.5 rounded-lg text-sm leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-indigo-600 text-white'
                      : dark
                      ? 'bg-gray-700'
                      : 'bg-white border'
                  }`}
                >
                  {m.role === 'bot' && '🤖 '}
                  {m.text}
                </div>
              </div>
            ))}

            {loading && (
              <div className="text-sm opacity-60 animate-pulse">
                ⏳ Planner AI is typing…
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* INPUT */}
          <div className="p-4 border-t">
            <div className="flex gap-3">
              <input
                className={`flex-1 px-4 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${inputBg}`}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                placeholder="Type your request…"
              />
              <button
                onClick={() => handleSend()}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition"
              >
                Send 🚀
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FLOATING AI BUTTON */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          title="Open Planner AI"
          className="
            relative w-16 h-16 rounded-full
            bg-gradient-to-br from-indigo-600 to-purple-600
            text-white
            shadow-[0_12px_35px_rgba(99,102,241,0.6)]
            hover:scale-105 transition-all duration-300
            flex items-center justify-center
            before:absolute before:inset-0 before:rounded-full
            before:animate-ping before:bg-indigo-400 before:opacity-20
          "
        >
          <span className="flex flex-col items-center leading-tight">
            <span className="text-xl">🤖</span>
            <span className="text-[10px] tracking-wide">AI</span>
          </span>
        </button>
      )}
    </div>
  )
}
