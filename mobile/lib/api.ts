import AsyncStorage from "@react-native-async-storage/async-storage";

export const API_URL = "http://192.168.1.36:8000";

export const TOKEN_KEY = "vetcare_token";
export const PETS_CACHE_KEY = "vetcare_pets";
export const PET_PHOTOS_KEY = "vetcare_pet_photos";

export type Pet = {
  id: number;
  name: string;
  species: string;
  breed: string | null;
  birth_date: string | null;
  owner_id: number;
  created_at: string;
};

export type PetPayload = {
  name: string;
  species: string;
  breed: string | null;
  birth_date: string | null;
};

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = await AsyncStorage.getItem(TOKEN_KEY);

  const headers = new Headers(options.headers);

  headers.set("Content-Type", "application/json");

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.detail || "Błąd połączenia z serwerem");
  }

  return data as T;
}