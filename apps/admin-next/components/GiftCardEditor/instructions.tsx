import React from "react";
import { ImageUpload } from "./GiftCardContainer";
import { useAtom } from "jotai";
import { filesAtom, logosAtom } from "~/jotaiStore";

function Instructions({ onNext }) {
  return (
    <div className="container mx-auto max-w-screen-md py-24">
      <Step1 />
      <hr className="my-12"></hr>
      <Step2 />
      <button
        className="rounded bg-[#7b9b7b] px-4 py-2 font-bold text-white hover:bg-green-700"
        onClick={onNext}
      >
        Continue
      </button>
    </div>
  );
}

function Step1() {
  const [_files, setFiles] = useAtom(filesAtom);
  const [_logos, setLogos] = useAtom(logosAtom);
  return (
    <div className="mb-8">
      <h2 className="mb-2 text-lg font-semibold">
        Step 1: Upload CSV or Select Trees
      </h2>
      <div className="mx-auto mb-4 rounded border-2 border-yellow-400 p-4">
        <p>
          CSV Columns should be in this order (column names don&apos;t matter)
        </p>
        <div className="flex justify-center border bg-gray-100 p-2 text-center">
          <p className="border-r border-black px-2">sapling_id</p>
          <p className="border-r border-black px-2">name</p>
          <p className="border-r border-black px-2">tree_name</p>
          <p className="border-r border-black px-2">email (optional)</p>
          <p className="px-2">other columns ... (optional)</p>
        </div>
      </div>
      <ImageUpload
        className="h-32"
        title="Upload Card Data"
        description="Upload .csv data for gift cards data"
        onUpdateFiles={setFiles}
        accept={{
          "text/*": [".csv", ".txt"],
        }}
      />
      <p className="w-full py-4 text-center text-2xl font-bold text-gray-500">
        OR
      </p>
      (...coming soon)
      <select
        className="block w-full rounded border border-gray-200 p-2"
        disabled
      >
        <option>Select assigned trees from the database</option>
        {/* Database options would be populated here */}
      </select>
      <p className="w-full py-4 text-center text-2xl font-bold text-gray-500">
        OR
      </p>
      <p className="text-xl text-gray-900">
        Keep this section blank to enter details manually
      </p>
      <hr className="my-12"></hr>
      <h2 className="mb-2 text-lg font-semibold">
        Upload Logos for this event
      </h2>
      <ImageUpload
        className="h-32"
        title="Upload Logos"
        description="Upload Logos"
        onUpdateFiles={setLogos}
        accept={{
          "image/*": [".png", ".gif", ".jpg", ".jpeg"],
        }}
      />
    </div>
  );
}

function Step2() {
  return (
    <div className="mb-8">
      <h2 className="mb-2 text-lg font-semibold">
        Step 2: Customize Cards and Download
      </h2>
    </div>
  );
}

export default Instructions;
