"use client";

import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import Link from "next/link";

export function Navigation() {
  const navItems = [
    { href: "#features", label: "Features" },
    { href: "#pricing", label: "Pricing" },
  ];

  return (
    <nav className="fixed top-0 w-full z-50 backdrop-blur-md bg-white/10 border-b border-white/20">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          className="text-xl font-bold text-white hover:text-white/80 transition-colors"
        >
          Shadow MedTech AI
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-8">
          <NavigationMenu>
            <NavigationMenuList>
              {navItems.map((item) => (
                <NavigationMenuItem key={item.href}>
                  <Link
                    href={item.href}
                    className="text-white/80 hover:text-white transition-colors px-3 py-2 text-sm font-medium"
                  >
                    {item.label}
                  </Link>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>

          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              className="text-white/80 hover:text-white hover:bg-white/10"
              asChild
            >
              <Link href="/signin">Sign In</Link>
            </Button>
            <Button
              className="bg-white text-black hover:bg-white/90"
              asChild
            >
              <Link href="/signup">Sign Up</Link>
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-white">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-[300px] bg-black/95 border-white/20"
            >
              <div className="flex flex-col space-y-4 mt-8">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="text-white/80 hover:text-white transition-colors px-3 py-2 text-lg font-medium"
                  >
                    {item.label}
                  </Link>
                ))}
                <hr className="border-white/20" />
                <Button
                  variant="ghost"
                  className="text-white/80 hover:text-white justify-start"
                  asChild
                >
                  <Link href="/signin">Sign In</Link>
                </Button>
                <Button
                  className="bg-white text-black hover:bg-white/90 justify-start"
                  asChild
                >
                  <Link href="/signup">Sign Up</Link>
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}
