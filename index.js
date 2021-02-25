import clear from 'clear';
import chalk from 'chalk';
import figlet from 'figlet';

import { askSiteUrl } from './lib/inquirer.js';
import {
  prepareDirectory,
  downloadSitemap,
  compareDirectories,
} from './lib/files.js';

const dir1 = './download1/';
const dir2 = './download2/';

const run = async () => {
  if (prepareDirectory(dir1)) {
    const input = await askSiteUrl();
    downloadSitemap(input.siteUrl, dir1);
  } else {
    if (prepareDirectory(dir2)) {
      const input = await askSiteUrl();
      await downloadSitemap(input.siteUrl, dir2);
    }
    compareDirectories(dir1, dir2);
  }
};

clear();

console.log(
  chalk.yellow(figlet.textSync('Site-Differ', { horizontalLayout: 'full' })),
);

run();
