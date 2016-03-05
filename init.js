'use strict';

const webshot = require('webshot');
const fs = require('fs');
const path = require('path');
const resemble = require('node-resemble-js');

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
        captureSelector: '.' + shotConfig.className
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
    resemble(pairOfShots.local.outputPath).compareTo(pairOfShots.live.outputPath).onComplete((data) => {
      data.getDiffImage().pack().pipe(fs.createWriteStream('./shots/' + pairOfShots.local.className + '/diff.png'));
      console.log(pairOfShots.local.label, data.misMatchPercentage, data.isSameDimensions, (data.isSameDimensions && data.misMatchPercentage === '0.00') ? 'PASSED' : 'FAILED');
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

  config.components.forEach((component) => {
    let pairOfShots = {};
    pairOfShots[config.site1.siteLabel] = processSite(config.site1, component);
    pairOfShots[config.site2.siteLabel] = processSite(config.site2, component);
    shots.push(pairOfShots)
  });

  Promise.all(promisesShots)
    .then(() => {
      shots.forEach((pairOfShots) => {
        comparePair(pairOfShots);
      });
    })
    .catch((err) => {
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
