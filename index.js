const clear = require('clear');
const chalk = require('chalk');
const figlet = require('figlet');

const { askSiteUrl } = require('./lib/inquirer');
const {
  directoryExists,
  downloadSitemap,
  createDirectory,
  compareDirectories,
} = require('./lib/files');

const dir1 = './download1/';
const dir2 = './download2/';

const run = async () => {
  if (directoryExists(dir1)) {
    if (directoryExists(dir2)) {
      compareDirectories(dir1, dir2);
    } else {
      createDirectory(dir2);

      const input = await askSiteUrl();
      await downloadSitemap(input.siteUrl, dir2);
      compareDirectories(dir1, dir2);
    }
  } else {
    createDirectory(dir1);

    const input = await askSiteUrl();
    downloadSitemap(input.siteUrl, dir1);
  }
};

clear();

console.log(
  chalk.yellow(figlet.textSync('Site-Differ', { horizontalLayout: 'full' })),
);

run();
