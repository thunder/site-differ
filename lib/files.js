const fs = require('fs');
const path = require('path');
const https = require('http');
const CLI = require('clui');
const Spinner = CLI.Spinner;
const Sitemapper = require('sitemapper');
const chalk = require('chalk');
const dircompare = require('dir-compare');

const compareOptions = {
  compareContent: true,
  compareFileSync:
    dircompare.fileCompareHandlers.lineBasedFileCompare.compareSync,
  compareFileAsync:
    dircompare.fileCompareHandlers.lineBasedFileCompare.compareAsync,
  ignoreLineEnding: true,
  ignoreWhiteSpaces: true,
};

module.exports = {
  getCurrentDirectoryBase: () => {
    return path.basename(process.cwd());
  },

  prepareDirectory: (dir) => {
    if (fs.existsSync(dir)) {
      if (fs.readdirSync(dir).length === 0) {
        return true;
      }
      return false;
    } else {
      fs.mkdirSync(dir);
      return true;
    }
  },

  downloadSitemap: (url, destination) => {
    const sitemap = new Sitemapper();

    const status = new Spinner('Downloading HTML pages...');
    status.start();
    sitemap.fetch(url).then(function (response) {
      response.sites.forEach((page) => {
        https.get(page, function (response) {
          const myURL = new URL({ toString: () => page });

          const filename = myURL.pathname
            .replace(/^\/+|\/+$/g, '')
            .replace(/\//g, '-');
          if (filename) {
            var file = fs.createWriteStream(destination + filename + '.html');
            response.pipe(file);
          }
        });
      });

      status.stop();

      console.log(
        chalk.green(
          'Downloaded ' +
            response.sites.length +
            ' pages to directory ' +
            destination,
        ),
      );
    });
  },

  compareDirectories(dir1, dir2) {
    const status = new Spinner('Compare directories...');
    status.start();

    dircompare.compare(dir1, dir2, compareOptions).then((res) => {
      console.log(res.total);
      if (res.same) {
        console.log(chalk.green('Directories are same! Awesome!'));
      } else {
        console.log(chalk.red('Directories are different!'));
      }
    });
    status.stop();
  },
};
