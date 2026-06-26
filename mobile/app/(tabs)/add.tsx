import AsyncStorage from "@react-native-async-storage/async-storage";

import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";

import { Picker } from "@react-native-picker/picker";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useState } from "react";

import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  apiRequest,
  ApiError,
  PET_PHOTOS_KEY,
} from "../../lib/api";

import type {
  Pet,
  PetPayload,
} from "../../lib/api";

import {
  addPetToQueue,
} from "../../lib/offlineQueue";

function formatDateForApi(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDateForDisplay(date: Date): string {
  return new Intl.DateTimeFormat("pl-PL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

export default function AddPetScreen() {
  const [name, setName] = useState("");
  const [species, setSpecies] = useState("Pies");
  const [breed, setBreed] = useState("");

  const [birthDate, setBirthDate] =
    useState<string | null>(null);

  const [selectedDate, setSelectedDate] = useState(
    new Date(2020, 0, 1),
  );

  const [showDatePicker, setShowDatePicker] =
    useState(false);

  const [photoUri, setPhotoUri] =
    useState<string | null>(null);

  const [loading, setLoading] = useState(false);

  function resetForm() {
    setName("");
    setSpecies("Pies");
    setBreed("");
    setBirthDate(null);
    setSelectedDate(new Date(2020, 0, 1));
    setPhotoUri(null);
    setShowDatePicker(false);
  }

  async function takePhoto() {
    try {
      const permission =
        await ImagePicker.requestCameraPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          "Brak uprawnień",
          "Zezwól aplikacji VetCare na korzystanie z aparatu.",
        );

        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        quality: 0.7,
      });

      if (!result.canceled && result.assets.length > 0) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch {
      Alert.alert(
        "Błąd aparatu",
        "Nie udało się uruchomić aparatu.",
      );
    }
  }

  async function pickPhotoFromLibrary() {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          "Brak uprawnień",
          "Zezwól aplikacji VetCare na dostęp do biblioteki zdjęć.",
        );

        return;
      }

      const result =
        await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ["images"],
          allowsEditing: true,
          quality: 0.7,
        });

      if (!result.canceled && result.assets.length > 0) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch {
      Alert.alert(
        "Błąd biblioteki",
        "Nie udało się otworzyć biblioteki zdjęć.",
      );
    }
  }

  function handleDateChange(
    event: DateTimePickerEvent,
    date?: Date,
  ) {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
    }

    if (event.type === "dismissed" || !date) {
      return;
    }

    setSelectedDate(date);
    setBirthDate(formatDateForApi(date));
  }

  function clearBirthDate() {
    setBirthDate(null);
    setSelectedDate(new Date(2020, 0, 1));
    setShowDatePicker(false);
  }

  async function saveOnlinePhoto(
    petId: number,
    uri: string,
  ) {
    const rawPhotos = await AsyncStorage.getItem(
      PET_PHOTOS_KEY,
    );

    let photos: Record<string, string> = {};

    if (rawPhotos) {
      try {
        photos = JSON.parse(rawPhotos);
      } catch {
        photos = {};
      }
    }

    photos[String(petId)] = uri;

    await AsyncStorage.setItem(
      PET_PHOTOS_KEY,
      JSON.stringify(photos),
    );
  }

  async function savePet() {
    if (!name.trim()) {
      Alert.alert(
        "Brak danych",
        "Wpisz imię zwierzęcia.",
      );

      return;
    }

    const payload: PetPayload = {
      name: name.trim(),
      species,
      breed: breed.trim() || null,
      birth_date: birthDate,
    };

    setLoading(true);

    try {
      const createdPet = await apiRequest<Pet>("/pets", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (photoUri) {
        await saveOnlinePhoto(createdPet.id, photoUri);
      }

      resetForm();

      router.replace("/(tabs)/pets");
    } catch (error) {
      /*
       * Serwer odpowiedział, ale odrzucił dane.
       * Takiego rekordu nie zapisujemy do kolejki offline.
       */
      if (
        error instanceof ApiError &&
        error.status !== undefined
      ) {
        Alert.alert(
          "Nie udało się zapisać",
          error.message,
        );

        return;
      }

      /*
       * Brak połączenia z serwerem.
       * Zwierzę zostaje zapisane lokalnie.
       */
      try {
        await addPetToQueue(payload, photoUri);

        resetForm();

        Alert.alert(
          "Zapisano lokalnie",
          "Zwierzę oczekuje na synchronizację. Zostanie wysłane po odzyskaniu połączenia z serwerem.",
        );

        router.replace("/(tabs)/pets");
      } catch {
        Alert.alert(
          "Błąd zapisu lokalnego",
          "Nie udało się zapisać danych w pamięci telefonu.",
        );
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={
        Platform.OS === "ios"
          ? "padding"
          : undefined
      }
    >
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>
          Nowe zwierzę
        </Text>

        <Text style={styles.subtitle}>
          Dodaj podstawowe informacje oraz zdjęcie pupila.
        </Text>

        <View style={styles.form}>
          <Text style={styles.label}>
            Imię
          </Text>

          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="np. Luna"
            placeholderTextColor="#526477"
          />

          <Text style={styles.label}>
            Gatunek
          </Text>

          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={species}
              onValueChange={(value) =>
                setSpecies(value)
              }
              style={styles.picker}
              itemStyle={styles.pickerItem}
            >
              <Picker.Item
                label="Pies"
                value="Pies"
              />

              <Picker.Item
                label="Kot"
                value="Kot"
              />

              <Picker.Item
                label="Inne zwierzę"
                value="Inny"
              />
            </Picker>
          </View>

          <Text style={styles.label}>
            Rasa
          </Text>

          <TextInput
            style={styles.input}
            value={breed}
            onChangeText={setBreed}
            placeholder="np. York"
            placeholderTextColor="#526477"
          />

          <Text style={styles.label}>
            Data urodzenia
          </Text>

          <Pressable
            style={styles.dateButton}
            onPress={() =>
              setShowDatePicker(true)
            }
          >
            <Text
              style={
                birthDate
                  ? styles.dateValue
                  : styles.datePlaceholder
              }
            >
              {birthDate
                ? formatDateForDisplay(selectedDate)
                : "Wybierz datę z kalendarza"}
            </Text>

            <Text style={styles.calendarIcon}>
              📅
            </Text>
          </Pressable>

          {showDatePicker && (
            <View style={styles.calendarContainer}>
              <Text style={styles.calendarHeading}>
                Wybierz datę urodzenia
              </Text>

              <View style={styles.calendarBackground}>
                <DateTimePicker
                  value={selectedDate}
                  mode="date"
                  display={
                    Platform.OS === "ios"
                      ? "inline"
                      : "default"
                  }
                  maximumDate={new Date()}
                  minimumDate={new Date(1990, 0, 1)}
                  onChange={handleDateChange}
                  themeVariant="light"
                  textColor="#102a43"
                  accentColor="#0047b3"
                  locale="pl-PL"
                  style={styles.calendar}
                />
              </View>

              {Platform.OS === "ios" && (
                <Pressable
                  style={styles.closeCalendarButton}
                  onPress={() =>
                    setShowDatePicker(false)
                  }
                >
                  <Text style={styles.closeCalendarText}>
                    Zatwierdź datę
                  </Text>
                </Pressable>
              )}
            </View>
          )}

          {birthDate && (
            <Pressable
              style={styles.clearDateButton}
              onPress={clearBirthDate}
            >
              <Text style={styles.clearDateText}>
                Usuń wybraną datę
              </Text>
            </Pressable>
          )}

          <Text style={styles.label}>
            Zdjęcie pupila
          </Text>

          {photoUri ? (
            <View style={styles.photoSection}>
              <Image
                source={{ uri: photoUri }}
                style={styles.preview}
              />

              <Pressable
                style={styles.removePhotoButton}
                onPress={() => setPhotoUri(null)}
              >
                <Text style={styles.removePhotoText}>
                  Usuń wybrane zdjęcie
                </Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.noPhotoBox}>
              <Text style={styles.noPhotoIcon}>
                🐾
              </Text>

              <Text style={styles.noPhotoText}>
                Nie wybrano jeszcze zdjęcia
              </Text>
            </View>
          )}

          <Pressable
            style={styles.cameraButton}
            onPress={takePhoto}
          >
            <Text style={styles.cameraButtonText}>
              📷 Zrób zdjęcie aparatem
            </Text>
          </Pressable>

          <Pressable
            style={styles.libraryButton}
            onPress={pickPhotoFromLibrary}
          >
            <Text style={styles.libraryButtonText}>
              🖼️ Wybierz zdjęcie z biblioteki
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.saveButton,
              loading && styles.disabledButton,
            ]}
            onPress={savePet}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.saveButtonText}>
                Zapisz zwierzę
              </Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },

  screen: {
    flex: 1,
    backgroundColor: "#f4f7fb",
  },

  container: {
    padding: 20,
    paddingBottom: 80,
  },

  title: {
    color: "#17324d",
    fontSize: 27,
    fontWeight: "800",
  },

  subtitle: {
    marginTop: 6,
    color: "#526477",
  },

  form: {
    gap: 12,
    marginTop: 22,
    padding: 20,
    borderRadius: 20,
    backgroundColor: "#ffffff",
  },

  label: {
    marginTop: 4,
    color: "#17324d",
    fontWeight: "800",
  },

  input: {
    paddingHorizontal: 15,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "#9fb3c8",
    borderRadius: 12,
    backgroundColor: "#f8fbff",
    color: "#102a43",
    fontSize: 16,
  },

  pickerContainer: {
    borderWidth: 1,
    borderColor: "#9fb3c8",
    borderRadius: 12,
    backgroundColor: "#eaf2ff",
    overflow: "hidden",
  },

  picker: {
    height:
      Platform.OS === "ios"
        ? 145
        : 52,
    color: "#102a43",
  },

  pickerItem: {
    color: "#102a43",
    fontSize: 17,
    fontWeight: "600",
  },

  dateButton: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    paddingVertical: 14,
    borderWidth: 2,
    borderColor: "#0047b3",
    borderRadius: 12,
    backgroundColor: "#b8d5ff",
  },

  dateValue: {
    color: "#102a43",
    fontSize: 16,
    fontWeight: "800",
  },

  datePlaceholder: {
    color: "#003f9e",
    fontSize: 16,
    fontWeight: "800",
  },

  calendarIcon: {
    fontSize: 23,
  },

  calendarContainer: {
    padding: 14,
    borderWidth: 3,
    borderColor: "#0047b3",
    borderRadius: 18,
    backgroundColor: "#8fbdff",
    overflow: "hidden",
  },

  calendarHeading: {
    marginBottom: 10,
    color: "#062b57",
    fontSize: 17,
    fontWeight: "900",
    textAlign: "center",
  },

  calendarBackground: {
    padding: 4,
    borderWidth: 2,
    borderColor: "#2563eb",
    borderRadius: 14,
    backgroundColor: "#ffffff",
    overflow: "hidden",
  },

  calendar: {
    width: "100%",
    backgroundColor: "#ffffff",
  },

  closeCalendarButton: {
    alignItems: "center",
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: 11,
    backgroundColor: "#003f9e",
  },

  closeCalendarText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "900",
  },

  clearDateButton: {
    alignSelf: "flex-start",
    paddingHorizontal: 4,
    paddingVertical: 6,
  },

  clearDateText: {
    color: "#b42318",
    fontWeight: "800",
  },

  photoSection: {
    gap: 9,
  },

  preview: {
    width: "100%",
    height: 220,
    borderWidth: 2,
    borderColor: "#2563eb",
    borderRadius: 16,
    resizeMode: "cover",
  },

  removePhotoButton: {
    alignSelf: "flex-start",
    paddingHorizontal: 4,
    paddingVertical: 5,
  },

  removePhotoText: {
    color: "#b42318",
    fontWeight: "800",
  },

  noPhotoBox: {
    minHeight: 130,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#b9c8d8",
    borderStyle: "dashed",
    borderRadius: 16,
    backgroundColor: "#f4f7fb",
  },

  noPhotoIcon: {
    fontSize: 35,
  },

  noPhotoText: {
    marginTop: 8,
    color: "#526477",
    fontWeight: "700",
  },

  cameraButton: {
    alignItems: "center",
    marginTop: 4,
    padding: 14,
    borderWidth: 2,
    borderColor: "#0284c7",
    borderRadius: 12,
    backgroundColor: "#cfe8ff",
  },

  cameraButtonText: {
    color: "#064f8c",
    fontWeight: "800",
  },

  libraryButton: {
    alignItems: "center",
    padding: 14,
    borderWidth: 2,
    borderColor: "#7c3aed",
    borderRadius: 12,
    backgroundColor: "#ede9fe",
  },

  libraryButtonText: {
    color: "#5b21b6",
    fontWeight: "800",
  },

  saveButton: {
    alignItems: "center",
    marginTop: 5,
    padding: 15,
    borderRadius: 12,
    backgroundColor: "#0047b3",
  },

  disabledButton: {
    opacity: 0.6,
  },

  saveButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "900",
  },
});