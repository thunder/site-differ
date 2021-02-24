const inquirer = require('inquirer');

module.exports = {
  askSiteUrl: () => {
    const questions = [
      {
        name: 'siteUrl',
        type: 'input',
        message: 'Enter the sitemap URL of the site you want to compare:',
        validate: function (value) {
          if (validURL(value)) {
            return true;
          } else {
            return 'This is not a valid URL.';
          }
        },
      },
    ];
    return inquirer.prompt(questions);
  },
};

function validURL(str) {
  var pattern = new RegExp(
    '^(https?:\\/\\/)?' + // protocol
      '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
      '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
      '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
      '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
      '(\\#[-a-z\\d_]*)?$',
    'i',
  ); // fragment locator
  return !!pattern.test(str);
}
