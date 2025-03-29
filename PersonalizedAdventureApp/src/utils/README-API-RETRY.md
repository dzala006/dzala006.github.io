# API Retry System Documentation

This document explains the enhanced API retry system implemented for the Personalized Adventure App. The system provides robust error handling and automatic retries using exponential backoff with jitter.

## Overview

The API retry system consists of two main components:

1. **enhancedApiRetry.js** - Core retry functionality with exponential backoff and jitter
2. **enhancedApiService.js** - Integration with the existing API service

## Features

- **Exponential Backoff**: Retry delays increase exponentially with each attempt
- **Jitter**: Random variation in retry delays to prevent synchronized retries
- **Smart Retry Logic**: Only retries appropriate errors (network issues, server errors, rate limiting)
- **Performance Monitoring**: Tracks API call performance and retry attempts
- **Caching Integration**: Works with the existing API caching system
- **Configurable Options**: Customizable retry behavior per request

## Usage Examples

### Basic Usage

Replace imports from `apiService` with `enhancedApiService`:

```javascript
// Before
import * as apiService from '../utils/apiService';

// After
import * as apiService from '../utils/enhancedApiService';

// Usage remains the same
const userData = await apiService.get('/users/profile');
```

### Custom Retry Options

You can provide custom retry options for specific requests:

```javascript
import * as apiService from '../utils/enhancedApiService';

// Custom retry options for this specific request
const customRetryOptions = {
  maxRetries: 5,
  baseDelay: 2000,
  maxDelay: 60000,
  jitterFactor: 0.3
};

// Use custom retry options for this request
const result = await apiService.post(
  '/important-endpoint', 
  data, 
  {}, // Regular options
  customRetryOptions // Retry options
);
```

### Cached Requests with Retry

For GET requests that benefit from caching:

```javascript
import * as apiService from '../utils/enhancedApiService';

// Cache options
const cacheOptions = {
  useCache: true,
  ttl: 10 * 60 * 1000 // 10 minutes
};

// Get with caching and retry
const data = await apiService.getCached(
  '/itineraries/popular',
  {}, // Regular options
  {}, // Default retry options
  cacheOptions
);
```

### Global Configuration

You can configure default retry options for all requests:

```javascript
import * as apiService from '../utils/enhancedApiService';

// Configure global retry options
apiService.configureRetryOptions({
  maxRetries: 4,
  baseDelay: 1500,
  jitterFactor: 0.25
});
```

## API Reference

### enhancedApiRetry.js

#### `fetchWithExponentialBackoff(url, options, retryOptions)`

Makes an API request with retry logic using exponential backoff with jitter.

- **Parameters**:
  - `url` (string): URL to fetch
  - `options` (Object): Fetch options
  - `retryOptions` (Object): Retry configuration
    - `maxRetries` (number): Maximum number of retries (default: 3)
    - `baseDelay` (number): Base delay in milliseconds (default: 1000)
    - `maxDelay` (number): Maximum delay in milliseconds (default: 30000)
    - `jitterFactor` (number): Random jitter factor (default: 0.2)
    - `shouldRetry` (Function): Function to determine if a retry should be attempted
    - `onRetry` (Function): Callback function called before each retry

#### `fetchWithRetryAndCache(url, options, retryOptions, cacheOptions)`

Makes an API request with retry logic and caching.

- **Parameters**:
  - `url` (string): URL to fetch
  - `options` (Object): Fetch options
  - `retryOptions` (Object): Retry configuration (see above)
  - `cacheOptions` (Object): Cache configuration
    - `useCache` (boolean): Whether to use cache (default: true)
    - `cacheKey` (string): Custom cache key
    - `ttl` (number): Time to live in milliseconds (default: 5 minutes)

#### `enhanceApiServiceWithRetry(apiService, defaultRetryOptions)`

Enhances an existing API service with retry capabilities.

- **Parameters**:
  - `apiService` (Object): API service object with methods like get, post, etc.
  - `defaultRetryOptions` (Object): Default retry options

### enhancedApiService.js

This module exports the same interface as the original `apiService.js` but with enhanced retry capabilities:

- `get(endpoint, options, retryOptions)`: GET request with retry
- `post(endpoint, data, options, retryOptions)`: POST request with retry
- `put(endpoint, data, options, retryOptions)`: PUT request with retry
- `del(endpoint, options, retryOptions)`: DELETE request with retry
- `getCached(endpoint, options, retryOptions, cacheOptions)`: GET with retry and caching
- `login(email, password, retryOptions)`: Login with retry
- `register(name, email, password, retryOptions)`: Register with retry
- `logout()`: Logout (no retry needed)
- `configureRetryOptions(options)`: Configure default retry options

## Implementation Details

### Exponential Backoff Algorithm

The retry delay is calculated using the formula:

```
delay = min(baseDelay * 2^retryCount, maxDelay) * jitter
```

Where:
- `baseDelay` is the initial delay (default: 1000ms)
- `retryCount` is the current retry attempt (1-based)
- `maxDelay` is the maximum delay cap (default: 30000ms)
- `jitter` is a random value between (1-jitterFactor) and (1+jitterFactor)

### Retry Decision Logic

By default, the system will retry a request if:

1. The retry count is less than the maximum retry count
2. The error is a network error (offline, timeout, etc.)
3. The response status is a server error (5xx)
4. The response status is a rate limiting error (429)

Client errors (4xx) other than 429 are not retried by default, as they typically indicate a problem with the request that won't be resolved by retrying.

## Performance Considerations

The retry system includes performance monitoring integration that tracks:

- API call success/failure rates
- Response times
- Retry counts and reasons
- Cache hit rates

This data is logged to the performance monitoring system for analysis.

## Error Handling

All errors are properly logged and propagated to the caller. The system ensures that:

1. Original error information is preserved
2. Retry attempts are logged with appropriate context
3. Final errors include information about retry attempts

## Compatibility

The enhanced API service is fully compatible with the original API service. You can replace imports from `apiService` with `enhancedApiService` without changing any other code.