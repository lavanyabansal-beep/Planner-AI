const express = require('express')
const cors = require('cors')
const multer = require('multer')
const path = require('path')
const fs = require('fs')

const { connectDB } = require('./db')
const User = require('./models/User')
const Team = require('./models/Team')
const Board = require('./models/Board')
const Bucket = require('./models/Bucket')
const Task = require('./models/Task')
const { scheduleSprintViewTasks, expandRecurringTask, validateTasks, ACTIVITY_TYPES } = require('./utils/sprintviewScheduler')
const { expandToUserDayView, expandToFlatGrid } = require('./utils/userDayExpander')

const app = express()
app.use(cors({ origin: 'http://localhost:5174' }))
app.use(express.json())

// connect to Mongo
connectDB()

// --- Users & Labels (labels kept static for now) ---
app.get('/api/users', async (req, res) => {
  const list = await User.find().lean()
  res.json(list)
})

app.post('/api/users', async (req, res) => {
  try {
    const u = new User(req.body)
    await u.save()
    res.status(201).json(u)
  } catch (err) { res.status(400).json({ error: err.message }) }
})

app.get('/api/labels', (req, res) => {
  // labels are lightweight and static for the frontend
  res.json([ { id: 'l-1', name: 'Frontend', color: 'bg-indigo-300' }, { id: 'l-2', name: 'Backend', color: 'bg-amber-300' }, { id: 'l-3', name: 'Bug', color: 'bg-red-300' } ])
})

// Boards
app.get('/api/boards', async (req, res) => {
  try {
    const boards = await Board.find().lean()
    res.json(boards)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.post('/api/boards', async (req, res) => {
  try {
    // Accept optional nested buckets/tasks in request body
    const { title, teamId, buckets } = req.body || {};
    if (!title) return res.status(400).json({ error: 'title is required' });

    const b = new Board({ title, teamId });
    await b.save();

    const createdBuckets = [];
    const createdTasks = [];

    if (Array.isArray(buckets) && buckets.length > 0) {
      for (let i = 0; i < buckets.length; i++) {
        const bucketData = buckets[i] || {};
        const bucketDoc = new Bucket({ boardId: b._id, title: bucketData.title || `Bucket ${i + 1}`, order: bucketData.order ?? i });
        await bucketDoc.save();
        createdBuckets.push(bucketDoc);

        if (Array.isArray(bucketData.tasks) && bucketData.tasks.length > 0) {
          for (const tRaw of bucketData.tasks) {
            // Ensure required fields for task creation
            const taskPayload = {
              bucketId: bucketDoc._id,
              title: tRaw.title || 'Untitled Task',
              description: tRaw.description || '',
              completed: !!tRaw.completed,
              assignedTo: Array.isArray(tRaw.assignedTo) ? tRaw.assignedTo : [],
              labels: Array.isArray(tRaw.labels) ? tRaw.labels : [],
              priority: tRaw.priority || 'medium',
              progress: tRaw.progress || 'not_started',
              startDate: tRaw.startDate ? new Date(tRaw.startDate) : undefined,
              dueDate: tRaw.dueDate ? new Date(tRaw.dueDate) : undefined,
              checklist: Array.isArray(tRaw.checklist) ? tRaw.checklist : [],
              attachments: Array.isArray(tRaw.attachments) ? tRaw.attachments : [],
            };
            const taskDoc = new Task(taskPayload);
            await taskDoc.save();
            createdTasks.push(taskDoc);
          }
        }
      }
    }

    res.status(201).json({ board: b, buckets: createdBuckets, tasks: createdTasks });
  } catch (err) { res.status(400).json({ error: err.message }) }
})

app.delete('/api/boards/:boardId', async (req, res) => {
  try {
    const { boardId } = req.params;
    
    // Check if board exists
    const board = await Board.findById(boardId);
    if (!board) {
      return res.status(404).json({ error: 'Board not found' });
    }

    // Find all buckets for this board
    const buckets = await Bucket.find({ boardId });
    const bucketIds = buckets.map(b => b._id);

    // Delete all tasks in those buckets
    if (bucketIds.length > 0) {
      await Task.deleteMany({ bucketId: { $in: bucketIds } });
    }

    // Delete all buckets
    await Bucket.deleteMany({ boardId });

    // Delete the board
    await Board.findByIdAndDelete(boardId);

    res.json({ message: 'Board and all associated data deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
})

// All buckets (optionally filter by boardId)
app.get('/api/buckets', async (req, res) => {
  try {
    const { boardId } = req.query
    const q = boardId ? { boardId } : {}
    const list = await Bucket.find(q).sort({ order: 1 }).lean()
    res.json(list)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// --- Boards / Buckets ---
app.get('/api/boards/:boardId/buckets', async (req, res) => {
  try {
    const buckets = await Bucket.find({ boardId: req.params.boardId }).sort({ order: 1 }).lean()
    res.json(buckets)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.post('/api/buckets', async (req, res) => {
  try {
    const b = new Bucket(req.body)
    await b.save()
    res.status(201).json(b)
  } catch (err) { res.status(400).json({ error: err.message }) }
})

app.put('/api/buckets/:id', async (req, res) => {
  try {
    const b = await Bucket.findByIdAndUpdate(req.params.id, req.body, { new: true })
    if (!b) return res.sendStatus(404)
    res.json(b)
  } catch (err) { res.status(400).json({ error: err.message }) }
})

app.delete('/api/buckets/:id', async (req, res) => {
  try { await Bucket.findByIdAndDelete(req.params.id); res.sendStatus(204) } catch (err) { res.status(500).json({ error: err.message }) }
})

// --- Tasks ---
app.get('/api/tasks/:id', async (req, res) => {
  try {
    const t = await Task.findById(req.params.id).lean()
    if (!t) return res.sendStatus(404)
    res.json(t)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// list tasks (optionally filter by bucketId)
app.get('/api/tasks', async (req, res) => {
  try {
    const { bucketId } = req.query
    const q = bucketId ? { bucketId } : {}
    const list = await Task.find(q).sort({ createdAt: 1 }).lean()
    res.json(list)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.post('/api/tasks', async (req, res) => {
  try {
    const { bucketId, task } = req.body
    if (!bucketId || !task || !task.title) return res.status(400).json({ error: 'bucketId and task.title required' })
    const b = await Bucket.findById(bucketId)
    if (!b) return res.status(400).json({ error: 'invalid bucketId' })
    const t = new Task({ ...task, bucketId })
    await t.save()
    res.status(201).json(t)
  } catch (err) { res.status(400).json({ error: err.message }) }
})

app.put('/api/tasks/:id', async (req, res) => {
  try {
    const updates = req.body.task || req.body
    const t = await Task.findByIdAndUpdate(req.params.id, updates, { new: true })
    if (!t) return res.sendStatus(404)
    res.json(t)
  } catch (err) { res.status(400).json({ error: err.message }) }
})

app.delete('/api/tasks/:id', async (req, res) => {
  try { await Task.findByIdAndDelete(req.params.id); res.sendStatus(204) } catch (err) { res.status(500).json({ error: err.message }) }
})

// move endpoint: update task.bucketId and optionally order management on frontend
app.post('/api/tasks/:id/move', async (req, res) => {
  try {
    const { fromBucketId, toBucketId } = req.body
    const t = await Task.findById(req.params.id)
    if (!t) return res.sendStatus(404)
    t.bucketId = toBucketId
    await t.save()
    res.json(t)
  } catch (err) { res.status(400).json({ error: err.message }) }
})

// --- Uploads (keep using multer from before) ---
const UPLOAD_DIR = path.join(__dirname, 'uploads')
app.use('/uploads', express.static(UPLOAD_DIR))
const storage = multer.diskStorage({ destination: (req, file, cb) => cb(null, UPLOAD_DIR), filename: (req, file, cb) => cb(null, `${Date.now().toString(36)}-${file.originalname}`) })
const upload = multer({ storage })

app.post('/api/uploads', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'file required' })
  const file = req.file
  const meta = { id: file.filename, name: file.originalname, size: `${Math.round(file.size/1024)}KB`, url: `/uploads/${path.basename(file.filename)}` }
  res.status(201).json(meta)
})

// --- SprintView Chart API ---
/**
 * POST /api/sprintview/schedule
 * Schedule tasks using SprintView chart algorithm
 * 
 * Body: {
 *   tasks: [
 *     {
 *       taskName: string,
 *       tentativeEtaDays: number,
 *       activityType: string,
 *       taskOwner: string
 *     }
 *   ],
 *   expandRecurring: boolean (optional)
 * }
 */
app.post('/api/sprintview/schedule', (req, res) => {
  try {
    const { tasks, expandRecurring = false } = req.body;

    // Validate input
    const validation = validateTasks(tasks);
    if (!validation.valid) {
      return res.status(400).json({ 
        error: 'Invalid task data', 
        details: validation.errors 
      });
    }

    // Normalize activity types (support both formats)
    const normalizedTasks = tasks.map(task => ({
      ...task,
      activityType: task.activityType || 'ONE_TIME',
      tentativeEtaDays: task.tentativeEtaDays || 1
    }));

    // Schedule tasks
    const result = scheduleSprintViewTasks(normalizedTasks);

    // Optionally expand recurring tasks
    if (expandRecurring) {
      const expandedTasks = [];
      result.scheduledTasks.forEach(task => {
        const occurrences = expandRecurringTask(task, result.totalProjectWeeks);
        expandedTasks.push(...occurrences);
      });
      result.scheduledTasks = expandedTasks;
    }

    res.json(result);
  } catch (err) {
    console.error('SprintView scheduling error:', err);
    res.status(500).json({ error: 'Scheduling failed', message: err.message });
  }
});

/**
 * POST /api/sprintview/schedule-from-board/:boardId
 * Generate SprintView chart from existing board tasks
 */
app.post('/api/sprintview/schedule-from-board/:boardId', async (req, res) => {
  try {
    const { boardId } = req.params;
    const { expandRecurring = false } = req.body;

    // Fetch board with tasks
    const board = await Board.findById(boardId).lean();
    if (!board) {
      return res.status(404).json({ error: 'Board not found' });
    }

    // Fetch all tasks for this board
    const buckets = await Bucket.find({ boardId }).lean();
    const bucketIds = buckets.map(b => b._id);
    const tasks = await Task.find({ bucketId: { $in: bucketIds } })
      .populate('assignedTo', 'name')
      .lean();

    if (tasks.length === 0) {
      return res.json({
        scheduledTasks: [],
        totalProjectDays: 0,
        totalProjectWeeks: 0,
        message: 'No tasks found in board'
      });
    }

    // Convert database tasks to SprintView format
    // If task has multiple users, create separate task entries for each user
    const sprintviewTasks = [];
    tasks.forEach(task => {
      const owners = task.assignedTo && task.assignedTo.length > 0 
        ? task.assignedTo.map(user => user.name)
        : ['Unassigned'];
      
      // Create a separate task entry for each assigned user
      owners.forEach(owner => {
        sprintviewTasks.push({
          taskName: task.title,
          tentativeEtaDays: task.estimatedDays || 1,
          activityType: task.activityType || 'ONE_TIME',
          taskOwner: owner,
          taskId: task._id.toString(),
          priority: task.priority,
          dueDate: task.dueDate,
          isMultiUser: owners.length > 1,
          allOwners: owners
        });
      });
    });

    // Schedule
    const result = scheduleSprintViewTasks(sprintviewTasks);

    // Expand recurring if requested
    if (expandRecurring) {
      const expandedTasks = [];
      result.scheduledTasks.forEach(task => {
        const occurrences = expandRecurringTask(task, result.totalProjectWeeks);
        expandedTasks.push(...occurrences);
      });
      result.scheduledTasks = expandedTasks;
    }

    result.boardInfo = {
      boardId: board._id,
      boardName: board.name,
      totalTasks: tasks.length
    };

    res.json(result);
  } catch (err) {
    console.error('Board SprintView scheduling error:', err);
    res.status(500).json({ error: 'Scheduling failed', message: err.message });
  }
});

/**
 * GET /api/sprintview/activity-types
 * Get list of supported activity types
 */
app.get('/api/sprintview/activity-types', (req, res) => {
  res.json({
    activityTypes: Object.values(ACTIVITY_TYPES),
    descriptions: {
      ONE_TIME: 'Standard task with fixed duration',
      CONTINUOUS: 'Task that runs until project end',
      API_1_DAY: 'API integration task (always 1 day)',
      RECURRING_WEEKLY: 'Task that repeats weekly (1 day per week)',
      MILESTONE: 'Zero-duration checkpoint',
      BUFFER: 'Risk padding (blocks owner, rendered as dashed)',
      PARALLEL_ALLOWED: 'Can overlap with other tasks for same owner'
    }
  });
})

/**
 * POST /api/sprintview/user-day-view
 * Transform scheduled tasks into per-user, per-day occupancy grid
 * 
 * Body:
 * - scheduledTasks: Array of scheduled tasks (from schedule endpoint)
 * - totalProjectWeeks: Total project duration
 * - format: 'nested' (default) or 'flat'
 * 
 * Response:
 * - users: Array of user objects with day-level task allocation
 * - weekGrid: Week structure for header rendering
 * - dayGrid: Day structure for column headers
 * - metadata: Stats and info
 */
app.post('/api/sprintview/user-day-view', (req, res) => {
  try {
    const { scheduledTasks, totalProjectWeeks, format = 'nested' } = req.body;

    if (!scheduledTasks || !Array.isArray(scheduledTasks)) {
      return res.status(400).json({ 
        error: 'scheduledTasks array is required' 
      });
    }

    if (!totalProjectWeeks || totalProjectWeeks <= 0) {
      return res.status(400).json({ 
        error: 'totalProjectWeeks must be positive' 
      });
    }

    const result = format === 'flat' 
      ? expandToFlatGrid(scheduledTasks, totalProjectWeeks)
      : expandToUserDayView(scheduledTasks, totalProjectWeeks);

    res.json(result);
  } catch (error) {
    console.error('User day view expansion error:', error);
    res.status(500).json({ 
      error: 'Failed to expand to user-day view',
      message: error.message 
    });
  }
});

/**
 * POST /api/sprintview/schedule-with-day-view
 * Combined endpoint: Schedule tasks AND return user-day view
 * 
 * Body: Same as /api/sprintview/schedule
 * 
 * Response: 
 * - schedule: Standard schedule output
 * - userDayView: Per-user day-level grid
 */
app.post('/api/sprintview/schedule-with-day-view', (req, res) => {
  try {
    const { tasks } = req.body;

    // Validate
    const validation = validateTasks(tasks);
    if (!validation.valid) {
      return res.status(400).json({ 
        error: 'Invalid tasks', 
        details: validation.errors 
      });
    }

    // Schedule
    const scheduleResult = scheduleSprintViewTasks(tasks);

    // Expand to user-day view
    const userDayView = expandToUserDayView(
      scheduleResult.scheduledTasks, 
      scheduleResult.totalProjectWeeks
    );

    res.json({
      schedule: scheduleResult,
      userDayView
    });
  } catch (error) {
    console.error('Combined schedule error:', error);
    res.status(500).json({ 
      error: 'Scheduling failed',
      message: error.message 
    });
  }
});

// fallback
app.use((req,res) => res.status(404).json({ error: 'not found' }))

const port = process.env.PORT || 4000
app.listen(port, () => console.log(`Planner backend running on http://localhost:${port}`))
