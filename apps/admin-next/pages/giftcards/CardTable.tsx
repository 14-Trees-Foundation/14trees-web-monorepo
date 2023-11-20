import React from "react";
import { CardData } from ".";
import Image from "next/image";

type CardTableProps = {
  cards: CardData[];
  onEdit: (card: CardData) => void;
};

export default function CardTable({ cards, onEdit }: CardTableProps) {
  return (
    <div className="mx-auto max-w-screen-2xl p-12">
      <div className="flex flex-col">
        <div className="mb-2 flex justify-center pb-2 border-b-2">
          <div className="w-1/12 px-2 py-1 font-thin text-gray-800">ID</div>
          <div className="w-1/6 px-2 py-1  font-thin text-gray-800">
            Sapling Id
          </div>
          <div className="w-1/3 px-2 py-1 font-bold">Name</div>
          {/* <div className="w-1/6 px-2 py-1 font-bold">Message</div> */}
          <div className="w-1/4 px-2 py-1 font-bold">Tree Name</div>
          <div className="w-1/12 px-2 py-1 font-bold">Template</div>
          {/* <div className="w-1/6 px-2 py-1 font-bold">Tree Image</div>
          <div className="w-1/6 px-2 py-1 font-bold">Logos</div> */}
          <div className="w-1/12 px-2 py-1 font-bold">Actions</div>
        </div>
        {cards.map((card) => (
          <div key={card.id} className="mb-0.5 flex justify-center hover:bg-slate-50 transition-colors ease-in-out duration-300">
            <div className="w-1/12 px-2 py-1  font-thin text-gray-800">
              {card.id + 1}
            </div>
            <div className="w-1/6 px-2 py-1 font-thin text-gray-800">
              {card.treeId}
            </div>
            <div className="w-1/3 px-2 py-1">{card.name}</div>
            {/* <div className="w-1/6 px-2 py-1">{card.message}</div> */}
            <div className="w-1/4 px-2 py-1">{card.treeName}</div>
            <div className="w-1/12 px-2 py-1">{card.template}</div>
            {/* <div className="w-1/6 px-2 py-1">
                {card.treeImage && (
                    <Image src={card.treeImage} alt="Tree" className="h-10 w-10" />
                )}
            </div>
            <div className="w-1/6 px-2 py-1">
                {card.logos && (
                    <Image src={card.logos} alt="Logo" className="h-10 w-10" />
                )}
            </div> */}
            <div className="w-1/12 px-2 py-1">
              <button
                onClick={() => onEdit(card)}
                className="rounded bg-[#7b9b7b] px-4 py-1 font-bold text-white hover:bg-[#577257]"
              >
                Edit
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
