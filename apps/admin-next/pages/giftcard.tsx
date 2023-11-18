import React, { useCallback, useRef } from "react";
import Image from "next/image";
import tree from "../src/assets/images/tree_card.png"
// import { Button } from "ui";
// import downloadjs from 'downloadjs';
// import html2canvas from 'html2canvas';

function Card() {
  const treeName = "Moha";
  const message = `We have planted this tree in your name at 14 Trees Foundation. 
  For many years, your tree will help promote biodiversity, rejuvenate the local ecosystem, 
  and offset the devastating effects of climate change!
  `;
  const logos = ["path_to_logo1.jpg", "path_to_logo2.jpg", "path_to_logo3.jpg"];
  // const saveGiftCard = (saveHandler) => saveHandler();

  return (
    <div className="">
      <div className="flex p-4 mx-auto justify-between max-w-screen-md">
        <input type="text" placeholder="Tree Name" />
        <input type="text" placeholder="Message" />
        <input type="text" placeholder="Logo" />
      </div>
      {/* <button onClick={saveGiftCard}>Save</button> */}
      <div className="bg-gray-100 p-12 w-screen overflow-scroll mx-auto">
        <GiftCard
          // handleClick={saveGiftCard}
          treeName={treeName}
          donor_name={"Donor Name"}
          message={message}
          treeImage={tree}
          logos={logos}
        />
      bBb</div>
    </div>
  );
}

export default Card;

const GiftCard = ({ treeName, donor_name, message, treeImage, logos }) => {
  // const ref = useRef<HTMLDivElement>(null)
  // const onButtonClick = useCallback(async () => {
  //     if (ref.current === null) {
  //       return
  //     }

  //     // capture screenshot
  //     // const canvas = await html2canvas(ref.current)
  //     // const dataURL = canvas.toDataURL("image/png")
  //     // downloadjs(dataURL, "giftcard.png", "image/png")
  // }, [ref])
  
  // handleClick(() => (console.log("download")))
  return (
    <div 
      className="mx-auto relative m-2 w-[1440px] rounded-md bg-white p-4 shadow-lg font-serif"
      style={{ aspectRatio: "3/2" }}>
      <div className="absolute right-0 top-0 h-full ml-4 w-1/2">
        <Image
          src={treeImage}
          alt={treeName}
          className="h-full w-full rounded-md object-cover"
        />
      </div>
      <div className="flex h-full items-start justify-between ml-4">
        <div className="flex flex-col justify-between">
          <div className="text-[256px]/[256px] text-[#1b421b] font-thin">{treeName}</div>
          <div className="text-3xl w-1/3 ml-6 text-stone-600">
            <span className="font-bold" contentEditable> Dear {donor_name}, </span>
            <div className="mt-4" contentEditable>
              {message}
            </div>
          </div>
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
