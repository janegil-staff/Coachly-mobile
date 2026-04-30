// src/screens/terms/TermsScreen.js
//
// Coachly Terms & Conditions screen.
// Reads structured content from t.termsSections (array of { title, body }).
// Falls back to English keys if a language is missing entries.

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { useLang } from '../../context/LangContext';

const BLUE = '#4A7AB5';

export default function TermsScreen({ navigation }) {
  const { theme } = useTheme();
  const { t } = useLang();
  const insets = useSafeAreaInsets();

  const sections = Array.isArray(t.termsSections) ? t.termsSections : [];

  const styles = makeStyles(theme);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor={BLUE} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.backArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {t.termsTitle ?? 'Terms & Conditions'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + 32 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Last updated */}
        <Text style={styles.lastUpdated}>
          {t.termsLastUpdated ?? 'Last updated: April 2026'}
        </Text>

        {/* Intro */}
        {t.termsIntro ? (
          <Text style={styles.intro}>{t.termsIntro}</Text>
        ) : null}

        {/* Sections */}
        {sections.map((s, i) => (
          <View key={i} style={styles.section}>
            <Text style={styles.sectionTitle}>{s.title}</Text>
            <Text style={styles.sectionBody}>{s.body}</Text>
          </View>
        ))}

        {/* Contact footer */}
        <View style={styles.footer}>
          <Text style={styles.footerLabel}>
            {t.termsContact ?? 'Contact'}
          </Text>
          <Text style={styles.footerText}>Qup DA</Text>
          <Text style={styles.footerText}>jan.egi.staff@qupda.com</Text>
        </View>

        <TouchableOpacity
          style={styles.btn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.85}
        >
          <Text style={styles.btnText}>{t.back ?? 'Back'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(theme) {
  return StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: theme?.bg ?? '#fff',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: BLUE,
      paddingHorizontal: 12,
      paddingVertical: 14,
    },
    backBtn: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    backArrow: {
      color: '#fff',
      fontSize: 32,
      fontWeight: '300',
      marginTop: -4,
    },
    headerTitle: {
      flex: 1,
      textAlign: 'center',
      color: '#fff',
      fontSize: 17,
      fontWeight: '600',
    },
    scroll: {
      paddingHorizontal: 20,
      paddingTop: 24,
    },
    lastUpdated: {
      color: theme?.textSecondary ?? '#888',
      fontSize: 13,
      fontStyle: 'italic',
      marginBottom: 16,
    },
    intro: {
      color: theme?.text ?? '#222',
      fontSize: 15,
      lineHeight: 22,
      marginBottom: 24,
    },
    section: {
      marginBottom: 22,
    },
    sectionTitle: {
      color: BLUE,
      fontSize: 16,
      fontWeight: '700',
      marginBottom: 8,
    },
    sectionBody: {
      color: theme?.textSecondary ?? '#444',
      fontSize: 14,
      lineHeight: 22,
    },
    footer: {
      marginTop: 8,
      marginBottom: 24,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: theme?.border ?? '#eee',
    },
    footerLabel: {
      color: BLUE,
      fontSize: 14,
      fontWeight: '700',
      marginBottom: 6,
    },
    footerText: {
      color: theme?.textSecondary ?? '#444',
      fontSize: 14,
      lineHeight: 22,
    },
    btn: {
      backgroundColor: BLUE,
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: 'center',
      marginTop: 8,
    },
    btnText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
  });
}
