const fs = require('fs');
const path = require('path');
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
    return new Promise(async (resolve, reject) => {
      downloadFile = async function downloadFile(fileUrl, outputLocationPath) {
        const writer = fs.createWriteStream(outputLocationPath);
        const axios = require('axios');
        return axios({
          method: 'get',
          url: fileUrl,
          responseType: 'stream',
        }).then((response) => {
          //ensure that the user can call `then()` only when the file has
          //been downloaded entirely.

          return new Promise((resolve, reject) => {
            response.data.pipe(writer);
            let error = null;
            writer.on('error', (err) => {
              error = err;
              writer.close();
              reject(err);
            });
            writer.on('close', () => {
              if (!error) {
                resolve(true);
              }
              //no need to call the reject here, as it will have been called in the
              //'error' stream;
            });
          });
        });
      };

      let status = new Spinner('Fetching sitemap...');
      status.start();

      const sitemap = new Sitemapper({
        url: url,
      });

      const { sites } = await sitemap.fetch();
      status.stop();

      status = new Spinner('Downloading HTML pages...');
      status.start();

      let promises = [];
      for (let i = 0; i < sites.length; i++) {
        const myURL = new URL({ toString: () => sites[i] });

        const filename = myURL.pathname
          .replace(/^\/+|\/+$/g, '')
          .replace(/\//g, '-');

        promises.push(downloadFile(sites[i], destination + filename + '.html'));
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
  },

  compareDirectories(dir1, dir2) {
    const status = new Spinner('Compare directories...');
    status.start();

    dircompare.compare(dir1, dir2, compareOptions).then((res) => {
      if (res.same) {
        console.log(chalk.green('Directories are same! Awesome!'));
      } else {
        console.log(chalk.red('Directories are different!'));
      }
    });
    status.stop();
  },
};
