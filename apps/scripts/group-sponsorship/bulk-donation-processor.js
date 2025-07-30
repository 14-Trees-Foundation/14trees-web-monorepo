const fs = require('fs');
const path = require('path');

// Configuration
const API_BASE_URL = 'http://localhost:8088/api';
const CSV_FILE_PATH = path.join(__dirname, 'group_donations.csv');
const DELAY_BETWEEN_REQUESTS = 1000; // 1 second delay to avoid overwhelming the server
const CREATE_PAYMENT_LINKS = false; // Set to true to generate shareable payment links instead of creating donations

// Default values for all donations
const DEFAULT_VALUES = {
  donor_type: "Indian Citizen",
  consent: true,
  category: "Foundation",
  donation_type: "adopt",
  contribution_options: [],
  comments: "🔧 BULK DONATION PROCESSING - Group sponsorship donation processed via bulk script.",
  visit_date: "2025-07-20", // You may want to adjust this
  users: [],
  tags: ["WebSite", "Bulk-Processing", "Group-Sponsorship"],
  rfr: null,
  c_key: null,
  internal_test: false, // Set to true if these are test donations
  original_amount: null,
};

// Utility function to parse CSV
function parseCSV(content) {
  const lines = content.split('\n').filter(line => line.trim());
  const headers = lines[0].split(',').map(h => h.trim());
  
  return lines.slice(1).map(line => {
    const values = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    return row;
  });
}

// Utility function to clean amount (remove commas and convert to number)
function parseAmount(amountStr) {
  return parseInt(amountStr.replace(/[,"]/g, ''));
}

// Utility function to make HTTP requests
async function makeRequest(url, method, data) {
  const response = await fetch(url, {
    method: method,
    headers: {
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'en-GB,en-US;q=0.9,en;q=0.8',
      'Connection': 'keep-alive',
      'Content-Type': 'application/json',
      'Origin': 'http://localhost:3011',
      'Referer': 'http://localhost:3011/',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'same-site',
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36'
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}, statusText: ${response.statusText}`);
  }

  return await response.json();
}

// Create payment request
async function createPaymentRequest(donorData, createPaymentLink = false) {
  const paymentData = {
    amount: donorData.amount,
    donor_type: DEFAULT_VALUES.donor_type,
    pan_number: donorData.pan,
    consent: DEFAULT_VALUES.consent,
    user_email: donorData.email,
    create_payment_link: createPaymentLink,
    customer_name: donorData.name,
    customer_email: donorData.email,
    customer_phone: donorData.mobile,
    description: `Tree sponsorship donation for ${donorData.name} - ${donorData.trees_count} tree(s)`
  };

  console.log(`Creating payment request for ${donorData.name}...`);
  const response = await makeRequest(`${API_BASE_URL}/payments`, 'POST', paymentData);
  console.log(`Payment request created with ID: ${response.id}`);
  
  if (createPaymentLink && response.payment_link_url) {
    console.log(`Payment link created: ${response.payment_link_url}`);
  }
  
  return response;
}

// Create payment link (dedicated function)
async function createPaymentLinkRequest(donorData) {
  const paymentLinkData = {
    amount: donorData.amount,
    customer_name: donorData.name,
    customer_email: donorData.email,
    customer_phone: donorData.mobile,
    description: `Tree sponsorship donation for ${donorData.name} - ${donorData.trees_count} tree(s)`,
    donor_type: DEFAULT_VALUES.donor_type,
    pan_number: donorData.pan,
    consent: DEFAULT_VALUES.consent,
    user_email: donorData.email,
    notes: {
      donor_name: donorData.name,
      trees_count: donorData.trees_count,
      purpose: 'tree_sponsorship'
    }
  };

  console.log(`Creating payment link for ${donorData.name}...`);
  const response = await makeRequest(`${API_BASE_URL}/payments/links`, 'POST', paymentLinkData);
  console.log(`Payment link created with ID: ${response.payment_link_id}`);
  console.log(`Payment link URL: ${response.payment_link_url}`);
  return response;
}

// Create donation request
async function createDonationRequest(donorData, paymentResponse) {
  const donationData = {
    sponsor_name: donorData.name,
    sponsor_email: donorData.email,
    sponsor_phone: donorData.mobile,
    category: DEFAULT_VALUES.category,
    donation_type: DEFAULT_VALUES.donation_type,
    payment_id: paymentResponse.id,
    contribution_options: DEFAULT_VALUES.contribution_options,
    comments: DEFAULT_VALUES.comments,
    amount_donated: donorData.amount,
    visit_date: DEFAULT_VALUES.visit_date,
    trees_count: donorData.trees_count,
    users: DEFAULT_VALUES.users,
    tags: DEFAULT_VALUES.tags,
    rfr: DEFAULT_VALUES.rfr,
    c_key: DEFAULT_VALUES.c_key,
    internal_test: DEFAULT_VALUES.internal_test,
    original_amount: donorData.amount
  };

  console.log(`Creating donation request for ${donorData.name}...`);
  const response = await makeRequest(`${API_BASE_URL}/donations/requests`, 'POST', donationData);
  console.log(`Donation request created with ID: ${response.id}`);
  return response;
}

// Process a single donor
async function processDonor(row, index) {
  try {
    console.log(`\n--- Processing donor ${index + 1}: ${row.Name} ---`);
    
    const donorData = {
      name: row.Name.trim(),
      email: row.Email.trim(),
      mobile: row['Mobile No.'].trim(),
      pan: row.PAN.trim(),
      trees_count: parseInt(row['No. of Trees']),
      amount: parseAmount(row.Amount)
    };

    // Validate required fields
    if (!donorData.name || !donorData.email || !donorData.pan || !donorData.amount) {
      throw new Error('Missing required fields');
    }

    console.log(`Donor data:`, donorData);

    if (CREATE_PAYMENT_LINKS) {
      // Generate payment link only
      const paymentLinkResponse = await createPaymentLinkRequest(donorData);

      console.log(`✅ Successfully created payment link for ${donorData.name}`);
      console.log(`   Payment ID: ${paymentLinkResponse.payment_id}`);
      console.log(`   Payment Link: ${paymentLinkResponse.payment_link_url}`);

      return {
        success: true,
        donor: donorData.name,
        paymentId: paymentLinkResponse.payment_id,
        paymentLinkId: paymentLinkResponse.payment_link_id,
        paymentLinkUrl: paymentLinkResponse.payment_link_url,
        amount: paymentLinkResponse.amount
      };
    } else {
      // Original flow: Create payment request and donation
      // Step 1: Create payment request
      const paymentResponse = await createPaymentRequest(donorData);

      // Step 2: Create donation request
      const donationResponse = await createDonationRequest(donorData, paymentResponse);

      console.log(`✅ Successfully processed ${donorData.name}`);
      console.log(`   Payment ID: ${paymentResponse.id}`);
      console.log(`   Donation ID: ${donationResponse.id}`);

      return {
        success: true,
        donor: donorData.name,
        paymentId: paymentResponse.id,
        donationId: donationResponse.id
      };
    }

  } catch (error) {
    console.error(`❌ Error processing ${row.Name}: ${error.message}`);
    return {
      success: false,
      donor: row.Name,
      error: error.message
    };
  }
}

// Main processing function
async function processBulkDonations() {
  try {
    console.log('🚀 Starting bulk donation processing...');
    console.log(`Reading CSV file: ${CSV_FILE_PATH}`);

    // Read and parse CSV file
    const csvContent = fs.readFileSync(CSV_FILE_PATH, 'utf-8');
    const donors = parseCSV(csvContent);

    console.log(`Found ${donors.length} donors to process`);

    const results = [];

    // Process each donor sequentially
    for (let i = 0; i < donors.length; i++) {
      const result = await processDonor(donors[i], i);
      results.push(result);

      // Add delay between requests to avoid overwhelming the server
      if (i < donors.length - 1) {
        console.log(`Waiting ${DELAY_BETWEEN_REQUESTS}ms before next request...`);
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_REQUESTS));
      }
    }

    // Summary
    console.log('\n📊 Processing Summary:');
    console.log('========================');
    
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    console.log(`✅ Successful: ${successful.length}`);
    console.log(`❌ Failed: ${failed.length}`);
    console.log(`📈 Total: ${results.length}`);

    if (successful.length > 0) {
      if (CREATE_PAYMENT_LINKS) {
        console.log('\n✅ Successful payment links created:');
        successful.forEach(r => {
          console.log(`   ${r.donor} - Payment ID: ${r.paymentId}, Payment Link: ${r.paymentLinkUrl}`);
        });
      } else {
        console.log('\n✅ Successful donations:');
        successful.forEach(r => {
          console.log(`   ${r.donor} - Payment ID: ${r.paymentId}, Donation ID: ${r.donationId}`);
        });
      }
    }

    if (failed.length > 0) {
      console.log('\n❌ Failed donations:');
      failed.forEach(r => {
        console.log(`   ${r.donor} - Error: ${r.error}`);
      });
    }

    // Save results to file
    const resultsFile = path.join(__dirname, `processing-results-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`);
    fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));
    console.log(`\n📄 Results saved to: ${resultsFile}`);

  } catch (error) {
    console.error('💥 Fatal error:', error.message);
    process.exit(1);
  }
}

// Check if node-fetch is available, if not provide instructions
async function checkDependencies() {
  try {
    // Try to use built-in fetch (Node.js 18+)
    if (typeof fetch === 'undefined') {
      // For older Node.js versions, try to require node-fetch
      const fetch = require('node-fetch');
      global.fetch = fetch;
    }
  } catch (error) {
    console.error('❌ fetch is not available. Please install node-fetch:');
    console.error('npm install node-fetch');
    console.error('Or use Node.js 18+ which has built-in fetch support');
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  checkDependencies().then(() => {
    processBulkDonations();
  });
}

module.exports = {
  processBulkDonations,
  parseCSV,
  parseAmount
};