# Deployment Guide

## Deploying to Vercel

### Prerequisites
- GitHub account
- Vercel account (free tier works)
- PostgreSQL database (use Vercel Postgres, Supabase, or Neon)

### Step-by-Step Deployment

#### 1. Prepare Your Repository

```bash
# Ensure all changes are committed
git add .
git commit -m "Prepare for deployment"
git push origin main
```

#### 2. Set Up Database

**Option A: Vercel Postgres**
1. Go to Vercel dashboard
2. Create new Postgres database
3. Copy the connection string

**Option B: Supabase (Recommended)**
1. Go to https://supabase.com
2. Create new project
3. Go to Project Settings → Database
4. Copy the connection string (use "Connection pooling" mode)

**Option C: Neon**
1. Go to https://neon.tech
2. Create new project
3. Copy the connection string

#### 3. Deploy to Vercel

**Via Vercel Dashboard:**

1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Configure project:
   - **Framework Preset:** Other
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`

4. Add Environment Variables:
   ```
   DATABASE_URL=your_postgres_connection_string
   SESSION_SECRET=your_secure_random_string_here
   OPENAI_API_KEY=sk-your-openai-api-key
   NODE_ENV=production
   ```

5. Click **Deploy**

**Via Vercel CLI:**

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

#### 4. Initialize Database

After first deployment:

```bash
# Install dependencies locally
npm install

# Set DATABASE_URL in .env to your production database
DATABASE_URL=your_production_db_url npm run db:push
```

Or use Vercel CLI:
```bash
vercel env pull .env.production
DATABASE_URL=$(grep DATABASE_URL .env.production | cut -d '=' -f2) npm run db:push
```

#### 5. Configure Custom Domain (Optional)

1. Go to your Vercel project settings
2. Navigate to **Domains**
3. Add your custom domain
4. Follow DNS configuration instructions

### Environment Variables Reference

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `SESSION_SECRET` | Secure random string (32+ chars) | Yes |
| `OPENAI_API_KEY` | OpenAI API key for TTS/translation | Yes |
| `NODE_ENV` | Set to `production` | Yes |

### Post-Deployment

#### Test Your Deployment
1. Visit your Vercel URL
2. Test binaural beat generation
3. Check community library features
4. Test TTS/language learning features

#### Monitor Performance
- Check Vercel Analytics
- Monitor function execution times
- Watch for errors in Vercel logs

#### Set Up Continuous Deployment

GitHub Actions will automatically deploy on push to `main` branch.

To set up:
1. Get Vercel token: https://vercel.com/account/tokens
2. Add GitHub secrets:
   - `VERCEL_TOKEN`
   - `VERCEL_ORG_ID` (from Vercel project settings)
   - `VERCEL_PROJECT_ID` (from Vercel project settings)

### Troubleshooting

**Build Failures:**
- Check build logs in Vercel dashboard
- Verify all environment variables are set
- Ensure `npm run build` works locally

**Database Connection Issues:**
- Verify `DATABASE_URL` is correct
- Check if database allows connections from Vercel IPs
- For Supabase, use connection pooling mode

**OpenAI API Errors:**
- Verify `OPENAI_API_KEY` is valid
- Check API usage limits
- Ensure billing is enabled on OpenAI account

**Session Issues:**
- Ensure `SESSION_SECRET` is set
- Check if database has `sessions` table
- Run `db:push` if tables are missing

### Scaling Considerations

**Free Tier Limits:**
- Vercel: 100GB bandwidth/month
- Vercel Functions: 100GB-hours/month
- Database: Depends on provider

**Optimization Tips:**
- Enable Vercel Edge Network
- Use connection pooling for database
- Monitor OpenAI API costs
- Consider caching for community library

### Alternative Deployment Options

#### Netlify
Similar to Vercel, requires adapter changes

#### Railway
```bash
railway login
railway init
railway up
```

#### Self-Hosted (VPS/Docker)
```bash
npm run build
NODE_ENV=production node dist/index.cjs
```

### Support

- Vercel Docs: https://vercel.com/docs
- GitHub Issues: For app-specific problems
- Vercel Support: For platform issues

---

Happy deploying! 🚀
