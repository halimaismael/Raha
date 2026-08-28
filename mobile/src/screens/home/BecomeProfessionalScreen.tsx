import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { colors, radius, typography } from '../../theme/colors';
import { api } from '../../services/api';

const CITIES = ['Moroni', 'Mitsamiouli', 'Foumbouni', 'Mbéni', 'Ouzioini', 'Mitsoudjé', 'Dembéni'];
const LICENSE_TYPES = ['VOITURE', 'BUS', 'CAMION'] as const;
const LICENSE_TYPE_LABELS: Record<string, string> = { VOITURE: 'Voiture', BUS: 'Bus', CAMION: 'Camion' };
const TIME_SLOTS = ['08:00', '09:00', '10:00', '11:00', '14:00', '15:00', '16:00'];
const DAY_NAMES = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
const MONTH_SHORT = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];

function buildNextDays(count: number) {
  const days: Date[] = [];
  const today = new Date();
  for (let i = 1; i <= count; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push(d);
  }
  return days;
}

export default function BecomeProfessionalScreen({ navigation }: any) {
  const [type, setType] = useState<'AGENCE' | 'PARTICULIER'>('PARTICULIER');
  const [agencyName, setAgencyName] = useState('');
  const [city, setCity] = useState(CITIES[0]);
  const [phone, setPhone] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [password, setPassword] = useState('');

  // Champs spécifiques au parcours "Particulier"
  const [licenseB, setLicenseB] = useState<boolean | null>(null);
  const [licenseType, setLicenseType] = useState<typeof LICENSE_TYPES[number] | null>(null);
  const [ownsVehicle, setOwnsVehicle] = useState<boolean | null>(null);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const nextDays = useMemo(() => buildNextDays(14), []);

  async function handleSubmit() {
    if (!agencyName || !phone || !adminName || !adminEmail || !password) {
      setError('Merci de remplir tous les champs obligatoires.');
      return;
    }
    if (type === 'PARTICULIER' && (!selectedDay || !selectedTime)) {
      setError('Merci de choisir un jour et une heure de rendez-vous.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      let appointmentDate: string | undefined;
      if (type === 'PARTICULIER' && selectedDay && selectedTime) {
        const [h, m] = selectedTime.split(':').map(Number);
        const d = new Date(selectedDay);
        d.setHours(h, m, 0, 0);
        appointmentDate = d.toISOString();
      }
      const { data } = await api.post('/auth/agencies/register', {
        type, agencyName, city, phone, adminName, adminEmail, password,
        ...(type === 'PARTICULIER' ? { licenseB, licenseType, ownsVehicle, appointmentDate } : {}),
      });
      setSuccess(data?.message || 'Votre demande a bien été envoyée.');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Envoi impossible pour le moment, réessayez.');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <View style={styles.successContainer}>
        <View style={styles.successBadge}><Text style={{ fontSize: 30 }}>✅</Text></View>
        <Text style={styles.successTitle}>Demande envoyée</Text>
        <Text style={styles.successText}>{success}</Text>
        <Pressable style={styles.primaryBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.primaryBtnText}>Retour à l'accueil</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 24, paddingTop: 60, paddingBottom: 60 }}>
      <Pressable onPress={() => navigation.goBack()}><Text style={styles.back}>‹ Retour</Text></Pressable>

      <Text style={typography.display}>Devenir Professionnel</Text>
      <Text style={styles.intro}>
        Rejoignez le réseau Raha : mettez vos véhicules à disposition des usagers et développez votre activité
        partout en Grande Comore.
      </Text>

      <View style={styles.typeRow}>
        <Pressable
          style={[styles.typeCard, type === 'PARTICULIER' && styles.typeCardActive]}
          onPress={() => setType('PARTICULIER')}
        >
          <Text style={styles.typeIcon}>🚘</Text>
          <Text style={[styles.typeLabel, type === 'PARTICULIER' && styles.typeLabelActive]}>Particulier</Text>
          <Text style={styles.typeHint}>Je mets ma propre voiture à disposition</Text>
        </Pressable>
        <Pressable
          style={[styles.typeCard, type === 'AGENCE' && styles.typeCardActive]}
          onPress={() => setType('AGENCE')}
        >
          <Text style={styles.typeIcon}>🏢</Text>
          <Text style={[styles.typeLabel, type === 'AGENCE' && styles.typeLabelActive]}>Agence</Text>
          <Text style={styles.typeHint}>Société avec une flotte de bus, taxis ou camions</Text>
        </Pressable>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Text style={styles.label}>{type === 'AGENCE' ? "Nom de l'agence" : 'Votre nom / nom commercial'}</Text>
      <TextInput style={styles.input} value={agencyName} onChangeText={setAgencyName} placeholder={type === 'AGENCE' ? 'Transport Karthala Express' : 'Ali Mohamed'} placeholderTextColor={colors.slate} />

      <Text style={styles.label}>Ville</Text>
      <View style={styles.wrapRow}>
        {CITIES.map((c) => (
          <Pressable key={c} style={[styles.pill, city === c && styles.pillActive]} onPress={() => setCity(c)}>
            <Text style={[styles.pillText, city === c && styles.pillTextActive]}>{c}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>Téléphone</Text>
      <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="+269 3XX XX XX" keyboardType="phone-pad" placeholderTextColor={colors.slate} />

      {type === 'PARTICULIER' && (
        <View style={styles.driverSection}>
          <Text style={styles.sectionTitle}>Votre profil de conducteur</Text>

          <Text style={styles.label}>Avez-vous le permis de conduire (catégorie B) ?</Text>
          <View style={styles.wrapRow}>
            <Pressable style={[styles.pill, licenseB === true && styles.pillActive]} onPress={() => setLicenseB(true)}>
              <Text style={[styles.pillText, licenseB === true && styles.pillTextActive]}>Oui</Text>
            </Pressable>
            <Pressable style={[styles.pill, licenseB === false && styles.pillActive]} onPress={() => { setLicenseB(false); setLicenseType(null); }}>
              <Text style={[styles.pillText, licenseB === false && styles.pillTextActive]}>Non</Text>
            </Pressable>
          </View>

          {licenseB === true && (
            <>
              <Text style={styles.label}>Quel type de permis possédez-vous ?</Text>
              <View style={styles.wrapRow}>
                {LICENSE_TYPES.map((lt) => (
                  <Pressable key={lt} style={[styles.pill, licenseType === lt && styles.pillActive]} onPress={() => setLicenseType(lt)}>
                    <Text style={[styles.pillText, licenseType === lt && styles.pillTextActive]}>{LICENSE_TYPE_LABELS[lt]}</Text>
                  </Pressable>
                ))}
              </View>
            </>
          )}

          <Text style={styles.label}>Possédez-vous déjà un véhicule ?</Text>
          <View style={styles.wrapRow}>
            <Pressable style={[styles.pill, ownsVehicle === true && styles.pillActive]} onPress={() => setOwnsVehicle(true)}>
              <Text style={[styles.pillText, ownsVehicle === true && styles.pillTextActive]}>Oui</Text>
            </Pressable>
            <Pressable style={[styles.pill, ownsVehicle === false && styles.pillActive]} onPress={() => setOwnsVehicle(false)}>
              <Text style={[styles.pillText, ownsVehicle === false && styles.pillTextActive]}>Non</Text>
            </Pressable>
          </View>

          <Text style={styles.sectionTitle}>Prendre rendez-vous</Text>
          <Text style={styles.bodyMuted}>Choisissez un jour et une heure pour finaliser votre dossier avec notre équipe.</Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }} contentContainerStyle={{ gap: 8 }}>
            {nextDays.map((d) => {
              const active = selectedDay?.toDateString() === d.toDateString();
              return (
                <Pressable key={d.toISOString()} style={[styles.dayPill, active && styles.pillActive]} onPress={() => setSelectedDay(d)}>
                  <Text style={[styles.dayPillWeekday, active && styles.pillTextActive]}>{DAY_NAMES[d.getDay()]}</Text>
                  <Text style={[styles.dayPillDate, active && styles.pillTextActive]}>{d.getDate()} {MONTH_SHORT[d.getMonth()]}</Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <View style={[styles.wrapRow, { marginTop: 12 }]}>
            {TIME_SLOTS.map((t) => (
              <Pressable key={t} style={[styles.pill, selectedTime === t && styles.pillActive]} onPress={() => setSelectedTime(t)}>
                <Text style={[styles.pillText, selectedTime === t && styles.pillTextActive]}>{t}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      <Text style={styles.label}>Votre nom complet</Text>
      <TextInput style={styles.input} value={adminName} onChangeText={setAdminName} placeholderTextColor={colors.slate} />

      <Text style={styles.label}>Email de connexion</Text>
      <TextInput style={styles.input} value={adminEmail} onChangeText={setAdminEmail} autoCapitalize="none" keyboardType="email-address" placeholderTextColor={colors.slate} />

      <Text style={styles.label}>Mot de passe</Text>
      <TextInput style={styles.input} value={password} onChangeText={setPassword} secureTextEntry placeholderTextColor={colors.slate} />

      <Pressable style={styles.primaryBtn} onPress={handleSubmit} disabled={loading}>
        {loading ? <ActivityIndicator color={colors.white} /> : <Text style={styles.primaryBtnText}>Envoyer ma demande</Text>}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.sand },
  back: { color: colors.ocean, fontWeight: '600', marginBottom: 14, fontSize: 15 },
  intro: { fontSize: 14, color: colors.slate, marginTop: 8, lineHeight: 20 },
  bodyMuted: { fontSize: 12.5, color: colors.slate, marginTop: 4, lineHeight: 17 },
  typeRow: { flexDirection: 'row', gap: 10, marginTop: 24 },
  typeCard: { flex: 1, borderRadius: radius.lg, borderWidth: 2, borderColor: colors.line, backgroundColor: colors.white, padding: 14 },
  typeCardActive: { borderColor: colors.ocean, backgroundColor: '#EAF3F2' },
  typeIcon: { fontSize: 22, marginBottom: 8 },
  typeLabel: { fontSize: 14, fontWeight: '800', color: colors.charcoal },
  typeLabelActive: { color: colors.ocean },
  typeHint: { fontSize: 11, color: colors.slate, marginTop: 4, lineHeight: 15 },
  error: { backgroundColor: '#FDECEC', color: colors.danger, fontSize: 13, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 12, marginTop: 20 },
  label: { ...typography.caption, marginBottom: 6, marginTop: 18 },
  input: { backgroundColor: colors.white, borderRadius: radius.md, paddingHorizontal: 16, paddingVertical: 13, borderWidth: 1, borderColor: colors.line, fontSize: 14.5, color: colors.charcoal },
  wrapRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: { paddingVertical: 8, paddingHorizontal: 13, borderRadius: radius.pill, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line },
  pillActive: { backgroundColor: colors.ocean, borderColor: colors.ocean },
  pillText: { fontSize: 12.5, fontWeight: '600', color: colors.charcoal },
  pillTextActive: { color: colors.white },
  driverSection: { marginTop: 8, backgroundColor: colors.white, borderRadius: radius.lg, padding: 16, borderWidth: 1, borderColor: colors.line },
  sectionTitle: { fontSize: 14.5, fontWeight: '800', color: colors.charcoal, marginTop: 16 },
  dayPill: { alignItems: 'center', paddingVertical: 10, paddingHorizontal: 14, borderRadius: radius.md, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line },
  dayPillWeekday: { fontSize: 10, fontWeight: '700', color: colors.slate, textTransform: 'uppercase' },
  dayPillDate: { fontSize: 12.5, fontWeight: '800', color: colors.charcoal, marginTop: 2 },
  primaryBtn: { backgroundColor: colors.ocean, borderRadius: radius.pill, paddingVertical: 16, alignItems: 'center', marginTop: 30, minHeight: 52, justifyContent: 'center' },
  primaryBtnText: { ...typography.button },
  successContainer: { flex: 1, backgroundColor: colors.sand, alignItems: 'center', justifyContent: 'center', padding: 32 },
  successBadge: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#E3F6EE', alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  successTitle: { fontSize: 20, fontWeight: '800', color: colors.charcoal, marginBottom: 8 },
  successText: { fontSize: 14, color: colors.slate, textAlign: 'center', lineHeight: 20, marginBottom: 26 },
});
