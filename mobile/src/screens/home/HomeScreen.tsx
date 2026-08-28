import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Image, Alert } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { colors, radius, typography } from '../../theme/colors';
import { useAuth } from '../../context/AuthContext';
import { SERVICES } from '../../constants/services';
import WeatherWidget from '../../components/WeatherWidget';
import ServicesCarousel, { CarouselService } from '../../components/ServicesCarousel';
import SideMenu, { SideMenuItem } from '../../components/SideMenu';
import SuggestionsRow, { SuggestionOption } from '../../components/SuggestionsRow';

const APP_NAME = 'Raha';

const GRANDE_COMORE_REGION = {
  latitude: -11.62,
  longitude: 43.32,
  latitudeDelta: 0.55,
  longitudeDelta: 0.4,
};

const PLANIFIER_SORTIES = {
  key: 'SORTIES',
  title: 'Planifiez vos sorties',
  subtitle: 'En famille, entre amis ou pour le travail.',
  image: require('../../../assets/home/planifiez-sorties.png'),
};

const WHY_CHOOSE = [
  { key: 'SECURITE', icon: '🛡️', title: 'Sécurité', subtitle: 'Notre priorité' },
  { key: 'CHAUFFEURS', icon: '🧑‍✈️', title: 'Chauffeurs', subtitle: 'Professionnels' },
  { key: 'PAIEMENT', icon: '💳', title: 'Paiement', subtitle: 'Sécurisé' },
  { key: 'SUPPORT', icon: '🎧', title: 'Support 24/7', subtitle: 'Toujours à vos côtés' },
];

export default function HomeScreen({ navigation }: any) {
  const { user } = useAuth();
  const [greeting, setGreeting] = useState('Bonjour');
  const [menuVisible, setMenuVisible] = useState(false);

  useEffect(() => {
    const hour = new Date().getHours();
    setGreeting(hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir');
  }, []);

  function openService(item: typeof SERVICES[number]) {
    if (item.type === 'MAP') {
      navigation.navigate('MapExplore');
    } else if (item.type === 'BUS') {
      navigation.navigate('TripSearch', { type: 'BUS' });
    } else if (item.type === 'VOITURE') {
      navigation.navigate('ChooseProvider', { purpose: item.purpose, title: item.title });
    } else {
      navigation.navigate('AgencyList', { type: item.type, purpose: item.purpose });
    }
  }

  function openPlanifierSorties() {
    navigation.navigate('PlanifierSortie');
  }

  function goTo(fn: () => void) {
    setMenuVisible(false);
    fn();
  }

  function openSuggestion(option: SuggestionOption) {
    navigation.navigate('ChooseProvider', { title: option.name });
  }

  const menuItems: SideMenuItem[] = [
    { key: 'TRAJETS', icon: '🎫', label: 'Voir Mes trajet', onPress: () => goTo(() => navigation.getParent()?.navigate('Réservations')) },
    { key: 'VOYAGER', icon: '🚌', label: 'Voyager avec Raha', onPress: () => goTo(() => navigation.navigate('TripSearch', { type: 'BUS' })) },
    { key: 'COURSES', icon: '🛍️', label: 'faites vos Courses avec Raha', onPress: () => goTo(() => navigation.navigate('ChooseProvider', { purpose: 'Course en ville', title: 'faites vos Courses avec Raha' })) },
    { key: 'SORTIES', icon: '🗓️', label: 'Planifiez vos sorties', onPress: () => goTo(() => navigation.navigate('PlanifierSortie')) },
    { key: 'PRO', icon: '🧑‍💼', label: 'Devenir Professionnel', onPress: () => goTo(() => navigation.navigate('BecomeProfessional')) },
    {
      key: 'BONUS', icon: '✨', label: 'Bonus +++',
      children: [
        { key: 'TOURISME', label: 'Vous souhaitez connaître les endroits touristiques à visiter au Comores ?', onPress: () => goTo(() => navigation.navigate('MapExplore')) },
        { key: 'LOGEMENT', label: 'Vous êtes-vous logé aux Comores ?', onPress: () => goTo(() => navigation.navigate('Lodging')) },
      ],
    },
  ];

  return (
    <>
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Barre du haut : menu / logo image / notifications */}
      <View style={styles.topBar}>
        <Pressable style={styles.topBarIconBtn} onPress={() => setMenuVisible(true)}>
          <Text style={styles.topBarIcon}>☰</Text>
        </Pressable>
        <View style={styles.topBarLogo}>
          <Image source={require('../../../assets/logo-mark.png')} style={styles.topBarLogoImg} />
          <View>
            <Text style={styles.topBarLogoText}>{APP_NAME.toUpperCase()}</Text>
            <Text style={styles.topBarLogoTagline}>Votre trajet, notre priorité</Text>
          </View>
        </View>
        <Pressable style={styles.topBarIconBtn} onPress={() => navigation.navigate('Notifications')}>
          <Text style={styles.topBarIcon}>🔔</Text>
          <View style={styles.notifDot} />
        </Pressable>
      </View>

      <View style={styles.header}>
        <Text style={styles.greeting}>{greeting}, {user?.firstName} 👋</Text>
        <Text style={styles.title}>Où allons-nous aujourd'hui ?</Text>
      </View>

      <View style={styles.searchCard}>
        <Pressable style={styles.searchRow} onPress={() => navigation.navigate('TripSearch', { type: 'BUS' })}>
          <View style={styles.originDot} />
          <View style={{ flex: 1 }}>
            <Text style={styles.searchLabel}>Point de départ</Text>
            <Text style={styles.searchValue}>Ma position actuelle</Text>
          </View>
          <View style={styles.locateBtn}><Text style={{ fontSize: 16 }}>⊙</Text></View>
        </Pressable>
        <View style={styles.divider} />
        <Pressable style={styles.searchRow} onPress={() => navigation.navigate('TripSearch', {})}>
          <View style={styles.destDot} />
          <View style={{ flex: 1 }}>
            <Text style={styles.searchLabel}>Point d'arrivée</Text>
            <Text style={styles.searchValuePlaceholder}>Où voulez-vous aller ?</Text>
          </View>
        </Pressable>
      </View>

      {/* Météo — juste sous la carte départ/arrivée */}
      <WeatherWidget onPress={() => navigation.navigate('Weather')} />

      <View style={styles.mapSection}>
        <MapView style={styles.map} provider={PROVIDER_GOOGLE} initialRegion={GRANDE_COMORE_REGION} zoomEnabled zoomControlEnabled scrollEnabled rotateEnabled>
          <Marker coordinate={{ latitude: -11.7042, longitude: 43.2402 }} title="Moroni" pinColor={colors.ocean} />
          <Marker coordinate={{ latitude: -11.3833, longitude: 43.2833 }} title="Mitsamiouli" pinColor={colors.lagoon} />
          <Marker coordinate={{ latitude: -11.8833, longitude: 43.6167 }} title="Foumbouni" pinColor={colors.lagoon} />
        </MapView>
        <Pressable style={styles.mapExpandBtn} onPress={() => navigation.navigate('MapExplore')}>
          <Text style={styles.mapExpandText}>Plein écran  ↗</Text>
        </Pressable>
      </View>

      <SuggestionsRow onSelect={openSuggestion} />

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Nos services</Text>
        <Pressable onPress={() => navigation.navigate('AgencyList', {})}>
          <Text style={styles.seeAll}>Voir tout →</Text>
        </Pressable>
      </View>

      <ServicesCarousel services={SERVICES} onPressService={openService} />

      {/* Pourquoi choisir [logo] ? */}
      <View style={styles.whyCard}>
        <View style={styles.whyHeader}>
          <Text style={styles.whyTitle}>Pourquoi choisir</Text>
          <Image source={require('../../../assets/logo-mark.png')} style={styles.whyLogo} />
          <Text style={styles.whyTitle}>?</Text>
          <View style={{ flex: 1 }} />
          <Pressable onPress={() => navigation.getParent()?.navigate('Profil')}>
            <Text style={styles.whyMore}>En savoir plus ›</Text>
          </Pressable>
        </View>
        <View style={styles.whyRow}>
          {WHY_CHOOSE.map((w) => (
            <View key={w.key} style={styles.whyItem}>
              <Text style={styles.whyIcon}>{w.icon}</Text>
              <Text style={styles.whyItemTitle}>{w.title}</Text>
              <Text style={styles.whyItemSubtitle}>{w.subtitle}</Text>
            </View>
          ))}
        </View>
      </View>

      <Pressable style={styles.promoBanner} onPress={() => navigation.navigate('ChooseProvider', { title: 'Voitures disponibles' })}>
        <Image source={require('../../../assets/services/promo-banner.jpg')} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
        <View style={styles.promoOverlay} />
        <View style={styles.promoContent}>
          <Text style={styles.promoCrown}>👑</Text>
          <Text style={styles.promoTitle}>Savourez le luxe{'\n'}avec {APP_NAME}</Text>
          <Text style={styles.promoSubtitle}>Offrez-vous une expérience de voyage unique aux Comores.</Text>
          <View style={styles.promoBtn}><Text style={styles.promoBtnText}>Réserver le service qui vous correspond</Text></View>
        </View>
      </Pressable>

      {/* Planifiez vos sorties */}
      <Pressable style={styles.planCard} onPress={openPlanifierSorties}>
        <View style={styles.planTextBlock}>
          <Text style={styles.planTitle}>{PLANIFIER_SORTIES.title}</Text>
          <Text style={styles.planSubtitle}>{PLANIFIER_SORTIES.subtitle}</Text>
          <View style={styles.planBtn}>
            <Text style={styles.planBtnText}>Planifier</Text>
            <Text style={styles.planBtnIcon}>🗓️</Text>
          </View>
        </View>
        <Image source={PLANIFIER_SORTIES.image} style={styles.planImage} resizeMode="contain" />
      </Pressable>

      {/* Raha est l'app numéro 1 aux Comores */}
      <View style={styles.rankCard}>
        <Image source={require('../../../assets/home/trophy.png')} style={styles.rankTrophy} resizeMode="contain" />
        <View style={styles.rankTextBlock}>
          <Text style={styles.rankTitle}>{APP_NAME} est l'app numéro 1{'\n'}aux Comores !</Text>
          <Text style={styles.rankSubtitle}>Des milliers de clients nous font confiance pour leurs déplacements.</Text>
        </View>
        <View style={styles.rankBadge}>
          <Text style={styles.rankBadgeNumber}>+10K</Text>
          <Text style={styles.rankBadgeLabel}>Clients satisfaits</Text>
          <Text style={styles.rankBadgeStars}>★★★★★</Text>
        </View>
      </View>

      <Pressable style={styles.browseCard} onPress={() => navigation.navigate('AgencyList', {})}>
        <Text style={styles.browseIcon}>🏢</Text>
        <View style={{ flex: 1 }}>
          <Text style={typography.h2}>Voir toutes les agences</Text>
          <Text style={typography.bodyMuted}>Agences et particuliers partout aux Comores.</Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </Pressable>

      <Pressable style={styles.browseCard} onPress={() => navigation.navigate('MyBookings')}>
        <Text style={styles.browseIcon}>🎫</Text>
        <View style={{ flex: 1 }}>
          <Text style={typography.h2}>Mes réservations</Text>
          <Text style={typography.bodyMuted}>Historique et trajets à venir</Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </Pressable>
    </ScrollView>

    <SideMenu visible={menuVisible} onClose={() => setMenuVisible(false)} items={menuItems} />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.sand },

  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingTop: 54, paddingBottom: 10 },
  topBarIconBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  notifDot: { position: 'absolute', top: 6, right: 7, width: 8, height: 8, borderRadius: 4, backgroundColor: colors.gold, borderWidth: 1.5, borderColor: colors.sand },
  topBarIcon: { fontSize: 18 },
  topBarLogo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  topBarLogoImg: { width: 26, height: 26 },
  topBarLogoText: { fontSize: 13, fontWeight: '800', color: colors.charcoal, letterSpacing: 1.5, textAlign: 'center' },
  topBarLogoTagline: { fontSize: 8, color: colors.slate, textAlign: 'center', letterSpacing: 0.5, textTransform: 'uppercase' },

  header: { paddingHorizontal: 20, paddingTop: 6, paddingBottom: 18 },
  greeting: { fontSize: 22, fontWeight: '800', color: colors.charcoal },
  title: { fontSize: 14, color: colors.slate, marginTop: 4 },

  searchCard: { backgroundColor: colors.white, marginHorizontal: 20, borderRadius: radius.lg, padding: 6, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 3 },
  searchRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 14 },
  originDot: { width: 12, height: 12, borderRadius: 6, borderWidth: 3, borderColor: colors.gold, marginRight: 14 },
  destDot: { width: 12, height: 12, borderRadius: 3, backgroundColor: colors.charcoal, marginRight: 14 },
  searchLabel: { fontSize: 12, color: colors.slate, marginBottom: 2 },
  searchValue: { fontSize: 15, fontWeight: '700', color: colors.charcoal },
  searchValuePlaceholder: { fontSize: 15, fontWeight: '600', color: colors.slate },
  divider: { height: 1, backgroundColor: colors.line, marginHorizontal: 14 },
  locateBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.sandDeep, alignItems: 'center', justifyContent: 'center' },

  mapSection: { height: 260, marginHorizontal: 20, marginTop: 20, borderRadius: radius.lg, overflow: 'hidden' },
  map: { ...StyleSheet.absoluteFillObject },
  mapExpandBtn: { position: 'absolute', bottom: 12, right: 12, backgroundColor: colors.white, paddingHorizontal: 14, paddingVertical: 9, borderRadius: radius.pill, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 6, elevation: 3 },
  mapExpandText: { fontSize: 12, fontWeight: '700', color: colors.charcoal },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: 20, marginTop: 26, marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: colors.charcoal, flexShrink: 1 },
  seeAll: { fontSize: 13, fontWeight: '700', color: colors.gold },

  whyCard: { backgroundColor: colors.white, marginHorizontal: 20, marginTop: 22, borderRadius: radius.lg, padding: 18, borderWidth: 1, borderColor: colors.line },
  whyHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 },
  whyTitle: { fontSize: 15, fontWeight: '800', color: colors.charcoal },
  whyLogo: { width: 18, height: 18 },
  whyMore: { fontSize: 11, fontWeight: '700', color: colors.gold },
  whyRow: { flexDirection: 'row', justifyContent: 'space-between' },
  whyItem: { alignItems: 'center', flex: 1 },
  whyIcon: { fontSize: 20, marginBottom: 6 },
  whyItemTitle: { fontSize: 11, fontWeight: '800', color: colors.charcoal, textAlign: 'center' },
  whyItemSubtitle: { fontSize: 9, color: colors.slate, textAlign: 'center', marginTop: 1 },

  promoBanner: { marginHorizontal: 20, marginTop: 24, borderRadius: radius.lg, overflow: 'hidden', minHeight: 200, justifyContent: 'center' },
  promoOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(10,12,16,0.6)' },
  promoContent: { padding: 22 },
  promoCrown: { fontSize: 20, marginBottom: 10 },
  promoTitle: { fontSize: 22, fontWeight: '800', color: colors.white, lineHeight: 28 },
  promoSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 8, marginBottom: 16, lineHeight: 18 },
  promoBtn: { backgroundColor: colors.gold, alignSelf: 'flex-start', paddingHorizontal: 18, paddingVertical: 12, borderRadius: radius.pill, maxWidth: '90%' },
  promoBtnText: { color: colors.onyx, fontWeight: '800', fontSize: 12 },

  planCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white,
    marginHorizontal: 20, marginTop: 26, borderRadius: radius.lg, overflow: 'hidden',
    borderWidth: 1, borderColor: colors.line, minHeight: 150,
  },
  planTextBlock: { flex: 1, padding: 20 },
  planTitle: { fontSize: 18, fontWeight: '800', color: colors.charcoal, lineHeight: 23 },
  planSubtitle: { fontSize: 12.5, color: colors.slate, marginTop: 6, marginBottom: 16, lineHeight: 17 },
  planBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
    backgroundColor: colors.charcoal, borderRadius: radius.pill, paddingHorizontal: 16, paddingVertical: 10,
  },
  planBtnText: { fontSize: 12.5, fontWeight: '800', color: colors.white },
  planBtnIcon: { fontSize: 13 },
  planImage: { width: 130, height: 150, marginRight: -6 },

  rankCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF8E8',
    marginHorizontal: 20, marginTop: 18, borderRadius: radius.lg, padding: 16,
    borderWidth: 1, borderColor: colors.line, gap: 12,
  },
  rankTrophy: { width: 46, height: 48 },
  rankTextBlock: { flex: 1 },
  rankTitle: { fontSize: 14.5, fontWeight: '800', color: colors.charcoal, lineHeight: 19 },
  rankSubtitle: { fontSize: 11, color: colors.slate, marginTop: 5, lineHeight: 15 },
  rankBadge: { backgroundColor: colors.white, borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 10, alignItems: 'center', minWidth: 84 },
  rankBadgeNumber: { fontSize: 16, fontWeight: '800', color: colors.charcoal },
  rankBadgeLabel: { fontSize: 9, color: colors.slate, textAlign: 'center', marginTop: 2, lineHeight: 12 },
  rankBadgeStars: { fontSize: 10, color: colors.gold, marginTop: 4, letterSpacing: 1 },

  browseCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, marginHorizontal: 20, marginTop: 4, borderRadius: radius.lg, padding: 16, borderWidth: 1, borderColor: colors.line },
  browseIcon: { fontSize: 28, marginRight: 14 },
  chevron: { fontSize: 24, color: colors.slate },
});
