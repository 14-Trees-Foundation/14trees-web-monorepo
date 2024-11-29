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
    logo_message: string;
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

export const createSlide = async (presentationId: string, slideId: string, record: Record, keepImages: boolean = false): Promise<string> => {
    try {
        const slidePageId = await createCopyOfTheCardTemplate(presentationId, slideId);
        await updateSlide(presentationId, slidePageId, record, keepImages);
        return slidePageId;
    } catch {
        throw new Error('Failed to create slide');
    }
}


export const updateSlide = async (presentationId: string, slideId: string, record: Record, keepImage: boolean = false) => {
    await updateImagesInSlide(presentationId, slideId, record, keepImage);

    const getSlideUrl = `https://slides.googleapis.com/v1/presentations/${presentationId}/pages/${slideId}`;
    const slidesUpdateUrl = `https://slides.googleapis.com/v1/presentations/${presentationId}:batchUpdate`;
    try {
        const token = await getJwtToken()
        const response = await axios.get(getSlideUrl, {
            headers: { Authorization: `Bearer ${token}` },
        });

        const slide = response.data;

        const requests: any[] = [];
        const nameUpdateRequest = getUpdateTextRequest(slide, 'NAME', 'Dear ' + record.name + ',', record.name ? false : true);
        if (nameUpdateRequest) requests.push(...nameUpdateRequest);

        const content1UpdateRequest = getUpdateTextRequest(slide, 'CONTENT1', record.content1);
        if (content1UpdateRequest) requests.push(...content1UpdateRequest);

        const content2UpdateRequest = getUpdateTextRequest(slide, 'CONTENT2', record.content2);
        if (content2UpdateRequest) requests.push(...content2UpdateRequest);

        const logoMsgUpdateRequest = getUpdateTextRequest(slide, 'LOGO_TEXT', record.logo ? record.logo_message : '', record.logo ? false : !keepImage);
        if (logoMsgUpdateRequest) requests.push(...logoMsgUpdateRequest);

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

const getUpdateTextRequest = (slide: any, description: string, newText: string, remove: boolean = false) => {
    // Find the text element with the specified description
    const textElement = slide.pageElements.find((element: any) => element.description === description);

    if (!textElement || !textElement.shape) {
        console.log(`No text element with description '${description}' found.`);
        return null;
    }

    const textElementId = textElement.objectId;

    const requests: any[] = [];

    if (remove) {
        return [{
            deleteObject: { objectId: textElement.objectId }, // Remove existing image
        }];
    }

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

const updateImagesInSlide = async (presentationId: string, slideId: string, record: Record, keepImage: boolean = false) => {
    const getSlideUrl = `https://slides.googleapis.com/v1/presentations/${presentationId}/pages/${slideId}`;
    const slidesUpdateUrl = `https://slides.googleapis.com/v1/presentations/${presentationId}:batchUpdate`;
    let qrIdx = -1, logoIdx = -1;
    try {
        const token = await getJwtToken()
        const response = await axios.get(getSlideUrl, {
            headers: { Authorization: `Bearer ${token}` },
        });

        const slide = response.data;

        const requests: any[] = [];
        const logoUpdateRequest = getUpdateImageRequest(slide, 'LOGO', record.logo, keepImage);
        if (logoUpdateRequest) {
            requests.push(...logoUpdateRequest);
            if (logoUpdateRequest.length === 2) logoIdx = requests.length - 2; // Set the index of the logo image in request
        }

        const dashboardUrl = process.env.DASHBOARD_URL || 'https://dashboard.14trees.org';
        const saplingUrl = dashboardUrl + '/profile/' + record.sapling;
        const qrCodeUrl = `https://quickchart.io/qr?text=${saplingUrl}`;
        const saplingUpdateRequest = getUpdateImageRequest(slide, 'QR', qrCodeUrl, keepImage);
        if (saplingUpdateRequest) {
            requests.push(...saplingUpdateRequest);
            if (saplingUpdateRequest.length === 2) qrIdx = requests.length - 2; // Set the index of the qr image in request
        }

        if (requests.length === 0) return;

        // Send the request to replace the text
        const resp = await axios.post(
            slidesUpdateUrl,
            { requests },
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        // below code is for setting description back in qr code and logo image
        // this will help to replace the images again
        const updateDescriptionRequests: any[] = [];
        if (logoIdx !== -1 && resp?.data?.replies[logoIdx]?.createImage?.objectId) {
            updateDescriptionRequests.push({
                updatePageElementAltText: {
                    objectId: resp.data.replies[logoIdx].createImage.objectId,
                    description: "LOGO",
                }
            })
        }

        if (qrIdx !== -1 && resp?.data?.replies[qrIdx]?.createImage?.objectId) {
            updateDescriptionRequests.push({
                updatePageElementAltText: {
                    objectId: resp.data.replies[qrIdx].createImage.objectId,
                    description: "QR",
                }
            })
        }

        if (updateDescriptionRequests.length === 0) return;
        // Send the request to update the description of the images
        axios.post(
            slidesUpdateUrl,
            { requests: updateDescriptionRequests },
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

const getUpdateImageRequest = (slide: any, description: string, imageUrl?: string, keepImage: boolean = false) => {
    // Find the image element with the specified description
    const imageElement = slide.pageElements.find(
        (element: any) => element.description === description
    );

    if (!imageElement) {
        console.log(`No element with description '${description}' found.`);
        return null;
    }

    // Prepare batch update request to insert the image at the same position
    const requests = [];
    if (imageUrl) {
        requests.push({
            createImage: {
                url: imageUrl,
                elementProperties: {
                    pageObjectId: slide.objectId,
                    size: imageElement.size,
                    transform: imageElement.transform,
                },
            },
        })
    }

    // if (imageUrl) {
    //     requests.push({
    //         replaceImage: {
    //             url: imageUrl,
    //             imageObjectId: imageElement.objectId,
    //         },
    //     })
    // }

    // if (!imageUrl && !keepImage) {
    //     requests.push({
    //         deleteObject: { objectId: imageElement.objectId }, // Remove existing image
    //     })
    // }

    if (imageUrl || !keepImage) {
        requests.push({
            deleteObject: { objectId: imageElement.objectId }, // Remove existing image
        })
    }

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

export async function deleteUnwantedSlides(presentationId: string, allowedIds: string[]): Promise<void> {
    const token = await getJwtToken();
    
    const response = await axios.get(`https://slides.googleapis.com/v1/presentations/${presentationId}`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    const currentSlides = response.data.slides;
    const currentIds: string[] = currentSlides.map((slide: any) => slide.objectId);

    const idsToDelete = currentIds.filter(id => !allowedIds.includes(id));

    if (idsToDelete.length === 0) {
        console.log('[INFO]' ,'No slides to delete.');
        return;
    }

    const deleteRequests = idsToDelete.map(id => ({
        deleteObject: {
            objectId: id,
        },
    }));

    await axios.post(
        `https://slides.googleapis.com/v1/presentations/${presentationId}:batchUpdate`,
        {
            requests: deleteRequests,
        },
        {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        }
    );

    console.log('[INFO]', `Deleted slides with IDs: ${idsToDelete.join(', ')}`);
}