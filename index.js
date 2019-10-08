const { execSync } = require('child_process');
const path = require('path');
const languages = require('./src/languages');
const { setup, setupPrivateNPM } = require('./src/setup');
const { header } = require('./src/header');
const chalk = require('chalk');

const setupEnv = () => {
  console.log(' - SETTING UP THE CONTAINER');
  execSync(`echo "${Buffer.from(process.env.SSH_KEY, 'base64').toString('utf8')}" > ~/.ssh/id_rsa`);
  execSync('chmod 400 ~/.ssh/id_rsa');

  execSync('mkdir tmp');
  process.chdir(path.join(process.cwd(), 'tmp'));
  console.log(' - DONE SETTING UP THE CONTAINER');
};

const processRepo = (repoUrl) => {
  let config;

  console.log(` - PROCESSING: ${repoUrl}`);
  execSync(`../lib/clone_repo`);
  process.chdir(path.join(process.cwd(), repoUrl.split('/').pop().replace('.git', '')));

  try {
    config = require(path.join(process.cwd(), '.depender.config.json'));
  } catch (_) {
    config = {
      "seperatePatches": ["major"],
      "languages": ["js"]
    };
  }

  config.cwd = process.cwd();

  if (typeof config.languages === 'undefined') {
    config.languages = ['js'];
  }

  // setup stuff
  setup(config);
  setupPrivateNPM(config);

  // update the deps
  config.languages.forEach(lang => {
    console.log(`  - updating the ${chalk.bold(lang)} deps`);
    languages[lang].update(config);
  });
};

console.log(header);
setupEnv();
processRepo(process.env.REPO_URL);
