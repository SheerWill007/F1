import type { Metadata } from 'next';
import { ClerkProvider, SignInButton, SignUpButton, Show, UserButton } from '@clerk/nextjs';
import './globals.css';

export const metadata: Metadata = {
  title: 'F1 Race Analysis Dashboard',
  description: 'Formula 1 lap-by-lap position chart, tyre strategy, and race analysis powered by FastF1',
  icons: {
    icon: '/favicon.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased bg-f1-black text-f1-white font-mono">
        <ClerkProvider
          appearance={{
            baseTheme: undefined,
            variables: {
              colorPrimary: '#E8002D',
              colorBackground: '#0F0F0F',
              colorInputBackground: '#1A1A1A',
              colorInputText: '#F4F4F4',
              colorText: '#F4F4F4',
              colorTextSecondary: '#888888',
              colorDanger: '#E8002D',
              fontFamily: "'JetBrains Mono', monospace",
              borderRadius: '0.5rem',
            },
            elements: {
              card: 'bg-f1-darkgray border border-f1-gray/20 shadow-2xl',
              headerTitle: 'text-f1-white font-bold tracking-wider uppercase',
              headerSubtitle: 'text-f1-silver text-xs',
              socialButtonsBlockButton: 'border-f1-gray/30 hover:border-f1-red/50 transition-colors',
              formButtonPrimary: 'bg-f1-red hover:bg-f1-red/90 text-white font-bold uppercase tracking-wider text-xs transition-all',
              footerActionLink: 'text-f1-red hover:text-f1-red/80',
              formFieldInput: 'bg-f1-darkgray border-f1-gray/30 text-f1-white focus:border-f1-red',
              formFieldLabel: 'text-f1-silver text-xs uppercase tracking-wider',
              identityPreviewText: 'text-f1-white',
              identityPreviewEditButton: 'text-f1-red hover:text-f1-red/80',
            },
          }}
        >
          <div className="min-h-screen flex flex-col">
            {/* F1-Themed Header */}
            <header className="border-b border-f1-gray/30 bg-f1-black/95 backdrop-blur sticky top-0 z-50">
              <div className="max-w-screen-2xl mx-auto px-4 py-3">
                <div className="flex items-center justify-between">
                  {/* Left: Logo & Title */}
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-f1-red rounded-sm flex items-center justify-center">
                        <span className="text-xs font-black text-white leading-none">F1</span>
                      </div>
                      <span className="text-sm font-bold tracking-widest text-white uppercase">
                        Race Analysis
                      </span>
                    </div>
                    <div className="hidden md:block h-4 w-px bg-f1-gray/40" />
                    <span className="hidden md:block text-xs text-f1-silver tracking-wider">
                      Dashboard v1.0
                    </span>
                  </div>

                  {/* Right: Auth Buttons */}
                  <div className="flex items-center gap-3">
                    <Show when="signed-out">
                      <SignInButton mode="modal">
                        <button className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-f1-silver hover:text-white border border-f1-gray/30 hover:border-f1-red/50 rounded transition-all">
                          Sign In
                        </button>
                      </SignInButton>
                      <SignUpButton mode="modal">
                        <button className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-white bg-f1-red hover:bg-f1-red/90 rounded transition-all">
                          Sign Up
                        </button>
                      </SignUpButton>
                    </Show>
                    <Show when="signed-in">
                      <div className="flex items-center gap-3">
                        <span className="hidden sm:flex items-center gap-1.5 text-xs text-f1-silver">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                          Authenticated
                        </span>
                        <UserButton
                          appearance={{
                            elements: {
                              avatarBox: 'w-8 h-8 border-2 border-f1-red/50 hover:border-f1-red transition-colors',
                              userButtonPopoverCard: 'bg-f1-darkgray border border-f1-gray/20',
                              userButtonPopoverActionButton: 'hover:bg-f1-gray/20 text-f1-white',
                              userButtonPopoverActionButtonText: 'text-f1-white',
                              userButtonPopoverActionButtonIcon: 'text-f1-silver',
                              userButtonPopoverFooter: 'hidden',
                            },
                          }}
                        />
                      </div>
                    </Show>
                  </div>
                </div>
              </div>
            </header>

            {/* Main Content */}
            <main className="flex-1">
              {children}
            </main>

            {/* Footer */}
            <footer className="border-t border-f1-gray/30 bg-f1-black/95 backdrop-blur mt-auto">
              <div className="max-w-screen-2xl mx-auto px-4 py-4">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-f1-silver">
                  <div className="flex items-center gap-2">
                    <span>Powered by</span>
                    <a
                      href="https://github.com/theOehrly/Fast-F1"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-f1-red hover:text-f1-red/80 font-bold transition-colors"
                    >
                      FastF1
                    </a>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-f1-gray">|</span>
                    <span>© 2024 F1 Race Analysis</span>
                  </div>
                </div>
              </div>
            </footer>
          </div>
        </ClerkProvider>
      </body>
    </html>
  );
}
