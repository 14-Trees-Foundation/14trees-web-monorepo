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
import { CardData } from "app/gift-cards/page";

const MARGIN = 20;
const QR_WIDTH = 128;
const FONT_COLOUR = "#472d12ee";

const opts = {
  width: QR_WIDTH,
  height: QR_WIDTH,
  scale: 4,
  margin: 0,
  color: {
    dark: "#434f3add",
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
  logoFiles: File[];
  canvasRef: any;
  handleSave?: () => void;
} & CardData;

const EditorContainer = forwardRef(({ ...props }: EditorProps) => {
  const [reset, setReset] = useState(true);
  useEffect(() => {
    setReset(true);
  }, [props.saplingId]);
  return (
    <div
      className="mx-auto w-[1928px]"
      style={{ fontFamily: "Noto Sans, Poppins, sans-serif" }}
    >
      <div
        // ref={cardRef}
        className="relative my-8 w-[1928px] rounded-md bg-white p-1 font-serif shadow-lg"
        style={{ aspectRatio: "3/2" }}
      >
        <CanvasEditor reset={reset} {...props} />
      </div>
      <button
        onClick={() => setReset(!reset)}
        className="mx-auto flex h-12 w-32 rounded-xl bg-white px-5 py-2 text-xl shadow-md"
      >
        Reset <ArrowUturnLeftIcon className="h-7 pl-2" />
      </button>
    </div>
  );
});

EditorContainer.displayName = "GiftCard";

interface CanvasEditorProps extends EditorProps {
  reset: boolean;
}

const CanvasEditor = ({
  treeName,
  reset,
  canvasRef,
  template: template_id,
  saplingId: tree_id,
  message,
  logoFiles,
  name: donor_name,
  ...props
}: CanvasEditorProps) => {
  const WIDTH = 1920;
  const dashboard_link = `https://dashboard.14trees.org/profile/${tree_id}`;
  const htmlCanvasRef = useRef(null);

  const initFabric = () => {
    canvasRef.current = new fabric.Canvas(htmlCanvasRef.current, {
      width: WIDTH,
      height: WIDTH * (2 / 3),
      backgroundColor: "#fff",
    });
  };

  const addTemplateImages = () => {
    const imageOpts = (img) => ({
      left: 0,
      top: 0,
      selectable: false,
      evented: false,
      scaleX: canvasRef.current.width / img.width,
      scaleY: canvasRef.current.height / img.height,
    });
    // Load an image and add it to the canvas
    fabric.Image.fromURL(getTreeTemplateImage(treeName), (img) => {
      canvasRef.current.setBackgroundImage(
        img,
        canvasRef.current.renderAll.bind(canvasRef.current),
        imageOpts(img)
      );

      canvasRef.current.sendToBack(img);
    });

    fabric.Image.fromURL(logo.src, (img) => {
      // Set image dimensions to cover the right half of the canvas
      const LOGO_SIZE = 128;
      img.set({
        left: canvasRef.current.width - LOGO_SIZE - MARGIN,
        top: MARGIN,
        scaleX: LOGO_SIZE / img.width,
        scaleY: LOGO_SIZE / img.height,
        selectable: false,
        evented: false,
      });

      canvasRef.current.add(img);
    });
  };

  const addQRCode = async () => {
    const QR_TOP = canvasRef.current.height - QR_WIDTH - MARGIN;
    // hr
    canvasRef.current.add(
      new fabric.Line([MARGIN, QR_TOP - 60, MARGIN + 500, QR_TOP - 60], {
        stroke: "#434f3abb",
        strokeWidth: 2,
        selectable: false,
        evented: false,
      })
    );
    fabric.Image.fromURL(await getQRCode(dashboard_link), (img) => {
      // Set image dimensions to cover the right half of the canvas
      img.set({
        left: MARGIN,
        top: QR_TOP,
      });

      canvasRef.current.add(img);
    });
    canvasRef.current.add(
      new fabric.Textbox(`Watch your tree grow!`, {
        fontSize: 20,
        fontWeight: "bold",
        fontFamily: "Noto Sans",
        fill: FONT_COLOUR,
        opacity: 0.6,
        left: MARGIN + QR_WIDTH + 10,
        width: 120,
        top: QR_TOP,
        padding: 10,
        textAlign: "left",
      })
    );
    canvasRef.current.add(
      new fabric.Textbox(`Tree ID: ${tree_id}`, {
        fontSize: 18,
        // fontWeight: "bold",
        fontFamily: "Noto Sans",
        fill: FONT_COLOUR,
        opacity: 0.6,
        left: MARGIN,
        width: 300,
        top: canvasRef.current.height - 25 - MARGIN - QR_WIDTH,
        padding: 10,
        textAlign: "left",
      })
    );
  };

  const addText = () => {
    canvasRef.current.add(
      new fabric.Textbox(`Dear ${donor_name},`, {
        fontSize: 34,
        fontFamily: "Noto Sans",
        fontWeight: "bold",
        fill: FONT_COLOUR,
        left: MARGIN,
        width: canvasRef.current.width / 2,
        top: canvasRef.current.height / 2 - 70,
        padding: 10,
        textAlign: "left",
      })
    );
    canvasRef.current.add(
      new fabric.Textbox(message, {
        fontSize: 32,
        fontWeight: 200,
        fontFamily: "Noto Sans",
        fill: FONT_COLOUR,
        shadow: "rgba(0,0,0,0.1) 0px 0px 10px",
        left: MARGIN,
        width: canvasRef.current.width / 2.4,
        top: canvasRef.current.height / 2 - 10,
        padding: 10,
        textAlign: "left",
      })
    );
  };

  const addLogos = async () => {
    const logoImgs = await Promise.all(logoFiles?.map(readImageToURL));
    if (logoImgs.length === 0) return;
    if (logoImgs.length === 2) {
      const LOGO_WIDTH = 320;
      const LOGO_LEFT = getTemplateLogoLeft(
        canvasRef.current.width,
        LOGO_WIDTH,
        template_id
      );
      canvasRef.current.add(
        new fabric.Textbox(`Planted By`, {
          fontSize: 20,
          fontWeight: "bold",
          fontFamily: "Sans",
          fill: FONT_COLOUR,
          opacity: 0.6,
          left: LOGO_LEFT + 10,
          width: 150,
          top: canvasRef.current.height - MARGIN - 25 - QR_WIDTH,
          padding: 10,
          textAlign: "left",
        })
      );
      logoImgs.forEach((logoImg, index) => {
        fabric.Image.fromURL(logoImg.toString(), (img) => {
          // Set image dimensions to cover the right half of the canvas
          const LOGO_HEIGHT = QR_WIDTH / 2;
          const scale = LOGO_HEIGHT / img.height;
          img.set({
            left: LOGO_LEFT,
            top:
              canvasRef.current.height -
              LOGO_HEIGHT * (index + 1) -
              LOGO_HEIGHT / 2 -
              MARGIN,
            scaleX: scale,
            scaleY: scale,
          });

          canvasRef.current.add(img);
        });
      });
    }
    if (logoImgs.length === 1) {
      const LOGO_WIDTH = 512;
      const LOGO_LEFT = getTemplateLogoLeft(
        canvasRef.current.width,
        LOGO_WIDTH,
        template_id
      );
      canvasRef.current.add(
        new fabric.Textbox(`Planted By`, {
          fontSize: 20,
          fontWeight: "bold",
          fontFamily: "Noto Sans",
          fill: FONT_COLOUR,
          opacity: 0.6,
          left: LOGO_LEFT + 10,
          width: 150,
          top: canvasRef.current.height - MARGIN - 25 - QR_WIDTH,
          padding: 10,
          textAlign: "left",
        })
      );
      fabric.Image.fromURL(logoImgs[0].toString(), (img) => {
        // Set image dimensions to cover the right half of the canvas
        const LOGO_HEIGHT = QR_WIDTH;
        const scale = LOGO_HEIGHT / img.height;
        img.set({
          left: LOGO_LEFT - 20,
          top: canvasRef.current.height - LOGO_HEIGHT - MARGIN,
          scaleX: scale,
          scaleY: scale,
        });
        canvasRef.current.add(img);
      });
    }
  };

  const disposeFabric = () => {
    canvasRef.current.dispose();
  };

  const renderFabric = useCallback(async () => {
    initFabric();
    await addQRCode();
    addTemplateImages();
    addText();
    logoFiles.length && addLogos();
  }, [logoFiles]);

  useEffect(() => {
    if (canvasRef.current) {
      disposeFabric();
      renderFabric();
    } else {
      renderFabric();
    }
  }, [reset, renderFabric, template_id]);

  return <canvas ref={htmlCanvasRef} />;
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

function getTemplateLogoLeft(
  canvasWidth: number,
  logoWidth: number,
  template_id: number
): number {
  const left1 = canvasWidth - logoWidth - MARGIN;
  const left2 = MARGIN + QR_WIDTH + MARGIN + 200;
  return template_id === 2 ? left2 : left1;
}

export default EditorContainer;
