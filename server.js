require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors()); // Allows your website to call the API
app.use(express.json()); // Allows the API to read JSON from requests

const API_KEY = process.env.API_KEY;
const PORT = process.env.PORT || 8080;

// --- Middleware to check the API Key ---
const apiKeyAuth = (req, res, next) => {
  // We will check for a header called 'x-api-key'
  const providedApiKey = req.header('x-api-key');
  if (!providedApiKey || providedApiKey !== API_KEY) {
    // If the key is missing or wrong, send an error
    return res.status(401).json({ message: 'Invalid API key' });
  }
  // If the key is correct, continue to the next step
  next();
};

// --- The Main Verification Route ---
// It will only run if the apiKeyAuth middleware passes
app.post('/verify', apiKeyAuth, (req, res) => {
  const { emails } = req.body;

  if (!emails || !Array.isArray(emails)) {
    return res.status(400).json({ message: 'Request body must be an array of emails.' });
  }

  // A simple regex to check for valid email syntax.
  // Note: Real-world email verification is more complex (checking MX records, etc.)
  // but this is a great, reliable start.
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const results = emails.map(email => {
    const isValid = emailRegex.test(String(email).toLowerCase());
    return {
      email: email,
      status: isValid ? 'Valid' : 'Invalid',
      domain: email.split('@')[1] || ''
    };
  });

  res.json(results);
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});