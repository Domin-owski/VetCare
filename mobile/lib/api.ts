import AsyncStorage from "@react-native-async-storage/async-storage";

export const API_URL =
  "https://vetcare-api-74lk.onrender.com";

export const TOKEN_KEY = "vetcare_token";
export const PETS_CACHE_KEY = "vetcare_pets";
export const PET_PHOTOS_KEY = "vetcare_pet_photos";
export const PENDING_PETS_KEY = "vetcare_pending_pets";

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

export class ApiError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);

    this.name = "ApiError";
    this.status = status;
  }
}

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

  let response: Response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
    });
  } catch {
    throw new ApiError(
      "Brak połączenia z serwerem",
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const data = await response
    .json()
    .catch(() => ({}));

  if (!response.ok) {
    throw new ApiError(
      data.detail || "Błąd odpowiedzi serwera",
      response.status,
    );
  }

  return data as T;
}