import fs from 'fs';
import path from 'path';
import readline from 'readline';
import jsYaml from 'js-yaml';

export function getReadmeFilesSync(directoryPath) {
  let readmeFiles = [];

  const files = fs.readdirSync(directoryPath);

  for (let i = 0; i < files.length; i++) {
    const filePath = path.join(directoryPath, files[i]);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      const readmePath = path.join(filePath, 'README.md');
      if (fs.existsSync(readmePath)) {
        readmeFiles.push(readmePath);
      }
    }
  }

  return readmeFiles;
}

export function extractMeta(fileName) {
  return new Promise((resolve, reject) => {
    let capture = false;
    let metaData = '';
    let isResolved = false;
    let lineNum = 0;
    const readInterface = readline.createInterface({
      input: fs.createReadStream(fileName),
      output: process.stdout,
      console: false,
    });

    readInterface.on('line', function(line) {
      lineNum++;
      if (isResolved) {
        // Don't know why the `readInterface.close` didn't work in github action.
        return;
      }
      if (line.trim() === '---') {
        if (capture) {
          capture = false;
          isResolved = true;
          readInterface.close();
          readInterface.input.close();

          console.log(`${fileName} Find the medata block.`, metaData);

          resolve(jsYaml.load(metaData));
        } else {
          capture = true;
        }
      } else if (capture) {
        metaData += line + '\n';
      }
    });

    readInterface.on('close', function() {
      console.log(`${fileName}readInterface onClosed`);
      if (!isResolved) {
        console.log(`${fileName}readInterface not find meta block closed`);
        resolve(false);
      }
    });

    readInterface.on('error', reject);
  });
}

export function sortMetadata(metaDataList) {
  metaDataList.sort((a, b) => {
    if (a.top !== b.top) {
      return a.top ? -1 : 1;
    }

    if (a.weight !== b.weight) {
      return b.weight - a.weight;
    }

    return new Date(b.date) - new Date(a.date);
  });
}

export function exportJSONFile(folderPath, obj) {
  fs.writeFileSync(`${folderPath}/dir.json`, JSON.stringify(obj, null, 2));
  fs.writeFileSync(`${folderPath}/dir.min.json`, JSON.stringify(obj));
}

export function beautifyUR(title) {
  return title.replace(/\s/g, '-').
      replace(/-+/g, '-').
      replace(/[^a-å0-9-]/gi, '').
      toLowerCase() || title;
}
