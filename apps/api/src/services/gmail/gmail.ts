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

// Check if we're in development mode (NODE_ENV !== 'production')
const isDevelopment = process.env.NODE_ENV !== 'production';

// Initialize variables
let creds: Credentials | null = null;
let token: Tokens | null = null;

// Only try to load credentials if not in development mode or if GMAIL_CREDENTIALS is set
if (!isDevelopment || process.env.GMAIL_CREDENTIALS) {
  try {
    const credentialsPath = path.join(process.env.GMAIL_CREDENTIALS || '', '/credentials.json');
    const tokensPath = path.join(process.env.GMAIL_CREDENTIALS || '', '/token.json');
    
    if (fs.existsSync(credentialsPath) && fs.existsSync(tokensPath)) {
      const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf-8'));
      const tokens = JSON.parse(fs.readFileSync(tokensPath, 'utf-8'));
      
      // Load the credentials and tokens with types
      creds = credentials;
      token = tokens;
      
      console.log('Gmail credentials loaded successfully');
    } else {
      console.log('Gmail credential files not found. Gmail functionality will be disabled.');
    }
  } catch (error) {
    console.error('Error loading Gmail credentials:', error);
  }
} else {
  console.log('Development mode: Gmail functionality disabled');
}

const getGmailService = (): gmail_v1.Gmail | null => {
  if (!creds || !token) {
    console.log('Gmail credentials not available. Skipping Gmail service initialization.');
    return null;
  }
  
  try {
    const { client_secret, client_id, redirect_uris } = creds.installed;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
    oAuth2Client.setCredentials(token);
    const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });
    return gmail;
  } catch (error) {
    console.error('Error initializing Gmail service:', error);
    return null;
  }
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

handlebars.registerHelper('eq', function (a, b) {
  return a === b;
});

handlebars.registerHelper('pluralize', function (count, singular, plural) {
  if (plural === "") {
    plural = singular + 's';
  }

  return count === 1 ? singular : plural;
});

const getHtmlTemplate = (templateName: string, emailData: any) => {
  try {
    const templatePath = process.env.SOURCE_PATH + '/services/gmail/templates/' + templateName;
    
    if (!fs.existsSync(templatePath)) {
      console.warn(`Template file not found: ${templatePath}`);
      return `<p>Email template "${templateName}" not found. Data: ${JSON.stringify(emailData, null, 2)}</p>`;
    }
    
    const source = fs.readFileSync(templatePath, 'utf-8').toString();
    const template = handlebars.compile(source);
    return template(emailData);
  } catch (error) {
    console.error(`Error loading template ${templateName}:`, error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return `<p>Error loading email template: ${errorMessage}</p><pre>${JSON.stringify(emailData, null, 2)}</pre>`;
  }
}

const createMail = async (options: MailOptions): Promise<string> => {
  const mailComposer = new MailComposer(options);
  const message = await mailComposer.compile().build();
  return encodeMessage(message.toString());
};

const sendMail = async (options: MailOptions): Promise<{ status: number, statusText: string }> => {
  const gmail = getGmailService();
  
  if (!gmail) {
    console.log('Gmail service not available. Logging email details instead:');
    console.log('To:', options.to);
    console.log('Subject:', options.subject);
    console.log('Body:', options.text || options.html?.substring(0, 100) + '...');
    
    // Return mock success in development mode
    return { status: 200, statusText: 'OK (Development Mode - Email Not Actually Sent)' };
  }
  
  try {
    const rawMessage = await createMail(options);
    const response = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: rawMessage,
      },
    });

    return { status: response.status, statusText: response.statusText };
  } catch (error) {
    console.error('Error sending email:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to send email';
    return { status: 500, statusText: errorMessage };
  }
};

const sendDashboardMail = async (
  templateName: string,
  emailData: any,
  toEmails: string[],
  cc?: string[],
  attachments?: { filename: string; path: string }[],
  subject?: string,
  fromName?: string,
  fromEmail?: string,
  replyTo?: string
) => {

  const options = {
    from: {
      name: fromName || '14 Trees',
      address: fromEmail || 'dashboard@14trees.org'
    },
    to: toEmails,
    replyTo: replyTo || 'dashboard@14trees.org',
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
