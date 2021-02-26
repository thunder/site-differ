import clear from 'clear';
import chalk from 'chalk';
import figlet from 'figlet';
import minimist from 'minimist';
import { askSiteUrl } from './lib/inquirer.js';
import {
  createDirectory,
  fileExists,
  filesInDirectory,
  removeDirectory,
  downloadSitemap,
  downloadSites,
  compareDirectories,
} from './lib/files.js';

const run = async () => {
  let args = minimist(process.argv.slice(2), {
    boolean: ['verbose', 'help'],
    alias: {
      verbose: 'v',
      help: 'h',
    },
  });

  clear();

  if (args.help) {
    console.log(
      chalk.yellow(
        figlet.textSync('Site-Differ Help', { horizontalLayout: 'full' }),
      ),
    );
    console.log('--help: Show this page');
    console.log('--url: URL to the sitemap');
    console.log('--verbose: Output debug information');
    console.log('--cleanup: Remove all download folder before starting');
    return;
  }
  console.log(
    chalk.yellow(figlet.textSync('Site-Differ', { horizontalLayout: 'full' })),
  );

  if (args.cleanup) {
    removeDirectory('./downloads');
  }

  const input = await askSiteUrl(args);

  const urlObject = new URL({ toString: () => input.url });

  const dir1 = './downloads/' + urlObject.host + '_1/';
  const dir2 = './downloads/' + urlObject.host + '_2/';

  if (!fileExists(dir1)) {
    createDirectory(dir1);
  }

  if (!fileExists(dir2)) {
    createDirectory(dir2);
  }

  const sites = await downloadSitemap(input.url, args.verbose);

  if (filesInDirectory(dir1) === sites.length) {
    if (filesInDirectory(dir2) !== sites.length) {
      await downloadSites(sites, dir2);
    }
    compareDirectories(dir1, dir2);
  } else {
    downloadSites(sites, dir1);
  }
};

run();
