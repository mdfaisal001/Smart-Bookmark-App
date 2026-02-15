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
    const { data } = await supabase
      .from('bookmarks')
      .select('*')
      .order('created_at', { ascending: false })

    setBookmarks(data || [])
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
          {
            event: '*',
            schema: 'public',
            table: 'bookmarks',
            filter: `user_id=eq.${data.user.id}`
          },
          () => {
            fetchBookmarks()
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
      {
        user_id: user.id,
        title,
        url
      }
    ])

    if (!error) {
      setTitle('')
      setUrl('')
    }
  }

  if (!user) {
    return (
      <div style={styles.loadingScreen}>
        <div style={styles.spinner} />
      </div>
    )
  }

  return (
    <div style={styles.page}>
      <nav style={styles.nav}>
        <div style={styles.navInner}>
          <div style={styles.brand}>
            <div style={styles.brandDot} />
            <span style={styles.brandName}>Smart Bookmark</span>
          </div>

          <div style={styles.navRight}>
            <span style={styles.emailBadge}>{user.email}</span>
            <button
              onClick={async () => {
                await supabase.auth.signOut()
                router.push('/login')
              }}
              style={styles.logoutBtn}
            >
              Sign out
            </button>
          </div>
        </div>
      </nav>

      <main style={styles.main}>

        {/* Add Bookmark */}
        <section style={styles.addCard}>
          <h2 style={styles.addHeading}>Save a link</h2>

          <input
            type="text"
            placeholder="Bookmark title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={styles.input}
          />

          <input
            type="text"
            placeholder="https://"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            style={styles.input}
          />

          <button onClick={handleAddBookmark} style={styles.addBtn}>
            Add Bookmark
          </button>
        </section>

        {/* Bookmark List */}
        <section>
          <h2 style={styles.listHeading}>
            My Bookmarks ({bookmarks.length})
          </h2>

          {bookmarks.map((bookmark) => {
            let hostname = ''
            try {
              hostname = new URL(bookmark.url).hostname
            } catch {}

            return (
              <div key={bookmark.id} style={styles.bookmarkCard}>
                <div style={styles.cardLeft}>
                  {hostname && (
                    <img
                      src={`https://www.google.com/s2/favicons?domain=${hostname}&sz=32`}
                      style={styles.favicon}
                      alt=""
                    />
                  )}

                  <div style={styles.textContainer}>
                    <p style={styles.bookmarkTitle}>{bookmark.title}</p>
                    <a
                      href={bookmark.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={styles.bookmarkUrl}
                    >
                      {bookmark.url}
                    </a>
                  </div>
                </div>

                <button
                  style={styles.deleteBtn}
                  onClick={async () => {
                    const confirmDelete = confirm(
                      'Are you sure you want to delete this bookmark?'
                    )
                    if (!confirmDelete) return

                    // Optimistic UI update
                    setBookmarks((prev) =>
                      prev.filter((b) => b.id !== bookmark.id)
                    )

                    const { error } = await supabase
                      .from('bookmarks')
                      .delete()
                      .eq('id', bookmark.id)

                    if (error) {
                      alert('Error deleting bookmark')
                      fetchBookmarks()
                    }
                  }}
                >
                  Delete
                </button>
              </div>
            )
          })}
        </section>
      </main>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: '#f5f3ef',
    fontFamily: 'sans-serif',
  },

  loadingScreen: {
    height: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  spinner: {
    width: 30,
    height: 30,
    border: '3px solid #ddd',
    borderTop: '3px solid #000',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },

  nav: {
    borderBottom: '1px solid #e0e0e0',
    background: '#fff',
  },

  navInner: {
    maxWidth: 800,
    margin: '0 auto',
    padding: '16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },

  brandDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: '#000',
  },

  brandName: {
    fontWeight: 600,
  },

  navRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },

  emailBadge: {
    fontSize: 12,
    color: '#666',
  },

  logoutBtn: {
    padding: '6px 12px',
    border: '1px solid #ccc',
    background: 'white',
    borderRadius: 6,
    cursor: 'pointer',
  },

  main: {
    maxWidth: 800,
    margin: '40px auto',
    padding: '0 16px',
  },

  addCard: {
    background: '#000',
    color: '#fff',
    padding: 24,
    borderRadius: 16,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    marginBottom: 40,
  },

  addHeading: {
    fontSize: 20,
    marginBottom: 10,
  },

  input: {
    padding: 10,
    borderRadius: 8,
    border: '1px solid #333',
  },

  addBtn: {
    padding: 10,
    borderRadius: 8,
    border: 'none',
    background: '#fff',
    cursor: 'pointer',
    fontWeight: 600,
  },

  listHeading: {
    marginBottom: 20,
    fontSize: 18,
  },

  bookmarkCard: {
    background: '#fff',
    borderRadius: 12,
    padding: 16,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
    flexWrap: 'wrap',
  },

  cardLeft: {
    display: 'flex',
    gap: 10,
    flex: 1,
    minWidth: 0,
  },

  textContainer: {
    flex: 1,
    minWidth: 0,
  },

  bookmarkTitle: {
    fontWeight: 500,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },

  bookmarkUrl: {
    fontSize: 12,
    color: '#777',
    textDecoration: 'none',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: 'block',
  },

  deleteBtn: {
    padding: '6px 10px',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    color: '#c0392b',
    fontWeight: 500,
  },

  favicon: {
    width: 18,
    height: 18,
    borderRadius: 4,
    flexShrink: 0,
  },
}
