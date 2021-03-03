import fs from 'fs';
import ora from 'ora';
import Sitemapper from 'sitemapper';
import chalk from 'chalk';
import dircompare from 'dir-compare';
import axios from 'axios';
import PromisePool from '@supercharge/promise-pool';

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
  })
    .then((response) => streamToFile(response.data, outputLocationPath))
    .catch(function (error) {
      return Promise.reject('Downloading failed for ' + error.config.url);
    });

const downloadSites = async (sites, destination, concurrency) => {
  let pagesToDownload = [];
  sites.forEach((site) => {
    const myURL = new URL({ toString: () => site });

    const filename = myURL.pathname
      .replace(/^\/+|\/+$/g, '')
      .replace(/\//g, '-');

    const filepath = destination + (filename ? filename : 'index') + '.html';
    if (!fileExists(filepath)) {
      pagesToDownload.push({ site, filepath });
    }
  });

  const status = new ora(
    'Downloading ' + pagesToDownload.length + ' HTML pages...',
  ).start();

  return PromisePool.withConcurrency(concurrency)
    .for(pagesToDownload)
    .process(
      async (download) => await downloadFile(download.site, download.filepath),
    )
    .then(() => {
      status.stop();

      console.log(
        chalk.green(
          'Downloaded ' +
            pagesToDownload.length +
            ' pages to directory ' +
            destination,
        ),
      );
    })
    .catch((reason) => {
      console.log(reason);
    });
};

const downloadSitemap = async (url, verbose = false) => {
  const status = new ora('Fetching sitemap...').start();
  const sitemap = new Sitemapper({
    url: url,
    timeout: 30000,
    debug: verbose,
  });

  return sitemap.fetch().then(({ sites }) => {
    status.stop();
    return sites;
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

  const status = new ora('Compare directories...').start();

  dircompare.compare(dir1, dir2, compareOptions).then((result) => {
    status.stop();
    if (result.same) {
      console.log(chalk.green('Directories are same! Awesome!'));
    } else {
      let array = [];
      result.diffSet.forEach((element) => {
        if (element.state !== 'equal') {
          array.push({ fileName: element.name1 });
        }
      });
      console.log(
        chalk.red(
          'Directories are not equal! Differences are found into the following files:',
        ),
      );
      console.table(array);
    }
  });
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
