import { google, gmail_v1 } from 'googleapis';
import { authenticate } from '@google-cloud/local-auth'
import MailComposer from 'nodemailer/lib/mail-composer';
import fs from 'fs';
import path from 'path';
import handlebars from 'handlebars';

// Define types for credentials and tokens
interface Credentials {
  installed: {
    client_id: string;
    client_secret: string;
    redirect_uris: string[];
  };
}

interface Tokens {
  access_token: string;
  refresh_token: string;
  scope: string;
  token_type: string;
  expiry_date: number;
}

// Load JSON files using fs
const credentialsPath = path.join(process.env.GMAIL_CREDENTIALS || '', '/credentials.json');
const tokensPath = path.join(process.env.GMAIL_CREDENTIALS || '', '/token.json');
const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly', 'https://www.googleapis.com/auth/gmail.send'];

function loadSavedCredentialsIfExist() {
  try {
    const credsData = fs.readFileSync(credentialsPath, 'utf-8');
    const tokenData = fs.readFileSync(tokensPath, 'utf-8');

    const credentials: Credentials = JSON.parse(credsData);
    const token: Tokens = JSON.parse(tokenData);

    const { client_secret, client_id, redirect_uris } = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
    oAuth2Client.setCredentials(token);

    return oAuth2Client;
  } catch (err: any) {
    console.log(err.message);
    return null;
  }
}

function saveCredentials(client: any) {
  const content = fs.readFileSync(credentialsPath, 'utf-8');
  const keys = JSON.parse(content);
  const key = keys.installed || keys.web;
  const payload = JSON.stringify({
    type: 'authorized_user',
    client_id: key.client_id,
    client_secret: key.client_secret,
    refresh_token: client.credentials.refresh_token,
  });

  fs.writeFileSync(tokensPath, payload);
}


// const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf-8'));
// const tokens = JSON.parse(fs.readFileSync(tokensPath, 'utf-8'));

// // Load the credentials and tokens with types
// const creds: Credentials = credentials;
// const token: Tokens = tokens;

const getGmailService = async (): Promise<gmail_v1.Gmail> => {
  const client = loadSavedCredentialsIfExist();
  if (client) {
    // const authToken = await client.getAccessToken()
    // console.log(authToken.token);
    return google.gmail({ version: 'v1', auth: client });
  }

  const newClient: any = await authenticate({
    scopes: SCOPES,
    keyfilePath: credentialsPath,
  });
  if (newClient.credentials) {
    saveCredentials(newClient);
  }

  const gmail = google.gmail({ version: 'v1', auth: newClient });
  return gmail;

  // const { client_secret, client_id, redirect_uris } = creds.installed;
  // const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
  // oAuth2Client.setCredentials(token);
  // const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });
  // return gmail;
};

// Subscribe to incoming emails
async function watchInbox() {
  const gmail = await getGmailService();

  gmail.users.watch(
    {
      userId: "me",
      requestBody: {
        labelIds: ["INBOX"],
        topicName: "projects/trees-447012/topics/gmail", // Replace with your Google Pub/Sub topic
      },
    },
    (err, res) => {
      if (err) return console.log("Error setting up watch:", err);
      console.log("Watch response:", res?.data);
    }
  );
}

watchInbox()

const encodeMessage = (message: string): string => {
  return Buffer.from(message).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

interface MailOptions {
  from?: string | { name: string; address: string };
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  attachments?: { filename: string; path: string }[];
  inReplyTo?: string // message id
  references?: string | string[] // message id
}

const getHtmlTemplate = (templateName: string, emailData: any) => {

  const source = fs.readFileSync(process.env.SOURCE_PATH + '/services/gmail/templates/' + templateName, 'utf-8').toString();
  const template = handlebars.compile(source);
  return template(emailData);
}

const createMail = async (options: MailOptions): Promise<string> => {
  const mailComposer = new MailComposer(options);
  const message = await mailComposer.compile().build();
  return encodeMessage(message.toString());
};

const sendMail = async (options: MailOptions, threadId?: string): Promise<{ status: number, statusText: string }> => {
  const gmail = await getGmailService();
  const rawMessage = await createMail(options);
  const response = await gmail.users.messages.send({
    userId: 'me',
    requestBody: {
      raw: rawMessage,
      threadId: threadId
    },
  });

  return { status: response.status, statusText: response.statusText };
};

const sendDashboardMail = async (templateName: string, emailData: any, toEmails: string[], cc?: string[], attachments?: { filename: string; path: string }[], subject?: string) => {

  const options = {
    from: { name: '14 Trees', address: 'admin@14trees.org' },
    to: toEmails,
    replyTo: 'admin@14trees.org',
    cc: cc,
    subject: subject ? subject : emailData.count > 1 ? `${emailData.count} Trees have been planted` : 'A Tree has been planted',
    html: "",
    textEncoding: 'base64',
    attachments: attachments,
  }

  options.html = getHtmlTemplate(templateName, emailData)

  const { status, statusText } = await sendMail(options)
  if (status === 200) {
    console.log("Email send Successfully to " + toEmails);
    return '';
  }

  return statusText;
}

const sendTemplateMail = async (templateName: string, options: MailOptions, emailData: any) => {

  const mailOptions = {
    ...options,
    from: { name: '14 Trees', address: 'admin@14trees.org' },
    replyTo: 'admin@14trees.org',
    html: "",
    textEncoding: 'base64',
  }

  mailOptions.html = getHtmlTemplate(templateName, emailData)

  const { status, statusText } = await sendMail(mailOptions)
  if (status === 200) {
    console.log("Email send Successfully to " + mailOptions.to);
    return '';
  }

  return statusText;
}

async function getAttachmentData(messageId: string, attachmentId: string): Promise<Buffer | null> {
    const gmail = await getGmailService();
    const response = await gmail.users.messages.attachments.get({
        userId: 'me',
        messageId: messageId,
        id: attachmentId,
    });

    const data = response.data.data;
    return data ? Buffer.from(data, 'base64') : null;
}

export { sendDashboardMail, sendTemplateMail, getGmailService, getAttachmentData };
export default sendMail;
