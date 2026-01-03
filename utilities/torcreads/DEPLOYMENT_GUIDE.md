# Public Hosting Guide (Vercel)

Since your project is built with Vite and already has a `vercel.json` configuration, **Vercel** is the easiest and free way to host your site publicly.

## Option 1: GitHub Integration (Recommended)
This is the best way because every time you save your code and push to GitHub, your website updates automatically.

1.  **Push to GitHub**: If you haven't already, push your project to a GitHub repository.
2.  **Connect to Vercel**:
    - Go to [vercel.com](https://vercel.com) and sign in with GitHub.
    - Click **"Add New"** > **"Project"**.
    - Import your GitHub repository.
3.  **Configure Environment Variables** (IMPORTANT):
    - During setup, look for the **Environment Variables** section.
    - Add a new variable:
      - **KEY**: `VITE_GOOGLE_SCRIPT_URL`
      - **VALUE**: (Your Google Apps Script Web App URL)
4.  **Deploy**: Click **Deploy**. Vercel will give you a public URL (e.g., `your-project.vercel.app`).

## Option 2: Vercel CLI (Quickest)
If you already have Vercel CLI installed:

1.  **Deploy**:
    Run this command in the `utilities/torcreads` folder:
    ```bash
    vercel --prod
    ```

## ⚠️ Important Note on Security
Since your Google Sheets script allows "Anyone" access, having the `VITE_GOOGLE_SCRIPT_URL` in your public website means someone could theoretically find the URL and read/write to your sheet if they know how to look. 

For a small community book club, this is usually fine, but never share the actual Google Sheet link itself with people you don't trust!
