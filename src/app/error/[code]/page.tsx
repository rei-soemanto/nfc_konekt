'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useParams } from 'next/navigation'
import { notFound } from 'next/navigation'

/**
 * Error page configuration for each supported HTTP status code.
 */
const ERROR_CONFIG: Record<string, {
    code: string
    title: string
    description: string
    icon: 'lock' | 'shield' | 'search' | 'clock' | 'server' | 'alert'
    gradient: string
    primaryAction: { label: string; href: string; icon: 'home' | 'login' | 'retry' }
    secondaryAction?: { label: string; href: string }
}> = {
    '400': {
        code: '400',
        title: 'Bad Request',
        description: 'The request could not be understood by the server. Please check your input and try again.',
        icon: 'alert',
        gradient: 'linear-gradient(135deg, #f59e0b, #d97706)',
        primaryAction: { label: 'Go Home', href: '/', icon: 'home' },
        secondaryAction: { label: 'Dashboard', href: '/dashboard' },
    },
    '401': {
        code: '401',
        title: 'Unauthorized',
        description: 'You need to sign in to access this page. Please log in with your NFC Konekt account to continue.',
        icon: 'lock',
        gradient: 'linear-gradient(135deg, #f59e0b, #ea580c)',
        primaryAction: { label: 'Sign In', href: '/auth', icon: 'login' },
        secondaryAction: { label: 'Go Home', href: '/' },
    },
    '402': {
        code: '402',
        title: 'Payment Required',
        description: 'This feature requires an active subscription. Please upgrade your plan to access it.',
        icon: 'alert',
        gradient: 'linear-gradient(135deg, #f59e0b, #d97706)',
        primaryAction: { label: 'View Plans', href: '/dashboard/subscription', icon: 'home' },
        secondaryAction: { label: 'Dashboard', href: '/dashboard' },
    },
    '403': {
        code: '403',
        title: 'Access Denied',
        description: "You don't have permission to access this resource. Contact your administrator if you believe this is an error.",
        icon: 'shield',
        gradient: 'linear-gradient(135deg, #ef4444, #dc2626)',
        primaryAction: { label: 'Go Home', href: '/', icon: 'home' },
        secondaryAction: { label: 'Dashboard', href: '/dashboard' },
    },
    '404': {
        code: '404',
        title: 'Page Not Found',
        description: "The page you're looking for doesn't exist or has been moved. Let's get you back on track.",
        icon: 'search',
        gradient: 'linear-gradient(135deg, #818cf8, #a78bfa)',
        primaryAction: { label: 'Go Home', href: '/', icon: 'home' },
        secondaryAction: { label: 'Dashboard', href: '/dashboard' },
    },
    '419': {
        code: '419',
        title: 'Session Expired',
        description: 'Your session has timed out for security reasons. Please sign in again to continue where you left off.',
        icon: 'clock',
        gradient: 'linear-gradient(135deg, #f59e0b, #d97706)',
        primaryAction: { label: 'Sign In Again', href: '/auth', icon: 'login' },
        secondaryAction: { label: 'Go Home', href: '/' },
    },
    '429': {
        code: '429',
        title: 'Too Many Requests',
        description: "You've made too many requests in a short period. Please wait a moment and try again.",
        icon: 'clock',
        gradient: 'linear-gradient(135deg, #f59e0b, #d97706)',
        primaryAction: { label: 'Go Home', href: '/', icon: 'home' },
    },
    '500': {
        code: '500',
        title: 'Server Error',
        description: "Something went wrong on our end. We've been notified and are working on fixing it.",
        icon: 'server',
        gradient: 'linear-gradient(135deg, #f87171, #ef4444)',
        primaryAction: { label: 'Go Home', href: '/', icon: 'home' },
        secondaryAction: { label: 'Try Again', href: 'javascript:history.back()' },
    },
    '502': {
        code: '502',
        title: 'Bad Gateway',
        description: 'The server received an invalid response. Please try again in a few moments.',
        icon: 'server',
        gradient: 'linear-gradient(135deg, #f87171, #ef4444)',
        primaryAction: { label: 'Go Home', href: '/', icon: 'home' },
    },
    '503': {
        code: '503',
        title: 'Service Unavailable',
        description: 'NFC Konekt is temporarily under maintenance. We\'ll be back shortly.',
        icon: 'server',
        gradient: 'linear-gradient(135deg, #f87171, #ef4444)',
        primaryAction: { label: 'Go Home', href: '/', icon: 'home' },
    },
}

const ICONS = {
    lock: (
        <svg width="36" height="36" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0110 0v4" />
        </svg>
    ),
    shield: (
        <svg width="36" height="36" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <line x1="9" y1="12" x2="15" y2="12" />
        </svg>
    ),
    search: (
        <svg width="36" height="36" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
            <line x1="8" y1="11" x2="14" y2="11" />
        </svg>
    ),
    clock: (
        <svg width="36" height="36" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
        </svg>
    ),
    server: (
        <svg width="36" height="36" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
            <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
            <line x1="6" y1="6" x2="6.01" y2="6" />
            <line x1="6" y1="18" x2="6.01" y2="18" />
        </svg>
    ),
    alert: (
        <svg width="36" height="36" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
    ),
}

const ACTION_ICONS = {
    home: (
        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M3 12l9-9 9 9M5 10v10a1 1 0 001 1h3m10-11v10a1 1 0 01-1 1h-3m-4 0v-6a1 1 0 011-1h2a1 1 0 011 1v6" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
    ),
    login: (
        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
    ),
    retry: (
        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M1 4v6h6M23 20v-6h-6" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M20.49 9A9 9 0 105.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
    ),
}

export default function ErrorCodePage() {
    const params = useParams()
    const code = params.code as string
    const config = ERROR_CONFIG[code]

    // If the error code is not supported, trigger Next.js 404
    if (!config) {
        notFound()
    }

    // Determine icon color based on error type
    const isWarning = ['400', '401', '402', '419', '429'].includes(code)
    const isDanger = ['403', '500', '502', '503'].includes(code)
    const iconColor = isDanger ? '#ef4444' : isWarning ? '#f59e0b' : '#818cf8'
    const iconBg = isDanger ? 'rgba(239, 68, 68, 0.15)' : isWarning ? 'rgba(245, 158, 11, 0.15)' : 'rgba(129, 140, 248, 0.15)'

    return (
        <div className="ec-page">
            <style>{`
                .ec-page {
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: linear-gradient(135deg, #0f0b1e 0%, #1a1145 40%, #0d1b2a 100%);
                    font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
                    overflow: hidden;
                    position: relative;
                }

                .ec-page * {
                    box-sizing: border-box;
                }

                .ec-orb {
                    position: absolute;
                    border-radius: 50%;
                    filter: blur(80px);
                    opacity: 0.25;
                    animation: ecFloat 8s ease-in-out infinite;
                }

                .ec-orb-1 {
                    width: 400px;
                    height: 400px;
                    top: -100px;
                    right: -100px;
                    animation-delay: 0s;
                }

                .ec-orb-2 {
                    width: 300px;
                    height: 300px;
                    bottom: -80px;
                    left: -80px;
                    animation-delay: -3s;
                }

                .ec-orb-3 {
                    width: 200px;
                    height: 200px;
                    top: 40%;
                    left: 60%;
                    animation-delay: -5s;
                }

                @keyframes ecFloat {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    33% { transform: translate(30px, -20px) scale(1.05); }
                    66% { transform: translate(-20px, 20px) scale(0.95); }
                }

                .ec-card {
                    position: relative;
                    z-index: 10;
                    text-align: center;
                    padding: 60px 48px;
                    max-width: 520px;
                    width: 90%;
                    background: rgba(255, 255, 255, 0.05);
                    backdrop-filter: blur(24px);
                    -webkit-backdrop-filter: blur(24px);
                    border-radius: 24px;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    box-shadow: 0 32px 64px rgba(0, 0, 0, 0.3);
                    animation: ecFadeIn 0.6s ease-out;
                }

                @keyframes ecFadeIn {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .ec-logo {
                    border-radius: 16px;
                    margin-bottom: 24px;
                    opacity: 0.9;
                }

                .ec-icon {
                    width: 80px;
                    height: 80px;
                    margin: 0 auto 20px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    animation: ecPulse 2s ease-in-out infinite;
                }

                @keyframes ecPulse {
                    0%, 100% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.2); }
                    50% { box-shadow: 0 0 0 20px rgba(99, 102, 241, 0); }
                }

                .ec-code {
                    font-size: 100px;
                    font-weight: 800;
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    line-height: 1;
                    margin: 0 0 8px;
                }

                .ec-title {
                    font-size: 28px;
                    font-weight: 700;
                    color: #e2e8f0;
                    margin: 0 0 12px;
                }

                .ec-desc {
                    font-size: 16px;
                    color: #94a3b8;
                    line-height: 1.6;
                    margin: 0 0 36px;
                }

                .ec-actions {
                    display: flex;
                    gap: 12px;
                    justify-content: center;
                    flex-wrap: wrap;
                }

                .ec-btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    padding: 14px 28px;
                    border-radius: 12px;
                    font-size: 15px;
                    font-weight: 600;
                    text-decoration: none;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    cursor: pointer;
                    border: none;
                }

                .ec-btn-primary {
                    background: linear-gradient(135deg, #6366f1, #7c3aed);
                    color: #ffffff;
                    box-shadow: 0 4px 16px rgba(99, 102, 241, 0.3);
                }

                .ec-btn-primary:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 24px rgba(99, 102, 241, 0.4);
                }

                .ec-btn-secondary {
                    background: rgba(255, 255, 255, 0.08);
                    color: #c7d2fe;
                    border: 1px solid rgba(255, 255, 255, 0.12);
                }

                .ec-btn-secondary:hover {
                    background: rgba(255, 255, 255, 0.14);
                    transform: translateY(-2px);
                }

                .ec-particles {
                    position: absolute;
                    inset: 0;
                    overflow: hidden;
                    pointer-events: none;
                }

                .ec-particle {
                    position: absolute;
                    width: 4px;
                    height: 4px;
                    border-radius: 50%;
                    animation: ecRise 6s linear infinite;
                }

                .ec-particle:nth-child(1) { left: 10%; animation-delay: 0s; animation-duration: 8s; }
                .ec-particle:nth-child(2) { left: 25%; animation-delay: -2s; animation-duration: 6s; }
                .ec-particle:nth-child(3) { left: 40%; animation-delay: -4s; animation-duration: 9s; }
                .ec-particle:nth-child(4) { left: 55%; animation-delay: -1s; animation-duration: 7s; }
                .ec-particle:nth-child(5) { left: 70%; animation-delay: -3s; animation-duration: 5s; }
                .ec-particle:nth-child(6) { left: 85%; animation-delay: -5s; animation-duration: 8s; }
                .ec-particle:nth-child(7) { left: 50%; animation-delay: -6s; animation-duration: 10s; }
                .ec-particle:nth-child(8) { left: 15%; animation-delay: -7s; animation-duration: 7s; }

                @keyframes ecRise {
                    0% { transform: translateY(100vh) scale(0); opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { transform: translateY(-10vh) scale(1); opacity: 0; }
                }

                .ec-separator {
                    height: 1px;
                    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
                    margin: 24px 0;
                }

                @media (max-width: 480px) {
                    .ec-card { padding: 40px 24px; }
                    .ec-code { font-size: 72px; }
                    .ec-title { font-size: 22px; }
                    .ec-desc { font-size: 14px; }
                }
            `}</style>

            {/* Background orbs with dynamic color */}
            <div className="ec-orb ec-orb-1" style={{ background: iconColor }} />
            <div className="ec-orb ec-orb-2" style={{ background: '#7c3aed' }} />
            <div className="ec-orb ec-orb-3" style={{ background: iconColor }} />

            <div className="ec-particles">
                {[...Array(8)].map((_, i) => (
                    <div
                        key={i}
                        className="ec-particle"
                        style={{ background: `${iconColor}66` }}
                    />
                ))}
            </div>

            <div className="ec-card">
                <Image
                    src="/NFC Konekt Logo.jfif"
                    alt="NFC Konekt"
                    width={64}
                    height={64}
                    className="ec-logo"
                />

                <div className="ec-icon" style={{ background: iconBg, color: iconColor }}>
                    {ICONS[config.icon]}
                </div>

                <p
                    className="ec-code"
                    style={{ background: config.gradient, WebkitBackgroundClip: 'text', backgroundClip: 'text' }}
                >
                    {config.code}
                </p>

                <h1 className="ec-title">{config.title}</h1>
                <p className="ec-desc">{config.description}</p>

                <div className="ec-actions">
                    <Link
                        href={config.primaryAction.href}
                        className="ec-btn ec-btn-primary"
                        id={`error-${code}-primary-btn`}
                    >
                        {ACTION_ICONS[config.primaryAction.icon]}
                        {config.primaryAction.label}
                    </Link>

                    {config.secondaryAction && (
                        <Link
                            href={config.secondaryAction.href}
                            className="ec-btn ec-btn-secondary"
                            id={`error-${code}-secondary-btn`}
                        >
                            {config.secondaryAction.label}
                        </Link>
                    )}
                </div>
            </div>
        </div>
    )
}
