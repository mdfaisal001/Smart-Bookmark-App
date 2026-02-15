'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function Dashboard() {
  const router = useRouter()

  const [user, setUser] = useState<any>(null)
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [bookmarks, setBookmarks] = useState<any[]>([])

  const fetchBookmarks = async () => {
    const { data, error } = await supabase
      .from('bookmarks')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error) {
      setBookmarks(data || [])
    }
  }

  useEffect(() => {
    let channel: any

    const init = async () => {
      const { data } = await supabase.auth.getUser()

      if (!data.user) {
        router.push('/login')
        return
      }

      setUser(data.user)
      fetchBookmarks()

      channel = supabase
        .channel('bookmarks-channel')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'bookmarks' },
          (payload) => {
            if (payload.new.user_id !== data.user.id) return
            setBookmarks((prev) => {
              if (prev.find((b) => b.id === payload.new.id)) return prev
              return [payload.new, ...prev]
            })
          }
        )
        .on(
          'postgres_changes',
          { event: 'DELETE', schema: 'public', table: 'bookmarks' },
          (payload) => {
            setBookmarks((prev) => prev.filter((b) => b.id !== payload.old.id))
          }
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'bookmarks' },
          (payload) => {
            if (payload.new.user_id !== data.user.id) return
            setBookmarks((prev) =>
              prev.map((b) => (b.id === payload.new.id ? payload.new : b))
            )
          }
        )
        .subscribe()
    }

    init()

    return () => {
      if (channel) supabase.removeChannel(channel)
    }
  }, [])

  const handleAddBookmark = async () => {
    if (!title || !url) {
      alert('Please fill all fields')
      return
    }

    const { error } = await supabase.from('bookmarks').insert([
      { user_id: user.id, title, url }
    ])

    if (!error) {
      setTitle('')
      setUrl('')
    }
  }

  const handleDelete = async (id: string) => {
    const confirmDelete = confirm('Are you sure you want to delete this bookmark?')
    if (!confirmDelete) return

    setBookmarks((prev) => prev.filter((b) => b.id !== id))
    await supabase.from('bookmarks').delete().eq('id', id)
  }

  if (!user) return (
    <div className="h-screen flex items-center justify-center bg-stone-50">
      <div className="w-8 h-8 rounded-full border-2 border-stone-200 border-t-stone-800 animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-stone-50">

      {/* Navbar */}
      <nav className="bg-stone-50 border-b border-stone-200 sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-6 h-[60px] flex items-center justify-between">

          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-stone-900" />
            <span className="text-base font-bold tracking-tight text-stone-900">
              Smart Bookmark
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-stone-400 hidden sm:block truncate max-w-[180px]">
              {user.email}
            </span>
            <button
              onClick={async () => {
                await supabase.auth.signOut()
                router.push('/login')
              }}
              className="text-sm font-medium text-stone-500 border border-stone-300 rounded-lg px-4 py-1.5 hover:bg-stone-100 hover:text-stone-900 transition-colors"
            >
              Sign out
            </button>
          </div>

        </div>
      </nav>

      {/* Main */}
      <main className="max-w-3xl mx-auto px-6 py-12 pb-20">

        {/* Add Bookmark Card */}
        <section className="bg-stone-900 rounded-2xl p-8 mb-10">

          <p className="text-[10px] font-semibold tracking-widest text-stone-500 uppercase mb-1.5">
            New Bookmark
          </p>
          <h2 className="text-2xl font-bold tracking-tight text-white mb-7">
            Save a link
          </h2>

          <div className="flex flex-col gap-4">

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-medium text-stone-500 uppercase tracking-widest">
                Title
              </label>
              <input
                type="text"
                placeholder="e.g. Stripe Docs"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-stone-800 border border-stone-700 rounded-xl px-4 py-3 text-sm text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-stone-500 focus:ring-2 focus:ring-stone-500/20 transition-all"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-medium text-stone-500 uppercase tracking-widest">
                URL
              </label>
              <input
                type="text"
                placeholder="https://"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full bg-stone-800 border border-stone-700 rounded-xl px-4 py-3 text-sm text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-stone-500 focus:ring-2 focus:ring-stone-500/20 transition-all"
              />
            </div>

            <button
              onClick={handleAddBookmark}
              className="self-start mt-1 bg-stone-50 text-stone-900 text-sm font-semibold px-6 py-3 rounded-xl hover:bg-white hover:-translate-y-px hover:shadow-md transition-all active:translate-y-0"
            >
              Add Bookmark →
            </button>

          </div>
        </section>

        {/* Bookmarks List */}
        <section>

          <div className="flex items-center gap-2.5 mb-5">
            <h2 className="text-lg font-bold tracking-tight text-stone-900">
              My Bookmarks
            </h2>
            <span className="bg-stone-200 text-stone-500 text-[11px] font-semibold rounded-full px-2.5 py-0.5">
              {bookmarks.length}
            </span>
          </div>

          {bookmarks.length === 0 ? (
            <div className="bg-white border border-dashed border-stone-300 rounded-2xl p-12 text-center">
              <div className="text-3xl mb-3">🔖</div>
              <p className="text-sm font-medium text-stone-500 mb-1">No bookmarks yet.</p>
              <p className="text-xs text-stone-400">Add your first link above to get started.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {bookmarks.map((bookmark) => {
                let hostname = ''
                try { hostname = new URL(bookmark.url).hostname } catch {}

                return (
                  <div
                    key={bookmark.id}
                    className="bg-white border border-stone-100 rounded-2xl px-5 py-4 overflow-hidden"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">

                      <div className="flex items-center gap-3 min-w-0 flex-1 overflow-hidden">
                        {hostname && (
                          <img
                            src={`https://www.google.com/s2/favicons?domain=${hostname}&sz=32`}
                            alt=""
                            className="w-[18px] h-[18px] rounded object-contain bg-stone-100 shrink-0"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                          />
                        )}
                        <div className="min-w-0 flex-1 overflow-hidden">
                          <p className="text-sm font-medium text-stone-900 truncate">
                            {bookmark.title}
                          </p>
                          <a
                            href={bookmark.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-stone-400 hover:text-blue-600 transition-colors block truncate"
                          >
                            {bookmark.url}
                          </a>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDelete(bookmark.id)}
                        className="self-end sm:self-auto text-xs font-medium text-stone-300 hover:text-red-500 hover:bg-red-50 rounded-lg px-2.5 py-1.5 transition-all shrink-0"
                      >
                        Delete
                      </button>

                    </div>
                  </div>
                )
              })}
            </div>
          )}

        </section>

      </main>
    </div>
  )
}