# Personalized Adventure App UI Components Guide

This guide explains how to use the new UI components and design system in the Personalized Adventure App.

## Design System

The app uses a comprehensive design system defined in `src/theme/theme.js`. This includes:

- **Colors**: Primary, secondary, accent, and neutral color palettes
- **Typography**: Font families, sizes, weights, and line heights
- **Spacing**: Consistent spacing values for margins, padding, etc.
- **Border Radius**: Rounded corner values for UI elements
- **Shadows**: Elevation levels for components
- **Animation**: Timing values for animations
- **Z-Index**: Layer management for overlapping elements
- **Breakpoints**: Screen size definitions for responsive design

## Common Components

### Button

A customizable button component with different variants, sizes, and states.

```jsx
import { Button } from '../components/common';

// Basic usage
<Button 
  label="Get Started" 
  onPress={() => console.log('Button pressed')} 
/>

// Variants
<Button variant="primary" label="Primary Button" />
<Button variant="secondary" label="Secondary Button" />
<Button variant="outline" label="Outline Button" />
<Button variant="text" label="Text Button" />

// Sizes
<Button size="small" label="Small Button" />
<Button size="medium" label="Medium Button" />
<Button size="large" label="Large Button" />

// States
<Button disabled label="Disabled Button" />
<Button loading label="Loading Button" />

// Accessibility
<Button 
  label="Accessible Button" 
  accessibilityLabel="Custom accessibility label"
/>
```

### Card

A container component for grouping related content with optional interactivity.

```jsx
import { Card, Typography } from '../components/common';

// Basic usage
<Card>
  <Typography variant="h6">Card Title</Typography>
  <Typography variant="body1">Card content goes here</Typography>
</Card>

// Interactive card
<Card 
  interactive 
  onPress={() => console.log('Card pressed')}
>
  <Typography variant="h6">Interactive Card</Typography>
</Card>

// Elevation levels
<Card elevation="none">No Shadow</Card>
<Card elevation="low">Low Shadow</Card>
<Card elevation="medium">Medium Shadow</Card>
<Card elevation="high">High Shadow</Card>
```

### Typography

A text component with consistent styling based on the design system.

```jsx
import { Typography } from '../components/common';

// Variants
<Typography variant="h1">Heading 1</Typography>
<Typography variant="h2">Heading 2</Typography>
<Typography variant="h3">Heading 3</Typography>
<Typography variant="h4">Heading 4</Typography>
<Typography variant="h5">Heading 5</Typography>
<Typography variant="h6">Heading 6</Typography>
<Typography variant="subtitle1">Subtitle 1</Typography>
<Typography variant="subtitle2">Subtitle 2</Typography>
<Typography variant="body1">Body 1</Typography>
<Typography variant="body2">Body 2</Typography>
<Typography variant="caption">Caption</Typography>
<Typography variant="overline">Overline</Typography>

// Colors
<Typography color="primary.main">Primary Color</Typography>
<Typography color="secondary.main">Secondary Color</Typography>
<Typography color="text.primary">Text Primary</Typography>
<Typography color="text.secondary">Text Secondary</Typography>

// Alignment
<Typography align="left">Left aligned</Typography>
<Typography align="center">Center aligned</Typography>
<Typography align="right">Right aligned</Typography>
```

### Container

A layout component that provides consistent padding, safe area handling, and optional scrolling.

```jsx
import { Container, Typography } from '../components/common';

// Basic usage
<Container>
  <Typography variant="h4">Screen Content</Typography>
</Container>

// Scrollable container
<Container scrollable>
  <Typography variant="h4">Scrollable Content</Typography>
  {/* Long content here */}
</Container>

// With keyboard avoiding
<Container keyboardAvoiding>
  {/* Form inputs here */}
</Container>

// Custom background color
<Container backgroundColor="#f5f5f5">
  <Typography variant="h4">Custom Background</Typography>
</Container>
```

## Enhanced Components

### FeedbackPopup

The FeedbackPopup component has been enhanced with animations, accessibility improvements, and better user experience.

```jsx
import FeedbackPopup from '../components/FeedbackPopup';

// In your component
const [showFeedback, setShowFeedback] = useState(false);

// In your JSX
<FeedbackPopup
  visible={showFeedback}
  onClose={() => setShowFeedback(false)}
  onSubmit={(data) => console.log('Feedback submitted:', data)}
/>

// To show the popup
<Button 
  label="Give Feedback" 
  onPress={() => setShowFeedback(true)} 
/>
```

## Accessibility Features

All components include proper accessibility support:

- Appropriate accessibility roles and states
- Descriptive labels and hints for screen readers
- Focus management for keyboard navigation
- Color contrast that meets WCAG standards
- Support for different text sizes

## Animation System

The UI components use React Native's Animated API for smooth transitions and interactions:

- Button press animations
- Card hover effects
- Modal transitions
- Feedback popup animations

## Best Practices

1. Always import components from the common directory:
   ```jsx
   import { Button, Card, Typography, Container } from '../components/common';
   ```

2. Use the theme constants for consistent styling:
   ```jsx
   import { colors, spacing, typography } from '../theme/theme';
   ```

3. Provide accessibility labels for all interactive elements:
   ```jsx
   <Button 
     label="Submit" 
     accessibilityLabel="Submit your form"
     accessibilityHint="Sends your information to the server"
   />
   ```

4. Use the Container component as the base for all screens:
   ```jsx
   const MyScreen = () => (
     <Container scrollable safeArea>
       {/* Screen content */}
     </Container>
   );
   ```

5. Follow the design system for custom styles:
   ```jsx
   const styles = StyleSheet.create({
     container: {
       padding: spacing.md,
       backgroundColor: colors.background.primary,
     },
     title: {
       fontSize: typography.fontSize.xl,
       fontWeight: typography.fontWeight.bold,
       color: colors.text.primary,
     },
   });
   ```