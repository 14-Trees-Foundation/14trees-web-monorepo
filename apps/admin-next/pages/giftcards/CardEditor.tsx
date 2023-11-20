import {
  Ref,
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import Image, { StaticImageData } from "next/image";
import { fabric } from "fabric";

import logo from "../../src/assets/images/logo.png";
import { ArrowUturnLeftIcon } from "@heroicons/react/24/outline";
import QRCode from "qrcode";
import { getTreeTemplateImage } from "./utils";

const MARGIN = 20;
const QR_WIDTH = 128
const FONT_COLOUR = "#472d12ee";

const opts = {
  width: QR_WIDTH,
  height: QR_WIDTH,
  scale: 4,
  margin: 0,
  color: {
    dark: "#434f3abb",
    light: "#FFF",
  },
  correctLevel: "Q",
};

const getQRCode = async (text: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    QRCode.toDataURL(text, opts, function (err, url) {
      if (err) reject(err);
      resolve(url);
    });
  });
};

type EditorProps = {
  template_id: number;
  tree_id: number;
  treeName: string;
  donor_name: string;
  message: string;
  treeImage: StaticImageData;
  logoFiles: File[];
  cardRef: Ref<HTMLDivElement>;
  handleSave?: () => void;
};

const EditorContainer = forwardRef(
  ({ template_id, cardRef, ...props }: EditorProps) => {
    const [reset, setReset] = useState(false);
    return (
      <div className="mx-auto w-[1448px]" style={{fontFamily: "Poppins"}}>
        <div
          // ref={cardRef}
          className="relative my-8 w-[1448px] rounded-md bg-white p-1 font-serif shadow-lg"
          style={{ aspectRatio: "3/2" }}
        >
          <CanvasEditor fabricRef={cardRef} reset={reset} template_id={template_id} {...props} />
        </div>
        <button
          onClick={() => setReset(!reset)}
          className="mx-auto flex h-12 w-32 rounded-xl bg-white px-5 py-2 text-xl shadow-md"
        >
          Reset <ArrowUturnLeftIcon className="h-7 pl-2" />
        </button>
      </div>
    );
  }
);

EditorContainer.displayName = "GiftCard";

const CanvasEditor = ({ treeName, reset, fabricRef, template_id, tree_id, message, logoFiles, donor_name, ...props }) => {
  const dashboard_link = `https://dashboard.14trees.org/profile/${tree_id}`;
  const canvasRef = useRef(null);

  const initFabric = () => {
    fabricRef.current = new fabric.Canvas(canvasRef.current, {
      width: 1440,
      height: 1080,
      backgroundColor : "#fff",
    });
  };

  const addTemplateImages = () => {
    const imageOpts = (img) => ({
      left: 0,
      top: 0,
      selectable: false,
      evented: false,
      scaleX: fabricRef.current.width / img.width,
      scaleY: fabricRef.current.height / img.height,
    });
    // Load an image and add it to the canvas
    fabric.Image.fromURL(getTreeTemplateImage(treeName), (img) => {
      fabricRef.current.setBackgroundImage(
        img,
        fabricRef.current.renderAll.bind(fabricRef.current),
        imageOpts(img)
      );

      fabricRef.current.sendToBack(img);
    });

    fabric.Image.fromURL(logo.src, (img) => {
      // Set image dimensions to cover the right half of the canvas
      const LOGO_SIZE = 128;
      img.set({
        left: fabricRef.current.width - LOGO_SIZE - MARGIN,
        top: MARGIN,
        scaleX: LOGO_SIZE / img.width,
        scaleY: LOGO_SIZE / img.height,
        selectable: false,
        evented: false,
      });

      fabricRef.current.add(img);
    });
  };

  const addQRCode = async () => {
    const QR_TOP = fabricRef.current.height - QR_WIDTH - MARGIN;
    // hr
    fabricRef.current.add(new fabric.Line([MARGIN,QR_TOP - 40,MARGIN + 500,QR_TOP - 40], {
      stroke: '#434f3abb',
      strokeWidth: 2,
      selectable: false,
      evented: false,
    }));
    fabric.Image.fromURL(await getQRCode(dashboard_link), (img) => {
      // Set image dimensions to cover the right half of the canvas
      img.set({
        left: MARGIN,
        top: QR_TOP,
      });

      fabricRef.current.add(img);

    });
    fabricRef.current.add(
      new fabric.Textbox(`Watch your tree grow!`, {
        fontSize: 22,
        fontWeight: "bold",
        fontFamily: "Poppins",
        fill: FONT_COLOUR,
        opacity: 0.6,
        left: MARGIN + QR_WIDTH + 10,
        width: 120,
        top: QR_TOP,
        padding: 10,
        textAlign: "left",
      })
    );
    fabricRef.current.add(
      new fabric.Textbox(`\nTree Id: ${tree_id}`, {
        fontSize: 22,
        fontWeight: "bold",
        fontFamily: "Poppins",
        fill: FONT_COLOUR,
        opacity: 0.6,
        left: MARGIN + QR_WIDTH + 10,
        width: 300,
        top: QR_TOP + 75,
        padding: 10,
        textAlign: "left",
      })
    );
  };

  const addText = () => {
    fabricRef.current.add(
      new fabric.Textbox(`Dear ${donor_name}`, {
        fontSize: 36,
        fontFamily: "Poppins",
        fontWeight: "bold",
        fill: FONT_COLOUR,
        left: MARGIN,
        width: fabricRef.current.width / 2,
        top: fabricRef.current.height / 2 - 70,
        padding: 10,
        textAlign: "left",
      })
    );
    fabricRef.current.add(
      new fabric.Textbox(message, {
        fontSize: 32,
        fontWeight: 200,
        fontFamily: "Poppins",
        fill: FONT_COLOUR,
        shadow: "rgba(0,0,0,0.2) 0px 0px 10px",
        left: MARGIN,
        width: fabricRef.current.width / 2.2,
        top: fabricRef.current.height / 2 - 10,
        padding: 10,
        textAlign: "left",
      })
    );
  };

  const addLogos = async () => {
    const logoImgs = await Promise.all(logoFiles?.map(readImageToURL));
    logoImgs.forEach((logoImg, index) => {
      fabric.Image.fromURL(logoImg, (img) => {
        // Set image dimensions to cover the right half of the canvas
        const LOGO_WIDTH = 192;
        const LOGO_HEIGHT = QR_WIDTH / 2;
        const scale = LOGO_HEIGHT / img.height;
        img.set({
          left: getTemplateLogoLeft(fabricRef.current.width, LOGO_WIDTH, template_id),
          top: fabricRef.current.height - LOGO_HEIGHT * (index +1) - MARGIN,
          scaleX: scale,
          scaleY: scale,
        });

        fabricRef.current.add(img);
      });
    })
  };

  const disposeFabric = () => {
    fabricRef.current.dispose();
  };

  const renderFabric = useCallback(async () => {
    initFabric();
    await addQRCode();
    addTemplateImages();
    addText();
    addLogos();
  }, [logoFiles]);

  useEffect(() => {
    if (fabricRef.current) {
      disposeFabric();
      renderFabric();
    } else {
      renderFabric();
    }
  }, [reset, renderFabric, template_id]);

  return <canvas ref={canvasRef} />;
};

async function readImageToURL(file: File): Promise<String> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(reader.result as string);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function getTemplateLogoLeft(canvasWidth: number, logoWidth: number, template_id: number): number {
  const left1 = canvasWidth - logoWidth - MARGIN
  const left2 = MARGIN + QR_WIDTH + MARGIN + 200
  return template_id === 2 ? left2 : left1
}

export default EditorContainer;
