const { exec, execSync } = require('child_process');
const path = require('path');
const ncu = require('npm-check-updates');
const semverDiff = require('semver-diff');

const config = require(path.join(process.cwd(), '.depender.config.json')); //TODO: make less brittle?

ncu.run({
    jsonUpgraded: true,
    packageManager: 'npm', // check for yarn vs. npm
    upgrade: false
}).then((upgraded) => {
  const pack = require(path.join(process.cwd(), 'package.json'));
  const deps = {...pack.dependencies, ...pack.devDependencies};

  const upgrades = Object.keys(upgraded).map(k => {
    const diff = semverDiff(deps[k].replace(/[^~]/, ''), upgraded[k].replace(/[^~]/, ''));
    return {
      dependency: k,
      dev: typeof pack.devDependencies[k] !== 'undefined',
      current: deps[k],
      upgrade: upgraded[k],
      type: diff
    };
  });

  // group all the patch level upgrades
  const groups = {
    patch: upgrades.filter(i => i.type === 'patch'),
    minor: upgrades.filter(i => i.type === 'minor'),
    major: upgrades.filter(i => i.type === 'major')
  };

  groups.patch.forEach(d => {
    const save = d.dev ? '--save-dev' : '--save';
    execSync(`npm i ${save} ${d.dependency}@${d.upgrade}`); // TODO merge into a string not exec each one
  });

  // patch for each major upgrade
  console.log('dependencies to upgrade:', config);
});