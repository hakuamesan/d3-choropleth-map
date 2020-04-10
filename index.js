let w = 1000;
let h = 700;

let body = d3.select('body')
let container = d3.select("#container");

container.append('h1')
         .attr('id', 'title')
         .text('US Educational Status');

container.append('div')
         .attr('id', 'description')
         .text("Adults with a Bachelor's Degree or higher");

let svg = container.append('svg')
                   .attr('width', w)
                   .attr('height', h)

let tooltip = body.append("div")
                  .attr("class", "tooltip")
                  .attr("id", "tooltip")
                  .style("opacity", 0);

let promises = [
  d3.json('https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/counties.json'),
  d3.json('https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/for_user_education.json')
];

Promise.all(promises).then(ready);

function ready(data) {

let us = data[0];
let education = data[1];

let edu = education.map( (d) => d.bachelorsOrHigher );
let minEd = d3.min(edu);
let maxEd = d3.max(edu);

console.log("min = " + minEd);
console.log("max = " + maxEd);

let color = d3.scaleThreshold()
              .domain(d3.range(minEd, maxEd, (maxEd - minEd) / 5))
              .range(d3.schemeBlues[5]);

let xScale = d3.scaleLinear()
               .domain([minEd, maxEd])
               .rangeRound([490, 750]);

let g = svg.append("g")
           .attr("id", "legend")
           .attr("transform", "translate(0,550)");

g.selectAll("rect")
           .data(color.range().map(d => {
              d = color.invertExtent(d);
              if (d[0] == null) d[0] = xScale.domain()[0];
              if (d[1] == null) d[1] = xScale.domain()[1];
              return d;
              }))
           .enter()
           .append("rect")
           .attr("height", 15)
           .attr("x", d => xScale(d[0]))
           .attr("width", d => xScale(d[1]) - xScale(d[0]))
           .attr("fill", d => color(d[0]));


let xAxis = d3.axisBottom(xScale)
              .tickSize(21)
              .tickFormat(d => Math.round(d) + '%')
              .tickValues(color.domain())

g.call(xAxis);

g.select(".domain")
  .remove();




let geoPath = d3.geoPath();

svg.append("path")
    .datum(topojson.mesh(us, us.objects.states, (a, b) => a !== b))
    .attr("class", "states")
    .attr("d", geoPath);


svg.append("g")
    .attr("class", "counties")
    .selectAll("path")
    .data(topojson.feature(us, us.objects.counties).features)
    .enter()
    .append("path")
    .attr("class", "county")
    .attr("data-fips", (d) => d.id)
    .attr("data-education", (d) => {
      let result = education.filter((obj) =>  obj.fips === d.id);
      return result[0] ? result[0].bachelorsOrHigher : 0 ;
      })
      .attr("fill", (d) => {
      let result = education.filter((obj) =>  obj.fips === d.id);
      return result[0] ? color(result[0].bachelorsOrHigher) : color(0) ;
      })
    .attr("d", geoPath)
    .on("mouseover", (d) => {
      tooltip.style("opacity", 1)
              .html(() => {
                let result = education.filter((obj) => ( obj.fips === d.id) );
                  return (result[0]) ? result[0]['area_name'] + ': ' + result[0].bachelorsOrHigher + '%' : 0;
              })
              .attr("data-education", () => {
                  let result = education.filter((obj) => obj.fips === d.id )
                  return (result[0]) ? result[0].bachelorsOrHigher : 0;
                  })
              .style("left", (d3.event.pageX + 10))
              .style("top", (d3.event.pageY - 28));
      })
    .on("mouseout", (d)=>  tooltip.style("opacity", 0));

}
