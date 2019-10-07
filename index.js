const { exec, execSync } = require('child_process');
const path = require('path');
const js = require('./src/js');

const config = require(path.join(process.cwd(), '.depender.config.json')); //TODO: make less brittle?

execSync('curl -Lo .git/hooks/commit-msg https://gerrit.instructure.com/tools/hooks/commit-msg')

// update the js
js.update(config);
