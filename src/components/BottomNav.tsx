"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LineChart, History } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
    { label: "Today", icon: Home, href: "/" },
    { label: "Progress", icon: LineChart, href: "/progress" },
    { label: "History", icon: History, href: "/history" },
];

export function BottomNav() {
    const pathname = usePathname();

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t bg-background/80 px-4 pb-[env(safe-area-inset-bottom)] pt-2 backdrop-blur-lg">
            {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            "flex flex-col items-center justify-center p-2 text-muted-foreground transition-colors hover:text-foreground",
                            isActive && "text-primary font-medium"
                        )}
                    >
                        <Icon className={cn("mb-1 h-5 w-5", isActive && "text-primary")} />
                        <span className="text-[10px]">{item.label}</span>
                    </Link>
                );
            })}
        </nav>
    );
}
