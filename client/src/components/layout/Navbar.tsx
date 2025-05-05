import { Link, useLocation } from "wouter";
import { Bell } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

export default function Navbar() {
  const [location] = useLocation();

  const isActiveLink = (path: string) => {
    return location === path;
  };

  return (
    <nav className="bg-white border-b border-neutral-200 py-3 px-4 lg:px-6 fixed w-full z-50">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <svg className="w-6 h-6 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
          <h1 className="text-xl font-semibold text-neutral-900">AutoTrade</h1>
        </div>
        <div className="hidden md:flex items-center space-x-8">
          <Link href="/">
            <a className={`font-medium ${isActiveLink("/") ? "text-primary" : "text-neutral-600 hover:text-primary"}`}>
              Dashboard
            </a>
          </Link>
          <Link href="/strategies">
            <a className={`font-medium ${isActiveLink("/strategies") ? "text-primary" : "text-neutral-600 hover:text-primary"}`}>
              Strategies
            </a>
          </Link>
          <Link href="/portfolio">
            <a className={`font-medium ${isActiveLink("/portfolio") ? "text-primary" : "text-neutral-600 hover:text-primary"}`}>
              Portfolio
            </a>
          </Link>
          <Link href="/backtest">
            <a className={`font-medium ${isActiveLink("/backtest") ? "text-primary" : "text-neutral-600 hover:text-primary"}`}>
              Backtest
            </a>
          </Link>
          <Link href="/settings">
            <a className={`font-medium ${isActiveLink("/settings") ? "text-primary" : "text-neutral-600 hover:text-primary"}`}>
              Settings
            </a>
          </Link>
        </div>
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" className="text-neutral-600 hover:text-primary">
            <Bell className="h-5 w-5" />
          </Button>
          <Avatar>
            <AvatarFallback className="bg-primary text-white">JS</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </nav>
  );
}
