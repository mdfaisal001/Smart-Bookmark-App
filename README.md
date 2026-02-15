# 📌 Smart Bookmark App

A modern full-stack bookmark manager built using **Next.js (App Router)** and **Supabase**, featuring secure authentication and real-time updates.

🔗 Live Demo: (https://smart-bookmark-app-ochre-five.vercel.app/)
📂 GitHub Repo: https://github.com/mdfaisal001/Smart-Bookmark-App

---

## 🚀 Features

- 🔐 Google OAuth Authentication (Supabase Auth)
- ➕ Add bookmarks (Title + URL)
- 🗑 Delete bookmarks with confirmation
- 👤 User-specific private data (Row Level Security enabled)
- ⚡ Real-time updates across multiple tabs
- 🎨 Clean SaaS-style responsive UI
- 🚀 Deployed on Vercel

---

## 🧠 Tech Stack

- **Frontend:** Next.js 16 (App Router)
- **Backend:** Supabase (PostgreSQL + Auth + Realtime)
- **Styling:** Tailwind CSS
- **Deployment:** Vercel

---

## 🔒 Security

Row Level Security (RLS) is enabled on the `bookmarks` table.

Policies ensure:

- Users can only read their own bookmarks
- Users can only insert their own bookmarks
- Users can only delete their own bookmarks

All queries are protected using:

```
auth.uid() = user_id
```

---

## ⚡ Real-Time Functionality

The application subscribes to database changes using Supabase Realtime.

Whenever a bookmark is:

- Inserted
- Deleted
- Updated

All open tabs update automatically without refreshing the page.

---

## 🗄 Database Schema

Table: `bookmarks`

| Column     | Type        | Description                   |
| ---------- | ----------- | ----------------------------- |
| id         | uuid        | Primary Key                   |
| user_id    | uuid        | References authenticated user |
| title      | text        | Bookmark title                |
| url        | text        | Bookmark URL                  |
| created_at | timestamptz | Timestamp of creation         |

---

## 🛠 Local Setup

### 1️⃣ Clone Repository

```bash
git clone https://github.com/your-username/smart-bookmark-app.git
cd smart-bookmark-app
```

---

### 2️⃣ Install Dependencies

```bash
npm install
```

---

### 3️⃣ Setup Environment Variables

Create a file:

```
.env.local
```

Add:

```
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

You can find these in:

Supabase → Settings → API

---

### 4️⃣ Run Development Server

```bash
npm run dev
```

Open:

```
http://localhost:3000
```

---

## 🌍 Deployment

The application is deployed using **Vercel**.

Environment variables are configured in Vercel project settings.

Supabase production URLs are updated under:

Authentication → URL Configuration

---

## 📦 Project Structure

```
app/
  login/
  dashboard/
lib/
  supabaseClient.ts
```

- `login` → Handles Google OAuth authentication
- `dashboard` → Bookmark management interface
- `supabaseClient.ts` → Supabase client configuration

---

## 🎯 Key Implementation Highlights

- Secure multi-user data isolation using Row Level Security
- Production-safe OAuth redirect handling
- Real-time database synchronization
- Clean and minimal SaaS-style UI
- Proper Git workflow and environment configuration

---

## 🧩 Future Improvements

- Edit bookmark feature
- Search/filter functionality
- Bookmark categorization
- Pagination for large datasets
- Dark mode support

---

## Challenges Faced & How I Solved Them

### 1. Google OAuth Not Redirecting in Production

**Problem:**  
After deploying to Vercel, Google login was not redirecting correctly.

**Cause:**  
The production domain was not added in Supabase Authentication → URL Configuration.

**Solution:**  
Added:

- Site URL → https://smart-bookmark-app-ochre-five.vercel.app
- Redirect URL → https://smart-bookmark-app-ochre-five.vercel.app/dashboard

This fixed the OAuth redirect flow.

---

### 2. supabaseUrl is required Error

**Problem:**  
App crashed locally with "supabaseUrl is required".

**Cause:**  
Environment variables were not loaded correctly.

**Solution:**  
Added `.env.local` file at project root and restarted the development server.

---

### 3. Row Level Security Blocking Queries

**Problem:**  
Inserts and selects were failing silently.

**Cause:**  
RLS was enabled but policies were not configured properly.

**Solution:**  
Created policies:

- SELECT → user_id = auth.uid()
- INSERT → user_id = auth.uid()
- DELETE → user_id = auth.uid()

This ensured bookmarks remain private per user.

---

### 4. Realtime Not Updating Across Tabs

**Problem:**  
Bookmarks did not update automatically in another tab.

**Cause:**  
Table was not added to Supabase Realtime publication.

**Solution:**  
Enabled Realtime for `bookmarks` table and added a postgres_changes subscription filtered by user_id.

---

### 5. Delete Not Updating UI Instantly

**Problem:**  
Deleted bookmark disappeared only after refresh.

**Solution:**  
Implemented optimistic UI update using:

```js
setBookmarks((prev) => prev.filter((b) => b.id !== bookmark.id));
```

This improved user experience.

## 👨‍💻 Author

Mohammed Faisal
