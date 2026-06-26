import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  apiRequest,
  PET_PHOTOS_KEY,
  PENDING_PETS_KEY,
} from "./api";

import type { Pet, PetPayload } from "./api";

export type PendingPet = {
  localId: string;
  payload: PetPayload;
  photoUri: string | null;
  createdAt: string;
};

async function saveQueue(queue: PendingPet[]): Promise<void> {
  await AsyncStorage.setItem(
    PENDING_PETS_KEY,
    JSON.stringify(queue),
  );
}

export async function getPendingPets(): Promise<PendingPet[]> {
  const storedQueue = await AsyncStorage.getItem(
    PENDING_PETS_KEY,
  );

  if (!storedQueue) {
    return [];
  }

  try {
    return JSON.parse(storedQueue) as PendingPet[];
  } catch {
    return [];
  }
}

export async function addPetToQueue(
  payload: PetPayload,
  photoUri: string | null,
): Promise<PendingPet> {
  const queue = await getPendingPets();

  const pendingPet: PendingPet = {
    localId: `local-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}`,
    payload,
    photoUri,
    createdAt: new Date().toISOString(),
  };

  queue.push(pendingPet);

  await saveQueue(queue);

  return pendingPet;
}

export async function removePendingPet(
  localId: string,
): Promise<void> {
  const queue = await getPendingPets();

  const updatedQueue = queue.filter(
    (item) => item.localId !== localId,
  );

  await saveQueue(updatedQueue);
}

export async function syncPendingPets(): Promise<{
  synchronized: number;
  remaining: number;
}> {
  const queue = await getPendingPets();

  if (queue.length === 0) {
    return {
      synchronized: 0,
      remaining: 0,
    };
  }

  const savedPhotos = await AsyncStorage.getItem(
    PET_PHOTOS_KEY,
  );

  let photos: Record<string, string> = {};

  if (savedPhotos) {
    try {
      photos = JSON.parse(savedPhotos);
    } catch {
      photos = {};
    }
  }

  const remainingQueue: PendingPet[] = [];
  let synchronized = 0;

  for (const item of queue) {
    try {
      const createdPet = await apiRequest<Pet>("/pets", {
        method: "POST",
        body: JSON.stringify(item.payload),
      });

      if (item.photoUri) {
        photos[String(createdPet.id)] = item.photoUri;
      }

      synchronized += 1;
    } catch {
      remainingQueue.push(item);
    }
  }

  await Promise.all([
    saveQueue(remainingQueue),
    AsyncStorage.setItem(
      PET_PHOTOS_KEY,
      JSON.stringify(photos),
    ),
  ]);

  return {
    synchronized,
    remaining: remainingQueue.length,
  };
}