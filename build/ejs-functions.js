const ejs = require('ejs');
const fs = require('fs');
const hljs = require('highlight.js');
const merge = require('merge');

function squeakyClean(arr) {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] == null || arr[i] === '') {
      arr.splice(i, 1);
    }
  }
  return arr;
}

module.exports = (dir, pageMappingData) => ({
  partial(path, data) {
    const newPath = `${dir.src}partials/${path}.ejs`;

    return ejs.render(fs.readFileSync(newPath).toString(), data, {
      compileDebug: true,
    });
  },

  getChildPages(parentPath) {
    return pageMappingData.filter((page) => {
      const splitUrl = page.url.split('/');
      squeakyClean(splitUrl);
      const iOf = splitUrl.indexOf(parentPath);
      const len = splitUrl.length - 1;
      if (parentPath === '') {
        return len === 0 && !page.url.includes('.html');
      } if (iOf === -1) {
        return false;
      } if (len - iOf === 1) {
        return true;
      }
      return false;
    });
  },

  formattedDate(dateString) {
    const monthName = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December'
    ];
    const date = new Date(dateString);
    const month = monthName[date.getMonth()];
    return `${month} ${date.getFullYear()}`;
  },

  noWidows(str) {
    return str.replace(/\s([^\s]+)$/, '&nbsp;$1');
  },

  code(block, locals = {
    class: '', style: '', label: '', language: '',
  }) {
    // https://github.com/highlightjs/highlight.js/blob/master/SUPPORTED_LANGUAGES.md
    const highlightedCode = (locals.language)
      ? hljs.highlight(locals.language, block).value
      : hljs.highlightAuto(block).value;
    const labelMarkup = (locals.label && locals.label.length) ? `<label class="code-label">${locals.label}</label>` : '';
    return `
      ${labelMarkup}
      <div class="code-container ${locals.class}" style="${locals.style}"><code>${highlightedCode}</code></div>
    `;
  },

  link(str, locals) {
    if (!locals.href) {
      throw new Error('externalLink is missing href attribute');
    }
    return `<a itemprop="url"
    ${Object.keys(locals).map((attr) => `${attr}="${locals[attr]}"`).join(' ')}>${str}</a>`;
  },

  externalLink(str, locals) {
    return this.link(str, merge(locals, { rel: 'noopener', target: 'blank' }));
  },
});
