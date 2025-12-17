const Input = ({ 
  type = 'text', 
  value, 
  onChange, 
  placeholder, 
  className = '',
  disabled = false,
  required = false,
  name,
  id,
  label,
  error,
  autoFocus = false,
  onBlur,
  onKeyDown,
  ariaLabel,
}) => {
  const inputId = id || name;
  
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="form-label">
          {label}
          {required && <span className="text-danger-500 ml-1" aria-label="required">*</span>}
        </label>
      )}
      <input
        id={inputId}
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        autoFocus={autoFocus}
        aria-label={ariaLabel || label}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? `${inputId}-error` : undefined}
        className={`form-input ${error ? 'border-danger-500 focus:ring-danger-500' : ''} ${className}`}
      />
      {error && (
        <p id={`${inputId}-error`} className="mt-1.5 text-sm text-danger-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

export default Input;
