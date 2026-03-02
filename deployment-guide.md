# VBI ProxyHost Deployment Guide

This guide walks you through deploying VBI ProxyHost to Cloudflare Workers.

## Prerequisites

1. **Cloudflare Account**: Sign up at [cloudflare.com](https://cloudflare.com)
2. **Domain**: A domain name added to your Cloudflare account
3. **Wrangler CLI**: Install globally with `npm install -g wrangler`
4. **Node.js**: Version 16 or higher

## Step-by-Step Deployment

### 1. Initial Setup

```bash
# Clone the project
git clone <your-repo-url>
cd vbi-proxyhost

# Install dependencies
npm install

# Authenticate with Cloudflare
wrangler login
```

### 2. Create Cloudflare Resources

#### Create KV Namespace
```bash
# Create production KV namespace
wrangler kv:namespace create "VBI_KV"

# Create preview KV namespace for development
wrangler kv:namespace create "VBI_KV" --preview
```

Copy the namespace IDs from the output and update your `wrangler.toml`:

```toml
kv_namespaces = [
  { binding = "VBI_KV", id = "your-production-id-here", preview_id = "your-preview-id-here" }
]
```

#### Optional: Create R2 Bucket for Large Files
```bash
# Create R2 bucket for file storage
wrangler r2 bucket create vbi-proxyhost-files
```

### 3. Configure DNS

In your Cloudflare Dashboard:

1. **Go to DNS settings** for your domain
2. **Add A record**:
   - Name: `@` (or your domain)
   - IPv4 address: `192.0.2.1` (placeholder)
   - Proxy status: Proxied (orange cloud)
3. **Add CNAME record for subdomains**:
   - Name: `*`
   - Target: `yourdomain.com`
   - Proxy status: Proxied (orange cloud)

### 4. Update Configuration

Edit `wrangler.toml` with your domain:

```toml
name = "vbi-proxyhost"
main = "worker.js"
compatibility_date = "2024-01-01"

# Update these with your domain
routes = [
  { pattern = "yourdomain.com/*", zone_name = "yourdomain.com" },
  { pattern = "*.yourdomain.com/*", zone_name = "yourdomain.com" }
]

# Your KV namespace IDs
kv_namespaces = [
  { binding = "VBI_KV", id = "your-kv-id", preview_id = "your-preview-kv-id" }
]

[env.production.vars]
ENVIRONMENT = "production"
DOMAIN = "yourdomain.com"
```

### 5. Deploy to Production

```bash
# Deploy the worker
wrangler deploy

# Verify deployment
wrangler tail
```

### 6. Test Your Deployment

1. **Visit your main site**: `https://yourdomain.com`
2. **Register a test account**: `https://yourdomain.com/register`
3. **Login and upload files**: `https://yourdomain.com/admin`
4. **Test subdomain**: `https://testuser.yourdomain.com`

## Advanced Configuration

### Custom Domain Setup

If using a custom domain (not through Cloudflare):

1. **Add domain to Cloudflare**
2. **Update nameservers** at your registrar
3. **Wait for DNS propagation** (up to 48 hours)
4. **Configure SSL** in Cloudflare Dashboard

### Environment Variables

Set production environment variables:

```bash
# Set environment variables
wrangler secret put ADMIN_PASSWORD
wrangler secret put JWT_SECRET
```

### Performance Optimization

#### Enable Caching
Add caching rules in Cloudflare Dashboard:
- Cache everything for static files
- Edge TTL: 1 month for images, CSS, JS
- Browser TTL: 1 day

#### Security Settings
1. **Security Level**: Medium or High
2. **Bot Fight Mode**: On
3. **Rate Limiting**: Configure custom rules
4. **DDoS Protection**: Automatic

### Monitoring and Analytics

#### Enable Analytics
In Cloudflare Dashboard:
1. Go to Analytics & Logs
2. Enable Web Analytics
3. Set up alerts for errors

#### Worker Analytics
Monitor your worker performance:
```bash
# View real-time logs
wrangler tail

# Check metrics
wrangler metrics
```

### Backup Strategy

#### KV Data Backup
```bash
# Export KV data
wrangler kv:bulk get --namespace-id your-kv-id --output backup.json

# Import KV data
wrangler kv:bulk put --namespace-id your-kv-id backup.json
```

## Troubleshooting

### Common Issues

#### 1. Subdomain Not Working
- Check DNS CNAME record for `*`
- Verify worker routes include `*.yourdomain.com/*`
- Ensure proxy is enabled (orange cloud)

#### 2. KV Errors
- Verify KV namespace IDs in wrangler.toml
- Check KV permissions
- Ensure namespace exists in correct account

#### 3. File Upload Issues
- Check file size limits (10MB default)
- Verify storage quota (100MB default)
- Check authentication headers

#### 4. 524 Timeout Errors
- Optimize worker code
- Reduce external API calls
- Check execution time limits

### Debug Mode

Enable debug logging:

```toml
[env.development.vars]
DEBUG = "true"
LOG_LEVEL = "debug"
```

### Health Checks

Create monitoring endpoints:

```javascript
// Add to worker.js
if (pathname === '/health') {
  return new Response(JSON.stringify({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
```

## Cost Optimization

### Cloudflare Workers Pricing
- **Free Tier**: 100,000 requests/day
- **Paid Tier**: $5/month for 10M requests

### KV Storage Pricing
- **Free Tier**: 100,000 reads/day, 1,000 writes/day
- **Paid Tier**: $0.50/million reads, $5/million writes

### R2 Storage Pricing
- **Free Tier**: 10GB storage
- **Paid Tier**: $0.015/GB/month

## Security Hardening

### Rate Limiting
```javascript
// Implement stricter rate limiting
const RATE_LIMITS = {
  upload: 10,    // 10 uploads per hour
  login: 5,      // 5 login attempts per hour
  register: 3    // 3 registrations per hour
};
```

### Input Validation
- Validate all user inputs
- Sanitize file names
- Check file types strictly
- Limit request sizes

### Authentication
- Use strong session tokens
- Implement token expiration
- Add CSRF protection
- Enable 2FA (optional)

## Maintenance

### Regular Tasks
1. **Monitor storage usage**
2. **Clean up expired sessions**
3. **Review error logs**
4. **Update dependencies**
5. **Backup KV data**

### Updates
```bash
# Update Wrangler
npm update -g wrangler

# Deploy updates
wrangler deploy

# Rollback if needed
wrangler rollback
```

This deployment guide should get you up and running with VBI ProxyHost in production. Remember to test thoroughly before going live!