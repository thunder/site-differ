import fs from 'fs';
import clui from 'clui';
const { Spinner } = clui;
import Sitemapper from 'sitemapper';
import chalk from 'chalk';
import dircompare from 'dir-compare';
import axios from 'axios';

const fileExists = (dir) => fs.existsSync(dir);

const createDirectory = (dir) => fs.mkdirSync(dir);

const filesInDirectory = (dir) => fs.readdirSync(dir).length;

const streamToFile = (inputStream, filePath) =>
  new Promise((resolve, reject) => {
    const fileWriteStream = fs.createWriteStream(filePath);
    inputStream.pipe(fileWriteStream).on('finish', resolve).on('error', reject);
  });

const downloadFile = (fileUrl, outputLocationPath) =>
  axios({
    method: 'get',
    url: fileUrl,
    responseType: 'stream',
  }).then((response) => streamToFile(response.data, outputLocationPath));

const downloadSites = (sites, destination) => {
  return new Promise(async (resolve, reject) => {
    const status = new Spinner(
      'Downloading ' + sites.length + ' HTML pages...',
    );
    status.start();

    let promises = [];
    for (let i = 0; i < sites.length; i++) {
      const myURL = new URL({ toString: () => sites[i] });

      const filename = myURL.pathname
        .replace(/^\/+|\/+$/g, '')
        .replace(/\//g, '-');

      const filepath = destination + (filename ? filename : 'index') + '.html';
      if (!fileExists(filepath)) {
        promises.push(downloadFile(sites[i], filepath));
      }
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

const downloadSitemap = async (url, verbose = false) => {
  const status = new Spinner('Fetching sitemap...');
  status.start();

  const sitemap = new Sitemapper({
    url: url,
    timeout: 30000,
    debug: verbose,
  });

  const { sites } = await sitemap.fetch();

  status.stop();
  return sites;
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
  createDirectory,
  fileExists,
  filesInDirectory,
  downloadSitemap,
  downloadSites,
  compareDirectories,
};
