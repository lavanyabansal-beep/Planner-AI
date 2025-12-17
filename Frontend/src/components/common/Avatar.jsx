import { getInitials, getAvatarColor } from '../../utils/helpers';

const Avatar = ({ user, size = 'md', className = '' }) => {
  const sizes = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base',
    xl: 'w-12 h-12 text-lg',
  };
  
  // Generate a consistent color based on user ID or name if no avatarColor provided
  const bgColor = user?.avatarColor || getAvatarColor(user?._id || user?.name || 0);
  const initials = user ? getInitials(user.name) : '?';
  
  return (
    <div 
      className={`${sizes[size]} ${bgColor} rounded-full flex items-center justify-center text-white font-semibold shadow-sm ${className}`}
      title={user?.name}
    >
      {initials}
    </div>
  );
};

export default Avatar;
