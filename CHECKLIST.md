# GitHub & Vercel Deployment Checklist

## ✅ Pre-Push to GitHub

### Code Quality
- [x] TypeScript errors fixed
- [x] ESLint configuration added
- [x] Prettier configuration added
- [ ] Run `npm run typecheck` - should pass
- [ ] Run `npm run lint` - fix any issues
- [ ] Run `npm run format` - format all files
- [ ] Run `npm run build` - verify successful build

### Documentation
- [x] README.md created with setup instructions
- [x] LICENSE file added (MIT)
- [x] CONTRIBUTING.md created
- [x] DEPLOYMENT.md created
- [x] SECURITY.md created
- [x] .env.example created with all required variables

### Repository Setup
- [x] .gitignore properly configured
- [x] Package.json updated with correct name
- [x] GitHub workflows created (CI/CD)
- [x] Issue templates created
- [x] VSCode settings added

### Security
- [ ] Remove any hardcoded secrets/API keys
- [ ] Verify .env is in .gitignore
- [ ] Generate strong SESSION_SECRET for production
- [ ] Review sensitive data in code

## 🚀 GitHub Repository Setup

### Initial Push
```bash
# Initialize git (if not already)
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: Brain Entrainer v1.0.0"

# Create repository on GitHub
# Then add remote and push:
git remote add origin https://github.com/yourusername/brain-entrainer.git
git branch -M main
git push -u origin main
```

### Repository Settings
- [ ] Add repository description
- [ ] Add topics/tags (binaural-beats, sleep, audio, therapy, etc.)
- [ ] Enable Discussions (optional)
- [ ] Enable Issues
- [ ] Set up branch protection for `main` (optional)
- [ ] Add repository image/social preview

### GitHub Secrets (for Actions)
If using automated Vercel deployment:
- [ ] Add `VERCEL_TOKEN`
- [ ] Add `VERCEL_ORG_ID`
- [ ] Add `VERCEL_PROJECT_ID`

## ☁️ Database Setup

Choose one provider:

### Option A: Vercel Postgres
- [ ] Create Vercel Postgres database
- [ ] Copy DATABASE_URL
- [ ] Test connection

### Option B: Supabase (Recommended)
- [ ] Create Supabase project
- [ ] Enable connection pooling
- [ ] Copy DATABASE_URL (pooling mode)
- [ ] Test connection

### Option C: Neon
- [ ] Create Neon project
- [ ] Copy DATABASE_URL
- [ ] Test connection

## 🌐 Vercel Deployment

### Initial Setup
- [ ] Sign up for Vercel account
- [ ] Connect GitHub account to Vercel
- [ ] Import brain-entrainer repository

### Configuration
- [ ] Set build command: `npm run build`
- [ ] Set output directory: `dist`
- [ ] Set install command: `npm install`
- [ ] Framework preset: Other

### Environment Variables
Add in Vercel dashboard:
- [ ] `DATABASE_URL` - Your PostgreSQL connection string
- [ ] `SESSION_SECRET` - Strong random string (32+ chars)
- [ ] `OPENAI_API_KEY` - Your OpenAI API key
- [ ] `NODE_ENV` - Set to `production`

Generate SESSION_SECRET:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### First Deployment
- [ ] Click "Deploy"
- [ ] Wait for build to complete
- [ ] Check deployment logs for errors

### Initialize Database
```bash
# Pull production env vars
vercel env pull .env.production

# Push database schema
DATABASE_URL=$(grep DATABASE_URL .env.production | cut -d '=' -f2) npm run db:push
```

Or manually:
```bash
# Set DATABASE_URL to production database
DATABASE_URL=your_production_url npm run db:push
```

### Post-Deployment
- [ ] Visit deployment URL
- [ ] Test all major features:
  - [ ] Custom mode (simple & progression)
  - [ ] Sleep programs
  - [ ] Learning mode
  - [ ] Community library
  - [ ] Audio players
- [ ] Check browser console for errors
- [ ] Test on mobile devices
- [ ] Verify PWA installation works

## 📱 PWA Configuration

- [ ] Verify manifest.webmanifest is correct
- [ ] Add app icons (192x192, 512x512)
- [ ] Test "Add to Home Screen"
- [ ] Verify service worker caches properly

## 🔧 Optional Enhancements

### Custom Domain
- [ ] Add custom domain in Vercel
- [ ] Configure DNS settings
- [ ] Enable SSL (automatic with Vercel)

### Monitoring
- [ ] Enable Vercel Analytics
- [ ] Set up error tracking (Sentry, LogRocket, etc.)
- [ ] Monitor OpenAI API usage

### Performance
- [ ] Run Lighthouse audit
- [ ] Optimize images
- [ ] Check bundle size
- [ ] Enable compression

### SEO
- [ ] Add meta tags
- [ ] Create sitemap
- [ ] Add robots.txt
- [ ] Submit to search engines

## 📊 Post-Launch

### Community
- [ ] Share on social media
- [ ] Post in relevant communities
- [ ] Create demo video
- [ ] Write launch blog post

### Maintenance
- [ ] Set up dependency updates (Dependabot)
- [ ] Monitor GitHub issues
- [ ] Review pull requests
- [ ] Update documentation

### Security
- [ ] Run `npm audit` regularly
- [ ] Keep dependencies updated
- [ ] Monitor security advisories
- [ ] Review access logs

## 🆘 Troubleshooting

### Build Fails
1. Check Vercel build logs
2. Run `npm run build` locally
3. Verify all dependencies are in package.json
4. Check Node.js version compatibility

### Database Connection Issues
1. Verify DATABASE_URL format
2. Check database firewall rules
3. Test connection string locally
4. Ensure database is running

### Runtime Errors
1. Check Vercel function logs
2. Verify environment variables
3. Check OpenAI API quota
4. Review error stack traces

## ✨ You're Ready!

Once all items are checked, your app is ready for production use!

**Final Steps:**
```bash
# Verify everything works
npm run typecheck
npm run lint
npm run build

# Push to GitHub
git add .
git commit -m "Ready for production"
git push origin main
```

**Deployment will happen automatically via GitHub Actions!**

---

Need help? Check [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions.
