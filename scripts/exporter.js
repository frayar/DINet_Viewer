/*** Object representing the exporter module itself ***/
var exporter = angular.module('exporter', []);

/*** Service converting the current graph to exported file ***/
exporter.factory('ExporterService', function() {
	return {
		/** Function converting a graph to JSON **/
		graphToJSON: function(sig, tabMin)
		{
			var service = this;
			
			/* JSON header */
			var exportedGraph = "{";
			exportedGraph += "\n\t" + tabMin + "\"directed\": false,";
			exportedGraph += "\n\t" + tabMin + "\"graph\": [],";
			exportedGraph += "\n\t" + tabMin + "\"multigraph\": false,";
			
			/* Getting the informations from the nodes */
			exportedGraph += "\n\t" + tabMin + "\"nodes\": [";
			sig.graph.nodes().forEach(function(n) {
								
				exportedGraph += "\n\t\t" + tabMin + "{\n";
				exportedGraph += "\t\t\t" + tabMin + "\"id\": \"" + n.id + "\",\n";
				exportedGraph += "\t\t\t" + tabMin + "\"label\": \"" + n.label + "\",\n";
				exportedGraph += "\t\t\t" + tabMin + "\"x\": " + n.x + ",\n";
				exportedGraph += "\t\t\t" + tabMin + "\"y\": " + n.y + ",\n";
				exportedGraph += "\t\t\t" + tabMin + "\"size\": " + n.size;
				if (n.color)
					exportedGraph += ",\n\t\t\t" + tabMin + "\"color\": \"" + n.color + "\"";
				if (n.representative)
					exportedGraph += ",\n\t\t\t" + tabMin + "\"representative\": \"" + n.representative + "\"";
				
				exportedGraph += "\n\t\t" + tabMin + "},";
			});
			exportedGraph = exportedGraph.substring(0, exportedGraph.length - 1);
			
			/* Getting the informations from the edges */
			exportedGraph += "\n\t" + tabMin + "],";
			exportedGraph += "\n\t" + tabMin + "\"edges\": [";
			
			sig.graph.edges().forEach(function(e) {
				exportedGraph += "\n\t\t" + tabMin + "{\n";
				exportedGraph += "\t\t\t" + tabMin + "\"id\": \"" + e.id + "\",\n";
				exportedGraph += "\t\t\t" + tabMin + "\"source\": \"" + e.source + "\",\n";
				exportedGraph += "\t\t\t" + tabMin + "\"target\": \"" + e.target + "\",\n";
				exportedGraph += "\t\t\t" + tabMin + "\"weight\": \"" + e.weight + "\"";
				if (e.color)
					exportedGraph += ",\n\t\t\t" + tabMin + "\"color\": \"" + e.color + "\"";
				if (e.size)
					exportedGraph += ",\n\t\t\t" + tabMin + "\"size\": \"" + e.size + "\"";

				exportedGraph += "\n\t\t" + tabMin + "},";
			});
			exportedGraph = exportedGraph.substring(0, exportedGraph.length - 1);
			
			/* Finalizing the file */
			exportedGraph += "\n\t" + tabMin + "]\n";
			exportedGraph += tabMin + "}";
			return exportedGraph;
		},
		
		/** MATTHIEU DAUDIGNON - 2015 - Function converting the graph to JSON **/
		graphToJSON_Old: function(sig, tabMin)
		{
			var service = this;
			
			/* Getting the informations from the nodes */
			var exportedGraph = "{";
			exportedGraph += "\n\t" + tabMin + "\"nodes\": [";
	
			sig.graph.nodes().forEach(function(n) {
			
						console.log(sig.graph.nodes().length);
						
				exportedGraph += "\n\t\t" + tabMin + "{\n";
				exportedGraph += "\t\t\t" + tabMin + "\"id\": \"" + n.id + "\",\n";
				exportedGraph += "\t\t\t" + tabMin + "\"label\": \"" + n.label + "\",\n";
				exportedGraph += "\t\t\t" + tabMin + "\"x\": " + n.x + ",\n";
				exportedGraph += "\t\t\t" + tabMin + "\"y\": " + n.y + ",\n";
				exportedGraph += "\t\t\t" + tabMin + "\"size\": " + n.size;
				if (n.color)
				{
					exportedGraph += ",\n\t\t\t" + tabMin + "\"color\": \"" + n.color + "\"";
				}
				
				// Getting the sub-graph if the node is a drill-down node
				if (n.children)
				{
					exportedGraph += ",\n\t\t\t" + tabMin + "\"children\": ";
					exportedGraph = service.graphToJSON(n.children, exportedGraph, tabMin + "\t\t\t");
				}
				// Getting the image if the node is an image node
				else if (n.image)
				{
					if (n.image.url)
					{
						var parts = n.image.url.split("/");
						exportedGraph += ",\n\t\t\t" + tabMin + "\"image\": \"" + parts[parts.length - 1] + "\"";
					}
					else
					{
						var parts = n.image.split("/");
						exportedGraph += ",\n\t\t\t" + tabMin + "\"image\": \"" + parts[parts.length - 1] + "\"";
					}
				}
				exportedGraph += "\n\t\t" + tabMin + "},";
			});
			exportedGraph = exportedGraph.substring(0, exportedGraph.length - 1);
			
			/* Getting the informations from the edges */
			exportedGraph += "\n\t" + tabMin + "],";
			exportedGraph += "\n\t" + tabMin + "\"edges\": [";
			
			sig.graph.edges().forEach(function(e) {
				exportedGraph += "\n\t\t" + tabMin + "{\n";
				exportedGraph += "\t\t\t" + tabMin + "\"id\": \"" + e.id + "\",\n";
				exportedGraph += "\t\t\t" + tabMin + "\"source\": \"" + e.source + "\",\n";
				exportedGraph += "\t\t\t" + tabMin + "\"target\": \"" + e.target + "\",\n";
				exportedGraph += "\t\t\t" + tabMin + "\"weight\": \"" + e.weight + "\"";
				if (e.color)
				{
					exportedGraph += ",\n\t\t\t" + tabMin + "\"color\": \"" + e.color + "\"";
				}
				exportedGraph += "\n\t\t" + tabMin + "},";
			});
			exportedGraph = exportedGraph.substring(0, exportedGraph.length - 1);
			
			/* Finalizing the file */
			exportedGraph += "\n\t" + tabMin + "]\n";
			exportedGraph += tabMin + "}";
			return exportedGraph;
		},
	
		/** Function converting the graph to GEXF **/
		graphToGEXF: function(sig)
		{
			var currentDate = new Date();
			var exportedGraph = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<gexf version=\"1.2\" xmlns:viz=\"http://www.gexf.net/1.2draft/viz\">\n";
			exportedGraph += "\t<meta lastmodifieddate=\"" + currentDate.toLocaleDateString() + "\">\n\t\t<creator>Graph Viewer</creator>\n\t</meta>\n";
			
			/* Getting the informations from the nodes */
			exportedGraph += "\t<graph defaultedgetype=\"directed\" mode=\"static\">\n\t\t<nodes>\n";
			sig.graph.nodes().forEach(function(n) {
				exportedGraph += "\t\t\t<node id=\"" + n.id + "\" label=\"" + n.label + "\">\n";
				exportedGraph += "\t\t\t\t<viz:size value=\"" + n.size + "\"></viz:size>\n";
        		exportedGraph += "\t\t\t\t<viz:position x=\"" + n.x + "\" y=\"" + n.y + "\" z=\"0.0\"></viz:position>\n";
				if (n.color)
				{
					// Converting the colour from hexadecimal to RGB
					var colorhex, rhex, ghex, bhex;
					colorhex = n.color.substring(1, 7);
					rhex = parseInt(colorhex.substring(0, 2), 16);
					ghex = parseInt(colorhex.substring(2, 4), 16);
					bhex = parseInt(colorhex.substring(4, 6), 16);
					exportedGraph += "\t\t\t\t<viz:color r=\"" + rhex + "\" g=\"" + ghex + "\" b=\"" + bhex + "\"></viz:color>\n";
				}
				if (n.image.url)
				{
					var parts = n.image.url.split("/");
					exportedGraph += "\t\t\t\t<representative src=\"" + parts[parts.length - 1] + "\"></representative>\n";
				}
				else
				{
					var parts = n.image.split("/");
					exportedGraph += "\t\t\t\t<representative src=\"" + parts[parts.length - 1] + "\"></representative>\n";
				}
				exportedGraph += "\t\t\t</node>\n";
			});
			
			/* Getting the informations from the edges */
			exportedGraph += "\t\t</nodes>\n\t\t<edges>\n";
			sig.graph.edges().forEach(function(e) {
				exportedGraph += "\t\t\t<edge id=\"" + e.id + "\" label=\"" + e.label + "\" source=\"" + e.source + "\" target=\"" + e.target + "\" weight=\"" + e.weight + "\"></edge>\n";
			});
			
			/* Finalizing the file */
			exportedGraph += "\t\t</edges>\n\t</graph>\n</gexf>";
			return exportedGraph;
		}
	};
});