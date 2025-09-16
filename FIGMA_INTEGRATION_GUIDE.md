# 🎨 Figma Integration Guide

## 📋 Overview
This guide explains how to integrate Figma designs into the Fantasy Football Commissar frontend. The skeleton structure is already in place and ready for Figma design tokens and components.

## 🏗️ Current Skeleton Structure

### **Design System Files**
```
frontend/src/styles/
├── design-tokens.css      # CSS custom properties for Figma tokens
├── figma-integration.css  # Layout, animations, and utilities
└── index.css             # Main CSS file (imports design system)
```

### **UI Components**
```
frontend/src/components/ui/
├── Button.jsx            # Figma-ready button component
├── Card.jsx              # Figma-ready card component
├── Input.jsx             # Figma-ready input component
└── index.js              # Component exports
```

## 🎯 Integration Workflow

### **Step 1: Extract Design Tokens from Figma**

1. **Open Figma Dev Mode**
   - Select your design
   - Click "Inspect" tab
   - Copy CSS properties

2. **Update `design-tokens.css`**
   ```css
   :root {
     /* Replace placeholder values with Figma tokens */
     --color-bg-primary: #your-figma-color;
     --font-family-primary: 'Your-Figma-Font';
     --spacing-md: 16px; /* From Figma measurements */
   }
   ```

### **Step 2: Update Component Styles**

1. **Replace placeholder classes in components**
   ```jsx
   // Before (placeholder)
   className="bg-terminal-bg border-terminal-border"
   
   // After (Figma styles)
   className="figma-button-primary"
   ```

2. **Use Figma design tokens**
   ```jsx
   // Components automatically use CSS custom properties
   <Button variant="primary" size="lg">
     Generate Analysis
   </Button>
   ```

### **Step 3: Implement Figma Layouts**

1. **Use Figma layout classes**
   ```jsx
   <div className="figma-container">
     <div className="figma-grid figma-grid-2">
       <Card>Content 1</Card>
       <Card>Content 2</Card>
     </div>
   </div>
   ```

2. **Apply Figma animations**
   ```jsx
   <div className="figma-fade-in">
     <Card className="figma-hover">
       Interactive content
     </Card>
   </div>
   ```

## 🔧 Component Usage Examples

### **Button Component**
```jsx
import { Button } from '../components/ui'

// Primary button
<Button variant="primary" size="lg" onClick={handleClick}>
  Generate Analysis
</Button>

// Secondary button with loading state
<Button variant="secondary" loading={isLoading}>
  Save Analysis
</Button>
```

### **Card Component**
```jsx
import { Card } from '../components/ui'

<Card variant="elevated" padding="lg">
  <Card.Header>
    <h2>Analysis Results</h2>
  </Card.Header>
  <Card.Body>
    <p>Your analysis content here...</p>
  </Card.Body>
  <Card.Footer>
    <Button variant="primary">Save</Button>
  </Card.Footer>
</Card>
```

### **Input Component**
```jsx
import { Input } from '../components/ui'

<Input
  label="Analysis Type"
  variant="default"
  size="md"
  value={analysisType}
  onChange={handleChange}
/>

<Input.Select
  label="Week"
  value={selectedWeek}
  onChange={handleWeekChange}
>
  <option value="1">Week 1</option>
  <option value="2">Week 2</option>
</Input.Select>
```

## 📱 Responsive Design

### **Breakpoints**
```css
/* Mobile */
@media (max-width: 768px) {
  .figma-grid-2 { grid-template-columns: 1fr; }
}

/* Tablet */
@media (min-width: 769px) and (max-width: 1024px) {
  .figma-grid-3 { grid-template-columns: repeat(2, 1fr); }
}

/* Desktop */
@media (min-width: 1025px) {
  .figma-grid-4 { grid-template-columns: repeat(4, 1fr); }
}
```

## 🎨 Design Token Categories

### **Colors**
- `--color-bg-primary` - Main background
- `--color-bg-secondary` - Card backgrounds
- `--color-text-primary` - Main text
- `--color-text-accent` - Accent text
- `--color-border-primary` - Borders

### **Typography**
- `--font-family-primary` - Main font
- `--font-size-*` - Size scale
- `--font-weight-*` - Weight scale
- `--line-height-*` - Line height scale

### **Spacing**
- `--spacing-xs` to `--spacing-3xl` - Spacing scale
- Used for padding, margins, gaps

### **Layout**
- `--radius-*` - Border radius scale
- `--shadow-*` - Shadow scale
- `--transition-*` - Animation timing

## 🚀 Migration Strategy

### **Phase 1: Design Tokens**
1. Extract colors, fonts, spacing from Figma
2. Update `design-tokens.css`
3. Test with existing components

### **Phase 2: Component Updates**
1. Replace placeholder styles in UI components
2. Add Figma-specific variants
3. Test component functionality

### **Phase 3: Layout Implementation**
1. Update main components with Figma layouts
2. Implement responsive breakpoints
3. Add Figma animations

### **Phase 4: Polish**
1. Fine-tune spacing and typography
2. Add hover/focus states
3. Test across devices

## 🔍 Testing Checklist

- [ ] All components render correctly
- [ ] Design tokens are applied consistently
- [ ] Responsive breakpoints work
- [ ] Animations are smooth
- [ ] Accessibility is maintained
- [ ] Performance is not impacted

## 📚 Resources

- **Figma Dev Mode**: [Figma Dev Mode Guide](https://help.figma.com/hc/en-us/articles/360025508774-Use-Dev-Mode)
- **CSS Custom Properties**: [MDN CSS Variables](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties)
- **Component Design**: [Design System Best Practices](https://www.designsystems.com/)

## 🎯 Next Steps

1. **Create Figma designs** for the Commissar interface
2. **Extract design tokens** using Figma Dev Mode
3. **Update design-tokens.css** with Figma values
4. **Replace component styles** with Figma specifications
5. **Test and iterate** until design matches Figma

The skeleton is ready - just add your Figma designs! 🎨
