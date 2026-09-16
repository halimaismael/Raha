import { colors } from '../theme/colors';

// Les services proposés sur l'écran d'accueil et l'écran "Mes services".
// `type` détermine l'action déclenchée au tap :
//  - 'BUS'     → recherche de trajet (TripSearch)
//  - 'VOITURE' → choix d'un prestataire véhicule (ChooseProvider / AvailableVehicles)
//  - 'CAMION'  → liste des agences de transport de marchandises (AgencyList)
//  - 'MAP'     → carte d'exploration des Comores (MapExplore)
export const SERVICES = [
  {
    key: 'DEPLACEMENTS',
    title: 'Déplacements',
    description:
      "Faites vos déplacements avec Raha. Déplacez-vous rapidement et confortablement, partout où vous allez aux Comores.",
    cta: 'Se déplacer',
    image: require('../../assets/services/deplacements.jpg'),
    type: 'BUS' as const,
    purpose: undefined as string | undefined,
  },
  {
    key: 'ELEGANCE',
    title: 'Élégance',
    description:
      "Voyagez avec élégance. Profitez d'un véhicule haut de gamme avec chauffeur pour vos rendez-vous, sorties et occasions spéciales.",
    cta: 'Réserver un trajet',
    image: require('../../assets/services/elegance.jpg'),
    type: 'VOITURE' as const,
    purpose: 'Voyage professionnel',
  },
  {
    key: 'NOCES',
    title: 'Noces',
    description:
      "Faites de votre grand jour un moment inoubliable. Des véhicules élégants et décorés pour accompagner les mariés avec style et sérénité.",
    cta: 'Raha noces',
    image: require('../../assets/services/noces.jpg'),
    type: 'VOITURE' as const,
    purpose: 'Mariage / cérémonie',
  },
  {
    key: 'COURSES',
    title: 'Courses',
    description:
      "Faites vos courses avec Raha Market. Commandez ce dont vous avez besoin et faites-vous livrer simplement, directement chez vous.",
    cta: 'Voir Raha Market',
    image: require('../../assets/services/courses.jpg'),
    type: 'VOITURE' as const,
    purpose: 'Course en ville',
  },
  {
    key: 'LOCATION',
    title: 'Location',
    description:
      "Louez une voiture haut de gamme en toute simplicité. Choisissez votre véhicule, réservez-le selon vos besoins et prenez la route en toute liberté.",
    cta: 'Voir Raha Drive',
    image: require('../../assets/services/location.jpg'),
    type: 'VOITURE' as const,
    purpose: 'Location de véhicule',
  },
  {
    key: 'VOYAGE',
    title: 'Voyage',
    description:
      "Voyagez en toute sérénité. Trouvez et réservez vos trajets pour explorer les Comores facilement et sans stress.",
    cta: 'Planifier mon voyage',
    image: require('../../assets/services/voyage.jpg'),
    type: 'BUS' as const,
    purpose: undefined as string | undefined,
  },
  {
    key: 'LIVRAISON',
    title: 'Livraison — Raha Express',
    description:
      "Envoyez, recevez, c'est Raha qui s'en occupe. Faites livrer vos colis rapidement et en toute sécurité, où que vous soyez.",
    cta: 'Envoyer un colis',
    image: require('../../assets/services/livraison.jpg'),
    type: 'CAMION' as const,
    purpose: 'Livraison de colis',
  },
  {
    key: 'TRANSFERT',
    title: 'Transfert aéroport',
    description:
      "À peine arrivé, déjà accompagné. Réservez votre transfert depuis l'aéroport et rejoignez votre destination sans attendre.",
    cta: 'Réserver mon transfert',
    image: require('../../assets/services/transfert-aeroport.jpg'),
    type: 'VOITURE' as const,
    purpose: 'Transfert aéroport',
  },
  {
    key: 'VOYAGO',
    title: 'VoyaGO',
    description:
      "Vous préférez prendre le bus pour partir à la capitale ? Voyagez simplement, confortablement et à petit prix avec VoyaGO.",
    cta: 'Choisir VoyaGO',
    image: require('../../assets/services/voyago.jpg'),
    type: 'BUS' as const,
    purpose: undefined as string | undefined,
  },
  {
    key: 'MWANA',
    title: 'Raha Mwana',
    description:
      "L'accompagnement scolaire en toute sérénité. Un chauffeur dédié pour accompagner et récupérer vos enfants à l'école, selon vos horaires.",
    cta: 'Découvrez Raha Mwana',
    image: require('../../assets/services/mwana.jpg'),
    icon: '🚸',
    bg: colors.ocean,
    type: 'VOITURE' as const,
    purpose: 'Accompagnement scolaire',
  },
  {
    key: 'EXCURSIONS',
    title: 'Excursions',
    description:
      "Découvrez les Comores autrement. Explorez les plages, montagnes, villages et trésors des îles avec des excursions pensées pour vous.",
    cta: 'Découvrir les Comores',
    image: require('../../assets/services/excursions.jpg'),
    type: 'MAP' as const,
    purpose: undefined as string | undefined,
  },
];
