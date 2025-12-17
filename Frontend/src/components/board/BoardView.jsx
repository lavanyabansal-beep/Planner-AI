import { DndContext, DragOverlay, closestCorners, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { useState } from 'react';
import Bucket from './Bucket';
import AddBucketButton from './AddBucketButton';
import TaskCard from './TaskCard';

const BoardView = ({ 
  buckets, 
  tasks, 
  users = [],
  onCreateBucket, 
  onUpdateBucket, 
  onDeleteBucket,
  onCreateTask,
  onUpdateTask,
  onMoveTask,
  onTaskClick,
  getTasksByBucket
}) => {
  const [activeId, setActiveId] = useState(null);
  const [activeTask, setActiveTask] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event) => {
    const { active } = event;
    setActiveId(active.id);
    
    const task = tasks.find(t => t._id === active.id);
    if (task) {
      setActiveTask(task);
    }
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveId(null);
    setActiveTask(null);

    if (!over) return;

    const activeTask = tasks.find(t => t._id === active.id);
    if (!activeTask) return;

    // Dragging task over a bucket
    const overBucket = buckets.find(b => b._id === over.id);
    if (overBucket && activeTask.bucketId !== overBucket._id) {
      await onMoveTask(activeTask._id, activeTask.bucketId, overBucket._id);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="h-full overflow-x-auto overflow-y-hidden scrollbar-thin">
        <div className="flex gap-6 p-4 sm:p-6 h-full items-start min-w-min">
          <SortableContext items={buckets.map(b => b._id)} strategy={horizontalListSortingStrategy}>
            {buckets.map(bucket => (
              <Bucket
                key={bucket._id}
                bucket={bucket}
                tasks={getTasksByBucket(bucket._id)}
                users={users}
                onAddTask={onCreateTask}
                onDeleteBucket={onDeleteBucket}
                onUpdateBucket={onUpdateBucket}
                onUpdateTask={onUpdateTask}
                onTaskClick={onTaskClick}
              />
            ))}
          </SortableContext>
          
          <AddBucketButton onAdd={onCreateBucket} />
        </div>
      </div>

      <DragOverlay>
        {activeTask ? (
          <div className="rotate-2 opacity-90 cursor-grabbing">
            <TaskCard task={activeTask} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export default BoardView;
