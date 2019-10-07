const { exec, execSync } = require('child_process');
const ncu = require('npm-check-updates');

ncu.run({
    // Any command-line option can be specified here.
    // These are set by default:
    jsonUpgraded: true,
    packageManager: 'npm', // check for yarn vs. npm
    upgrade: true // TODO: maybe have this false and update manually
}).then((upgraded) => {
    console.log('dependencies to upgrade:', upgraded);
});