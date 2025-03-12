document.addEventListener('DOMContentLoaded', function() {
  // DOM elements
  const originalUrlInput = document.getElementById('original-url');
  const shortenBtn = document.getElementById('shorten-btn');
  const resultContainer = document.getElementById('result-container');
  const shortenedUrlElement = document.getElementById('shortened-url');
  const copyBtn = document.getElementById('copy-btn');
  const copyMessage = document.getElementById('copy-message');
  const historyList = document.getElementById('history-list');
  const noHistoryMessage = document.getElementById('no-history-message');

  // In-memory storage for URL mappings
  // In a real app, this would be a database
  let urlDatabase = JSON.parse(localStorage.getItem('urlMappings')) || {};
  let urlHistory = JSON.parse(localStorage.getItem('urlHistory')) || [];

  // Load history on page load
  updateHistoryList();

  // Function to handle URL shortening
  function shortenUrl() {
      const originalUrl = originalUrlInput.value.trim();
      
      // Basic validation
      if (!originalUrl) {
          alert('Please enter a valid URL');
          return;
      }
      
      // Check if URL has proper format
      if (!isValidUrl(originalUrl)) {
          alert('Please enter a valid URL with http:// or https://');
          return;
      }
      
      // Check if URL is already in database
      for (let shortCode in urlDatabase) {
          if (urlDatabase[shortCode] === originalUrl) {
              displayShortenedUrl(shortCode);
              return;
          }
      }
      
      // Generate a new short code
      const shortCode = generateShortCode();
      
      // Store in our database
      urlDatabase[shortCode] = originalUrl;
      localStorage.setItem('urlMappings', JSON.stringify(urlDatabase));
      
      // Add to history
      addToHistory(shortCode, originalUrl);
      
      // Display the shortened URL
      displayShortenedUrl(shortCode);
  }
  
  // Function to validate URL format
  function isValidUrl(url) {
      try {
          const parsedUrl = new URL(url);
          return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
      } catch (e) {
          return false;
      }
  }
  
  // Generate a random short code
  function generateShortCode() {
      const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      let result = '';
      for (let i = 0; i < 6; i++) {
          result += characters.charAt(Math.floor(Math.random() * characters.length));
      }
      return result;
  }
  
  // Display the shortened URL
  function displayShortenedUrl(shortCode) {
      const baseUrl = window.location.href.split('?')[0].split('#')[0];
      const shortUrl = `${baseUrl}?id=${shortCode}`;
      
      shortenedUrlElement.textContent = shortUrl;
      shortenedUrlElement.href = shortUrl;
      resultContainer.classList.remove('hidden');
  }
  
  // Add URL to history
  function addToHistory(shortCode, originalUrl) {
      const baseUrl = window.location.href.split('?')[0].split('#')[0];
      const shortUrl = `${baseUrl}?id=${shortCode}`;
      
      // Remove if it exists (to move to top)
      urlHistory = urlHistory.filter(item => item.shortCode !== shortCode);
      
      // Add to beginning of array
      urlHistory.unshift({
          shortCode: shortCode,
          originalUrl: originalUrl,
          shortUrl: shortUrl,
          timestamp: new Date().toISOString()
      });
      
      // Keep only latest 10
      if (urlHistory.length > 10) {
          urlHistory = urlHistory.slice(0, 10);
      }
      
      // Save to local storage
      localStorage.setItem('urlHistory', JSON.stringify(urlHistory));
      
      // Update UI
      updateHistoryList();
  }
  
  // Update the history list in the UI
  function updateHistoryList() {
      if (urlHistory.length === 0) {
          noHistoryMessage.classList.remove('hidden');
          return;
      }
      
      noHistoryMessage.classList.add('hidden');
      
      // Clear existing list
      while (historyList.firstChild !== noHistoryMessage) {
          if (historyList.firstChild) {
              historyList.removeChild(historyList.firstChild);
          } else {
              break;
          }
      }
      
      // Add history items
      urlHistory.forEach(item => {
          const historyItem = document.createElement('div');
          historyItem.className = 'history-item';
          
          const urlInfo = document.createElement('div');
          urlInfo.className = 'url-info';
          
          const originalUrlElement = document.createElement('div');
          originalUrlElement.className = 'original-url';
          originalUrlElement.textContent = item.originalUrl;
          
          const shortUrlElement = document.createElement('a');
          shortUrlElement.className = 'short-url';
          shortUrlElement.href = item.shortUrl;
          shortUrlElement.textContent = item.shortUrl;
          shortUrlElement.target = '_blank';
          
          urlInfo.appendChild(shortUrlElement);
          urlInfo.appendChild(originalUrlElement);
          historyItem.appendChild(urlInfo);
          
          historyList.appendChild(historyItem);
      });
  }
  
  // Copy shortened URL to clipboard
  function copyToClipboard() {
      navigator.clipboard.writeText(shortenedUrlElement.textContent)
          .then(() => {
              copyMessage.classList.remove('hidden');
              setTimeout(() => {
                  copyMessage.classList.add('hidden');
              }, 2000);
          })
          .catch(err => {
              console.error('Could not copy text: ', err);
              alert('Failed to copy to clipboard. Please copy manually.');
          });
  }
  
  // Handle redirection if URL has id parameter
  function checkForRedirect() {
      const urlParams = new URLSearchParams(window.location.search);
      const shortCode = urlParams.get('id');
      
      if (shortCode) {
          const originalUrl = urlDatabase[shortCode];
          
          if (originalUrl) {
              window.location.href = originalUrl;
          } else {
              alert('URL not found or has expired.');
              window.location.href = window.location.origin + window.location.pathname;
          }
      }
  }
  
  // Event listeners
  shortenBtn.addEventListener('click', shortenUrl);
  originalUrlInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
          shortenUrl();
      }
  });
  copyBtn.addEventListener('click', copyToClipboard);
  
  // Check for redirect on page load
  checkForRedirect();
});