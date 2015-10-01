		var units = "Widgets";
		var margin = {top: 10, right: 10, bottom: 10, left: 10};
	    var	width = 850 - margin.left - margin.right;
	    var	height = 500 - margin.top - margin.bottom;

		var formatNumber = d3.format(",.0f");    // decimal places
		var format = function(d) { return formatNumber(d) + " " + units; };
		var color = d3.scale.category20();

		var svg = d3.select("#chart")
			.append("svg")
	    	.attr("width", width + margin.left + margin.right)
		    .attr("height", height + margin.top + margin.bottom)
		  	.append("g")
		    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

		var defs = svg.append("defs");

	    var sankey = d3.sankey()
		    .nodeWidth(7)
		    .nodePadding(25)
		    .size([width, height]);

	    var path = sankey.link();

	    d3.json("../brad.json", function(error, graph) {

            var nodeMap = {};
		    graph.nodes.forEach(function(x){ 
		    	nodeMap[x.name] = x; 
		    });
		    
		    graph.links = graph.links.map(function(x) {
		      return {
		        source: nodeMap[x.source],
		        target: nodeMap[x.target],
		        value: x.value
		      };
		    });

			sankey
			  	.links(graph.links)
			  	.nodes(graph.nodes)
			  	.layout(32);

//START GRADIENT STUFF//

			function getGradID(d){
			    return "linkGrad-" + d.source.name + "-" + d.target.name;
			}
			function nodeColor(d) { 
			    return d.color = color(d.name.replace(/ .*/, ""));
			}

			// create gradients for the links

			var grads = defs.selectAll("linearGradient")
			        .data(graph.links, getGradID);

			grads.enter().append("linearGradient")
			        .attr("id", getGradID)
			        .attr("gradientUnits", "userSpaceOnUse");

			function positionGrads() {
			    grads.attr("x1", function(d){return d.source.x;})
			        .attr("y1", function(d){return d.source.y;})
			        .attr("x2", function(d){return d.target.x;})
			        .attr("y2", function(d){return d.target.y;});
			}
			positionGrads();

			grads.html("") //erase any existing <stop> elements on update
			    .append("stop")
			    .attr("offset", "0%")
			    .attr("stop-color", function(d){
			        return nodeColor( (+d.source.x <= +d.target.x)? 
			                         d.source: d.target) ;
			    });

			grads.append("stop")
			    .attr("offset", "100%")
			    .attr("stop-color", function(d){
			        return nodeColor( (+d.source.x > +d.target.x)? 
			                         d.source: d.target) 
	
			    });


//FINISH GRADIENT STUFF//

var link = svg.append("g")
				.selectAll(".link")
				.data(graph.links)
				.enter()
				.append("path")
				.attr("class", "link")
				.attr("d", path)
				.style("stroke", function(d){
			        return "url(#" + getGradID(d) + ")";
			    })
		      	.attr("id", function(d,i){
			    	d.id = i;
			        return "link-"+i;
			    })
				.style("stroke-width", function(d) { 
					
					return Math.max(1, d.dy); })
				.sort(function(a, b) { 
					return b.dy - a.dy; })
				;

			link.append("title")
				.text(function(d) {
					return d.source.name + " → " + 
					d.target.name + "\n" + format(d.value); });



			var node = svg.append("g")
				.selectAll(".node")
		      	.data(graph.nodes)
			    .enter().append("g")
			    .attr("class", "node")
			    .attr("transform", function(d) { 
			          return "translate(" + d.x + "," + d.y + ")"; 
		      	})
				.on("mouseover",highlight_node_links)
				.on("mouseout",dehighlight_node_links)
		      	;

			node.append("rect")
				.attr("height", function(d) { return d.dy; })
				.attr("width", sankey.nodeWidth())
				.style("fill", function(d) { 
					if (d.name == "Urban Planner") {
						return "rgba(113, 102, 72,.5)";
					}
					else {
					return "rgba(113, 102, 72, .5)";
						// d.color = color(d.name.replace(/ .*/, "")); 
				}
				})
				.style("stroke", function(d) { 
					return "rgba(113, 102, 72, .2)"; 
				})
				.append("title")
				.text(function(d) { 
					return d.name + "\n" + format(d.value); });
			
		   node.append("text")
				.attr("x", -6)
				.attr("y", function(d) { return d.dy / 2; })
				.attr("dy", ".35em")
				.attr("text-anchor", "end")
				.attr("transform", null)
				.text(function(d) { return d.name; })
				.filter(function(d) { return d.x < width / 2; })
				.attr("x", 6 + sankey.nodeWidth())
				.attr("text-anchor", "start");

			

		function highlight_node_links(node,i){

		    var remainingNodes=[],
		        nextNodes=[];

		    var stroke_opacity = 0;
		    if( d3.select(this).attr("data-clicked") == "1" ){
		    	d3.select(this).attr("data-clicked","0");
		      	stroke_opacity = 0.25;
		    }else{
		      	d3.select(this).attr("data-clicked","1");
		      	stroke_opacity = 0.5;
		    }

		    var traverse = [{
				linkType : "sourceLinks",
				nodeType : "target"
				},{
				linkType : "targetLinks",
				nodeType : "source"
				}];

		    traverse.forEach(function(step){
		      	node[step.linkType].forEach(function(link) {
			        remainingNodes.push(link[step.nodeType]);
			
			        highlight_link(link.id, stroke_opacity);
		      	});

		      while (remainingNodes.length) {
		        nextNodes = [];
		        remainingNodes.forEach(function(node) {
		          node[step.linkType].forEach(function(link) {
		            nextNodes.push(link[step.nodeType]);
		            highlight_link(link.id, stroke_opacity);
		          });
		        });
		        remainingNodes = nextNodes;
		      }
		    });
		  }

		function dehighlight_node_links(){
			d3.selectAll(".link").style("stroke-opacity", "0.2").attr("data-clicked","0");
			d3.selectAll(".node").style("stroke-opacity", "0.2").attr("data-clicked","0");
			
		}

		function highlight_link(id,opacity){
			console.log(id);
		  	d3.select("#link-"+id).style("stroke-opacity", opacity);
		}



		});

