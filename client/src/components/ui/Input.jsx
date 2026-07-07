import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export default function Input({
  label, type = 'text', error, icon, className = '',
  value, onChange, placeholder, disabled, required,
  name, id, autoComplete, defaultValue, ...props
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState(false);
  const inputId = id || name || label?.toLowerCase().replace(/\s+/g, '-');
  const isPassword = type === 'password';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label htmlFor={inputId} className="block text-xs font-medium mb-1.5"
          style={{ color: error ? '#F43F5E' : focused ? '#6366F1' : '#94A3B8' }}>
          {label}{required && <span style={{ color: '#F43F5E' }} className="ml-0.5">*</span>}
        </label>
      )}
      <div className="relative flex items-center">
        {icon && (
          <span className="absolute left-3 z-10" style={{ color: focused ? '#6366F1' : '#475569' }}>
            {icon}
          </span>
        )}
        <input
          id={inputId}
          name={name}
          type={inputType}
          value={value}
          defaultValue={defaultValue}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          disabled={disabled}
          required={required}
          autoComplete={autoComplete}
          placeholder={placeholder}
          className="w-full rounded-xl text-sm outline-none transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: '#1A2236',
            border: `1px solid ${error ? '#F43F5E' : focused ? 'rgba(99,102,241,0.6)' : 'rgba(255,255,255,0.1)'}`,
            color: '#F1F5F9',
            padding: `12px ${isPassword ? '44px' : '16px'} 12px ${icon ? '40px' : '16px'}`,
            boxShadow: focused ? '0 0 0 3px rgba(99,102,241,0.15)' : 'none',
          }}
          {...props}
        />
        {isPassword && (
          <button type="button" onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 transition-colors"
            style={{ color: '#475569' }}
            onMouseEnter={e => e.currentTarget.style.color = '#F1F5F9'}
            onMouseLeave={e => e.currentTarget.style.color = '#475569'}>
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
      {error && (
        <p className="mt-1.5 text-xs flex items-center gap-1" style={{ color: '#F43F5E' }}>
          ⚠ {error}
        </p>
      )}
    </div>
  );
}
