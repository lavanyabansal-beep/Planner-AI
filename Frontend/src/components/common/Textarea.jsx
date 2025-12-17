const Textarea = ({ 
  value, 
  onChange, 
  placeholder, 
  className = '',
  rows = 3,
  disabled = false,
  required = false,
  name,
  id,
  label,
  error,
  ariaLabel,
  maxLength,
}) => {
  const textareaId = id || name;
  
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={textareaId} className="form-label">
          {label}
          {required && <span className="text-danger-500 ml-1" aria-label="required">*</span>}
        </label>
      )}
      <textarea
        id={textareaId}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        rows={rows}
        maxLength={maxLength}
        aria-label={ariaLabel || label}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? `${textareaId}-error` : undefined}
        className={`form-input resize-none ${error ? 'border-danger-500 focus:ring-danger-500' : ''} ${className}`}
      />
      {maxLength && (
        <p className="mt-1.5 text-xs text-gray-500 text-right">
          {value?.length || 0} / {maxLength}
        </p>
      )}
      {error && (
        <p id={`${textareaId}-error`} className="mt-1.5 text-sm text-danger-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

export default Textarea;
