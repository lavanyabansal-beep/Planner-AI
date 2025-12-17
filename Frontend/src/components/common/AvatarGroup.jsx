import Avatar from './Avatar';

const AvatarGroup = ({ users = [], max = 3, size = 'md' }) => {
  const displayUsers = users.slice(0, max);
  const remaining = users.length - max;
  
  const sizeClasses = {
    sm: '-ml-2',
    md: '-ml-2',
    lg: '-ml-3',
  };
  
  if (users.length === 0) return null;
  
  return (
    <div className="flex items-center">
      {displayUsers.map((user, index) => (
        <div key={user._id || index} className={index > 0 ? sizeClasses[size] : ''}>
          <Avatar user={user} size={size} className="ring-2 ring-gray-700" />
        </div>
      ))}
      {remaining > 0 && (
        <div className={`${sizeClasses[size]} ${size === 'sm' ? 'w-6 h-6 text-xs' : size === 'lg' ? 'w-10 h-10 text-base' : 'w-8 h-8 text-sm'} bg-gray-600 rounded-full flex items-center justify-center text-gray-200 font-semibold ring-2 ring-gray-700 shadow-sm`}>
          +{remaining}
        </div>
      )}
    </div>
  );
};

export default AvatarGroup;
