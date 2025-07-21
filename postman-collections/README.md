# 14Trees Gift Cards API - Postman Collections

This directory contains comprehensive Postman collections for testing the 14Trees Gift Card API endpoints.

## 📁 Collection Files

### Individual Controller Collections
1. **01-gift-request-controller.json** - Core gift request management (CRUD operations)
2. **02-gift-request-users-controller.json** - User management for gift requests
3. **03-gift-card-trees-controller.json** - Tree booking and assignment operations
4. **04-gift-card-templates-controller.json** - Template generation and downloads
5. **05-gift-card-redemption-controller.json** - Gift card redemption operations
6. **06-gift-card-payment-controller.json** - Payment processing workflows
7. **07-gift-card-email-controller.json** - Email notification services
8. **08-gift-card-reporting-controller.json** - Reporting and analytics

### Master Collection
- **00-gift-cards-master-collection.json** - All endpoints organized by functionality

## 🚀 Quick Start

### 1. Import Collections
- Import the master collection (`00-gift-cards-master-collection.json`) into Postman
- Or import individual collections as needed

### 2. Set Environment Variables
Create a Postman environment with these variables:
```json
{
  "base_url": "http://localhost:3000",
  "auth_token": "your_auth_token_here"
}
```

### 3. Update Base URL
Modify the `base_url` variable based on your environment:
- **Local Development**: `http://localhost:3000`
- **Staging**: `https://staging-api.14trees.org`
- **Production**: `https://api.14trees.org`

## 🔧 Current API Structure

### ⚠️ Important Note on Route Configuration
The current routes in `/src/routes/giftCardRoutes.ts` still point to the monolithic controller:
```typescript
import * as giftCards from '../controllers/giftCardController';
```

However, the codebase has been refactored into 8 modular controllers:
- `/src/controllers/giftCard/giftRequestController.ts`
- `/src/controllers/giftCard/giftRequestUsersController.ts`
- `/src/controllers/giftCard/giftCardTreesController.ts`
- `/src/controllers/giftCard/giftCardTemplatesController.ts`
- `/src/controllers/giftCard/giftCardRedemptionController.ts`
- `/src/controllers/giftCard/giftCardPaymentController.ts`
- `/src/controllers/giftCard/giftCardEmailController.ts`
- `/src/controllers/giftCard/giftCardReportingController.ts`

### 🔄 Recommended Route Migration
To use the new modular controllers, update the routes file:

```typescript
// Replace the current import
import * as giftCards from '../controllers/giftCardController';

// With modular imports
import * as giftRequest from '../controllers/giftCard/giftRequestController';
import * as giftRequestUsers from '../controllers/giftCard/giftRequestUsersController';
import * as giftCardTrees from '../controllers/giftCard/giftCardTreesController';
import * as giftCardTemplates from '../controllers/giftCard/giftCardTemplatesController';
import * as giftCardRedemption from '../controllers/giftCard/giftCardRedemptionController';
import * as giftCardPayment from '../controllers/giftCard/giftCardPaymentController';
import * as giftCardEmail from '../controllers/giftCard/giftCardEmailController';
import * as giftCardReporting from '../controllers/giftCard/giftCardReportingController';

// Then update individual route handlers accordingly
```

## 📋 API Endpoint Categories

### 🎁 Gift Request Management
- **GET** `/gift-cards/requests/tags` - Get gift request tags
- **POST** `/gift-cards/requests/get` - Get gift card requests with filters
- **POST** `/gift-cards/requests` - Create new gift card request
- **PUT** `/gift-cards/requests/:id` - Update gift card request
- **POST** `/gift-cards/:id/process` - Process gift card request
- **DELETE** `/gift-cards/requests/:id` - Delete gift card request
- **POST** `/gift-cards/requests/clone` - Clone gift card request

### 👥 User Management
- **GET** `/gift-cards/users/:gift_card_request_id` - Get gift request users
- **POST** `/gift-cards/users` - Upsert gift request users
- **POST** `/gift-cards/update-users` - Update gift card user details

### 🌳 Tree Management
- **POST** `/gift-cards/plots` - Create gift card plots
- **POST** `/gift-cards/book` - Book trees for gift request
- **GET** `/gift-cards/trees/:gift_card_request_id` - Get booked trees
- **POST** `/gift-cards/unbook` - Unbook trees
- **POST** `/gift-cards/assign` - Assign gift request trees

### 🎨 Template Management
- **POST** `/gift-cards/` - Create gift cards
- **GET** `/gift-cards/generate/:gift_card_request_id` - Generate gift card templates
- **GET** `/gift-cards/update-card-images/:gift_card_request_id` - Update gift card images
- **GET** `/gift-cards/download/:gift_card_request_id` - Download templates (PDF/ZIP/PPT)
- **POST** `/gift-cards/generate-template` - Generate gift card slide
- **POST** `/gift-cards/update-template` - Update gift card template

### 🎯 Redemption
- **POST** `/gift-cards/card/redeem` - Redeem single gift card
- **POST** `/gift-cards/card/redeem-multi` - Redeem multiple gift cards
- **POST** `/gift-cards/card/bulk-redeem` - Bulk redeem gift cards

### 💳 Payment Processing
- **POST** `/gift-cards/requests/payment-success` - Handle payment success

### 📧 Email Notifications
- **POST** `/gift-cards/email` - Send emails for gift card request
- **POST** `/gift-cards/custom-mails` - Send custom emails

### 📊 Reporting & Analytics
- **POST** `/gift-cards/update-album` - Update gift card request album
- **GET** `/gift-cards/requests/fund-request/:gift_card_request_id` - Generate fund request
- **POST** `/gift-cards/requests/send-fund-request/:gift_card_request_id` - Send fund request email

## 🧪 Testing Workflow

### Basic Testing Flow
1. **Create Gift Request** → POST `/gift-cards/requests`
2. **Add Users** → POST `/gift-cards/users`
3. **Book Trees** → POST `/gift-cards/book`
4. **Process Payment** → POST `/gift-cards/requests/payment-success`
5. **Generate Templates** → GET `/gift-cards/generate/:id`
6. **Send Emails** → POST `/gift-cards/email`
7. **Redeem Cards** → POST `/gift-cards/card/redeem`

### Authentication
Some endpoints may require authentication. Set the `auth_token` variable in your Postman environment.

## 📝 Notes

- All POST/PUT requests with file uploads use `multipart/form-data`
- Date fields should be in ISO 8601 format (`YYYY-MM-DDTHH:mm:ssZ`)
- Pagination parameters: `offset` (default: 0), `limit` (default: 10)
- Response formats are consistent with status codes and error messages

## 🐛 Troubleshooting

### Common Issues
1. **404 Errors**: Verify the base URL is correct
2. **Authentication Errors**: Check if auth token is required and properly set
3. **File Upload Issues**: Ensure correct `Content-Type` header for multipart requests
4. **Missing Required Fields**: Check request body schema in collection descriptions

### Environment-Specific Settings
- **Local**: May not require authentication
- **Staging/Production**: Usually requires valid authentication tokens

---

**Note**: These collections are based on the current API structure. If routes are updated to use the new modular controllers, the endpoints will remain the same, but internal processing will be handled by the refactored controller modules.