import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

// Ouvre le sélecteur de photo de l'appareil (galerie) ou l'appareil photo, et
// renvoie l'image choisie directement sous forme de data URI base64
// (ex: "data:image/jpeg;base64,...") — prête à être stockée dans un champ
// photoUrl. On compresse (quality) pour garder des requêtes raisonnables.
//
// Utilisé partout où un chauffeur/une agence doit "importer une photo depuis
// l'appareil" : photo de véhicule, photo de profil, etc.

async function launchLibrary(): Promise<string | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) {
    Alert.alert(
      'Autorisation requise',
      "Raha a besoin d'accéder à vos photos pour choisir une image. Autorisez l'accès dans les réglages de votre téléphone."
    );
    return null;
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [4, 3],
    quality: 0.5,
    base64: true,
  });
  if (result.canceled || !result.assets?.[0]?.base64) return null;
  const asset = result.assets[0];
  const mime = asset.mimeType || 'image/jpeg';
  return `data:${mime};base64,${asset.base64}`;
}

async function launchCamera(): Promise<string | null> {
  const perm = await ImagePicker.requestCameraPermissionsAsync();
  if (!perm.granted) {
    Alert.alert(
      'Autorisation requise',
      "Raha a besoin d'accéder à l'appareil photo pour prendre une photo. Autorisez l'accès dans les réglages de votre téléphone."
    );
    return null;
  }
  const result = await ImagePicker.launchCameraAsync({
    allowsEditing: true,
    aspect: [4, 3],
    quality: 0.5,
    base64: true,
  });
  if (result.canceled || !result.assets?.[0]?.base64) return null;
  const asset = result.assets[0];
  const mime = asset.mimeType || 'image/jpeg';
  return `data:${mime};base64,${asset.base64}`;
}

// Affiche un choix "Prendre une photo / Choisir depuis la galerie" puis
// renvoie l'image sélectionnée (ou null si annulé / refusé).
export function pickPhotoFromDevice(): Promise<string | null> {
  return new Promise((resolve) => {
    Alert.alert(
      'Ajouter une photo',
      'Importez une photo depuis votre appareil.',
      [
        { text: 'Prendre une photo', onPress: async () => resolve(await launchCamera()) },
        { text: 'Choisir depuis la galerie', onPress: async () => resolve(await launchLibrary()) },
        { text: 'Annuler', style: 'cancel', onPress: () => resolve(null) },
      ],
      { cancelable: true, onDismiss: () => resolve(null) }
    );
  });
}
