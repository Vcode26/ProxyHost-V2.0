# Testing Guide - VBI ProxyHost

## Testing Signup

### Step 1: Access the Application
Navigate to your Bolt.sh URL (e.g., `https://vbi-proxyhost-compre-xum8.bolt.host`)

### Step 2: Click "Get Started" or Go to Register Page
Click the blue "Get Started" button or navigate to `/register`

### Step 3: Fill in Registration Form
- **Username**: Choose a unique username (3+ chars, lowercase, alphanumeric + hyphens)
  - Examples: `mysite`, `my-awesome-site`, `portfolio2024`
- **Email**: Use a valid email address
  - Must include @ symbol
  - Can use test emails like `test123@example.com`
- **Password**: At least 6 characters
  - Examples: `password123`, `MySecure!Pass`

### Step 4: Submit Form
Click "Create Account" button

### Step 5: Expected Behavior
1. Form validates inputs
2. Shows loading state ("Creating account...")
3. On success: Redirects to dashboard
4. On error: Shows error message (if email exists, username taken, etc.)

## Testing Login

### From Dashboard
1. Click "Logout" button in top-right
2. You'll be redirected to home page
3. Click "Login" link or navigate to `/login`
4. Enter email and password used in signup
5. Click "Login" button

### Direct Access
Navigate to `/login` and enter credentials

### Expected Behavior
- On success: Redirected to dashboard with your files
- On error: Shows "Invalid email or password" message

## Testing File Upload

### From Dashboard
1. Click "Upload Files" button
2. Select files from your computer:
   - HTML files: `index.html`, `about.html`
   - CSS files: `styles.css`
   - JS files: `script.js`
   - Images: `logo.png`, `background.jpg`
3. Wait for upload to complete
4. See files listed in the Files section

### File Requirements
- Max file size: 10MB per file
- Max total storage: 100MB per user
- Supported types: HTML, CSS, JS, images, fonts, JSON

## Testing Site Access

### Upload index.html
1. Create a simple HTML file:
```html
<!DOCTYPE html>
<html>
<head>
    <title>My Site</title>
</head>
<body>
    <h1>Welcome to My Site</h1>
    <p>This is served from VBI ProxyHost</p>
</body>
</html>
```

2. Upload via dashboard

3. Your site will be available at: `{username}.vbiproxyhost.com`

### Access from Browser
- Visit `{your-username}.vbiproxyhost.com`
- Should see your HTML content
- Check browser console (F12) for any errors

## Troubleshooting Signup

### Problem: "Email already registered"
**Solution**: Use a different email address

### Problem: "Username already taken"
**Solution**: Choose a different username

### Problem: Stuck on loading after clicking "Create Account"
**Solution**:
1. Check browser console (F12 → Console tab)
2. Check Network tab for failed requests
3. Verify `.env` has correct Supabase credentials
4. Try a different email/username combination

### Problem: Form validation error
**Solution**: Check error message and adjust inputs:
- Email: Must contain @
- Username: Must be 3+ chars, alphanumeric + hyphens only
- Password: Must be 6+ characters

## Testing Different User Accounts

### Create Multiple Test Users
1. Use different email addresses:
   - `user1@example.com` (username: `user1`)
   - `user2@example.com` (username: `user2`)
   - `user3@example.com` (username: `user3`)

2. Each user can upload files to their own site
3. Each gets their own subdomain

### Logout and Login Cycle
1. Create account → See dashboard
2. Click Logout → Redirected to home
3. Click Login → Enter credentials → Dashboard again
4. Verify same files appear

## Testing Error Handling

### Invalid Inputs
- Empty email: Shows validation error
- Invalid email format: Shows validation error
- Short password: Shows validation error
- Invalid username format: Shows validation error

### Network Errors
- Disconnect internet and try signup: Shows network error
- Reconnect and retry: Should work if Supabase is accessible

## Performance Testing

### Load Times
- Homepage: Should load instantly
- Login page: Should load instantly
- Registration: Should load instantly
- Dashboard: May take 1-2s to load files initially

### File Upload
- Small files (< 1MB): Should upload in < 1s
- Large files (5-10MB): May take 5-10s
- Multiple files: Upload sequentially

## Browser Compatibility

Tested and working on:
- Chrome/Chromium (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Monitoring

### Check Browser Console (F12 → Console)
Look for:
- Green "✓" messages for successful operations
- Red "✗" messages or errors for failures
- Network errors or timeouts

### Check Supabase Logs
1. Log in to Supabase dashboard
2. Go to your project
3. Check Auth logs for signup/login events
4. Check Database activity for queries
5. Check Edge Function logs for serve-site activity

## Success Criteria

Signup works correctly when:
- Form validates all inputs
- Email verification not required (email confirmation disabled)
- User created in auth system
- User profile created in database
- User automatically logged in after signup
- Dashboard loads with user info
- Can upload files
- Files appear in file list
- Site accessible at custom subdomain
