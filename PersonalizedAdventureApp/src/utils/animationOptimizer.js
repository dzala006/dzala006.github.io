/**
 * Animation Optimizer Utility
 * 
 * This utility provides optimized animation functions using React Native's Animated API
 * and React Native Reanimated for better performance.
 */

import { Animated, Easing, Platform } from 'react-native';
import Reanimated, { 
  withTiming, 
  withSpring, 
  withRepeat, 
  withSequence,
  useSharedValue,
  useAnimatedStyle,
  cancelAnimation,
  runOnJS
} from 'react-native-reanimated';

/**
 * Create an optimized fade-in animation
 * 
 * @param {Animated.Value} value - Animated value to animate
 * @param {Object} options - Animation options
 * @param {number} options.duration - Animation duration in ms (default: 300)
 * @param {Function} options.easing - Easing function (default: Easing.ease)
 * @param {Function} options.onComplete - Callback when animation completes
 * @returns {Animated.CompositeAnimation} Animation object
 */
export const createFadeInAnimation = (value, options = {}) => {
  const { 
    duration = 300, 
    easing = Easing.ease,
    onComplete
  } = options;
  
  return Animated.timing(value, {
    toValue: 1,
    duration,
    easing,
    useNativeDriver: true,
    isInteraction: false, // Prevents blocking other interactions
    onComplete
  });
};

/**
 * Create an optimized fade-out animation
 * 
 * @param {Animated.Value} value - Animated value to animate
 * @param {Object} options - Animation options
 * @param {number} options.duration - Animation duration in ms (default: 300)
 * @param {Function} options.easing - Easing function (default: Easing.ease)
 * @param {Function} options.onComplete - Callback when animation completes
 * @returns {Animated.CompositeAnimation} Animation object
 */
export const createFadeOutAnimation = (value, options = {}) => {
  const { 
    duration = 300, 
    easing = Easing.ease,
    onComplete
  } = options;
  
  return Animated.timing(value, {
    toValue: 0,
    duration,
    easing,
    useNativeDriver: true,
    isInteraction: false,
    onComplete
  });
};

/**
 * Create an optimized scale animation
 * 
 * @param {Animated.Value} value - Animated value to animate
 * @param {number} toValue - Target scale value
 * @param {Object} options - Animation options
 * @param {number} options.duration - Animation duration in ms (default: 300)
 * @param {Function} options.easing - Easing function (default: Easing.ease)
 * @param {Function} options.onComplete - Callback when animation completes
 * @returns {Animated.CompositeAnimation} Animation object
 */
export const createScaleAnimation = (value, toValue, options = {}) => {
  const { 
    duration = 300, 
    easing = Easing.ease,
    onComplete
  } = options;
  
  return Animated.timing(value, {
    toValue,
    duration,
    easing,
    useNativeDriver: true,
    isInteraction: false,
    onComplete
  });
};

/**
 * Create an optimized spring animation
 * 
 * @param {Animated.Value} value - Animated value to animate
 * @param {number} toValue - Target value
 * @param {Object} options - Spring animation options
 * @param {number} options.friction - Spring friction (default: 7)
 * @param {number} options.tension - Spring tension (default: 40)
 * @param {boolean} options.useNativeDriver - Whether to use native driver (default: true)
 * @param {Function} options.onComplete - Callback when animation completes
 * @returns {Animated.CompositeAnimation} Animation object
 */
export const createSpringAnimation = (value, toValue, options = {}) => {
  const { 
    friction = 7, 
    tension = 40,
    useNativeDriver = true,
    onComplete
  } = options;
  
  return Animated.spring(value, {
    toValue,
    friction,
    tension,
    useNativeDriver,
    isInteraction: false,
    onComplete
  });
};

/**
 * Create a sequence of animations to run one after another
 * 
 * @param {Array} animations - Array of animation objects
 * @returns {Animated.CompositeAnimation} Composite animation
 */
export const createSequenceAnimation = (animations) => {
  return Animated.sequence(animations);
};

/**
 * Create a parallel set of animations to run simultaneously
 * 
 * @param {Array} animations - Array of animation objects
 * @returns {Animated.CompositeAnimation} Composite animation
 */
export const createParallelAnimation = (animations) => {
  return Animated.parallel(animations, { stopTogether: false });
};

/**
 * Create a staggered set of animations
 * 
 * @param {Array} animations - Array of animation objects
 * @param {number} staggerDelay - Delay between each animation in ms
 * @returns {Animated.CompositeAnimation} Composite animation
 */
export const createStaggeredAnimation = (animations, staggerDelay = 100) => {
  return Animated.stagger(staggerDelay, animations);
};

/**
 * Create a loop animation that repeats
 * 
 * @param {Animated.CompositeAnimation} animation - Animation to repeat
 * @param {Object} options - Loop options
 * @param {number} options.iterations - Number of iterations (-1 for infinite)
 * @param {boolean} options.resetBeforeIteration - Whether to reset before each iteration
 * @returns {Animated.CompositeAnimation} Looped animation
 */
export const createLoopAnimation = (animation, options = {}) => {
  const { 
    iterations = -1, 
    resetBeforeIteration = true 
  } = options;
  
  return Animated.loop(animation, { 
    iterations, 
    resetBeforeIteration 
  });
};

/**
 * Reanimated-specific optimized animations for more complex cases
 */

/**
 * Create a Reanimated-based fade animation
 * 
 * @param {Reanimated.SharedValue} sharedValue - Reanimated shared value
 * @param {number} toValue - Target opacity value
 * @param {Object} options - Animation options
 * @param {number} options.duration - Animation duration in ms
 * @param {Function} options.onComplete - Callback when animation completes
 */
export const createReanimatedFade = (sharedValue, toValue, options = {}) => {
  const { duration = 300, onComplete } = options;
  
  sharedValue.value = withTiming(toValue, {
    duration,
  }, (finished) => {
    if (finished && onComplete) {
      runOnJS(onComplete)();
    }
  });
};

/**
 * Create a Reanimated-based spring animation
 * 
 * @param {Reanimated.SharedValue} sharedValue - Reanimated shared value
 * @param {number} toValue - Target value
 * @param {Object} options - Spring animation options
 * @param {number} options.damping - Spring damping (default: 10)
 * @param {number} options.stiffness - Spring stiffness (default: 100)
 * @param {Function} options.onComplete - Callback when animation completes
 */
export const createReanimatedSpring = (sharedValue, toValue, options = {}) => {
  const { damping = 10, stiffness = 100, onComplete } = options;
  
  sharedValue.value = withSpring(toValue, {
    damping,
    stiffness,
  }, (finished) => {
    if (finished && onComplete) {
      runOnJS(onComplete)();
    }
  });
};

/**
 * Create a Reanimated-based repeating animation
 * 
 * @param {Reanimated.SharedValue} sharedValue - Reanimated shared value
 * @param {number} fromValue - Starting value
 * @param {number} toValue - Target value
 * @param {Object} options - Animation options
 * @param {number} options.duration - Animation duration in ms
 * @param {number} options.iterations - Number of iterations (-1 for infinite)
 * @param {boolean} options.reverse - Whether to reverse the animation
 */
export const createReanimatedRepeat = (sharedValue, fromValue, toValue, options = {}) => {
  const { duration = 1000, iterations = -1, reverse = true } = options;
  
  sharedValue.value = withRepeat(
    reverse 
      ? withSequence(
          withTiming(toValue, { duration: duration / 2 }),
          withTiming(fromValue, { duration: duration / 2 })
        )
      : withTiming(toValue, { duration }),
    iterations,
    reverse
  );
};

/**
 * Stop a Reanimated animation
 * 
 * @param {Reanimated.SharedValue} sharedValue - Reanimated shared value to stop animating
 */
export const stopReanimatedAnimation = (sharedValue) => {
  cancelAnimation(sharedValue);
};

export default {
  // Standard Animated API
  createFadeInAnimation,
  createFadeOutAnimation,
  createScaleAnimation,
  createSpringAnimation,
  createSequenceAnimation,
  createParallelAnimation,
  createStaggeredAnimation,
  createLoopAnimation,
  
  // Reanimated API
  createReanimatedFade,
  createReanimatedSpring,
  createReanimatedRepeat,
  stopReanimatedAnimation,
  
  // Reanimated hooks (re-exported for convenience)
  useSharedValue,
  useAnimatedStyle
};