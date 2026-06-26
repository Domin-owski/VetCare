import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, router } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  apiRequest,
  Pet,
  PET_PHOTOS_KEY,
  PETS_CACHE_KEY,
  TOKEN_KEY,
} from "../../lib/api";

export default function PetsScreen() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [photos, setPhotos] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);
  const [message, setMessage] = useState("");

  const loadPets = useCallback(async () => {
    setLoading(true);

    const savedPhotos = await AsyncStorage.getItem(PET_PHOTOS_KEY);

    if (savedPhotos) {
      setPhotos(JSON.parse(savedPhotos));
    }

    try {
      const data = await apiRequest<Pet[]>("/pets");

      setPets(data);
      setOffline(false);
      setMessage(
        data.length === 0
          ? "Nie dodano jeszcze żadnych zwierząt."
          : "",
      );

      await AsyncStorage.setItem(
        PETS_CACHE_KEY,
        JSON.stringify(data),
      );
    } catch (error) {
      const cachedData = await AsyncStorage.getItem(PETS_CACHE_KEY);
      const cachedPets = cachedData
        ? (JSON.parse(cachedData) as Pet[])
        : [];

      setPets(cachedPets);
      setOffline(true);

      setMessage(
        cachedPets.length > 0
          ? "Brak połączenia — wyświetlane są zapisane dane."
          : error instanceof Error
            ? error.message
            : "Nie udało się pobrać danych",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadPets();
    }, [loadPets]),
  );

  function confirmDelete(pet: Pet) {
    Alert.alert(
      "Usuwanie zwierzęcia",
      `Czy na pewno usunąć profil ${pet.name}?`,
      [
        {
          text: "Anuluj",
          style: "cancel",
        },
        {
          text: "Usuń",
          style: "destructive",
          onPress: async () => {
            try {
              await apiRequest(`/pets/${pet.id}`, {
                method: "DELETE",
              });

              const updatedPhotos = { ...photos };

              delete updatedPhotos[String(pet.id)];

              await AsyncStorage.setItem(
                PET_PHOTOS_KEY,
                JSON.stringify(updatedPhotos),
              );

              await loadPets();
            } catch (error) {
              Alert.alert(
                "Błąd",
                error instanceof Error
                  ? error.message
                  : "Nie udało się usunąć zwierzęcia",
              );
            }
          },
        },
      ],
    );
  }

  async function logout() {
    await AsyncStorage.removeItem(TOKEN_KEY);
    router.replace("/");
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={loading}
          onRefresh={loadPets}
        />
      }
    >
      <View style={styles.heading}>
        <View>
          <Text style={styles.title}>Twoje zwierzęta</Text>
          <Text style={styles.subtitle}>
            Profile przypisane do Twojego konta
          </Text>
        </View>

        <Pressable onPress={logout}>
          <Text style={styles.logout}>Wyloguj</Text>
        </Pressable>
      </View>

      {offline ? (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineText}>
            Tryb offline — dane pochodzą z pamięci telefonu.
          </Text>
        </View>
      ) : null}

      {loading && pets.length === 0 ? (
        <ActivityIndicator
          size="large"
          color="#2563eb"
          style={styles.loader}
        />
      ) : null}

      {message ? (
        <Text style={styles.message}>{message}</Text>
      ) : null}

      <View style={styles.cards}>
        {pets.map((pet) => {
          const photoUri = photos[String(pet.id)];

          return (
            <View key={pet.id} style={styles.card}>
              {photoUri ? (
                <Image
                  source={{ uri: photoUri }}
                  style={styles.photo}
                />
              ) : (
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {pet.species.toLowerCase().includes("kot")
                      ? "🐱"
                      : "🐶"}
                  </Text>
                </View>
              )}

              <Text style={styles.petName}>{pet.name}</Text>

              <Text style={styles.petDetail}>
                Gatunek: {pet.species}
              </Text>

              <Text style={styles.petDetail}>
                Rasa: {pet.breed || "Nie podano"}
              </Text>

              <Text style={styles.petDetail}>
                Data urodzenia: {pet.birth_date || "Nie podano"}
              </Text>

              <Pressable
                style={styles.deleteButton}
                onPress={() => confirmDelete(pet)}
              >
                <Text style={styles.deleteText}>Usuń</Text>
              </Pressable>
            </View>
          );
        })}
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
    padding: 18,
    paddingBottom: 40,
  },
  heading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  title: {
    color: "#17324d",
    fontSize: 27,
    fontWeight: "800",
  },
  subtitle: {
    marginTop: 4,
    color: "#697b8c",
  },
  logout: {
    color: "#2563eb",
    fontWeight: "800",
  },
  offlineBanner: {
    marginBottom: 15,
    padding: 13,
    borderRadius: 12,
    backgroundColor: "#fff7d6",
  },
  offlineText: {
    color: "#765a00",
  },
  loader: {
    marginTop: 50,
  },
  message: {
    marginVertical: 15,
    color: "#697b8c",
    textAlign: "center",
  },
  cards: {
    gap: 16,
  },
  card: {
    padding: 20,
    borderWidth: 1,
    borderColor: "#dfe5ee",
    borderRadius: 20,
    backgroundColor: "#ffffff",
  },
  avatar: {
    width: 68,
    height: 68,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    backgroundColor: "#dbeafe",
  },
  avatarText: {
    fontSize: 32,
  },
  photo: {
    width: "100%",
    height: 190,
    borderRadius: 16,
    resizeMode: "cover",
  },
  petName: {
    marginTop: 15,
    color: "#17324d",
    fontSize: 22,
    fontWeight: "800",
  },
  petDetail: {
    marginTop: 7,
    color: "#526477",
  },
  deleteButton: {
    alignSelf: "flex-start",
    marginTop: 18,
    paddingHorizontal: 17,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#fee2e2",
  },
  deleteText: {
    color: "#b91c1c",
    fontWeight: "800",
  },
});