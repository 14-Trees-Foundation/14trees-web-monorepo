import { google, gmail_v1 } from 'googleapis';
import MailComposer from 'nodemailer/lib/mail-composer';
import fs from 'fs';
import path from 'path';
import handlebars from 'handlebars';

// Load JSON files using fs
const credentialsPath = path.join(process.env.GMAIL_CREDENTIALS || '', '/credentials.json');
const tokensPath = path.join(process.env.GMAIL_CREDENTIALS || '', '/token.json');

const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf-8'));
const tokens = JSON.parse(fs.readFileSync(tokensPath, 'utf-8'));

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

// Load the credentials and tokens with types
const creds: Credentials = credentials;
const token: Tokens = tokens;

const getGmailService = (): gmail_v1.Gmail => {
  const { client_secret, client_id, redirect_uris } = creds.installed;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
  oAuth2Client.setCredentials(token);
  const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });
  return gmail;
};

const encodeMessage = (message: string): string => {
  return Buffer.from(message).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

interface MailOptions {
  from?: string;
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  attachments?: { filename: string; path: string }[];
}

const getHtmlTemplate = (type: string, emailData: any) => {

  let templateName = 'receiver-single-tree.html';
  if (type === 'receiver-multi-trees') templateName = 'receiver-multi-trees.html'

  const source = fs.readFileSync( process.env.SOURCE_PATH + '/services/gmail/templates/' + templateName, 'utf-8').toString();
  const template = handlebars.compile(source);
  return template(emailData);
}

const createMail = async (options: MailOptions): Promise<string> => {
  const mailComposer = new MailComposer(options);
  const message = await mailComposer.compile().build();
  return encodeMessage(message.toString());
};

const sendMail = async (options: MailOptions): Promise<{ status: number, statusText: string }> => {
  const gmail = getGmailService();
  const rawMessage = await createMail(options);
  const response = await gmail.users.messages.send({
    userId: 'me',
    requestBody: {
      raw: rawMessage,
    },
  });

  return { status: response.status, statusText: response.statusText };
};

const sendDashboardMail = async (type: string, emailData: any, toEmails: string[], cc?: string[], attachments?: { filename: string; path: string }[]) => {

  const options = {
    to: toEmails,
    replyTo: 'admin@14trees.org',
    cc: cc,
    subject: 'A Tree has been planted',
    html: "",
    textEncoding: 'base64',
    attachments: attachments,
  }

  options.html = getHtmlTemplate(type, emailData)

  const { status, statusText } = await sendMail(options)
  if (status === 200) {
    console.log("Email send Successfully to " + toEmails);
    return '';
  }

  return statusText;
}

export { sendDashboardMail };
export default sendMail;
