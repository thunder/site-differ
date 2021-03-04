import fs from 'fs';
import Ora from 'ora';
import chalk from 'chalk';
import dircompare from 'dir-compare';

const fileExists = (dir) => fs.existsSync(dir);

const createDirectory = (dir) => fs.mkdirSync(dir, { recursive: true });

const filesInDirectory = (dir) => fs.readdirSync(dir).length;

const removeDirectory = (dir) => fs.rmdirSync(dir, { recursive: true });

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

  const status = new Ora('Compare directories...').start();

  dircompare.compare(dir1, dir2, compareOptions).then((result) => {
    status.stop();
    if (result.same) {
      console.log(chalk.green('Directories are same! Awesome!'));
    } else {
      const array = [];
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

const getDirectoryPath = (url) => {
  const urlObject = new URL({ toString: () => url });

  return {
    dir1: `./downloads/${urlObject.host}_1/`,
    dir2: `./downloads/${urlObject.host}_2/`,
  };
};

const prepareDirectory = (dir, cleanup = false) => {
  if (cleanup) {
    removeDirectory(dir);
  }
  if (!fileExists(dir)) {
    createDirectory(dir);
  }
};

export {
  fileExists,
  filesInDirectory,
  compareDirectories,
  getDirectoryPath,
  prepareDirectory,
};
