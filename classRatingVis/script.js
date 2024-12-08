// Dimensions and margins
const margin = { top: 70, right: 30, bottom: 70, left: 100 };
const width = 960 - margin.left - margin.right;
const height = 500 - margin.top - margin.bottom;

// Create SVG container
const svg = d3.select("#chart")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

// Parse dates with multiple formats
const parseDate = d3.timeParse("%Y-%m-%dT%H:%M:%S.%LZ"); // ISO format
const fallbackDateParse = d3.timeParse("%m/%d/%y"); // Fallback format
const formatDate = d3.timeFormat("%b %d, %Y");

// Southeastern states
const southeastStates = [
    "AL", "AR", "FL", "GA",
    "KY", "LA", "MS",
    "NC", "SC", "TN", "VA"
];

// Create tooltip
const tooltip = d3.select("body")
    .append("div")
    .style("position", "absolute")
    .style("background-color", "white")
    .style("border", "1px solid #ccc")
    .style("padding", "8px")
    .style("border-radius", "4px")
    .style("box-shadow", "0px 2px 4px rgba(0,0,0,0.2)")
    .style("visibility", "hidden")
    .style("font-size", "12px");

// Load data
d3.csv("data.csv").then(data => {
    // Get today's date
    const today = new Date();
    console.log(data.map(d => d.currentlyEffectiveMapDate));
    console.log(data.map(d => d.classRating));

    // Process data
    data.forEach(d => {
        d.currentlyEffectiveMapDate = parseDate(d.currentlyEffectiveMapDate)
            || fallbackDateParse(d.currentlyEffectiveMapDate)
            || null;

    });

    // Filter data for southeastern states with valid dates and valid CRS ratings (1 to 9)
    const filteredData = data.filter(d => southeastStates.includes(d.state) && d.currentlyEffectiveMapDate && d.classRating >= 1 && d.classRating <= 9);

    // Group by state and aggregate data
    const grouped = d3.group(filteredData, d => d.state);
    const aggregated = Array.from(grouped, ([state, values]) => {
        const avgRating = d3.mean(values, d => +d.classRating || 0); // Calculate the average CRS rating

        // Ensure the average rating is within the valid CRS range (1 to 9)
        const validAvgRating = Math.max(1, Math.min(avgRating, 9));

        // Calculate the average update time (difference between today and currentlyEffectiveMapDate)
        const avgUpdateTime = d3.mean(values, d => {
            const timeDiff = today - d.currentlyEffectiveMapDate;
            return timeDiff;
        });

        // Convert average time difference from milliseconds to years (365.25 days/year to account for leap years)
        const avgUpdateTimeInYears = avgUpdateTime ? avgUpdateTime / (1000 * 60 * 60 * 24 * 365.25) : null;

        return { state, avgRating: validAvgRating, avgUpdateTimeInYears };
    });

    // Define scales
    const xScale = d3.scaleBand()
        .domain(aggregated.map(d => d.state))
        .range([0, width])
        .padding(0.2);

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(aggregated, d => d.avgRating)])
        .range([height, 0]);

    // Draw axes
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(xScale).tickSize(0))
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end");

    svg.append("g")
        .call(d3.axisLeft(yScale));

    // Define a color scale using custom colors
    const colorScale = d3.scaleLinear()
        .domain([1, 9]) // Class rating range
        .range(["#90d5ff", "#000435"]) // Custom color range
        .interpolate(d3.interpolateRgb); // Smooth color interpolation

    // Draw bars with color scale for CRS ratings
    svg.selectAll(".bar")
        .data(aggregated)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", d => xScale(d.state))
        .attr("y", d => yScale(d.avgRating))
        .attr("width", xScale.bandwidth())
        .attr("height", d => height - yScale(d.avgRating))
        .attr("fill", d => colorScale(d.avgRating)) // Apply color scale based on CRS rating
        .on("mouseover", (event, d) => {
            tooltip.html(`
                <strong>State:</strong> ${d.state}<br>
                <strong>Avg CRS Rating:</strong> ${d.avgRating.toFixed(2)}<br>
                <strong>Avg Time Since Effective Map:</strong> ${d.avgUpdateTimeInYears ? `${d.avgUpdateTimeInYears.toFixed(2)} years` : "N/A"}
            `)
                .style("visibility", "visible");
        })
        .on("mousemove", event => {
            tooltip.style("top", (event.pageY - 10) + "px")
                .style("left", (event.pageX + 10) + "px");
        })
        .on("mouseout", () => {
            tooltip.style("visibility", "hidden");
        });

    // Add chart title
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", -margin.top / 2)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("font-weight", "bold")
        .text("Average CRS Class Ratings for Southeastern States");

    // Add x-axis label
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom - 20)
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .text("State");

    // Add y-axis label
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -margin.left + 20)
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .text("Average CRS Rating");

    // Add color legend
    const legend = svg.append("g")
        .attr("transform", `translate(${width - 50}, 0)`);

    const legendScale = d3.scaleLinear()
        .domain([1, 9]) // Class rating range
        .range(["#90d5ff", "#000435"]) // Custom color range
        .interpolate(d3.interpolateRgb); // Smooth color interpolation

    const legendGradient = legend.append("defs")
        .append("linearGradient")
        .attr("id", "legend-gradient")
        .attr("x1", "0%").attr("y1", "0%")
        .attr("x2", "100%").attr("y2", "0%");

    for (let i = 1; i <= 9; i++) {
        legendGradient.append("stop")
            .attr("offset", `${(i - 1) * 12.5}%`)
            .attr("stop-color", legendScale(i));
    }

    legend.append("rect")
        .attr("x", 0)
        .attr("y", 20)
        .attr("width", 100)
        .attr("height", 10)
        .style("fill", "url(#legend-gradient)");

    legend.append("text")
        .attr("x", 0)
        .attr("y", 15)
        .style("font-size", "10px")
        .text("1");

    legend.append("text")
        .attr("x", 100)
        .attr("y", 15)
        .attr("text-anchor", "end")
        .style("font-size", "10px")
        .text("9");
});
