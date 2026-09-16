import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, Pressable, ScrollView } from 'react-native';
import { colors, radius } from '../theme/colors';

export type SuggestionOption = {
  key: string;
  name: string;
  image: any;
  eta: string;
  price: string;
};

// Estimations indicatives par classe de véhicule, à titre d'exemple —
// affichées avant même d'avoir renseigné un trajet précis.
const OPTIONS: SuggestionOption[] = [
  { key: 'GO', name: 'Raha Go', image: require('../../assets/suggestions/raha-go.jpg'), eta: '3 min', price: '2 500 KMF' },
  { key: 'CONFORT', name: 'Raha Confort', image: require('../../assets/suggestions/raha-confort.jpg'), eta: '5 min', price: '4 000 KMF' },
  { key: 'XL', name: 'Raha XL', image: require('../../assets/suggestions/raha-xl.jpg'), eta: '7 min', price: '6 000 KMF' },
];

export default function SuggestionsRow({ onSelect }: { onSelect: (option: SuggestionOption) => void }) {
  const [selected, setSelected] = useState('CONFORT');

  return (
    <View>
      <View style={styles.header}>
        <Text style={styles.title}>Suggestions</Text>
        <Pressable onPress={() => onSelect(OPTIONS.find((o) => o.key === selected) || OPTIONS[0])}>
          <Text style={styles.seeAll}>Voir tout →</Text>
        </Pressable>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {OPTIONS.map((o) => {
          const active = o.key === selected;
          return (
            <Pressable
              key={o.key}
              style={[styles.card, active && styles.cardActive]}
              onPress={() => { setSelected(o.key); onSelect(o); }}
            >
              <View style={styles.imageWrap}>
                <Image source={o.image} style={styles.image} resizeMode="contain" />
              </View>
              <Text style={styles.name} numberOfLines={1}>{o.name}</Text>
              <Text style={styles.eta}>{o.eta}</Text>
              <Text style={[styles.price, active && styles.priceActive]}>{o.price}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: 20, marginTop: 26, marginBottom: 12 },
  title: { fontSize: 18, fontWeight: '800', color: colors.charcoal },
  seeAll: { fontSize: 13, fontWeight: '700', color: colors.gold },
  row: { flexDirection: 'row', paddingHorizontal: 16, gap: 10 },
  card: {
    width: 108, alignItems: 'center', backgroundColor: colors.white, borderRadius: radius.md,
    paddingVertical: 12, paddingHorizontal: 8, marginHorizontal: 4, borderWidth: 1.5, borderColor: colors.line,
  },
  cardActive: { borderColor: colors.gold, backgroundColor: '#FFF8E8' },
  imageWrap: { width: '100%', height: 56, marginBottom: 6 },
  image: { width: '100%', height: '100%' },
  name: { fontSize: 11.5, fontWeight: '800', color: colors.charcoal, textAlign: 'center' },
  eta: { fontSize: 10, color: colors.slate, marginTop: 2 },
  price: { fontSize: 11, fontWeight: '800', color: colors.charcoal, marginTop: 6 },
  priceActive: { color: colors.gold },
});
