require('dotenv').config();
const express = require('express');
const cors = require('cors');
const EmailValidator = require('email-deep-validator');

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

// --- A function to verify a single email using SMTP ---
const verifyEmail = async (email) => {
  const emailValidator = new EmailValidator();
  const domain = email.split('@')[1] || '';

  try {
    // This performs all checks: syntax, domain, and a live SMTP check
    const { wellFormed, validDomain, validMailbox } = await emailValidator.verify(email);

    if (!wellFormed || !validDomain) {
      return { email, status: 'Invalid', domain };
    }

    // validMailbox can be true, false, or null
    if (validMailbox) {
      return { email, status: 'Valid', domain };
    } else if (validMailbox === false) {
      // The server confirmed the mailbox does not exist
      return { email, status: 'Invalid', domain };
    } else {
      // The server is a catch-all or did not respond clearly
      return { email, status: 'Unverifiable', domain };
    }
  } catch (error) {
    console.error(`Error verifying ${email}:`, error);
    return { email, status: 'Unverifiable', domain };
  }
};

// --- The Main Verification Route ---
app.post('/verify', apiKeyAuth, async (req, res) => {
  const { emails } = req.body;

  if (!emails || !Array.isArray(emails)) {
    return res.status(400).json({ message: 'Request body must be an array of emails.' });
  }

  const verificationPromises = emails.map(verifyEmail);
  const results = await Promise.all(verificationPromises);

  res.json(results);
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});