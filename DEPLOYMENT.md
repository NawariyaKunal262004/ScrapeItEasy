# 🚀 ScrapeItEasy – Deployment Guide

## Quick Start: Deploy to Vercel

### Prerequisites
- ✅ Code pushed to GitHub (without `.env`)
- ✅ MongoDB Atlas account (free tier available at https://www.mongodb.com/cloud/atlas)
- ✅ Vercel account (free at https://vercel.com)

---

## Step 1: Set Up MongoDB Atlas

1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up or log in
3. Create a new project
4. Create a free M0 cluster
5. Add a database user:
   - Username: `scrapeuser`
   - Password: Generate a strong password
   - Copy the connection string:
   ```
   mongodb+srv://scrapeuser:YOUR_PASSWORD@cluster-xyz.mongodb.net/scrapeiteasy?retryWrites=true&w=majority
   ```

---

## Step 2: Build the Client

Before deploying, build the React app:

```bash
cd client
npm run build
```

This creates a `dist/` folder with the optimized build.

---

## Step 3: Deploy to Vercel

### Option A: Using Vercel CLI (Recommended)

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Log in to Vercel:
   ```bash
   vercel login
   ```

3. Deploy from the project root:
   ```bash
   vercel
   ```

4. When prompted:
   - **Project name**: `scrapeiteasy`
   - **Framework**: Select `Other`
   - **Root directory**: `.`
   - **Build command**: Leave blank (uses vercel.json)
   - **Output directory**: Leave blank

5. After deployment completes, Vercel will give you a URL like:
   ```
   https://scrapeiteasy.vercel.app
   ```

### Option B: Using GitHub Integration

1. Push your code to GitHub
2. Go to https://vercel.com/new
3. Select your GitHub repository
4. Configure:
   - **Framework Preset**: Other
   - **Root Directory**: `.`
   - Leave Build commands blank (uses vercel.json)

---

## Step 4: Set Environment Variables in Vercel

1. Go to your project on Vercel: https://vercel.com/dashboard
2. Click your project → Settings → Environment Variables
3. Add these variables:

| Key | Value |
|-----|-------|
| `MONGODB_URI` | `mongodb+srv://scrapeuser:YOUR_PASSWORD@cluster-xyz.mongodb.net/scrapeiteasy?retryWrites=true&w=majority` |
| `CLIENT_URL` | `https://your-project.vercel.app` |
| `NODE_ENV` | `production` |

---

## Step 5: Deploy & Test

1. Redeploy to apply env variables:
   ```bash
   vercel --prod
   ```

2. Test the API:
   ```bash
   curl https://your-project.vercel.app/api/health
   ```
   Should return: `{"status":"ok","message":"ScrapeItEasy server is running."}`

3. Open the app:
   ```
   https://your-project.vercel.app
   ```

---

## Troubleshooting

### "Cannot find module" errors
- Make sure all dependencies are in `server/package.json` and `client/package.json`
- Run `npm install` locally first

### MongoDB connection fails
- Check your connection string is correct
- Make sure your IP is whitelisted in MongoDB Atlas (Network Access → Add IP Address → 0.0.0.0)

### Scraping returns empty results
- Currently using mock data - this is expected
- To enable real scraping, implement the scraper functions in `server/utils/scraper.js`

### CORS errors
- Make sure `CLIENT_URL` environment variable is set correctly in Vercel

---

## Production Checklist

- [x] Environment variables configured in Vercel
- [x] MongoDB cluster created and IP whitelisted
- [x] React app built (`npm run build`)
- [x] All dependencies installed
- [x] Code pushed to GitHub without `.env` file
- [x] `.gitignore` includes `.env`

---

## Next Steps

1. **Share the URL** with your team: `https://your-project.vercel.app`
2. **Update scraper logic** in `server/utils/scraper.js` with real scraping
3. **Monitor logs** in Vercel Dashboard → Deployments → Function Logs
4. **Add more features** as needed!

---

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [MongoDB Atlas Guide](https://docs.atlas.mongodb.com/)
- [Express.js Guide](https://expressjs.com/)
- [React + Vite Guide](https://vitejs.dev/guide/)
