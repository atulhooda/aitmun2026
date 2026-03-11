import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';

const app = express();
const PASSWORD = 'mun2026'; // Change this to your desired password
const PORT = 5175;

// Simple password authentication middleware
app.use((req, res, next) => {
  const authHeader = req.headers['authorization'];
  
  // Allow static assets without password
  if (req.path.startsWith('/@vite') || req.path.includes('.') || req.path === '/') {
    // Check password for all requests
    if (!authHeader || authHeader !== `Bearer ${PASSWORD}`) {
      if (req.path === '/') {
        return res.send(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>AIT MUN - Password Required</title>
            <style>
              body { font-family: Arial; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #0f172a; }
              .container { text-align: center; background: #1e293b; padding: 40px; border-radius: 8px; }
              h1 { color: #f1f5f9; margin-bottom: 20px; }
              input { padding: 10px; font-size: 16px; border-radius: 4px; border: none; width: 250px; }
              button { padding: 10px 20px; margin-left: 10px; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 16px; }
              button:hover { background: #2563eb; }
              .error { color: #ef4444; margin-top: 10px; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>🔐 AIT MUN</h1>
              <p style="color: #cbd5e1; margin-bottom: 20px;">Enter password to access</p>
              <form onsubmit="login(event)">
                <input type="password" id="password" placeholder="Enter password" autofocus>
                <button type="submit">Access</button>
              </form>
              <div id="error" class="error"></div>
              <script>
                function login(e) {
                  e.preventDefault();
                  const password = document.getElementById('password').value;
                  localStorage.setItem('tunnelAuth', 'Bearer ' + password);
                  location.reload();
                }
              </script>
            </div>
          </body>
          </html>
        `);
      }
    } else {
      // Password is correct, proceed
      req.headers['authorization'] = '';
      return next();
    }
  }
  
  if (!authHeader || authHeader !== `Bearer ${PASSWORD}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  next();
});

// Inject password handling script into HTML
app.use((req, res, next) => {
  res.locals.authToken = PASSWORD;
  next();
});

// Proxy to Vite dev server
app.use('/', createProxyMiddleware({
  target: 'http://localhost:5174',
  changeOrigin: true,
  onProxyRes: (proxyRes, req, res) => {
    // Inject auth script into HTML responses
    if (proxyRes.headers['content-type']?.includes('text/html')) {
      let oldWrite = res.write;
      
      res.write = function(data) {
        if (typeof data === 'string' || Buffer.isBuffer(data)) {
          let html = data.toString();
          const authScript = `
            <script>
              (function() {
                const token = localStorage.getItem('tunnelAuth');
                if (token) {
                  fetch(window.location.href, {
                    headers: { 'Authorization': token }
                  }).then(r => {
                    if (!r.ok) localStorage.removeItem('tunnelAuth');
                  });
                } else {
                  window.location.href = '/';
                }
              })();
            </script>
          `;
          
          if (html.includes('</head>')) {
            html = html.replace('</head>', authScript + '</head>');
          }
          
          return oldWrite.call(res, html);
        }
        return oldWrite.apply(res, arguments);
      };
    }
  }
}));

app.listen(PORT, () => {
  console.log(`\n✅ Auth Proxy running on http://localhost:${PORT}`);
  console.log(`🔐 Password: ${PASSWORD}\n`);
});
