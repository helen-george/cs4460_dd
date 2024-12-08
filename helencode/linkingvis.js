var toolTip = d3.tip()
.attr("class", "d3-tip")
.offset([-12, 0])
.html(function(event, d) {
    // Inject html, when creating your html I recommend editing the html within your index.html first
    return "<h5>"+d['name']+"</h5><table><thead><tr><td>Caloeries</td><td>Protein (g)</td><td>Fat</td></tr></thead>"
                    + "<tbody><tr><td>"+d['calories']+"</td><td>"+d['protein (g)']+"</td><td>"+d['fat']+"</td></tr></tbody>"
                    + "<thead><tr><td>Sodium</td><td>Dietary Fiber</td><td>Carbs</td><td>Sugars</td></tr></thead>"
                    + "<tbody><tr><td>"+d['sodium']+"</td><td>"+d['dietary fiber']+"</td><td>"+d['carbs']+"</td><td>"+d['sugars']+"</td></tr></tbody></table>"
});


var svg = d3.select('svg');

svg.call(toolTip);

// Get layout parameters
var svgWidth = +d3.selectAll('#scatterPlot').attr('width');
var svgHeight = +d3.selectAll('#scatterPlot').attr('height');

var padding = {t: 80, r: 40, b: 80, l: 100};
var cellPadding = 10;

// Create a group element for appending chart elements
var chartG = d3.selectAll('#scatterPlot').append('g')
    .attr('transform', 'translate('+[padding.l, padding.t]+')');

var dataAttributes = ['calories', 'protein (g)', 'fat', 'sodium', 'sugars'];
var N = dataAttributes.length;

// Compute chart dimensions
var cellWidth = (svgWidth - padding.l - padding.r);
var cellHeight = (svgHeight - padding.t - padding.b);

// Global x and y scales to be used for all SplomCells

var yearScale = d3.scaleTime()
    .domain([new Date(2000, 0, 1), new Date(2023, 0, 1)])  // Setting domain with start and end dates
    .range([0, cellWidth - cellPadding]);

var xScale = d3.scaleLinear().domain([0,160]).range([0, cellWidth - cellPadding]);
var yScale = d3.scaleLinear().domain([0,15]).range([cellHeight - cellPadding, 0]);
// axes that are rendered already for you
var xAxis = d3.axisBottom(yearScale).ticks(6).tickSize(-cellHeight , 0, 0);
var yAxis = d3.axisLeft(yScale).ticks(6).tickSize(-cellWidth, 0, 0);

// ****** Add reusable components here ****** //
//map

var mapSvg = d3.selectAll('#map');

var svgWidth2 = +mapSvg.attr('width');
var svgHeight2 = +mapSvg.attr('height');

const projection = d3.geoAlbersUsa()
.scale(svgWidth2 * 1.75)
.translate([svgWidth2 / 2 - 15, svgHeight2 / 2]);



var xG = chartG.append('g').attr('class', 'xaxis')
    .attr('transform', `translate(0, ${cellHeight})`)
    .call(d3.axisBottom(yearScale).tickFormat(d3.timeFormat("%Y")));

var yG = chartG.append('g').attr('class', 'yaxis')
    .call(d3.axisLeft(yScale));

xG.call(xAxis);
yG.call(yAxis);

var xAxisValue = 'year';
var yAxisValue = 'damage';
var countries = ['Florida', 'Georgia', 'Arizona', 'New Mexico', 'Texas', 'Oklahoma', 'Arkansas', 'Alabama', 'Louisiana', 'Mississippi', 'South Carolina', 'North Carolina'];


var plotlabels = d3.selectAll('#scatterPlot').append('g');

plotlabels.append('text')
.text('Year')
.attr('class', 'label')
.attr('transform','translate(450, 565)')
.attr('fill', 'black');
plotlabels.append('text')
.text('Damage(USD)')
.attr('class', 'label')
.attr('transform','translate(15,350) rotate(270)')
.attr('fill', 'black');

plotlabels.append('text')
.text('Hurricane and Tropical Storm Damage Across Time')
.attr('class', 'title')
.attr('transform','translate(275, 40) ')
.attr('fill', 'black');

mapSvg.append('g')
.append('text')
.text('The Southeastern United States')
.attr('class', 'title')
.attr('transform','translate(175, 40) ')
.attr('fill', 'black');


d3.csv('hurricane_data_2000.csv', dataPreprocessor).then(function(dataset) {
    

    dataset.forEach(element => {
        var str = '';
        element.damage.split(',').forEach(s => str += s);
        element.damage = parseInt(str);
        element.states = element.states.split(', ');
    });

    hurricanes = dataset;

    d3.json("us-states.json").then( function(data) {

        

        //draw scatter
        console.log(data);
        console.log(data.features);

        // Draw the map
        mapSvg.append("g")
        .selectAll("path")
        .data(data.features)
        .join("path")
        .attr("fill", function(d) {
            var countryName = d.properties.NAME;
            if (countries.includes(countryName)) {
                return '#3498db';
            } else {
                return '#fff'
            }
        })
        .attr("d", d3.geoPath()
        .projection(projection)
        )
        .style("stroke", "#000")

        var mapBrush = d3.brush()
            .extent([[0, 0], [svgWidth2, svgHeight2]])
            .on("start", () => {
                d3.select('#scatterPlot').call(d3.brush().move, null);
            })
            .on("end", brushMove);

        mapSvg.call(mapBrush);

        function brushMove(event) {
            console.log(svg.node() == this); //true if map

            // Get the extent or bounding box of the brush event, this is a 2x2 array
            var e = event.selection;
            if(e) {
                const [[x0, y0], [x1, y1]] = e;

                if (svg.node() === this) { //map
                    const countrySet = new Set();
                    mapSvg.selectAll("path")
                    .classed("highlighted", function(d) {
                        const cPoints = d3.geoPath(projection).bounds(d);
                        const [[cx0, cy0], [cx1, cy1]] = cPoints;
                        if(!(cx1 < x0 || cx0 > x1 || cy1 < y0 || cy0 > y1)) {
                            countrySet.add(d.properties.NAME);
                        };
                        return !(cx1 < x0 - (2*padding.l) || cx0 > x1 - padding.l|| cy1 < y0 - padding.t|| cy0 > y1 - padding.t);
                    });
                    const countryArr = (Array.from(countrySet))
                    mapSvg.selectAll("path")
                    .attr("fill", d => 
                        countryArr.some(f => f === d.properties.NAME && countries.includes(f)) ? '#3498db' : "white"
                    )

                    chartG.selectAll('.dot')
                    .attr("fill", d => {
                        var color = '#3498db';
                        countryArr.forEach(c => {
                            if (!(d.states.includes(c))) {
                                color = "lightgrey";
                            }
                        });
                        return color;
                    });



                } else { //scatterplot
                    const selectedCountries = hurricanes.filter(d => {
                        const cx = xScale(+d[xAxisValue]);
                        const cy = yScale(+d[yAxisValue]);
                        return cx >= x0 - padding.l && cx <= x1 - padding.l && cy >= y0 - padding.t && cy <= y1 - padding.t;
                    });

                    mapSvg.selectAll("path")
                    .attr("fill", d => {
                        var color = "white";
                        selectedCountries.some(f => {
                            if (f.states.includes(d.properties.NAME)) {
                                color = '#3498db';
                            }
                        });
                        return color;
                    }
                            
                    );

                    chartG.selectAll('.dot')
                    .attr("fill", d => {
                        var color = 'lightgrey';
                        selectedCountries.some(c => {
                            if (d === c) {
                                color = "#3498db";
                            }
                        });
                        return color;
                    });
                }

                
            }
        }
        
        

        d3.select("body").on("click", function(e) {
            mapSvg.selectAll(".brush").call(d3.brush().clear);
            chartG.selectAll(".brush").call(d3.brush().clear);
            mapSvg.selectAll('path')
            .attr("fill", function(d) {
                var countryName = d.properties.NAME;
                if (countries.includes(countryName)) {
                    return '#3498db';
                } else {
                    return '#fff'
                }
            })
            chartG.selectAll('.dot')
            .attr('fill', '#3498db');
        })
        chartG.selectAll(".brush").remove();//call(d3.brush().clear);
        mapSvg.selectAll(".brush").remove();//call(d3.brush().clear);

        mapSvg.selectAll(".brush").call(d3.brush().move, null).remove();
        chartG.selectAll(".brush").call(d3.brush().move, null).remove();
        

        xScale.domain(d3.extent(hurricanes, d => d[xAxisValue]));
        yScale.domain(d3.extent(hurricanes, d => d[yAxisValue]));
        
        var dots = chartG.selectAll('.dot')
        .data(hurricanes, d => d.name);

        var newDots = dots.enter()
        .append('circle')
        .attr('class', 'dot')
        .attr('r', 4);
        newDots.merge(dots)
        .transition()
        .duration(500)
        .attr('cx', d => xScale(d[xAxisValue]))
        .attr('cy', d => yScale(d[yAxisValue]))
        .attr('fill', '#3498db');


        dots.exit().remove();

        xG.call(xAxis);
        yG.call(yAxis);

        const plotBrush = d3.brush()
        .extent([[100, 80], [cellWidth + padding.l, cellHeight + padding.b]])
        .on("start", () => {

            mapSvg.call(d3.brush().move, null);

        })
        .on("brush end", brushMove);
        d3.select("#scatterPlot")
        .call(plotBrush);

        

    });

    

});



// ********* Your event listener functions go here *********//


function dataPreprocessor(row) {
    return {
        'year': +row['Year'],
        'name': row['Name'],
        'category': row['Category'],
        'rain': +row['Rain Inch.'],
        'wind': +row['Highest Wind Speed'],
        'damage': row['Damage(USD)'],
        'deaths': +row['Fatalities'],
        'states': row['AffectedAreas'],
    };
}