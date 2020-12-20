const fs = require('fs-extra');
const glob = require('glob');
const path = require('path');
const mkdirp = require('mkdirp');
const merge = require('merge');
const ejs = require('ejs');
const matter = require('gray-matter');
const notifier = require('node-notifier');
const util = require('util');
const readFile = util.promisify(fs.readFile);

function handleTemplateError(e) {
  console.error(e.message.red);
  notifier.notify({
    title: 'Template Error',
    message: e.message,
  });
  return `
    <html>
      <head></head>
      <body>
        <h1>There was an error.</h1>
        <div style="color: red; font-family: monospace;">
          ${
  e.message
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/\n/g, '<br>')
    .replace(/\s\s/g, '&nbsp;&nbsp;')
}
        </div>
      </body>
    </html>`;
}

async function renderTemplate({
  templatePath,
  ejsFunctions,
  siteData,
  dir,
  production,
  ejsOptions,
  pagePath,
  frontMatter,
}) {
  return new Promise((resolve, reject) => {
    const templateData = merge({}, ejsFunctions, siteData, frontMatter.data, { path: pagePath });

    if (!production && !templateData.layout) {
      const errorMessage = `You are missing a template definition in ${templatePath}`;
      console.error(errorMessage.red);
      notifier.notify({
        title: 'Template undefined',
        message: errorMessage,
      });
      reject();
    }

    readFile(`${dir.src}layout/${templateData.layout}.ejs`).catch((error) => {
      if (error && production) throw error;
      else if (error) {
        console.error(error.message.red);
        notifier.notify({
          title: 'Template Error',
          message: error.message,
        });
        reject();
      }
    }).then(async (fileBuffer) => {
      const fileData = fileBuffer.toString();
      let html;
      try {
        const renderedTemplate = ejs.render(frontMatter.content, templateData, ejsOptions);
        html = ejs.render(fileData, merge({ content: renderedTemplate }, templateData), ejsOptions);
      } catch (e) {
        html = handleTemplateError(e);
      }

      if (matter.test(html)) {
        const nextFrontMatter = matter(html);
        frontMatter.content = nextFrontMatter.content;
        frontMatter.data = merge({}, frontMatter.data, nextFrontMatter.data);
        html = await renderTemplate({
          templatePath,
          ejsFunctions,
          siteData,
          dir,
          production,
          ejsOptions,
          pagePath,
          frontMatter,
        });
      }
      resolve(html);
    });
  });
}

module.exports = async function bundleEJS({ dir, buildEvents, pageMappingData, debug }) {
  const siteData = require(`${dir.build}site-data`)(dir);
  const timestamp = require(`${dir.build}timestamp`);
  const templateGlob = glob.sync(`${dir.src}templates/**/[^_]*.ejs`);
  const production = require(`${dir.build}production`);

  console.log(`${timestamp.stamp()}: bundleEJS()`);
  console.log(`${timestamp.stamp()}: compileEJSTemplates()`);

  let processed = 0;

  for (let index = 0; index < templateGlob.length; index++) {
    const templatePath = templateGlob[index];
    if (debug) console.log(`${timestamp.stamp()}: ${'REQUEST'.magenta} - Compiling Template - ${templatePath.split(/templates/)[1]}`);
    const ejsFunctions = require(`${dir.build}ejs-functions`)(dir, pageMappingData);
    const ejsOptions = {
      compileDebug: true,
      filename: templatePath,
      root: `${dir.src}templates/`,
    };
    const outputPath = templatePath.replace(`${dir.src}templates/`, dir.package).replace(/\.ejs$/, (templatePath.includes('.html.ejs')) ? '' : '/index.html');
    const pagePath = outputPath.replace(dir.package, '').replace('index.html', '');
    const frontMatter = matter.read(templatePath);

    const html = await renderTemplate({
      templatePath,
      ejsFunctions,
      siteData,
      dir,
      production,
      ejsOptions,
      pagePath,
      frontMatter,
    }).catch((err) => {
      if (err && production) throw err;
      else if (err) {
        console.error(err.message.red);
        notifier.notify({
          title: 'Template Error',
          message: err.message,
        });
      }
      processed++;
    });

    mkdirp(path.dirname(outputPath), (err) => {
      if (err) throw err;

      fs.writeFile(outputPath, html, (e) => {
        if (e) throw e;

        if (debug) console.log(`${timestamp.stamp()}: ${'SUCCESS'.green} - Compiled Template - ${outputPath.split(/package/)[1]}`);
        processed++;

        if (processed >= templateGlob.length) {
          console.log(`${timestamp.stamp()}: ${'TEMPLATES DONE'.green.bold}`);
          buildEvents.emit('templates-moved');
        }
      });
    });
  }
};
