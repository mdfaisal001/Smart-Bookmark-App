'use client'

import { supabase } from '@/lib/supabaseClient'

export default function LoginPage() {

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`
      }
    })
  }

  return (
    <div style={styles.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700&family=DM+Sans:wght@300;400;500&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .login-card {
          animation: fadeUp 0.5s ease both;
        }

        .google-btn:hover {
          background: #f0ede8 !important;
          border-color: #bbb8b2 !important;
        }

        .google-btn:active {
          transform: scale(0.99);
        }
      `}</style>

      {/* Decorative lines */}
      <div style={styles.lineTop} />
      <div style={styles.lineBottom} />

      <div className="login-card" style={styles.card}>

        {/* Logo mark */}
        <div style={styles.logoMark}>
          <div style={styles.dot} />
          <div style={styles.dotSmall} />
        </div>

        <h1 style={styles.heading}>Smart Bookmark</h1>

        <p style={styles.subtext}>
          Save and manage your favorite links securely.
        </p>

        <div style={styles.divider} />

        <button
          className="google-btn"
          onClick={handleLogin}
          style={styles.googleBtn}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
            <path d="M3.964 10.707A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.96L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        <p style={styles.terms}>
          By continuing, you agree to our Terms & Privacy Policy.
        </p>

      </div>

      {/* Footer */}
      <p style={styles.footer}>© {new Date().getFullYear()} Smart Bookmark</p>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: '#f5f3ef',
    fontFamily: "'DM Sans', sans-serif",
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    position: 'relative',
    overflow: 'hidden',
  },

  lineTop: {
    position: 'absolute',
    top: 48,
    left: 0,
    right: 0,
    height: '1px',
    background: '#e5e1da',
  },

  lineBottom: {
    position: 'absolute',
    bottom: 48,
    left: 0,
    right: 0,
    height: '1px',
    background: '#e5e1da',
  },

  card: {
    background: '#ffffff',
    border: '1px solid #ebe7e0',
    borderRadius: 20,
    padding: '48px 40px 40px',
    width: '100%',
    maxWidth: 400,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
  },

  logoMark: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: 4,
    marginBottom: 20,
  },

  dot: {
    width: 12,
    height: 12,
    borderRadius: '50%',
    background: '#1a1a1a',
  },

  dotSmall: {
    width: 7,
    height: 7,
    borderRadius: '50%',
    background: '#c8c3bb',
    marginBottom: 1,
  },

  heading: {
    fontFamily: "'Syne', sans-serif",
    fontSize: 26,
    fontWeight: 700,
    color: '#1a1a1a',
    letterSpacing: '-0.03em',
    marginBottom: 8,
  },

  subtext: {
    fontSize: 14,
    color: '#999',
    fontWeight: 400,
    lineHeight: 1.6,
    maxWidth: 260,
  },

  divider: {
    width: '100%',
    height: '1px',
    background: '#ebe7e0',
    margin: '28px 0',
  },

  googleBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    width: '100%',
    background: '#f7f5f2',
    color: '#1a1a1a',
    border: '1px solid #ddd8d0',
    borderRadius: 12,
    padding: '13px 20px',
    fontSize: 14,
    fontWeight: 500,
    fontFamily: "'DM Sans', sans-serif",
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    letterSpacing: '-0.01em',
  },

  terms: {
    marginTop: 16,
    fontSize: 11,
    color: '#bbb',
    lineHeight: 1.6,
  },

  footer: {
    position: 'absolute',
    bottom: 24,
    fontSize: 11,
    color: '#c0bbb3',
    letterSpacing: '0.02em',
  },
}