# Bulk Donation Processor

This script processes donations in bulk from a CSV file by making API calls to create payment and donation requests.

## Prerequisites

1. **Node.js**: Version 16 or higher
2. **Backend API**: Make sure your backend API is running on `http://localhost:8088`
3. **CSV File**: Ensure `group_donations.csv` is in the same directory

## Installation

```bash
# Install dependencies
npm install

# Or if using yarn
yarn install
```

## Usage

### Method 1: Using npm scripts
```bash
npm start
```

### Method 2: Direct node execution
```bash
node bulk-donation-processor.js
```

### Method 3: Development mode (with file watching)
```bash
npm run dev
```

## CSV File Format

The script expects a CSV file with the following columns:
- `Sr. No.`: Serial number
- `Name`: Donor's full name
- `Email`: Donor's email address
- `Mobile No.`: Donor's phone number
- `PAN`: Donor's PAN number
- `No. of Trees`: Number of trees to be donated
- `Amount`: Donation amount (can include commas, e.g., "3,000")
- `Donation ID`: (Optional, can be empty)

## Configuration

You can modify the following constants in the script:

- `API_BASE_URL`: Backend API base URL (default: `http://localhost:8088/api`)
- `DELAY_BETWEEN_REQUESTS`: Delay between API calls in milliseconds (default: 1000ms)
- `DEFAULT_VALUES`: Default values for donation fields

## How it Works

For each row in the CSV:

1. **Payment Request**: Creates a payment request with donor details
2. **Donation Request**: Creates a donation request using the payment ID from step 1
3. **Delay**: Waits before processing the next donor to avoid overwhelming the server

## Output

The script will:
- Display progress in the console
- Show success/failure for each donation
- Generate a summary at the end
- Save detailed results to a JSON file with timestamp

## Error Handling

- Individual donor failures won't stop the entire process
- Failed donations are logged and included in the summary
- Network errors and API errors are caught and reported

## Example Output

```
🚀 Starting bulk donation processing...
Reading CSV file: /path/to/group_donations.csv
Found 13 donors to process

--- Processing donor 1: Rajendra Sapre ---
Creating payment request for Rajendra Sapre...
Payment request created with ID: 1243
Creating donation request for Rajendra Sapre...
Donation request created with ID: 5181
✅ Successfully processed Rajendra Sapre
   Payment ID: 1243
   Donation ID: 5181

📊 Processing Summary:
========================
✅ Successful: 13
❌ Failed: 0
📈 Total: 13
```

## Troubleshooting

1. **fetch is not available**: Install node-fetch or use Node.js 18+
2. **API connection errors**: Ensure backend is running on correct port
3. **CSV parsing errors**: Check CSV format and encoding
4. **Permission errors**: Ensure write permissions for result files