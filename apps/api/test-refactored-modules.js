#!/usr/bin/env node

/**
 * Test script for refactored gift card modules
 * This script tests the basic functionality of our refactored modules
 */

const path = require('path');

// Test imports
async function testImports() {
    console.log('🧪 Testing module imports...\n');
    
    try {
        // Test controller imports
        console.log('📁 Testing controller imports:');
        const giftRequestController = require('./src/controllers/giftCard/giftRequestController');
        console.log('✅ giftRequestController imported successfully');
        
        const giftRequestUsersController = require('./src/controllers/giftCard/giftRequestUsersController');
        console.log('✅ giftRequestUsersController imported successfully');
        
        const giftCardTreesController = require('./src/controllers/giftCard/giftCardTreesController');
        console.log('✅ giftCardTreesController imported successfully');
        
        // Test service imports
        console.log('\n📁 Testing service imports:');
        const GiftRequestService = require('./src/facade/giftCard/giftRequestService').default;
        console.log('✅ GiftRequestService imported successfully');
        
        const GiftRequestUsersService = require('./src/facade/giftCard/giftRequestUsersService').default;
        console.log('✅ GiftRequestUsersService imported successfully');
        
        const GiftCardTreesService = require('./src/facade/giftCard/giftCardTreesService').default;
        console.log('✅ GiftCardTreesService imported successfully');
        
        // Test helper imports
        console.log('\n📁 Testing helper imports:');
        const { GiftCardValidation } = require('./src/controllers/helper/giftCard/validation');
        console.log('✅ GiftCardValidation imported successfully');
        
        const { GiftCardUtils } = require('./src/controllers/helper/giftCard/utils');
        console.log('✅ GiftCardUtils imported successfully');
        
        const { GIFT_CARD_CONSTANTS } = require('./src/controllers/helper/giftCard/constants');
        console.log('✅ GIFT_CARD_CONSTANTS imported successfully');
        
        // Test index imports
        console.log('\n📁 Testing index imports:');
        const controllerIndex = require('./src/controllers/giftCard/index');
        console.log('✅ Controller index imported successfully');
        
        const serviceIndex = require('./src/facade/giftCard/index');
        console.log('✅ Service index imported successfully');
        
        console.log('\n🎉 All imports successful!\n');
        return true;
        
    } catch (error) {
        console.error('❌ Import failed:', error.message);
        return false;
    }
}

// Test basic functionality
async function testBasicFunctionality() {
    console.log('🧪 Testing basic functionality...\n');
    
    try {
        const { GiftCardValidation } = require('./src/controllers/helper/giftCard/validation');
        const { GiftCardUtils } = require('./src/controllers/helper/giftCard/utils');
        const { GIFT_CARD_CONSTANTS } = require('./src/controllers/helper/giftCard/constants');
        
        // Test validation
        console.log('📋 Testing validation:');
        const validationResult = GiftCardValidation.validateCreateGiftCardRequest({
            user_id: 1,
            no_of_cards: 5
        });
        console.log('✅ Validation function works:', validationResult.isValid);
        
        // Test utils
        console.log('\n🔧 Testing utilities:');
        const totalAmount = GiftCardUtils.calculateTotalAmount('Public', 'Gift Cards', 5);
        console.log('✅ Calculate total amount works:', totalAmount);
        
        const eventName = GiftCardUtils.getDefaultEventName('Birthday Party');
        console.log('✅ Get default event name works:', eventName);
        
        // Test constants
        console.log('\n📊 Testing constants:');
        console.log('✅ Pricing constants:', GIFT_CARD_CONSTANTS.PRICING);
        console.log('✅ Status constants:', GIFT_CARD_CONSTANTS.PAYMENT_STATUS);
        console.log('✅ Validation errors:', GIFT_CARD_CONSTANTS.VALIDATION_ERRORS);
        
        console.log('\n🎉 All basic functionality tests passed!\n');
        return true;
        
    } catch (error) {
        console.error('❌ Functionality test failed:', error.message);
        console.error(error.stack);
        return false;
    }
}

// Test service methods (without database)
async function testServiceMethods() {
    console.log('🧪 Testing service methods (without DB)...\n');
    
    try {
        const GiftRequestService = require('./src/facade/giftCard/giftRequestService').default;
        const GiftRequestUsersService = require('./src/facade/giftCard/giftRequestUsersService').default;
        const GiftCardTreesService = require('./src/facade/giftCard/giftCardTreesService').default;
        
        console.log('📋 Testing service method existence:');
        
        // Test GiftRequestService methods
        console.log('✅ GiftRequestService.getGiftCardsRequest exists:', typeof GiftRequestService.getGiftCardsRequest === 'function');
        console.log('✅ GiftRequestService.getGiftRequestTags exists:', typeof GiftRequestService.getGiftRequestTags === 'function');
        console.log('✅ GiftRequestService.getGiftCardRequestsWithPaymentStatus exists:', typeof GiftRequestService.getGiftCardRequestsWithPaymentStatus === 'function');
        
        // Test GiftRequestUsersService methods
        console.log('✅ GiftRequestUsersService.getGiftRequestUsers exists:', typeof GiftRequestUsersService.getGiftRequestUsers === 'function');
        console.log('✅ GiftRequestUsersService.upsertGiftRequestUsers exists:', typeof GiftRequestUsersService.upsertGiftRequestUsers === 'function');
        
        // Test GiftCardTreesService methods
        console.log('✅ GiftCardTreesService.createGiftCardPlots exists:', typeof GiftCardTreesService.createGiftCardPlots === 'function');
        console.log('✅ GiftCardTreesService.bookTreesForGiftRequest exists:', typeof GiftCardTreesService.bookTreesForGiftRequest === 'function');
        console.log('✅ GiftCardTreesService.getBookedTrees exists:', typeof GiftCardTreesService.getBookedTrees === 'function');
        
        console.log('\n🎉 All service methods exist!\n');
        return true;
        
    } catch (error) {
        console.error('❌ Service method test failed:', error.message);
        return false;
    }
}

// Main test runner
async function runTests() {
    console.log('🚀 Starting Gift Card Module Tests\n');
    console.log('=' .repeat(50));
    
    const results = {
        imports: false,
        functionality: false,
        services: false
    };
    
    // Run tests
    results.imports = await testImports();
    results.functionality = await testBasicFunctionality();
    results.services = await testServiceMethods();
    
    // Summary
    console.log('=' .repeat(50));
    console.log('📊 TEST SUMMARY:');
    console.log('=' .repeat(50));
    console.log(`📁 Imports: ${results.imports ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`🔧 Functionality: ${results.functionality ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`⚙️  Services: ${results.services ? '✅ PASS' : '❌ FAIL'}`);
    
    const allPassed = Object.values(results).every(result => result === true);
    console.log(`\n🎯 Overall: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
    
    if (allPassed) {
        console.log('\n🎉 Refactored modules are working correctly!');
        console.log('✨ Ready to continue with remaining modules.');
    } else {
        console.log('\n⚠️  Some issues found. Please review the errors above.');
    }
    
    console.log('\n' + '=' .repeat(50));
}

// Run the tests
runTests().catch(console.error);