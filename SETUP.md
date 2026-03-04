# VBI ProxyHost - Setup & Troubleshooting Guide

## Quick Start

1. **Environment Variables**: Ensure `.env` has Supabase credentials:
   ```
   VITE_SUPABASE_URL=your-supabase-url
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

2. **Database**: The schema is auto-created with migrations (users table + hosted_files table)

3. **Run Development Server**: `npm run dev`

4. **Build for Production**: `npm run build`

## Authentication Flow

### Registration (Signup)

The signup process:
1. User enters email, password, and desired username
2. Supabase creates an auth account
3. A new user profile is created in the `users` table
4. User is automatically logged in
5. Redirected to dashboard

**Validation Rules:**
- Email: Must be valid and unique
- Username: 3+ characters, alphanumeric + hyphens only, starts/ends with letter or number
- Password: Minimum 6 characters

**Common Issues:**

- "Email already registered": The email exists in Supabase auth. Use a different email or login instead.
- "Username already taken": Choose a different username.
- "Invalid email format": Make sure email is valid (contains @)

### Login

1. Enter email and password
2. Supabase authenticates
3. User profile is loaded from `users` table
4. Redirected to dashboard

## Dashboard Features

### File Management
- Upload HTML, CSS, JS, images, and fonts
- Upload multiple files at once
- Delete individual files
- View file size and upload date

### Storage Tracking
- See current storage usage
- Total limit: 100MB per user
- Max file size: 10MB per file

### Site Serving
- Your site URL: `{username}.vbiproxyhost.com`
- Automatically serves `index.html` at root
- Supports all static file types
- Files are served at custom subdomains via Edge Function

## Database Schema

### users table
```sql
- id (uuid) - References auth.users.id
- username (text) - Unique, 3+ chars, alphanumeric + hyphens
- email (text) - User email
- storage_used (bigint) - Current storage in bytes
- storage_limit (bigint) - Max storage allowed (default 100MB)
- created_at (timestamptz) - Account creation time
- updated_at (timestamptz) - Last update time
```

### hosted_files table
```sql
- id (uuid) - File ID
- user_id (uuid) - References users.id
- file_path (text) - File path (e.g., /index.html)
- file_name (text) - Original filename
- file_size (bigint) - File size in bytes
- mime_type (text) - File MIME type
- content (text) - File content (base64 for binary)
- is_binary (boolean) - Binary flag
- created_at (timestamptz) - Upload time
- updated_at (timestamptz) - Last modification time
```

## Security

### Row Level Security (RLS) Policies

**users table:**
- Users can view their own profile (authenticated)
- Users can update their own profile (authenticated)
- Public read access for username lookup (for subdomain serving)

**hosted_files table:**
- Users can view their own files (authenticated)
- Users can upload/update/delete their own files (authenticated)
- Public read access for file serving

### Storage Limits
- 100MB per user by default
- 10MB maximum per file
- Enforced on upload

## Troubleshooting

### Signup Issues
1. **"Missing environment variables"**: Check `.env` file has `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
2. **Network errors during signup**: Check Supabase project is accessible
3. **Stuck on loading**: Check browser console for errors (F12 dev tools)

### Dashboard Issues
1. **Files not loading**: Ensure you're logged in correctly
2. **Upload fails**: Check file size (max 10MB) and storage limit (max 100MB total)
3. **Can't delete files**: Refresh page and try again

### Site Serving Issues
1. **404 errors**: Ensure you have uploaded files to the site
2. **index.html not serving at root**: Edge Function automatically serves it for `/` requests
3. **Binary files not displaying**: Large files are base64 encoded in database

## File Upload Details

### Text Files
- Stored as plain text in database
- HTML, CSS, JS, JSON, TXT, MD, etc.

### Binary Files
- Images (PNG, JPG, GIF, WebP, SVG, ICO)
- Fonts (WOFF, WOFF2, TTF, EOT)
- PDFs and other binary formats
- Base64 encoded for storage

### Supported MIME Types
The Edge Function supports and serves:
- Web: HTML, CSS, JS, JSON
- Images: PNG, JPG, GIF, SVG, ICO, WebP
- Fonts: WOFF, WOFF2, TTF, EOT
- Documents: PDF, TXT, MD

## Edge Function

The `serve-site` Edge Function:
- URL pattern: `{username}.vbiproxyhost.com/{path}`
- Automatically serves `index.html` at root
- Detects binary vs text files
- Returns proper MIME types
- CORS enabled for all requests
- Caching enabled (1 hour)

## Development Tips

1. **Hot Reload**: Changes to React components auto-reload with Vite
2. **Console Logs**: Check browser console (F12) for errors
3. **Network Requests**: Use Network tab to debug API calls
4. **Database Queries**: Use Supabase Studio to inspect data directly

## Production Deployment

1. Build: `npm run build`
2. Deploy the `dist/` folder
3. Ensure `.env` variables are set in production environment
4. Test signup and file uploads in production
5. Monitor Supabase logs for errors

## Support

If signup still doesn't work:
1. Check Supabase auth configuration
2. Verify email confirmation is disabled (default)
3. Check RLS policies on users table
4. Look at Supabase logs for auth errors
5. Try signup with a different email address
