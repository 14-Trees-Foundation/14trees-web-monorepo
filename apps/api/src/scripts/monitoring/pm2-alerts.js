const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Configuration
const logDirectory = process.env.LOG_DIRECTORY || '/home/ubuntu/.pm2/logs/';
const logFilePrefix = process.env.LOG_FILE_PREFIX || '14trees-api-dev-out';
const discordWebhookUrl = process.env.DISCORD_WEBHOOK_URL || 'https://discordapp.com/api/webhooks/1399978767593766952/eId1vdiotaH6D2mO_--sjSar88LPhFZr-9rUL7ggDWfkLaz2URoOteU5R2OQN6fAvS98';
const checkInterval = process.env.CHECK_INTERVAL || 5 * 60 * 1000; // 5 minutes in milliseconds
const positionFilePath = path.join(logDirectory, '.pm2-alerts-position');

// Function to get the latest log file matching the prefix
function getLatestLogFile(directory, prefix) {
    const files = fs.readdirSync(directory)
        .filter(file => file.startsWith(prefix) && file.endsWith('.log'))
        .map(file => ({
            name: file,
            time: fs.statSync(path.join(directory, file)).mtime.getTime()
        }))
        .sort((a, b) => b.time - a.time); // Sort by modified time in descending order

    return files.length > 0 ? path.join(directory, files[0].name) : null;
}

// Function to read and save the last read position
function getLastPosition(logFilePath) {
    try {
        if (fs.existsSync(positionFilePath)) {
            const data = fs.readFileSync(positionFilePath, 'utf8');
            const position = JSON.parse(data);
            
            // Check if we're still reading the same file
            if (position.filePath === logFilePath) {
                return position.lastPosition || 0;
            }
        }
    } catch (error) {
        console.log('No previous position found, starting from beginning');
    }
    return 0;
}

// Function to save the current read position
function saveLastPosition(logFilePath, position) {
    try {
        const data = {
            filePath: logFilePath,
            lastPosition: position,
            timestamp: new Date().toISOString()
        };
        fs.writeFileSync(positionFilePath, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error saving position:', error);
    }
}

// Function to send Discord alert with error details
async function sendDiscordAlert(logFilePath, errorLines) {
    try {
        const timestamp = new Date().toLocaleString();
        const errorCount = errorLines.length;
        
        // Limit message size (Discord has 2000 char limit)
        const maxLogLength = 1500;
        let logContent = errorLines.join('\n');
        
        if (logContent.length > maxLogLength) {
            logContent = logContent.substring(0, maxLogLength) + '\n... (truncated)';
        }
        
        const message = {
            content: `🚨 **${errorCount} Error(s) Detected** 🚨\n**Time:** ${timestamp}\n**Log File:** \`${path.basename(logFilePath)}\`\n\`\`\`\n${logContent}\n\`\`\``
        };

        const response = await axios.post(discordWebhookUrl, message);
        console.log(`Alert sent successfully: ${errorCount} errors found`);
        return true;
    } catch (error) {
        console.error('Error sending Discord alert:', error.message);
        return false;
    }
}

// Function to check for new errors in logs
async function checkForErrors() {
    try {
        const latestLogFilePath = getLatestLogFile(logDirectory, logFilePrefix);
        
        if (!latestLogFilePath) {
            console.log('No log file found matching the pattern.');
            return;
        }

        const stats = fs.statSync(latestLogFilePath);
        const lastPosition = getLastPosition(latestLogFilePath);
        
        // If file is smaller than last position, it might have been rotated
        if (stats.size < lastPosition) {
            console.log('Log file appears to have been rotated, starting from beginning');
            saveLastPosition(latestLogFilePath, 0);
            return;
        }
        
        // If no new content, skip
        if (stats.size === lastPosition) {
            console.log('No new log content to check');
            return;
        }

        // Read only the new content
        const stream = fs.createReadStream(latestLogFilePath, { 
            start: lastPosition,
            encoding: 'utf8'
        });

        let newContent = '';
        stream.on('data', (chunk) => {
            newContent += chunk;
        });

        stream.on('end', async () => {
            if (newContent.trim()) {
                // Look for error lines
                const lines = newContent.split('\n');
                const errorLines = lines.filter(line => 
                    line.toUpperCase().includes('ERROR') && line.trim() !== ''
                );

                if (errorLines.length > 0) {
                    console.log(`Found ${errorLines.length} error(s) in new log content`);
                    await sendDiscordAlert(latestLogFilePath, errorLines);
                } else {
                    console.log('No errors found in new log content');
                }
            }
            
            // Save the new position
            saveLastPosition(latestLogFilePath, stats.size);
        });

        stream.on('error', (error) => {
            console.error('Error reading log file:', error);
        });

    } catch (error) {
        console.error('Error in checkForErrors:', error);
    }
}

// Function to run continuous monitoring
function startMonitoring() {
    console.log(`Starting PM2 error monitoring (checking every ${checkInterval/1000/60} minutes)`);
    console.log(`Monitoring directory: ${logDirectory}`);
    console.log(`Log file prefix: ${logFilePrefix}`);
    
    // Initial check
    checkForErrors();
    
    // Set up interval for continuous monitoring
    setInterval(checkForErrors, checkInterval);
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('PM2 error monitoring stopped');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('PM2 error monitoring stopped');
    process.exit(0);
});

// Start monitoring
startMonitoring();