import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
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
  PET_PHOTOS_KEY,
  PETS_CACHE_KEY,
  TOKEN_KEY,
  type Pet,
} from "../../lib/api";

import {
  getPendingPets,
  removePendingPet,
  syncPendingPets,
  type PendingPet,
} from "../../lib/offlineQueue";

export default function PetsScreen() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [pendingPets, setPendingPets] = useState<PendingPet[]>([]);
  const [photos, setPhotos] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const readPhotos = useCallback(async () => {
    const savedPhotos = await AsyncStorage.getItem(PET_PHOTOS_KEY);

    if (!savedPhotos) {
      return {};
    }

    try {
      return JSON.parse(savedPhotos) as Record<string, string>;
    } catch {
      return {};
    }
  }, []);

  const readCachedPets = useCallback(async () => {
    const cachedData = await AsyncStorage.getItem(PETS_CACHE_KEY);

    if (!cachedData) {
      return [];
    }

    try {
      return JSON.parse(cachedData) as Pet[];
    } catch {
      return [];
    }
  }, []);

  const loadLocalState = useCallback(async () => {
    const [cachedPets, queue, savedPhotos] = await Promise.all([
      readCachedPets(),
      getPendingPets(),
      readPhotos(),
    ]);

    setPets(cachedPets);
    setPendingPets(queue);
    setPhotos(savedPhotos);
  }, [readCachedPets, readPhotos]);

  const refreshData = useCallback(async () => {
    setLoading(true);

    try {
      /*
       * Najpierw próbujemy wysłać rekordy zapisane offline.
       */
      await syncPendingPets();

      /*
       * Następnie pobieramy aktualną listę z serwera.
       */
      const serverPets = await apiRequest<Pet[]>("/pets");

      const [queue, savedPhotos] = await Promise.all([
        getPendingPets(),
        readPhotos(),
      ]);

      setPets(serverPets);
      setPendingPets(queue);
      setPhotos(savedPhotos);
      setOffline(false);

      await AsyncStorage.setItem(
        PETS_CACHE_KEY,
        JSON.stringify(serverPets),
      );
    } catch {
      /*
       * Gdy API jest niedostępne, pokazujemy dane lokalne.
       */
      setOffline(true);
      await loadLocalState();
    } finally {
      setLoading(false);
    }
  }, [loadLocalState, readPhotos]);

  useFocusEffect(
    useCallback(() => {
      void refreshData();
    }, [refreshData]),
  );

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((networkState) => {
      if (networkState.isConnected === false) {
        setOffline(true);
        void loadLocalState();
        return;
      }

      if (networkState.isConnected === true) {
        void refreshData();
      }
    });

    return unsubscribe;
  }, [loadLocalState, refreshData]);

  async function synchronizeManually() {
    setSyncing(true);

    try {
      const result = await syncPendingPets();

      await refreshData();

      if (result.synchronized > 0) {
        Alert.alert(
          "Synchronizacja zakończona",
          `Wysłano rekordy: ${result.synchronized}.`,
        );
        return;
      }

      if (result.remaining > 0) {
        Alert.alert(
          "Serwer niedostępny",
          "Dane nadal oczekują na synchronizację.",
        );
        return;
      }

      Alert.alert(
        "Synchronizacja",
        "Nie ma danych oczekujących na wysłanie.",
      );
    } catch {
      Alert.alert(
        "Błąd synchronizacji",
        "Nie udało się połączyć z serwerem.",
      );
    } finally {
      setSyncing(false);
    }
  }

  function confirmDeletePet(pet: Pet) {
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

              await refreshData();
            } catch {
              Alert.alert(
                "Nie udało się usunąć",
                "Sprawdź połączenie z serwerem.",
              );
            }
          },
        },
      ],
    );
  }

  function confirmDeletePendingPet(pet: PendingPet) {
    Alert.alert(
      "Usuń zapis lokalny",
      `Czy usunąć profil ${pet.payload.name}, który oczekuje na synchronizację?`,
      [
        {
          text: "Anuluj",
          style: "cancel",
        },
        {
          text: "Usuń",
          style: "destructive",
          onPress: async () => {
            await removePendingPet(pet.localId);

            const queue = await getPendingPets();
            setPendingPets(queue);
          },
        },
      ],
    );
  }

  async function logout() {
    await AsyncStorage.removeItem(TOKEN_KEY);
    router.replace("/");
  }

  function getAnimalIcon(species: string) {
    const normalizedSpecies = species.toLowerCase();

    if (normalizedSpecies.includes("kot")) {
      return "🐱";
    }

    if (normalizedSpecies.includes("pies")) {
      return "🐶";
    }

    return "🐾";
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={loading}
          onRefresh={refreshData}
          tintColor="#2563eb"
        />
      }
    >
      <View style={styles.heading}>
        <View style={styles.headingText}>
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
          <Text style={styles.bannerIcon}>⚠️</Text>

          <View style={styles.bannerContent}>
            <Text style={styles.offlineTitle}>
              Brak połączenia z serwerem
            </Text>

            <Text style={styles.offlineText}>
              Możesz nadal dodawać zwierzęta. Dane zostaną zapisane
              lokalnie i wysłane po odzyskaniu połączenia.
            </Text>
          </View>
        </View>
      ) : (
        <View style={styles.onlineBanner}>
          <Text style={styles.onlineText}>
            ● Połączono z serwerem
          </Text>
        </View>
      )}

      {pendingPets.length > 0 && (
        <View style={styles.syncPanel}>
          <View style={styles.syncTextContainer}>
            <Text style={styles.syncTitle}>
              Oczekujące dane: {pendingPets.length}
            </Text>

            <Text style={styles.syncDescription}>
              Dane są bezpiecznie zapisane w pamięci telefonu.
            </Text>
          </View>

          <Pressable
            style={[
              styles.syncButton,
              syncing && styles.disabledButton,
            ]}
            onPress={synchronizeManually}
            disabled={syncing}
          >
            {syncing ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.syncButtonText}>
                Synchronizuj
              </Text>
            )}
          </Pressable>
        </View>
      )}

      {loading &&
        pets.length === 0 &&
        pendingPets.length === 0 && (
          <ActivityIndicator
            size="large"
            color="#2563eb"
            style={styles.loader}
          />
        )}

      {!loading &&
        pets.length === 0 &&
        pendingPets.length === 0 && (
          <Text style={styles.emptyText}>
            Nie dodano jeszcze żadnych zwierząt.
          </Text>
        )}

      <View style={styles.cards}>
        {pendingPets.map((pet) => (
          <View
            key={pet.localId}
            style={[styles.card, styles.pendingCard]}
          >
            {pet.photoUri ? (
              <Image
                source={{ uri: pet.photoUri }}
                style={styles.photo}
              />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {getAnimalIcon(pet.payload.species)}
                </Text>
              </View>
            )}

            <View style={styles.pendingBadge}>
              <Text style={styles.pendingBadgeText}>
                Oczekuje na synchronizację
              </Text>
            </View>

            <Text style={styles.petName}>
              {pet.payload.name}
            </Text>

            <Text style={styles.petDetail}>
              Gatunek: {pet.payload.species}
            </Text>

            <Text style={styles.petDetail}>
              Rasa: {pet.payload.breed || "Nie podano"}
            </Text>

            <Text style={styles.petDetail}>
              Data urodzenia:{" "}
              {pet.payload.birth_date || "Nie podano"}
            </Text>

            <Pressable
              style={styles.deleteButton}
              onPress={() => confirmDeletePendingPet(pet)}
            >
              <Text style={styles.deleteText}>
                Usuń zapis lokalny
              </Text>
            </Pressable>
          </View>
        ))}

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
                    {getAnimalIcon(pet.species)}
                  </Text>
                </View>
              )}

              <Text style={styles.petName}>
                {pet.name}
              </Text>

              <Text style={styles.petDetail}>
                Gatunek: {pet.species}
              </Text>

              <Text style={styles.petDetail}>
                Rasa: {pet.breed || "Nie podano"}
              </Text>

              <Text style={styles.petDetail}>
                Data urodzenia:{" "}
                {pet.birth_date || "Nie podano"}
              </Text>

              <Pressable
                style={styles.deleteButton}
                onPress={() => confirmDeletePet(pet)}
              >
                <Text style={styles.deleteText}>
                  Usuń
                </Text>
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
    paddingBottom: 50,
  },

  heading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },

  headingText: {
    flex: 1,
    paddingRight: 15,
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
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
    padding: 15,
    borderWidth: 2,
    borderColor: "#f59e0b",
    borderRadius: 14,
    backgroundColor: "#fff3cd",
  },

  bannerIcon: {
    fontSize: 25,
  },

  bannerContent: {
    flex: 1,
  },

  offlineTitle: {
    color: "#7c2d12",
    fontSize: 17,
    fontWeight: "900",
  },

  offlineText: {
    marginTop: 3,
    color: "#854d0e",
    lineHeight: 19,
  },

  onlineBanner: {
    alignSelf: "flex-start",
    marginBottom: 16,
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#dcfce7",
  },

  onlineText: {
    color: "#166534",
    fontWeight: "800",
  },

  syncPanel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
    padding: 14,
    borderWidth: 2,
    borderColor: "#2563eb",
    borderRadius: 14,
    backgroundColor: "#dbeafe",
  },

  syncTextContainer: {
    flex: 1,
  },

  syncTitle: {
    color: "#17324d",
    fontWeight: "900",
  },

  syncDescription: {
    marginTop: 3,
    color: "#36536f",
    fontSize: 13,
  },

  syncButton: {
    minWidth: 105,
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: "#2563eb",
  },

  syncButtonText: {
    color: "#ffffff",
    fontWeight: "800",
  },

  disabledButton: {
    opacity: 0.6,
  },

  loader: {
    marginTop: 45,
  },

  emptyText: {
    marginVertical: 25,
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

  pendingCard: {
    borderWidth: 2,
    borderColor: "#f59e0b",
    backgroundColor: "#fffdf5",
  },

  pendingBadge: {
    alignSelf: "flex-start",
    marginTop: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#fef3c7",
  },

  pendingBadgeText: {
    color: "#92400e",
    fontSize: 12,
    fontWeight: "900",
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