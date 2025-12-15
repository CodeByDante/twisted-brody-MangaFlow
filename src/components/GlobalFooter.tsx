import { Info } from 'lucide-react';

export function GlobalFooter() {
    return (
        <footer className="py-6 border-t border-gray-800/50 flex flex-col items-center justify-center gap-4 text-gray-400 text-sm mt-auto w-full">
            <div className="flex flex-wrap justify-center gap-6">
                <a
                    href="https://t.me/twistedbrody"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 hover:text-[#bb86fc] transition-colors"
                >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.16.16-.295.295-.605.295l.213-3.054 5.56-5.022c.242-.213-.054-.333-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.941z" />
                    </svg>
                    Twisted Brody
                </a>
                <a
                    href="https://t.me/+CmmZFHM9hpViYzMx"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 hover:text-[#bb86fc] transition-colors"
                >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.16.16-.295.295-.605.295l.213-3.054 5.56-5.022c.242-.213-.054-.333-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.941z" />
                    </svg>
                    Canal Hub
                </a>
                <a
                    href="https://x.com/TwistedBrody"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 hover:text-[#bb86fc] transition-colors"
                >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                    X
                </a>
                <button
                    onClick={() => {
                        window.location.hash = 'info';
                    }}
                    className="flex items-center gap-2 hover:text-[#bb86fc] transition-colors"
                >
                    <Info className="w-4 h-4" />
                    <span>Info</span>
                </button>
            </div>
            <div className="text-xs opacity-50">
                Twisted Brody MangaFlow &copy; {new Date().getFullYear()}
            </div>
        </footer>
    );
}
