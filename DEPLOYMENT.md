# Deployment Guide for QuizGenius

This guide will help you deploy your QuizGenius application from GitHub to various platforms.

## Option 1: Railway.app (Recommended for Full-Stack)

Railway is an excellent platform for deploying full-stack applications with both frontend and backend components.

### Steps to Deploy on Railway:

1. **Create a Railway Account**:
   - Go to [Railway](https://railway.app/) and sign up using your GitHub account
   - This allows Railway to access your repositories

2. **Create a New Project**:
   - Click on "New Project" in the Railway dashboard
   - Select "Deploy from GitHub repo"
   - Find and select your "Abdullah-s-repo" repository

3. **Configure Environment Variables**:
   - In your Railway project settings, add the following environment variables:
     - `NODE_ENV`: `production`
     - `PORT`: `5000` (or let Railway assign a port)
     - `GEMINI_API_KEY`: Your Google Gemini API key
     - `DATABASE_URL`: Railway will automatically provide this if you add a PostgreSQL database

4. **Add a Database**:
   - Click "New" and add a PostgreSQL database to your project
   - Railway will automatically set up the database and provide the connection string

5. **Deploy Your Application**:
   - Railway will automatically detect your Node.js application
   - It will run the build command from your package.json and then start the server

6. **Access Your Deployed Application**:
   - Railway will provide a URL for your deployed application
   - You can set up a custom domain in the settings if desired

## Option 2: Vercel (Good for Frontend-Heavy Apps)

Vercel is excellent for React applications but requires some configuration for the backend.

### Steps to Deploy on Vercel:

1. **Sign up for Vercel**:
   - Go to [Vercel](https://vercel.com/) and sign up using your GitHub account

2. **Import Your Repository**:
   - Click "Add New" → "Project"
   - Find and select your repository

3. **Configure Your Project**:
   - Set the Framework Preset to "Other" (since this is a custom setup)
   - In the Build and Output Settings:
     - Build Command: `npm run build`
     - Output Directory: `dist/public`
   - Add your environment variables (GEMINI_API_KEY, etc.)

4. **Create Vercel.json Configuration**:
   - Add a `vercel.json` file to your repository root with the following content:
   ```json
   {
     "version": 2,
     "builds": [
       { "src": "server/index.ts", "use": "@vercel/node" },
       { "src": "package.json", "use": "@vercel/static-build", "config": { "distDir": "dist/public" } }
     ],
     "routes": [
       { "src": "/api/(.*)", "dest": "server/index.ts" },
       { "src": "/(.*)", "dest": "dist/public/$1" }
     ]
   }
   ```

5. **Deploy Your Application**:
   - Click "Deploy" to start the deployment process
   - Vercel will build and deploy your application

## Option 3: Render.com (Good Alternative for Full-Stack)

Render is another platform that handles full-stack applications well.

### Steps to Deploy on Render:

1. **Create a Render Account**:
   - Go to [Render](https://render.com/) and sign up

2. **Set Up a New Web Service**:
   - Click "New" → "Web Service"
   - Connect your GitHub repository

3. **Configure Your Service**:
   - Name: "QuizGenius"
   - Environment: "Node"
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
   - Add your environment variables

4. **Add a Database** (optional):
   - Create a PostgreSQL database in Render
   - Connect it to your web service

5. **Deploy Your Application**:
   - Click "Create Web Service" to deploy your application

## Important Notes

- **Environment Variables**: Always ensure your deployment platform has all necessary environment variables set up
- **Database Migration**: If using a database, you may need to run migrations on the first deploy
- **API Keys**: Keep your API keys secure and never commit them to your repository
- **Custom Domains**: All platforms mentioned above support custom domains if you want to use your own domain name