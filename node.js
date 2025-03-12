const express = require('express');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// In-memory database for URLs (in a real app, you'd use a proper database)
const urlDatabase = {};

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Set view engine
app.set('view engine', 'ejs');

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// Shorten URL endpoint
app.post('/shorten', (req, res) => {
  const longUrl = req.body.url;
  
  // Validate URL
  if (!isValidUrl(longUrl)) {
    return res.json({ 
      success: false, 
      message: 'Invalid URL format' 
    });
  }
  
  // Generate a short code (6 characters)
  const shortCode = generateShortCode();
  
  // Store in database
  urlDatabase[shortCode] = {
    originalUrl: longUrl,
    createdAt: new Date(),
    visits: 0
  };
  
  // Return the shortened URL
  const shortUrl = `${req.protocol}://${req.get('host')}/${shortCode}`;
  res.json({ 
    success: true, 
    shortUrl: shortUrl, 
    shortCode: shortCode 
  });
});

// Redirect endpoint
app.get('/:shortCode', (req, res) => {
  const shortCode = req.params.shortCode;
  
  // Check if code exists in database
  if (urlDatabase[shortCode]) {
    // Increment visit counter
    urlDatabase[shortCode].visits++;
    
    // Redirect to original URL
    return res.redirect(urlDatabase[shortCode].originalUrl);
  } else {
    // If code not found, redirect to home with error
    return res.redirect('/?error=URL not found');
  }
});

// API endpoint to get URL stats
app.get('/api/stats/:shortCode', (req, res) => {
  const shortCode = req.params.shortCode;
  
  if (urlDatabase[shortCode]) {
    res.json({
      originalUrl: urlDatabase[shortCode].originalUrl,
      shortCode: shortCode,
      visits: urlDatabase[shortCode].visits,
      createdAt: urlDatabase[shortCode].createdAt
    });
  } else {
    res.status(404).json({ error: 'URL not found' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`URL Shortener service running on port ${PORT}`);
});

// Helper functions
function generateShortCode() {
  // Generate a random string of 6 characters
  return crypto.randomBytes(3).toString('hex');
}

function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

// code ending//