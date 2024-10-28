// Function to calculate the total size and convert to GB
function calculateTotalSizeInGB(filePaths) {
  let totalSize = 0; // Initialize total size

  // Loop through each path and accumulate the size of all files
  for (const pathObj of filePaths) {
    for (const file of pathObj.list) {
      totalSize += file?.size ?? 0; // Add each file's size to total
    }
  }


  // Convert bytes to GB (1 GB = 1,073,741,824 bytes)
  const totalSizeInGB = totalSize / (1024 ** 3);
  return totalSizeInGB.toFixed(2); // Return the size in GB rounded to 2 decimal places
}

const filePaths = require('./data.json')

// Calculate and print the total size in GB
const totalSizeInGB = calculateTotalSizeInGB(filePaths);
console.log(`Total size of all files: ${totalSizeInGB} GB`);