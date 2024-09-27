import axios from 'axios';
import { JWT, Credentials } from 'google-auth-library';
import * as fs from 'fs';
import * as path from 'path';

interface ServiceAccountCredentials {
    type: string;
    project_id: string;
    private_key_id: string;
    private_key: string;
    client_email: string;
    client_id: string;
    auth_uri: string;
    token_uri: string;
    auth_provider_x509_cert_url: string;
    client_x509_cert_url: string;
}

interface Record {
    sapling: string;
    name: string;
    content1: string;
    content2: string;
    logo?: string;
}

let token: Credentials | null = null

async function getJwtToken(
    scopes: string[] = ['https://www.googleapis.com/auth/presentations']
): Promise<string> {
    try {
        const serviceAccountPath: string = path.resolve(process.env.GOOGLE_APP_CREDENTIALS || '');
        if (token && token.access_token && token.expiry_date && token.expiry_date > Date.now()) return token.access_token;

        // Read and parse the service account file
        const credentials: ServiceAccountCredentials = JSON.parse(
            fs.readFileSync(path.resolve(serviceAccountPath), 'utf8')
        );

        // Create the JWT client using service account credentials
        const client = new JWT({
            email: credentials.client_email,
            key: credentials.private_key,
            scopes: scopes,
        });

        // Authenticate the client and retrieve the token
        const tokenResponse = await client.authorize();
        token = tokenResponse;
        if (tokenResponse.access_token) return tokenResponse.access_token;
        throw new Error('Empty token in response');
    } catch (error) {
        console.error('Error generating JWT token:', error);
        throw error;
    }
}

async function createCopyOfTheCardTemplate(
    presentationId: string,
    slidePageId: string,
): Promise<string> {
    try {
        const token = await getJwtToken()
        // Duplicate the template card
        const requestBody = {
            requests: [
                {
                    duplicateObject: {
                        objectId: slidePageId,
                    },
                },
            ],
        };

        const response = await axios.post(
            `https://slides.googleapis.com/v1/presentations/${presentationId}:batchUpdate`,
            requestBody,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        // Extract the new page ID from the response
        const newPageId = response.data.replies?.[0]?.duplicateObject?.objectId;
        if (!newPageId) {
            throw new Error('Failed to duplicate the slide.');
        }

        return newPageId;
    } catch (error) {
        console.error('Error duplicating slide:', error);
        throw error;
    }
}

export const createSlide = async (presentationId: string, slideId: string, record: Record): Promise<string> => {
    try {
        const slidePageId = await createCopyOfTheCardTemplate(presentationId, slideId);
        await updateImagesInSlide(presentationId, slidePageId, record);
        await updateSlide(presentationId, slidePageId, record);
        return slidePageId;
    } catch {
        throw new Error('Failed to create slide');
    }
}


export const updateSlide = async (presentationId: string, slideId: string, record: Record) => {
    const getSlideUrl = `https://slides.googleapis.com/v1/presentations/${presentationId}/pages/${slideId}`;
    const slidesUpdateUrl = `https://slides.googleapis.com/v1/presentations/${presentationId}:batchUpdate`;
    try {
        const token = await getJwtToken()
        const response = await axios.get(getSlideUrl, {
            headers: { Authorization: `Bearer ${token}` },
        });

        const slide = response.data;

        const requests: any[] = [];
        const nameUpdateRequest = getUpdateTextRequest(slide, 'NAME', 'Dear ' + record.name + ',');
        if (nameUpdateRequest) requests.push(...nameUpdateRequest);

        const content1UpdateRequest = getUpdateTextRequest(slide, 'CONTENT1', record.content1);
        if (content1UpdateRequest) requests.push(...content1UpdateRequest);

        const content2UpdateRequest = getUpdateTextRequest(slide, 'CONTENT2', record.content2);
        if (content2UpdateRequest) requests.push(...content2UpdateRequest);

        // Send the request to replace the text
        await axios.post(
            slidesUpdateUrl,
            { requests },
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            }
        );

    } catch (error) {
        console.error('Error updating slide:', error);
    }
};

const getUpdateTextRequest = (slide: any, description: string, newText: string) => {
    // Find the text element with the specified description
    const textElement = slide.pageElements.find((element: any) => element.description === description);

    if (!textElement || !textElement.shape) {
        console.log(`No text element with description '${description}' found.`);
        return null;
    }

    const textElementId = textElement.objectId;

    const requests: any[] = [];

    // Remove the existing text if exists
    if (textElement.shape.text) {
        requests.push({
            deleteText: {
                objectId: textElementId,
                textRange: {
                    type: 'ALL',
                },
            },
        })
    }

    // insert new text message
    requests.push({
        insertText: {
            objectId: textElementId,
            insertionIndex: 0,
            text: newText,
        },
    },)

    return requests;
}

const updateImagesInSlide = async (presentationId: string, slideId: string, record: Record) => {
    const getSlideUrl = `https://slides.googleapis.com/v1/presentations/${presentationId}/pages/${slideId}`;
    const slidesUpdateUrl = `https://slides.googleapis.com/v1/presentations/${presentationId}:batchUpdate`;
    try {
        const token = await getJwtToken()
        const response = await axios.get(getSlideUrl, {
            headers: { Authorization: `Bearer ${token}` },
        });

        const slide = response.data;

        const requests: any[] = [];
        if (record.logo) {
            const logoUpdateRequest = getUpdateImageRequest(slide, 'LOGO', record.logo);
            if (logoUpdateRequest) requests.push(...logoUpdateRequest);
        }

        const saplingUrl = 'https://dashboard.14trees.org/profile/' + record.sapling;
        const qrCodeUrl = `https://quickchart.io/qr?text=${saplingUrl}`;
        const saplingUpdateRequest = getUpdateImageRequest(slide, 'QR', qrCodeUrl);
        if (saplingUpdateRequest) requests.push(...saplingUpdateRequest);

        if (requests.length === 0) return;

        // Send the request to replace the text
        await axios.post(
            slidesUpdateUrl,
            { requests },
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            }
        );

    } catch (error) {
        console.error('Error updating slide:', error);
    }
};

const getUpdateImageRequest = (slide: any, description: string, imageUrl: string) => {
    // Find the image element with the specified description
    const imageElement = slide.pageElements.find(
        (element: any) => element.description === description
    );

    if (!imageElement) {
        console.log(`No element with description '${description}' found.`);
        return null;
    }

    // Prepare batch update request to insert the image at the same position
    const requests = [
        {
            createImage: {
                url: imageUrl,
                elementProperties: {
                    pageObjectId: slide.objectId,
                    size: imageElement.size,
                    transform: imageElement.transform,
                },
            },
        },
        {
            deleteObject: { objectId: imageElement.objectId }, // Remove existing image
        },
    ];

    return requests;
}

export const getSlideThumbnail = async (
    presentationId: string,
    slidePageId: string,
): Promise<string> => {
    try {
        const token = await getJwtToken()
        const url = `https://slides.googleapis.com/v1/presentations/${presentationId}/pages/${slidePageId}/thumbnail`;

        const response = await axios.get(url, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        const contentUrl = response.data.contentUrl;
        if (!contentUrl) {
            throw new Error('Failed to retrieve thumbnail.');
        }

        return contentUrl;
    } catch (error) {
        console.error('Error fetching slide thumbnail:', error);
        throw error;
    }
}

export async function deleteSlide(
    presentationId: string,
    slidePageId: string,
): Promise<void> {
    try {
        const token = await getJwtToken()
        const requestBody = {
            requests: [
                {
                    deleteObject: {
                        objectId: slidePageId,
                    },
                },
            ],
        };

        const response = await axios.post(
            `https://slides.googleapis.com/v1/presentations/${presentationId}:batchUpdate`,
            requestBody,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        if (response.status === 200) {
            console.log(`Slide with page ID ${slidePageId} deleted successfully.`);
        } else {
            throw new Error('Failed to delete slide.');
        }
    } catch (error) {
        console.error('Error deleting slide:', error);
        throw error;
    }
}