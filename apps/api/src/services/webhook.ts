import axios from 'axios';

async function sendDiscordMessage(message: string, username: string = 'Error Service'): Promise<void> {
    const webhookUrl = process.env.APP_WEB_HOOK_URL;
    if (!webhookUrl) return;

    const maxLength = 1000; // Discord message limit for 'content'

    // Split the message content if it's too long
    const messages = splitMessage(message, maxLength);
    try {
        // Create a message object for each chunk
        const messageChunk = { username, content: '```' + messages[0] + '```' };
        const response = await axios.post(webhookUrl, messageChunk, {
            headers: {
                'Content-Type': 'application/json',
            },
        });
        console.log('Message sent successfully:', response.data);
    } catch (error) {
        console.log('[ERROR]', 'Error sending message to Discord:', error);
    }
    await sleep(1000);
}

function splitMessage(content: string, maxLength: number): string[] {
    const chunks: string[] = [];
    let currentPos = 0;

    while (currentPos < content.length) {
        chunks.push(content.slice(currentPos, currentPos + maxLength));
        currentPos += maxLength;
    }

    return chunks;
}

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export default sendDiscordMessage;