var mod, Trianglify, Pattern;
mod = eval("typeof module !== 'undefined'?module:{};");
if(mod.exports) {
  d3 = require("d3");
  jsdom = require("jsdom");
  document = new (jsdom.level(1, "core").Document)();
  XMLSerializer = require("xmldom").XMLSerializer;
  btoa = require("btoa");
};
Trianglify = Trianglify || function Trianglify() {
  if(this.initialize) {
    this.initialize.apply(this, arguments);
  }
};
Trianglify.prototype.initialize = function(options) {
  var defaults;
  options = options || {};
  defaults = function(opt, def) {
    return opt || def;
  };
  this.options = {"cellsize": defaults(options.cellsize, 150),
    "bleed": defaults(options.cellsize, 150),
    "cellpadding": defaults(options.cellpadding, 0.1 * options.cellsize || 15),
    "noiseIntensity": defaults(options.noiseIntensity, 0.3),
    "x_gradient": defaults(options.x_gradient, Trianglify.randomColor()),
    "format": defaults(options.format, "svg"),
    "fillOpacity": defaults(options.fillOpacity, 1),
    "strokeOpacity": defaults(options.strokeOpacity, 1)};
  return this.options.y_gradient = options.y_gradient || this.options.x_gradient.map(function(c) {
    return d3.rgb(c).brighter(0.5);
  });
};
Trianglify.randomColor = function() {
  var keys, palette;
  keys = Object.keys(Trianglify.colorbrewer);
  palette = Trianglify.colorbrewer[keys[Math.floor(Math.random() * keys.length)]];
  keys = Object.keys(palette);
  return palette[keys[Math.floor(Math.random() * keys.length)]];
};
Trianglify.prototype.generate = function(width, height) {
  return new Trianglify.Pattern(this.options, width, height);
};
Pattern = Pattern || function Pattern() {
  if(this.initialize) {
    this.initialize.apply(this, arguments);
  }
};
Pattern.prototype.initialize = function(options, width, height) {
  this.options = options;
  this.width = width;
  this.height = height;
  this.polys = this.generatePolygons();
  this.svg = this.generateSVG();
  this.svgString = (new XMLSerializer()).serializeToString(this.svg);
  this.base64 = btoa(this.svgString);
  this.dataUri = "data:image/svg+xml;base64," + (this.base64) + "";
  return this.dataUrl = "url(" + (this.dataUri) + ")";
};
Pattern.prototype.append = function() {
  return document.body.appendChild(this.svg);
};
Pattern.gradient_2d = function(x_gradient, y_gradient, width, height) {
  return function(x, y) {
    var color_x, color_y;
    color_x = d3.scale.linear().range(x_gradient).domain(d3.range(0, width, width / x_gradient.length));
    color_y = d3.scale.linear().range(y_gradient).domain(d3.range(0, height, height / y_gradient.length));
    return d3.interpolateRgb(color_x(x), color_y(y))(0.5);
  };
};
Pattern.prototype.generatePolygons = function() {
  var options, cellsX, cellsY, vertices;
  options = this.options;
  cellsX = Math.ceil((this.width + options.bleed * 2) / options.cellsize);
  cellsY = Math.ceil((this.height + options.bleed * 2) / options.cellsize);
  vertices = d3.range(cellsX * cellsY).map(function(d) {
    var col, row, x, y;
    col = d % cellsX;
    row = Math.floor(d / cellsX);
    x = -options.bleed + col * options.cellsize + Math.random() * (options.cellsize - options.cellpadding * 2) + options.cellpadding;
    y = -options.bleed + row * options.cellsize + Math.random() * (options.cellsize - options.cellpadding * 2) + options.cellpadding;
    return [x, y];
  });
  return d3.geom.delaunay(vertices);
};
Pattern.prototype.append = function() {
  return document.body.appendChild(this.svg);
};
Pattern.prototype.generateSVG = function() {
  var options, color, elem, svg, group, filter, transfer, d, x, y, c;
  options = this.options;
  color = Trianglify.Pattern.gradient_2d(options.x_gradient, options.y_gradient, this.width, this.height);
  elem = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg = d3.select(elem);
  svg.attr("width", this.width);
  svg.attr("height", this.height);
  svg.attr("xmlns", "http://www.w3.org/2000/svg");
  group = svg.append("g");
  if(options.noiseIntensity > 0.01) {
    filter = svg.append("filter").attr("id", "noise");
    filter.append("feTurbulence").attr("type", "fractalNoise").attr("in", "fillPaint").attr("fill", "#F00").attr("baseFrequency", 0.7).attr("numOctaves", "10").attr("stitchTiles", "stitch");
    transfer = filter.append("feComponentTransfer");
    transfer.append("feFuncR").attr("type", "linear").attr("slope", "2").attr("intercept", "-.5");
    transfer.append("feFuncG").attr("type", "linear").attr("slope", "2").attr("intercept", "-.5");
    transfer.append("feFuncB").attr("type", "linear").attr("slope", "2").attr("intercept", "-.5");
    filter.append("feColorMatrix").attr("type", "matrix").attr("values", "0.3333 0.3333 0.3333 0 0 \n 0.3333 0.3333 0.3333 0 0 \n 0.3333 0.3333 0.3333 0 0 \n 0 0 0 1 0");
    svg.append("rect").attr("opacity", options.noiseIntensity).attr("width", "100%").attr("height", "100%").attr("filter", "url(#noise)");
  };
  var _i, _j = this.polys;
  for(_i in _j) {
    d = _j[_i];
    x = (d[0][0] + d[1][0] + d[2][0]) / 3;
    y = (d[0][1] + d[1][1] + d[2][1]) / 3;
    c = color(x, y);
    group.append("path").attr("d", "M" + d.join("L") + "Z").attr({"fill": c,
      "stroke": c}).attr("fill-opacity", options.fillOpacity).attr("stroke-opacity", options.strokeOpacity);
  };
  return svg.node();
};
Trianglify.Pattern = Pattern;
Trianglify.colorbrewer = colorbrewer;
;
if(typeof mod != "undefined" && mod.exports) {
  mod.exports = Trianglify;
};
