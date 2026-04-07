"use client";

import { useState, useCallback } from "react";

interface TranslateResult {
  translatedTitle: string;
  translatedIngredients: string;
  translatedSteps: string;
  targetLang: string;
}

interface UseRecipeTranslation {
  translate: (recipeId: string, targetLang: string) => Promise<TranslateResult | null>;
  isTranslating: boolean;
  error: string | null;
}

export function useRecipeTranslation(): UseRecipeTranslation {
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const translate = useCallback(async (recipeId: string, targetLang: string): Promise<TranslateResult | null> => {
    setIsTranslating(true);
    setError(null);

    try {
      const res = await fetch("/api/recipes/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipeId, targetLang }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erreur de traduction");
        return null;
      }

      return {
        translatedTitle: data.translatedTitle,
        translatedIngredients: data.translatedIngredients,
        translatedSteps: data.translatedSteps,
        targetLang: data.targetLang,
      };
    } catch {
      setError("Erreur réseau");
      return null;
    } finally {
      setIsTranslating(false);
    }
  }, []);

  return { translate, isTranslating, error };
}
