#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// ANSI color codes for better visualization
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

function printComponentHierarchy() {
  console.log(colorize('═'.repeat(80), 'cyan'));
  console.log(colorize('         COMPONENT HIERARCHY ANALYSIS', 'bright'));
  console.log(colorize('═'.repeat(80), 'cyan'));
  console.log();

  // Donate Page Component Hierarchy
  console.log(colorize('🌱 DONATE PAGE COMPONENT HIERARCHY', 'green'));
  console.log(colorize('═'.repeat(60), 'green'));
  console.log();
  
  const donateHierarchy = `${colorize('Donation', 'bright')} ${colorize('(main component)', 'dim')}
├── ${colorize('InternalTestBanner', 'yellow')}
├── ${colorize('MotionDiv', 'yellow')}
│   └── ${colorize('ImpactInformationSection', 'yellow')}
├── ${colorize('ScrollReveal', 'yellow')}
│   └── ${colorize('[Conditional Step Rendering]', 'magenta')}
│       ├── ${colorize('Step 1', 'cyan')} ${colorize('(currentStep === 1)', 'dim')}
│       │   ├── ${colorize('DonationMethodSection', 'yellow')}
│       │   ├── ${colorize('SponsorDetailsSection', 'yellow')}
│       │   └── ${colorize('DedicatedNamesSection', 'yellow')}
│       └── ${colorize('Step 2', 'cyan')} ${colorize('(currentStep === 2)', 'dim')}
│           └── ${colorize('SummaryPaymentPage', 'yellow')}
├── ${colorize('ReferralInviteSection', 'yellow')}
├── ${colorize('SuccessDialog', 'yellow')} ${colorize('(conditional: showSuccessDialog)', 'dim')}
├── ${colorize('ReferralDialog', 'yellow')} ${colorize('(conditional: showReferralDialog)', 'dim')}
└── ${colorize('ValidationAlert', 'yellow')} ${colorize('(conditional: stepValidation.showValidationAlert)', 'dim')}`;

  console.log(donateHierarchy);
  console.log();
  console.log();

  // Plant Memory Page Component Hierarchy
  console.log(colorize('🎁 PLANT-MEMORY PAGE COMPONENT HIERARCHY', 'green'));
  console.log(colorize('═'.repeat(60), 'green'));
  console.log();

  const plantMemoryHierarchy = `${colorize('GiftTrees', 'bright')} ${colorize('(main component)', 'dim')}
├── ${colorize('InternalTestBanner', 'yellow')}
├── ${colorize('MotionDiv', 'yellow')} ${colorize('(Header Section)', 'dim')}
├── ${colorize('ScrollReveal', 'yellow')}
│   └── ${colorize('[Conditional Step Rendering]', 'magenta')}
│       ├── ${colorize('Step 1', 'cyan')} ${colorize('(currentStep === 1)', 'dim')}
│       │   ├── ${colorize('SmartFormAssistant', 'yellow')}
│       │   ├── ${colorize('TreeCountSection', 'yellow')}
│       │   ├── ${colorize('RecipientDetailsSection', 'yellow')}
│       │   ├── ${colorize('EventDetailsSection', 'yellow')}
│       │   ├── ${colorize('GiftCardPreview', 'yellow')}
│       │   └── ${colorize('SponsorDetailsSection', 'yellow')}
│       └── ${colorize('Step 2', 'cyan')} ${colorize('(currentStep === 2)', 'dim')}
│           └── ${colorize('SummaryPaymentPage', 'yellow')}
├── ${colorize('MotionDiv', 'yellow')} ${colorize('(Impact Information Section)', 'dim')}
├── ${colorize('SuccessDialog', 'yellow')} ${colorize('(conditional: paymentHandling.showSuccessDialog)', 'dim')}
├── ${colorize('ReferralDialog', 'yellow')} ${colorize('(conditional: showReferralDialog)', 'dim')}
├── ${colorize('AutoPopulatePanel', 'yellow')} ${colorize('(conditional: autoCompleteHook.showAutoPopulatePanel)', 'dim')}
├── ${colorize('SettingsPanel', 'yellow')} ${colorize('(conditional: autoCompleteHook.showSettingsPanel)', 'dim')}
├── ${colorize('SaveFormDialog', 'yellow')} ${colorize('(conditional: autoCompleteHook.showSaveFormDialog)', 'dim')}
└── ${colorize('ValidationAlert', 'yellow')} ${colorize('(conditional: showValidationAlert)', 'dim')}`;

  console.log(plantMemoryHierarchy);
  console.log();
  console.log();

  // Side by Side Comparison
  console.log(colorize('🔄 SIDE-BY-SIDE STRUCTURE COMPARISON', 'cyan'));
  console.log(colorize('═'.repeat(80), 'cyan'));
  console.log();

  const sideByComparison = `
${colorize('DONATE PAGE', 'red')}                           ${colorize('PLANT-MEMORY PAGE', 'blue')}
${colorize('─'.repeat(35), 'red')}     ${colorize('─'.repeat(35), 'blue')}
Donation (main)                        GiftTrees (main)
├── InternalTestBanner                 ├── InternalTestBanner
├── MotionDiv (header)                 ├── MotionDiv (header)
│   └── ImpactInformationSection       ├── ScrollReveal
├── ScrollReveal                       │   └── [Step Rendering]
│   └── [Step Rendering]               │       ├── Step 1
│       ├── Step 1                     │       │   ├── SmartFormAssistant
│       │   ├── DonationMethodSection    │       │   ├── TreeCountSection
│       │   ├── SponsorDetailsSection     │       │   ├── RecipientDetailsSection
│       │   └── DedicatedNamesSection  │       │   ├── EventDetailsSection
│       └── Step 2                     │       │   ├── GiftCardPreview
│           └── SummaryPaymentPage     │       │   └── SponsorDetailsSection
├── ReferralInviteSection              │       └── Step 2
├── SuccessDialog                      │           └── SummaryPaymentPage
├── ReferralDialog                     ├── MotionDiv (impact section)
└── ValidationAlert                    ├── SuccessDialog
                                       ├── ReferralDialog
${colorize('Total Components: 9', 'red')}                      ├── AutoPopulatePanel
                                       ├── SettingsPanel
                                       ├── SaveFormDialog
                                       └── ValidationAlert

                                       ${colorize('Total Components: 13', 'blue')}`;

  console.log(sideByComparison);
  console.log();

  // Component Categories
  console.log(colorize('📊 COMPONENT CATEGORIZATION', 'cyan'));
  console.log(colorize('═'.repeat(60), 'cyan'));
  console.log();

  const categorization = `
${colorize('🔧 INFRASTRUCTURE COMPONENTS', 'magenta')} ${colorize('(Both Pages)', 'dim')}
├── InternalTestBanner
├── MotionDiv
├── ScrollReveal
├── ValidationAlert
└── SummaryPaymentPage

${colorize('📋 FORM SECTION COMPONENTS', 'green')}
├── ${colorize('SHARED:', 'cyan')} SponsorDetailsSection
├── ${colorize('DONATE ONLY:', 'red')} DonationMethodSection, DedicatedNamesSection
└── ${colorize('PLANT-MEMORY ONLY:', 'blue')} TreeCountSection, RecipientDetailsSection, EventDetailsSection

${colorize('🎯 DIALOG COMPONENTS', 'yellow')}
├── ${colorize('SHARED:', 'cyan')} SuccessDialog, ReferralDialog
└── ${colorize('PLANT-MEMORY ONLY:', 'blue')} AutoPopulatePanel, SettingsPanel, SaveFormDialog

${colorize('📊 INFORMATION COMPONENTS', 'white')}
├── ${colorize('DONATE ONLY:', 'red')} ImpactInformationSection, ReferralInviteSection
└── ${colorize('PLANT-MEMORY ONLY:', 'blue')} GiftCardPreview, SmartFormAssistant

${colorize('📈 COMPLEXITY METRICS', 'magenta')}
├── ${colorize('DONATE:', 'red')} ${colorize('9 components', 'dim')} (4 form sections + 5 infrastructure/dialogs)
└── ${colorize('PLANT-MEMORY:', 'blue')} ${colorize('13 components', 'dim')} (6 form sections + 7 infrastructure/dialogs)`;

  console.log(categorization);
  console.log();
  console.log(colorize('═'.repeat(80), 'cyan'));
  console.log(colorize('Component hierarchy analysis complete!', 'bright'));
  console.log(colorize('═'.repeat(80), 'cyan'));
}

// Generate a clean text version for copying
function generateCleanOutput() {
  console.log('\n\n' + '='.repeat(60));
  console.log('CLEAN TEXT VERSION (for copying):');
  console.log('='.repeat(60));
  
  console.log('\nDONATE PAGE:');
  console.log('Donation (main component)');
  console.log('├── InternalTestBanner');
  console.log('├── MotionDiv');
  console.log('│   └── ImpactInformationSection');
  console.log('├── ScrollReveal');
  console.log('│   └── [Conditional Step Rendering]');
  console.log('│       ├── Step 1 (currentStep === 1)');
  console.log('│       │   ├── DonationMethodSection');
  console.log('│       │   ├── SponsorDetailsSection');
  console.log('│       │   └── DedicatedNamesSection');
  console.log('│       └── Step 2 (currentStep === 2)');
  console.log('│           └── SummaryPaymentPage');
  console.log('├── ReferralInviteSection');
  console.log('├── SuccessDialog (conditional: showSuccessDialog)');
  console.log('├── ReferralDialog (conditional: showReferralDialog)');
  console.log('└── ValidationAlert (conditional: stepValidation.showValidationAlert)');

  console.log('\nPLANT-MEMORY PAGE:');
  console.log('GiftTrees (main component)');
  console.log('├── InternalTestBanner');
  console.log('├── MotionDiv (Header Section)');
  console.log('├── ScrollReveal');
  console.log('│   └── [Conditional Step Rendering]');
  console.log('│       ├── Step 1 (currentStep === 1)');
  console.log('│       │   ├── SmartFormAssistant');
  console.log('│       │   ├── TreeCountSection');
  console.log('│       │   ├── RecipientDetailsSection');
  console.log('│       │   ├── EventDetailsSection');
  console.log('│       │   ├── GiftCardPreview');
  console.log('│       │   └── SponsorDetailsSection');
  console.log('│       └── Step 2 (currentStep === 2)');
  console.log('│           └── SummaryPaymentPage');
  console.log('├── MotionDiv (Impact Information Section)');
  console.log('├── SuccessDialog (conditional: paymentHandling.showSuccessDialog)');
  console.log('├── ReferralDialog (conditional: showReferralDialog)');
  console.log('├── AutoPopulatePanel (conditional: autoCompleteHook.showAutoPopulatePanel)');
  console.log('├── SettingsPanel (conditional: autoCompleteHook.showSettingsPanel)');
  console.log('├── SaveFormDialog (conditional: autoCompleteHook.showSaveFormDialog)');
  console.log('└── ValidationAlert (conditional: showValidationAlert)');
}

// Run the analysis
printComponentHierarchy();
generateCleanOutput();