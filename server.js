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
  // We configure the validator to wait longer (15 seconds) for a response.
  const emailValidator = new EmailValidator({
    timeout: 15000, // Increased timeout to 15 seconds
    verifyMailbox: true,
  });

  const domain = email.split('@')[1] || '';

  try {
    const result = await emailValidator.verify(email);
    const { wellFormed, validDomain, validMailbox } = result;
    
    // Check 1: Is the email format correct?
    if (!wellFormed) {
      return { email, status: 'Invalid', domain };
    }

    // Check 2: Does the domain exist and can it receive emails?
    if (!validDomain) {
      return { email, status: 'Invalid', domain };
    }

    // Check 3: Does the actual mailbox exist? (The SMTP check)
    // validMailbox can be true, false, or null.
    if (validMailbox === true) {
      return { email, status: 'Valid', domain };
    } else if (validMailbox === false) {
      // The server confirmed the mailbox does not exist.
      return { email, status: 'Invalid', domain };
    } else {
      // The server is a "catch-all" or did not give a clear answer.
      return { email, status: 'Unverifiable', domain };
    }

  } catch (error) {
    console.error(`Error verifying ${email}:`, error.message);
    // If any error occurs (like a timeout), we mark it as unverifiable.
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