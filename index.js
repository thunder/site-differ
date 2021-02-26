import clear from 'clear';
import chalk from 'chalk';
import figlet from 'figlet';

import { askSiteUrl } from './lib/inquirer.js';
import {
  createDirectory,
  fileExists,
  filesInDirectory,
  downloadSitemap,
  downloadSites,
  compareDirectories,
} from './lib/files.js';

const run = async () => {
  const dir1 = './download1/';
  const dir2 = './download2/';

  const input = await askSiteUrl();

  if (!fileExists(dir1)) {
    createDirectory(dir1);
  }

  if (!fileExists(dir2)) {
    createDirectory(dir2);
  }

  const sites = await downloadSitemap(input.siteUrl);

  if (filesInDirectory(dir1) === sites.length) {
    if (filesInDirectory(dir2) !== sites.length) {
      await downloadSites(sites, dir2);
    }
    compareDirectories(dir1, dir2);
  } else {
    downloadSites(sites, dir1);
  }
};

clear();

console.log(
  chalk.yellow(figlet.textSync('Site-Differ', { horizontalLayout: 'full' })),
);

run();
