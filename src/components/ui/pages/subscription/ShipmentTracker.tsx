'use client'

type Props = {
    status: 'PENDING' | 'PROCESSING' | 'SHIPPING' | 'ARRIVED'
    trackingLink?: string | null
}

export default function ShipmentTracker({ status, trackingLink }: Props) {
    // Define the flow
    const steps = ['PROCESSING', 'SHIPPING', 'ARRIVED'];
    
    // Determine current step index (Default to -1 if pending)
    let currentStepIndex = steps.indexOf(status);
    if (status === 'PENDING') currentStepIndex = -1; 

    // Mapping for UI labels
    const labels: Record<string, { label: string, icon: string, desc: string }> = {
        PROCESSING: { 
            label: 'Processing', 
            icon: 'fa-solid fa-box-open',
            desc: 'We are preparing your personalized NFC card.'
        },
        SHIPPING: { 
            label: 'On The Way', 
            icon: 'fa-solid fa-truck-fast',
            desc: 'Your card is with the courier.'
        },
        ARRIVED: { 
            label: 'Delivered', 
            icon: 'fa-solid fa-house-chimney',
            desc: 'Package has arrived at your destination.'
        }
    };

    const progressWidth = currentStepIndex <= 0 ? 0 : (currentStepIndex / (steps.length - 1)) * 100;

    return (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm">
            <div className="mb-8">
                <h3 className="font-bold text-gray-900 dark:text-white flex items-center text-lg">
                    <i className="fa-solid fa-map-location-dot text-indigo-500 mr-2"></i>
                    Shipment Tracking
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                    {status === 'PENDING' 
                        ? "Waiting for payment confirmation." 
                        : labels[status]?.desc || "Track your card delivery status."}
                </p>
            </div>
            
            <div className="relative px-4 py-4 mb-6">
                {/* Gray Background Line */}
                <div className="absolute left-4 right-4 top-1/2 -translate-y-1/2 h-1 bg-gray-100 dark:bg-gray-800 rounded-full -z-0"></div>
                
                {/* Colored Progress Line */}
                <div 
                    className="absolute left-4 top-1/2 -translate-y-1/2 h-1 bg-indigo-500 transition-all duration-1000 -z-0 rounded-full"
                    style={{ width: `${Math.max(0, Math.min(progressWidth, 100))}%` }}
                ></div>

                {/* Steps Row */}
                <div className="relative z-10 flex justify-between">
                    {steps.map((step, idx) => {
                        const isCompleted = idx <= currentStepIndex;
                        const isCurrent = idx === currentStepIndex;
                        const info = labels[step];
                        
                        return (
                            <div key={step} className="flex flex-col items-center group">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center border-4 transition-all duration-500 ${
                                    isCompleted 
                                        ? 'bg-indigo-600 border-indigo-100 dark:border-indigo-900/30 text-white shadow-lg shadow-indigo-500/30' 
                                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-300'
                                }`}>
                                    <i className={`${info.icon} ${isCurrent ? 'animate-pulse' : ''}`}></i>
                                </div>
                                
                                <span className={`mt-3 text-xs font-bold uppercase tracking-wider transition-colors ${
                                    isCompleted ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400'
                                }`}>
                                    {info.label}
                                </span>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* TRACKING LINK BUTTON */}
            {trackingLink && (status === 'SHIPPING' || status === 'ARRIVED') && (
                <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800 flex flex-col items-center justify-center text-center animate-fade-in">
                    <a 
                        href={trackingLink} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="group flex items-center gap-2 px-5 py-2.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-300 rounded-full font-bold text-sm hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-all"
                    >
                        <span>Track Package</span>
                        <i className="fa-solid fa-arrow-up-right-from-square text-xs group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"></i>
                    </a>
                    <p className="text-xs text-gray-400 mt-2">
                        View detailed journey on courier's website
                    </p>
                </div>
            )}

            {/* Fallback Note if Shipping but no link */}
            {status === 'SHIPPING' && !trackingLink && (
                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/10 rounded-lg flex items-start gap-3">
                    <i className="fa-solid fa-circle-info text-blue-600 mt-0.5"></i>
                    <div className="text-sm text-blue-800 dark:text-blue-300">
                        <strong>Tracking Info:</strong> Your tracking details will be updated here shortly.
                    </div>
                </div>
            )}
        </div>
    )
}