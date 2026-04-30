import { ThemeProvider } from "../components/theme-provider";
import "./globals.css";

export default function RootLayout({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  return (
    // suppressHydrationWarning itu WAJIB di tag html biar gak error console
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased min-h-screen bg-background text-foreground">
        <ThemeProvider 
          attribute="class" 
          defaultTheme="dark" 
          enableSystem={false} // Paksa pakai pilihan kita (Cave/Nature)
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}