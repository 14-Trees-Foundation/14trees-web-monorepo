import React, { useCallback, useEffect, useRef, useState } from "react";
import Dropzone, { Accept, useDropzone } from "react-dropzone";
import {
  DocumentArrowUpIcon,
  ArrowLeftCircleIcon,
  ArrowRightCircleIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";
import { CardData, logosAtom } from "../../pages/giftcards";
import { useScreenshot, createFileName } from "use-react-screenshot";
import EditorContainer from "./CardEditor";
import { useAtom } from "jotai";
import { treeNamesMain } from "./utils";

const DEFAULT_MESSAGE = `We have planted this tree in your name at 14 Trees Foundation.
\nFor many years, this tree will help rejuvenate local ecosystems, support local biodiversity, and offset the harmful effects of climate change and global warming.`;

interface GiftCardEditorProps extends CardData {
  handleClick?: () => void;
  setActiveCardId?: (id: number) => void;
}

export default function GiftCardsContainer({
  setActiveCardId,
  ...props
}: GiftCardEditorProps) {
  const [template_data, setTemplate_data] = React.useState<CardData>(props);

  const [logos, _setLogos] = useAtom(logosAtom);
  const [selectedLogos, setSelectedLogos] = useState<string[]>([]);

  const toggleSelectedLogos = (value: string) => {
    setSelectedLogos((prev) =>
      prev.includes(value)
        ? prev.filter((item) => item !== value)
        : [...prev, value]
    );
  };

  const ref = useRef<HTMLCanvasElement>(null);

  const onDownload = () => {
    const url = ref.current.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = `${name}_card.png`;
    link.href = url;
    link.click();
  };

  useEffect(() => {
    console.log(ref.current);
  }, [ref]);

  return (
    <div className="" style={{ fontFamily: "Noto Sans, Poppins, sans-serif" }}>
      <div className="mx-auto flex max-w-screen-xl justify-center gap-4 p-4">
        <div className="flex">
          <button
            className="px-2 py-1 text-gray-800"
            onClick={() => setActiveCardId(template_data.id - 1)}
          >
            <ArrowLeftCircleIcon className="w-8" />
          </button>
          <p className="mt-1 w-6 text-2xl">{template_data.id}</p>
          <button
            className="px-2 py-1 text-gray-800"
            onClick={() => setActiveCardId(template_data.id + 1)}
          >
            <ArrowRightCircleIcon className="w-8 " />
          </button>
        </div>
        <button
          className="flex rounded-md bg-[#434f3a] py-2 pl-2 pr-4 text-white"
          onClick={onDownload}
        >
          <ArrowDownTrayIcon className="mr-2 mt-0.5 h-5 w-8" />
          <span className="pb-0.5"> Download</span>
        </button>
        <input
          type="text"
          placeholder="Tree ID"
          className="w-24 px-2 underline"
          value={template_data.saplingId}
          onChange={(e) =>
            setTemplate_data({ ...template_data, saplingId: e.target.value })
          }
        />
        <select
          className="w-24 border-2 border-gray-200"
          onChange={(e) =>
            setTemplate_data({ ...template_data, treeName: e.target.value })
          }
        >
          <option value="_">Tree Type</option>
          {treeNamesMain.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <select
          className="w-24 border-2 border-gray-200"
          onChange={(e) =>
            setTemplate_data({
              ...template_data,
              template: Number(e.target.value),
            })
          }
        >
          <option value="_">Select Template</option>
          <option value="1">Template 1</option>
          <option value="2">Template 2</option>
        </select>
        <MultiSelectCheckbox
          options={logos.map((l) => ({
            label: l.name,
            value: l.name,
          }))}
          selected={selectedLogos}
          toggleSelection={toggleSelectedLogos}
        />
      </div>
      <div className="mx-auto w-screen overflow-scroll bg-gray-100 p-12">
        <EditorContainer
          canvasRef={ref}
          {...template_data}
          message={template_data.message || DEFAULT_MESSAGE}
          logoFiles={logos.filter((l) => selectedLogos.includes(l.name))}
        />
      </div>
    </div>
  );
}

const download = (image, { name = "img", extension = "jpg" } = {}) => {
  const a = document.createElement("a");
  a.href = image;
  a.download = createFileName(extension, name);
  a.click();
};

export const ImageUpload = ({
  title,
  description,
  onUpdateFiles,
  className,
  accept,
}: {
  title: string;
  description: string;
  onUpdateFiles: (file: any) => void;
  className?: string;
  accept?: Accept;
}) => {
  // const {acceptedFiles, getRootProps, getInputProps} = useDropzone();
  const [files, setFiles] = React.useState([]);
  const onDrop = useCallback(
    (acceptedFiles) => {
      const newFilesList = [...files, ...acceptedFiles];
      setFiles(newFilesList);
      onUpdateFiles(newFilesList);
    },
    [onUpdateFiles, files, setFiles]
  );
  return (
    <div>
      <h3 className="mb-2 text-lg font-semibold text-gray-600">
        Files: {title}
      </h3>
      <ul>
        {files.map((file: any) => (
          <div key={file.name} className="my-2 flex text-lg font-thin">
            <DocumentArrowUpIcon className="mr-1 mt-0.5 h-6" /> {file.path}
            <span className="ml-2 text-gray-400">[ {file.size} bytes ]</span>
          </div>
        ))}
      </ul>

      <Dropzone onDrop={onDrop} accept={accept}>
        {({ getRootProps, getInputProps }) => (
          <section>
            <div
              {...getRootProps()}
              className={`rounded-lg border-4 border-dashed border-[#7b9b7b] px-12 ${className}`}
            >
              <input {...getInputProps()} className="h-full w-full" />
              <p className="top-1/2 p-4 text-center text-xl font-bold text-[#7b9b7b]">
                {description}
              </p>
            </div>
          </section>
        )}
      </Dropzone>
    </div>
  );
};

type OptionProps = {
  options: {
    label: string;
    value: string;
  }[];
  selected: string[];
  toggleSelection: (value: string) => void;
};

const MultiSelectCheckbox = ({
  options,
  selected,
  toggleSelection,
}: OptionProps) => {
  return (
    <div className="flex space-x-2">
      {options.map((option) => (
        <label key={option.value} className="inline-flex items-center">
          <input
            type="checkbox"
            value={option.value}
            checked={selected.includes(option.value)}
            onChange={() => toggleSelection(option.value)}
            className="form-checkbox h-5 w-5 text-blue-600"
          />
          <span className="ml-2 text-gray-700">{option.label}</span>
        </label>
      ))}
    </div>
  );
};
