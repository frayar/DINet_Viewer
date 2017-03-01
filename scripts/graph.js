/*** Object representing the importer module itself ***/
var graph = angular.module('graph', []);

/*** Service converting the input file to JSON ***/
graph.factory('GraphService', function() {
	return {
		/** Function loading data in csv-like format (txt with tabulation separator)
		 ** One line corresponds to imagename;value_1;value_2;...;value_n;class_id
		 **/
		// dataArrays = [data, imagenames, classes]
		ComputeRNGFromFeatures: function(dataArrays) {

			// Compute distance matrix
			var distances = this.ComputeDistances(dataArrays[0]);

			// Compute edges with O(n^3) RNG algorithm
			var edges = this.ComputeEdges(distances);

			// Build formatted json for sigmajs
			var json = this.BuildJSON(dataArrays[1],dataArrays[2], edges);

			// Return formatted json string
		    return json;
		},

		// dataArrays = [distances, imagenames, classes]
		ComputeRNGFromDistanceMatrix: function(dataArrays) {

			// Compute edges with O(n^3) RNG algorithm
			var edges = this.ComputeEdges(dataArrays[0]);

			// Build formatted json for sigmajs
			var json = this.BuildJSON(dataArrays[1],dataArrays[2], edges);

			// Return formatted json string
		    return json;
		},

		// Build distances matrix
		ComputeDistances: function(dataArray) {

			// Get number of elements
			var size = dataArray.length;
			var dim = dataArray[0].length;

			// Initialize a zero filled matrix using math.js
			distances = math.zeros(size, size);

			// Compute distances
			for (var i=0; i<size; i++) {
				for (var j=i+1; j<size; j++) {
					var dist = 0.0;
					var tmp = 0.0;
					// Compute euclidian distance
					for (var k=0; k<dim; k++) {
						tmp = dataArray[i][k] - dataArray[j][k];
						tmp = tmp*tmp;
						dist += tmp;
					}
					dist = math.sqrt(dist);
					distances.set([i, j], dist);
					distances.set([j, i], dist);
				} 
			} 
			return distances;
		},

		// Build RNG
		ComputeEdges: function(distances) {

			var size = distances.size()[0];
			var edges = [];
			
			for (var i=0; i<size; i++) {
				for (var j=i+1; j<size; j++) {

					var isEdge = true;
					var distIJ = distances.get([i, j]);

					// Loop on other dat point
					for (var k=0; k<size; k++) {
						var distIK = distances.get([i, k]);
						var distJK = distances.get([j, k]);
						if(distIK<distIJ&&distJK<distIJ)
						{
							isEdge = false;
							break;
						}
					} // End k loop

					// Push edge if i and j relative neighbours
					if(isEdge)
					{
						var edge = [i,j,distIJ];
						edges.push(edge);	
					}

				} // End j loop
			} // End i loop

			return edges;
		},

		// Build graph json
		BuildJSON: function(imagenamesArray, classesArray, edgesArray) {

			var json = "";


			// Nodes header
			json += "{\n\t\"nodes\": [";

			// Node block
			for (var i=0; i<imagenamesArray.length; i++) {
				json += "\n\t\t{\n";
				json += "\t\t\t\"id\": \"" + i + "\",\n";
				json += "\t\t\t\"label\": \"" + imagenamesArray[i] + "\",\n";
				json += "\t\t\t\"x\": " + Math.random() * 50  + ",\n";
				json += "\t\t\t\"y\": " + Math.random() * 50 +",\n";
				json += "\t\t\t\"size\": 1,\n";
				json += "\t\t\t\"color\": \"#0000ff\",\n";
				json += "\t\t\t\"representative\": \"" + imagenamesArray[i] + "\"\n";
				json += "\t\t},";
			}

			// Remove last node block comma
			json = json.slice(0, -1);
			json += "\n\t],";

			// Edge header
			json += "\n\t\"edges\": [";

			// Edge block
			for (var i=0; i<edgesArray.length; i++) {
				json += "\n\t\t{\n";
				json += "\t\t\t\"id\": \"e" + i + "\",\n";
				json += "\t\t\t\"source\": \"" + edgesArray[i][0] + "\",\n";
				json += "\t\t\t\"target\": \"" + edgesArray[i][1] + "\",\n";
				json += "\t\t\t\"weight\": \"" + edgesArray[i][2] + "\",\n";
				json += "\t\t\t\"size\": 2,\n";
				json += "\t\t\t\"color\": \"#ccc\"\n";
				json += "\n\t\t},";
			}

			// Remove last edge block comma
			json = json.slice(0, -1);
			json += "\n\t]\n}";

			return json;

		},

		// Export distance matrix
		ExportDistancesMatrix: function(distances, filename) {

			var res = "";
			for (var i=0; i<distances.size()[0]; i++) {
				for (var j=0; j<distances.size()[0] - 1; j++) {
					res += distances.get([i, j]);
					res += "\t";
				}
				res += distances.get([i, j]);
				res += "\n";
			}
			var blob = new Blob([res], {type: "text/plain;charset=utf-8"});
			saveAs(blob, filename + ".distances");
		}

	};
});