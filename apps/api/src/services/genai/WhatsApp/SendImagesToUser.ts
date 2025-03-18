import { z } from "zod";
import { DynamicStructuredTool } from "langchain/tools";
import { sendWhatsAppMessage } from '../../WhatsApp/messageHelper'; // Import your WhatsApp message sending function
import { imageMessage } from "../../WhatsApp/messages";
import { logResponseError } from "../../WhatsApp/logResponseError";

// Define Main Request Schema
const SendImagesToUserRequestSchema = z.object({
    image_urls: z.array(z.string()).describe("Array of image links"),
    image_caption: z.string().optional().describe("Caption text to show below image. Only applicable when there is single image url")
});

const description = `
Send images as media to user from list of image urls.
Helps user directly see and share images. Since images are shared as media and not links
Must use this tool to send images to user
`;

function createSendImagesToUserTool(customerPhoneNumber: string) {
    return new DynamicStructuredTool({
        name: "send_images_to_user",
        description: description,
        schema: SendImagesToUserRequestSchema,
        func: async (data): Promise<string> => {
            const { image_urls } = data;

            for (const imageUrl of image_urls) {
                const message = imageMessage;
                message.to = customerPhoneNumber;
                message.image.link = imageUrl;
                message.image.caption = image_urls.length === 1 && data.image_caption ? data.image_caption : "";

                try {
                    await sendWhatsAppMessage(message);
                } catch (error) {
                    logResponseError(error);
                }
            }

            return 'Images sent successfully';
        }
    });
}

export default createSendImagesToUserTool;