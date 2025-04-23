import axios from 'axios';

const accessToken = process.env.WA_ACCESS_TOKEN;
const apiVersion = process.env.WA_API_VERSION;
const myNumberId = process.env.WA_PHONE_NUMBER_ID;

async function sendWhatsAppMessage(data: any) {

  return await axios({
    method: 'POST',
    url: `https://graph.facebook.com/${apiVersion}/${myNumberId}/messages`,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    data: data
  })
}

async function updateWhatsAppMessage(data: any) {

  return await axios({
    method: 'PUT',
    url: `https://graph.facebook.com/${apiVersion}/${myNumberId}/messages`,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    data: data
  })
}

export { sendWhatsAppMessage, updateWhatsAppMessage }
