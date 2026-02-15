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

      // NOTE: No filter here — Supabase only sends user_id on DELETE events,
      // so a filter of user_id=eq.X silently drops cross-tab DELETE events.
      // Instead we listen to all events and handle each type manually.
      channel = supabase
        .channel('bookmarks-channel')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'bookmarks' },
          (payload) => {
            // Only add if it belongs to this user
            if (payload.new.user_id !== data.user.id) return
            setBookmarks((prev) => {
              // Avoid duplicates (in case this tab already added it optimistically)
              if (prev.find((b) => b.id === payload.new.id)) return prev
              return [payload.new, ...prev]
            })
          }
        )
        .on(
          'postgres_changes',
          { event: 'DELETE', schema: 'public', table: 'bookmarks' },
          (payload) => {
            // payload.old always has the id on DELETE — works reliably cross-tab
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

  // FIX 1: Optimistically remove from local state immediately, then delete from DB
  const handleDelete = async (id: string) => {
    const confirmDelete = confirm('Are you sure you want to delete this bookmark?')
    if (!confirmDelete) return

    setBookmarks((prev) => prev.filter((b) => b.id !== id))
    await supabase.from('bookmarks').delete().eq('id', id)
  }

  if (!user) return (
    <div style={styles.loadingScreen}>
      <div style={styles.spinner} />
    </div>
  )

  return (
    <div style={styles.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700&family=DM+Sans:wght@300;400;500&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        body { background: #f5f3ef; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .bookmark-card {
          animation: fadeUp 0.35s ease both;
        }

        .bookmark-card:nth-child(1)  { animation-delay: 0.05s; }
        .bookmark-card:nth-child(2)  { animation-delay: 0.10s; }
        .bookmark-card:nth-child(3)  { animation-delay: 0.15s; }
        .bookmark-card:nth-child(4)  { animation-delay: 0.20s; }
        .bookmark-card:nth-child(5)  { animation-delay: 0.25s; }

        .input-field:focus {
          outline: none;
          border-color: #1a1a1a !important;
          box-shadow: 0 0 0 3px rgba(26,26,26,0.08);
        }

        .add-btn:hover {
          background: #2d2d2d !important;
          transform: translateY(-1px);
          box-shadow: 0 4px 16px rgba(0,0,0,0.18);
        }

        .add-btn:active { transform: translateY(0); }

        .logout-btn:hover {
          background: #f0ede8 !important;
          color: #1a1a1a !important;
        }

        .delete-btn:hover {
          color: #c0392b !important;
          background: #fef0ef !important;
        }

        .bookmark-link:hover { color: #0052cc !important; }

        .favicon {
          width: 18px;
          height: 18px;
          border-radius: 4px;
          object-fit: contain;
          background: #eee;
          flex-shrink: 0;
        }

        /* FIX 2: Mobile — stack card rows, hide email, fix overflow */
        @media (max-width: 500px) {
          .bookmark-card-inner {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 10px !important;
          }

          .delete-btn-wrap {
            align-self: flex-end;
          }

          .email-badge {
            display: none !important;
          }
        }
      `}</style>

      {/* Navbar */}
      <nav style={styles.nav}>
        <div style={styles.navInner}>
          <div style={styles.brand}>
            <div style={styles.brandDot} />
            <span style={styles.brandName}>Smart Bookmark</span>
          </div>

          <div style={styles.navRight}>
            <span className="email-badge" style={styles.emailBadge}>{user.email}</span>
            <button
              className="logout-btn"
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

      {/* Main */}
      <main style={styles.main}>

        {/* Add Bookmark Card */}
        <section style={styles.addCard}>
          <p style={styles.addLabel}>NEW BOOKMARK</p>
          <h2 style={styles.addHeading}>Save a link</h2>

          <div style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Title</label>
              <input
                className="input-field"
                type="text"
                placeholder="e.g. Stripe Docs"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={styles.input}
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>URL</label>
              <input
                className="input-field"
                type="text"
                placeholder="https://"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                style={styles.input}
              />
            </div>

            <button
              className="add-btn"
              onClick={handleAddBookmark}
              style={styles.addBtn}
            >
              Add Bookmark →
            </button>
          </div>
        </section>

        {/* Bookmarks List */}
        <section style={styles.listSection}>
          <div style={styles.listHeader}>
            <h2 style={styles.listHeading}>My Bookmarks</h2>
            <span style={styles.countBadge}>{bookmarks.length}</span>
          </div>

          {bookmarks.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>🔖</div>
              <p style={styles.emptyText}>No bookmarks yet.</p>
              <p style={styles.emptySubtext}>Add your first link above to get started.</p>
            </div>
          ) : (
            <div style={styles.bookmarkList}>
              {bookmarks.map((bookmark) => {
                let hostname = ''
                try { hostname = new URL(bookmark.url).hostname } catch {}

                return (
                  <div
                    key={bookmark.id}
                    className="bookmark-card"
                    style={styles.bookmarkCard}
                  >
                    {/* FIX 2: className used for responsive stacking via media query */}
                    <div className="bookmark-card-inner" style={styles.bookmarkCardInner}>

                      <div style={styles.cardLeft}>
                        {hostname && (
                          <img
                            className="favicon"
                            src={`https://www.google.com/s2/favicons?domain=${hostname}&sz=32`}
                            alt=""
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                          />
                        )}
                        {/* FIX 2: cardText has minWidth:0 so truncation works in flex */}
                        <div style={styles.cardText}>
                          <p style={styles.bookmarkTitle}>{bookmark.title}</p>
                          <a
                            className="bookmark-link"
                            href={bookmark.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={styles.bookmarkUrl}
                          >
                            {bookmark.url}
                          </a>
                        </div>
                      </div>

                      {/* FIX 1: onClick now calls handleDelete for instant removal */}
                      <div className="delete-btn-wrap">
                        <button
                          className="delete-btn"
                          onClick={() => handleDelete(bookmark.id)}
                          style={styles.deleteBtn}
                        >
                          Delete
                        </button>
                      </div>

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

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: '#f5f3ef',
    fontFamily: "'DM Sans', sans-serif",
  },

  loadingScreen: {
    height: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#f5f3ef',
  },

  spinner: {
    width: 32,
    height: 32,
    border: '2.5px solid #e0ddd8',
    borderTop: '2.5px solid #1a1a1a',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },

  nav: {
    background: '#f5f3ef',
    borderBottom: '1px solid #e8e5e0',
    position: 'sticky' as const,
    top: 0,
    zIndex: 50,
  },

  navInner: {
    maxWidth: 760,
    margin: '0 auto',
    padding: '0 24px',
    height: 60,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },

  brandDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: '#1a1a1a',
  },

  brandName: {
    fontFamily: "'Syne', sans-serif",
    fontSize: 16,
    fontWeight: 700,
    color: '#1a1a1a',
    letterSpacing: '-0.02em',
  },

  navRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },

  emailBadge: {
    fontSize: 12,
    color: '#888',
    fontWeight: 400,
    letterSpacing: '0.01em',
  },

  logoutBtn: {
    fontSize: 13,
    fontWeight: 500,
    color: '#555',
    background: 'transparent',
    border: '1px solid #ddd8d0',
    borderRadius: 8,
    padding: '6px 14px',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    fontFamily: "'DM Sans', sans-serif",
  },

  main: {
    maxWidth: 760,
    margin: '0 auto',
    padding: '48px 24px 80px',
  },

  addCard: {
    background: '#1a1a1a',
    borderRadius: 20,
    padding: '36px 40px',
    marginBottom: 40,
    animation: 'fadeUp 0.4s ease both',
  },

  addLabel: {
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: '0.12em',
    color: '#888',
    marginBottom: 6,
  },

  addHeading: {
    fontFamily: "'Syne', sans-serif",
    fontSize: 24,
    fontWeight: 700,
    color: '#ffffff',
    letterSpacing: '-0.03em',
    marginBottom: 28,
  },

  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 16,
  },

  inputGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 6,
  },

  label: {
    fontSize: 11,
    fontWeight: 500,
    color: '#777',
    letterSpacing: '0.06em',
    textTransform: 'uppercase' as const,
  },

  input: {
    background: '#242424',
    border: '1px solid #333',
    borderRadius: 10,
    padding: '12px 16px',
    fontSize: 14,
    color: '#f0ede8',
    fontFamily: "'DM Sans', sans-serif",
    transition: 'all 0.15s ease',
    width: '100%',
  },

  addBtn: {
    marginTop: 8,
    alignSelf: 'flex-start' as const,
    background: '#f5f3ef',
    color: '#1a1a1a',
    border: 'none',
    borderRadius: 10,
    padding: '12px 24px',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: "'DM Sans', sans-serif",
    transition: 'all 0.18s ease',
    letterSpacing: '-0.01em',
  },

  listSection: {
    animation: 'fadeUp 0.45s ease both',
    animationDelay: '0.05s',
  },

  listHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },

  listHeading: {
    fontFamily: "'Syne', sans-serif",
    fontSize: 18,
    fontWeight: 700,
    color: '#1a1a1a',
    letterSpacing: '-0.02em',
  },

  countBadge: {
    background: '#e8e5e0',
    color: '#555',
    fontSize: 11,
    fontWeight: 600,
    borderRadius: 20,
    padding: '2px 9px',
    letterSpacing: '0.02em',
  },

  bookmarkList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 10,
  },

  bookmarkCard: {
    background: '#ffffff',
    border: '1px solid #ede9e3',
    borderRadius: 14,
    padding: '18px 20px',
    overflow: 'hidden', // FIX 2: contain content within card bounds
  },

  bookmarkCardInner: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    width: '100%',
  },

  cardLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    minWidth: 0,  // FIX 2: critical — lets flex item shrink below its content width
    flex: 1,
    overflow: 'hidden',
  },

  cardText: {
    minWidth: 0,  // FIX 2: critical — allows text children to truncate properly
    flex: 1,
    overflow: 'hidden',
  },

  bookmarkTitle: {
    fontSize: 14,
    fontWeight: 500,
    color: '#1a1a1a',
    marginBottom: 2,
    letterSpacing: '-0.01em',
    whiteSpace: 'nowrap' as const,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },

  bookmarkUrl: {
    fontSize: 12,
    color: '#999',
    textDecoration: 'none',
    transition: 'color 0.15s ease',
    display: 'block',
    whiteSpace: 'nowrap' as const,
    overflow: 'hidden',
    textOverflow: 'ellipsis', // FIX 2: clips long URLs cleanly on all screen sizes
  },

  deleteBtn: {
    fontSize: 12,
    fontWeight: 500,
    color: '#bbb',
    background: 'transparent',
    border: 'none',
    borderRadius: 8,
    padding: '6px 10px',
    cursor: 'pointer',
    fontFamily: "'DM Sans', sans-serif",
    transition: 'all 0.15s ease',
    flexShrink: 0,
  },

  emptyState: {
    background: '#ffffff',
    border: '1px dashed #ddd8d0',
    borderRadius: 14,
    padding: '48px 24px',
    textAlign: 'center' as const,
  },

  emptyIcon: {
    fontSize: 32,
    marginBottom: 12,
  },

  emptyText: {
    fontSize: 15,
    fontWeight: 500,
    color: '#555',
    marginBottom: 4,
  },

  emptySubtext: {
    fontSize: 13,
    color: '#aaa',
  },
}