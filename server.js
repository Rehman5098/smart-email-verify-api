// server.js - FINAL version using a professional API
require('dotenv').config();
const express = require('express');
const cors = require('cors');
// Zaroori: check karein ke 'node-fetch' aapke package.json mein hai
const fetch = require('node-fetch');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 8080;
// Yeh ab aapki nayi, bharosemand (reliable) API key istemal karega
const ABSTRACT_API_KEY = process.env.ABSTRACT_API_KEY;

const verifySingleEmail = async (email) => {
  const domain = email.split('@')[1] || '';
  if (!ABSTRACT_API_KEY) {
    console.error("Abstract API key is missing from Railway variables!");
    return { email, status: 'Unverifiable', domain };
  }

  const url = `https://emailvalidation.abstractapi.com/v1/?api_key=${ABSTRACT_API_KEY}&email=${encodeURIComponent(email)}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    // Check for errors from AbstractAPI
    if (data.error) {
        console.error(`AbstractAPI error for ${email}:`, data.error.message);
        return { email, status: 'Unverifiable', domain };
    }

    const deliverability = data.deliverability;
    let status;

    if (deliverability === 'DELIVERABLE') {
      status = 'Valid';
    } else if (deliverability === 'UNDELIVERABLE') {
      status = 'Invalid';
    } else { // RISKY or UNKNOWN
      status = 'Unverifiable';
    }
    
    return { email, status, domain };

  } catch (error) {
    console.error(`Error verifying ${email}:`, error);
    return { email, status: 'Unverifiable', domain };
  }
};

// Main verification endpoint
app.post('/verify', async (req, res) => {
  const { emails } = req.body;

  if (!emails || !Array.isArray(emails)) {
    return res.status(400).json({ message: 'Request body must be an array of emails.' });
  }

  const results = [];
  for (const email of emails) {
    const result = await verifySingleEmail(email);
    results.push(result);
  }

  res.json(results);
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});