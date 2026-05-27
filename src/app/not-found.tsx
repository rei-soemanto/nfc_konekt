'use client'

import Link from 'next/link'
import Image from 'next/image'

export default function NotFound() {
    return (
        <div className="not-found-page">
            <style>{`
                .not-found-page {
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: linear-gradient(135deg, #0f0b1e 0%, #1a1145 40%, #0d1b2a 100%);
                    font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
                    overflow: hidden;
                    position: relative;
                }

                .not-found-page * {
                    box-sizing: border-box;
                }

                /* Animated background orbs */
                .nf-orb {
                    position: absolute;
                    border-radius: 50%;
                    filter: blur(80px);
                    opacity: 0.3;
                    animation: nfFloat 8s ease-in-out infinite;
                }

                .nf-orb-1 {
                    width: 400px;
                    height: 400px;
                    background: #6366f1;
                    top: -100px;
                    right: -100px;
                    animation-delay: 0s;
                }

                .nf-orb-2 {
                    width: 300px;
                    height: 300px;
                    background: #7c3aed;
                    bottom: -80px;
                    left: -80px;
                    animation-delay: -3s;
                }

                .nf-orb-3 {
                    width: 200px;
                    height: 200px;
                    background: #a78bfa;
                    top: 50%;
                    left: 50%;
                    animation-delay: -5s;
                }

                @keyframes nfFloat {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    33% { transform: translate(30px, -20px) scale(1.05); }
                    66% { transform: translate(-20px, 20px) scale(0.95); }
                }

                .nf-card {
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

                .nf-logo {
                    border-radius: 16px;
                    margin-bottom: 24px;
                    opacity: 0.9;
                }

                .nf-code {
                    font-size: 120px;
                    font-weight: 800;
                    background: linear-gradient(135deg, #818cf8, #a78bfa, #c084fc);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    line-height: 1;
                    margin: 0 0 8px;
                    animation: nfPulse 3s ease-in-out infinite;
                }

                @keyframes nfPulse {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.8; transform: scale(0.98); }
                }

                .nf-title {
                    font-size: 28px;
                    font-weight: 700;
                    color: #e2e8f0;
                    margin: 0 0 12px;
                }

                .nf-desc {
                    font-size: 16px;
                    color: #94a3b8;
                    line-height: 1.6;
                    margin: 0 0 36px;
                }

                .nf-actions {
                    display: flex;
                    gap: 12px;
                    justify-content: center;
                    flex-wrap: wrap;
                }

                .nf-btn {
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

                .nf-btn-primary {
                    background: linear-gradient(135deg, #6366f1, #7c3aed);
                    color: #ffffff;
                    box-shadow: 0 4px 16px rgba(99, 102, 241, 0.3);
                }

                .nf-btn-primary:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 24px rgba(99, 102, 241, 0.4);
                }

                .nf-btn-secondary {
                    background: rgba(255, 255, 255, 0.08);
                    color: #c7d2fe;
                    border: 1px solid rgba(255, 255, 255, 0.12);
                }

                .nf-btn-secondary:hover {
                    background: rgba(255, 255, 255, 0.14);
                    transform: translateY(-2px);
                }

                /* Floating particles */
                .nf-particles {
                    position: absolute;
                    inset: 0;
                    overflow: hidden;
                    pointer-events: none;
                }

                .nf-particle {
                    position: absolute;
                    width: 4px;
                    height: 4px;
                    background: rgba(165, 140, 255, 0.4);
                    border-radius: 50%;
                    animation: nfRise 6s linear infinite;
                }

                .nf-particle:nth-child(1) { left: 10%; animation-delay: 0s; animation-duration: 8s; }
                .nf-particle:nth-child(2) { left: 25%; animation-delay: -2s; animation-duration: 6s; }
                .nf-particle:nth-child(3) { left: 40%; animation-delay: -4s; animation-duration: 9s; }
                .nf-particle:nth-child(4) { left: 55%; animation-delay: -1s; animation-duration: 7s; }
                .nf-particle:nth-child(5) { left: 70%; animation-delay: -3s; animation-duration: 5s; }
                .nf-particle:nth-child(6) { left: 85%; animation-delay: -5s; animation-duration: 8s; }
                .nf-particle:nth-child(7) { left: 50%; animation-delay: -6s; animation-duration: 10s; }
                .nf-particle:nth-child(8) { left: 15%; animation-delay: -7s; animation-duration: 7s; }

                @keyframes nfRise {
                    0% { transform: translateY(100vh) scale(0); opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { transform: translateY(-10vh) scale(1); opacity: 0; }
                }

                @media (max-width: 480px) {
                    .nf-card { padding: 40px 24px; }
                    .nf-code { font-size: 80px; }
                    .nf-title { font-size: 22px; }
                    .nf-desc { font-size: 14px; }
                }
            `}</style>

            {/* Background effects */}
            <div className="nf-orb nf-orb-1" />
            <div className="nf-orb nf-orb-2" />
            <div className="nf-orb nf-orb-3" />

            <div className="nf-particles">
                {[...Array(8)].map((_, i) => (
                    <div key={i} className="nf-particle" />
                ))}
            </div>

            {/* Card */}
            <div className="nf-card">
                <Image
                    src="/NFC Konekt Logo.jfif"
                    alt="NFC Konekt"
                    width={64}
                    height={64}
                    className="nf-logo"
                />

                <p className="nf-code">404</p>
                <h1 className="nf-title">Page Not Found</h1>
                <p className="nf-desc">
                    The page you&apos;re looking for doesn&apos;t exist or has been moved. 
                    Let&apos;s get you back on track.
                </p>

                <div className="nf-actions">
                    <Link href="/" className="nf-btn nf-btn-primary" id="not-found-home-btn">
                        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M3 12l9-9 9 9M5 10v10a1 1 0 001 1h3m10-11v10a1 1 0 01-1 1h-3m-4 0v-6a1 1 0 011-1h2a1 1 0 011 1v6" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Go Home
                    </Link>
                    <Link href="/dashboard" className="nf-btn nf-btn-secondary" id="not-found-dashboard-btn">
                        Dashboard
                    </Link>
                </div>
            </div>
        </div>
    )
}
