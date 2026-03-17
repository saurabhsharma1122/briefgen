# BriefGen 📋
**AI-powered client brief form generator. Built by Saurabh.**

Describe your role → AI generates a professional brief form → Share with client → Client fills it & downloads PDF.

---

## 🗂️ Project Structure

```
briefgen/
├── api/
│   └── generate.js      ← Serverless function (your API key lives here, safe)
├── public/
│   └── index.html       ← Full frontend
├── package.json
├── vercel.json
└── README.md
```

---

## 🚀 Deploy in 4 Steps

### Step 1 — Get your free OpenRouter API key
1. Go to **https://openrouter.ai** and sign up (free)
2. Go to **Keys** section → click **Create Key**
3. Copy the key — it looks like: `sk-or-v1-xxxxxxxxxxxx`
4. You get free credits on signup — enough for hundreds of forms

---

### Step 2 — Push to GitHub
1. Go to **https://github.com** → click **New repository**
2. Name it `briefgen` → click **Create repository**
3. Upload all 4 files maintaining this folder structure:
   ```
   api/generate.js
   public/index.html
   package.json
   vercel.json
   ```
   You can use GitHub's "Upload files" button or use Git

---

### Step 3 — Deploy to Vercel
1. Go to **https://vercel.com** → Sign up with GitHub (free)
2. Click **Add New Project** → Import your `briefgen` repo
3. Click **Deploy** (default settings are fine)
4. ✅ Your site is live! (something like `briefgen.vercel.app`)

---

### Step 4 — Add your API key (the important bit)
1. In Vercel dashboard → click your project → **Settings**
2. Click **Environment Variables** in the left sidebar
3. Add:
   - **Name:** `OPENROUTER_API_KEY`
   - **Value:** `sk-or-v1-your-key-here`
4. Click **Save**
5. Go to **Deployments** → click the 3 dots → **Redeploy**

**Done! Your site is now fully working. 🎉**

---

## 💡 How It Works

```
User visits your Vercel URL
        ↓
Types their role → clicks Generate
        ↓
Frontend calls /api/generate  (your serverless function)
        ↓
Serverless function uses your OpenRouter key (safe, never exposed)
        ↓
OpenRouter calls Llama 3 (free AI model)
        ↓
Returns JSON schema → form renders on screen
        ↓
Client fills form → clicks Download → gets PDF → sends it back to you
```

**Why is the key safe?**
The API key lives only in Vercel's environment variables — never in the HTML file. Users can't see it even if they view source.

---

## 🔧 Customisation

**Change the AI model** (in `api/generate.js`):
- `meta-llama/llama-3.3-8b-instruct:free` ← current (free)
- `mistralai/mistral-7b-instruct:free` ← alternative free model
- `anthropic/claude-haiku-4-5-20251001` ← better quality (costs a little)

**Add more example chips** — edit the `EX` object in `public/index.html`

---

## 🆓 Costs
- **Vercel hosting:** Free forever (Hobby plan)
- **OpenRouter:** Free credits on signup, then pay-per-use (very cheap — fractions of a cent per form)
- **GitHub:** Free

---

Built by **Saurabh** · Powered by OpenRouter + Llama 3 + Vercel
