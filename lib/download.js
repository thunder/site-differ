import axios from 'axios';
import PromisePool from '@supercharge/promise-pool';
import Sitemapper from 'sitemapper';
import fs from 'fs';
import Ora from 'ora';
import chalk from 'chalk';
import { fileExists, filesInDirectory } from './files.js';

const getFilenameByUrl = (url) => {
  const myURL = new URL({ toString: () => url });

  const filename = myURL.pathname.replace(/^\/+|\/+$/g, '').replace(/\//g, '-');

  return `${filename || 'index'}.html`;
};

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
    .catch((error) =>
      Promise.reject(new Error(`Downloading failed for ${error.config.url}`)),
    );

const downloadSites = async (sites, destination, concurrency) => {
  const pagesToDownload = [];
  sites.forEach((site) => {
    const filepath = destination + getFilenameByUrl(site);

    if (!fileExists(filepath)) {
      pagesToDownload.push({ site, filepath });
    }
  });

  const status = new Ora(
    `Downloading ${pagesToDownload.length} HTML pages...`,
  ).start();

  return PromisePool.withConcurrency(concurrency)
    .for(pagesToDownload)
    .process(async (download) => downloadFile(download.site, download.filepath))
    .then(() => {
      status.stop();

      console.log(
        chalk.green(
          `Downloaded ${pagesToDownload.length} pages to directory ${destination}`,
        ),
      );
    })
    .catch((reason) => {
      console.log(reason);
    });
};

const downloadSitemap = async (url, verbose = false) => {
  const status = new Ora('Fetching sitemap...').start();
  const sitemap = new Sitemapper({
    url,
    timeout: 30000,
    debug: verbose,
  });

  return sitemap.fetch().then(({ sites }) => {
    status.stop();
    return sites;
  });
};

const downloadComplete = (dir, sites) => filesInDirectory(dir) === sites.length;

export { downloadSitemap, downloadSites, downloadComplete };
