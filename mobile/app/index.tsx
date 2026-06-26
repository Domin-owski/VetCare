import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { apiRequest, TOKEN_KEY } from "../lib/api";

type LoginResponse = {
  access_token: string;
  token_type: string;
};

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [registerMode, setRegisterMode] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingToken, setCheckingToken] = useState(true);

  useEffect(() => {
    async function checkToken() {
      const token = await AsyncStorage.getItem(TOKEN_KEY);

      if (token) {
        router.replace("/(tabs)/pets");
        return;
      }

      setCheckingToken(false);
    }

    checkToken();
  }, []);

  async function submit() {
    setLoading(true);
    setMessage("");

    try {
      if (registerMode) {
        await apiRequest("/auth/register", {
          method: "POST",
          body: JSON.stringify({
            email,
            password,
          }),
        });
      }

      const response = await apiRequest<LoginResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email,
          password,
        }),
      });

      await AsyncStorage.setItem(
        TOKEN_KEY,
        response.access_token,
      );

      router.replace("/(tabs)/pets");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Nie udało się zalogować",
      );
    } finally {
      setLoading(false);
    }
  }

  if (checkingToken) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.logo}>
            <Text style={styles.logoText}>🐾</Text>
          </View>

          <Text style={styles.title}>
            {registerMode ? "Załóż konto" : "Witaj w VetCare"}
          </Text>

          <Text style={styles.subtitle}>
            Zarządzaj danymi swoich zwierząt.
          </Text>

          <View style={styles.form}>
            <Text style={styles.label}>Adres e-mail</Text>

            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="adres@email.pl"
            />

            <Text style={styles.label}>Hasło</Text>

            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="Minimum 6 znaków"
            />

            {message ? (
              <Text style={styles.message}>{message}</Text>
            ) : null}

            <Pressable
              style={styles.primaryButton}
              onPress={submit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.primaryButtonText}>
                  {registerMode
                    ? "Zarejestruj się"
                    : "Zaloguj się"}
                </Text>
              )}
            </Pressable>

            <Pressable
              onPress={() => {
                setRegisterMode(!registerMode);
                setMessage("");
              }}
            >
              <Text style={styles.switchText}>
                {registerMode
                  ? "Masz już konto? Zaloguj się"
                  : "Nie masz konta? Zarejestruj się"}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: "#f4f7fb",
  },
  container: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 28,
  },
  loader: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f4f7fb",
  },
  logo: {
    width: 76,
    height: 76,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 24,
    backgroundColor: "#dbeafe",
  },
  logoText: {
    fontSize: 34,
  },
  title: {
    marginTop: 22,
    color: "#17324d",
    fontSize: 30,
    fontWeight: "800",
    textAlign: "center",
  },
  subtitle: {
    marginTop: 8,
    color: "#697b8c",
    fontSize: 16,
    textAlign: "center",
  },
  form: {
    gap: 12,
    marginTop: 34,
    padding: 24,
    borderRadius: 24,
    backgroundColor: "#ffffff",
  },
  label: {
    marginTop: 5,
    color: "#243b53",
    fontWeight: "700",
  },
  input: {
    paddingHorizontal: 15,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "#c8d3df",
    borderRadius: 12,
    backgroundColor: "#ffffff",
    fontSize: 16,
  },
  message: {
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#fff7d6",
    color: "#765a00",
  },
  primaryButton: {
    alignItems: "center",
    marginTop: 8,
    padding: 15,
    borderRadius: 12,
    backgroundColor: "#2563eb",
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "800",
  },
  switchText: {
    paddingTop: 8,
    color: "#2563eb",
    fontWeight: "700",
    textAlign: "center",
  },
});