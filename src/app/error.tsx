'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error('Application error:', error)
    }, [error])

    return (
        <div className="err-page">
            <style>{`
                .err-page {
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: linear-gradient(135deg, #0f0b1e 0%, #1a1145 40%, #0d1b2a 100%);
                    font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
                    overflow: hidden;
                    position: relative;
                }

                .err-page * {
                    box-sizing: border-box;
                }

                .err-orb {
                    position: absolute;
                    border-radius: 50%;
                    filter: blur(80px);
                    opacity: 0.3;
                    animation: errFloat 8s ease-in-out infinite;
                }

                .err-orb-1 {
                    width: 400px;
                    height: 400px;
                    background: #ef4444;
                    top: -100px;
                    right: -100px;
                }

                .err-orb-2 {
                    width: 300px;
                    height: 300px;
                    background: #7c3aed;
                    bottom: -80px;
                    left: -80px;
                    animation-delay: -3s;
                }

                @keyframes errFloat {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    33% { transform: translate(30px, -20px) scale(1.05); }
                    66% { transform: translate(-20px, 20px) scale(0.95); }
                }

                .err-card {
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
                }

                .err-logo {
                    border-radius: 16px;
                    margin-bottom: 24px;
                    opacity: 0.9;
                }

                .err-icon {
                    width: 80px;
                    height: 80px;
                    margin: 0 auto 20px;
                    background: rgba(239, 68, 68, 0.15);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    animation: errPulse 2s ease-in-out infinite;
                }

                @keyframes errPulse {
                    0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.2); }
                    50% { box-shadow: 0 0 0 20px rgba(239, 68, 68, 0); }
                }

                .err-code {
                    font-size: 100px;
                    font-weight: 800;
                    background: linear-gradient(135deg, #f87171, #ef4444, #dc2626);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    line-height: 1;
                    margin: 0 0 8px;
                }

                .err-title {
                    font-size: 28px;
                    font-weight: 700;
                    color: #e2e8f0;
                    margin: 0 0 12px;
                }

                .err-desc {
                    font-size: 16px;
                    color: #94a3b8;
                    line-height: 1.6;
                    margin: 0 0 36px;
                }

                .err-actions {
                    display: flex;
                    gap: 12px;
                    justify-content: center;
                    flex-wrap: wrap;
                }

                .err-btn {
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

                .err-btn-primary {
                    background: linear-gradient(135deg, #6366f1, #7c3aed);
                    color: #ffffff;
                    box-shadow: 0 4px 16px rgba(99, 102, 241, 0.3);
                }

                .err-btn-primary:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 24px rgba(99, 102, 241, 0.4);
                }

                .err-btn-secondary {
                    background: rgba(255, 255, 255, 0.08);
                    color: #c7d2fe;
                    border: 1px solid rgba(255, 255, 255, 0.12);
                }

                .err-btn-secondary:hover {
                    background: rgba(255, 255, 255, 0.14);
                    transform: translateY(-2px);
                }

                .err-particles {
                    position: absolute;
                    inset: 0;
                    overflow: hidden;
                    pointer-events: none;
                }

                .err-particle {
                    position: absolute;
                    width: 4px;
                    height: 4px;
                    background: rgba(239, 68, 68, 0.3);
                    border-radius: 50%;
                    animation: errRise 6s linear infinite;
                }

                .err-particle:nth-child(1) { left: 15%; animation-delay: 0s; animation-duration: 7s; }
                .err-particle:nth-child(2) { left: 35%; animation-delay: -2s; animation-duration: 6s; }
                .err-particle:nth-child(3) { left: 55%; animation-delay: -4s; animation-duration: 8s; }
                .err-particle:nth-child(4) { left: 75%; animation-delay: -1s; animation-duration: 5s; }
                .err-particle:nth-child(5) { left: 90%; animation-delay: -3s; animation-duration: 9s; }
                .err-particle:nth-child(6) { left: 45%; animation-delay: -5s; animation-duration: 7s; }

                @keyframes errRise {
                    0% { transform: translateY(100vh) scale(0); opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { transform: translateY(-10vh) scale(1); opacity: 0; }
                }

                @media (max-width: 480px) {
                    .err-card { padding: 40px 24px; }
                    .err-code { font-size: 72px; }
                    .err-title { font-size: 22px; }
                    .err-desc { font-size: 14px; }
                }
            `}</style>

            <div className="err-orb err-orb-1" />
            <div className="err-orb err-orb-2" />

            <div className="err-particles">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="err-particle" />
                ))}
            </div>

            <div className="err-card">
                <Image
                    src="/NFC Konekt Logo.jfif"
                    alt="NFC Konekt"
                    width={64}
                    height={64}
                    className="err-logo"
                />

                <div className="err-icon">
                    <svg width="36" height="36" fill="none" stroke="#ef4444" strokeWidth="2" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                </div>

                <p className="err-code">500</p>
                <h1 className="err-title">Something Went Wrong</h1>
                <p className="err-desc">
                    An unexpected error occurred. Our team has been notified 
                    and we&apos;re working on fixing it.
                </p>

                <div className="err-actions">
                    <button onClick={reset} className="err-btn err-btn-primary" id="error-retry-btn">
                        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M1 4v6h6M23 20v-6h-6" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M20.49 9A9 9 0 105.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Try Again
                    </button>
                    <Link href="/" className="err-btn err-btn-secondary" id="error-home-btn">
                        Go Home
                    </Link>
                </div>
            </div>
        </div>
    )
}
