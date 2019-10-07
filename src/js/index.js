const { exec, execSync } = require('child_process');
const { existsSync } = require('fs');
const path = require('path');
const ncu = require('npm-check-updates');
const semverDiff = require('semver-diff');
const { coerce } = require('semver');
const { create } = require('../patch');

const isNpm = () => {
  return existsSync(path.join(process.cwd(), 'package-lock.json'));
};

const saveCommand = (dev) => {
  if (isNpm()) {
    return `npm i ${dev ? '--save-dev' : '--save'}`;
  }

  return `yarn add ${dev ? '--dev' : ''}`;
};

const update = (config) => {
  ncu.run({
      jsonUpgraded: true,
      upgrade: false
  }).then((upgraded) => {
    const pack = require(path.join(process.cwd(), 'package.json'));
    const deps = {...pack.dependencies, ...pack.devDependencies};
    const upgrades = Object.keys(upgraded).map(k => {
      console.log(k, coerce(deps[k]).version, coerce(upgraded[k]).version);
      const diff = semverDiff(coerce(deps[k]).version, coerce(upgraded[k]).version);
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
      patch: {
        dev: upgrades.filter(i => i.type === 'patch' && i.dev),
        dep: upgrades.filter(i => i.type === 'patch' && !i.dev)
      },
      minor: {
        dev: upgrades.filter(i => i.type === 'minor' && i.dev),
        dep: upgrades.filter(i => i.type === 'minor' && !i.dev)
      },
      major: {
        dev: upgrades.filter(i => i.type === 'major' && i.dev),
        dep: upgrades.filter(i => i.type === 'major' && !i.dev)
      }
    };

    if(!config.seperatePatches.includes('patch')) {
      const devCmd = groups.patch.dev.reduce((cmd, item) => {
        return `${cmd} ${item.dependency}@${item.upgrade}`;
      }, `${saveCommand(true)}`);

      create(groups.patch.dep.reduce((cmd, item) => {
        return `${cmd} ${item.dependency}@${item.upgrade}`;
      }, `${devCmd} && ${saveCommand(false)}`));
    } else {
      //create a patch for each update
      groups.patch.dev.forEach((item) => {
        create(`${saveCommand(true)} ${item.dependency}@${item.upgrade}`);
      });

      groups.patch.dep.forEach((item) => {
        create(`${saveCommand(false)} ${item.dependency}@${item.upgrade}`);
      });
    }

    // groups.patch.forEach(d => {
    //   const save = d.dev ? '--save-dev' : '--save';
    //   execSync(`npm i ${save} ${d.dependency}@${d.upgrade}`); // TODO merge into a string not exec each one
    // });

    // patch for each major upgrade
    console.log('dependencies to upgrade:', config);
  });
};

module.exports = {
  update
};
