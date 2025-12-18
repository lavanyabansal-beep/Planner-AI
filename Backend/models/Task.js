const mongoose = require('mongoose')

const SubtaskSchema = new mongoose.Schema({
  text: String,
  done: { type: Boolean, default: false },
  dueDate: { type: Date },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { _id: true })

const ChecklistItemSchema = new mongoose.Schema({
  text: String,
  done: { type: Boolean, default: false }
}, { _id: true })

const AttachmentSchema = new mongoose.Schema({
  name: String,
  size: String,
  url: String
}, { _id: true })

const TaskSchema = new mongoose.Schema({
  bucketId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bucket', required: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  completed: { type: Boolean, default: false },
  assignedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  labels: [{ type: String }],
  priority: { type: String, enum: ['urgent','important','medium','low'], default: 'medium' },
  progress: { type: String, enum: ['not_started','in_progress','completed'], default: 'not_started' },
  startDate: { type: Date },
  dueDate: { type: Date },
  repeat: { type: String, default: 'does_not_repeat' },
  
  // Activity type for task management
  activityType: { type: String, default: 'One-Time' },
  estimatedDays: { type: Number, default: 0 },
  
  // Subtasks
  subtasks: [SubtaskSchema],
  
  checklist: [ChecklistItemSchema],
  attachments: [AttachmentSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})

TaskSchema.pre('save', function (next) { this.updatedAt = Date.now(); next(); })

module.exports = mongoose.model('Task', TaskSchema)
