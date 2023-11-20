import { useState } from "react";
import Instructions from "./instructions";
import CardTable from "./CardTable";
import Papa from "papaparse";
import { atom, useAtom } from "jotai";
import {
  HashtagIcon,
  TableCellsIcon,
  PhotoIcon,
} from "@heroicons/react/24/outline";
import GiftCardsContainer from "./GiftCardContainer";
import { getTreeTemplateName } from "./utils";

export const filesAtom = atom<File[]>([]);
export const logosAtom = atom<File[]>([]);
export const cardData = atom<CardData[]>([]);

export type CardData = {
  id: number;
  treeId: number;
  name: string;
  email: string;
  message: string;
  treeName: string;
  template: number;
  treeImage: string;
  logos?: string;
};

function GiftCardApp() {
  const [selectedCard, setSelectedCard] = useState<CardData>(null);
  const [instruction_page, setInstruction_page] = useState(true);
  const [dataFiles, setDataFiles] = useAtom(filesAtom);
  const [cards, setCards] = useAtom(cardData);

  const handleSaveCard = (editedCard) => {
    setCards(
      cards.map((card) => (card.id === editedCard.id ? editedCard : card))
    );
    setSelectedCard(editedCard);
  };

  const onNext = async () => {
    if (dataFiles.length === 0) {
      const emptyCard: CardData = {
        id: 0,
        treeId: 12345,
        name: "Donor Name",
        email: "name@example.com",
        message: null,
        treeName: "Test Tree",
        template: 0,
        treeImage: "",
        logos: "",
      }
      setCards([emptyCard]);
      setSelectedCard(emptyCard);
    }
    else {
      let allData = [];
  
      await Promise.all(
        dataFiles.map(async (file) => {
          const moreData = await asyncConvertCSVToCardData(file);
          allData = [...allData, ...moreData];
        })
      );
  
      // data is in the format [name, email, tree]
      allData = allData.slice(1);
      setCards(
        allData.map((data, index) => ({
          id: index,
          treeId: data[0],
          name: data[1],
          treeName: data.length > 3 ? getTreeTemplateName(data[2]) : null,
          email: data[3],
          treeImage: "",
          template: 0,
          logos: "",
          message: "",
        }))
      );
    }
    setInstruction_page(false);
  };

  return (
    <div>
      <div className="mx-auto flex w-full justify-center p-2">
        {/* Info */}
        <button className="border-r border-gray-300 px-3 py-1" onClick={() => { setCards([]); setInstruction_page(true); setSelectedCard(null)} }>
          <HashtagIcon className="h-8 w-8 text-green-700" />
        </button>
        {/* Table */}
        <button
          className="border-r border-gray-300 px-3 py-1"
          onClick={() => setSelectedCard(null)}
        >
          <TableCellsIcon className="h-8 w-8 text-green-700" />
        </button>
        {/* Editor/Preview */}
        <button className="px-3 py-1">
          <PhotoIcon className="h-8 w-8 text-green-700" />
        </button>
      </div>
      {instruction_page && <Instructions onNext={onNext} />}
      {!instruction_page && !selectedCard && (
        <CardTable cards={cards} onEdit={setSelectedCard} />
      )}
      {selectedCard && (
        <GiftCardsContainer
          {...selectedCard}
          setActiveCardId={(cId) =>
            setSelectedCard(cards.find((c) => c.id === cId))
          }
        />
      )}
    </div>
  );
}

const asyncConvertCSVToCardData = async (csv: File): Promise<CardData[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(csv, {
      complete: function (results) {
        resolve(results.data as CardData[]);
      },
      error: function (error) {
        reject(error);
      },
    });
  });
};

export default GiftCardApp;
