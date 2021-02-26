import fs from 'fs';
import ora from 'ora';
import Sitemapper from 'sitemapper';
import chalk from 'chalk';
import dircompare from 'dir-compare';
import axios from 'axios';

const fileExists = (dir) => fs.existsSync(dir);

const createDirectory = (dir) => fs.mkdirSync(dir, { recursive: true });

const filesInDirectory = (dir) => fs.readdirSync(dir).length;

const removeDirectory = (dir) => fs.rmdirSync(dir, { recursive: true });

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

const downloadSites = (sites, destination) =>
  new Promise(async (resolve, reject) => {
    const status = new ora(
      'Downloading ' + sites.length + ' HTML pages...',
    ).start();

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

const downloadSitemap = (url, verbose = false) =>
  new Promise((resolve, reject) => {
    const status = new ora('Fetching sitemap...').start();

    const sitemap = new Sitemapper({
      url: url,
      timeout: 30000,
      debug: verbose,
    });

    sitemap.fetch().then(({ sites }) => {
      status.stop();
      resolve(sites);
    });
  });

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

  const status = new ora('Compare directories...').start();

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
  removeDirectory,
  downloadSitemap,
  downloadSites,
  compareDirectories,
};
