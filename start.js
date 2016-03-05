'use strict';

const webshot = require('webshot');
const fs = require('fs');
const resemble = require('node-resemble-js');

const takeShot = (shotConfig) => {
  return new Promise((resolve, reject) => {
    webshot(shotConfig.url, shotConfig.outputPath, {
      windowSize: {
        width: width,
        height: height
      },
      shotSize: {
        width: width,
        height: 'all'
      },
      defaultWhiteBackground: false,
      phantomPath: browser,
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

const sites = [
  {
    siteLabel: 'local',
    url: 'http://local.tescloud.com:5000/styleguide'
  },
  {
    siteLabel: 'live',
    url: 'http://www.tes.com/styleguide'
  }
];
const components = [
  {
    label: 'Header / Logo',
    className: 'header-logo'
  },
  {
    label: 'Social share icons',
    className: 'social-share'
  }

];
const width = 1024;
const height = 300;
const browser = 'slimerjs';

let promisesShots = [];
let shots = [];

components.forEach((component) => {
  let pairOfShots = {};
  sites.forEach((site) => {
    let shotConfig = Object.assign({}, site, component);
    shotConfig.outputPath = './shots/' + shotConfig.className + '/' + shotConfig.siteLabel + '.png';
    pairOfShots[shotConfig.siteLabel] = shotConfig;
    promisesShots.push(takeShot(shotConfig));
  });
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

