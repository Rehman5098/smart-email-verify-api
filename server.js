// server.js - Naya aur behtar code
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch'); // node-fetch library istemal karenge

const app = express();
app.use(cors()); // CORS ko enable karein takeh aapka tool isse baat kar sake
app.use(express.json());

const PORT = process.env.PORT || 8080;
const EXTERNAL_API_URL = 'https://isitarealemail.com/api/email/validate';

// Helper function to verify a single email
const verifySingleEmail = async (email) => {
  const domain = email.split('@')[1] || '';
  try {
    const response = await fetch(`${EXTERNAL_API_URL}?email=${encodeURIComponent(email)}`);
    if (!response.ok) {
      // Agar API se error aaye
      return { email, status: 'Unverifiable', domain };
    }
    const data = await response.json();
    const statusMap = {
      valid: 'Valid',
      invalid: 'Invalid',
      unknown: 'Unverifiable',
    };
    return {
      email,
      status: statusMap[data.status] || 'Unverifiable',
      domain,
    };
  } catch (error) {
    console.error(`Error verifying ${email}:`, error);
    return { email, status: 'Unverifiable', domain };
  }
};

// Hamara main verification endpoint
app.post('/verify', async (req, res) => {
  const { emails } = req.body;

  if (!emails || !Array.isArray(emails)) {
    return res.status(400).json({ message: 'Request body must be an array of emails.' });
  }

  const results = [];
  // Ek ek karke email check karein takeh API block na kare
  for (const email of emails) {
    const result = await verifySingleEmail(email);
    results.push(result);
  }

  res.json(results);
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});