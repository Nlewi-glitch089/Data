import './globals.css'

export const metadata = {
  title: 'Data Quality Analysis',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <header className="dq-header">
          <div className="dq-container">
            <h1 className="dq-logo">Data Quality Analysis</h1>
            <nav className="dq-nav">
              <a href="/">Home</a>
              <a href="/preview">Preview</a>
              <a href="/dashboard">Dashboard</a>
              <a href="/insights">Insights</a>
            </nav>
          </div>
        </header>
        <main className="dq-main">{children}</main>
        <footer className="dq-footer">© Data Quality Analysis</footer>
      </body>
    </html>
  )
}
