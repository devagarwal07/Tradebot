import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-neutral-200 py-6 px-4 lg:px-6">
      <div className="container mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <p className="text-sm text-neutral-600">© {new Date().getFullYear()} AutoTrade. All rights reserved.</p>
            <p className="text-xs text-neutral-500 mt-1">Trading involves risk. Past performance is not indicative of future results.</p>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/privacy">
              <a className="text-neutral-600 hover:text-primary text-sm">Privacy Policy</a>
            </Link>
            <Link href="/terms">
              <a className="text-neutral-600 hover:text-primary text-sm">Terms of Service</a>
            </Link>
            <Link href="/contact">
              <a className="text-neutral-600 hover:text-primary text-sm">Contact Us</a>
            </Link>
          </div>
        </div>
        <div className="mt-4 text-xs text-neutral-500 text-center">
          Powered by AngelOne API. This platform provides automated trading functionality.
        </div>
      </div>
    </footer>
  );
}
