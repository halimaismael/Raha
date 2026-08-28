import React, { useEffect, useRef, useState } from 'react';
import { Modal, View, Text, Pressable, StyleSheet, Animated, Easing, Dimensions, Image, ScrollView } from 'react-native';
import { colors, radius } from '../theme/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MENU_WIDTH = Math.min(300, SCREEN_WIDTH * 0.8);

export type SideMenuChild = {
  key: string;
  label: string;
  onPress: () => void;
};

export type SideMenuItem = {
  key: string;
  label: string;
  icon: string;
  onPress?: () => void;
  children?: SideMenuChild[];
};

export default function SideMenu({
  visible,
  onClose,
  items,
}: {
  visible: boolean;
  onClose: () => void;
  items: SideMenuItem[];
}) {
  const translateX = useRef(new Animated.Value(-MENU_WIDTH)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const [rendered, setRendered] = useState(visible);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setRendered(true);
      Animated.parallel([
        Animated.timing(translateX, { toValue: 0, duration: 260, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(backdropOpacity, { toValue: 1, duration: 260, useNativeDriver: true }),
      ]).start();
    } else if (rendered) {
      Animated.parallel([
        Animated.timing(translateX, { toValue: -MENU_WIDTH, duration: 220, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
        Animated.timing(backdropOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start(() => setRendered(false));
      setExpandedKey(null);
    }
  }, [visible]);

  if (!rendered) return null;

  return (
    <Modal transparent visible animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.root}>
        <Animated.View style={[StyleSheet.absoluteFillObject, styles.backdrop, { opacity: backdropOpacity }]}>
          <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />
        </Animated.View>

        <Animated.View style={[styles.panel, { transform: [{ translateX }] }]}>
          <View style={styles.header}>
            <View style={styles.logoBadge}>
              <Image source={require('../../assets/logo-mark.png')} style={styles.logo} resizeMode="contain" />
            </View>
            <View>
              <Text style={styles.brand}>RAHA</Text>
              <Text style={styles.tagline}>Votre trajet, notre priorité</Text>
            </View>
          </View>

          <ScrollView style={styles.items} contentContainerStyle={{ paddingBottom: 90 }}>
            {items.map((item) => {
              const isExpanded = expandedKey === item.key;
              return (
                <View key={item.key}>
                  <Pressable
                    style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
                    onPress={() => {
                      if (item.children) {
                        setExpandedKey(isExpanded ? null : item.key);
                      } else {
                        item.onPress?.();
                      }
                    }}
                  >
                    <Text style={styles.itemIcon}>{item.icon}</Text>
                    <Text style={styles.itemLabel}>{item.label}</Text>
                    <Text style={[styles.chevron, item.children && isExpanded && styles.chevronExpanded]}>
                      {item.children ? '⌄' : '›'}
                    </Text>
                  </Pressable>

                  {item.children && isExpanded && (
                    <View style={styles.submenu}>
                      {item.children.map((child) => (
                        <Pressable
                          key={child.key}
                          style={({ pressed }) => [styles.subItem, pressed && styles.itemPressed]}
                          onPress={child.onPress}
                        >
                          <Text style={styles.subItemLabel}>{child.label}</Text>
                        </Pressable>
                      ))}
                    </View>
                  )}
                </View>
              );
            })}
          </ScrollView>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Raha — Votre trajet, notre priorité</Text>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, flexDirection: 'row' },
  backdrop: { backgroundColor: 'rgba(10,12,16,0.45)' },
  panel: {
    width: MENU_WIDTH,
    height: '100%',
    backgroundColor: colors.white,
    paddingTop: 58,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 16,
    shadowOffset: { width: 4, height: 0 },
    elevation: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 22,
    paddingBottom: 22,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  logoBadge: {
    width: 40, height: 40, borderRadius: radius.md, backgroundColor: colors.ocean,
    alignItems: 'center', justifyContent: 'center', padding: 6,
  },
  logo: { width: '100%', height: '100%' },
  brand: { fontSize: 16, fontWeight: '800', color: colors.charcoal, letterSpacing: 1 },
  tagline: { fontSize: 10.5, color: colors.coral, fontStyle: 'italic', marginTop: 1 },
  items: { paddingTop: 10, paddingHorizontal: 12 },
  item: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 12, paddingVertical: 15, borderRadius: radius.md,
  },
  itemPressed: { backgroundColor: colors.sandDeep },
  itemIcon: { fontSize: 19, width: 24, textAlign: 'center' },
  itemLabel: { flex: 1, fontSize: 14.5, fontWeight: '700', color: colors.charcoal },
  chevron: { fontSize: 20, color: colors.slate },
  chevronExpanded: { color: colors.ocean },
  submenu: { paddingLeft: 38, paddingBottom: 6 },
  subItem: { paddingVertical: 12, paddingHorizontal: 12, borderRadius: radius.md },
  subItemLabel: { fontSize: 13, color: colors.slate, fontWeight: '600', lineHeight: 18 },
  footer: { position: 'absolute', bottom: 28, left: 22, right: 22 },
  footerText: { fontSize: 11, color: colors.slate, textAlign: 'center' },
});
