const { execSync } = require('child_process');
const { readFileSync, writeFileSync } = require('fs');
const path = require('path');

const setup = (config) => {
  let hook;

  try {
    hook = readFileSync(path.join(process.cwd(), '.git/hooks/commit-msg'));
  } catch (_) {
    hook = '';
  }

  const newHook = readFileSync(path.join(__dirname, '../../lib/commit-msg'));

  if (!config.notGerrit && hook.toString() !== newHook.toString()) {
    console.log('  - Making sure that gerrit pre-commit is in place');
    execSync('cp ../../lib/commit-msg .git/hooks/');
  }
};

const setupPrivateNPM = (config) => {
  if (typeof config.private === 'undefined' || typeof config.private.npm === 'undefined') {
    return;
  }

  const { url, nameSpace, email, userName } = config.private.npm;
  const privateRepo = url.replace(/^http(s)?:\/\//, '');
  const privateNPMTemplateAuthToken = `//registry.npmjs.org/=true
progress=false

${nameSpace}:registry=${url}
//${privateRepo}:_authToken=${process.env.NPM_PRIVATE_TOKEN}
`;


  console.log('  - Setting Up Private Npm');
  writeFileSync(path.resolve(path.join(process.env.HOME, '.npmrc')), privateNPMTemplateAuthToken);
};

module.exports = {
  setup,
  setupPrivateNPM
};
