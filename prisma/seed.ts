import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEFAULT_KNOWLEDGE_BASE = [
  // TV
  { question: "Comment allumer la télévision ?", answer: "La télécommande se trouve sur la table basse du salon. Appuyez sur le bouton rouge POWER. Pour changer de source (Netflix, YouTube), utilisez le bouton SOURCE.", category: "TV", room: "Salon", keywords: ["télé", "tv", "allumer", "marche pas", "écran", "chaîne"] },
  { question: "Comment se connecter au WiFi ?", answer: "Le nom du réseau WiFi est affiché sur le routeur dans l'entrée. Le mot de passe est : MAISON-2024. Pour les appartements, vérifiez le guide d'accueil dans le tiroir de la table de nuit.", category: "WiFi", room: "Entrée", keywords: ["wifi", "wi-fi", "internet", "connexion", "réseau", "mot de passe", "code"] },
  { question: "Comment fonctionne la climatisation ?", answer: "La télécommande de la climatisation est sur l'étagère du salon. Utilisez les flèches haut/bas pour régler la température. Mode COOL pour rafraîchir, mode HEAT pour chauffer. Laissez la porte fermée pour une meilleure efficacité.", category: "Clim", room: "Salon", keywords: ["clim", "climatisation", "air conditionné", "chaud", "froid", "température", "rafraîchir"] },
  { question: "Où sont les serviettes de bain ?", answer: "Les serviettes propres sont dans le placard de la salle de bain. Serviettes de bain en étagère haute, serviettes de mains en bas. Des serviettes supplémentaires sont disponibles dans le linéaire du couloir.", category: "SDB", room: "Salle de bain", keywords: ["serviette", "bain", "douche", "linge", "placard"] },
  { question: "Comment faire fonctionner la machine à laver ?", answer: "La machine à laver est dans la buanderie (sous-sol). Utilisez le programme 'Coton 40°' pour le linge normal. La lessive est fournie sous l'évier de la cuisine. Un sèche-linge est aussi disponible.", category: "Machine à laver", room: "Buanderie", keywords: ["machine", "laver", "lessive", "sèche-linge", "lavage", "buanderie"] },
  // Cuisine
  { question: "Comment fonctionne le four ?", answer: "Tournez le bouton de température dans le sens horaire pour sélectionner la température souhaitée. Le four est électrique. Préchauffez toujours 10 minutes avant d'enfourner. Le mode chaleur tournante est recommandé.", category: "Cuisine", room: "Cuisine", keywords: ["four", "cuisson", "chauffer", "température", "grill"] },
  { question: "Où sont les poubelles ?", answer: "Les poubelles triées sont dans le garage : verte pour le verre, jaune pour les emballages, marron pour les biodéchets. Sortez les poubelles le soir avant 20h pour la collecte du lendemain matin.", category: "Cuisine", room: "Cuisine", keywords: ["poubelle", "déchets", "tri", "verre", "recyclage", "sortir"] },
  { question: "Où trouve-t-on le sel, le poivre et les huiles ?", answer: "Les condiments de base (sel, poivre, huile d'olive, vinaigre) sont dans le placard au-dessus de l'évier. Des épices supplémentaires sont disponibles dans le tiroir gauche.", category: "Cuisine", room: "Cuisine", keywords: ["sel", "poivre", "huile", "épice", "condiment", "cuisine"] },
  // Check-in/Check-out
  { question: "Quelle est l'heure de check-in ?", answer: "Le check-in est à partir de 16h. Si vous arrivez plus tôt, contactez-nous par WhatsApp pour voir si c'est possible. Le code de la porte vous sera envoyé par SMS le jour de votre arrivée.", category: "Check-in", room: null, keywords: ["arrivée", "check-in", "entrée", "heure", "code", "clé"] },
  { question: "Quelle est l'heure de check-out ?", answer: "Le check-out est avant 11h. Merci de laisser les clés dans la boîte aux lettres. Le ménage de fin de séjour est inclus — pensez simplement à vider le frigo et trier vos déchets.", category: "Check-in", room: null, keywords: ["départ", "check-out", "sortie", "heure", "clé", "ménage"] },
  { question: "Comment fonctionne le coffre-fort ?", answer: "Le coffre-fort est dans le placard de la chambre. Le code par défaut est 1234. Changez-le en entrant 1234 puis votre nouveau code à 4 chiffres suivi de A/B. N'oubliez pas votre code !", category: "Sécurité", room: "Chambre", keywords: ["coffre", "sécurité", "code", "valise", "bijoux", "argent"] },
  // Sécurité
  { question: "Que faire en cas d'urgence ?", answer: "En cas d'urgence, composez le 15 (SAMU), 18 (Pompiers) ou 112 (Numéro d'urgence européen). Les extincteurs sont dans le couloir et la cuisine. Le bouton d'urgence sur la tablette vous permet d'alerter directement l'hôte par WhatsApp.", category: "Sécurité", room: null, keywords: ["urgence", "secours", "pompier", "samu", "extincteur", "accident"] },
  { question: "Comment fermer les volets ?", answer: "Les volets sont électriques. Utilisez les interrupteurs muraux dans chaque pièce. Appuyez une fois pour descendre, deux fois pour monter. Attention, le bruit peut être entendu par les voisins après 22h.", category: "Sécurité", room: null, keywords: ["volet", "fermer", "nuit", "lumière", "obscurité", "interrupteur"] },
  // Appareils
  { question: "Comment utiliser la machine à café ?", answer: "La machine à café Nespresso est sur le plan de travail de la cuisine. Soulevez le levier, insérez une capsule (providées dans le tiroir au-dessus), appuyez sur le bouton expresso ou lungo. L'eau est dans le réservoir à l'arrière.", category: "Cuisine", room: "Cuisine", keywords: ["café", "nespresso", "machine", "expresso", "tasse", "boisson"] },
  { question: "Comment fonctionne le lave-vaisselle ?", answer: "Chargez le lave-vaisselle en suivant les symboles (assiettes en bas, verres en haut). Versez la pastille dans le compartiment. Utilisez le programme ECO (environ 2h). Le produit est fourni sous l'évier.", category: "Cuisine", room: "Cuisine", keywords: ["lave-vaisselle", "vaisselle", "pastille", "laver", "plats"] },
  { question: "Où est le sèche-cheveux ?", answer: "Le sèche-cheveux est dans le tiroir de la salle de bain, sous le lavabo. Une plaque à cheveux est aussi disponible sur demande via WhatsApp.", category: "SDB", room: "Salle de bain", keywords: ["sèche-cheveux", "cheveux", "sèche", "salle de bain"] },
  // Transport
  { question: "Comment se garer ?", answer: "Le parking privé est dans la cour. Le code d'accès de la barrière est sur votre guide d'accueil. En cas de problème, appelez le 06 XX XX XX XX. Le parking est gratuit pour les résidents.", category: "Check-in", room: null, keywords: ["parking", "garer", "voiture", "barrière", "stationnement", "cour"] },
  { question: "Où est l'arrêt de bus le plus proche ?", answer: "L'arrêt de bus le plus proche est à 200m, rue Victor Hugo (ligne 12). Il dessert le centre-ville en 10 minutes. Les horaires sont affichés sur l'arrêt et dans l'application Transports.", category: "Transport", room: null, keywords: ["bus", "transport", "arrêt", "centre-ville", "navette"] },
  // Confort
  { question: "Comment régler le chauffage ?", answer: "Le chauffage est automatique avec thermostat programmable. Vous pouvez ajuster la température pièce par pièce avec les thermostats muraux. Ne couvrez jamais les radiateurs. En été, utilisez la climatisation plutôt que d'ouvrir les fenêtres pour économiser l'énergie.", category: "Clim", room: null, keywords: ["chauffage", "radiateur", "thermostat", "température", "hiver", "chaud"] },
  { question: "Y a-t-il un fer à repasser ?", answer: "Oui, le fer à repasser et la planche sont dans le placard de l'entrée. Vérifiez le niveau d'eau avant utilisation. Utilisez le mode vapeur pour les tissus délicats.", category: "Autre", room: "Entrée", keywords: ["fer", "repasser", "linge", "planche", "vêtement"] },
  { question: "Où sont les chargeurs et adaptateurs ?", answer: "Des adaptateurs secteur universels sont dans le tiroir de la table de nuit de la chambre. Des câbles USB sont disponibles dans le salon. Le chargeur rapide est sur la table de nuit.", category: "Autre", room: "Chambre", keywords: ["chargeur", "usb", "adaptateur", "prise", "téléphone", "batterie"] },
  // Quartier
  { question: "Où trouver une pharmacie ?", answer: "La pharmacie la plus proche est au 15 rue de la République, à 300m. Elle est ouverte de 8h30 à 20h en semaine. La pharmacie de garde est indiquée sur la tablette dans la section Points d'intérêt.", category: "Quartier", room: null, keywords: ["pharmacie", "médicament", "santé", "urgence", "proche"] },
  { question: "Quels sont les bons restaurants à proximité ?", answer: "Consultez la section 'Points d'intérêt' sur la tablette pour les recommandations. Le restaurant Le Petit Bistrot (500m) est excellent pour les repas traditionnels. La pizzeria Bella Vita (300m) est parfaite pour les soirs décontractés.", category: "Quartier", room: null, keywords: ["restaurant", "manger", "dîner", "sortir", "proche", "bouffe", "repas"] },
  { question: "Où est le supermarché le plus proche ?", answer: "Le Carrefour City est à 400m, ouvert de 8h30 à 21h30. Le marché couvert est ouvert le matin le long du canal. Pour les courses en grande surface, le Leclerc est à 10 min en voiture.", category: "Quartier", room: null, keywords: ["supermarché", "courses", "magasin", "alimentation", "provision"] },
  // Enfants
  { question: "Y a-t-il du matériel pour bébés ?", answer: "Un lit bébé et une chaise haute sont disponibles sur demande (gratuits). Signalez votre besoin lors de la réservation. Un baby-phone est aussi fourni.", category: "Autre", room: "Chambre", keywords: ["bébé", "enfant", "lit bébé", "chaise haute", "baby-phone"] },
  { question: "Où sont les jeux pour enfants ?", answer: "Une boîte de jeux de société est dans le placard du salon. Des livres pour enfants sont sur l'étagère de la chambre. Le parc (jardin public) est à 200m avec un terrain de jeux.", category: "Autre", room: "Salon", keywords: ["jeux", "enfant", "jouet", "livre", "parc", "jardin"] },
  // Divers
  { question: "Comment accéder au toit-terrasse ?", answer: "L'accès au toit-terrasse est par l'escalier du 3ème étage. La clé est sur le porte-clés d'accueil. Le terrain de pétanque est au 2ème étage. Attention, la terrasse ferme à 22h par respect pour les voisins.", category: "Autre", room: null, keywords: ["terrasse", "toit", "pétanque", "vue", "extérieur", "jardin"] },
  { question: "Le logement accepte-t-il les animaux ?", answer: "Les animaux de compagnie sont acceptés sur demande avec un supplément de 10€/nuit. Prévenez-nous à la réservation. Des gamelles sont disponibles. Merci de ramasser après votre animal dans le quartier.", category: "Check-in", room: null, keywords: ["animal", "chien", "chat", "animaux", "pet", "compagnie"] },
  { question: "Comment fonctionne la chaudière ?", answer: "La chaudière est automatique et ne nécessite aucune intervention. En cas de problème d'eau chaude, vérifiez que le robinet d'eau chaude est bien ouvert. Si le problème persiste, contactez-nous par WhatsApp.", category: "Autre", room: "Buanderie", keywords: ["chaudière", "eau chaude", "plomberie", "fuite", "robinet"] },
  { question: "Comment signaler un problème ?", answer: "Utilisez le bouton WhatsApp sur la tablette ou appelez le 06 XX XX XX XX. Pour les urgences, le bouton rouge URGENCE sur la tablette envoie une alerte immédiate. Vous pouvez aussi envoyer un message via la section Support de la tablette.", category: "Autre", room: null, keywords: ["problème", "panne", "réparer", "signaler", "support", "aide"] },
];

async function main() {
  console.log('🌱 Seeding Knowledge Base...');

  // Create a demo household if none exists
  let household = await prisma.household.findFirst();
  if (!household) {
    household = await prisma.household.create({
      data: {
        name: 'Mon Appartement',
        type: 'hospitality',
        displayEnabled: true,
        displayToken: 'demo-' + Math.random().toString(36).substring(2, 8),
        whatsappNumber: '33600000000',
        settings: JSON.stringify({ lang: 'fr', accent: 'gold' }),
        voiceSettings: JSON.stringify({ enabled: true, wakeWord: 'Maellis', wakeWordEnabled: true, rate: 1.0, volume: 0.8, language: 'fr-FR' }),
        userPreferences: JSON.stringify({ musicGenre: null, zodiacSign: null, dietaryRestrictions: [], learningMode: true, knownInterests: [] }),
      },
    });
    console.log('  ✅ Created demo household:', household.id);
  }

  // Seed knowledge base items
  let created = 0;
  for (const item of DEFAULT_KNOWLEDGE_BASE) {
    const exists = await prisma.knowledgeBaseItem.findFirst({
      where: { householdId: household.id, question: item.question },
    });
    if (!exists) {
      await prisma.knowledgeBaseItem.create({
        data: {
          householdId: household.id,
          question: item.question,
          answer: item.answer,
          category: item.category,
          room: item.room,
          keywords: JSON.stringify(item.keywords),
        },
      });
      created++;
    }
  }

  console.log(`  ✅ Created ${created} knowledge base items`);
  console.log('🎉 Seed complete!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
