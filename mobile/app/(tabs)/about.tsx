import { ScrollView, StyleSheet, Text, View } from "react-native";

export default function AboutScreen() {
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
    >
      <View style={styles.logo}>
        <Text style={styles.logoText}>🐾</Text>
      </View>

      <Text style={styles.title}>VetCare Mobile</Text>

      <Text style={styles.description}>
        Aplikacja mobilna do zarządzania podstawowymi informacjami
        o zwierzętach.
      </Text>

      <View style={styles.feature}>
        <Text style={styles.featureTitle}>Wspólne REST API</Text>
        <Text style={styles.featureText}>
          PWA i aplikacja mobilna korzystają z tej samej bazy danych.
        </Text>
      </View>

      <View style={styles.feature}>
        <Text style={styles.featureTitle}>Tryb offline</Text>
        <Text style={styles.featureText}>
          Ostatnio pobrana lista zwierząt jest przechowywana lokalnie.
        </Text>
      </View>

      <View style={styles.feature}>
        <Text style={styles.featureTitle}>Funkcja natywna</Text>
        <Text style={styles.featureText}>
          Aplikacja wykorzystuje aparat telefonu do wykonywania zdjęć
          zwierząt.
        </Text>
      </View>

      <View style={styles.feature}>
        <Text style={styles.featureTitle}>Bezpieczeństwo</Text>
        <Text style={styles.featureText}>
          Dostęp do API zabezpieczony jest tokenem JWT.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f4f7fb",
  },
  container: {
    padding: 24,
    paddingBottom: 50,
  },
  logo: {
    width: 80,
    height: 80,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 24,
    backgroundColor: "#dbeafe",
  },
  logoText: {
    fontSize: 36,
  },
  title: {
    marginTop: 20,
    color: "#17324d",
    fontSize: 28,
    fontWeight: "800",
    textAlign: "center",
  },
  description: {
    marginTop: 10,
    marginBottom: 24,
    color: "#697b8c",
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
  },
  feature: {
    marginBottom: 14,
    padding: 18,
    borderRadius: 16,
    backgroundColor: "#ffffff",
  },
  featureTitle: {
    color: "#17324d",
    fontSize: 17,
    fontWeight: "800",
  },
  featureText: {
    marginTop: 6,
    color: "#526477",
    lineHeight: 21,
  },
});