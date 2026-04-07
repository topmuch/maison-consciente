"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";

/* ═══════════════════════════════════════════════════════
   MAISON CONSCIENTE — Lightweight i18n Context

   Dynamic language switching with localStorage persistence.
   Supports 10 languages including RTL (Arabic).
   ═══════════════════════════════════════════════════════ */

export type Locale = "fr" | "en" | "es" | "de" | "it" | "pt" | "nl" | "pl" | "ja" | "ar";

export interface I18nDict {
  home: {
    greeting: string;
    presence: string;
    scan_prompt: string;
    dashboard: string;
    zones: string;
    scanner: string;
    history: string;
    messages: string;
    recipes: string;
    settings: string;
    tips: string;
    activity: string;
    ambiance: string;
    new_note: string;
    all_see: string;
    no_activity: string;
    no_messages: string;
    placeholder_note: string;
    last_sync: string;
    consciousness_active: string;
    occupants_detected: string;
    occupant_detected: string;
    logout: string;
    subscription_title: string;
    upgrade_cta: string;
  };
  hospitality: {
    greeting: string;
    checkin: string;
    guide: string;
    wifi: string;
    local_guide: string;
    contact_host: string;
    checkin_after: string;
    checkout_before: string;
    rules: string;
    info: string;
    rule_1: string;
    rule_2: string;
    rule_3: string;
    rule_4: string;
    journal: string;
    feedback: string;
    intelligent_guide: string;
    weather_loading: string;
    active_guests: string;
    travelers_present: string;
    suggestions_reason: string;
    space_traveler: string;
    space_personal: string;
    subscription_title: string;
    upgrade_cta: string;
  };
  common: {
    loading: string;
    save: string;
    close: string;
    cancel: string;
    confirm: string;
    error: string;
    success: string;
    offline: string;
    language: string;
    pricing: string;
    subscription: string;
    current_plan: string;
    manage: string;
    choose_plan: string;
    per_month: string;
    free: string;
    popular: string;
    features: string;
    unlimited: string;
    advanced_analytics: string;
    priority_support: string;
  };
}

/* ═══════════════════════════════════════════════════════
   Dictionaries — 10 languages
   ═══════════════════════════════════════════════════════ */

const dictionaries: Record<Locale, I18nDict> = {
  fr: {
    home: {
      greeting: "Bienvenue chez vous",
      presence: "Présence Active",
      scan_prompt: "Scanner un QR",
      dashboard: "Tableau de bord",
      zones: "Zones",
      scanner: "Scanner",
      history: "Historique",
      messages: "Messages",
      recipes: "Recettes",
      settings: "Paramètres",
      tips: "Conseils de la Maison",
      activity: "Activité Récente",
      ambiance: "Lancer Ambiance",
      new_note: "Nouvelle Note",
      all_see: "Tout voir",
      no_activity: "Aucune activité récente",
      no_messages: "Aucun message. La maison est silencieuse.",
      placeholder_note: "Laisser une note...",
      last_sync: "Dernière sync",
      consciousness_active: "Conscience active",
      occupants_detected: "occupants détectés",
      occupant_detected: "occupant détecté",
      logout: "Déconnexion",
      subscription_title: "Votre abonnement",
      upgrade_cta: "Passer à un plan supérieur",
    },
    hospitality: {
      greeting: "Bienvenue, voyageur",
      checkin: "Enregistrement",
      guide: "Guide Local",
      wifi: "Accès WiFi",
      local_guide: "Guide Local",
      contact_host: "Contacter l'hôte",
      checkin_after: "Check-in après 15h",
      checkout_before: "Check-out avant 11h",
      rules: "Règles",
      info: "Infos",
      rule_1: "Pas de fête ni de bruit après 22h",
      rule_2: "Pas de fumée à l'intérieur",
      rule_3: "Animaux autorisés sur demande préalable",
      rule_4: "Merci de laisser les lieux propres à votre départ",
      journal: "Carnet de Séjour",
      feedback: "Votre Avis",
      intelligent_guide: "Guide Intelligent",
      weather_loading: "Météo en cours...",
      active_guests: "Voyageurs actifs",
      travelers_present: "voyageurs présents",
      suggestions_reason: "Recommandé pour vous",
      space_traveler: "Espace Voyageur",
      space_personal: "Espace Personnel",
      subscription_title: "Abonnement Hôte",
      upgrade_cta: "Choisir un plan",
    },
    common: {
      loading: "Connexion...",
      save: "Enregistrer",
      close: "Fermer",
      cancel: "Annuler",
      confirm: "Confirmer",
      error: "Erreur",
      success: "Succès",
      offline: "Hors ligne",
      language: "Langue",
      pricing: "Tarifs",
      subscription: "Abonnement",
      current_plan: "Plan actuel",
      manage: "Gérer",
      choose_plan: "Choisir ce plan",
      per_month: "/mois",
      free: "Gratuit",
      popular: "Populaire",
      features: "Fonctionnalités",
      unlimited: "Illimité",
      advanced_analytics: "Analyses avancées",
      priority_support: "Support prioritaire",
    },
  },

  en: {
    home: {
      greeting: "Welcome Home",
      presence: "Active Presence",
      scan_prompt: "Scan a QR",
      dashboard: "Dashboard",
      zones: "Zones",
      scanner: "Scanner",
      history: "History",
      messages: "Messages",
      recipes: "Recipes",
      settings: "Settings",
      tips: "Home Tips",
      activity: "Recent Activity",
      ambiance: "Launch Ambiance",
      new_note: "New Note",
      all_see: "View all",
      no_activity: "No recent activity",
      no_messages: "No messages. The house is silent.",
      placeholder_note: "Leave a note...",
      last_sync: "Last sync",
      consciousness_active: "Consciousness active",
      occupants_detected: "occupants detected",
      occupant_detected: "occupant detected",
      logout: "Log out",
      subscription_title: "Your subscription",
      upgrade_cta: "Upgrade now",
    },
    hospitality: {
      greeting: "Welcome, traveler",
      checkin: "Check-in",
      guide: "Local Guide",
      wifi: "WiFi Access",
      local_guide: "Local Guide",
      contact_host: "Contact Host",
      checkin_after: "Check-in after 3 PM",
      checkout_before: "Check-out before 11 AM",
      rules: "Rules",
      info: "Info",
      rule_1: "No parties or noise after 10 PM",
      rule_2: "No smoking indoors",
      rule_3: "Pets allowed upon prior request",
      rule_4: "Please leave the place clean on departure",
      journal: "Travel Journal",
      feedback: "Your Review",
      intelligent_guide: "Smart Guide",
      weather_loading: "Loading weather...",
      active_guests: "Active guests",
      travelers_present: "travelers present",
      suggestions_reason: "Recommended for you",
      space_traveler: "Traveler Space",
      space_personal: "Personal Space",
      subscription_title: "Host subscription",
      upgrade_cta: "Choose a plan",
    },
    common: {
      loading: "Connecting...",
      save: "Save",
      close: "Close",
      cancel: "Cancel",
      confirm: "Confirm",
      error: "Error",
      success: "Success",
      offline: "Offline",
      language: "Language",
      pricing: "Pricing",
      subscription: "Subscription",
      current_plan: "Current plan",
      manage: "Manage",
      choose_plan: "Choose plan",
      per_month: "/month",
      free: "Free",
      popular: "Popular",
      features: "Features",
      unlimited: "Unlimited",
      advanced_analytics: "Advanced analytics",
      priority_support: "Priority support",
    },
  },

  es: {
    home: {
      greeting: "Bienvenido a casa",
      presence: "Presencia Activa",
      scan_prompt: "Escanear QR",
      dashboard: "Panel",
      zones: "Zonas",
      scanner: "Escanear",
      history: "Historial",
      messages: "Mensajes",
      recipes: "Recetas",
      settings: "Ajustes",
      tips: "Consejos del Hogar",
      activity: "Actividad Reciente",
      ambiance: "Iniciar Ambiente",
      new_note: "Nueva Nota",
      all_see: "Ver todo",
      no_activity: "Sin actividad reciente",
      no_messages: "Sin mensajes. La casa está en silencio.",
      placeholder_note: "Dejar una nota...",
      last_sync: "Última sync",
      consciousness_active: "Conciencia activa",
      occupants_detected: "ocupantes detectados",
      occupant_detected: "ocupante detectado",
      logout: "Cerrar sesión",
      subscription_title: "Tu suscripción",
      upgrade_cta: "Mejorar ahora",
    },
    hospitality: {
      greeting: "Bienvenido, viajero",
      checkin: "Registro",
      guide: "Guía Local",
      wifi: "Acceso WiFi",
      local_guide: "Guía Local",
      contact_host: "Contactar anfitrión",
      checkin_after: "Check-in después de las 15h",
      checkout_before: "Check-out antes de las 11h",
      rules: "Normas",
      info: "Info",
      rule_1: "No fiestas ni ruido después de las 22h",
      rule_2: "No fumar en el interior",
      rule_3: "Mascotas permitidas bajo petición previa",
      rule_4: "Por favor dejar el lugar limpio al partir",
      journal: "Diario de Viaje",
      feedback: "Tu Opinión",
      intelligent_guide: "Guía Inteligente",
      weather_loading: "Cargando clima...",
      active_guests: "Huéspedes activos",
      travelers_present: "viajeros presentes",
      suggestions_reason: "Recomendado para ti",
      space_traveler: "Espacio Viajero",
      space_personal: "Espacio Personal",
      subscription_title: "Suscripción Host",
      upgrade_cta: "Elegir un plan",
    },
    common: {
      loading: "Conectando...",
      save: "Guardar",
      close: "Cerrar",
      cancel: "Cancelar",
      confirm: "Confirmar",
      error: "Error",
      success: "Éxito",
      offline: "Sin conexión",
      language: "Idioma",
      pricing: "Precios",
      subscription: "Suscripción",
      current_plan: "Plan actual",
      manage: "Gestionar",
      choose_plan: "Elegir plan",
      per_month: "/mes",
      free: "Gratis",
      popular: "Popular",
      features: "Funciones",
      unlimited: "Ilimitado",
      advanced_analytics: "Análisis avanzados",
      priority_support: "Soporte prioritario",
    },
  },

  de: {
    home: {
      greeting: "Willkommen zu Hause",
      presence: "Aktive Anwesenheit",
      scan_prompt: "QR scannen",
      dashboard: "Übersicht",
      zones: "Zonen",
      scanner: "Scanner",
      history: "Verlauf",
      messages: "Nachrichten",
      recipes: "Rezepte",
      settings: "Einstellungen",
      tips: "Haustipps",
      activity: "Letzte Aktivität",
      ambiance: "Ambiente starten",
      new_note: "Neue Notiz",
      all_see: "Alle anzeigen",
      no_activity: "Keine aktuelle Aktivität",
      no_messages: "Keine Nachrichten. Das Haus ist ruhig.",
      placeholder_note: "Notiz hinterlassen...",
      last_sync: "Letzte Sync",
      consciousness_active: "Bewusstsein aktiv",
      occupants_detected: "Bewohner erkannt",
      occupant_detected: "Bewohner erkannt",
      logout: "Abmelden",
      subscription_title: "Ihr Abonnement",
      upgrade_cta: "Jetzt upgraden",
    },
    hospitality: {
      greeting: "Willkommen, Reisender",
      checkin: "Check-in",
      guide: "Lokalführer",
      wifi: "WiFi-Zugang",
      local_guide: "Lokalführer",
      contact_host: "Gastgeber kontaktieren",
      checkin_after: "Check-in ab 15 Uhr",
      checkout_before: "Check-out bis 11 Uhr",
      rules: "Hausregeln",
      info: "Informationen",
      rule_1: "Keine Partys oder Lärm nach 22 Uhr",
      rule_2: "Kein Rauchen im Inneren",
      rule_3: "Haustiere auf Anfrage erlaubt",
      rule_4: "Bitte hinterlassen Sie den Ort sauber",
      journal: "Reisetagebuch",
      feedback: "Ihre Bewertung",
      intelligent_guide: "Intelligenter Führer",
      weather_loading: "Wetter wird geladen...",
      active_guests: "Aktive Gäste",
      travelers_present: "Reisende anwesend",
      suggestions_reason: "Empfohlen für Sie",
      space_traveler: "Reisenderraum",
      space_personal: "Privatraum",
      subscription_title: "Gastgeber-Abo",
      upgrade_cta: "Plan wählen",
    },
    common: {
      loading: "Verbinden...",
      save: "Speichern",
      close: "Schließen",
      cancel: "Abbrechen",
      confirm: "Bestätigen",
      error: "Fehler",
      success: "Erfolg",
      offline: "Offline",
      language: "Sprache",
      pricing: "Preise",
      subscription: "Abonnement",
      current_plan: "Aktueller Plan",
      manage: "Verwalten",
      choose_plan: "Plan wählen",
      per_month: "/Monat",
      free: "Kostenlos",
      popular: "Beliebt",
      features: "Funktionen",
      unlimited: "Unbegrenzt",
      advanced_analytics: "Erweiterte Analysen",
      priority_support: "Prioritäts-Support",
    },
  },

  it: {
    home: {
      greeting: "Benvenuto a casa",
      presence: "Presenza Attiva",
      scan_prompt: "Scansiona QR",
      dashboard: "Cruscotto",
      zones: "Zone",
      scanner: "Scanner",
      history: "Cronologia",
      messages: "Messaggi",
      recipes: "Ricette",
      settings: "Impostazioni",
      tips: "Consigli di Casa",
      activity: "Attività Recente",
      ambiance: "Avvia Ambienza",
      new_note: "Nuova Nota",
      all_see: "Vedi tutto",
      no_activity: "Nessuna attività recente",
      no_messages: "Nessun messaggio. La casa è silenziosa.",
      placeholder_note: "Lascia una nota...",
      last_sync: "Ultima sinc",
      consciousness_active: "Coscienza attiva",
      occupants_detected: "occupanti rilevati",
      occupant_detected: "occupante rilevato",
      logout: "Esci",
      subscription_title: "Il tuo abbonamento",
      upgrade_cta: "Aggiorna ora",
    },
    hospitality: {
      greeting: "Benvenuto, viaggiatore",
      checkin: "Check-in",
      guide: "Guida Locale",
      wifi: "Accesso WiFi",
      local_guide: "Guida Locale",
      contact_host: "Contatta l'host",
      checkin_after: "Check-in dopo le 15",
      checkout_before: "Check-out prima delle 11",
      rules: "Regole",
      info: "Info",
      rule_1: "Niente feste o rumore dopo le 22",
      rule_2: "Vietato fumare all'interno",
      rule_3: "Animali ammessi su richiesta",
      rule_4: "Pulire prima di partire",
      journal: "Diario di Viaggio",
      feedback: "La Tua Opinione",
      intelligent_guide: "Guida Intelligente",
      weather_loading: "Caricamento meteo...",
      active_guests: "Ospiti attivi",
      travelers_present: "viaggiatori presenti",
      suggestions_reason: "Consigliato per te",
      space_traveler: "Spazio Viaggiatore",
      space_personal: "Spazio Personale",
      subscription_title: "Abbonamento Host",
      upgrade_cta: "Scegli il piano",
    },
    common: {
      loading: "Connessione...",
      save: "Salva",
      close: "Chiudi",
      cancel: "Annulla",
      confirm: "Conferma",
      error: "Errore",
      success: "Successo",
      offline: "Offline",
      language: "Lingua",
      pricing: "Prezzi",
      subscription: "Abbonamento",
      current_plan: "Piano attuale",
      manage: "Gestisci",
      choose_plan: "Scegli piano",
      per_month: "/mese",
      free: "Gratuito",
      popular: "Popolare",
      features: "Funzionalità",
      unlimited: "Illimitato",
      advanced_analytics: "Analisi avanzate",
      priority_support: "Supporto prioritario",
    },
  },

  pt: {
    home: {
      greeting: "Bem-vindo a casa",
      presence: "Presença Ativa",
      scan_prompt: "Escanear QR",
      dashboard: "Painel",
      zones: "Zonas",
      scanner: "Scanner",
      history: "Histórico",
      messages: "Mensagens",
      recipes: "Receitas",
      settings: "Configurações",
      tips: "Dicas de Casa",
      activity: "Atividade Recente",
      ambiance: "Iniciar Ambiente",
      new_note: "Nova Nota",
      all_see: "Ver tudo",
      no_activity: "Sem atividade recente",
      no_messages: "Sem mensagens. A casa está em silêncio.",
      placeholder_note: "Deixar uma nota...",
      last_sync: "Última sync",
      consciousness_active: "Consciência ativa",
      occupants_detected: "ocupantes detectados",
      occupant_detected: "ocupante detectado",
      logout: "Sair",
      subscription_title: "Sua assinatura",
      upgrade_cta: "Atualize agora",
    },
    hospitality: {
      greeting: "Bem-vindo, viajante",
      checkin: "Check-in",
      guide: "Guia Local",
      wifi: "Acesso WiFi",
      local_guide: "Guia Local",
      contact_host: "Contatar anfitrião",
      checkin_after: "Check-in após 15h",
      checkout_before: "Check-out antes das 11h",
      rules: "Regras",
      info: "Info",
      rule_1: "Sem festas ou barulho após 22h",
      rule_2: "Proibido fumar dentro",
      rule_3: "Pets permitidos mediante solicitação",
      rule_4: "Deixe o local limpo ao partir",
      journal: "Diário de Viagem",
      feedback: "Sua Opinião",
      intelligent_guide: "Guia Inteligente",
      weather_loading: "Carregando clima...",
      active_guests: "Hóspedes ativos",
      travelers_present: "viajantes presentes",
      suggestions_reason: "Recomendado para você",
      space_traveler: "Espaço Viajante",
      space_personal: "Espaço Pessoal",
      subscription_title: "Assinatura Host",
      upgrade_cta: "Escolha o plano",
    },
    common: {
      loading: "Conectando...",
      save: "Salvar",
      close: "Fechar",
      cancel: "Cancelar",
      confirm: "Confirmar",
      error: "Erro",
      success: "Sucesso",
      offline: "Offline",
      language: "Idioma",
      pricing: "Preços",
      subscription: "Assinatura",
      current_plan: "Plano atual",
      manage: "Gerenciar",
      choose_plan: "Escolher plano",
      per_month: "/mês",
      free: "Gratuito",
      popular: "Popular",
      features: "Funcionalidades",
      unlimited: "Ilimitado",
      advanced_analytics: "Análises avançadas",
      priority_support: "Suporte prioritário",
    },
  },

  nl: {
    home: {
      greeting: "Welkom thuis",
      presence: "Actieve Aanwezigheid",
      scan_prompt: "QR scannen",
      dashboard: "Overzicht",
      zones: "Zones",
      scanner: "Scanner",
      history: "Geschiedenis",
      messages: "Berichten",
      recipes: "Recepten",
      settings: "Instellingen",
      tips: "Houstips",
      activity: "Recente Activiteit",
      ambiance: "Sfeer starten",
      new_note: "Nieuwe Notitie",
      all_see: "Alles bekijken",
      no_activity: "Geen recente activiteit",
      no_messages: "Geen berichten. Het huis is stil.",
      placeholder_note: "Laat een notitie achter...",
      last_sync: "Laatste sync",
      consciousness_active: "Bewustzijn actief",
      occupants_detected: "bewoners gedetecteerd",
      occupant_detected: "bewoner gedetecteerd",
      logout: "Uitloggen",
      subscription_title: "Uw abonnement",
      upgrade_cta: "Nu upgraden",
    },
    hospitality: {
      greeting: "Welkom, reiziger",
      checkin: "Check-in",
      guide: "Lokale Gids",
      wifi: "WiFi-toegang",
      local_guide: "Lokale Gids",
      contact_host: "Neem contact op",
      checkin_after: "Check-in na 15:00",
      checkout_before: "Check-out voor 11:00",
      rules: "Huisregels",
      info: "Info",
      rule_1: "Geen feesten of lawaai na 22:00",
      rule_2: "Niet roken binnen",
      rule_3: "Huisdieren op aanvraag toegestaan",
      rule_4: "Laat de plek schoon achter",
      journal: "Reisjournaal",
      feedback: "Uw Beoordeling",
      intelligent_guide: "Slimme Gids",
      weather_loading: "Weer laden...",
      active_guests: "Actieve gasten",
      travelers_present: "reizigers aanwezig",
      suggestions_reason: "Aanbevolen voor u",
      space_traveler: "Reizigersruimte",
      space_personal: "Persoonlijke Ruimte",
      subscription_title: "Host Abonnement",
      upgrade_cta: "Kies een plan",
    },
    common: {
      loading: "Verbinden...",
      save: "Opslaan",
      close: "Sluiten",
      cancel: "Annuleren",
      confirm: "Bevestigen",
      error: "Fout",
      success: "Succes",
      offline: "Offline",
      language: "Taal",
      pricing: "Prijzen",
      subscription: "Abonnement",
      current_plan: "Huidig plan",
      manage: "Beheer",
      choose_plan: "Kies plan",
      per_month: "/maand",
      free: "Gratis",
      popular: "Populair",
      features: "Functies",
      unlimited: "Ongelimiteerd",
      advanced_analytics: "Geavanceerde analyses",
      priority_support: "Prioriteitsondersteuning",
    },
  },

  pl: {
    home: {
      greeting: "Witaj w domu",
      presence: "Aktywna Obecność",
      scan_prompt: "Skanuj QR",
      dashboard: "Panel",
      zones: "Strefy",
      scanner: "Skaner",
      history: "Historia",
      messages: "Wiadomości",
      recipes: "Przepisy",
      settings: "Ustawienia",
      tips: "Porady Domu",
      activity: "Ostatnia Aktywność",
      ambiance: "Uruchom Ambient",
      new_note: "Nowa Notatka",
      all_see: "Zobacz wszystko",
      no_activity: "Brak ostatniej aktywności",
      no_messages: "Brak wiadomości. Dom jest cichy.",
      placeholder_note: "Zostaw notatkę...",
      last_sync: "Ostatnia sync",
      consciousness_active: "Świadomość aktywna",
      occupants_detected: "mieszkańców wykryto",
      occupant_detected: "mieszkańca wykryto",
      logout: "Wyloguj",
      subscription_title: "Twoja subskrypcja",
      upgrade_cta: "Ulepsz teraz",
    },
    hospitality: {
      greeting: "Witaj, podróżniku",
      checkin: "Zameldowanie",
      guide: "Lokalny Przewodnik",
      wifi: "Dostęp WiFi",
      local_guide: "Lokalny Przewodnik",
      contact_host: "Skontaktuj się",
      checkin_after: "Zameldowanie po 15:00",
      checkout_before: "Wymeldowanie przed 11:00",
      rules: "Zasady",
      info: "Informacje",
      rule_1: "Brak imprez i hałasu po 22:00",
      rule_2: "Zakaz palenia wewnątrz",
      rule_3: "Zwierzęta dozwolone na życzenie",
      rule_4: "Proszę zostawić miejsce czyste",
      journal: "Dziennik Podróży",
      feedback: "Twoja Opinia",
      intelligent_guide: "Inteligentny Przewodnik",
      weather_loading: "Pogoda ładowanie...",
      active_guests: "Aktywni goście",
      travelers_present: "podróżnych obecnych",
      suggestions_reason: "Polecane dla Ciebie",
      space_traveler: "Przestrzeń Podróżnika",
      space_personal: "Przestrzeń Osobista",
      subscription_title: "Subskrypcja Hosta",
      upgrade_cta: "Wybierz plan",
    },
    common: {
      loading: "Łączenie...",
      save: "Zapisz",
      close: "Zamknij",
      cancel: "Anuluj",
      confirm: "Potwierdź",
      error: "Błąd",
      success: "Sukces",
      offline: "Offline",
      language: "Język",
      pricing: "Cennik",
      subscription: "Subskrypcja",
      current_plan: "Obecny plan",
      manage: "Zarządzaj",
      choose_plan: "Wybierz plan",
      per_month: "/miesiąc",
      free: "Bezpłatny",
      popular: "Popularny",
      features: "Funkcje",
      unlimited: "Nielimitowany",
      advanced_analytics: "Zaawansowana analityka",
      priority_support: "Priorytetowe wsparcie",
    },
  },

  ja: {
    home: {
      greeting: "おかえりなさい",
      presence: "在宅中",
      scan_prompt: "QRをスキャン",
      dashboard: "ダッシュボード",
      zones: "ゾーン",
      scanner: "スキャナー",
      history: "履歴",
      messages: "メッセージ",
      recipes: "レシピ",
      settings: "設定",
      tips: "ホームのヒント",
      activity: "最近のアクティビティ",
      ambiance: "アンビエンス再生",
      new_note: "新しいメモ",
      all_see: "すべて表示",
      no_activity: "最近のアクティビティなし",
      no_messages: "メッセージなし。家は静かです。",
      placeholder_note: "メモを残す...",
      last_sync: "最終同期",
      consciousness_active: "意識アクティブ",
      occupants_detected: "人が検出されました",
      occupant_detected: "人が検出されました",
      logout: "ログアウト",
      subscription_title: "サブスクリプション",
      upgrade_cta: "今すぐアップグレード",
    },
    hospitality: {
      greeting: "ようこそ、旅人よ",
      checkin: "チェックイン",
      guide: "ローカルガイド",
      wifi: "WiFiアクセス",
      local_guide: "ローカルガイド",
      contact_host: "ホストに連絡",
      checkin_after: "チェックイン 15時以降",
      checkout_before: "チェックアウト 11時まで",
      rules: "ルール",
      info: "情報",
      rule_1: "22時以降パーティーや騒音禁止",
      rule_2: "館内禁煙",
      rule_3: "事前申請でペット可",
      rule_4: "退室時は綺麗にしてください",
      journal: "トラベルジャーナル",
      feedback: "ご意見",
      intelligent_guide: "スマートガイド",
      weather_loading: "天気を読み込み中...",
      active_guests: "アクティブなゲスト",
      travelers_present: "人の旅人が滞在中",
      suggestions_reason: "おすすめ",
      space_traveler: "トラベラースペース",
      space_personal: "パーソナルスペース",
      subscription_title: "ホスト向けプラン",
      upgrade_cta: "プランを選択",
    },
    common: {
      loading: "接続中...",
      save: "保存",
      close: "閉じる",
      cancel: "キャンセル",
      confirm: "確認",
      error: "エラー",
      success: "成功",
      offline: "オフライン",
      language: "言語",
      pricing: "料金",
      subscription: "サブスクリプション",
      current_plan: "現在のプラン",
      manage: "管理",
      choose_plan: "プランを選択",
      per_month: "/月",
      free: "無料",
      popular: "人気",
      features: "機能",
      unlimited: "無制限",
      advanced_analytics: "高度な分析",
      priority_support: "優先サポート",
    },
  },

  ar: {
    home: {
      greeting: "مرحباً بك في المنزل",
      presence: "الوجود النشط",
      scan_prompt: "مسح QR",
      dashboard: "لوحة التحكم",
      zones: "المناطق",
      scanner: "الماسح",
      history: "السجل",
      messages: "الرسائل",
      recipes: "الوصفات",
      settings: "الإعدادات",
      tips: "نصائح المنزل",
      activity: "النشاط الأخير",
      ambiance: "تشغيل الأجواء",
      new_note: "ملاحظة جديدة",
      all_see: "عرض الكل",
      no_activity: "لا يوجد نشاط حديث",
      no_messages: "لا توجد رسائل. المنزل هادئ.",
      placeholder_note: "اترك ملاحظة...",
      last_sync: "آخر مزامنة",
      consciousness_active: "الوعي نشط",
      occupants_detected: "تم اكتشاف أشخاص",
      occupant_detected: "تم اكتشاف شخص",
      logout: "تسجيل الخروج",
      subscription_title: "اشتراكك",
      upgrade_cta: "قم بالترقية الآن",
    },
    hospitality: {
      greeting: "أهلاً بك أيها المسافر",
      checkin: "تسجيل الدخول",
      guide: "الدليل المحلي",
      wifi: "الوصول للواي فاي",
      local_guide: "الدليل المحلي",
      contact_host: "تواصل مع المضيف",
      checkin_after: "تسجيل الدخول بعد الساعة 3 مساءً",
      checkout_before: "تسجيل الخروج قبل الساعة 11 صباحاً",
      rules: "القواعد",
      info: "معلومات",
      rule_1: "لا حفلات أو ضوضاء بعد الساعة 10 مساءً",
      rule_2: "ممنوع التدخين داخل المبنى",
      rule_3: "الحيوانات الأليفة مسموحة بناءً على طلب مسبق",
      rule_4: "يرجى ترك المكان نظيفاً عند المغادرة",
      journal: "يوميات الرحلة",
      feedback: "رأيك",
      intelligent_guide: "دليل ذكي",
      weather_loading: "جاري تحميل الطقس...",
      active_guests: "الضيوف النشطون",
      travelers_present: "مسافرين حاليون",
      suggestions_reason: "موصى به لك",
      space_traveler: "مساحة المسافر",
      space_personal: "المساحة الشخصية",
      subscription_title: "اشتراك المضيف",
      upgrade_cta: "اختر خطة",
    },
    common: {
      loading: "جاري الاتصال...",
      save: "حفظ",
      close: "إغلاق",
      cancel: "إلغاء",
      confirm: "تأكيد",
      error: "خطأ",
      success: "نجاح",
      offline: "غير متصل",
      language: "اللغة",
      pricing: "الأسعار",
      subscription: "الاشتراك",
      current_plan: "الخطة الحالية",
      manage: "إدارة",
      choose_plan: "اختر خطة",
      per_month: "/شهر",
      free: "مجاني",
      popular: "شائع",
      features: "الميزات",
      unlimited: "غير محدود",
      advanced_analytics: "تحليلات متقدمة",
      priority_support: "دعم ذو أولوية",
    },
  },
};

/* ═══════════════════════════════════════════════════════
   Locale metadata
   ═══════════════════════════════════════════════════════ */

export const LOCALE_LABELS: Record<Locale, string> = {
  fr: "Français",
  en: "English",
  es: "Español",
  de: "Deutsch",
  it: "Italiano",
  pt: "Português",
  nl: "Nederlands",
  pl: "Polski",
  ja: "日本語",
  ar: "العربية",
};

export const LOCALES: Locale[] = [
  "fr",
  "en",
  "es",
  "de",
  "it",
  "pt",
  "nl",
  "pl",
  "ja",
  "ar",
];

/* ═══════════════════════════════════════════════════════
   RTL detection
   ═══════════════════════════════════════════════════════ */

export function isRTLLocale(locale: Locale): boolean {
  return locale === "ar";
}

/* ═══════════════════════════════════════════════════════
   Auto-detection helper
   ═══════════════════════════════════════════════════════ */

function detectBrowserLocale(): Locale {
  try {
    const nav = navigator.language || "";
    const code = nav.split("-")[0]?.toLowerCase();
    if (code && (LOCALES as readonly string[]).includes(code)) {
      return code as Locale;
    }
  } catch {
    // navigator unavailable
  }
  return "fr";
}

/* ═══════════════════════════════════════════════════════
   Context
   ═══════════════════════════════════════════════════════ */

interface I18nContextType {
  locale: Locale;
  t: I18nDict;
  setLocale: (l: Locale) => void;
  isRTL: boolean;
}

const I18nContext = createContext<I18nContextType | null>(null);

const STORAGE_KEY = "mc_locale";

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Locale | null;
      if (saved && dictionaries[saved]) return saved;
    } catch {
      // localStorage unavailable
    }
    return detectBrowserLocale();
  });

  const isRTL = isRTLLocale(locale);

  /* ── Change locale + persist ── */
  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {
      // localStorage unavailable
    }
  }, []);

  /* ── Sync RTL dir on <html> ── */
  useEffect(() => {
    const dir = isRTL ? "rtl" : "ltr";
    document.documentElement.dir = dir;
    document.documentElement.lang = locale;
  }, [locale, isRTL]);

  return (
    <I18nContext.Provider value={{ locale, t: dictionaries[locale], setLocale, isRTL }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextType {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return ctx;
}
