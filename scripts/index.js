import path from 'path';
import {
  getReadmeFilesSync,
  extractMeta,
  exportJSONFile,
  sortMetadata,
  beautifyUR,
  encodePath,
} from './file.js';

async function main() {
  const fileList = getReadmeFilesSync('./articles');

  const metaDataList = [];
  for (const filePath of fileList) {
    const meta = await extractMeta(filePath);
    const lastDir = path.dirname(filePath).split('/').pop();
    const slug = beautifyUR(lastDir);

    if (meta) {
      metaDataList.push({...meta, path: encodePath(filePath), slug});
    }
  }

  sortMetadata(metaDataList);

  exportJSONFile('./generated', {
    articles: metaDataList,
  });
}

main().then(r => console.log('done'));
