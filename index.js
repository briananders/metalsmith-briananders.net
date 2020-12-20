'use strict';

require('colors');

const dir = {
  root: `${__dirname}/`,
  src: `${__dirname}/src/`,
  package: `${__dirname}/package/`,
  build: `${__dirname}/build/`,
  jsOutputPath: `${__dirname}/package/scripts/`,
  nodeModules: `${__dirname}/node_modules/`,
};

const completionFlags = {
  JS_IS_MINIFIED: false,
  CSS_IS_MINIFIED: false,
  HTML_IS_MINIFIED: false,
  IMAGES_ARE_MOVED: false,
  ASSET_HASH: {
    IMAGES: false,
    CSS: false,
    JS: false,
    DONE: false,
  },
  SITE_MAP: false,
  IMAGE_COMPRESSION: false,
  GZIP: false,
};

const debug = process.argv.includes('--verbose');

const timestamp = require(`${dir.build}timestamp`);
const fs = require('fs-extra');
const chokidar = require('chokidar');
const express = require('express');
const serve = require('express-static');
const EventEmitter = require('events');
const production = require(`${dir.build}production`);
const app = express();
const buildEvents = new EventEmitter();
const { exec } = require('child_process');

const hashingFileNameList = {};
const pageMappingData = [];

const configs = {
  buildEvents,
  completionFlags,
  debug,
  dir,
  hashingFileNameList,
  pageMappingData,
};

// /////////////////////////////// compile tasks /////////////////////////////////

const bundleSCSS = require(`${dir.build}bundle-scss`);
const bundleJS = require(`${dir.build}bundle-js`);
const bundleEJS = require(`${dir.build}bundle-ejs`);
const compilePageMappingData = require(`${dir.build}page-mapping-data`);
const moveImages = require(`${dir.build}move-images`);
const assetHashing = require(`${dir.build}asset-hashing`);
const hashCSS = require(`${dir.build}hash-css`);
const updateCSSwithImageHashes = require(`${dir.build}update-css-with-image-hashes`);
const finishHashing = require(`${dir.build}finish-hashing`);
const minifyJS = require(`${dir.build}minify-js`);
const minifyHTML = require(`${dir.build}minify-html`);
const sitemap = require(`${dir.build}sitemap`);
const compressImages = require(`${dir.build}compress-images`);
const gzipFiles = require(`${dir.build}gzip-files`);
const checkDone = require(`${dir.build}check-done`);

// /////////////////////////////////////// event listeners ////////////////////////////////////////

buildEvents.on('page-mapping-data-compiled', bundleEJS.bind(this, configs));
buildEvents.on('page-mapping-data-compiled', sitemap.bind(this, configs));

if (!production) {
  chokidar.watch(`${dir.src}js/`).on('change', (evt, file) => {
    if (debug) console.log(`${timestamp.stamp()}: File modified: JavaScript: ${file}`.yellow);
    bundleJS(configs);
  });

  chokidar.watch(`${dir.src}styles/`).on('change', (evt, file) => {
    if (debug) console.log(`${timestamp.stamp()}: File modified: SCSS: ${file}`.yellow);
    bundleSCSS(configs);
  });

  chokidar.watch(`${dir.src}templates/`).on('change', (evt, file) => {
    if (debug) console.log(`${timestamp.stamp()}: File modified: Template: ${file}`.yellow);
    compilePageMappingData(configs);
  });

  chokidar.watch(`${dir.src}partials/`).on('change', (evt, file) => {
    if (debug) console.log(`${timestamp.stamp()}: File modified: Partial: ${file}`.yellow);
    compilePageMappingData(configs);
  });

  chokidar.watch(`${dir.src}layout/`).on('change', (evt, file) => {
    if (debug) console.log(`${timestamp.stamp()}: File modified: Layout: ${file}`.yellow);
    compilePageMappingData(configs);
  });

  chokidar.watch(`${dir.src}images/`).on('change', (evt, file) => {
    if (debug) console.log(`${timestamp.stamp()}: File modified: image: ${file}`.yellow);
    moveImages(configs);
  });
  chokidar.watch(`${dir.build}`).on('change', (evt, file) => {

    console.log(`${timestamp.stamp()}: Build file modified: ${file}\n\nRestart the server`.red);
    process.exit();
  });
} else {
  buildEvents.on('templates-moved', minifyHTML.bind(this, configs));
  buildEvents.on('js-moved', minifyJS.bind(this, configs));
  buildEvents.on('styles-moved', assetHashing.bind(this, configs));
  buildEvents.on('js-minified', assetHashing.bind(this, configs));
  buildEvents.on('html-minified', assetHashing.bind(this, configs));
  buildEvents.on('images-moved', assetHashing.bind(this, configs));
  buildEvents.on('images-moved', compressImages.bind(this, configs));
  buildEvents.on('asset-hash-images-listed', updateCSSwithImageHashes.bind(this, configs));
  buildEvents.on('index-css-for-hashing', hashCSS.bind(this, configs));
  buildEvents.on('asset-hash-js-listed', finishHashing.bind(this, configs));
  buildEvents.on('asset-hash-css-listed', finishHashing.bind(this, configs));
  buildEvents.on('asset-hash-images-listed', finishHashing.bind(this, configs));
  buildEvents.on('hashing-done', gzipFiles.bind(this, configs));
  buildEvents.on('gzip-done', checkDone.bind(this, configs));
  buildEvents.on('hashing-done', checkDone.bind(this, configs));
  buildEvents.on('sitemap-done', checkDone.bind(this, configs));
  buildEvents.on('image-compression-done', checkDone.bind(this, configs));
}

/* ////////////////////////////////////////////////////////////////////////// */
/* ////////////////////////////// initializers ////////////////////////////// */
/* ////////////////////////////////////////////////////////////////////////// */

const clean = new Promise((resolve, reject) => {
  console.log(`${timestamp.stamp()}: clean()`);

  exec(`rm -rf ${dir.package}**`, (error) => {
    if (error) {
      console.log(error);
      reject();
    } else {
      resolve();
    }
  });
});

console.log(`production: ${production}`);

clean.then(() => {
  if (debug) console.log(`${timestamp.stamp()}: clean.then()`);
  fs.mkdirp(dir.package);
  compilePageMappingData(configs);
  bundleJS(configs);
  bundleSCSS(configs);
  moveImages(configs);
});

if (!production) {
  app.use(serve(dir.package));

  const server = app.listen(3000, () => {
    console.log(`${timestamp.stamp()}: server is running at %s`, server.address().port);
    console.log('If on chrostini, run `hostname -I` to get the localhost IP address');
  });
}
