# Supabase Setup Guide for BoardHub

To connect your application to a real Supabase database, follow these steps:

## 1. Create a Supabase Project
1. Go to [database.new](https://database.new) and sign in/sign up.
2. Create a new project named **BoardHub**.
3. Save your **Database Password** in a secure place.

## 2. Set up the Database Schema
1. In your Supabase Dashboard, go to the **SQL Editor** in the left sidebar.
2. Click **New Query**.
3. Open the file `supabase_setup.sql` located in your project's root directory.
4. Copy the entire content and paste it into the SQL Editor.
5. Click **Run**. You should see "Success. No rows returned."

## 3. Configure your Environment Variables
1. Go to **Project Settings** > **API**.
2. Find your **Project URL** and **anon (public) API Key**.
3. Create a file named `.env` in the root of your local project (same folder as `package.json`).
4. Paste the following and replace the values with your actual URL and Key:
   ```env
   VITE_SUPABASE_URL=your_project_url_here
   VITE_SUPABASE_ANON_KEY=your_anon_key_here
   ```

## 4. Verify Connection
1. Restart your development server (`npm run dev`).
2. The application is now ready to use Supabase instead of LocalStorage!

## Next Steps
- We will now proceed to migrate the `DataContext` to fetch and store data from Supabase.
- You can enable **Authentication** in Supabase to allow users to sign up and log in using their own emails.
