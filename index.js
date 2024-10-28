const axios = require('axios');
const https = require('https');
const fs = require('fs');
const path = require('path');

// Example input: Array of objects with paths and file lists
const filePaths = require('./data.json')

// HTTPS Agent to bypass SSL verification (if necessary)
const agent = new https.Agent({
  rejectUnauthorized: false  // Use only in development/testing
});

// Check if a file exists
function fileExists(filePath) {
  return fs.existsSync(filePath);
}

// Function to request the download token for each file
async function getDownloadToken(file, filePath) {
  const url = 'https://kdpp.turksat.com.tr/api/file/0c36cf7cb0d04135af3fcc7e094b7e72/get_share_item_download_token';

  const headers = {
    'Accept': 'application/json',
    'Accept-Language': 'en-US,en;q=0.9',
    'Connection': 'keep-alive',
    'Content-Type': 'application/json',
    'Cookie': 'persistence_cookie=2719245578.45845.0000; TS0189c253=0126c52ff58a21bc8e68e3dd10bfad56681fea7881cd86f9cb2a9dd5d8125257c0d25e0924af3a1a1306f1699a26925d1950c8e434',
    'DNT': '1',
    'Origin': 'https://kdpp.turksat.com.tr',
    'Referer': 'https://kdpp.turksat.com.tr/d/0c36cf7cb0d04135af3fcc7e094b7e72',
    'Sec-Fetch-Dest': 'empty',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Site': 'same-origin',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.0.0',
    'sec-ch-ua': '"Chromium";v="130", "Microsoft Edge";v="130", "Not?A_Brand";v="99"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Windows"'
  };
  const data = {
    p: null,
    file_name: file.name,
    file_id: file.id,
    path: filePath
  };

  try {
    const response = await axios.post(url, data, { headers, httpsAgent: agent });
    console.log(`Token for ${file.name}: ${response.data.token}`);
    return response.data.token;
  } catch (error) {
    console.error(`Error fetching token for ${file.name}:`, error);
    throw error;
  }
}

// Function to download the file using the token
async function downloadFile(token, file, folderPath) {
  const downloadUrl = `https://kdpp.turksat.com.tr/api/file/server2/files/${token}/${file.name}`;

  try {
    // Ensure the folder exists
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    const filePath = path.join(folderPath, file.name);

    if (fileExists(filePath)) {
      console.log(`${file.name} already exists. Skipping...`);
      return;
    }

    const response = await axios({
      method: 'get',
      url: downloadUrl,
      responseType: 'stream',
      httpsAgent: agent
    });

    const writer = fs.createWriteStream(filePath);

    let downloadedLength = 0;
    const totalLength = file.size;

    response.data.on('data', (chunk) => {
      downloadedLength += chunk.length;
      const progress = ((downloadedLength / totalLength) * 100).toFixed(2);
      process.stdout.write(`\rDownloading ${file.name}... ${progress}%`);
    });

    response.data.pipe(writer);

    writer.on('finish', () => {
      console.log(`\nDownloaded: ${file.name}`);
    });

    writer.on('error', (err) => {
      console.error(`File writing error for ${file.name}:`, err);
    });

  } catch (error) {
    console.error(`Error downloading ${file.name}:`, error);
  }
}

// Main function to download all files by path
async function downloadAllFilesByPath(filePaths) {
  for (const pathObj of filePaths) {
    const folderPath = path.resolve(__dirname, pathObj.path); // Destination folder

    for (const file of pathObj.list) {
      try {
        const token = await getDownloadToken(file, pathObj.path);
        downloadFile(token, file, folderPath);
      } catch (error) {
        console.error(`Skipping ${file.name} due to an error.`);
      }
    }
  }
}

// Run the download process
downloadAllFilesByPath(filePaths);