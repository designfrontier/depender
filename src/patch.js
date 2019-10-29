const { execSync } = require('child_process');

const create = (cmd, deps, cwd) => {
  const message = `chore(dependencies): DEPENDER updates!

Updating the following dependencies:
${deps.reduce((a, i) => {
  return a + '- ' + i + '\n';
}, '')}

Test Plan:
- make sure that everything still builds
- make sure that you can use the some common
  flows in the app locally
- be done with it
- I am a robot
`;
  const cmds = cmd.split('&&');
  const command = cmds.reduce((s,i) => {
    return s + `'${i}' `;
  }, '');
  console.log(
    execSync(`. $HOME/.nvm/nvm.sh; nvm use && npm -v && node -v && /usr/src/app/lib/patch_command '${message}' ${command}`, {shall: '/bin/bash'}).toString()
  );
};

module.exports = {
  create
};
