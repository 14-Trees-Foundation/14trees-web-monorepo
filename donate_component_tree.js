#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// ANSI colors for better visualization
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

const rootPath = '/Users/admin/Projects/14trees-web-monorepo';

// Complete UI component tree structure for the donate page (Internal Components Only)
const uiComponentTree = {
  name: '📄 Donation Page (Main Component)',
  path: 'apps/front-page/app/donate/page.tsx',
  description: 'Main donation page with multi-step form and payment processing',
  children: [
    {
      name: '🔧 Internal Test Banner',
      path: 'apps/front-page/app/donate/components/Common/InternalTestBanner.tsx',
      description: 'Shows test environment banner for internal users'
    },
    {
      name: '🎬 Motion Container',
      path: 'apps/front-page/components/animation/MotionDiv.tsx',
      description: 'Animated container with fade-in effects',
      children: [
        {
          name: '📊 Impact Information Section',
          path: 'apps/front-page/app/donate/components/Common/ImpactInformationSection.tsx',
          description: 'Shows donation impact and referral details'
        }
      ]
    },
    {
      name: '🌳 Donation Method Section',
      path: 'apps/front-page/app/donate/components/FormSections/DonationMethodSection.tsx',
      description: 'Location selector and donation method',
      children: [
        {
          name: '💰 Donation Type Section',
          path: 'apps/front-page/app/donate/components/FormSections/DonationTypeSection.tsx',
          description: 'Tree count and amount selection'
        }
      ]
    },
    {
      name: '👤 Sponsor Details Section',
      path: 'apps/front-page/app/donate/components/FormSections/SponsorDetailsSection.tsx',
      description: 'Personal information form',
      children: [
        {
          name: '📝 Sponsor Details Form',
          path: 'apps/front-page/components/donate/UserDetailsForm.tsx',
          description: 'Individual form fields (name, email, phone, PAN)'
        }
      ]
    },
    {
      name: '🏷️ Dedicated Names Section',
      path: 'apps/front-page/app/donate/components/FormSections/DedicatedNamesSection.tsx',
      description: 'Tree dedication and naming functionality',
      children: [
        {
          name: '📤 CSV Upload Section',
          path: 'apps/front-page/app/donate/components/CSVUpload/CSVUploadSection.tsx',
          description: 'Bulk name upload via CSV with validation',
          children: [
            {
              name: '📁 CSV Upload Component',
              path: 'apps/front-page/components/CsvUpload.tsx',
              description: 'File upload interface with drag & drop'
            }
          ]
        }
      ]
    },
    {
      name: '⚠️ Validation Alert',
      path: 'apps/front-page/app/donate/components/Common/ValidationAlert.tsx',
      description: 'Form validation error display'
    },
    {
      name: '💳 Payment Section',
      path: 'apps/front-page/app/donate/components/FormSections/PaymentSection.tsx',
      description: 'Payment method selection and processing',
      children: [
        {
          name: '📄 Donation Summary',
          path: 'apps/front-page/app/donate/donationSummary.tsx',
          description: 'Order summary and payment confirmation'
        }
      ]
    },
    {
      name: '🎉 Success Dialog',
      path: 'apps/front-page/app/donate/components/Dialogs/SuccessDialog.tsx',
      description: 'Payment success confirmation modal'
    },
    {
      name: '👥 Referral Dialog',
      path: 'apps/front-page/components/referral/ReferralDialog.tsx',
      description: 'Referral invitation modal with social sharing'
    },
    {
      name: '📲 Referral Invite Section',
      path: 'apps/front-page/app/donate/components/Common/ReferralInviteSection.tsx',
      description: 'Referral sharing interface'
    }
  ]
};

// Custom hooks and utilities
const hooksAndUtils = {
  name: '⚙️ Custom Hooks & Business Logic',
  description: 'Modular hooks handling different aspects of the donation flow',
  children: [
    {
      name: '✅ Form Validation Hook',
      path: 'apps/front-page/app/donate/hooks/useFormValidation.ts',
      description: 'Comprehensive form validation with real-time error checking'
    },
    {
      name: '💰 Payment Handling Hook',
      path: 'apps/front-page/app/donate/hooks/usePaymentHandling.ts',
      description: 'Payment processing coordination and state management'
    },
    {
      name: '📊 CSV Processing Hook',
      path: 'apps/front-page/app/donate/hooks/useCSVProcessing.ts',
      description: 'CSV file parsing, validation, and preview generation'
    },
    {
      name: '🎯 Donation Logic Hook',
      path: 'apps/front-page/app/donate/hooks/useDonationLogic.ts',
      description: 'Core donation business logic and calculations'
    },
    {
      name: '📤 Form Submission Hook',
      path: 'apps/front-page/app/donate/hooks/useFormSubmission.ts',
      description: 'Form submission handling with API integration'
    },
    {
      name: '🏷️ Dedicated Names Hook',
      path: 'apps/front-page/app/donate/hooks/useDedicatedNames.ts',
      description: 'Name dedication management with CRUD operations'
    },
    {
      name: '💳 Razorpay Payment Hook',
      path: 'apps/front-page/app/donate/hooks/useRazorpayPayment.ts',
      description: 'Razorpay SDK integration and payment flow'
    },
    {
      name: '🖼️ Image Upload Hook',
      path: 'apps/front-page/app/donate/hooks/useImageUpload.ts',
      description: 'Image upload handling with validation and preview'
    },
    {
      name: '🏦 Bank Payment Hook',
      path: 'apps/front-page/app/donate/hooks/useBankPayment.ts',
      description: 'Bank transfer payment processing'
    },
    {
      name: '📋 Step Validation Hook',
      path: 'apps/front-page/app/donate/hooks/useStepValidation.tsx',
      description: 'Multi-step form validation and navigation control'
    },
    {
      name: '🎛️ Form Handlers Hook',
      path: 'apps/front-page/app/donate/hooks/useFormHandlers.tsx',
      description: 'Centralized form event handlers and state updates'
    }
  ]
};



function printTree(node, prefix = '', isLast = true, isRoot = true) {
  const connector = isRoot ? '' : (isLast ? '└── ' : '├── ');
  const nameColor = isRoot ? colors.bright + colors.cyan : colors.green;
  const pathColor = colors.dim + colors.yellow;
  const descColor = colors.dim + colors.white;
  
  let output = `${prefix}${connector}${nameColor}${node.name}${colors.reset}`;
  
  if (node.path) {
    // Check if file exists
    const fullPath = path.join(rootPath, node.path);
    const exists = fs.existsSync(fullPath);
    const statusIcon = exists ? '✅' : '❌';
    output += ` ${pathColor}(${node.path})${colors.reset} ${statusIcon}`;
  }
  
  if (node.description) {
    const descPrefix = prefix + (isRoot ? '' : (isLast ? '    ' : '│   '));
    output += `\n${descPrefix}${descColor}↳ ${node.description}${colors.reset}`;
  }
  
  console.log(output);
  
  if (node.children) {
    const newPrefix = prefix + (isRoot ? '' : (isLast ? '    ' : '│   '));
    node.children.forEach((child, index) => {
      const isLastChild = index === node.children.length - 1;
      printTree(child, newPrefix, isLastChild, false);
    });
  }
}

function getComponentStats() {
  const donatePagePath = path.join(rootPath, 'apps/front-page/app/donate/page.tsx');
  
  if (fs.existsSync(donatePagePath)) {
    const content = fs.readFileSync(donatePagePath, 'utf-8');
    const lines = content.split('\n').length;
    const importLines = content.split('\n').filter(line => line.trim().startsWith('import')).length;
    const componentCount = (content.match(/<[A-Z][a-zA-Z0-9]*/g) || []).length;
    
    console.log(`\n${colors.bright}${colors.blue}📈 Component Statistics:${colors.reset}`);
    console.log(`${colors.dim}• Main component file: ${lines} lines of code`);
    console.log(`• Import statements: ${importLines}`); 
    console.log(`• JSX components used: ~${componentCount}`);
    console.log(`• Custom hooks: 11`);
    console.log(`• Form sections: 5 main sections`);
    console.log(`• Payment methods: 2 (Razorpay + Bank Transfer)`);
    console.log(`• Multi-step form: 2 steps`);
    console.log(`• Uses TypeScript with strict typing`);
    console.log(`• Next.js 13+ app router architecture${colors.reset}`);
  }
}

// Main execution
console.log(`${colors.bright}${colors.blue}🌳 Donation Page UI Component Tree${colors.reset}`);
console.log(`${colors.dim}Internal components only - External libraries excluded${colors.reset}\n`);

printTree(uiComponentTree);

console.log(`\n${colors.bright}${colors.magenta}${hooksAndUtils.name}${colors.reset}`);
console.log(`${colors.dim}${hooksAndUtils.description}${colors.reset}\n`);
hooksAndUtils.children.forEach((hook, index) => {
  const isLast = index === hooksAndUtils.children.length - 1;
  printTree(hook, '', isLast, false);
});

getComponentStats();

console.log(`\n${colors.bright}${colors.green}🏗️ Internal Component Architecture:${colors.reset}`);
console.log(`${colors.dim}• 11 custom UI components for the donation flow`);
console.log(`• 11 specialized hooks for business logic abstraction`);
console.log(`• Multi-step form with dedicated section components`);
console.log(`• CSV upload functionality with validation`);
console.log(`• Referral system with dialog and sharing components`);
console.log(`• Payment processing with summary and success dialogs`);
console.log(`• Comprehensive form validation with alert components`);
console.log(`• Clean separation between UI components and business logic${colors.reset}`);