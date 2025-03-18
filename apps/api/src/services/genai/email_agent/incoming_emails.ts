import { AIMessage, HumanMessage } from "@langchain/core/messages";
import { MailSubsRepository } from "../../../repo/mailSubsRepo";
import sendMail, { getGmailService } from "../../gmail/gmail";
import { interactWithEmailAgent } from "./email_agent";
import { gmail_v1 } from "googleapis";

const getEmailBodyText = (parts: gmail_v1.Schema$MessagePart[]) => {
    for (const part of parts) {
        if (part.mimeType === "text/plain" && part.body?.data) {
            return Buffer.from(part.body.data, 'base64').toString('utf-8');
        }
        if (part.parts) {
            getEmailBodyText(part.parts); // Recursively check nested parts
        }
    }

    return ''
};

const getEmailBodyAndAttachments = (parts: gmail_v1.Schema$MessagePart[]) => {

    const emailBody = getEmailBodyText(parts);
    const attachments: any[] = [];
    for (const part of parts) {
       if (part.filename && part.body?.attachmentId) {
            attachments.push({
                filename: part.filename,
                mimeType: part.mimeType,
                attachmentId: part.body.attachmentId,
            });
        }
    }

    // Use a regex to detect "On <date> wrote:" patterns
    const separatorRegex = /On .*? wrote:/g;

    // Split the email chain based on detected separators
    let emailBodies = emailBody.split(separatorRegex).map(body => body.trim());

    return { body: emailBodies[0], attachments }
}

const getLatestThreadDetails = async () => {
    const gmail = await getGmailService();
    try {
        // Get the latest email
        const latestMessage = await gmail.users.messages.list({
            userId: "me",
            labelIds: ["INBOX"],
            maxResults: 1,
        });

        if (!latestMessage.data.messages || latestMessage.data.messages.length === 0 || !latestMessage.data.messages[0]?.id) {
            console.log("No messages found.");
            return;
        }

        const latestMessageId = latestMessage.data.messages[0].id;

        // Get the full message to retrieve the threadId
        const messageDetails = await gmail.users.messages.get({
            userId: "me",
            id: latestMessageId,
        });

        const threadId = messageDetails.data.threadId;
        if (!threadId) {
            console.log("Messages thread not found.");
            return;
        }

        // Get all messages from the same thread
        const thread = await gmail.users.threads.get({
            userId: "me",
            id: threadId,
        });

        const emails = thread.data.messages || [];

        // Extract details from each email in the thread
        const emailDetails = {
            messageId: latestMessageId,
            messageIds: [] as string[],
            threadId: threadId,
            senderEmail: "",
            subject: "",
            bodies: [] as string[],
            attachments: [] as any[],
        };

        const attachmentsSet = new Set(); // To track duplicate attachments

        for (const email of emails) {
            if (!email.payload) return;

            const headers = email.payload.headers;
            const parts = email.payload.parts || [];

            // Extract sender's email and subject
            if (!emailDetails.senderEmail) {
                const fromHeader = headers?.find(h => h.name === "From");
                if (fromHeader?.value) {
                    emailDetails.senderEmail = fromHeader.value;
                }
            }

            if (!emailDetails.subject) {
                const subjectHeader = headers?.find(h => h.name === "Subject");
                if (subjectHeader?.value) {
                    emailDetails.subject = subjectHeader.value;
                }
            }

            if (parts.length > 0) {
                const { body, attachments } = getEmailBodyAndAttachments(parts);
                emailDetails.bodies.push(body);

                // Extract attachments
                for (const attachment of attachments) {
                    if (!attachmentsSet.has(attachment.filename)) {
                        attachmentsSet.add(attachment.filename);
    
                        emailDetails.attachments.push(attachment);
                    }
                }
            } else if (email?.payload?.body?.data) {
                const emailBody = Buffer.from(email.payload.body?.data, 'base64').toString('utf-8');
                emailDetails.bodies.push(emailBody);
            }


            if (email.id) {
                emailDetails.messageIds.push(email.id)
            }

        }

        return emailDetails;
    } catch (error) {
        console.error("Error fetching email thread:", error);
    }
};



export async function checkLatestIncomingMail() {
    
    const emailDetails = await getLatestThreadDetails();
    if (emailDetails) {
        console.log(JSON.stringify(emailDetails, null, 2))

        const mails = await MailSubsRepository.getMailSubs({ message_id: emailDetails.messageId });
        if (mails.length > 0) return;
        else {
            await MailSubsRepository.addMailSub(emailDetails.messageId, emailDetails.threadId);
        }

        const userQuery = emailDetails.bodies[emailDetails.bodies.length - 1];
        const history = emailDetails.bodies.slice(0, -1).map((text, index) => { return index % 2 ? new AIMessage(text) : new HumanMessage(text) })
        const messageResp = await interactWithEmailAgent(userQuery, history);

        console.log(messageResp);

        if (!messageResp) {
            console.log("Somthing went wrong!")
            return
        }
        if (emailDetails.senderEmail) {
            await sendMail({
                from: 'me',
                to: [emailDetails.senderEmail],
                inReplyTo: emailDetails.messageId,
                references: emailDetails.messageIds,
                subject: emailDetails.subject,
                text: messageResp.output.email_body,
                attachments: messageResp.output.attachments,
            }, emailDetails.threadId)
        }
    }

}