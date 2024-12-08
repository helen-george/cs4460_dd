
console.log("hello world");

var svgWidth = window.innerWidth;
var svgHeight = window.innerHeight;


//CREATE CONTAINER
var svg = d3.select('#BigBox')
    .style('background-color', 'white')
    .attr("transform", "translate(-6, 0)")
    .attr('width', (svgWidth))
    .attr('height', (svgHeight));


//PROCESS THE DATA
function dataPreprocessor(row) {
    return {
        'stateName': row['Name'],
        'deaths': row['Deaths']
    };
}


//PROCESS CSV
d3.csv('States.csv', dataPreprocessor).then(function (dataset) {
    states = dataset;

    //CREATE THE TOOLTIP
    var toolTip = d3.tip()
        .attr("class", "d3-tip")
        .offset([-12, 0])
        .html(function (d) {
            console.log("hey");
            return "<h5>" + d['stateName'] + "</h5>" + "<tbody><td>" + "Total Deaths: " + d['deaths'] + "</td></tbody>"
        });

    console.log("hello");
    //APPEND HURRICANE IMAGE TO CONTAINER
    d3.select("#HurricaneHelene")
        .data([states[0]])
        .on("mouseover", function (event, d) {
            console.log("brush triggered on");
            toolTip.show(event, this);
        })
        .on("mouseout", function (event, d) {
            console.log("brush triggered off");
            toolTip.hide(event, this);
        });


    d3.select("#Florida")
        .data([states[1]])
        .on("mouseover", function (event, d) {
            console.log("brush triggered on");
            toolTip.show(event, this);
        })
        .on("mouseout", function (event, d) {
            console.log("brush triggered off");
            toolTip.hide(event, this);
        });

    d3.select("#Georgia")
        .data([states[2]])
        .on("mouseover", function (event, d) {
            console.log("brush triggered on");
            toolTip.show(event, this);
        })
        .on("mouseout", function (event, d) {
            console.log("brush triggered off");
            toolTip.hide(event, this);
        });


    d3.select("#SouthCarolina")
        .data([states[3]])
        .on("mouseover", function (event, d) {
            console.log("brush triggered on");
            toolTip.show(event, this);
        })
        .on("mouseout", function (event, d) {
            console.log("brush triggered off");
            toolTip.hide(event, this);
        });

    d3.select("#NorthCarolina")
        .data([states[4]])
        .on("mouseover", function (event, d) {
            console.log("brush triggered on");
            toolTip.show(event, this);
        })
        .on("mouseout", function (event, d) {
            console.log("brush triggered off");
            toolTip.hide(event, this);
        });


    d3.select("#Tennessee")
        .data([states[5]])
        .on("mouseover", function (event, d) {
            console.log("brush triggered on");
            toolTip.show(event, this);
        })
        .on("mouseout", function (event, d) {
            console.log("brush triggered off");
            toolTip.hide(event, this);
        });


    d3.select("#Virginia")
        .data([states[6]])
        .on("mouseover", function (event, d) {
            console.log("brush triggered on");
            toolTip.show(event, this);
        })
        .on("mouseout", function (event, d) {
            console.log("brush triggered off");
            toolTip.hide(event, this);
        });


    svg.call(toolTip);
});

console.log("hello world");
