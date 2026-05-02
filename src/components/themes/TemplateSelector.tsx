'use client';

import { useTemplate } from './TemplateProvider';
import { getTemplate, getAllTemplates, type TemplateConfig } from '@/lib/templates-config';
import { Check, Palette } from 'lucide-react';
import { cn } from '@/lib/utils';

/* ═══════════════════════════════════════════════════════
   MAISON CONSCIENTE — Template Selector

   Visual grid showing all available templates with
   preview gradients, descriptions, and one-click selection.
   ═══════════════════════════════════════════════════════ */

interface TemplateSelectorProps {
  showSeasonal?: boolean;
}

export function TemplateSelector({ showSeasonal = true }: TemplateSelectorProps) {
  const { template: currentTemplate, setTemplate, isTransitioning } = useTemplate();

  const allTemplates = getAllTemplates();
  const baseTemplates = allTemplates.filter(t => !t.seasonal);
  const seasonalTemplates = allTemplates.filter(t => !!t.seasonal);

  return (
    <div className="space-y-8">
      {/* Base Templates */}
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-4 flex items-center gap-2">
          <Palette className="w-4 h-4" />
          Thèmes Principaux
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {baseTemplates.map(t => (
            <TemplateCard
              key={t.slug}
              template={t}
              isSelected={currentTemplate.slug === t.slug}
              onSelect={() => setTemplate(t.slug)}
              isTransitioning={isTransitioning}
            />
          ))}
        </div>
      </div>

      {/* Seasonal Templates */}
      {showSeasonal && seasonalTemplates.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-4">
            🎭 Thèmes Saisonners
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {seasonalTemplates.map(t => (
              <TemplateCard
                key={t.slug}
                template={t}
                isSelected={currentTemplate.slug === t.slug}
                onSelect={() => setTemplate(t.slug)}
                isTransitioning={isTransitioning}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Individual Template Card ─── */
function TemplateCard({
  template,
  isSelected,
  onSelect,
  isTransitioning,
}: {
  template: TemplateConfig;
  isSelected: boolean;
  onSelect: () => void;
  isTransitioning: boolean;
}) {
  const config = getTemplate(template.slug);

  return (
    <button
      onClick={onSelect}
      disabled={isTransitioning}
      className={cn(
        'relative group text-left rounded-2xl border overflow-hidden transition-all duration-300',
        'hover:scale-[1.02] active:scale-[0.98]',
        'focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--bg-primary)]',
        isSelected
          ? 'border-[var(--accent)] shadow-lg shadow-[var(--glow)]'
          : 'border-[var(--border)] hover:border-[var(--accent)]/50'
      )}
    >
      {/* Gradient Preview */}
      <div
        className="h-24 flex items-center justify-center text-4xl"
        style={{ background: template.gradient }}
      >
        {template.preview}
      </div>

      {/* Info */}
      <div className="p-4 bg-[var(--bg-card)]">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-[var(--text-primary)]">{template.name}</h4>
          {isSelected && (
            <div className="flex items-center gap-1 text-[var(--accent)] text-xs font-medium">
              <Check className="w-3.5 h-3.5" />
              Actif
            </div>
          )}
        </div>
        <p className="text-xs text-[var(--text-secondary)] mt-1">{template.description}</p>
        <div className="flex gap-1.5 mt-3 flex-wrap">
          {template.tags.map(tag => (
            <span
              key={tag}
              className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[var(--accent)]/10 text-[var(--accent)]"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </button>
  );
}
