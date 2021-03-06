import prompts from 'prompts';

const validURL = (str) => {
  const pattern = new RegExp(
    '^(https?:\\/\\/)?' + // protocol
      '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
      '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
      '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
      '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
      '(\\#[-a-z\\d_]*)?$',
    'i',
  ); // fragment locator
  return !!pattern.test(str);
};

const askSiteUrl = (answers) => {
  prompts.override(answers);
  return prompts({
    type: 'text',
    name: 'url',
    message: 'Enter the sitemap URL of the site you want to compare?',
    validate(value) {
      if (validURL(value)) {
        return true;
      }
      return 'This is not a valid URL.';
    },
  });
};

export default askSiteUrl;
