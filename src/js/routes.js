module.exports = {
  '*': require('./all'),
  '/': require('./homepage'),
  thoughts: {
    paint: require('./thoughts/paint'),
    minesweeper: require('./thoughts/minesweeper/index'),
    'using-canvas-to-make-patterns-with-circles': require('./thoughts/using-canvas'),
    'unique-stars': require('./thoughts/unique-stars'),
    'raining-paint': require('./thoughts/raining-paint'),
    'lissajous-curve': require('./thoughts/lissajous-curve'),
    'last-fm': require('./thoughts/last-fm'),
    'how-to-remove-spaces-around-inline-block-elements': require('./thoughts/how-to-remove-spaces-around-inline-block-elements'),
    'earth-rotating-sprite-animation': require('./thoughts/earth-rotating-sprite-animation'),
    'color-canvas': require('./thoughts/color-canvas'),
    'cellular-automaton': require('./thoughts/cellular-automaton'),
    '2d-automaton': require('./thoughts/2d-automaton'),
  },
};
