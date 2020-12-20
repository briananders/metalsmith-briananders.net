const { isDarkMode } = require('../_modules/dark-mode');

module.exports = {
  init() {
    let canvasContext;
    let canvas;
    let circles = [];
    let borderStyle;
    let alphaBorder;
    let fillStyle;
    let alphaFill;
    let clearButton;
    let eraseButton;
    let paused = true;
    let pauseButton;

    function ColorObject() {
      function randomColor() {
        const color = Math.floor(Math.random() * 128);
        return (isDarkMode) ? color + 128 : color;
      }

      const alpha = Math.random();
      const red = randomColor();
      const green = randomColor();
      const blue = randomColor();
      const average = Math.floor((red + green + blue) / 3);

      this.alpha = alpha;
      this.rgb = () => `rgba(${red},${green},${blue},${this.alpha})`;
      this.gray = () => `rgba(${average},${average},${average},${this.alpha})`;
      this.random = () => `rgba(${randomColor()},${randomColor()},${randomColor()},${this.alpha})`;
      this.resetAlpha = () => {
        this.alpha = alpha;
      };
    }

    // Circle Class
    function Circle(x, y) {
      // position and size
      if (x === undefined) {
        x = 1;
      }
      if (y === undefined) {
        y = 1;
      }
      const radius = Math.floor(Math.random() * 50);

      // color
      const fill = new ColorObject();
      const border = new ColorObject();

      // speed
      const speed = (Math.random() * 50) + 50;
      let xVelocity = (Math.random() - 0.5) * speed;
      let yVelocity = (Math.random() - 0.5) * speed;


      this.draw = () => {
        canvasContext.beginPath();
        canvasContext.arc(x, y, radius, 0, 2 * Math.PI, false);

        switch (fillStyle.value) {
          case 'no-fill':
            canvasContext.fillStyle = 'rgba(0,0,0,0)';
            break;
          case 'fill-gray':
            canvasContext.fillStyle = fill.gray();
            break;
          case 'fill-color':
            canvasContext.fillStyle = fill.rgb();
            break;
          case 'epileptic':
            canvasContext.fillStyle = fill.random();
            break;
          default:
        }

        canvasContext.fill();

        if (borderStyle.value !== 'no-border') {
          canvasContext.lineWidth = '1px';

          switch (borderStyle.value) {
            case 'border-black':
              canvasContext.strokeStyle = `rgba(0,0,0,${border.alpha})`;
              break;
            case 'border-gray':
              canvasContext.strokeStyle = border.gray();
              break;
            case 'border-color':
              canvasContext.strokeStyle = border.rgb();
              break;
            case 'epileptic':
              canvasContext.strokeStyle = border.random();
              break;
            default:
          }
          canvasContext.stroke();
        }

        canvasContext.closePath();
      };


      this.update = () => {
        if ((y + yVelocity) < radius) {
          yVelocity = Math.abs(yVelocity);
        } else if ((y + yVelocity) > (canvas.height - radius)) {
          yVelocity = 0 - Math.abs(yVelocity);
        }

        y += yVelocity;

        if ((x + xVelocity) < radius) {
          xVelocity = Math.abs(xVelocity);
        } else if ((x + xVelocity) > (canvas.width - radius)) {
          xVelocity = 0 - Math.abs(xVelocity);
        }

        x += xVelocity;
      };


      this.updateAlphaBorder = () => {
        if (alphaBorder.checked) {
          border.resetAlpha();
        } else {
          border.alpha = 1;
        }
      };


      this.updateAlphaFill = () => {
        if (alphaFill.checked) {
          fill.resetAlpha();
        } else {
          fill.alpha = 1;
        }
      };

      this.updateAlphaBorder();
      this.updateAlphaFill();
    }


    // //////////////////////////////////////////////////////////////////////////////
    // //////////////////////////////////////////////////////////////////////////////
    // //////////////////////////// PRIVATE FUNCTIONS ///////////////////////////////
    // //////////////////////////////////////////////////////////////////////////////
    // //////////////////////////////////////////////////////////////////////////////


    function updateAlphaBorder() {
      let i = circles.length;

      while (i) {
        circles[--i].updateAlphaBorder();
      }
    }


    function updateAlphaFill() {
      let i = circles.length;

      while (i) {
        circles[--i].updateAlphaFill();
      }
    }


    function setCanvasDimensions() {
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
    }


    function update() {
      let i = circles.length;

      while (i) {
        circles[--i].update();
      }
    }


    function drawCanvas() {
      canvasContext.save();

      let i = circles.length;

      while (i) {
        circles[--i].draw(canvasContext);
      }

      canvasContext.restore();
    }


    function draw() {
      let i = 2;
      while (i--) {
        update();
        drawCanvas();
      }

      if (!paused) {
        window.setTimeout(draw, 0);
      }
    }


    function pauseUnpause() {
      const pauseCache = paused;

      if (circles.length < 1) {
        paused = true;
        return;
      }

      paused = !paused;
      if (!paused) {
        window.setTimeout(draw, 0);
      }

      if (pauseCache !== paused) {
        if (paused) {
          pauseButton.classList.add('paused');
        } else {
          pauseButton.classList.remove('paused');
        }
      }
    }


    function createCircle(e) {
      circles.push(new Circle(e.x, e.y));

      if (circles.length === 1) {
        pauseUnpause();
      }
    }


    function erase() {
      setCanvasDimensions();
      drawCanvas();
    }


    function clear() {
      canvasContext.clearRect(0, 0, canvas.width, canvas.height);
      circles = [];
      pauseUnpause();
    }


    function addEventListeners() {
      const supportsOrientationChange = 'onorientationchange' in window;
      const orientationEvent = supportsOrientationChange ? 'orientationchange' : 'resize';

      window.addEventListener(orientationEvent, erase, false);

      alphaBorder.addEventListener('change', updateAlphaBorder, false);
      alphaFill.addEventListener('change', updateAlphaFill, false);

      canvas.addEventListener('click', createCircle, false);
      pauseButton.addEventListener('click', pauseUnpause, false);
      clearButton.addEventListener('click', clear, false);
      eraseButton.addEventListener('click', erase, false);
    }


    function initialize() {
      borderStyle = document.getElementById('border-style');
      alphaBorder = document.getElementById('alpha-border');
      fillStyle = document.getElementById('fill-style');
      alphaFill = document.getElementById('alpha-fill');
      pauseButton = document.getElementById('pause-button');
      clearButton = document.getElementById('clear-button');
      eraseButton = document.getElementById('erase-button');
      canvas = document.getElementById('canvas');

      canvasContext = canvas.getContext('2d');

      addEventListeners();
      setCanvasDimensions();
    }


    window.addEventListener('load', initialize, false);
  },
};
