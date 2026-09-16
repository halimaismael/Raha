import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { colors, radius, typography } from '../theme/colors';

// Sans ce filet, une erreur JS pendant le rendu d'un écran fait planter
// l'app en silence en production (EAS build) : on tombe sur une page
// blanche, sans aucun indice. Avec ce composant, l'erreur s'affiche
// lisiblement à l'écran (message + trace) — ce qui permet de la corriger
// au lieu de deviner. À garder même une fois l'app stable : mieux vaut
// toujours ça qu'une page blanche pour l'utilisateur final.

type Props = { children: React.ReactNode };
type State = { error: Error | null; info: string | null };

export default class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null, info: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    this.setState({ info: info.componentStack || null });
    // eslint-disable-next-line no-console
    console.error('ErrorBoundary a intercepté :', error, info.componentStack);
  }

  reset = () => this.setState({ error: null, info: null });

  render() {
    const { error, info } = this.state;
    if (!error) return this.props.children;
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.icon}>⚠️</Text>
          <Text style={styles.title}>Une erreur est survenue</Text>
          <Text style={styles.subtitle}>
            Faites une capture d'écran de ce message et envoyez-la pour qu'on corrige le problème.
          </Text>
          <View style={styles.box}>
            <Text style={styles.boxLabel}>Message</Text>
            <Text style={styles.boxText}>{error.message}</Text>
          </View>
          {!!info && (
            <View style={styles.box}>
              <Text style={styles.boxLabel}>Écran concerné</Text>
              <Text style={styles.boxText}>{info.trim().split('\n').slice(0, 6).join('\n')}</Text>
            </View>
          )}
          <Pressable style={styles.btn} onPress={this.reset}>
            <Text style={styles.btnText}>Réessayer</Text>
          </Pressable>
        </ScrollView>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.sand },
  scroll: { padding: 24, paddingTop: 70, alignItems: 'center' },
  icon: { fontSize: 36, marginBottom: 10 },
  title: { ...typography.h1, marginBottom: 6, textAlign: 'center' },
  subtitle: { ...typography.bodyMuted, textAlign: 'center', marginBottom: 20 },
  box: { backgroundColor: colors.white, borderRadius: radius.md, padding: 14, borderWidth: 1, borderColor: colors.line, width: '100%', marginBottom: 14 },
  boxLabel: { fontSize: 11, fontWeight: '700', color: colors.slate, marginBottom: 6 },
  boxText: { fontSize: 12.5, color: colors.charcoal, fontFamily: 'monospace' },
  btn: { backgroundColor: colors.ocean, borderRadius: radius.pill, paddingVertical: 14, paddingHorizontal: 32, marginTop: 8 },
  btnText: { ...typography.button },
});
