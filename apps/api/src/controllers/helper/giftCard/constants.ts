export const GIFT_CARD_CONSTANTS = {
    PRICING: {
        PUBLIC_NORMAL: 1500,
        PUBLIC_VISIT: 1500,
        PUBLIC_GIFT_CARDS: 2000,
        PRIVATE: 3000
    },
    
    VALIDATION_ERRORS: {
        MISSING_LOGO: 'MISSING_LOGO',
        MISSING_USER_DETAILS: 'MISSING_USER_DETAILS'
    },
    
    PAYMENT_STATUS: {
        FULLY_PAID: 'Fully paid',
        PENDING_VALIDATION: 'Pending validation',
        PENDING_PAYMENT: 'Pending payment',
        PARTIALLY_PAID: 'Partially paid'
    },
    
    REQUEST_TYPES: {
        NORMAL_ASSIGNMENT: 'Normal Assignment',
        VISIT: 'Visit',
        GIFT_CARDS: 'Gift Cards'
    },
    
    CATEGORIES: {
        PUBLIC: 'Public',
        PRIVATE: 'Private'
    },
    
    VISIT_TYPES: {
        CORPORATE: 'corporate',
        FAMILY: 'family'
    },
    
    DEFAULT_SITE_ID: 1197,
    
    EMAIL_TEMPLATES: {
        FUND_REQUEST: 'fund_request',
        GIFT_NOTIFICATION: 'gift_notification',
        CUSTOM_EMAIL: 'custom_email'
    },
    
    SPREADSHEET_TAGS: {
        WEBSITE: 'WebSite'
    }
} as const;

export const DEFAULT_GIFT_MESSAGES = {
    PRIMARY: "Congratulations! A tree has been planted in your name.",
    SECONDARY: "Thank you for contributing to a greener future."
} as const;