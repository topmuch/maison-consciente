/* ═══════════════════════════════════════════════════════════════
   MOCK DATA RÉELLES — Démo Interactive Maellis
   Toutes les données utilisées pour peupler les widgets de démo
   ═══════════════════════════════════════════════════════════════ */

export interface NewsItem {
  id: string;
  title: string;
  source: string;
  category: string;
  time: string;
  imageUrl?: string;
}

export interface HoroscopeEntry {
  signe: string;
  icon: string;
  periode: string;
  humeur: string;
 amour: string;
  travail: string;
  argent: string;
  conseil: string;
  texte: string;
}

export interface Reminder {
  id: string;
  label: string;
  time: string;
  icon: string;
  done: boolean;
}

export interface Recipe {
  id: string;
  name: string;
  time: string;
  difficulty: string;
  image: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface Activity {
  id: string;
  name: string;
  distance: string;
  duration: string;
  description: string;
  category: string;
  whatsappLink?: string;
  isPartner: boolean;
}

export interface ServiceItem {
  id: string;
  name: string;
  description: string;
  price: string;
  icon: string;
}

/* ─── ACTUALITÉS (France Info & Le Monde) ─── */
export const newsItems: NewsItem[] = [
  {
    id: 'n1',
    title: '"Je me suis réveillée avec des coups portés à la porte, la digue avait cédé"',
    source: 'France Info',
    category: 'Crues Lot-et-Garonne',
    time: 'Il y a 2h',
  },
  {
    id: 'n2',
    title: 'Ukraine : Macron, Merz, Starmer et Tusk ensemble à Kiev',
    source: 'Le Monde',
    category: 'Géopolitique',
    time: 'Il y a 4h',
  },
  {
    id: 'n3',
    title: "Après une attaque de l'Inde, le Pakistan lance l'opération mur de plomb",
    source: 'Le Monde',
    category: 'Asie',
    time: 'Il y a 5h',
  },
  {
    id: 'n4',
    title: 'Réforme des retraites : le Conseil constitutionnel rend sa décision ce jeudi',
    source: 'France Info',
    category: 'Politique',
    time: 'Il y a 6h',
  },
  {
    id: 'n5',
    title: 'Championnat de France : le PSG tacle Lyon au Parc des Princes',
    source: 'Le Monde',
    category: 'Sport',
    time: 'Il y a 8h',
  },
];

/* ─── HOROSCOPE (Mon-Horoscope-du-Jour) ─── */
export const horoscopeData: Record<string, HoroscopeEntry> = {
  belier: {
    signe: 'Bélier',
    icon: '♈',
    periode: '21 mars - 19 avril',
    humeur: 'Votre énergie est au rendez-vous, les opportunités se multiplient.',
    amour: 'Un rendez-vous inattendu pourrait bouleverser votre quotidien amoureux.',
    travail: 'Des projets ambitieux se concrétisent. Restez concentré.',
    argent: 'Une dépense imprévue mais gérable. Gardez le cap.',
    conseil: 'Osez prendre des initiatives sans hésiter.',
    texte: "Certains agissent dans l'ombre pour tenter d'orienter leur destinée... Votre détermination fait la différence en ce moment. Les astres vous poussent à l'action et vous n'êtes pas en reste. Humeur du mois : Vous œuvrez dans l'ombre, jouez les tacticiens...",
  },
  taureau: {
    signe: 'Taureau',
    icon: '♉',
    periode: '20 avril - 20 mai',
    humeur: 'Vous œuvrez dans l\'ombre, jouez les tacticiens.',
    amour: 'D\'autres priorités retiennent votre attention, mais votre cœur reste attentif.',
    travail: 'La patience paie. Un dossier avance discrètement en votre faveur.',
    argent: 'Des économies se profilent grâce à votre gestion rigoureuse.',
    conseil: 'Cheminer sans trop vous faire remarquer vous protégera des jalousies.',
    texte: "Certains agissent dans l'ombre pour tenter d'orienter leur destinée... Humeur du mois : Vous œuvrez dans l'ombre, jouez les tacticiens... Amour : D'autres priorités... Conseil : Cheminer sans trop vous faire remarquer.",
  },
  gemeaux: {
    signe: 'Gémeaux',
    icon: '♊',
    periode: '21 mai - 20 juin',
    humeur: 'La communication est votre atout majeur cette semaine.',
    amour: 'Des échanges profonds renforcent vos liens les plus précieux.',
    travail: 'Nouveaux contacts professionnels prometteurs. Réseau actif.',
    argent: 'Un projet collaboratif pourrait générer des revenus intéressants.',
    conseil: 'Écoutez avant de parler, vos interlocuteurs ont beaucoup à vous apprendre.',
    texte: "La dualité qui vous caractérise se transforme en force cette semaine. Vos deux facettes s'harmonisent pour créer une synergie unique...",
  },
  cancer: {
    signe: 'Cancer',
    icon: '♋',
    periode: '21 juin - 22 juillet',
    humeur: 'Vous sentez que votre parcours change de direction.',
    amour: 'Une transformation marquée dans vos liens affectifs vous fait grandir.',
    travail: 'Votre intuition guide vos décisions professionnelles avec justesse.',
    argent: 'Une opportunité financière familiale se présente. Saisissez-la.',
    conseil: 'Faites confiance à vos ressentis, ils sont plus fiables que vous ne le pensez.',
    texte: "Certains vivent une transformation marquée dans leurs liens... Humeur : Vous sentez que votre parcours change... Votre sensibilité est votre plus grande force en ce moment.",
  },
  lion: {
    signe: 'Lion',
    icon: '♌',
    periode: '23 juillet - 22 août',
    humeur: 'Si vos intentions sont bonnes, tout s\'arrangera.',
    amour: 'Une autre version du lien amoureux s\'offre à vous, plus authentique.',
    travail: 'Votre leadership naturel inspire votre entourage professionnel.',
    argent: 'Un investissement passé porte enfin ses fruits. Célébrez.',
    conseil: 'Montrez l\'exemple par l\'humilité plutôt que par la force.',
    texte: "Certains, en pleine refonte de leur univers relationnel, découvrent des facettes inédites de leur personnalité... Humeur : Si vos intentions sont bonnes... Amour : Une autre version du lien.",
  },
  vierge: {
    signe: 'Vierge',
    icon: '♍',
    periode: '23 août - 22 septembre',
    humeur: 'Votre souci du détail vous distingue cette semaine.',
    amour: 'Un geste attentionné fait toute la différence dans votre couple.',
    travail: 'La rigueur porte ses fruits. Un projet complexe s\'achève.',
    argent: 'Budget maîtrisé, épargne confortable. Continuez sur cette lancée.',
    conseil: 'Relâchez la pression sur vous-même. La perfection n\'est pas de ce monde.',
    texte: "Votre analytical mind is working overtime this week. Channel that energy into something creative and unexpected...",
  },
  balance: {
    signe: 'Balance',
    icon: '♎',
    periode: '23 septembre - 22 octobre',
    humeur: 'L\'équilibre que vous recherchez se rapproche.',
    amour: 'L\'harmonie règne dans vos relations les plus importantes.',
    travail: 'Un compromis habile débloque une situation délicate.',
    argent: 'Partage équitable des dépenses. La justice règne.',
    conseil: 'Faites confiance à votre sens inné de la justice.',
    texte: "La balance penche en votre faveur cette semaine. Vos efforts pour maintenir l'harmonie autour de vous portent leurs fruits...",
  },
  scorpion: {
    signe: 'Scorpion',
    icon: '♏',
    periode: '23 octobre - 21 novembre',
    humeur: 'Votre intensité attire autant qu\'elle fascine.',
    amour: 'Une passion nouvelle ou ravivée transforme votre quotidien.',
    travail: 'Votre perspicacité démasque une opportunité cachée.',
    argent: 'Un placement judicieux se révèle très rentable.',
    conseil: 'Utilisez votre pouvoir de transformation pour le bien commun.',
    texte: "Votre profondeur émotionnelle est une richesse inestimable. Ceux qui vous connaissent vraiment savent qu'il y a bien plus en vous que ce que vous montrez...",
  },
  sagittaire: {
    signe: 'Sagittaire',
    icon: '♐',
    periode: '22 novembre - 21 décembre',
    humeur: 'L\'aventure vous appelle, ne résistez pas.',
    amour: 'Un voyage ou un changement de décor rapproche les cœurs.',
    travail: 'Une opportunité internationale se présente. Osez.',
    argent: 'Les dépenses liées aux voyages sont des investissements en vous.',
    conseil: 'Élargissez vos horizons, littéralement et figurément.',
    texte: "Le globe-trotter astral que vous êtes trouve satisfaction cette semaine. Des nouvelles d'ailleurs stimulent votre curiosité insatiable...",
  },
  capricorne: {
    signe: 'Capricorne',
    icon: '♑',
    periode: '22 décembre - 19 janvier',
    humeur: 'Votre détermination monte en flèche.',
    amour: 'La stabilité que vous offrez rassure votre partenaire.',
    travail: 'Une promotion ou une reconnaissance arrive enfin.',
    argent: 'Vos efforts financiers de long terme commencent à payer.',
    conseil: 'Célébrez chaque victoire, même les plus petites.',
    texte: "Le sommet est proche, continuez votre ascension. Votre discipline et votre patience sont exemplaires...",
  },
  verseau: {
    signe: 'Verseau',
    icon: '♒',
    periode: '20 janvier - 18 février',
    humeur: 'Votre originalité est votre meilleure arme.',
    amour: 'Une connexion intellectuelle nourrit votre vie amoureuse.',
    travail: 'L\'innovation est au rendez-vous. Pensez hors des sentiers battus.',
    argent: 'Un projet technologique ou créatif génère des revenus.',
    conseil: 'Partagez vos idées visionnaires avec ceux qui sauront les apprécier.',
    texte: "L'éclair de génie qui vous traverse pourrait changer la donne. Votre vision du futur inspire votre entourage...",
  },
  poissons: {
    signe: 'Poissons',
    icon: '♓',
    periode: '19 février - 20 mars',
    humeur: 'Votre intuition est au plus haut point.',
    amour: 'Un rêve partagé renforce votre complicité.',
    travail: 'La créativité débordante facilite la résolution de problèmes.',
    argent: 'Évitez les décisions impulsives. Réfléchissez avant d\'agir.',
    conseil: 'Méditez et reconnectez-vous avec votre monde intérieur.',
    texte: "Les eaux profondes de votre inconscient remontent à la surface. Écoutez les messages que vos rêves vous envoient...",
  },
};

export const horoscopeSigns = Object.keys(horoscopeData);

/* ─── CONFIGURATION PARTICULIER (Famille Martin) ─── */
export const familleConfig = {
  name: 'Famille Martin',
  members: [
    { id: 'm1', name: 'Paul', role: 'Enfant', avatar: 'P', color: 'from-blue-400 to-blue-600' },
    { id: 'm2', name: 'Maman', role: 'Parent', avatar: 'M', color: 'from-amber-400 to-amber-600' },
    { id: 'm3', name: 'Papa', role: 'Parent', avatar: 'D', color: 'from-emerald-400 to-emerald-600' },
  ],
  reminders: [
    { id: 'r1', label: 'Prendre vitamines', time: '08h00', icon: '💊', done: false },
    { id: 'r2', label: 'Appeler Mamie', time: '18h00', icon: '📞', done: false },
    { id: 'r3', label: 'Cours de piano Paul', time: '16h30', icon: '🎹', done: true },
    { id: 'r4', label: 'Courses marché', time: '10h00', icon: '🛒', done: true },
  ] as Reminder[],
  recipes: [
    { id: 'rc1', name: 'Gratin Dauphinois', time: '1h15', difficulty: 'Facile', image: '🧀' },
    { id: 'rc2', name: 'Salade César', time: '20 min', difficulty: 'Très facile', image: '🥗' },
    { id: 'rc3', name: 'Quiche Lorraine', time: '45 min', difficulty: 'Moyen', image: '🥧' },
  ] as Recipe[],
  faq: [
    { question: 'Comment se connecter au WiFi ?', answer: 'Réseau : MartinFamily | Mot de passe : Martin2024!' },
    { question: 'Où est la télécommande TV ?', answer: 'Télécommande bleue dans le tiroir du salon.' },
    { question: 'Comment régler la climatisation ?', answer: 'Mode COOL, 22°C recommandé. Télécommande sur la table basse.' },
    { question: 'Où sont les clés de la boîte aux lettres ?', answer: 'Porte-clés marron sur le meuble d\'entrée.' },
  ] as FaqItem[],
  shoppingList: [
    'Lait demi-écrémé',
    'Pain complet',
    'Œufs (x12)',
    'Fromage râpé',
    'Pommes de terre (1kg)',
    'Crème fraîche',
    'Jambon blanc',
  ],
  weather: {
    temp: '18°C',
    condition: 'Ensoleillé',
    icon: '☀️',
    humidity: '45%',
    wind: '12 km/h',
    city: 'Bordeaux',
  },
  greeting: 'Bonjour Paul ! 🌞',
};

/* ─── CONFIGURATION AIRBNB (Villa Azur - Nice) ─── */
export const airbnbConfig = {
  name: 'Villa Azur',
  location: 'Nice, Côte d\'Azur',
  hostName: 'Isabelle',
  guest: {
    name: 'Sophie',
    checkin: 'Aujourd\'hui',
    checkout: 'Demain 11h',
    nights: 1,
  },
  wifi: {
    network: 'VillaAzur_Guest',
    password: 'Soleil2026',
  },
  activities: [
    {
      id: 'a1',
      name: 'Promenade des Anglais',
      distance: '5 min',
      duration: '1h',
      description: 'Balade mythique bord de mer avec vue sur la Méditerranée',
      category: 'Bord de mer',
      whatsappLink: 'https://wa.me/33612345678?text=Bonjour, je souhaite réserver la Promenade des Anglais',
      isPartner: true,
    },
    {
      id: 'a2',
      name: 'Vieux Nice Food Tour',
      distance: '10 min',
      duration: '2h30',
      description: 'Découverte gastronomique des spécialités niçoises dans la Vieille Ville',
      category: 'Gastronomie',
      whatsappLink: 'https://wa.me/33612345678?text=Bonjour, je souhaite réserver le Vieux Nice Food Tour',
      isPartner: true,
    },
    {
      id: 'a3',
      name: 'Château de Nice & Parc',
      distance: '15 min',
      duration: '1h30',
      description: 'Panorama exceptionnel et cascade dans un cadre verdoyant',
      category: 'Nature',
      isPartner: false,
    },
    {
      id: 'a4',
      name: 'Marché aux Fleurs Cours Saleya',
      distance: '10 min',
      duration: '45 min',
      description: 'Marché coloré aux senteurs de Provence, ouvert tous les matins',
      category: 'Découverte',
      isPartner: false,
    },
    {
      id: 'a5',
      name: 'Musée Matisse',
      distance: '20 min',
      duration: '2h',
      description: 'Collection exceptionnelle du maître de la couleur',
      category: 'Culture',
      whatsappLink: 'https://wa.me/33612345678?text=Bonjour, je souhaite des informations sur le Musée Matisse',
      isPartner: true,
    },
  ] as Activity[],
  services: [
    { id: 's1', name: 'Ménage Supplémentaire', description: 'Service de ménage professionnel pour votre séjour', price: '35€', icon: '🧹' },
    { id: 's2', name: 'Chef à Domicile', description: 'Repas gastronomique préparé chez vous par un chef', price: '120€', icon: '👨‍🍳' },
    { id: 's3', name: 'Transfert Aéroport', description: 'Navette privée aéroport Nice Côte d\'Azur', price: '45€', icon: '🚗' },
    { id: 's4', name: 'Massage Bien-être', description: 'Soin relaxant à domicile (1h)', price: '80€', icon: '💆' },
  ] as ServiceItem[],
  houseRules: [
    'Départ avant 11h00',
    'Pas de fêtes bruyantes',
    'Animaux acceptés sur demande',
    'Piscine de 8h à 22h',
  ],
  welcomeMessage: 'Bienvenue à la Villa Azur ! Nous sommes ravis de vous accueillir. N\'hésitez pas à nous contacter via WhatsApp pour toute question. Profitez bien de votre séjour à Nice ! 🌊',
  emergencyContacts: [
    { label: 'Hôte (Isabelle)', number: '+33 6 12 34 56 78', icon: '🏠' },
    { label: 'Urgences', number: '112', icon: '🚨' },
    { label: 'Médecin de garde', number: '15', icon: '🏥' },
  ],
  weather: {
    temp: '24°C',
    condition: 'Ensoleillé',
    icon: '☀️',
    humidity: '52%',
    wind: '8 km/h',
    city: 'Nice',
  },
};

/* ─── ASTRO & TIME ─── */
export const currentDemoTime = {
  date: new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
  time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
  moonPhase: 'Premier Quartier',
  sunrise: '06h42',
  sunset: '20h58',
};

/* ─── EXTENDED MOCK: FAMILY WALL ─── */
export const familyWallMessages = [
  { id: 'w1', author: 'Maman', avatar: '👩', text: 'J\'ai acheté du pain complet et des croissants pour le petit-déjeuner 🥐', time: '08h15', type: 'info' as const },
  { id: 'w2', author: 'Papa', avatar: '👨', text: 'Je rentre tard ce soir, réunion prolongée. Ne m\'attendez pas pour le dîner.', time: '16h30', type: 'alert' as const },
  { id: 'w3', author: 'Paul', avatar: '👦', text: 'Cours de piano terminé ! Prochain cours mercredi à 16h30 🎹', time: '17h00', type: 'reminder' as const },
  { id: 'w4', author: 'Maman', avatar: '👩', text: 'Rappel : RDV dentiste Paul jeudi à 10h. Ne pas oublier la carte vitale.', time: '19h00', type: 'reminder' as const },
];

/* ─── EXTENDED MOCK: HEALTH ─── */
export const healthData = {
  reminders: [
    { id: 'h1', name: 'Doliprane 1000mg', dose: '1 comprimé', time: '08h00', frequency: '3x/jour', done: false },
    { id: 'h2', name: 'Oméga 3', dose: '2 gélules', time: '12h00', frequency: '1x/jour', done: true },
    { id: 'h3', name: 'Vitamine D', dose: '1 goutte', time: '20h00', frequency: '1x/jour', done: false },
  ],
  vitals: [
    { label: 'Tension', value: '12/8', unit: 'mmHg', status: 'normal' as const, icon: '❤️' },
    { label: 'Poids', value: '72', unit: 'kg', status: 'normal' as const, icon: '⚖️' },
    { label: 'Sommeil', value: '7h30', unit: '', status: 'good' as const, icon: '😴' },
    { label: 'Pas/Jour', value: '8432', unit: 'pas', status: 'warning' as const, icon: '🚶' },
  ],
  airQuality: { aqi: 42, level: 'Bon', pm25: 8.2, icon: '🌿' },
};

/* ─── EXTENDED MOCK: WELLNESS ─── */
export const wellnessData = {
  mood: 4,
  moodHistory: [
    { day: 'Lun', value: 3 }, { day: 'Mar', value: 4 }, { day: 'Mer', value: 5 },
    { day: 'Jeu', value: 3 }, { day: 'Ven', value: 4 }, { day: 'Sam', value: 5 }, { day: 'Dim', value: 4 },
  ],
  rituals: [
    { id: 'r1', name: 'Méditation matin', icon: '🧘', completed: true },
    { id: 'r2', name: 'Journal de gratitude', icon: '📝', completed: false },
    { id: 'r3', name: 'Lecture 20 min', icon: '📖', completed: true },
    { id: 'r4', name: 'Promenade nature', icon: '🌳', completed: false },
  ],
  ambiances: [
    { id: 'a1', name: 'Pluie sur les toits', icon: '🌧️', playing: false },
    { id: 'a2', name: 'Forêt tropicale', icon: '🌴', playing: true },
    { id: 'a3', name: 'Vagues océan', icon: '🌊', playing: false },
    { id: 'a4', name: 'Feu de cheminée', icon: '🔥', playing: false },
  ],
  breathingExercise: { name: 'Cohérence cardiaque', duration: '5 min', inhale: 5, hold: 0, exhale: 5 },
};

/* ─── EXTENDED MOCK: RECIPES DETAILED ─── */
export const recipesDetailed = [
  {
    id: 'rd1', name: 'Gratin Dauphinois', image: '🧀', time: '1h15', difficulty: 'Facile', servings: 4,
    ingredients: ['1kg pommes de terre', '300ml crème fraîche', '150g gruyère râpé', '2 gousses d\'ail', '25g beurre', 'Muscade, sel, poivre'],
    steps: ['Éplucher et couper les pommes de terre en rondelles fines.', 'Beurrer un plat à gratin.', 'Disposer les rondelles en couches chevauchantes.', 'Mélanger crème, ail écrasé, muscade, sel, poivre.', 'Verser sur les pommes de terre.', 'Parsemer de gruyère râpé.', 'Enfourner 1h à 180°C.'],
  },
  {
    id: 'rd2', name: 'Salade César', image: '🥗', time: '20 min', difficulty: 'Très facile', servings: 2,
    ingredients: ['2 poitrines de poulet', '1 laitue romaine', '50g parmesan', 'Croûtons', 'Sauce César', '1 citron'],
    steps: ['Griller les poitrines de poulet assaisonnées.', 'Laver et essorer la laitue romaine.', 'Couper le poulet en tranches.', 'Disposer la salade, le poulet, les croûtons.', 'Parsemer de parmesan.', 'Napper de sauce César et citron.'],
  },
  {
    id: 'rd3', name: 'Quiche Lorraine', image: '🥧', time: '45 min', difficulty: 'Moyen', servings: 6,
    ingredients: ['1 pâte brisée', '200g lardons fumés', '3 œufs', '200ml crème', '100g gruyère', 'Sel, poivre'],
    steps: ['Préchauffer le four à 180°C.', 'Étaler la pâte dans un moule.', 'Faire revenir les lardons.', 'Battre œufs, crème, sel, poivre.', 'Répartir lardons et gruyère sur la pâte.', 'Verser l\'appareil.', 'Enfourner 35 min.'],
  },
];

/* ─── EXTENDED MOCK: NOTIFICATIONS ─── */
export const notifications = [
  { id: 'n1', type: 'weather' as const, title: 'Météo', message: 'Pluie prévue cet après-midi. Pensez à prendre un parapluie.', time: 'Il y a 30 min', read: false, icon: '🌦️' },
  { id: 'n2', type: 'reminder' as const, title: 'Rappel', message: 'Appeler Mamie à 18h00.', time: 'Il y a 1h', read: false, icon: '🔔' },
  { id: 'n3', type: 'message' as const, title: 'Mur familial', message: 'Papa : Je rentre tard ce soir.', time: 'Il y a 2h', read: true, icon: '💬' },
  { id: 'n4', type: 'health' as const, title: 'Santé', message: 'Qualité de l\'air : Bon (AQI 42). Activités extérieures recommandées.', time: 'Il y a 3h', read: true, icon: '🌿' },
  { id: 'n5', type: 'system' as const, title: 'Système', message: 'Nouvelle recette disponible : Gratin Dauphinois.', time: 'Hier', read: true, icon: '🍽️' },
];

/* ─── EXTENDED MOCK: ANALYTICS ─── */
export const analyticsData = {
  screenTime: { today: '2h15', week: '14h30', trend: '+8%' },
  topActivities: [
    { name: 'Météo', count: 24, icon: '☀️' },
    { name: 'Recettes', count: 18, icon: '🍳' },
    { name: 'Horoscope', count: 12, icon: '⭐' },
    { name: 'Actualités', count: 9, icon: '📰' },
  ],
  energySaved: '12%',
  interactionsWeek: [4, 7, 3, 8, 6, 2, 5],
};

/* ─── EXTENDED MOCK: BILLING ─── */
export const billingData = {
  plan: { name: 'Comfort', price: '19,99€/mois', status: 'Actif' },
  modules: [
    { name: 'Module Services', price: '+10€/mois', active: true },
    { name: 'Module Restaurants', price: '+10€/mois', active: false },
    { name: 'Analytics Avancés', price: '+5€/mois', active: true },
  ],
  nextInvoice: { date: '15 juin 2025', amount: '34,99€' },
};

/* ─── EXTENDED MOCK: AIRBNB EXTENDED ─── */
export const airbnbExtended = {
  staySummary: {
    checkin: 'Sam. 7 juin 14h00',
    checkout: 'Dim. 8 juin 11h00',
    nights: 1,
    guests: 2,
    propertyType: 'Villa entière',
    rating: 4.9,
  },
  localPOIs: [
    { name: 'Plage Castel Plage', category: 'Plage', distance: '3 min', rating: 4.7, description: 'Plage de sable fin avec vue sur la baie des Anges' },
    { name: 'Restaurant La Petite Maison', category: 'Restaurant', distance: '5 min', rating: 4.8, description: 'Cuisine méditerranéenne raffinée, terrasse ombragée' },
    { name: 'Pharmacie du Marché', category: 'Pharmacie', distance: '8 min', rating: 4.5, description: 'Ouverte 7j/7, produits de parapharmacie' },
    { name: 'Musée Matisse', category: 'Musée', distance: '15 min', rating: 4.6, description: 'Collection exceptionnelle dans un domaine classé' },
    { name: 'Marché Cours Saleya', category: 'Marché', distance: '10 min', rating: 4.4, description: 'Marché de fleurs et produits locaux, matin' },
  ],
  accessTokens: [
    { label: 'WiFi Invité', value: 'VillaAzur_Guest', icon: '📶' },
    { label: 'Code Portail', value: '4827', icon: '🔐' },
    { label: 'Code Coffre', value: '1593', icon: '🗄️' },
  ],
  supportTickets: [
    { id: 'st1', subject: 'Climatisation', description: 'La climatisation du salon ne fonctionne plus.', status: 'open' as const, time: 'Il y a 2h' },
    { id: 'st2', subject: 'Serviettes de bain', description: 'Manque 2 serviettes dans la salle de bain.', status: 'resolved' as const, time: 'Hier' },
  ],
  travelJournal: [
    { id: 'j1', day: 'Jour 1', title: 'Arrivée & Installation', content: 'Arrivée à 14h, accueil chaleureux. Appartement conforme aux photos. Première balade sur la Promenade des Anglais.', mood: '😊' },
    { id: 'j2', day: 'Jour 1 - Soir', title: 'Restaurant La Petite Maison', content: 'Excellente ratatouille niçoise et un glass de rosé face à la mer. Merci pour la recommandation !', mood: '😍' },
  ],
  stayNotifications: [
    { id: 'sn1', title: 'Message d\'Isabelle', message: 'Bienvenue Sophie ! N\'hésitez pas à me contacter.', time: 'Il y a 1h', icon: '🏠' },
    { id: 'sn2', title: 'Rappel Check-out', message: 'Depart demain 11h. Pensez à déposer les clés.', time: 'Il y a 3h', icon: '⏰' },
    { id: 'sn3', title: 'Promo Partenaire', message: '-20% au restaurant La Petite Maison ce soir !', time: 'Il y a 4h', icon: '🎉' },
  ],
  staySettings: { language: 'Français', units: 'Métrique', nightMode: false, quietHours: '22h-08h' },
  billingStay: {
    total: '145€',
    nights: '120€ (1 nuit)',
    cleaning: '25€',
    extras: '0€',
  },
};
