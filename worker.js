/**
 * VBI ProxyHost - Cloudflare Worker
 * A comprehensive free hosting service that serves as a proxy host for static websites
 */

// Configuration
const CONFIG = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB per file
  MAX_STORAGE_PER_USER: 100 * 1024 * 1024, // 100MB per user
  RATE_LIMIT_REQUESTS: 100, // requests per minute
  SUPPORTED_MIME_TYPES: {
    'html': 'text/html',
    'css': 'text/css',
    'js': 'application/javascript',
    'json': 'application/json',
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'gif': 'image/gif',
    'svg': 'image/svg+xml',
    'ico': 'image/x-icon',
    'txt': 'text/plain',
    'md': 'text/markdown'
  },
  ADMIN_ROUTES: ['/admin', '/dashboard', '/upload', '/login', '/register'],
  DEFAULT_INDEX_FILES: ['index.html', 'index.htm']
};

/**
 * Main request handler
 */
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const host = url.hostname;
    const pathname = url.pathname;

    try {
      // Rate limiting
      const rateLimitResult = await handleRateLimit(request, env);
      if (rateLimitResult) return rateLimitResult;

      // Check if this is an admin/management request
      if (CONFIG.ADMIN_ROUTES.some(route => pathname.startsWith(route))) {
        return await handleAdminRequest(request, env);
      }

      // Handle subdomain routing for hosted sites
      if (host.includes('.') && !host.startsWith('www.')) {
        const subdomain = host.split('.')[0];
        return await handleSubdomainRequest(subdomain, pathname, env);
      }

      // Serve main landing page
      return await handleMainSite(pathname, request, env);

    } catch (error) {
      console.error('Worker error:', error);
      return new Response('Internal Server Error', {
        status: 500,
        headers: { 'Content-Type': 'text/plain' }
      });
    }
  }
};

/**
 * Handle rate limiting
 */
async function handleRateLimit(request, env) {
  const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';
  const rateLimitKey = `rate_limit:${clientIP}`;
  
  try {
    const current = await env.VBI_KV.get(rateLimitKey);
    const count = current ? parseInt(current) : 0;
    
    if (count >= CONFIG.RATE_LIMIT_REQUESTS) {
      return new Response('Rate limit exceeded', {
        status: 429,
        headers: {
          'Content-Type': 'text/plain',
          'Retry-After': '60'
        }
      });
    }

    // Update rate limit counter
    await env.VBI_KV.put(rateLimitKey, (count + 1).toString(), { expirationTtl: 60 });
    
    return null; // No rate limit hit
  } catch (error) {
    console.error('Rate limiting error:', error);
    return null; // Allow request on rate limit failure
  }
}

/**
 * Handle subdomain requests (serving user sites)
 */
async function handleSubdomainRequest(subdomain, pathname, env) {
  try {
    // Validate subdomain format
    if (!/^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]$/.test(subdomain) && subdomain.length > 1) {
      return new Response('Invalid subdomain', { status: 400 });
    }

    // Check if user exists
    const userKey = `user:${subdomain}`;
    const userData = await env.VBI_KV.get(userKey);
    if (!userData) {
      return new Response('Site not found', { status: 404 });
    }

    // Handle root path - try to serve index file
    let requestedFile = pathname === '/' ? '/index.html' : pathname;
    
    // Try to get the file
    const fileKey = `files:${subdomain}:${requestedFile}`;
    const fileData = await env.VBI_KV.get(fileKey);
    
    if (!fileData) {
      // If exact file not found and it's root, try other index files
      if (pathname === '/') {
        for (const indexFile of CONFIG.DEFAULT_INDEX_FILES) {
          const indexKey = `files:${subdomain}:/${indexFile}`;
          const indexData = await env.VBI_KV.get(indexKey);
          if (indexData) {
            requestedFile = `/${indexFile}`;
            return serveFile(indexData, indexFile);
          }
        }
      }
      return new Response('File not found', { status: 404 });
    }

    return serveFile(fileData, requestedFile);

  } catch (error) {
    console.error('Subdomain request error:', error);
    return new Response('Server error', { status: 500 });
  }
}

/**
 * Serve a file with appropriate headers
 */
function serveFile(fileData, fileName) {
  const file = JSON.parse(fileData);
  const extension = fileName.split('.').pop()?.toLowerCase();
  const mimeType = CONFIG.SUPPORTED_MIME_TYPES[extension] || 'text/plain';

  const headers = {
    'Content-Type': mimeType,
    'Cache-Control': 'public, max-age=3600',
    'Access-Control-Allow-Origin': '*'
  };

  // Decode base64 content for binary files
  if (['png', 'jpg', 'jpeg', 'gif', 'ico'].includes(extension)) {
    const binaryContent = Uint8Array.from(atob(file.content), c => c.charCodeAt(0));
    return new Response(binaryContent, { headers });
  }

  return new Response(file.content, { headers });
}

/**
 * Handle admin/management requests
 */
async function handleAdminRequest(request, env) {
  const url = new URL(request.url);
  const pathname = url.pathname;

  // Handle different admin routes
  if (pathname === '/register' && request.method === 'POST') {
    return await handleUserRegistration(request, env);
  }
  
  if (pathname === '/login' && request.method === 'POST') {
    return await handleUserLogin(request, env);
  }
  
  if (pathname === '/upload' && request.method === 'POST') {
    return await handleFileUpload(request, env);
  }
  
  if (pathname === '/api/files' && request.method === 'GET') {
    return await handleListFiles(request, env);
  }
  
  if (pathname === '/api/files' && request.method === 'DELETE') {
    return await handleDeleteFile(request, env);
  }

  // Serve admin interface HTML
  return serveAdminInterface(pathname);
}

/**
 * Handle user registration
 */
async function handleUserRegistration(request, env) {
  try {
    const formData = await request.formData();
    const username = formData.get('username')?.toString().toLowerCase();
    const password = formData.get('password')?.toString();
    const email = formData.get('email')?.toString().toLowerCase();

    // Validate input
    if (!username || !password || !email) {
      return jsonResponse({ error: 'All fields are required' }, 400);
    }

    if (!/^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]$/.test(username) || username.length < 3) {
      return jsonResponse({ error: 'Invalid username format' }, 400);
    }

    if (password.length < 6) {
      return jsonResponse({ error: 'Password must be at least 6 characters' }, 400);
    }

    // Check if user already exists
    const existingUser = await env.VBI_KV.get(`user:${username}`);
    if (existingUser) {
      return jsonResponse({ error: 'Username already taken' }, 409);
    }

    // Hash password (simple hash for demo - use proper bcrypt in production)
    const hashedPassword = await hashPassword(password);

    // Create user
    const userData = {
      username,
      email,
      password: hashedPassword,
      createdAt: new Date().toISOString(),
      storageUsed: 0,
      storageLimit: CONFIG.MAX_STORAGE_PER_USER
    };

    await env.VBI_KV.put(`user:${username}`, JSON.stringify(userData));

    return jsonResponse({ message: 'Registration successful', username });

  } catch (error) {
    console.error('Registration error:', error);
    return jsonResponse({ error: 'Registration failed' }, 500);
  }
}

/**
 * Handle user login
 */
async function handleUserLogin(request, env) {
  try {
    const formData = await request.formData();
    const username = formData.get('username')?.toString().toLowerCase();
    const password = formData.get('password')?.toString();

    if (!username || !password) {
      return jsonResponse({ error: 'Username and password required' }, 400);
    }

    const userData = await env.VBI_KV.get(`user:${username}`);
    if (!userData) {
      return jsonResponse({ error: 'Invalid credentials' }, 401);
    }

    const user = JSON.parse(userData);
    const isValidPassword = await verifyPassword(password, user.password);

    if (!isValidPassword) {
      return jsonResponse({ error: 'Invalid credentials' }, 401);
    }

    // Generate session token (simple token for demo)
    const sessionToken = await generateSessionToken(username);
    
    return jsonResponse({
      message: 'Login successful',
      username,
      sessionToken,
      storageUsed: user.storageUsed,
      storageLimit: user.storageLimit
    });

  } catch (error) {
    console.error('Login error:', error);
    return jsonResponse({ error: 'Login failed' }, 500);
  }
}

/**
 * Handle file upload
 */
async function handleFileUpload(request, env) {
  try {
    // Authenticate user
    const sessionToken = request.headers.get('Authorization')?.replace('Bearer ', '');
    const username = await validateSessionToken(sessionToken, env);
    
    if (!username) {
      return jsonResponse({ error: 'Authentication required' }, 401);
    }

    const formData = await request.formData();
    const file = formData.get('file');
    const filePath = formData.get('path')?.toString() || `/${file.name}`;

    if (!file || file.size === 0) {
      return jsonResponse({ error: 'No file provided' }, 400);
    }

    if (file.size > CONFIG.MAX_FILE_SIZE) {
      return jsonResponse({ error: 'File too large' }, 413);
    }

    // Check user storage limit
    const userData = await env.VBI_KV.get(`user:${username}`);
    const user = JSON.parse(userData);
    
    if (user.storageUsed + file.size > CONFIG.MAX_STORAGE_PER_USER) {
      return jsonResponse({ error: 'Storage limit exceeded' }, 413);
    }

    // Process file content
    const arrayBuffer = await file.arrayBuffer();
    const extension = file.name.split('.').pop()?.toLowerCase();
    
    let fileContent;
    if (['png', 'jpg', 'jpeg', 'gif', 'ico'].includes(extension)) {
      // Convert binary files to base64
      fileContent = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    } else {
      // Text files as string
      fileContent = new TextDecoder().decode(arrayBuffer);
    }

    const fileData = {
      name: file.name,
      size: file.size,
      type: file.type,
      content: fileContent,
      uploadedAt: new Date().toISOString()
    };

    // Store file
    const fileKey = `files:${username}:${filePath}`;
    await env.VBI_KV.put(fileKey, JSON.stringify(fileData));

    // Update user storage usage
    user.storageUsed += file.size;
    await env.VBI_KV.put(`user:${username}`, JSON.stringify(user));

    return jsonResponse({
      message: 'File uploaded successfully',
      path: filePath,
      size: file.size,
      storageUsed: user.storageUsed
    });

  } catch (error) {
    console.error('Upload error:', error);
    return jsonResponse({ error: 'Upload failed' }, 500);
  }
}

/**
 * Handle listing files
 */
async function handleListFiles(request, env) {
  try {
    const sessionToken = request.headers.get('Authorization')?.replace('Bearer ', '');
    const username = await validateSessionToken(sessionToken, env);
    
    if (!username) {
      return jsonResponse({ error: 'Authentication required' }, 401);
    }

    const listResult = await env.VBI_KV.list({ prefix: `files:${username}:` });
    const files = [];

    for (const key of listResult.keys) {
      const fileData = await env.VBI_KV.get(key.name);
      if (fileData) {
        const file = JSON.parse(fileData);
        files.push({
          path: key.name.replace(`files:${username}:`, ''),
          name: file.name,
          size: file.size,
          type: file.type,
          uploadedAt: file.uploadedAt
        });
      }
    }

    return jsonResponse({ files });

  } catch (error) {
    console.error('List files error:', error);
    return jsonResponse({ error: 'Failed to list files' }, 500);
  }
}

/**
 * Handle file deletion
 */
async function handleDeleteFile(request, env) {
  try {
    const sessionToken = request.headers.get('Authorization')?.replace('Bearer ', '');
    const username = await validateSessionToken(sessionToken, env);
    
    if (!username) {
      return jsonResponse({ error: 'Authentication required' }, 401);
    }

    const { filePath } = await request.json();
    const fileKey = `files:${username}:${filePath}`;
    
    // Get file data to update storage usage
    const fileData = await env.VBI_KV.get(fileKey);
    if (!fileData) {
      return jsonResponse({ error: 'File not found' }, 404);
    }

    const file = JSON.parse(fileData);
    
    // Delete file
    await env.VBI_KV.delete(fileKey);

    // Update user storage usage
    const userData = await env.VBI_KV.get(`user:${username}`);
    const user = JSON.parse(userData);
    user.storageUsed -= file.size;
    await env.VBI_KV.put(`user:${username}`, JSON.stringify(user));

    return jsonResponse({
      message: 'File deleted successfully',
      storageUsed: user.storageUsed
    });

  } catch (error) {
    console.error('Delete error:', error);
    return jsonResponse({ error: 'Failed to delete file' }, 500);
  }
}

/**
 * Serve admin interface HTML
 */
function serveAdminInterface(pathname) {
  // This would serve different HTML pages based on pathname
  // For brevity, returning a simple response
  return new Response('Admin interface - see admin.html files', {
    headers: { 'Content-Type': 'text/html' }
  });
}

/**
 * Handle main site requests
 */
async function handleMainSite(pathname, request, env) {
  // Serve landing page and main site content
  if (pathname === '/' || pathname === '/index.html') {
    return serveMainHTML();
  }
  
  return new Response('Not found', { status: 404 });
}

/**
 * Utility functions
 */
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

async function verifyPassword(password, hash) {
  const hashedInput = await hashPassword(password);
  return hashedInput === hash;
}

async function generateSessionToken(username) {
  const data = `${username}:${Date.now()}:${Math.random()}`;
  return await hashPassword(data);
}

async function validateSessionToken(token, env) {
  if (!token) return null;
  
  // In production, store sessions in KV and validate properly
  // This is a simplified implementation
  try {
    const sessionData = await env.VBI_KV.get(`session:${token}`);
    if (sessionData) {
      const session = JSON.parse(sessionData);
      return session.username;
    }
  } catch (error) {
    console.error('Session validation error:', error);
  }
  
  return null;
}

function serveMainHTML() {
  const html = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>VBI ProxyHost - Free Static Website Hosting</title>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; }
      .hero { background: linear-gradient(135deg, #2563eb, #1d4ed8); color: white; padding: 4rem 2rem; text-align: center; }
      .hero h1 { font-size: 3rem; margin-bottom: 1rem; }
      .hero p { font-size: 1.2rem; margin-bottom: 2rem; }
      .btn { display: inline-block; padding: 0.75rem 1.5rem; background: #059669; color: white; text-decoration: none; border-radius: 0.5rem; transition: background 0.3s; }
      .btn:hover { background: #047857; }
      .container { max-width: 1200px; margin: 0 auto; padding: 0 2rem; }
      .features { padding: 4rem 2rem; background: #f8fafc; }
      .features-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem; margin-top: 2rem; }
      .feature { background: white; padding: 2rem; border-radius: 0.5rem; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    </style>
  </head>
  <body>
    <div class="hero">
      <div class="container">
        <h1>VBI ProxyHost</h1>
        <p>Free static website hosting with custom subdomains</p>
        <a href="/register" class="btn">Get Started</a>
      </div>
    </div>
    
    <div class="features">
      <div class="container">
        <h2>Features</h2>
        <div class="features-grid">
          <div class="feature">
            <h3>Custom Subdomains</h3>
            <p>Get your own subdomain like username.vbiproxyhost.com</p>
          </div>
          <div class="feature">
            <h3>100MB Storage</h3>
            <p>Store up to 100MB of static files for free</p>
          </div>
          <div class="feature">
            <h3>Fast CDN</h3>
            <p>Global delivery via Cloudflare's edge network</p>
          </div>
        </div>
      </div>
    </div>
  </body>
  </html>
  `;
  
  return new Response(html, {
    headers: { 'Content-Type': 'text/html' }
  });
}