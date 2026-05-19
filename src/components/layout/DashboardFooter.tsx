export function DashboardFooter() {
    return (
        <footer className="py-6 px-8 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-center transition-colors duration-300">
            <p className="text-sm text-gray-500 dark:text-gray-400">
                &copy; {new Date().getFullYear()} NFC Konekt. All rights reserved. 
                <span className="mx-2 text-gray-300 dark:text-gray-700">|</span>
                Powered by <span className="text-indigo-600 dark:text-indigo-400 font-semibold">Rei Soemanto</span>
            </p>
        </footer>
    )
}