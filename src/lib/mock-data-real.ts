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
