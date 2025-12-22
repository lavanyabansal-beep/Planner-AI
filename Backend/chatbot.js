const express = require('express')
const axios = require('axios')

const Board = require('./models/Board')   // internal DB name stays Board
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

IMPORTANT TERMINOLOGY:
- User says "project"
- Internally it maps to "board" in database

Your task:
- Understand the user's intent
- Treat "project" and "board" as the SAME thing
- Extract required fields from natural language

REQUIRED FIELDS:
- create_project → data.title
- add_bucket → data.title
- add_task → data.title AND data.bucket
- add_member → data.name
- delete → data.type AND data.name

OPTIONAL FIELDS:
- project (project name if mentioned)

ADDITIONAL INTENTS:
- show_projects
- show_buckets
- show_tasks
- set_active_project

RULES:
- Respond ONLY in valid JSON
- Never include markdown or explanations
- Never leave required fields empty
- If missing info, set action="none" and ask a clear question in reply

JSON FORMAT:
{
  "action": "create_project | add_bucket | add_task | add_member | delete | undo | show_projects | show_buckets | show_tasks | set_active_project | none",
  "data": {},
  "reply": "User-facing response using the word PROJECT"
}
`
        },
        { role: 'user', content: message }
      ]
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY1}`,
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

  // frontend-controlled active project
  if (req.body.activeProjectId) {
    ctx.activeBoardId = req.body.activeProjectId
  }

  try {
    const ai = await callLLM(message)
    const action = ai.action || 'none'
    const data = ai.data || {}

    /* =====================================================
       🔁 AUTO SWITCH PROJECT IF PROVIDED
    ===================================================== */
    if (data.project) {
      const project = await Board.findOne({
        title: new RegExp(`^${data.project}$`, 'i')
      })
      if (project) ctx.activeBoardId = project._id
    }

    switch (action) {

      /* ========== CREATE PROJECT ========== */
      case 'create_project': {
        if (!data.title)
          return res.json({ reply: ai.reply })

        const project = await Board.create({ title: data.title })
        ctx.activeBoardId = project._id

        return res.json({
          reply: `Project "${project.title}" created and set as active`
        })
      }

      /* ========== SET ACTIVE PROJECT ========== */
      case 'set_active_project': {
        if (!data.title)
          return res.json({ reply: ai.reply })

        const project = await Board.findOne({
          title: new RegExp(`^${data.title}$`, 'i')
        })

        if (!project)
          return res.json({ reply: 'Project not found.' })

        ctx.activeBoardId = project._id
        return res.json({ reply: `Switched to project "${project.title}"` })
      }

      /* ========== ADD BUCKET ========== */
      case 'add_bucket': {
        if (!data.title)
          return res.json({ reply: ai.reply })

        const project = await Board.findById(ctx.activeBoardId)

        if (!project) {
          ctx.activeBoardId = null
          return res.json({
            reply: 'Active project is invalid. Please select a project.'
          })
        }

        await Bucket.create({
          title: data.title,
          boardId: project._id
        })

        return res.json({
          reply: `Bucket "${data.title}" added to project "${project.title}"`
        })
      }

      /* ========== ADD TASK ========== */
      case 'add_task': {
        if (!data.title || !data.bucket)
          return res.json({ reply: ai.reply })

        const project = await Board.findById(ctx.activeBoardId)
        if (!project)
          return res.json({ reply: 'Please select a project first.' })

        const bucket = await Bucket.findOne({
          title: new RegExp(`^${data.bucket}$`, 'i'),
          boardId: project._id
        })

        if (!bucket)
          return res.json({
            reply: 'Bucket not found in the active project.'
          })

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
        if (data.type === 'project') { Model = Board; field = 'title' }
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

        if (
          data.type === 'project' &&
          ctx.activeBoardId?.toString() === doc._id.toString()
        ) {
          ctx.activeBoardId = null
        }

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

      /* ========== SHOW PROJECTS ========== */
      case 'show_projects': {
        const projects = await Board.find().sort({ createdAt: -1 })
        ctx.lastResult = projects
        return res.json({ reply: ai.reply })
      }

      /* ========== SHOW BUCKETS ========== */
      case 'show_buckets': {
        const project = await Board.findById(ctx.activeBoardId)
        if (!project)
          return res.json({ reply: 'Please select a project first.' })

        const buckets = await Bucket.find({ boardId: project._id })
        ctx.lastResult = buckets

        return res.json({ reply: ai.reply })
      }

      /* ========== SHOW TASKS ========== */
      case 'show_tasks': {
        const project = await Board.findById(ctx.activeBoardId)
        if (!project)
          return res.json({ reply: 'Please select a project first.' })

        let bucket

        if (data.bucket) {
          bucket = await Bucket.findOne({
            title: new RegExp(data.bucket, 'i'),
            boardId: project._id
          })
        } else {
          bucket = await Bucket.findOne({ boardId: project._id })
        }

        if (!bucket)
          return res.json({ reply: ai.reply })

        const tasks = await Task.find({ bucketId: bucket._id })
        ctx.lastResult = tasks

        return res.json({ reply: ai.reply })
      }

      /* ========== NORMAL CHAT ========== */
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
