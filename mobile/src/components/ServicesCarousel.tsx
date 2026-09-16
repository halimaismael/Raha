import React, { useRef, useState } from 'react';
import { View, Text, Image, Pressable, StyleSheet, FlatList, Dimensions, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { colors, radius } from '../theme/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.85;
const CARD_HEIGHT = 460;
const GAP = 14;
const SNAP = CARD_WIDTH + GAP;
const SIDE_PADDING = (SCREEN_WIDTH - CARD_WIDTH) / 2;
const ARROW_SIZE = 44;

export type CarouselService = {
  key: string;
  title: string;
  description: string;
  cta: string;
  image?: any;
  icon?: string;
  bg?: string;
};

export default function ServicesCarousel<T extends CarouselService>({
  services,
  onPressService,
}: {
  services: T[];
  onPressService: (service: T) => void;
}) {
  const listRef = useRef<FlatList<T>>(null);
  const [index, setIndex] = useState(0);

  function goTo(nextIndex: number) {
    const clamped = Math.max(0, Math.min(services.length - 1, nextIndex));
    listRef.current?.scrollToOffset({ offset: clamped * SNAP, animated: true });
    setIndex(clamped);
  }

  function handleMomentumEnd(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const offset = e.nativeEvent.contentOffset.x;
    setIndex(Math.round(offset / SNAP));
  }

  return (
    <View style={styles.wrap}>
      <FlatList
        ref={listRef}
        data={services}
        keyExtractor={(s) => s.key}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={SNAP}
        decelerationRate="fast"
        contentContainerStyle={{ paddingHorizontal: SIDE_PADDING }}
        onMomentumScrollEnd={handleMomentumEnd}
        renderItem={({ item, index: i }) => (
          <Pressable
            style={[styles.card, { width: CARD_WIDTH, marginRight: i === services.length - 1 ? 0 : GAP }]}
            onPress={() => onPressService(item)}
          >
            {/* La photo occupe tout le bloc, comme les cartes "Visitez les Comores" */}
            {item.image ? (
              <Image source={item.image} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
            ) : (
              <View style={[StyleSheet.absoluteFillObject, styles.placeholder, { backgroundColor: item.bg || colors.ocean }]}>
                <Text style={styles.placeholderIcon}>{item.icon || '🚐'}</Text>
              </View>
            )}
            {/* Une seule teinte transparente sur toute la carte, pour que le texte fasse corps avec la photo */}
            <View style={styles.overlay} />

            <View style={styles.content}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.description}>{item.description}</Text>
              <Pressable style={styles.ctaBtn} onPress={() => onPressService(item)}>
                <Text style={styles.ctaText}>{item.cta} →</Text>
              </Pressable>
            </View>
          </Pressable>
        )}
      />

      {/* Flèches de défilement, centrées verticalement sur la hauteur des cartes */}
      {index > 0 && (
        <Pressable style={[styles.arrow, styles.arrowLeft]} onPress={() => goTo(index - 1)} hitSlop={8}>
          <Text style={styles.arrowText}>‹</Text>
        </Pressable>
      )}
      {index < services.length - 1 && (
        <Pressable style={[styles.arrow, styles.arrowRight]} onPress={() => goTo(index + 1)} hitSlop={8}>
          <Text style={styles.arrowText}>›</Text>
        </Pressable>
      )}

      <View style={styles.dots}>
        {services.map((s, i) => (
          <View key={s.key} style={[styles.dot, i === index && styles.dotActive]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { height: CARD_HEIGHT + 26 },
  card: {
    height: CARD_HEIGHT,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.sandDeep,
    justifyContent: 'flex-end',
  },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(8,10,14,0.38)' },
  placeholder: { alignItems: 'center', justifyContent: 'center' },
  placeholderIcon: { fontSize: 64 },
  content: { padding: 22, paddingBottom: 24 },
  title: { fontSize: 23, fontWeight: '800', color: colors.white, marginBottom: 9 },
  description: { fontSize: 13.5, color: 'rgba(255,255,255,0.92)', lineHeight: 20, marginBottom: 18 },
  ctaBtn: { alignSelf: 'flex-start', backgroundColor: colors.gold, borderRadius: radius.pill, paddingHorizontal: 18, paddingVertical: 12 },
  ctaText: { fontSize: 13, fontWeight: '800', color: colors.onyx },
  arrow: {
    position: 'absolute',
    top: '50%',
    marginTop: -(ARROW_SIZE / 2) - 13,
    width: ARROW_SIZE,
    height: ARROW_SIZE,
    borderRadius: ARROW_SIZE / 2,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
  },
  arrowLeft: { left: 6 },
  arrowRight: { right: 6 },
  arrowText: { fontSize: 22, fontWeight: '800', color: colors.charcoal, marginTop: -2 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 14 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.line },
  dotActive: { width: 16, backgroundColor: colors.gold },
});
