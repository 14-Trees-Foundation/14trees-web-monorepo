import { google, gmail_v1 } from 'googleapis';
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

let credentials: Credentials | null = null;
let tokens: Tokens | null = null;

// Try to load credentials and tokens if they exist
try {
  if (process.env.GMAIL_CREDENTIALS) {
    const credentialsPath = path.join(process.env.GMAIL_CREDENTIALS, '/credentials.json');
    const tokensPath = path.join(process.env.GMAIL_CREDENTIALS, '/token.json');
    
    if (fs.existsSync(credentialsPath)) {
      credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf-8'));
    }
    
    if (fs.existsSync(tokensPath)) {
      tokens = JSON.parse(fs.readFileSync(tokensPath, 'utf-8'));
    }
  }
} catch (error) {
  console.warn('Gmail credentials not found or invalid. Email functionality will be disabled.');
}

const getGmailService = (): gmail_v1.Gmail => {
  const { client_secret, client_id, redirect_uris } = credentials!.installed;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
  oAuth2Client.setCredentials(tokens!);
  const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });
  return gmail;
};

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
}

const getHtmlTemplate = (templateName: string, emailData: any) => {

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

export { sendDashboardMail };
export default sendMail;
