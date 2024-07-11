import { atom } from "jotai";

// Gift Cards
export type CardData = {
  id: number;
  saplingId: string | number;
  name: string;
  email: string;
  message?: string;
  treeName: string | null;
  template: number;
  treeImage?: string;
  logos?: string;
};

export const filesAtom = atom<File[]>([]);
export const logosAtom = atom<File[]>([]);
export const cardData = atom<CardData[]>([]);