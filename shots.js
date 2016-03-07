'use strict';

const webshot = require('webshot');
const fs = require('fs');
const path = require('path');
const resemble = require('node-resemble-js');
const rimraf = require('rimraf');

const run = (config) => {
  const takeShot = (shotConfig) => {
    return new Promise((resolve, reject) => {
      webshot(shotConfig.url, shotConfig.outputPath, {
        windowSize: {
          width: config.width,
          height: config.height
        },
        shotSize: {
          width: config.width,
          height: 'all'
        },
        defaultWhiteBackground: false,
        phantomPath: 'slimerjs',
        phantomConfig: {
          'debug': 'false',
          'load-images': 'true'
        },
        quality: 75,
        streamType: 'png',
        captureSelector: '[data-test-component].' + shotConfig.className,
        timeout: 10000,
        errorIfStatusIsNot200: true
      }, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve(shotConfig);
        }
      });
    });
  };

  const comparePair = (pairOfShots) => {
    return new Promise((resolve) => {
      resemble(pairOfShots.local.outputPath).compareTo(pairOfShots.live.outputPath).onComplete((data) => {
        data.getDiffImage().pack().pipe(fs.createWriteStream('./shots/' + pairOfShots.local.className + '/diff.png'));
        pairOfShots.data = data;
        resolve(pairOfShots);
      });
    });
  };

  let promisesShots = [];
  let shots = [];

  const processSite = (site, component) => {
    let shotConfig = Object.assign({}, site, component);
    shotConfig.outputPath = './shots/' + shotConfig.className + '/' + shotConfig.siteLabel + '.png';
    promisesShots.push(takeShot(shotConfig));
    return shotConfig;
  };

  const printOutput = (results) => {
    results.forEach((result) => {
      console.log(result.local.label, ' - ', result.data.misMatchPercentage === '0.00' ? 'Identical' : result.data.misMatchPercentage + '% different');
    });

  };

  rimraf.sync('./shots');

  config.components.forEach((component) => {
    let pairOfShots = {};
    pairOfShots[config.site1.siteLabel] = processSite(config.site1, component);
    pairOfShots[config.site2.siteLabel] = processSite(config.site2, component);
    shots.push(pairOfShots)
  });

  Promise.all(promisesShots)
    .then(() => {
        const promises = [];
        shots.forEach((pairOfShots) => {
          promises.push(comparePair(pairOfShots));
        });
        Promise.all(promises)
          .then((results) => {
            printOutput(results);
          });
      },
      (err) => {
        console.log('Error: ', err);
      });
};

module.exports = run;

if (process.argv && process.argv.length >= 3) {
  try {
    const config = JSON.parse(fs.readFileSync(path.join(__dirname, process.argv[2]), {encoding: 'utf8'}));
    run(config);
  } catch (err) {
    console.log('Error: ' + err);
  }
}
