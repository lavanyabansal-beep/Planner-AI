export const getInitials = (name) => {
  if (!name) return '??';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export const getAvatarColor = (identifier) => {
  const colors = [
    'bg-blue-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-green-500',
    'bg-yellow-500',
    'bg-red-500',
    'bg-indigo-500',
    'bg-teal-500',
    'bg-orange-500',
    'bg-cyan-500',
  ];
  
  // Generate a consistent index based on the identifier
  if (typeof identifier === 'string') {
    // Hash the string to get a number
    let hash = 0;
    for (let i = 0; i < identifier.length; i++) {
      hash = identifier.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }
  
  return colors[Math.abs(identifier || 0) % colors.length];
};

export const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  const now = new Date();
  const diffTime = Math.abs(now - d);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays < 7) return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export const getPriorityColor = (priority) => {
  const colors = {
    urgent: 'text-red-600 bg-red-50',
    important: 'text-orange-600 bg-orange-50',
    medium: 'text-blue-600 bg-blue-50',
    low: 'text-gray-600 bg-gray-50',
  };
  return colors[priority] || colors.medium;
};

export const getPriorityColorDark = (priority) => {
  const colors = {
    urgent: 'text-red-200 bg-red-500/20 border border-red-500/30',
    important: 'text-orange-200 bg-orange-500/20 border border-orange-500/30',
    medium: 'text-blue-200 bg-blue-500/20 border border-blue-500/30',
    low: 'text-gray-300 bg-gray-600/50 border border-gray-500/30',
  };
  return colors[priority] || colors.medium;
};

export const getProgressColor = (progress) => {
  const colors = {
    not_started: 'text-gray-600 bg-gray-100',
    in_progress: 'text-blue-600 bg-blue-100',
    completed: 'text-green-600 bg-green-100',
  };
  return colors[progress] || colors.not_started;
};

export const getProgressLabel = (progress) => {
  const labels = {
    not_started: 'Not Started',
    in_progress: 'In Progress',
    completed: 'Completed',
  };
  return labels[progress] || 'Not Started';
};
