import Link from 'next/link';
import { Sparkles } from 'lucide-react';

export function SiteFooter() {
  return (
    <footer className="bg-foreground text-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-7 h-7 rounded-lg bg-amber-500 flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-['--font-playfair'] text-lg font-bold text-background">Maellis</span>
            </div>
            <p className="text-sm text-background/60 leading-relaxed">
              L&apos;assistant intelligent pour votre maison et vos voyageurs.
            </p>
          </div>

          {/* Produit */}
          <div>
            <h4 className="text-sm font-semibold text-background mb-3">Produit</h4>
            <div className="space-y-2">
              {[
                { label: 'Démonstration', href: '/demo' },
                { label: 'Tarifs', href: '/pricing' },
                { label: 'Connexion', href: '/connexion' },
              ].map((link) => (
                <Link key={link.href} href={link.href}
                  className="block text-sm text-background/60 hover:text-amber-400 transition-colors">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Entreprise */}
          <div>
            <h4 className="text-sm font-semibold text-background mb-3">Entreprise</h4>
            <div className="space-y-2">
              {[
                { label: 'À propos', href: '/about' },
                { label: 'Contact', href: '/contact' },
                { label: 'Confidentialité', href: '/legal/privacy' },
              ].map((link) => (
                <Link key={link.href} href={link.href}
                  className="block text-sm text-background/60 hover:text-amber-400 transition-colors">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Modules */}
          <div>
            <h4 className="text-sm font-semibold text-background mb-3">Modules</h4>
            <div className="space-y-2">
              {['Safe Departure', 'Daily Concierge', 'Auto Upsell', 'Global Host Pro'].map((m) => (
                <Link key={m} href="/pricing"
                  className="block text-sm text-background/60 hover:text-amber-400 transition-colors">
                  {m}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-background/10 pt-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-background/40">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>&copy; {new Date().getFullYear()} Maellis. Tous droits réservés.</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/legal/privacy" className="hover:text-amber-400 transition-colors">Confidentialité</Link>
              <Link href="/contact" className="hover:text-amber-400 transition-colors">Contact</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
