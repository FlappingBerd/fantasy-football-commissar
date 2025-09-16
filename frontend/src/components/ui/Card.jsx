import React from 'react'

/**
 * FIGMA-READY CARD COMPONENT
 * This component is designed to be easily styled with Figma design tokens
 * Currently uses placeholder styles that match the existing terminal theme
 */

const Card = ({ 
  children, 
  variant = 'default', 
  padding = 'md',
  className = '',
  ...props 
}) => {
  // Base classes that will be replaced with Figma styles
  const baseClasses = `
    bg-terminal-bg border border-terminal-border rounded-md overflow-hidden
    transition-all duration-200
  `

  // Variant styles (to be replaced with Figma design tokens)
  const variantClasses = {
    default: 'bg-terminal-bg border-terminal-border',
    elevated: 'bg-terminal-bg border-terminal-border shadow-lg',
    outlined: 'bg-transparent border-terminal-border',
    filled: 'bg-terminal-border/20 border-terminal-border/50'
  }

  // Padding styles (to be replaced with Figma design tokens)
  const paddingClasses = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
    xl: 'p-8'
  }

  const classes = `
    ${baseClasses}
    ${variantClasses[variant]}
    ${paddingClasses[padding]}
    ${className}
  `.trim()

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  )
}

// Card Header Component
const CardHeader = ({ children, className = '', ...props }) => {
  const classes = `
    px-4 py-3 bg-terminal-border/30 border-b border-terminal-border
    ${className}
  `.trim()

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  )
}

// Card Body Component
const CardBody = ({ children, className = '', ...props }) => {
  const classes = `
    p-6
    ${className}
  `.trim()

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  )
}

// Card Footer Component
const CardFooter = ({ children, className = '', ...props }) => {
  const classes = `
    px-4 py-3 bg-terminal-border/20 border-t border-terminal-border
    ${className}
  `.trim()

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  )
}

// Export main Card and sub-components
Card.Header = CardHeader
Card.Body = CardBody
Card.Footer = CardFooter

export default Card
