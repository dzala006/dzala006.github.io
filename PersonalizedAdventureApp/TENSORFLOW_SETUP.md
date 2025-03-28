# TensorFlow.js Setup Guide for Personalized Adventure App

This guide explains how to set up and use TensorFlow.js in your React Native app for AI-powered itinerary personalization.

## Installation

To add TensorFlow.js to your project, run the following commands:

```bash
# Install TensorFlow.js core package
npm install @tensorflow/tfjs

# For React Native, you'll need these additional packages
npm install @tensorflow/tfjs-react-native

# Required dependencies for TensorFlow.js in React Native
npm install expo-gl expo-file-system
```

## Configuration

After installing the packages, you need to initialize TensorFlow.js in your app. Add the following code to your `App.js` file:

```javascript
import React, { useEffect, useState } from 'react';
import * as tf from '@tensorflow/tfjs';
import { bundleResourceIO } from '@tensorflow/tfjs-react-native';

// Add this to your App component
const [isTfReady, setIsTfReady] = useState(false);

useEffect(() => {
  const setupTensorFlow = async () => {
    try {
      // Initialize TensorFlow.js
      await tf.ready();
      console.log('TensorFlow.js is ready!');
      setIsTfReady(true);
    } catch (error) {
      console.error('Failed to initialize TensorFlow.js', error);
    }
  };

  setupTensorFlow();
}, []);
```

## Loading Models

There are two ways to use TensorFlow.js models in your app:

### 1. Creating a model on the fly (as implemented in aiPersonalization.js)

```javascript
const createModel = () => {
  const model = tf.sequential();
  
  model.add(tf.layers.dense({
    inputShape: [23],
    units: 64,
    activation: 'relu'
  }));
  
  model.add(tf.layers.dense({
    units: 32,
    activation: 'relu'
  }));
  
  model.add(tf.layers.dense({
    units: 16,
    activation: 'relu'
  }));
  
  model.add(tf.layers.dense({
    units: 40,
    activation: 'sigmoid'
  }));
  
  model.compile({
    optimizer: 'adam',
    loss: 'meanSquaredError'
  });
  
  return model;
};
```

### 2. Loading a pre-trained model

For production use, you should train a model separately and load it in your app:

```javascript
const loadModel = async () => {
  try {
    // Option 1: Load from a URL
    const model = await tf.loadLayersModel('https://your-model-server.com/model.json');
    
    // Option 2: Load from app assets (requires bundling model files with your app)
    // const modelJson = require('./assets/model/model.json');
    // const modelWeights = require('./assets/model/weights.bin');
    // const model = await tf.loadLayersModel(bundleResourceIO(modelJson, modelWeights));
    
    return model;
  } catch (error) {
    console.error('Error loading model:', error);
    throw error;
  }
};
```

## Running Inference

Once you have a model, you can run inference like this:

```javascript
const runInference = async (model, inputData) => {
  try {
    // Convert input data to tensor
    const inputTensor = tf.tensor2d([inputData], [1, inputData.length]);
    
    // Run inference
    const predictionsTensor = model.predict(inputTensor);
    
    // Convert predictions to JavaScript array
    const predictions = await predictionsTensor.array();
    
    // Clean up tensors to prevent memory leaks
    inputTensor.dispose();
    predictionsTensor.dispose();
    
    return predictions[0];
  } catch (error) {
    console.error('Error running inference:', error);
    throw error;
  }
};
```

## Memory Management

TensorFlow.js uses WebGL textures for computation, which need to be manually released. Always dispose of tensors when you're done with them:

```javascript
// Good practice
const tensor = tf.tensor([1, 2, 3]);
// Do something with tensor
tensor.dispose();

// Even better practice - automatically disposes tensors
tf.tidy(() => {
  const tensor = tf.tensor([1, 2, 3]);
  // Do something with tensor
  return result; // Only the result tensor escapes disposal
});
```

## Fallback Mechanism

As implemented in the Personalized Adventure App, always have a fallback mechanism in case TensorFlow.js fails:

```javascript
try {
  // Try to use TensorFlow.js
  const model = await loadTensorFlowModel();
  const predictions = await runModelInference(model, preprocessedData);
  return postProcessModelOutput(predictions, userData, weatherData, eventsData);
} catch (error) {
  console.error('TensorFlow.js error:', error);
  // Fall back to rule-based approach
  return generateRuleBasedItinerary(userData, feedbackData, weatherData, eventsData);
}
```

## Performance Considerations

1. **Model Size**: Keep your models small for mobile devices
2. **Inference Frequency**: Limit how often you run inference
3. **Tensor Cleanup**: Always dispose of tensors when done
4. **UI Responsiveness**: Run inference in a background thread if possible
5. **Battery Usage**: TensorFlow.js can be power-intensive, so use it judiciously

## Troubleshooting

If you encounter issues with TensorFlow.js:

1. Check that all dependencies are installed correctly
2. Verify that TensorFlow.js is properly initialized before use
3. Ensure input data is correctly formatted for your model
4. Look for memory leaks by monitoring tensor disposal
5. Consider using a simpler model if performance is an issue

For more information, visit the [TensorFlow.js documentation](https://www.tensorflow.org/js).