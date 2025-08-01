// Temporary change to force commit
// C:\projects\ai-image-generator-project\functions\index.js

// Import Firebase Admin SDK, Express, CORS
const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');

// IMPORTANT: Import the main v2 functions object for 2nd Generation functions
const functions = require('firebase-functions/v2'); 

// node-fetch is needed for making HTTP requests to external APIs
const fetch = require('node-fetch');

// Initialize Firebase Admin SDK
admin.initializeApp();

// Initialize Express app
const app = express();
// Enable CORS for all origins (adjust for production if needed)
app.use(cors({ origin: true }));
// Enable JSON body parsing
app.use(express.json());

// Define the POST endpoint for image generation
app.post('/generate-image', async (req, res) => {
    try {
        // Access the Stability AI API key from Firebase Secrets (environment variable)
        // This variable is securely injected because 'STABILITY_KEY' is listed in the 'secrets' array below.
        const STABILITY_API_KEY = process.env.STABILITY_KEY;

        // Check if the API key is set
        if (!STABILITY_API_KEY) {
            console.error('Stability AI API Key not configured or accessible. Please ensure it is set as a Firebase Secret named STABILITY_KEY and bound to this function.');
            return res.status(500).json({ error: 'Server configuration error: Stability AI API key missing or inaccessible.' });
        }

        // Extract the prompt from the request body
        const { prompt } = req.body;

        // Validate the prompt
        if (!prompt) {
            return res.status(400).json({ error: 'Prompt is required.' });
        }

        console.log(`Attempting to generate image with Stability AI for prompt: "${prompt}"`);

        // Define the Stability AI API endpoint for text-to-image generation
        const STABILITY_API_URL = "https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image";

        // Define the payload for the Stability AI API request
        const stabilityPayload = {
            text_prompts: [
                {
                    text: prompt,
                    weight: 1
                }
            ],
            cfg_scale: 7,          // Classifier-free guidance scale
            clip_guidance_preset: "FAST_BLUE", // Clip guidance preset
            height: 1024,           // Image height
            width: 1024,            // Image width
            samples: 1,            // Number of images to generate (1 for simplicity)
            steps: 30              // Number of diffusion steps
        };

        // Make the POST request to the Stability AI API
        const stabilityResponse = await fetch(STABILITY_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${STABILITY_API_KEY}` // Include API key in Authorization header
            },
            body: JSON.stringify(stabilityPayload)
        });

        // Parse the JSON response from Stability AI
        const stabilityResult = await stabilityResponse.json();

        // Check if the response was successful and contains artifacts (images)
        if (stabilityResponse.ok && stabilityResult.artifacts && stabilityResult.artifacts.length > 0) {
            // Stability AI returns base64 encoded images in the 'base64' field
            const imageData = stabilityResult.artifacts[0].base64;
            const mimeType = 'image/png'; // Stability AI usually returns PNG

            // Send the base64 image data back to the frontend
            res.json({ image: imageData, mimeType: mimeType });
        } else {
            // Log the full error response from Stability AI for debugging
            console.error('Failed to generate image from Stability AI API:', JSON.stringify(stabilityResult, null, 2));
            // Provide a more specific error message if available from the API
            const errorMessage = stabilityResult.message || 'No image data returned from AI or API error.';
            res.status(stabilityResponse.status || 500).json({ error: `Failed to generate image: ${errorMessage}` });
        }

    } catch (error) {
        // Catch any unexpected errors during the process
        console.error('Error generating image with Stability AI API:', error);

        // Provide specific error messages for common issues
        if (error.message && error.message.includes('invalid api key')) {
            res.status(401).json({ error: 'Authentication error: Invalid Stability AI API key.' });
        } else if (error.message && error.message.includes('rate limit exceeded')) {
            res.status(429).json({ error: 'Rate limit exceeded with Stability AI API. Please try again later.' });
        } else if (error.message && error.message.includes('insufficient_balance')) {
            res.status(402).json({ error: 'Billing issue with Stability AI API. Check your account.' });
        } else {
            res.status(500).json({ error: `Failed to generate image due to an unexpected server error: ${error.message || 'Unknown error'}.` });
        }
    }
});

// Export the Express app as an HTTP Cloud Function.
// IMPORTANT: For 2nd Generation functions, you MUST list the secrets you want to bind
// in the 'secrets' array. This makes 'process.env.STABILITY_KEY' available.
exports.api = functions.https.onRequest({
    secrets: ['STABILITY_KEY'], // List the secret name as a string here
}, app);
