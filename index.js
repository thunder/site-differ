import chalk from 'chalk';
import minimist from 'minimist';
import { askSiteUrl } from './lib/inquirer.js';
import {
  compareDirectories,
  getDirectoryPath,
  prepareDirectory,
} from './lib/files.js';
import {
  downloadSitemap,
  downloadSites,
  downloadComplete,
} from './lib/download.js';

const run = async () => {
  let args = minimist(process.argv.slice(2), {
    string: ['url'],
    boolean: ['verbose', 'help', 'cleanup'],
    alias: {
      verbose: 'v',
      help: 'h',
    },
    default: {
      concurrency: 20,
    },
  });
  console.log(chalk.yellow('Site-Differ'));

  if (args.help) {
    console.log('--help: Show this page');
    console.log('--url: URL to the sitemap');
    console.log('--verbose: Output debug information');
    console.log('--cleanup: Remove all download folder before starting');
    console.log('--concurrency: Concurrent page downloads (Default=20)');
    return;
  }

  const input = await askSiteUrl(args);

  const { dir1, dir2 } = getDirectoryPath(input.url);

  prepareDirectory(dir1, args.cleanup);
  prepareDirectory(dir2, args.cleanup);

  const sites = await downloadSitemap(input.url, args.verbose);

  if (downloadComplete(dir1, sites)) {
    if (!downloadComplete(dir2, sites)) {
      await downloadSites(sites, dir2, args.concurrency);
    }
    compareDirectories(dir1, dir2);
  } else {
    downloadSites(sites, dir1, args.concurrency);
  }
};

run();
