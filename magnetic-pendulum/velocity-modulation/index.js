var d3 = require('d3');

var pi = Math.PI;
var abs = Math.abs;
var sin = Math.sin;
var acos = Math.acos;
var random = Math.random;
var period = 2 * pi;

var zoneRadius = 5;
var transition = 1;

var mass = 8;
var initialVelocity = 1;

var kicker = {
  frequency: 0.5,
  strength: 2
};

var state = {
  position: -zoneRadius - transition,
  distanceSqr: 4,
  velocity: initialVelocity,
  time: 0
};

function force({position, time}) {
  if (position * position > zoneRadius * zoneRadius) return 0;
  return kicker.strength * sin(time * kicker.frequency * period);
}

function acceleration({position, time}) {
  return force({position, time}) / mass;
}

function solve(dt) {
  
  var midTime = state.time + dt / 2;
  
  var mid1Velocity = state.velocity + dt / 2 * acceleration(state);
  var mid1Position = state.position + dt / 2 * state.velocity;
  var mid1 = {
    time: midTime, 
    position: mid1Position,
    velocity: mid1Velocity
  };
  
  var mid2Velocity = state.velocity + dt / 2 * acceleration(mid1);
  var mid2Position = state.position + dt / 2 * mid1.velocity;
  var mid2 = {
    time: midTime, 
    position: mid2Position,
    velocity: mid2Velocity
  };
  
  var endTime = state.time + dt;
  var endVelocity = state.velocity + dt * acceleration(mid2);
  var endPosition = state.position + dt * mid2.velocity;
  var end = {
    time: endTime, 
    position: endPosition,
    velocity: endVelocity
  };
  
  var a = 0;
  a += 1 * acceleration(state);
  a += 2 * acceleration(mid1);
  a += 2 * acceleration(mid2);
  a += 1 * acceleration(end);
  
  var v = 0;
  v += 1 * state.velocity;
  v += 2 * mid1.velocity;
  v += 2 * mid2.velocity;
  v += 1 * end.velocity;
  
  state.time += dt;
  state.velocity += dt * a / 6;
  state.position += dt * v / 6;
  state.distance = abs(state.position) - zoneRadius;
  state.velocityChange = state.velocity - initialVelocity;
}

function opacity({distance}) {
  if (distance < 0) return 1;
  return 1 - distance / transition;
}

function timeShift() {
  if (state.time < 10) return 0;
  return state.time - 10;
}

var past = [];
function log() {
  var {time, position, velocityChange} = state;
  past.push({time, position, velocityChange});
  if (past.length > 100) past.shift();
}

var forceArea = d3.svg.area()
    .x( (d) => d.time - timeShift() )
    .y1( (d) => force(d) )
    .interpolate('monotone');

var velocityArea = d3.svg.area()
    .x( (d) => d.time - timeShift() )
    .y1( (d) => d.velocityChange * 10 )
    .interpolate('monotone');

function update() {
  var {time, position} = state;
  var force = sin(time * kicker.frequency * period);
  
  d3.select('#accelerate-right')
      .attr('opacity', force);
  d3.select('#accelerate-left')
      .attr('opacity', -force);
  
  d3.select('#bob')
      .attr('cx', position)
      .attr('opacity', opacity(state));
  
  d3.select('#force-area')
      .datum(past)
      .attr('d', forceArea);
  
  d3.select('#velocity-area')
      .datum(past)
      .attr('d', velocityArea);
}

function step(dt) {
  solve(dt);
  if ((state.position - zoneRadius) / transition > 1) {
    state.time = random() / kicker.frequency;
    state.velocity = 1 + random();
    initialVelocity = state.velocity;
    state.position = - zoneRadius - transition;
    past.length = 0;
    d3.timer(() => step(dt));
    return true;
  }
  log();
  update();
}


d3.timer(() => step(0.1));
