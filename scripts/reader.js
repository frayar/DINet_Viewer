/*** Object representing the importer module itself ***/
var reader = angular.module('reader', []);

/*** Service converting the input file to JSON ***/
reader.factory('ReaderService', function() {
	return {
		/** Function loading data in csv-like format (txt with tabulation separator)
		 ** One line corresponds to imagename;value_1;value_2;...;value_n;
		 **/
		BuildDataFromFeatures: function(content) {

			// Split at each end of line 
		    var allTextLines = content.split(/\r\n|\n/);

		    // Initialise arrays
		    var imagenames = [];
		    var data = [];
		    var classes = [];

		    // Loop to get the data
		    for (var i=0; i<allTextLines.length; i++) {
		    	// Split current line
		        var line = allTextLines[i].split('\t');
		        // Get current imagename
		        imagenames.push(line[0]);
		        // Get current features values
	            var darr = line.slice(1);
	            // Push it in the 2D data array
	            data.push(darr);
		    }

		    return [data, imagenames, classes];
		},

		/** Function loading distances matric in csv-like format (txt with tabulation separator)
		 ** One line corresponds to imagename;d_i1;d_i2;...;d_in
		 **/
		BuildDataFromDistanceMatrix: function(content) {

			// Split at each end of line 
		    var allTextLines = content.split(/\r\n|\n/);

		    // Initialise arrays
		    var imagenames = [];
		    var data = [];
		    var classes = [];

		    // Loop to get the data
		    for (var i=0; i<allTextLines.length; i++) {
		    	// Split current line
		        var line = allTextLines[i].split('\t');
		        // Get current imagename
		        imagenames.push(line[0]);
		        // Get current features values
	            var darr = line.slice(1);
	            // Push it in the 2D data array
	            data.push(darr);
		    }

		    // Convert to math.js matrix
		    var size = data.length;
		   	var distances = math.zeros(size, size);
		   	for (var i=0; i<size; i++) {
		   		for (var j=0; j<size; j++) {
		   			distances.set([i, j], data[i][j]);
				}
		   	}


		    return [distances, imagenames, classes];
		}
	};
});