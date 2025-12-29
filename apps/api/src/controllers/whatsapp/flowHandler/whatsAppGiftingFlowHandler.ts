import axios from 'axios'

import generateGiftMessages from '../../../services/genai/agents/gifting_agents/giftMessageAgent'
import { defaultGiftMessages, generateGiftCardTemplate } from '../../helper/giftRequestHelper'
import { getSlideThumbnail, updateSlide } from '../../helper/slides'
import { WHATSAPP_SCREENS } from '../whatsAppConstants'
import { WhatsAppDecryptedBody, WhatsAppFlowPayload } from '../whatsAppFlowTypes'

const giftingScreens = Object.values(WHATSAPP_SCREENS.GIFTING_FLOW)

function isGiftingScreen(screen?: string): screen is typeof giftingScreens[number] {
    return !!screen && giftingScreens.includes(screen as typeof giftingScreens[number])
}

export async function handleGiftingFlowExchange(payload: WhatsAppFlowPayload, decryptedBody: WhatsAppDecryptedBody): Promise<boolean> {
    const screen = decryptedBody.screen
    if (!isGiftingScreen(screen)) {
        return false
    }

    switch (screen) {
        case WHATSAPP_SCREENS.GIFTING_FLOW.DASHBOARD: {
            const { occasion_type, occasion_name } = decryptedBody.data ?? {}
            const primaryDefault =
                occasion_type === '1'
                    ? defaultGiftMessages.birthday
                    : occasion_type === '2'
                        ? defaultGiftMessages.memorial
                        : defaultGiftMessages.primary
            const secondaryDefault = defaultGiftMessages.secondary

            const resp = await generateGiftMessages({
                occasionName: occasion_name,
                occasionType: occasion_type,
                samplePrimaryMessage: primaryDefault,
                sampleSecondaryMessage: secondaryDefault,
            })

            payload.screen = WHATSAPP_SCREENS.GIFTING_FLOW.AI_MESSAGES
            resp.messages.forEach((message, index) => {
                payload.data[`primary_${index + 1}`] = message.primary_message
                payload.data[`secondary_${index + 1}`] = message.secondary_message
            })
            return true
        }
        case WHATSAPP_SCREENS.GIFTING_FLOW.AI_MESSAGES: {
            const { occasion_type, slide_id, choice, ...data } = decryptedBody.data ?? {}

            let primaryMessage =
                occasion_type === '1'
                    ? defaultGiftMessages.birthday
                    : occasion_type === '2'
                        ? defaultGiftMessages.memorial
                        : defaultGiftMessages.primary
            let secondaryMessage = defaultGiftMessages.secondary

            if (['1', '2', '3'].includes(choice)) {
                primaryMessage = data[`primary_${choice}`]
                secondaryMessage = data[`secondary_${choice}`]
            }

            let slideId: string | null = slide_id
            if (!slideId) {
                const record = {
                    name: "<User's Name>",
                    sapling: '00000',
                    content1: '',
                    content2: '',
                    logo: null,
                    logo_message: '',
                }

                const resp = await generateGiftCardTemplate(record, undefined, false)
                slideId = resp.slideId
            }

            payload.screen = WHATSAPP_SCREENS.GIFTING_FLOW.GIFT_MESSAGES
            payload.data = {
                slide_id: slideId,
                primary_message: primaryMessage,
                secondary_message: secondaryMessage,
            }
            return true
        }
        case WHATSAPP_SCREENS.GIFTING_FLOW.GIFT_MESSAGES: {
            const { primary_message, slide_id: slideId } = decryptedBody.data ?? {}

            const record = {
                sapling: '00000',
                message: primary_message,
                logo_message: '',
            }

            const presentationId = process.env.LIVE_GIFT_CARD_PRESENTATION_ID || ''

            if (presentationId && slideId) {
                await updateSlide(presentationId, slideId, record, true)
            }

            let imageUrl = await getSlideThumbnail(presentationId, slideId)
            imageUrl = `${imageUrl.slice(0, imageUrl.length - 4)}600`
            const resp = await axios.get(imageUrl, { responseType: 'arraybuffer' })
            const base64 = Buffer.from(resp.data, 'binary').toString('base64')

            payload.screen = WHATSAPP_SCREENS.GIFTING_FLOW.CARD_PREVIEW
            payload.data = { card_image: base64 }
            return true
        }
        case WHATSAPP_SCREENS.GIFTING_FLOW.CARD_PREVIEW: {
            return true
        }
        default:
            return false
    }
}