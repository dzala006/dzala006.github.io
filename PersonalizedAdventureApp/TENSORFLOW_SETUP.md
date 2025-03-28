# TensorFlow.js Setup for Personalized Adventure App

This guide will help you set up TensorFlow.js in your Personalized Adventure App project.

## Prerequisites

- Node.js and npm installed
- Expo CLI installed globally (`npm install -g expo-cli`)
- An existing Expo project

## Installation Steps

1. **Install TensorFlow.js and related packages**

   ```bash
   cd PersonalizedAdventureApp
   npm install @tensorflow/tfjs @tensorflow/tfjs-react-native
   ```

2. **Install additional dependencies required by TensorFlow.js**

   ```bash
   npm install expo-gl expo-file-system
   ```

3. **Initialize TensorFlow.js in your app**

   Create a file called `src/utils/tensorflowSetup.js` with the following content:

   ```javascript
   import * as tf from '@tensorflow/tfjs';
   import { bundleResourceIO, decodeJpeg } from '@tensorflow/tfjs-react-native';
   import * as FileSystem from 'expo-file-system';

   export const setupTensorFlow = async () => {
     try {
       // Wait for TensorFlow.js to be ready
       await tf.ready();
       console.log('TensorFlow.js is ready!');
       return true;
     } catch (error) {
       console.error('Failed to initialize TensorFlow.js', error);
       return false;
     }
   };

   export const loadModel = async (modelJson, modelWeights) => {
     try {
       // Load the model using bundleResourceIO
       const model = await tf.loadLayersModel(bundleResourceIO(modelJson, modelWeights));
       console.log('Model loaded successfully');
       return model;
     } catch (error) {
       console.error('Failed to load the model', error);
       return null;
     }
   };
   ```

4. **Initialize TensorFlow.js when your app starts**

   In your `App.js` file, import and call the setup function:

   ```javascript
   import { setupTensorFlow } from './src/utils/tensorflowSetup';
   import { useEffect } from 'react';

   // Inside your App component
   useEffect(() => {
     const initializeTensorFlow = async () => {
       const isReady = await setupTensorFlow();
       console.log('TensorFlow.js initialization status:', isReady);
     };
     
     initializeTensorFlow();
   }, []);
   ```

## Using TensorFlow.js in the AI Personalization Module

The `aiPersonalization.js` file has been updated to use TensorFlow.js for generating personalized itineraries. The model takes user preferences, feedback, weather data, and events data as input and outputs recommended activities.

### Testing the Integration

To test if TensorFlow.js is properly integrated:

1. Start your Expo app:
   ```bash
   npm start
   ```

2. Check the console logs to see if TensorFlow.js is initialized successfully.

3. Navigate to a screen that uses the AI personalization module (e.g., HomeScreen) and check if itineraries are being generated.

## Troubleshooting

- **Error: "Cannot find module '@tensorflow/tfjs'"**: Make sure you've installed the package correctly.
- **Error during TensorFlow.js initialization**: Check if all required dependencies are installed.
- **Model loading issues**: Ensure the model files are in the correct format and location.

## Additional Resources

- [TensorFlow.js Documentation](https://www.tensorflow.org/js)
- [TensorFlow.js React Native GitHub](https://github.com/tensorflow/tfjs/tree/master/tfjs-react-native)
- [Expo GL Documentation](https://docs.expo.dev/versions/latest/sdk/gl-view/)