/**
 * UI Package for Personalized Adventure App
 * 
 * This file exports all UI components and theme elements in a single package.
 * It ensures proper dependency order and avoids circular dependencies.
 */

// Export theme constants
export { 
  colors, 
  typography, 
  spacing, 
  borderRadius, 
  shadows, 
  animation, 
  zIndex, 
  breakpoints 
} from '../theme/theme';

// Export common components
export { 
  Button, 
  Card, 
  Container, 
  Typography 
} from './common';

// Export enhanced components
export { default as FeedbackPopup } from './FeedbackPopup';
export { default as SocialShareButton } from './SocialShareButton';

/**
 * Usage Guide:
 * 
 * Import all UI components and theme elements from this file:
 * 
 * ```jsx
 * import { 
 *   // Theme constants
 *   colors, typography, spacing, 
 *   
 *   // UI components
 *   Button, Card, Container, Typography, FeedbackPopup, SocialShareButton 
 * } from '../components/ui-package';
 * 
 * // Then use them in your component
 * const MyComponent = () => (
 *   <Container>
 *     <Typography variant="h4" color="primary.main">
 *       Welcome to Personalized Adventure
 *     </Typography>
 *     <Card elevation="medium">
 *       <Typography variant="body1">
 *         Your personalized adventure awaits!
 *       </Typography>
 *       <Button 
 *         label="Get Started" 
 *         variant="primary"
 *         onPress={() => console.log('Button pressed')}
 *       />
 *       <SocialShareButton
 *         title="My Adventure"
 *         message="Check out my personalized adventure!"
 *         variant="secondary"
 *         buttonText="Share"
 *       />
 *     </Card>
 *   </Container>
 * );
 * ```
 * 
 * For more detailed documentation, see UI_COMPONENTS_GUIDE.md
 */