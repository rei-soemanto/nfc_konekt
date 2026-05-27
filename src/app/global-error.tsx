'use client'

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    return (
        <html lang="en">
            <body style={{ margin: 0, padding: 0 }}>
                <div style={{
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'linear-gradient(135deg, #0f0b1e 0%, #1a1145 40%, #0d1b2a 100%)',
                    fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
                }}>
                    <div style={{
                        textAlign: 'center',
                        padding: '60px 48px',
                        maxWidth: '520px',
                        width: '90%',
                        background: 'rgba(255, 255, 255, 0.05)',
                        backdropFilter: 'blur(24px)',
                        WebkitBackdropFilter: 'blur(24px)',
                        borderRadius: '24px',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        boxShadow: '0 32px 64px rgba(0, 0, 0, 0.3)',
                    }}>
                        <div style={{
                            fontSize: '100px',
                            fontWeight: 800,
                            background: 'linear-gradient(135deg, #f87171, #ef4444, #dc2626)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                            lineHeight: 1,
                            margin: '0 0 8px',
                        }}>
                            500
                        </div>

                        <h1 style={{
                            fontSize: '28px',
                            fontWeight: 700,
                            color: '#e2e8f0',
                            margin: '0 0 12px',
                        }}>
                            Critical Error
                        </h1>

                        <p style={{
                            fontSize: '16px',
                            color: '#94a3b8',
                            lineHeight: 1.6,
                            margin: '0 0 36px',
                        }}>
                            A critical error occurred while loading the application. 
                            Please try refreshing the page.
                        </p>

                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' as const }}>
                            <button
                                onClick={reset}
                                id="global-error-retry-btn"
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '14px 28px',
                                    borderRadius: '12px',
                                    fontSize: '15px',
                                    fontWeight: 600,
                                    background: 'linear-gradient(135deg, #6366f1, #7c3aed)',
                                    color: '#ffffff',
                                    border: 'none',
                                    cursor: 'pointer',
                                    boxShadow: '0 4px 16px rgba(99, 102, 241, 0.3)',
                                }}
                            >
                                Try Again
                            </button>
                            <a
                                href="/"
                                id="global-error-home-btn"
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '14px 28px',
                                    borderRadius: '12px',
                                    fontSize: '15px',
                                    fontWeight: 600,
                                    background: 'rgba(255, 255, 255, 0.08)',
                                    color: '#c7d2fe',
                                    border: '1px solid rgba(255, 255, 255, 0.12)',
                                    textDecoration: 'none',
                                    cursor: 'pointer',
                                }}
                            >
                                Go Home
                            </a>
                        </div>
                    </div>
                </div>
            </body>
        </html>
    )
}
