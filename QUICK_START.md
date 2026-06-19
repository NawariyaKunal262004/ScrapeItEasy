de# 🚀 Deployment Quick Reference

## What Changed

✅ **Python Scraper → JavaScript Scraper**
- Converted `python-scraper/scraper.py` to `server/utils/scraper.js`
- No more Python dependency needed on Vercel
- Works with Node.js runtime

✅ **New Files Created**
- `server/utils/scraper.js` - JavaScript scraper logic
- `vercel.json` - Vercel deployment config
- `.env.example` - Environment variables template
- `package.json` (root) - Build script for Vercel
- `DEPLOYMENT.md` - Full deployment guide

✅ **Files Updated**
- `server/routes/scrape.js` - Now uses JavaScript scraper
- `.gitignore` - Already has `.env` (safe!)

---

## Deployment in 5 Minutes

### 1. **Build React App** (do this now!)
```bash
cd client
npm run build
```

### 2. **Add to .env** (for local testing)
```
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/scrapeiteasy
CLIENT_URL=http://localhost:5173
```

### 3. **Test Locally**
```bash
npm --prefix server start
# In another terminal:
npm --prefix client run dev
```

### 4. **Push to GitHub**
```bash
git add .
git commit -m "Ready for Vercel deployment"
git push origin main
```

### 5. **Deploy to Vercel**
- Go to https://vercel.com/new
- Select your GitHub repo
- Set env vars (MONGODB_URI, CLIENT_URL)
- Deploy! 🎉

---

## Environment Variables to Add in Vercel Dashboard

| Variable | Example | Source |
|----------|---------|--------|
| `MONGODB_URI` | `mongodb+srv://user:pass@...` | MongoDB Atlas |
| `CLIENT_URL` | `https://your-project.vercel.app` | After first deploy |
| `NODE_ENV` | `production` | Set to production |

---

## Important Notes

🔒 **Security**
- `.env` is in `.gitignore` (good!)
- Add `.env.local` or `.env.production` locally
- Set env vars in Vercel Dashboard (NOT in code)

⚙️ **MongoDB Atlas Setup** (if not done)
1. Create free cluster: https://www.mongodb.com/cloud/atlas
2. Create database user
3. Whitelist IP: `0.0.0.0` (for Vercel's dynamic IPs)
4. Copy connection string

📱 **Team Access**
- Share Vercel project URL with team
- They can view but won't need to deploy again
- You can add team members in Vercel dashboard

---

## Troubleshooting Commands

```bash
# Test API health check
curl https://your-project.vercel.app/api/health

# View Vercel logs
vercel logs --follow

# Redeploy
vercel --prod

# Check build output
cd client && npm run build
```

---

## Next: Make Scrapers Real!

Replace mock data in `server/utils/scraper.js`:
- Add real HTTP requests to JustDial, TradeIndia, etc.
- Use BeautifulSoup-like packages (cheerio, jsdom)
- Implement proper error handling

---

Ready? Start with: `npm run build` in the client folder!
