import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, ScrollView, Linking } from 'react-native';
import { colors, radius, typography } from '../../theme/colors';
import { OFFICIAL_WEATHER_URL } from '../../components/WeatherWidget';

const MORONI_LAT = -11.7042;
const MORONI_LNG = 43.2402;

function describeWeatherCode(code: number): { label: string; icon: string } {
  if (code === 0) return { label: 'Ensoleillé', icon: '☀️' };
  if ([1, 2].includes(code)) return { label: 'Partiellement nuageux', icon: '⛅' };
  if (code === 3) return { label: 'Nuageux', icon: '☁️' };
  if ([45, 48].includes(code)) return { label: 'Brumeux', icon: '🌫️' };
  if ([51, 53, 55, 56, 57].includes(code)) return { label: 'Bruine', icon: '🌦️' };
  if ([61, 63, 65, 80, 81, 82].includes(code)) return { label: 'Pluvieux', icon: '🌧️' };
  if ([95, 96, 99].includes(code)) return { label: 'Orageux', icon: '⛈️' };
  return { label: 'Ensoleillé', icon: '☀️' };
}

export default function WeatherScreen({ navigation }: any) {
  const [current, setCurrent] = useState<{ temp: number; code: number } | null>(null);
  const [daily, setDaily] = useState<{ date: string; max: number; min: number; code: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${MORONI_LAT}&longitude=${MORONI_LNG}&current_weather=true&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=Indian%2FComoro`)
      .then((res) => res.json())
      .then((data) => {
        setCurrent({ temp: Math.round(data.current_weather.temperature), code: data.current_weather.weathercode });
        const days = data.daily.time.map((date: string, i: number) => ({
          date,
          max: Math.round(data.daily.temperature_2m_max[i]),
          min: Math.round(data.daily.temperature_2m_min[i]),
          code: data.daily.weathercode[i],
        }));
        setDaily(days);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()}><Text style={styles.back}>‹ Retour</Text></Pressable>
        <Text style={typography.display}>Météo</Text>
        <Text style={typography.bodyMuted}>Grande Comore · Moroni</Text>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.ocean} />
      ) : (
        <>
          {current && (
            <View style={styles.currentCard}>
              <Text style={styles.currentIcon}>{describeWeatherCode(current.code).icon}</Text>
              <Text style={styles.currentTemp}>{current.temp}°</Text>
              <Text style={styles.currentLabel}>{describeWeatherCode(current.code).label}</Text>
            </View>
          )}

          <Text style={styles.sectionTitle}>Météo de la semaine</Text>
          {daily.map((d, i) => {
            const { label, icon } = describeWeatherCode(d.code);
            const date = new Date(d.date);
            const dayLabel = i === 0 ? "Aujourd'hui" : date.toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'short' });
            return (
              <View key={d.date} style={styles.dayRow}>
                <Text style={styles.dayLabel}>{dayLabel}</Text>
                <Text style={styles.dayIcon}>{icon}</Text>
                <Text style={styles.dayCondition}>{label}</Text>
                <Text style={styles.dayTemp}>{d.max}° / {d.min}°</Text>
              </View>
            );
          })}

          <Pressable style={styles.officialLink} onPress={() => Linking.openURL(OFFICIAL_WEATHER_URL)}>
            <Text style={styles.officialLinkText}>Plus d'infos sur Comores Météo →</Text>
            <Text style={styles.officialLinkUrl}>{OFFICIAL_WEATHER_URL}</Text>
          </Pressable>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.sand },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 10 },
  back: { color: colors.ocean, fontWeight: '600', marginBottom: 14, fontSize: 15 },
  currentCard: { alignItems: 'center', marginTop: 20, marginBottom: 30 },
  currentIcon: { fontSize: 56 },
  currentTemp: { fontSize: 48, fontWeight: '800', color: colors.charcoal, marginTop: 6 },
  currentLabel: { fontSize: 15, color: colors.slate, marginTop: 2 },
  sectionTitle: { ...typography.h2, marginHorizontal: 20, marginBottom: 10 },
  dayRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, marginHorizontal: 20, marginBottom: 8, borderRadius: radius.md, padding: 14, borderWidth: 1, borderColor: colors.line },
  dayLabel: { flex: 1.3, fontSize: 13, fontWeight: '700', color: colors.charcoal, textTransform: 'capitalize' },
  dayIcon: { fontSize: 18, marginRight: 8 },
  dayCondition: { flex: 1.5, fontSize: 12, color: colors.slate },
  dayTemp: { fontSize: 13, fontWeight: '700', color: colors.charcoal },
  officialLink: { marginHorizontal: 20, marginTop: 18, padding: 16, borderRadius: radius.md, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line },
  officialLinkText: { fontSize: 13, fontWeight: '800', color: colors.gold },
  officialLinkUrl: { fontSize: 11, color: colors.slate, marginTop: 3 },
});
