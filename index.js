// C:\projects\ai-image-generator-project\functions\index.js

// Import Firebase Functions and Admin SDK
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');
const axios = require('axios');

// Initialize Firebase Admin SDK (used for interacting with other Firebase services,
// though not strictly required just for an HTTP function. It's good practice to include.)
admin.initializeApp();

// Create an Express app instance.
// We're using Express because it helps manage routes and middleware,
// similar to your original server.js structure.
const app = express();

// Enable CORS for all origins.
// This is crucial to allow your frontend (which will be on a different domain
// once deployed) to make requests to this backend function.
// For production, you might want to restrict 'origin' to your frontend's domain.
app.use(cors({ origin: true }));

// Parse JSON request bodies. This middleware is needed to read the 'prompt' from the request.
app.use(express.json());

// Define the main API endpoint for image generation.
// This is an HTTP POST request handler for the '/generate-image' path.
app.post('/generate-image', async (req, res) => {
  try {
    const { prompt } = req.body; // Extract the 'prompt' from the request body

    // Retrieve Stability AI API Key from Firebase Functions environment variables.
    // IMPORTANT: This key will be set securely in Firebase's configuration later,
    // NOT hardcoded in the code.
    const STABILITY_API_KEY = process.env.STABILITY_KEY;

    // Basic check to ensure the API key is available
    if (!STABILITY_API_KEY) {
      console.error('Stability AI API Key not configured in Firebase Functions environment variables.');
      // Send a 500 Internal Server Error response if the key is missing
      return res.status(500).json({ error: 'Server configuration error: API key missing.' });
    }

    // Make the API call to Stability AI for image generation
    const response = await axios.post(
      'https://api.stability.ai/v1/generation/stable-diffusion-v1-6/text-to-image',
      {
        // Request payload for Stability AI API
        text_prompts: [{ text: prompt }], // The user's prompt
        cfg_scale: 7,                     // Classifier-free guidance scale
        height: 512,                      // Output image height
        width: 512,                       // Output image width
        steps: 30,                        // Number of diffusion steps
        samples: 1                        // Number of images to generate (1 for simplicity)
      },
      {
        headers: {
          'Content-Type': 'application/json', // Specify content type
          'Accept': 'application/json',       // Expect JSON response
          'Authorization': `Bearer ${STABILITY_API_KEY}` // Authorization header with your API key
        }
      }
    );

    // Extract the base64 encoded image data from the Stability AI response
    const imageData = response.data.artifacts[0].base64;
    // Send the image data back to the frontend
    res.json({ image: imageData });

  } catch (error) {
    // Error handling: log the error and send an appropriate response to the frontend
    console.error('Error generating image:', error.message);
    if (error.response) {
      // If it's an Axios error from the Stability AI API, log more details
      console.error('Stability AI API Error Status:', error.response.status);
      console.error('Stability AI API Error Data:', error.response.data);
      // Pass the Stability AI API's error message back to the frontend if available
      res.status(error.response.status).json({ error: error.response.data || 'Failed to generate image from external API.' });
    } else {
      // Generic error for other issues
      res.status(500).json({ error: 'Failed to generate image due to an unexpected server error.' });
    }
  }
});

// Expose the Express app as an HTTP Cloud Function.
// The name 'api' here becomes part of the function's URL.
// When deployed, this function will be accessible at a URL like:
// https://<region>-<project-id>.cloudfunctions.net/api
exports.api = functions.https.onRequest(app);