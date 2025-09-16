import React from 'react'

/**
 * FIGMA-READY INPUT COMPONENT
 * This component is designed to be easily styled with Figma design tokens
 * Currently uses placeholder styles that match the existing terminal theme
 */

const Input = ({ 
  label,
  error,
  helperText,
  variant = 'default',
  size = 'md',
  disabled = false,
  className = '',
  ...props 
}) => {
  // Base classes that will be replaced with Figma styles
  const baseClasses = `
    w-full font-mono
    bg-terminal-bg border border-terminal-border text-terminal-fg
    rounded-md
    transition-all duration-200
    focus:outline-none focus:border-terminal-accent focus:ring-1 focus:ring-terminal-accent/50
    disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-terminal-border/20
    placeholder:text-terminal-fg/50
  `

  // Variant styles (to be replaced with Figma design tokens)
  const variantClasses = {
    default: 'border-terminal-border focus:border-terminal-accent',
    error: 'border-red-500 focus:border-red-500 focus:ring-red-500/50',
    success: 'border-green-500 focus:border-green-500 focus:ring-green-500/50'
  }

  // Size styles (to be replaced with Figma design tokens)
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-2 text-sm',
    lg: 'px-4 py-3 text-base'
  }

  const inputClasses = `
    ${baseClasses}
    ${variantClasses[variant]}
    ${sizeClasses[size]}
    ${className}
  `.trim()

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-terminal-fg/80 mb-2">
          {label}
        </label>
      )}
      
      <input
        className={inputClasses}
        disabled={disabled}
        {...props}
      />
      
      {error && (
        <p className="mt-1 text-xs text-red-400">
          {error}
        </p>
      )}
      
      {helperText && !error && (
        <p className="mt-1 text-xs text-terminal-fg/60">
          {helperText}
        </p>
      )}
    </div>
  )
}

// Select Component
const Select = ({ 
  label,
  error,
  helperText,
  variant = 'default',
  size = 'md',
  disabled = false,
  className = '',
  children,
  ...props 
}) => {
  // Base classes that will be replaced with Figma styles
  const baseClasses = `
    w-full font-mono
    bg-terminal-bg border border-terminal-border text-terminal-fg
    rounded-md
    transition-all duration-200
    focus:outline-none focus:border-terminal-accent focus:ring-1 focus:ring-terminal-accent/50
    disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-terminal-border/20
  `

  // Variant styles (to be replaced with Figma design tokens)
  const variantClasses = {
    default: 'border-terminal-border focus:border-terminal-accent',
    error: 'border-red-500 focus:border-red-500 focus:ring-red-500/50',
    success: 'border-green-500 focus:border-green-500 focus:ring-green-500/50'
  }

  // Size styles (to be replaced with Figma design tokens)
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-2 text-sm',
    lg: 'px-4 py-3 text-base'
  }

  const selectClasses = `
    ${baseClasses}
    ${variantClasses[variant]}
    ${sizeClasses[size]}
    ${className}
  `.trim()

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-terminal-fg/80 mb-2">
          {label}
        </label>
      )}
      
      <select
        className={selectClasses}
        disabled={disabled}
        {...props}
      >
        {children}
      </select>
      
      {error && (
        <p className="mt-1 text-xs text-red-400">
          {error}
        </p>
      )}
      
      {helperText && !error && (
        <p className="mt-1 text-xs text-terminal-fg/60">
          {helperText}
        </p>
      )}
    </div>
  )
}

// Export both components
Input.Select = Select

export default Input
