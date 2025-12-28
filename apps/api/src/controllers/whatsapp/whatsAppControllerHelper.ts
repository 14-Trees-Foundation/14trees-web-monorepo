import * as crypto from 'crypto'
import * as fs from 'fs'

const appSecret = process.env.WA_APP_SECRET
const pemFile = process.env.WA_PRIVATE_PEM || '';
const passprase = process.env.WA_PEM_PASSPHRASE || '';
const privatePem = fs.readFileSync(pemFile, 'utf8');

export function validateXHubSignature(requestBody: any, signature: string) {
    const calcXHubSignature = "sha256=" + crypto
        .createHmac('sha256', appSecret || '')
        .update(JSON.stringify(requestBody), 'utf-8')
        .digest('hex')

    return signature === calcXHubSignature
}

export const decryptRequest = (body: any) => {
    const { encrypted_aes_key, encrypted_flow_data, initial_vector } = body

    const privateKey = crypto.createPrivateKey({ key: privatePem, passphrase: passprase })
    let decryptedAesKey = null
    try {
        // decrypt AES key created by client
        decryptedAesKey = crypto.privateDecrypt(
            {
                key: privateKey,
                padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
                oaepHash: "sha256",
            },
            Buffer.from(encrypted_aes_key, "base64")
        )
    } catch (error) {
        console.error(error)
        /*
        Failed to decrypt. Please verify your private key.
        If you change your public key. You need to return HTTP status code 421 to refresh the public key on the client
        */
        throw new Error(
            "Failed to decrypt the request. Please verify your private key."
        )
    }

    // decrypt flow data
    const flowDataBuffer = Buffer.from(encrypted_flow_data, "base64")
    const initialVectorBuffer = Buffer.from(initial_vector, "base64")

    const TAG_LENGTH = 16
    const encrypted_flow_data_body = flowDataBuffer.subarray(0, -TAG_LENGTH)
    const encrypted_flow_data_tag = flowDataBuffer.subarray(-TAG_LENGTH)

    const decipher = crypto.createDecipheriv(
        "aes-128-gcm",
        decryptedAesKey,
        initialVectorBuffer
    )
    decipher.setAuthTag(encrypted_flow_data_tag)

    const decryptedJSONString = Buffer.concat([
        decipher.update(encrypted_flow_data_body),
        decipher.final(),
    ]).toString("utf-8")

    return {
        decryptedBody: JSON.parse(decryptedJSONString),
        aesKeyBuffer: decryptedAesKey,
        initialVectorBuffer,
    }
}

export const encryptResponse = (
    response: any,
    aesKeyBuffer: Buffer,
    initialVectorBuffer: Buffer
) => {
    // flip initial vector
    const flipped_iv = []
    for (const pair of initialVectorBuffer.entries()) {
        flipped_iv.push(~pair[1])
    }

    // encrypt response data
    const cipher = crypto.createCipheriv(
        "aes-128-gcm",
        aesKeyBuffer,
        Buffer.from(flipped_iv)
    )

    return Buffer.concat([
        cipher.update(JSON.stringify(response), "utf-8"),
        cipher.final(),
        cipher.getAuthTag(),
    ]).toString("base64")
}