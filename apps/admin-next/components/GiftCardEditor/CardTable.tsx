import React from "react";
import { CardData } from "../../pages/giftcards";
import Image from "next/image";
import { treeNamesMain } from "./utils";

type CardTableProps = {
  cards: CardData[];
  onEdit: (card: CardData) => void;
  onSelect: (card: CardData) => void;
};

export default function CardTable({ cards, onEdit, onSelect }: CardTableProps) {
  const editCard = (card: CardData, newValue) => {
    const newCard = { ...card, ...newValue };
    onEdit(newCard);
  }

  return (
    <div className="mx-auto max-w-screen-2xl p-12">
      <div className="flex flex-col">
        <div className="mb-2 flex justify-center border-b-2 pb-2">
          <div className="w-1/12 px-2 py-1 font-thin text-gray-800">ID</div>
          <div className="w-1/6 px-2 py-1  font-thin text-gray-800">
            Sapling Id
          </div>
          <div className="w-1/3 px-2 py-1 font-bold">Name</div>
          <div className="w-1/4 px-2 py-1 font-bold">Tree Name</div>
          <div className="w-1/12 px-2 py-1 font-bold">Actions</div>
        </div>
        {cards.map((card) => (
          <div
            key={card.id}
            className="mb-0.5 flex justify-center transition-colors duration-300 ease-in-out hover:bg-slate-50"
          >
            <div className="w-1/12 px-2 py-1  font-thin text-gray-800">
              {card.id + 1}
            </div>
          {/* Replace with inputs, so that the table is now editable */}
            {/* <div className="w-1/6 px-2 py-1 font-thin text-gray-800">
              {card.saplingId}
            </div>
            <div className="w-1/3 px-2 py-1">{card.name}</div>
            <div className="w-1/4 px-2 py-1">{card.treeName}</div>
            <div className="w-1/12 px-2 py-1">{card.template}</div> */}
            <div className="w-1/6 px-2 py-1 font-thin text-gray-800">
              <input
                type="text"
                className="border-b w-full"
                value={card.saplingId}
                onChange={(e) => editCard(card, { saplingId: e.target.value })}
              />
            </div>
            <div className="w-1/3 px-2 py-1">
              <input
                type="text"
                className="table-input"
                value={card.name}
                onChange={(e) => editCard(card, { name: e.target.value })}
              />
            </div>
            <div className="w-1/4 px-2 py-1">
              <select className="border-b w-full focus:ring-none" 
                value={card.treeName} onChange={(e) => editCard(card, { treeName: e.target.value })}>
                <option value="_">Tree Type</option>
                {treeNamesMain.map((t) => (
                  <option key={t} value={t}> {t} </option>
                ))}
              </select>
            </div>
            <div className="w-1/12 px-2 py-1">
              <button
                onClick={() => onSelect(card)}
                className="rounded bg-[#7b9b7b] px-4 py-1 font-bold text-white hover:bg-[#577257]"
              >
                Preview
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
