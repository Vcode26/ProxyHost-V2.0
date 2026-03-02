# VBI ProxyHost - Free Static Website Hosting

VBI ProxyHost is a comprehensive free hosting service built with Cloudflare Workers that allows users to deploy and serve static websites through custom subdomains.

## Features

- **Custom Subdomains**: Each user gets their own subdomain (username.vbiproxyhost.com)
- **Static File Serving**: Support for HTML, CSS, JavaScript, and image files
- **User Authentication**: Simple registration and login system
- **File Management**: Upload, delete, and manage files through web interface
- **Storage Limits**: 100MB storage per user with 10MB max file size
- **Rate Limiting**: Built-in protection against abuse
- **Global CDN**: Fast delivery via Cloudflare's edge network

## Setup Instructions

### Prerequisites

1. Cloudflare account
2. Domain name configured in Cloudflare
3. Wrangler CLI installed: `npm install -g wrangler`

### Step 1: Clone and Setup

```bash
# Clone or create project directory
mkdir vbi-proxyhost
cd vbi-proxyhost

# Install dependencies
npm install
```

### Step 2: Configure Cloudflare Resources

1. **Create KV Namespace:**
```bash
wrangler kv:namespace create "VBI_KV"
wrangler kv:namespace create "VBI_KV" --preview
```

2. **Update wrangler.toml** with your KV namespace IDs:
```toml
kv_namespaces = [
  { binding = "VBI_KV", id = "your-kv-namespace-id", preview_id = "your-preview-kv-id" }
]
```

3. **Configure DNS** in Cloudflare Dashboard:
   - Add A record for your domain pointing to `192.0.2.1` (placeholder)
   - Add CNAME record for `*` pointing to your domain
   - Enable "Proxied" status for both records

### Step 3: Deploy

```bash
# Authenticate with Cloudflare
wrangler login

# Deploy to Cloudflare Workers
wrangler deploy
```

### Step 4: Configure Routes

In Cloudflare Dashboard:
1. Go to Workers & Pages > Overview
2. Click on your worker
3. Go to Triggers tab
4. Add routes:
   - `yourdomain.com/*`
   - `*.yourdomain.com/*`

## API Documentation

### Authentication Endpoints

#### POST /register
Register a new user account.

**Request Body:**
```
username: string (3+ chars, alphanumeric + hyphens)
email: string (valid email)
password: string (6+ chars)
```

**Response:**
```json
{
  "message": "Registration successful",
  "username": "username"
}
```

#### POST /login
Authenticate user and get session token.

**Request Body:**
```
username: string
password: string
```

**Response:**
```json
{
  "message": "Login successful",
  "username": "username",
  "sessionToken": "token",
  "storageUsed": 0,
  "storageLimit": 104857600
}
```

### File Management Endpoints

#### POST /upload
Upload files to user account.

**Headers:**
```
Authorization: Bearer {sessionToken}
```

**Request Body (multipart/form-data):**
```
file: File
path: string (optional)
```

**Response:**
```json
{
  "message": "File uploaded successfully",
  "path": "/filename.html",
  "size": 1024,
  "storageUsed": 1024
}
```

#### GET /api/files
List user's uploaded files.

**Headers:**
```
Authorization: Bearer {sessionToken}
```

**Response:**
```json
{
  "files": [
    {
      "path": "/index.html",
      "name": "index.html",
      "size": 1024,
      "type": "text/html",
      "uploadedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

#### DELETE /api/files
Delete a file.

**Headers:**
```
Authorization: Bearer {sessionToken}
Content-Type: application/json
```

**Request Body:**
```json
{
  "filePath": "/filename.html"
}
```

## Security Features

- **Input Validation**: All user inputs are validated and sanitized
- **Rate Limiting**: 100 requests per minute per IP
- **Storage Limits**: 100MB per user, 10MB per file
- **Authentication**: Session-based authentication with tokens
- **CORS**: Proper CORS headers for cross-origin requests
- **File Type Validation**: Only allowed file types can be uploaded

## Configuration Options

### Environment Variables

- `ENVIRONMENT`: "production" or "staging"
- `DOMAIN`: Your domain name

### Storage Configuration

- `MAX_FILE_SIZE`: Maximum file size (default: 10MB)
- `MAX_STORAGE_PER_USER`: Maximum storage per user (default: 100MB)
- `RATE_LIMIT_REQUESTS`: Rate limit threshold (default: 100/minute)

## File Structure

```
vbi-proxyhost/
├── worker.js              # Main Cloudflare Worker script
├── wrangler.toml          # Wrangler configuration
├── admin.html             # Admin dashboard interface
├── package.json           # Node.js dependencies
└── README.md              # Documentation
```

## Usage Examples

### Uploading a Website

1. Register at `yourdomain.com/register`
2. Login at `yourdomain.com/admin`
3. Upload your HTML, CSS, and JS files
4. Your site will be available at `username.yourdomain.com`

### Managing Files

- Use the web dashboard at `/admin`
- Upload files via drag-and-drop interface
- Delete files individually
- Monitor storage usage

## Performance Optimizations

- **Edge Caching**: Static files cached at Cloudflare edge locations
- **Compression**: Automatic gzip compression for text files
- **CDN**: Global distribution via Cloudflare's network
- **Efficient Storage**: KV storage for metadata, R2 for large files

## Limitations

- **File Size**: 10MB maximum per file
- **Storage**: 100MB total per user
- **Execution Time**: 50ms CPU time per request (Cloudflare Workers limit)
- **Request Size**: 100MB maximum (Cloudflare limit)
- **Static Files Only**: No server-side processing

## Troubleshooting

### Common Issues

1. **Subdomain not working**: Check DNS configuration and worker routes
2. **Files not uploading**: Check file size and storage limits
3. **Login issues**: Verify KV namespace configuration
4. **404 errors**: Ensure proper route configuration

### Debug Mode

Enable debug logging by setting `DEBUG=true` in wrangler.toml:

```toml
[env.development.vars]
DEBUG = "true"
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For support and questions:
- Create an issue in the GitHub repository
- Check the documentation for common solutions
- Review Cloudflare Workers documentation for platform-specific issues

## Production Checklist

Before deploying to production:

- [ ] Configure proper domain and DNS
- [ ] Set up KV namespaces
- [ ] Configure rate limiting
- [ ] Set storage limits
- [ ] Enable error logging
- [ ] Test file upload/download
- [ ] Test subdomain routing
- [ ] Configure monitoring
- [ ] Set up backup procedures
- [ ] Review security settings