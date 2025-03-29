/**
 * Component Optimizer Utility
 * 
 * This utility provides functions and HOCs for optimizing React components
 * to minimize unnecessary re-renders and improve performance.
 */

import React, { memo, PureComponent, useCallback, useMemo, useRef, useEffect } from 'react';
import { performanceMonitor } from './performanceMonitor';

/**
 * Custom implementation of React.memo with deep comparison
 * 
 * @param {React.Component} Component - Component to memoize
 * @param {Function} areEqual - Custom comparison function (optional)
 * @returns {React.Component} Memoized component
 */
export const memoWithDeepCompare = (Component, areEqual) => {
  // If no custom comparison function is provided, use a deep comparison
  if (!areEqual) {
    areEqual = (prevProps, nextProps) => {
      // Get all keys from both objects
      const allKeys = new Set([
        ...Object.keys(prevProps),
        ...Object.keys(nextProps)
      ]);
      
      // Compare each key
      for (const key of allKeys) {
        // Skip React's special props
        if (key === 'children' || key === 'ref') {
          continue;
        }
        
        // If the key exists in only one object, they're different
        if (!(key in prevProps) || !(key in nextProps)) {
          return false;
        }
        
        // If the values are different
        if (prevProps[key] !== nextProps[key]) {
          // If they're both objects, do a deep comparison
          if (
            typeof prevProps[key] === 'object' && 
            prevProps[key] !== null &&
            typeof nextProps[key] === 'object' && 
            nextProps[key] !== null
          ) {
            // Recursively compare objects
            if (!deepEqual(prevProps[key], nextProps[key])) {
              return false;
            }
          } else {
            // For non-objects, use strict equality
            return false;
          }
        }
      }
      
      return true;
    };
  }
  
  // Use React.memo with the comparison function
  return memo(Component, areEqual);
};

/**
 * Deep equality comparison for objects
 * 
 * @param {Object} obj1 - First object
 * @param {Object} obj2 - Second object
 * @returns {boolean} Whether the objects are deeply equal
 */
const deepEqual = (obj1, obj2) => {
  // Handle arrays
  if (Array.isArray(obj1) && Array.isArray(obj2)) {
    if (obj1.length !== obj2.length) {
      return false;
    }
    
    for (let i = 0; i < obj1.length; i++) {
      if (!deepEqual(obj1[i], obj2[i])) {
        return false;
      }
    }
    
    return true;
  }
  
  // Handle objects
  if (
    typeof obj1 === 'object' && 
    obj1 !== null &&
    typeof obj2 === 'object' && 
    obj2 !== null
  ) {
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);
    
    if (keys1.length !== keys2.length) {
      return false;
    }
    
    for (const key of keys1) {
      if (!keys2.includes(key)) {
        return false;
      }
      
      if (!deepEqual(obj1[key], obj2[key])) {
        return false;
      }
    }
    
    return true;
  }
  
  // Handle primitives
  return obj1 === obj2;
};

/**
 * HOC that wraps a component with performance monitoring
 * 
 * @param {React.Component} Component - Component to monitor
 * @param {Object} options - Monitoring options
 * @param {boolean} options.trackRenderTime - Whether to track render time
 * @param {boolean} options.logSlowRenders - Whether to log slow renders
 * @param {number} options.slowRenderThreshold - Threshold for slow renders in ms
 * @returns {React.Component} Monitored component
 */
export const withPerformanceMonitoring = (Component, options = {}) => {
  const {
    trackRenderTime = true,
    logSlowRenders = true,
    slowRenderThreshold = 16 // 16ms = 60fps
  } = options;
  
  // For function components
  if (typeof Component === 'function' && !Component.prototype?.isReactComponent) {
    const MonitoredComponent = (props) => {
      const renderStartTime = useRef(0);
      const componentName = Component.displayName || Component.name || 'AnonymousComponent';
      
      useEffect(() => {
        // Measure render time
        if (trackRenderTime) {
          const renderTime = performance.now() - renderStartTime.current;
          performanceMonitor.trackRenderTime(componentName, renderStartTime.current);
          
          // Log slow renders
          if (logSlowRenders && renderTime > slowRenderThreshold) {
            console.warn(`Slow render detected in ${componentName}: ${renderTime.toFixed(2)}ms`);
          }
        }
      });
      
      // Record render start time
      renderStartTime.current = performance.now();
      
      return <Component {...props} />;
    };
    
    MonitoredComponent.displayName = `withPerformanceMonitoring(${Component.displayName || Component.name || 'Component'})`;
    
    return MonitoredComponent;
  }
  
  // For class components
  return class MonitoredComponent extends PureComponent {
    static displayName = `withPerformanceMonitoring(${Component.displayName || Component.name || 'Component'})`;
    
    componentWillMount() {
      this.renderStartTime = performance.now();
    }
    
    componentDidMount() {
      if (trackRenderTime) {
        const renderTime = performance.now() - this.renderStartTime;
        const componentName = Component.displayName || Component.name || 'AnonymousComponent';
        performanceMonitor.trackRenderTime(componentName, this.renderStartTime);
        
        if (logSlowRenders && renderTime > slowRenderThreshold) {
          console.warn(`Slow render detected in ${componentName}: ${renderTime.toFixed(2)}ms`);
        }
      }
      
      // Call original componentDidMount if it exists
      if (this.wrappedInstance && this.wrappedInstance.componentDidMount) {
        this.wrappedInstance.componentDidMount();
      }
    }
    
    componentWillUpdate() {
      this.renderStartTime = performance.now();
    }
    
    componentDidUpdate() {
      if (trackRenderTime) {
        const renderTime = performance.now() - this.renderStartTime;
        const componentName = Component.displayName || Component.name || 'AnonymousComponent';
        performanceMonitor.trackRenderTime(componentName, this.renderStartTime);
        
        if (logSlowRenders && renderTime > slowRenderThreshold) {
          console.warn(`Slow render detected in ${componentName}: ${renderTime.toFixed(2)}ms`);
        }
      }
      
      // Call original componentDidUpdate if it exists
      if (this.wrappedInstance && this.wrappedInstance.componentDidUpdate) {
        this.wrappedInstance.componentDidUpdate();
      }
    }
    
    render() {
      return (
        <Component
          {...this.props}
          ref={(instance) => { this.wrappedInstance = instance; }}
        />
      );
    }
  };
};

/**
 * Create a memoized selector function similar to reselect
 * 
 * @param {Array<Function>} inputSelectors - Array of input selector functions
 * @param {Function} resultFunc - Function to compute the result
 * @returns {Function} Memoized selector function
 */
export const createSelector = (inputSelectors, resultFunc) => {
  let lastInputs = null;
  let lastResult = null;
  
  return (...args) => {
    // Compute the input values
    const inputs = inputSelectors.map(selector => selector(...args));
    
    // Check if inputs have changed
    if (
      lastInputs === null ||
      inputs.length !== lastInputs.length ||
      inputs.some((input, index) => input !== lastInputs[index])
    ) {
      // Compute the new result
      lastResult = resultFunc(...inputs);
      lastInputs = inputs;
    }
    
    return lastResult;
  };
};

/**
 * Optimize a list component with windowing
 * 
 * @param {React.Component} ListComponent - List component to optimize
 * @param {Object} options - Windowing options
 * @param {number} options.itemHeight - Height of each item in the list
 * @param {number} options.overscan - Number of items to render outside of the visible area
 * @returns {React.Component} Optimized list component
 */
export const withWindowing = (ListComponent, options = {}) => {
  const {
    itemHeight = 50,
    overscan = 5
  } = options;
  
  return class WindowedList extends PureComponent {
    constructor(props) {
      super(props);
      
      this.state = {
        visibleStartIndex: 0,
        visibleEndIndex: 0,
        scrollTop: 0,
        containerHeight: 0
      };
      
      this.containerRef = React.createRef();
      this.handleScroll = this.handleScroll.bind(this);
    }
    
    componentDidMount() {
      if (this.containerRef.current) {
        const { height } = this.containerRef.current.getBoundingClientRect();
        this.updateVisibleRange(0, height);
      }
    }
    
    handleScroll(event) {
      const { scrollTop, clientHeight } = event.target;
      this.updateVisibleRange(scrollTop, clientHeight);
    }
    
    updateVisibleRange(scrollTop, containerHeight) {
      const { data } = this.props;
      
      if (!data || !data.length) {
        return;
      }
      
      const visibleStartIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
      const visibleEndIndex = Math.min(
        data.length - 1,
        Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
      );
      
      this.setState({
        visibleStartIndex,
        visibleEndIndex,
        scrollTop,
        containerHeight
      });
    }
    
    render() {
      const { data, renderItem, ...restProps } = this.props;
      const { visibleStartIndex, visibleEndIndex, scrollTop, containerHeight } = this.state;
      
      if (!data || !data.length) {
        return <ListComponent {...restProps} data={[]} renderItem={renderItem} />;
      }
      
      // Calculate total height of the list
      const totalHeight = data.length * itemHeight;
      
      // Get visible items
      const visibleData = data.slice(visibleStartIndex, visibleEndIndex + 1);
      
      // Calculate padding to position items correctly
      const paddingTop = visibleStartIndex * itemHeight;
      
      return (
        <div
          ref={this.containerRef}
          style={{ height: '100%', overflow: 'auto' }}
          onScroll={this.handleScroll}
        >
          <div style={{ height: totalHeight, position: 'relative' }}>
            <div style={{ position: 'absolute', top: paddingTop, left: 0, right: 0 }}>
              <ListComponent
                {...restProps}
                data={visibleData}
                renderItem={(item, index) => renderItem(item, index + visibleStartIndex)}
              />
            </div>
          </div>
        </div>
      );
    }
  };
};

export default {
  memoWithDeepCompare,
  withPerformanceMonitoring,
  createSelector,
  withWindowing,
  memo, // Re-export React.memo for convenience
  PureComponent, // Re-export React.PureComponent for convenience
  useCallback, // Re-export React.useCallback for convenience
  useMemo // Re-export React.useMemo for convenience
};