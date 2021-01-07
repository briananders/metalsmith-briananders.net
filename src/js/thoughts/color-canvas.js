module.exports = {
  init() {
    const steps = 256; // squares per color spectrum
    const squareMax = 256;
    const blueSlider = document.getElementById('blue-slider');
    const canvas = document.getElementById('canvas');
    const context = canvas.getContext('2d');
    let canSlide = false;
    let blue;

    blueSlider.setAttribute('step', squareMax / steps);
    blueSlider.setAttribute('max', squareMax);

    function setCanvasDimensions() {
      canvas.width = steps;
      canvas.height = steps;
    }

    function draw(r, g, b) { // 0-256 for each
      context.fillStyle = `rgb(${r},${g},${b})`;
      context.fillRect(
        (r / squareMax) * steps,
        (g / squareMax) * steps,
        1,
        1,
        false
      );
    }

    function drawLoop(b) {
      let r = 0;
      let g = 0;

      while (g <= squareMax) {
        r = 0;
        while (r <= squareMax) {
          draw(r, g, b);
          r += Math.floor(squareMax / steps);
        }
        g += Math.floor(squareMax / steps);
      }
    }

    function updateSlider() {
      const newBlue = Number(blueSlider.value);
      if (newBlue !== blue) {
        blue = newBlue;
        drawLoop(blue);
      }
      if (canSlide) window.requestAnimationFrame(updateSlider);
    }

    function slideOn() {
      canSlide = true;
      updateSlider();
    }

    function slideOff() {
      canSlide = false;
    }

    blueSlider.addEventListener('mousedown', slideOn);
    blueSlider.addEventListener('touchstart', slideOn);
    blueSlider.addEventListener('mouseup', slideOff);
    blueSlider.addEventListener('touchend', slideOff);

    setCanvasDimensions();
    updateSlider();
  },
};

