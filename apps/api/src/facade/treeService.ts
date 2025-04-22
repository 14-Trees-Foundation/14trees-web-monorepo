import * as puppeteer from 'puppeteer';
import TreeRepository from '../repo/treeRepo';
import { uploadFileToS3 } from '../controllers/helper/uploadtos3';
import { Buffer } from 'buffer';

class TreeService {
  private static browser: puppeteer.Browser | null = null;

  static async initializeBrowser(): Promise<void> {
    this.browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  }

  static async captureAndUploadScreenshot(treeId: number): Promise<{
    success: boolean;
    s3Url?: string;
    error?: string;
  }> {
    try {
      const tree = await TreeRepository.getTreeByTreeId(treeId);
      if (!tree?.sapling_id) {
        return { success: false, error: 'Missing sapling_id' };
      }

      if (!this.browser) await this.initializeBrowser();
      
      const page = await this.browser!.newPage();
      await page.goto(`https://dashboard.14trees.org/profile/${tree.sapling_id}`, {
        waitUntil: 'networkidle2',
        timeout: 30000
      });

      // Explicitly type the screenshot as Buffer
      const screenshotBuffer = await page.screenshot({ 
        fullPage: true,
        encoding: 'binary' // This ensures we get a Buffer
      }) as Buffer;

      await page.close();

      const s3Url = await uploadFileToS3(
        'trees',
        screenshotBuffer,
        `dashboard-images/${tree.id}-${Date.now()}.png`
      );

      return { success: true, s3Url };
    } catch (error) {
      console.error(`Failed tree ${treeId}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  static async closeBrowser(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

export default TreeService;