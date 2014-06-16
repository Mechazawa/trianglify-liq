:[allow Math Object require eval d3 document jsdom XMLSerializer btoa colorbrewer]

# module is a keyword. This should fix that for us
mod = eval("typeof module !== 'undefined'?module:{};")
if (mod.exports) {
    d3 = require("d3")
    jsdom = require("jsdom")
    document = new (jsdom.level(1, "core").Document)()
    XMLSerializer = require("xmldom").XMLSerializer
    btoa = require("btoa")
}

class Trianglify {
    initialize: (options) -> {
        options = options or {}
        defaults = (opt, def) ->
            opt or def

        this.options = {
            cellsize: defaults(options.cellsize, 150)
            bleed: defaults(options.cellsize, 150)
            cellpadding: defaults(options.cellpadding, 0.1*options.cellsize or 15)
            noiseIntensity: defaults(options.noiseIntensity, 0.3)
            x_gradient: defaults(options.x_gradient, Trianglify.randomColor())
            format: defaults(options.format, "svg")
            fillOpacity: defaults(options.fillOpacity, 1)
            strokeOpacity: defaults(options.strokeOpacity, 1)
        }
        return this.options.y_gradient = options.y_gradient or 
                                    this.options.x_gradient.map((c)->d3.rgb(c).brighter(0.5))
    }

    this.random-color: ->{
        keys = Object.keys(Trianglify.colorbrewer)
        palette = Trianglify.colorbrewer[keys[Math.floor(Math.random()*keys.length)]]
        keys = Object.keys(palette)
        palette[keys[Math.floor(Math.random()*keys.length)]]
    }

    generate: (width, height) ->
        new Trianglify.Pattern(this.options, width, height)

    class Pattern {
        initialize: (options, width, height) ->{
            this.options = options
            this.width = width
            this.height = height
            this.polys = this.generatePolygons()
            this.svg = this.generateSVG()
            this.svgString = (new XMLSerializer()).serializeToString(this.svg)
            this.base64 = btoa(this.svgString)
            this.dataUri = "data:image/svg+xml;base64,#{this.base64}"
            this.dataUrl = "url(#{this.dataUri})"
        }

        append: ->
            document.body.appendChild(this.svg)

        this.gradient_2d: (x_gradient, y_gradient, width, height) ->{
            return (x, y) ->{
                color_x = d3.scale.linear()
                    .range(x_gradient)
                    .domain(d3.range(0, width, width/x_gradient.length)) 
                color_y = d3.scale.linear()
                    .range(y_gradient)
                    .domain(d3.range(0, height, height/y_gradient.length))
                return d3.interpolateRgb(color_x(x), color_y(y))(0.5)
            }
        }

        generatePolygons: ->{
            options = this.options
            cellsX = Math.ceil((this.width+options.bleed*2)/options.cellsize)
            cellsY = Math.ceil((this.height+options.bleed*2)/options.cellsize)

            vertices = d3.range(cellsX*cellsY).map((d) ->{
                # figure out which cell we are in
                col = d % cellsX
                row = Math.floor(d / cellsX)
                x = -options.bleed + col*options.cellsize + Math.random() * (options.cellsize - options.cellpadding*2) + options.cellpadding
                y = -options.bleed + row*options.cellsize + Math.random() * (options.cellsize - options.cellpadding*2) + options.cellpadding

                return [x, y] # Populate the actual background with points
            })

            d3.geom.delaunay(vertices)
        }

        append: ->
            document.body.appendChild(this.svg)

        generateSVG: ->{
            options = this.options
            color = Trianglify.Pattern.gradient_2d(options.x_gradient, options.y_gradient, this.width, this.height)

            elem = document.createElementNS("http://www.w3.org/2000/svg", "svg")
            svg = d3.select(elem)

            svg.attr("width", this.width)
            svg.attr("height", this.height)
            svg.attr("xmlns", "http://www.w3.org/2000/svg")
            group = svg.append("g")

            if (options.noiseIntensity > 0.01) {
                filter = svg.append("filter").attr("id", "noise")

                filter.append("feTurbulence")
                    .attr("type", "fractalNoise")
                    .attr("in", "fillPaint")
                    .attr("fill", "#F00")
                    .attr("baseFrequency", 0.7)
                    .attr("numOctaves", "10")
                    .attr("stitchTiles", "stitch")
                
                transfer = filter.append("feComponentTransfer")
                transfer.append("feFuncR")
                    .attr("type", "linear")
                    .attr("slope", "2")
                    .attr("intercept", "-.5")
                transfer.append("feFuncG")
                    .attr("type", "linear")
                    .attr("slope", "2")
                    .attr("intercept", "-.5")
                transfer.append("feFuncB")
                    .attr("type", "linear")
                    .attr("slope", "2")
                    .attr("intercept", "-.5")
                
                filter.append("feColorMatrix")
                    .attr("type", "matrix")
                    .attr("values", "0.3333 0.3333 0.3333 0 0 \n 0.3333 0.3333 0.3333 0 0 \n 0.3333 0.3333 0.3333 0 0 \n 0 0 0 1 0")
                
                svg.append("rect")
                    .attr("opacity", options.noiseIntensity)
                    .attr("width", "100%")
                    .attr("height", "100%")
                    .attr("filter", "url(#noise)")
            }

            for(d in this.polys) {
                x = (d[0][0] + d[1][0] + d[2][0])/3
                y = (d[0][1] + d[1][1] + d[2][1])/3
                c = color(x, y)
                group.append("path")
                    .attr("d", "M" + d.join("L") + "Z")
                    .attr({ fill: c, stroke: c })
                    .attr("fill-opacity", options.fillOpacity)
                    .attr("stroke-opacity", options.strokeOpacity)
            }
            svg.node()
        }
    }

    this.colorbrewer: colorbrewer
}


if (mod.exports) 
    mod.exports = Trianglify
