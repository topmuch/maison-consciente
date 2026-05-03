'use client';

import Link from 'next/link';
import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles,
  ArrowRight,
  Menu,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/home/ThemeToggle';

export function SiteNavbar({ activePage }: { activePage?: string }) {
  const [open, setOpen] = useState(false);

  const links = [
    { label: 'Accueil', href: '/' },
    { label: 'Démonstration', href: '/demo' },
    { label: 'Tarifs', href: '/pricing' },
    { label: 'À propos', href: '/about' },
    { label: 'Contact', href: '/contact' },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-['--font-playfair'] text-lg tracking-wide font-bold text-foreground">Maellis</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-3.5 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                activePage === link.href
                  ? 'text-foreground bg-muted'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* CTA + Theme Toggle */}
        <div className="hidden md:flex items-center gap-2">
          <ThemeToggle />
          <Link href="/connexion">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              Connexion
            </Button>
          </Link>
          <Link href="/demo">
            <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-white font-semibold shadow-sm">
              Essayer la démo
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          </Link>
        </div>

        {/* Mobile menu toggle */}
        <div className="md:hidden flex items-center gap-1">
          <ThemeToggle />
          <button onClick={() => setOpen(!open)} className="p-2 text-muted-foreground hover:text-foreground">
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden bg-background border-b border-border px-4 pb-4 pt-2 space-y-1"
        >
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className={`block px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                activePage === link.href
                  ? 'text-foreground bg-muted'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-2 border-t border-border flex flex-col gap-2">
            <Link href="/connexion" onClick={() => setOpen(false)}>
              <Button variant="outline" size="sm" className="w-full">Connexion</Button>
            </Link>
            <Link href="/demo" onClick={() => setOpen(false)}>
              <Button size="sm" className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold">
                Essayer la démo
              </Button>
            </Link>
          </div>
        </motion.div>
      )}
    </nav>
  );
}
