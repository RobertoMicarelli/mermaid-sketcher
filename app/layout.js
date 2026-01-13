import './globals.css'

export const metadata = {
  title: 'Mermaid Sketcher',
  description: 'Convert text and drawings to Mermaid diagrams',
  metadataBase: new URL('http://localhost:3000'),
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }) {
  return (
    <html lang="it">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Syne:wght@700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-sans antialiased" style={{ fontFamily: "'DM Sans', sans-serif" }}>{children}</body>
    </html>
  )
}
