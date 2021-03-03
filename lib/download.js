import axios from 'axios';
import PromisePool from '@supercharge/promise-pool';
import Sitemapper from 'sitemapper';
import fs from 'fs';
import { fileExists, filesInDirectory } from './files.js';
import ora from 'ora';
import chalk from 'chalk';

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
    const filepath = destination + getFilenameByUrl(site);

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

const getFilenameByUrl = (url) => {
  const myURL = new URL({ toString: () => url });

  const filename = myURL.pathname.replace(/^\/+|\/+$/g, '').replace(/\//g, '-');

  return (filename ? filename : 'index') + '.html';
};

const downloadComplete = (dir, sites) => filesInDirectory(dir) === sites.length;

export { downloadSitemap, downloadSites, downloadComplete };
