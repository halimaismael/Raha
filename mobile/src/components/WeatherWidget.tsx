import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { colors, radius } from '../theme/colors';

// Open-Meteo : API météo gratuite, sans clé requise — donnée réelle, mise à
// jour à l'ouverture puis toutes les 10 minutes tant que l'écran est affiché.
const MORONI_LAT = -11.7042;
const MORONI_LNG = 43.2402;
const REFRESH_INTERVAL_MS = 10 * 60 * 1000;
const CLOCK_TICK_MS = 30 * 1000;

// Site météo officiel des Comores (Agence Nationale de l'Aviation Civile et
// de la Météorologie) — bulletins et prévisions détaillées.
export const OFFICIAL_WEATHER_URL = 'https://meteocomores.km/';

// Traduction simplifiée des codes météo WMO utilisés par Open-Meteo
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

function formatComoresTime(date: Date) {
  return new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Indian/Comoro',
  }).format(date);
}

export default function WeatherWidget({ onPress }: { onPress?: () => void }) {
  const [temp, setTemp] = useState<number | null>(null);
  const [code, setCode] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    let cancelled = false;

    function loadWeather() {
      fetch(`https://api.open-meteo.com/v1/forecast?latitude=${MORONI_LAT}&longitude=${MORONI_LNG}&current_weather=true&timezone=Indian%2FComoro`)
        .then((res) => res.json())
        .then((data) => {
          if (cancelled) return;
          setTemp(Math.round(data.current_weather.temperature));
          setCode(data.current_weather.weathercode);
        })
        .catch(() => {})
        .finally(() => !cancelled && setLoading(false));
    }

    loadWeather();
    const weatherInterval = setInterval(loadWeather, REFRESH_INTERVAL_MS);
    const clockInterval = setInterval(() => setNow(new Date()), CLOCK_TICK_MS);
    return () => {
      cancelled = true;
      clearInterval(weatherInterval);
      clearInterval(clockInterval);
    };
  }, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="small" color={colors.ocean} />
      </View>
    );
  }

  if (temp == null) return null;

  const { label, icon } = describeWeatherCode(code ?? 0);

  return (
    <Pressable style={styles.container} onPress={onPress}>
      <View style={styles.left}>
        <Text style={styles.icon}>{icon}</Text>
        <View>
          <Text style={styles.temp}>{temp}°</Text>
          <Text style={styles.label}>{label}</Text>
        </View>
      </View>
      <View style={styles.right}>
        <View style={styles.locationRow}>
          <Text style={styles.location}>📍 Moroni</Text>
          <Text style={styles.time}>· {formatComoresTime(now)}</Text>
        </View>
        <Pressable hitSlop={8} onPress={onPress}>
          <Text style={styles.link}>Voir la météo complète ›</Text>
        </Pressable>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.white, marginHorizontal: 20, marginTop: 12,
    borderRadius: radius.md, paddingHorizontal: 16, paddingVertical: 14,
    borderWidth: 1, borderColor: colors.line,
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  icon: { fontSize: 26 },
  temp: { fontSize: 17, fontWeight: '800', color: colors.charcoal, lineHeight: 20 },
  label: { fontSize: 11, color: colors.slate, lineHeight: 14 },
  right: { alignItems: 'flex-end' },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  location: { fontSize: 12, color: colors.charcoal, fontWeight: '700' },
  time: { fontSize: 11, color: colors.slate, fontWeight: '600' },
  link: { fontSize: 11, color: colors.gold, fontWeight: '700', marginTop: 3 },
});
