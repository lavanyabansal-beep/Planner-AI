const express = require('express')
const axios = require('axios')

const Board = require('./models/Board')
const Bucket = require('./models/Bucket')
const Task = require('./models/Task')
const User = require('./models/User')

const router = express.Router()

/* =====================================================
   🧠 In-memory conversation state (per IP)
===================================================== */
const memory = new Map()

function getCtx(req) {
  if (!memory.has(req.ip)) memory.set(req.ip, {})
  return memory.get(req.ip)
}

const clean = s =>
  s.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim()

/* =====================================================
   🤖 AI intent extractor (SAFE)
===================================================== */
async function getIntent(message) {
  try {
    const res = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'openai/gpt-5.2',
        messages: [
          {
            role: 'system',
            content: `
Return ONLY JSON.
Intents:
create_board, add_bucket, add_task,
add_member,
delete_board, delete_bucket, delete_task, delete_member

Format:
{
  "intent": "",
  "board": null,
  "bucket": null,
  "task": null,
  "member": null
}
`
          },
          { role: 'user', content: message }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    )

    return JSON.parse(res.data.choices[0].message.content)
  } catch (e) {
    return {}
  }
}

/* =====================================================
   🚀 CHAT ROUTE
===================================================== */
router.post('/chat', async (req, res) => {
  const { message } = req.body
  if (!message) return res.json({ reply: 'Empty message' })

  const ctx = getCtx(req)
  const msg = clean(message)
  const ai = await getIntent(message)

  try {
    /* ================= UNDO ================= */
    if (msg === 'undo' && ctx.lastDeleted) {
      const d = ctx.lastDeleted

      if (d.type === 'task') await Task.create(d.data)

      if (d.type === 'bucket') {
        const b = await Bucket.create(d.data)
        for (const t of d.tasks) {
          await Task.create({ ...t, bucketId: b._id })
        }
      }

      if (d.type === 'board') {
        const board = await Board.create(d.data)
        const map = {}
        for (const b of d.buckets) {
          const nb = await Bucket.create({ ...b, boardId: board._id })
          map[b._id] = nb._id
        }
        for (const t of d.tasks) {
          await Task.create({ ...t, bucketId: map[t.bucketId] })
        }
      }

      if (d.type === 'member') await User.create(d.data)

      ctx.lastDeleted = null
      return res.json({ reply: 'Undo successful ✅' })
    }

    /* ================= CONFIRM DELETE ================= */
    if (ctx.pendingDelete && (msg === 'yes' || msg === 'no')) {
      if (msg === 'no') {
        ctx.pendingDelete = null
        return res.json({ reply: 'Deletion cancelled.' })
      }

      const { type, entity } = ctx.pendingDelete

      if (type === 'task') {
        ctx.lastDeleted = { type, data: entity.toObject() }
        await Task.deleteOne({ _id: entity._id })
      }

      if (type === 'bucket') {
        const tasks = await Task.find({ bucketId: entity._id })
        ctx.lastDeleted = {
          type,
          data: entity.toObject(),
          tasks: tasks.map(t => t.toObject())
        }
        await Task.deleteMany({ bucketId: entity._id })
        await Bucket.deleteOne({ _id: entity._id })
      }

      if (type === 'board') {
        const buckets = await Bucket.find({ boardId: entity._id })
        const tasks = await Task.find({
          bucketId: { $in: buckets.map(b => b._id) }
        })

        ctx.lastDeleted = {
          type,
          data: entity.toObject(),
          buckets: buckets.map(b => b.toObject()),
          tasks: tasks.map(t => t.toObject())
        }

        await Task.deleteMany({ bucketId: { $in: buckets.map(b => b._id) } })
        await Bucket.deleteMany({ boardId: entity._id })
        await Board.deleteOne({ _id: entity._id })
      }

      if (type === 'member') {
        ctx.lastDeleted = { type, data: entity.toObject() }
        await User.deleteOne({ _id: entity._id })
      }

      ctx.pendingDelete = null
      return res.json({ reply: `${type} deleted. Say "undo" if needed.` })
    }

    /* ================= DELETE TYPE FOLLOW-UP ================= */
    if (
      ctx.pendingChoices &&
      ['board', 'bucket', 'task', 'member'].includes(msg)
    ) {
      const found = ctx.pendingChoices.find(c => c.type === msg)
      if (!found) {
        return res.json({ reply: 'Invalid choice.' })
      }
      ctx.pendingDelete = found
      ctx.pendingChoices = null
      return res.json({
        reply: `Are you sure you want to delete this ${found.type}? (yes/no)`
      })
    }

    /* ================= CREATE BOARD ================= */
    if (
      ai.intent === 'create_board' ||
      msg.includes('create board') ||
      msg.includes('make board')
    ) {
      const name =
        ai.board ||
        message.replace(/create|make|board|called/gi, '').trim()

      if (!name) return res.json({ reply: 'Board name missing.' })

      const board = await Board.create({ title: name })
      ctx.activeBoardId = board._id   // ✅ FIX ADDED

      return res.json({ reply: `Board "${name}" created ✅` })
    }

    /* ================= ADD BUCKET (FIXED, NOTHING REMOVED) ================= */
    if (ai.intent === 'add_bucket' || msg.includes('add bucket')) {
      const name =
        ai.bucket ||
        message.replace(/add|bucket/gi, '').trim()

      const board = ctx.activeBoardId
        ? await Board.findById(ctx.activeBoardId)
        : await Board.findOne().sort({ createdAt: -1 })

      if (!board) return res.json({ reply: 'Create a board first.' })

      await Bucket.create({ title: name, boardId: board._id })
      return res.json({ reply: `Bucket "${name}" added.` })
    }

    /* ================= ADD TASK ================= */
    if (ai.intent === 'add_task' || msg.includes('add task')) {
      let taskName = ai.task
      let bucketName = ai.bucket

      if (!taskName) {
        const match = message.match(/add task (.+?)( in | to | under )(.+)/i)
        if (match) {
          taskName = match[1].trim()
          bucketName = match[3].trim()
        } else {
          taskName = message.replace(/add|task/gi, '').trim()
        }
      }

      let bucket = null

      if (bucketName) {
        bucket = await Bucket.findOne({
          title: new RegExp(`^${bucketName}$`, 'i')
        })
      }

      if (!bucket) {
        bucket = await Bucket.findOne().sort({ createdAt: -1 })
      }

      if (!bucket) {
        return res.json({ reply: 'Please create a bucket first.' })
      }

      const task = await Task.create({
        title: taskName,
        bucketId: bucket._id
      })

      ctx.lastTask = task.title
      ctx.lastBucket = bucket.title

      return res.json({
        reply: `Task "${task.title}" added to "${bucket.title}" ✅`
      })
    }

    /* ================= ADD MEMBER ================= */
    if (ai.intent === 'add_member' || msg.includes('add member')) {
      const name =
        ai.member ||
        message.replace(/add|member/gi, '').trim()

      let user = await User.findOne({ name: new RegExp(name, 'i') })
      if (!user) {
        await User.create({
          name,
          initials: name
            .split(' ') 
            .map(w => w[0])
            .join('')
            .toUpperCase(),
          avatarColor: 'bg-blue-500'
        })
      }

      return res.json({ reply: `Member "${name}" added.` })
    }

    /* ================= DELETE ================= */
    if (msg.startsWith('delete') || msg.startsWith('remove')) {
      const name = message.replace(/delete|remove/gi, '').trim()

      const matches = []

      const board = await Board.findOne({ title: new RegExp(name, 'i') })
      if (board) matches.push({ type: 'board', entity: board })

      const bucket = await Bucket.findOne({ title: new RegExp(name, 'i') })
      if (bucket) matches.push({ type: 'bucket', entity: bucket })

      const task = await Task.findOne({ title: new RegExp(name, 'i') })
      if (task) matches.push({ type: 'task', entity: task })

      const user = await User.findOne({ name: new RegExp(name, 'i') })
      if (user) matches.push({ type: 'member', entity: user })

      if (matches.length === 0)
        return res.json({ reply: 'Nothing found to delete.' })

      if (matches.length === 1) {
        ctx.pendingDelete = matches[0]
        return res.json({
          reply: `Are you sure you want to delete this ${matches[0].type}? (yes/no)`
        })
      }

      ctx.pendingChoices = matches
      return res.json({
        reply:
          'Please specify what you want to delete (board / bucket / task / member).'
      })
    }

    /* ================= GREETING ================= */
    if (msg === 'hi' || msg === 'hello') {
      return res.json({
        reply: 'Hi 👋 I can manage boards, buckets, tasks, and members.'
      })
    }

    return res.json({ reply: 'Tell me what you want to do 🙂' })
  } catch (err) {
    console.error(err)
    return res.json({ reply: 'Something went wrong.' })
  }
})

module.exports = router
