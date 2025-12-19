const express = require('express')
const axios = require('axios')

const Board = require('./models/Board')
const Bucket = require('./models/Bucket')
const Task = require('./models/Task')
const User = require('./models/User')

const router = express.Router()

/* =====================================================
   🧠 In-memory state (undo + context)
===================================================== */
const memory = new Map()
function getCtx(req) {
  if (!memory.has(req.ip)) memory.set(req.ip, {})
  return memory.get(req.ip)
}

/* =====================================================
   🤖 PURE LLM BRAIN (FREE MODEL SAFE)
===================================================== */
async function callLLM(message) {
  const res = await axios.post(
    'https://openrouter.ai/api/v1/chat/completions',
    {
      model: 'openai/gpt-oss-20b:free',
      messages: [
        {
          role: 'system',
          content: `
You are an AI project management assistant.

Your task:
- Understand the user's intent
- Extract required fields from natural language
- Ask a follow-up question ONLY if required data is missing

REQUIRED FIELDS:
- create_board → data.title
- add_bucket → data.title
- add_task → data.title AND data.bucket
- add_member → data.name
- delete → data.type AND data.name

RULES:
- Respond ONLY in valid JSON
- Never include markdown or explanations
- Never leave required fields empty
- If missing info, set action="none" and ask a clear question in reply

JSON FORMAT:
{
  "action": "create_board | add_bucket | add_task | add_member | delete | undo | none",
  "data": {},
  "reply": "User-facing response"
}

EXAMPLES:

User: create a board named abc
Response:
{
  "action": "create_board",
  "data": { "title": "abc" },
  "reply": "Board \"abc\" has been created."
}

User: add task login bug to backend
Response:
{
  "action": "add_task",
  "data": { "title": "login bug", "bucket": "backend" },
  "reply": "Task \"login bug\" added to backend."
}
`
        },
        { role: 'user', content: message }
      ]
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'Planner AI'
      }
    }
  )

  try {
    return JSON.parse(res.data.choices[0].message.content)
  } catch {
    return {
      action: 'none',
      data: {},
      reply: 'I could not understand that. Could you rephrase?'
    }
  }
}

/* =====================================================
   🚀 CHAT ROUTE
===================================================== */
router.post('/chat', async (req, res) => {
  const message = req.body.message
  if (!message) return res.json({ reply: 'Empty message' })

  const ctx = getCtx(req)

  try {
    const ai = await callLLM(message)
    const action = ai.action || 'none'
    const data = ai.data || {}

    switch (action) {

      /* ========== CREATE BOARD ========== */
      case 'create_board': {
        if (!data.title)
          return res.json({ reply: ai.reply })

        const board = await Board.create({ title: data.title })
        ctx.activeBoardId = board._id
        return res.json({ reply: ai.reply })
      }

      /* ========== ADD BUCKET ========== */
      case 'add_bucket': {
        if (!data.title)
          return res.json({ reply: ai.reply })

        const board = ctx.activeBoardId
          ? await Board.findById(ctx.activeBoardId)
          : await Board.findOne().sort({ createdAt: -1 })

        if (!board)
          return res.json({ reply: 'Please create a board first.' })

        await Bucket.create({
          title: data.title,
          boardId: board._id
        })

        return res.json({ reply: ai.reply })
      }

      /* ========== ADD TASK ========== */
      case 'add_task': {
        if (!data.title || !data.bucket)
          return res.json({ reply: ai.reply })

        const bucket = await Bucket.findOne({
          title: new RegExp('^' + data.bucket + '$', 'i')
        })

        if (!bucket)
          return res.json({ reply: 'Bucket not found.' })

        await Task.create({
          title: data.title,
          bucketId: bucket._id
        })

        return res.json({ reply: ai.reply })
      }

      /* ========== ADD MEMBER ========== */
      case 'add_member': {
        if (!data.name)
          return res.json({ reply: ai.reply })

        await User.create({
          name: data.name,
          initials: data.name
            .split(' ')
            .map(w => w[0])
            .join('')
            .toUpperCase(),
          avatarColor: 'bg-blue-500'
        })

        return res.json({ reply: ai.reply })
      }

      /* ========== DELETE ========== */
      case 'delete': {
        if (!data.type || !data.name)
          return res.json({ reply: ai.reply })

        let Model, field

        if (data.type === 'task') { Model = Task; field = 'title' }
        if (data.type === 'bucket') { Model = Bucket; field = 'title' }
        if (data.type === 'board') { Model = Board; field = 'title' }
        if (data.type === 'member') { Model = User; field = 'name' }

        if (!Model)
          return res.json({ reply: 'Invalid delete request.' })

        const doc = await Model.findOne({
          [field]: new RegExp(data.name, 'i')
        })

        if (!doc)
          return res.json({ reply: 'Nothing found to delete.' })

        ctx.lastDeleted = {
          model: Model,
          data: doc.toObject()
        }

        await Model.deleteOne({ _id: doc._id })

        return res.json({ reply: ai.reply })
      }

      /* ========== UNDO ========== */
      case 'undo': {
        if (!ctx.lastDeleted)
          return res.json({ reply: 'Nothing to undo.' })

        await ctx.lastDeleted.model.create(ctx.lastDeleted.data)
        ctx.lastDeleted = null

        return res.json({ reply: 'Undo successful ✅' })
      }

      /* ========== NORMAL CHAT / CLARIFICATION ========== */
      case 'none':
      default:
        return res.json({ reply: ai.reply })
    }

  } catch (err) {
    console.error('SERVER ERROR:', err.response?.data || err.message)
    return res.json({ reply: 'Backend error. Please try again.' })
  }
})

module.exports = router
