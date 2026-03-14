import { PosterStyleId } from "@/data/mockData";

export interface CollectionItem {
  courseId: string;
  courseName: string;
  styleId: PosterStyleId;
  canvasId: string | null;
  orderedAt: number;
}

const STORAGE_KEY = "fc_collection";

export const getCollection = (): CollectionItem[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as CollectionItem[];
  } catch {
    return [];
  }
};

export const addToCollectionStorage = (item: CollectionItem) => {
  try {
    const existing = getCollection();
    existing.unshift(item);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
  } catch {
    // localStorage unavailable — silent fail
  }
};
