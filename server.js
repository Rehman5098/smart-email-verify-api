require('dotenv').config();
const express = require('express');
const cors = require('cors');
const dns = require('dns'); // Import the built-in DNS module

const app = express();
app.use(cors());
app.use(express.json());

const API_KEY = process.env.API_KEY;
const PORT = process.env.PORT || 8080;

// --- Middleware to check the API Key ---
const apiKeyAuth = (req, res, next) => {
  const providedApiKey = req.header('x-api-key');
  if (!providedApiKey || providedApiKey !== API_KEY) {
    return res.status(401).json({ message: 'Invalid API key' });
  }
  next();
};

// --- A function to verify a single email ---
const verifyEmail = (email) => {
  return new Promise((resolve) => {
    const emailStr = String(email).toLowerCase();
    const domain = emailStr.split('@')[1] || '';

    // Step 1: A more strict syntax check
    const emailRegex = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if (!emailRegex.test(emailStr)) {
      return resolve({ email: email, status: 'Invalid', domain: domain });
    }

    // Step 2: Domain & MX Record Check
    dns.resolveMx(domain, (err, addresses) => {
      // If there's an error (like domain not found) or no MX records exist, it's invalid.
      if (err || !addresses || addresses.length === 0) {
        // We will treat these as 'Unverifiable' as the domain might be temporarily down
        // or a catch-all server that we can't fully validate.
        if (err && err.code === 'ENOTFOUND') {
            return resolve({ email: email, status: 'Invalid', domain: domain });
        }
        return resolve({ email: email, status: 'Unverifiable', domain: domain });
      }
      
      // If we find MX records, we can be confident the email address is valid.
      return resolve({ email: email, status: 'Valid', domain: domain });
    });
  });
};


// --- The Main Verification Route ---
app.post('/verify', apiKeyAuth, async (req, res) => {
  const { emails } = req.body;

  if (!emails || !Array.isArray(emails)) {
    return res.status(400).json({ message: 'Request body must be an array of emails.' });
  }

  // Verify all emails at the same time for better performance
  const verificationPromises = emails.map(verifyEmail);
  const results = await Promise.all(verificationPromises);

  res.json(results);
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});