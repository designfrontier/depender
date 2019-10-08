const { exec, execSync } = require('child_process');
const { existsSync } = require('fs');
const path = require('path');
const ncu = require('npm-check-updates');
const semverDiff = require('semver-diff');
const { coerce } = require('semver');
const { create } = require('../patch');

const isNpm = (cwd) => {
  return existsSync(path.join(cwd, 'package-lock.json'));
};

const saveCommand = (dev, cwd) => {
  if (isNpm(cwd)) {
    return `npm i --save-exact ${dev ? '--save-dev' : '--save'}`;
  }

  return `yarn add --exact ${dev ? '--dev' : ''}`;
};

const update = (config) => {
  const packageFile = path.resolve(path.join(config.cwd, 'package.json'));

  ncu.run({
      jsonUpgraded: true,
      upgrade: false,
      packageFile: packageFile
  }).then((upgraded) => {
    const pack = require(packageFile);
    const deps = {...pack.dependencies, ...pack.devDependencies};
    const upgrades = Object.keys(upgraded).map(k => {
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

    Object.keys(groups).forEach((grp) => {
      if(!config.seperatePatches.includes(grp)) {
        const changedDeps = Object.values({...groups[grp].dev, ...groups[grp.dep]}).reduce((a,i) => {
          a.push(i.dependency);

          return a;
        }, []);

        const devCmd = groups[grp].dev.reduce((cmd, item) => {
          return `${cmd} ${item.dependency}@${item.upgrade}`;
        }, `${saveCommand(true, config.cwd)}`);

        create(groups[grp].dep.reduce((cmd, item) => {
          return `${cmd} ${item.dependency}@${item.upgrade}`;
        }, `${devCmd} && ${saveCommand(false, config.cwd)}`), changedDeps, config.cwd);
      } else {
        //create a patch for each update
        groups[grp].dev.forEach((item) => {
          create(`${saveCommand(true, config.cwd)} ${item.dependency}@${item.upgrade}`, [item.dependency], config.cwd);
        });

        groups[grp].dep.forEach((item) => {
          create(`${saveCommand(false, config.cwd)} ${item.dependency}@${item.upgrade}`, [item.dependency], config.cwd);
        });
      }
    });

    console.log(`   -Updated: ${groups.patch.dev.length + groups.patch.dep.length} Patch, ${groups.minor.dev.length + groups.minor.dep.length} Minor, and ${groups.major.dev.length + groups.major.dep.length} Major`);
  });
};

module.exports = {
  update
};
