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
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}
