import fs from 'fs';
import puppeteer from "puppeteer";
import handlebars from 'handlebars';

const getHtmlTemplate = (templateName: string, data?: any) => {

    const source = fs.readFileSync(process.env.SOURCE_PATH + '/services/invoice/templates/' + templateName, 'utf-8').toString();
    const template = handlebars.compile(source, { noEscape: true });
    return template(data);
}

const generatePdf = async (html: string) => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setViewport({ width: 794, height: 1123 });
    await page.setContent(html);
    const pdfData = await page.pdf({ format: 'A4', margin: { top: '10mm', bottom: '10mm', left: '10mm', right: '10mm' } });
    await browser.close();

    return pdfData;
}

export const generateFundRequestPdf = async (data: any) => {
    const uint8Array = await generatePdf(getHtmlTemplate('payment_request.html', data));
    const buffer = Buffer.from(uint8Array);
    return buffer.toString('base64');
}