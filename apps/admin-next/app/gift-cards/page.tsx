"use client"

import { useState } from "react";
import Instructions from "../../components/GiftCardEditor/instructions";
import CardTable from "../../components/GiftCardEditor/CardTable";
import Papa from "papaparse";
import { atom, useAtom } from "jotai";
import {
  HashtagIcon,
  TableCellsIcon,
  PhotoIcon,
} from "@heroicons/react/24/outline";
import GiftCardsContainer from "../../components/GiftCardEditor/GiftCardContainer";
import { getTreeTemplateName } from "../../components/GiftCardEditor/utils";
import { CardData, cardData, filesAtom } from "~/jotaiStore";
import { HeaderControlRow } from "components/HeaderControlRow";

function GiftCardApp() {
  const [selectedCard, setSelectedCard] = useState<CardData | null>(null);
  const [instruction_page, setInstruction_page] = useState(true);
  const [dataFiles, setDataFiles] = useAtom(filesAtom);
  const [cards, setCards] = useAtom(cardData);

  const handleSaveCard = (editedCard) => {
    setCards(
      cards.map((card) => (card.id === editedCard.id ? editedCard : card))
    );
  };

  const onNext = async () => {
    if (dataFiles.length === 0) {
      const emptyCard: CardData = {
        id: 0,
        saplingId: 12345,
        name: "Donor Name",
        email: "name@example.com",
        treeName: "Test Tree",
        template: 0,
        logos: "",
      };
      setCards([emptyCard]);
      setSelectedCard(emptyCard);
    } else {
      let allData: CardData[] = [];

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
          saplingId: data[0],
          name: data[1],
          treeName: data.length > 3 ? getTreeTemplateName(data[2]) : null,
          email: data[3],
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
      {/* Convert above to a generic component header control row */}
      <HeaderControlRow className=""
        buttonClass=""
        items={[
          { content: <HashtagIcon className="w-8 h-8"/>, onClick: () => {
            setCards([]);
            setInstruction_page(true);
            setSelectedCard(null);
          }},
          { content: <TableCellsIcon className="h-8 w-8"/>, onClick: () => setSelectedCard(null) },
          { content: <PhotoIcon className="h-8 w-8"/>, onClick: () => {} },
        ]}
      />

      
      {instruction_page && <Instructions onNext={onNext} />}
      {!instruction_page && !selectedCard && (
        <CardTable cards={cards} onEdit={handleSaveCard} onSelect={setSelectedCard}/>
      )}
      {selectedCard && (
        <GiftCardsContainer
          {...selectedCard}
          setActiveCardId={(cId) =>
            setSelectedCard(cards.find((c) => c.id === cId) || null)
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
