import React from 'react'

/**
 * FIGMA-READY BUTTON COMPONENT
 * This component is designed to be easily styled with Figma design tokens
 * Currently uses placeholder styles that match the existing terminal theme
 */

const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  disabled = false, 
  loading = false,
  onClick,
  className = '',
  ...props 
}) => {
  // Base classes that will be replaced with Figma styles
  const baseClasses = `
    inline-flex items-center justify-center
    font-mono font-medium
    border rounded-md
    transition-all duration-200
    focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
  `

  // Variant styles (to be replaced with Figma design tokens)
  const variantClasses = {
    primary: `
      bg-terminal-accent/10 border-terminal-accent text-terminal-accent
      hover:bg-terminal-accent/20 hover:border-terminal-accent/80
      focus:ring-terminal-accent/50
    `,
    secondary: `
      bg-terminal-border/20 border-terminal-border text-terminal-fg
      hover:bg-terminal-border/30 hover:border-terminal-border/80
      focus:ring-terminal-border/50
    `,
    success: `
      bg-green-600/20 border-green-500 text-green-400
      hover:bg-green-600/30 hover:border-green-500/80
      focus:ring-green-500/50
    `,
    danger: `
      bg-red-600/20 border-red-500 text-red-400
      hover:bg-red-600/30 hover:border-red-500/80
      focus:ring-red-500/50
    `
  }

  // Size styles (to be replaced with Figma design tokens)
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
    xl: 'px-8 py-4 text-lg'
  }

  const classes = `
    ${baseClasses}
    ${variantClasses[variant]}
    ${sizeClasses[size]}
    ${className}
  `.trim()

  return (
    <button
      className={classes}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading && (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
      )}
      {children}
    </button>
  )
}

export default Button
