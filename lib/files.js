import fs from 'fs';
import path from 'path';
import clui from 'clui';
const { Spinner } = clui;
import Sitemapper from 'sitemapper';
import chalk from 'chalk';
import dircompare from 'dir-compare';
import axios from 'axios';

const getCurrentDirectoryBase = () => {
  return path.basename(process.cwd());
};

const prepareDirectory = (dir) => {
  if (fs.existsSync(dir)) {
    if (fs.readdirSync(dir).length === 0) {
      return true;
    }
    return false;
  } else {
    fs.mkdirSync(dir);
    return true;
  }
};

const downloadFile = (fileUrl, outputLocationPath) => {
  const streamToFile = (inputStream, filePath) => {
    return new Promise((resolve, reject) => {
      const fileWriteStream = fs.createWriteStream(filePath);
      inputStream
        .pipe(fileWriteStream)
        .on('finish', resolve)
        .on('error', reject);
    });
  };
  return axios({
    method: 'get',
    url: fileUrl,
    responseType: 'stream',
  }).then((response) => streamToFile(response.data, outputLocationPath));
};

const downloadSitemap = (url, destination) => {
  return new Promise(async (resolve, reject) => {
    let status = new Spinner('Fetching sitemap...');
    status.start();

    const sitemap = new Sitemapper({
      url: url,
    });

    const { sites } = await sitemap.fetch();
    status.stop();

    status = new Spinner('Downloading HTML pages...');
    status.start();

    let promises = [];
    for (let i = 0; i < sites.length; i++) {
      const myURL = new URL({ toString: () => sites[i] });

      const filename = myURL.pathname
        .replace(/^\/+|\/+$/g, '')
        .replace(/\//g, '-');

      promises.push(downloadFile(sites[i], destination + filename + '.html'));
    }

    Promise.all(promises).then(() => {
      status.stop();

      console.log(
        chalk.green(
          'Downloaded ' +
            promises.length +
            ' pages to directory ' +
            destination,
        ),
      );
      resolve();
    });
  });
};

const compareDirectories = (dir1, dir2) => {
  const compareOptions = {
    compareContent: true,
    compareFileSync:
      dircompare.fileCompareHandlers.lineBasedFileCompare.compareSync,
    compareFileAsync:
      dircompare.fileCompareHandlers.lineBasedFileCompare.compareAsync,
    ignoreLineEnding: true,
    ignoreWhiteSpaces: true,
  };

  const status = new Spinner('Compare directories...');
  status.start();

  dircompare.compare(dir1, dir2, compareOptions).then((res) => {
    if (res.same) {
      console.log(chalk.green('Directories are same! Awesome!'));
    } else {
      console.log(chalk.red('Directories are different!'));
    }
  });
  status.stop();
};

export {
  getCurrentDirectoryBase,
  prepareDirectory,
  downloadSitemap,
  compareDirectories,
};
