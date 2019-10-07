const { exec, execSync } = require('child_process');

const create = (cmd) => {
  const message = 'DEPENDER is updating the deps'; // TODO make this better

  execSync(cmd);

  execSync(`git commit -a -m "${message}"`);
};

module.exports = {
    create
};
