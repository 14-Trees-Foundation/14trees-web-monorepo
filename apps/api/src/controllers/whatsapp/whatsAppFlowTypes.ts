export type WhatsAppFlowPayload = {
    screen?: string;
    data: Record<string, any>;
};

export type WhatsAppDecryptedBody = {
    screen?: string;
    data?: Record<string, any>;
    [key: string]: unknown;
};