import React from "react";
import Image from "next/image";
import tree from "../src/assets/images/tree_card.png"

function Card() {
  const treeName = "Oak Tree";
  const message = "Dear John Doe, happy birthday, thank you for planting a tree";
  const logos = ["path_to_logo1.jpg", "path_to_logo2.jpg", "path_to_logo3.jpg"];

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <GiftCard treeName={treeName} message={message} treeImage={tree} logos={logos} />
    </div>
  );
}

export default Card;

const GiftCard = ({ treeName, message, treeImage, logos }) => {
  return (
    <div
      className="relative m-2 w-full rounded-md bg-white p-4 shadow-lg"
      style={{ aspectRatio: "3/2" }}
    >
      <div className="absolute right-0 top-0 w-1/2 h-full ml-4 w-1/2">
        <Image
          src={treeImage}
          alt={treeName}
          className="h-full w-full rounded-md object-cover"
        />
      </div>
      <div className="flex h-full items-start justify-between">
        <div className="flex flex-col justify-between">
          <div className="text-lg font-bold">{treeName}</div>
          <div className="text-xl">{message}</div>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 flex justify-evenly p-2">
        {/* {logos.map((logo, index) => (
          <Image key={index} src={logo} alt="logo" className="h-6 w-auto" />
        ))} */}
      </div>
    </div>
  );
};
