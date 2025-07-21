# Gift Card Module Refactoring Plan

## Overview
This document outlines the plan to refactor the large `giftCardController.ts` (2775 lines) and `giftCardsService.ts` (1319 lines) files into smaller, more maintainable modules organized by functionality.

## Current State Analysis

### giftCardController.ts (2775 lines)
Contains 37 exported functions handling:
- Gift request management (CRUD operations)
- Tree booking and assignment
- Gift card generation and templates
- Payment processing
- Email notifications
- PDF generation
- Redemption processes
- User management

### giftCardsService.ts (1319 lines)
Contains 17 public static methods handling:
- User management and relations
- Tree card generation
- Email notifications (multiple types)
- PDF generation
- Spreadsheet integration
- Auto-booking processes
- Transaction management

## Proposed Refactoring Structure

### 1. Controllers Directory Structure
```
src/controllers/giftCard/
├── index.ts                           # Main controller exports
├── giftRequestController.ts           # Gift request CRUD operations
├── giftRequestUsersController.ts      # User management for gift requests
├── giftCardTreesController.ts         # Tree booking and assignment
├── giftCardTemplatesController.ts     # Template generation and management
├── giftCardRedemptionController.ts    # Redemption processes
├── giftCardPaymentController.ts       # Payment-related operations
├── giftCardEmailController.ts         # Email sending operations
└── giftCardReportingController.ts     # PDF generation and reporting
```

### 2. Services Directory Structure
```
src/facade/giftCard/
├── index.ts                           # Main service exports
├── giftRequestService.ts              # Core gift request operations
├── giftRequestUsersService.ts         # User and relation management
├── giftCardTreesService.ts            # Tree assignment logic
├── giftCardTemplatesService.ts        # Template generation and management
├── giftCardRedemptionService.ts       # Redemption and transaction logic
├── giftCardPaymentService.ts          # Payment processing
├── giftCardEmailService.ts            # Email notifications
└── giftCardReportingService.ts        # PDF generation and reporting
```

### 3. Shared Utilities
```
src/controllers/helper/giftCard/
├── validation.ts                      # Input validation helpers
├── constants.ts                       # Gift card constants and enums
├── types.ts                          # Shared type definitions
└── utils.ts                          # Common utility functions
```

## Detailed Breakdown

### 1. giftRequestController.ts
**Functions to include:**
- `getGiftRequestTags`
- `getGiftCardRequests`
- `createGiftCardRequest`
- `cloneGiftCardRequest`
- `updateGiftCardRequest`
- `patchGiftCardRequest`
- `deleteGiftCardRequest`
- `processGiftCard`
- `createGiftCardRequestV2`

**Responsibilities:**
- Basic CRUD operations for gift requests
- Request validation and processing
- Status management

### 2. giftRequestUsersController.ts
**Functions to include:**
- `getGiftRequestUsers`
- `upsertGiftRequestUsers`
- `updateGiftCardUserDetails`

**Responsibilities:**
- User management within gift requests
- User relationship handling
- User data validation

### 3. giftCardTreesController.ts
**Functions to include:**
- `createGiftCardPlots`
- `bookTreesForGiftRequest`
- `bookGiftCardTrees`
- `getBookedTrees`
- `unBookTrees`
- `assignGiftRequestTrees`
- `getTreesCountForAutoReserveTrees`
- `autoProcessGiftCardRequest`

**Responsibilities:**
- Tree booking and reservation
- Plot management
- Auto-assignment logic

### 4. giftCardTemplatesController.ts
**Functions to include:**
- `createGiftCards`
- `generateGiftCardTemplatesForGiftCardRequest`
- `updateGiftCardImagesForGiftRequest`
- `downloadGiftCardTemplatesForGiftCardRequest`
- `generateGiftCardSlide`
- `updateGiftCardTemplate`
- `generateAdhocTreeCards`

**Responsibilities:**
- Template generation and management
- Image processing
- Card creation

### 5. giftCardRedemptionController.ts
**Functions to include:**
- `redeemGiftCard`
- `redeemMultipleGiftCard`
- `bulkRedeemGiftCard`

**Responsibilities:**
- Gift card redemption processes
- Bulk operations
- Transaction handling

### 6. giftCardPaymentController.ts
**Functions to include:**
- `paymentSuccessForGiftRequest`

**Responsibilities:**
- Payment processing
- Payment validation
- Status updates

### 7. giftCardEmailController.ts
**Functions to include:**
- `sendEmailForGiftCardRequest`
- `sendCustomEmail`

**Responsibilities:**
- Email sending operations
- Template management
- Notification handling

### 8. giftCardReportingController.ts
**Functions to include:**
- `generateFundRequest`
- `sendFundRequest`
- `updateGiftCardRequestAlbum`

**Responsibilities:**
- PDF generation
- Report creation
- Document management

## Service Layer Refactoring

### 1. giftRequestService.ts
**Methods to include:**
- `getGiftCardsRequest`
- `addGiftRequestToSpreadsheet`

**Responsibilities:**
- Core gift request operations
- Data retrieval and basic processing

### 2. giftRequestUsersService.ts
**Methods to include:**
- `upsertGiftRequestUsers`
- `upsertGiftRequestUsersAndRelations` (private)
- `deleteGiftRequestUsersAndResetTrees` (private)
- `addRecipientsToGifteeGroup` (private)

**Responsibilities:**
- User creation and updates
- Relationship management
- Group management

### 3. giftCardTreesService.ts
**Methods to include:**
- `assignTreeForVisitRequest` (private)
- `handleVisitRequestTreeAssignments` (private)
- `updateTreeAssignmentsForUser` (private)
- `autoBookTreesForGiftRequest`
- `getPlotTreesCntForAutoReserveTreesForGiftRequest`

**Responsibilities:**
- Tree assignment logic
- Visit request handling
- Auto-booking processes

### 4. giftCardTemplatesService.ts
**Methods to include:**
- `generateTreeCardsForSaplings`

**Responsibilities:**
- Template generation
- Card creation
- Image processing

### 5. giftCardEmailService.ts
**Methods to include:**
- `getMailSentStatus`
- `sendGiftingNotificationToBackOffice`
- `sendGiftingNotificationToAccounts`
- `sendGiftingNotificationForVolunteers`
- `sendGiftingNotificationForCSR`
- `sendReferralGiftNotification`
- `sendCustomEmailToSponsor`

**Responsibilities:**
- Email notifications
- Status tracking
- Template management

### 6. giftCardReportingService.ts
**Methods to include:**
- `generateFundRequestPdf`
- `sendFundRequestEmail`

**Responsibilities:**
- PDF generation
- Document creation
- File management

### 7. giftCardRedemptionService.ts
**Methods to include:**
- `redeemGiftCards`
- `fullFillGiftCardRequestWithTransactions`
- `reconcileGiftTransactions`

**Responsibilities:**
- Transaction processing
- Redemption logic
- Financial reconciliation

### 8. giftCardPaymentService.ts
**Methods to include:**
- Payment processing logic (extracted from controllers)

**Responsibilities:**
- Payment validation
- Payment status management
- Integration with payment gateways

## Migration Strategy

### Phase 1: Create New Structure
1. Create new directory structure
2. Create index files with proper exports
3. Set up shared utilities and types

### Phase 2: Extract Services
1. Start with service layer refactoring
2. Move methods to appropriate service files
3. Update imports and dependencies
4. Test each service module

### Phase 3: Extract Controllers
1. Move controller functions to appropriate files
2. Update route imports
3. Ensure proper error handling
4. Test each controller module

### Phase 4: Update Dependencies
1. Update all import statements
2. Update route files
3. Update any other dependent files
4. Run comprehensive tests

### Phase 5: Cleanup
1. Remove original large files
2. Update documentation
3. Final testing and validation

## Benefits of This Refactoring

1. **Improved Maintainability**: Smaller, focused files are easier to understand and modify
2. **Better Organization**: Related functionality is grouped together
3. **Enhanced Testability**: Smaller modules are easier to unit test
4. **Reduced Merge Conflicts**: Multiple developers can work on different aspects simultaneously
5. **Better Code Reusability**: Shared utilities can be reused across modules
6. **Clearer Separation of Concerns**: Each module has a single, well-defined responsibility

## Risks and Considerations

1. **Import Dependencies**: Careful management of circular dependencies
2. **Shared State**: Ensure proper handling of shared data and state
3. **Testing**: Comprehensive testing required to ensure no functionality is broken
4. **Performance**: Monitor for any performance impacts from increased module loading
5. **Team Coordination**: Ensure all team members are aware of the new structure

## Timeline Estimate

- **Phase 1**: 1-2 days
- **Phase 2**: 3-4 days
- **Phase 3**: 3-4 days
- **Phase 4**: 2-3 days
- **Phase 5**: 1-2 days

**Total Estimated Time**: 10-15 days

## Success Criteria

1. All existing functionality preserved
2. All tests passing
3. No performance degradation
4. Improved code organization and readability
5. Reduced file sizes (target: no file over 500 lines)
6. Clear separation of concerns
7. Proper error handling maintained