'use client';

import { motion } from 'framer-motion';
import { Clock, ChefHat } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

/* ═══════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════ */

export interface Recipe {
  id: string;
  title: string;
  description: string;
  prepTimeMin: number;
  tags: string;
  ingredients: string;
  steps: string;
  imageUrl: string | null;
  createdAt: string;
}

interface RecipeCardProps {
  recipe: Recipe;
  onClick: () => void;
  index?: number;
}

/* ═══════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════ */

function parseTags(tagsRaw: string): string[] {
  try {
    return typeof tagsRaw === 'string' ? JSON.parse(tagsRaw) : [];
  } catch {
    return [];
  }
}

/* ═══════════════════════════════════════════════════════
   RECIPE CARD
   ═══════════════════════════════════════════════════════ */

export function RecipeCard({ recipe, onClick, index = 0 }: RecipeCardProps) {
  const tags = parseTags(recipe.tags);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: index * 0.06,
        duration: 0.5,
        ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
      }}
      whileHover={{ scale: 1.02 }}
      onClick={onClick}
      className="group cursor-pointer"
    >
      <div className="glass rounded-2xl inner-glow overflow-hidden transition-all duration-500 hover:shadow-[0_0_24px_oklch(0.78_0.14_85/12%)] hover:border-[var(--accent-primary)]/20">
        {/* Image / Placeholder */}
        <div className="relative h-40 overflow-hidden">
          {recipe.imageUrl ? (
            <img
              src={recipe.imageUrl}
              alt={recipe.title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[var(--accent-primary)]/10 via-[#8b5cf6]/5 to-[#c77d5a]/10 flex items-center justify-center">
              <ChefHat className="w-12 h-12 text-[var(--accent-primary)]/30 transition-colors duration-500 group-hover:text-[var(--accent-primary)]/50" />
            </div>
          )}

          {/* Gold shimmer overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a12]/80 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-500" />

          {/* Prep time badge */}
          {recipe.prepTimeMin > 0 && (
            <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full glass-strong text-[10px] text-[#e2e8f0] font-medium">
              <Clock className="w-3 h-3 text-[var(--accent-primary)]" />
              {recipe.prepTimeMin} min
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          <div>
            <h3 className="text-base font-serif font-semibold text-foreground tracking-tight leading-snug line-clamp-1 group-hover:text-[var(--accent-primary)] transition-colors duration-300">
              {recipe.title}
            </h3>
            {recipe.description && (
              <p className="text-xs text-[#64748b] mt-1 leading-relaxed line-clamp-2">
                {recipe.description}
              </p>
            )}
          </div>

          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {tags.slice(0, 4).map((tag) => (
                <Badge
                  key={tag}
                  className="bg-[var(--accent-primary)]/[0.07] text-[var(--accent-primary)]/80 border-0 text-[9px] font-medium px-2 py-0.5 rounded-full hover:bg-[var(--accent-primary)]/15 transition-colors duration-300"
                >
                  {tag}
                </Badge>
              ))}
              {tags.length > 4 && (
                <Badge className="bg-white/[0.04] text-[#475569] border-0 text-[9px] font-medium px-2 py-0.5 rounded-full">
                  +{tags.length - 4}
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
