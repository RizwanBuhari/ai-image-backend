# ⚙️ AI Image Generator Backend (Firebase Function)

This repository contains the **Node.js backend** for the AI Image Generator app. It is deployed as a **Firebase Function** (2nd Generation) and serves as a secure API that communicates with the **Stability AI API** to generate images based on text prompts received from the frontend.

---

## ✨ Features

- 📩 Receives text prompts from the frontend via HTTP POST requests
- 🔐 Securely interacts with the Stability AI API to generate images
- 📤 Returns generated image data (Base64 or URL) to the frontend
- 🌐 CORS support to allow requests from the frontend domain
- 🔁 Robust handling of API responses and errors

---

## 🛠️ Technologies Used

- **Node.js** – JavaScript runtime
- **Express.js** – Web framework for creating the API endpoint
- **Firebase Functions (Gen 2)** – Serverless compute platform powered by Google Cloud Run
- **Axios** – HTTP client for calling the Stability AI API
- **CORS** – Middleware for cross-origin resource sharing
