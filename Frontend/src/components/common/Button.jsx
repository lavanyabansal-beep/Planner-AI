const Button = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  size = 'md', 
  disabled = false,
  className = '',
  type = 'button',
  ariaLabel,
  icon,
  fullWidth = false,
}) => {
  const baseStyles = 'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none';
  
  const variants = {
    primary: 'bg-gradient-to-r from-primary-600 to-purple-600 text-white hover:from-primary-700 hover:to-purple-700 active:from-primary-800 active:to-purple-800 focus:ring-primary-500 shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-500/40 disabled:hover:from-primary-600 disabled:hover:to-purple-600',
    secondary: 'bg-gray-700 text-gray-100 border border-gray-600 hover:bg-gray-600 active:bg-gray-500 focus:ring-primary-500 shadow-sm hover:shadow disabled:hover:bg-gray-700',
    danger: 'bg-gradient-to-r from-danger-600 to-orange-600 text-white hover:from-danger-700 hover:to-orange-700 active:from-danger-800 active:to-orange-800 focus:ring-danger-500 shadow-lg shadow-danger-500/30 hover:shadow-xl hover:shadow-danger-500/40 disabled:hover:from-danger-600 disabled:hover:to-orange-600',
    ghost: 'text-gray-300 hover:bg-gray-700 active:bg-gray-600 focus:ring-gray-500',
    success: 'bg-gradient-to-r from-success-600 to-emerald-600 text-white hover:from-success-700 hover:to-emerald-700 active:from-success-800 active:to-emerald-800 focus:ring-success-500 shadow-lg shadow-success-500/30 hover:shadow-xl hover:shadow-success-500/40 disabled:hover:from-success-600 disabled:hover:to-emerald-600',
  };
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };
  
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </button>
  );
};

export default Button;
