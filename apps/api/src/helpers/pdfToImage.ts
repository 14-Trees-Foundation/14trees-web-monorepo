import { fromPath } from "pdf2pic";

const options = {
    quality: 100,
    density: 200,
    saveFilename: "untitled",
    savePath: "/home/onrush-dev/Downloads",
    format: "png",
    width: 1600,
    height: 1200
};
const convert = fromPath("/home/onrush-dev/Downloads/slide (3).pdf", options);
const pageToConvertAsImage = 1;

convert(pageToConvertAsImage, { responseType: "image" })
    .then((resolve) => {
        console.log("Page 1 is now converted as image");

        return resolve;
    });


// sudo dnf install ghostscript
// sudo dnf install graphicsmagick