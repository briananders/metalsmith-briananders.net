const inView = require('../_modules/in-view');

const inViewOutOfView = (element, isInView) => {
  element.setAttribute('in-view', isInView);
};

module.exports = {
  init() {
    const querySelector = 'h1, h2, h3, h4, h5, h6, p';
    Array.from(document.querySelectorAll(querySelector)).forEach((element) => {
      inView(element, inViewOutOfView, {
        rootMargin: '-70px 0px -20px 0px',
      });
    });
  },
};
