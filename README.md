## 1) PROJECT TYPE & TOOLS

| Item | Value
|-----|-----
| **Framework** | **Next.js 16** (App Router)
| **Package Manager** | **pnpm** (confirmed by `pnpm-lock.yaml`)
| **Node Version** | **Node 20.x LTS** (required for Next.js 16)
| **Language** | TypeScript 5.x
| **Styling** | Tailwind CSS 4.x with PostCSS
| **UI Library** | Shadcn/ui (Radix UI primitives)


---

## 2) DEPENDENCIES AND VERSIONS

### Core Dependencies (dependencies):

| Package | Version | Type
|-----|-----
| react | 19.2.0 | dependency
| react-dom | 19.2.0 | dependency
| next | 16.0.10 | dependency
| typescript | ^5 | devDependency


### AI & Data:

| Package | Version | Type
|-----|-----
| ai | 6.0.27 | dependency
| @ai-sdk/react | 3.0.29 | dependency
| jspdf | 4.0.0 | dependency
| zod | 3.25.76 | dependency


### Styling:

| Package | Version | Type
|-----|-----
| tailwindcss | ^4.1.9 | devDependency
| @tailwindcss/postcss | ^4.1.9 | devDependency
| tailwind-merge | ^3.3.1 | dependency
| tailwindcss-animate | ^1.0.7 | dependency
| tw-animate-css | 1.3.3 | devDependency
| class-variance-authority | ^0.7.1 | dependency
| clsx | ^2.1.1 | dependency


### UI Components (Radix UI / Shadcn):

| Package | Version
|-----|-----
| @radix-ui/react-dialog | 1.1.4
| @radix-ui/react-tabs | 1.1.2
| @radix-ui/react-accordion | 1.2.2
| @radix-ui/react-alert-dialog | 1.1.4
| @radix-ui/react-slider | 1.2.2
| @radix-ui/react-switch | 1.1.2
| @radix-ui/react-progress | 1.1.1
| @radix-ui/react-toast | 1.2.4
| (and 15+ more Radix components) | -


### Utilities:

| Package | Version | Type
|-----|-----
| lucide-react | ^0.454.0 | dependency
| date-fns | 4.1.0 | dependency
| react-hook-form | ^7.60.0 | dependency
| @hookform/resolvers | ^3.10.0 | dependency
| recharts | 2.15.4 | dependency
| sonner | ^1.7.4 | dependency
| next-themes | ^0.4.6 | dependency
| vaul | ^1.1.2 | dependency
| cmdk | 1.0.4 | dependency


---

## 3) STEP-BY-STEP TO RUN LOCALLY (for beginners)

### Step 0 - Install Node.js

1. Go to [https://nodejs.org](https://nodejs.org)
2. Download **Node.js 20.x LTS** (the green button)
3. Run the installer, click Next through all steps
4. Restart your computer after installation


### Step 1 - Install pnpm (Package Manager)

Open **Command Prompt** or **PowerShell** and run:

```shellscript
npm install -g pnpm
```

Verify it installed:

```shellscript
pnpm --version
```

You should see a version number like `9.x.x`

### Step 2 - Extract and Open Project

1. Extract the ZIP file to a folder (example: `C:\Projects\safeher-ai`)
2. Open **VS Code**
3. Go to File > Open Folder > Select your extracted folder


### Step 3 - Install Dependencies

Open the VS Code terminal (Ctrl + `) and run:

```shellscript
pnpm install
```

Wait for all packages to download (may take 1-3 minutes).

If you see peer dependency warnings, they are usually safe to ignore. If install fails, try:

```shellscript
pnpm install --no-strict-peer-dependencies
```

### Step 4 - Run the Development Server

```shellscript
pnpm dev
```

You should see output like:

```plaintext
▲ Next.js 16.0.10
- Local: http://localhost:3000
```

### Step 5 - Open in Browser

Open your browser and go to:

```plaintext
http://localhost:3000
```

You should see the **SafeHer AI** onboarding screen with the purple gradient background.

---

## 4) ENVIRONMENT VARIABLES SETUP

### Required Environment Variable:

Your app uses **one** environment variable for the Gemini AI API:

| Variable Name | Description
|-----|-----
| `GEMINI_API_KEY` | Your Google Gemini API key


### How to Set It Up:

**Option A - Create .env.local file (Recommended):**

1. In VS Code, create a new file in the **root folder** (same level as package.json)
2. Name it exactly: `.env.local`
3. Add this content:


```plaintext
GEMINI_API_KEY=your_gemini_api_key_here
```

4. Replace `your_gemini_api_key_here` with your actual key from [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)


**Option B - Use the in-app settings:**
The app also allows you to enter your API key in **Settings > AI Configuration** which stores it in localStorage (convenient for testing).

### Important Security Notes:

- **NEVER** commit `.env.local` to GitHub
- Add `.env.local` to your `.gitignore` file
- The `.env.local` file should already be in `.gitignore` by default in Next.js projects


---

## 5) BUILD & PRODUCTION COMMANDS

### Development:

```shellscript
pnpm dev
```

Runs on: `http://localhost:3000`

### Production Build:

```shellscript
pnpm build
```

This creates an optimized production build in the `.next/` folder.

### Start Production Server:

```shellscript
pnpm start
```

Runs the production build on `http://localhost:3000`

### Lint Code:

```shellscript
pnpm lint
```

Checks for code quality issues.

---

## 6) COMMON ERRORS AND HOW TO FIX THEM

### Error 1: "pnpm is not recognized"

**Cause:** pnpm not installed globally
**Fix:**

```shellscript
npm install -g pnpm
```

### Error 2: "Node version not supported" or build fails

**Cause:** Wrong Node.js version
**Fix:** Install Node.js 20.x LTS from [https://nodejs.org](https://nodejs.org)

Check your version:

```shellscript
node --version
```

Should show `v20.x.x` or higher.

### Error 3: "GEMINI_API_KEY is undefined" or AI chat doesn't work

**Cause:** Missing environment variable
**Fix:**

1. Create `.env.local` file in root folder
2. Add: `GEMINI_API_KEY=your_key_here`
3. **Restart the dev server** (Ctrl+C, then `pnpm dev` again)


### Error 4: "Module not found" errors

**Cause:** Dependencies not installed properly
**Fix:**

```shellscript
pnpm install --force
```

### Error 5: Port 3000 already in use

**Cause:** Another app is using port 3000
**Fix:** Either close the other app, or run on a different port:

```shellscript
pnpm dev -p 3001
```

Then open `http://localhost:3001`

### Error 6: "EACCES permission denied" (mostly on Mac/Linux)

**Cause:** Permission issues
**Fix:**

```shellscript
sudo chown -R $(whoami) ~/.pnpm-store
```

---

## Quick Reference Card

| Action | Command
|-----|-----
| Install dependencies | `pnpm install`
| Run development | `pnpm dev`
| Build for production | `pnpm build`
| Start production | `pnpm start`
| Check code quality | `pnpm lint`


| URL | Purpose
|-----|-----
| [http://localhost:3000](http://localhost:3000) | Your app (development)
| [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey) | Get Gemini API key
