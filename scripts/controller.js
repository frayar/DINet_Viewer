/*** Linkurious.js optimized default values ***/
// https://github.com/Linkurious/linkurious.js/wiki/Settings-by-Linkurious

/*** Object representing the application itself ***/
var myApp = angular.module('myApp', ['reader', 'graph', 'converter', 'exporter', 'neighbourhood']);

/*** Controller managing the graph ***/
myApp.controller('GraphController', ['$scope', 'ReaderService', 'GraphService', 'ConverterService','ExporterService', 'NeighbourhoodService', function($scope, ReaderService, GraphService, ConverterService, ExporterService, NeighbourhoodService) {	
	/** Graph object **/
	var currentGraph = null;
	
	/** Path of the current image folder **/
	var imagePath = null;

	/** Name of the current graph **/
	var graphName = "";

	/** Min/max edge weights **/
	var minWeight = Infinity;
	var maxWeight = 0.0;

	/** Buttons variables */
	var displayEdge = true;
	var displayImage = true;
	
	/** Default color of the nodes **/
	var defaultColor = "#666"; 	// default_red= "#ec5148"
	
	/** Camera animation parameters **/
	var zoomRatio = 0.25;
	var animDuration = 1000;
	var minNodeSize_ = 2;
	var maxNodeSize_ = 20;
	
	/** Navigation logfile **/
	var logfile = [];
	var logCursor = -1;
	var lastSelected = -1;
	var neighbours = [];
	
	/** Initial tab **/
	var currentTab = "nodeTab";
	
	/** Sigma.js instance **/
	var sig = new sigma({
		graph: {nodes: [], edges: []},
		//container: 'graph',
		//type: 'canvas'
		renderer: {
			container: 'graph',
			type: 'canvas'
		},
		// https://github.com/Linkurious/linkurious.js/wiki/Settings
		settings : {
		//defaultEdgeType: 'tapered', // require sigma.renderers.customEdgeShapes
		
		 // Labels:
		//font: 'helvetica', 	// default=robotoregular 
		defaultLabelColor: '#000000', // default='#2e2c2d'
		//defaultLabelSize: 12,
		labelThreshold: 10,
		defaultEdgeLabelSize: 12,
		edgeLabelThreshold: 15,
		drawLabels: false,
		drawEdgeLabels: false,

		// Edges:
		edgeColor: 'default',
		defaultEdgeColor: '#ccc', // default='#a9a9a9'

		// Nodes:
		defaultNodeColor: "#666", // default='#333333'
		borderSize: 2,
		outerBorderSize: 2,
		nodeBorderColor: 'default',
		defaultNodeBorderColor: '#fff',
		defaultNodeOuterBorderColor: '#000',

		// Hovered items:
		singleHover: true,
		hoverFontStyle: 'bold',
		nodeHoverColor: 'default',
		defaultNodeHoverColor: '#000',
		edgeHoverColor: 'default',
		defaultEdgeHoverColor: '#000',
		labelHoverColor: 'default',
		defaultLabelHoverColor: '#F000',
		labelHoverBGColor: 'default',
		defaultHoverLabelBGColor: '#fff',
		labelHoverShadow: 'default',
		labelHoverShadowColor: '#000',

		// Active nodes and edges:
		activeFontStyle: 'bold',
		nodeActiveColor: 'node',
		defaultNodeActiveColor: '#ffffff',
		edgeActiveColor: 'default',
		defaultEdgeActiveColor: '#f65565',
		edgeHoverExtremities: true,
		
		// Rescale settings
		minNodeSize: minNodeSize_,
		maxNodeSize: maxNodeSize_,
		minEdgeSize: 1,
		maxEdgeSize: 2,

		// Captors setting
		//zoomingRatio: 1.382,
		//doubleClickZoomingRatio: 1,
		zoomMin: 0.05,
		zoomMax: 5,
		doubleClickZoomDuration: 0,
		touchEnabled: true,

		// Global settings
		//autoRescale: ['nodeSize', 'edgeSize'],
		doubleClickEnabled: true,
		enableEdgeHovering: true,
		edgeHoverPrecision: 1,	// default=10

		// Camera settings
		nodesPowRatio: 0.8,
		edgesPowRatio: 0.8,

		// Anitmation settings
		//animationsTime: 800

		// Halo
		nodeHaloColor: '#ecf0f1',
   		edgeHaloColor: '#ecf0f1',
    	nodeHaloSize: 50,
    	edgeHaloSize: 10
		}
	});

	// Initialize the Filter API
	var filter = sigma.plugins.filter(sig);

	/** Plugins */
	// Initialize the activeState plugin:
	var activeState = sigma.plugins.activeState(sig);
		
	/** Setting the uploader as empty and disabling the buttons **/
	document.getElementById("loadFeatures").value = "";
	document.getElementById("loadDistancesMatrix").value = "";
	document.getElementById("loadGraph").value = "";
	document.getElementById("loadFeatures").disabled = true;
	document.getElementById("loadDistancesMatrix").disabled = true;
	document.getElementById("loadGraph").disabled = true;
	document.getElementById("json").disabled = true;
	document.getElementById("gexf").disabled = true;
	document.getElementById("export").disabled = true;
	document.getElementById("startLayout").disabled = true;
	document.getElementById("stopLayout").disabled = true;
	document.getElementById("startflLayout").disabled = true;
	document.getElementById("stopflLayout").disabled = true;
	document.getElementById("frLayout").disabled = true;
	document.getElementById("smLayout").disabled = true;
	document.getElementById("msmLayout").disabled = true;
	document.getElementById("showHideEdges").disabled = true;
	document.getElementById("showHideImages").disabled = true;
	document.getElementById("reset").disabled = true;
	document.getElementById("previous").disabled = true;
	document.getElementById("next").disabled = true;
	document.getElementById("goToFirst").disabled = true;
	document.getElementById("goToLast").disabled = true;
	document.getElementById("backToLastSelected").disabled = true;

	/** 
	 * Function to load features file
	 **/
	$scope.loadData = function(type)
	{
		// Get calling button
		var file = null;
		if (type == 'feature')
			file = document.getElementById("loadFeatures").files[0];
		else if (type == 'distance')
			file = document.getElementById("loadDistancesMatrix").files[0];
		else
			file = document.getElementById("loadGraph").files[0];

		// Get the absolute path of the image folder
		imagePath = prompt("Your features file has been loaded.\nPlease enter the image folder relative path", "C:/Users/rayar/Desktop/2k15/GraphViewer_v1/data/Wang/image.orig");

		/* The file selecter should not be empty and the path must be entered */
		if ( (file != null)  && (imagePath != null) )
		{	
			// Getting the uploaded file
			graphName = file.name;
			var parts = graphName.split(".");
			var extension = parts[parts.length - 1];
			
			// When the reading is finished
			var reader = new FileReader();
			reader.addEventListener('load', function() {

				// Get content of the file
				var content = reader.result;
				var jsonGraph = "";

				// If input file contains features
				if (type == 'feature')
				{
					
					// Read content as data array.
					// dataResult = [data, imagenames, classes]
					var dataResult = ReaderService.BuildDataFromFeatures(content);

					// Build RNG
					jsonGraph = GraphService.ComputeRNGFromFeatures(dataResult);
				}
				// If input file contains distances matrix
				else if (type == 'distance')
				{
					// Read content as data array.
					// dataResult = [distances, imagenames, classes]
					var dataResult = ReaderService.BuildDataFromDistanceMatrix(content);

					// Build RNG
					jsonGraph = GraphService.ComputeRNGFromDistanceMatrix(dataResult);

				}
				// If input file contains a graph
				else 
				{
					if (extension == 'gexf')
						jsonGraph = ConverterService.GEXFtoJSON(content);
					else
						jsonGraph = content;
				}

				// Save the graph file
				//var blob = new Blob([jsonGraph], {type: "text/plain;charset=utf-8"});
				//saveAs(blob, name + ".json");

				// Load as sigmajs graph
				currentGraph = JSON.parse(jsonGraph);
				sig.graph.read(currentGraph);

				// Init the visualisation
				$scope.init();

				// Display the graph
				$scope.display();

			}, false);
			
			// Reading the file after setting the event listener because of asynchronous reading
			reader.readAsText(file);

		}
		else 	// Bad importation
		{		
			if (imagePath == null)
			{
				document.getElementById("loadFeatures").value = "";
				document.getElementById("loadDistancesMatrix").value = "";
				document.getElementById("loadGraph").value = "";
				alert("Importation cancelled. You must enter the image folder absolute path.");
			}
			else
			{
				alert("Importation cancelled. You must select a file.");
			}
		}		
	}


	/** 
	 * Function to clear the graph
	 **/
	$scope.clearGraph = function()
	{
		/* Resetting the displaying */
		sig.graph.clear();

		// Refresh the view
		sig.refresh();

		// Clear IO related elements
		imagePath = "";
		currentGraph = null;
		document.getElementById("loadFeatures").value = "";
		document.getElementById("loadDistancesMatrix").value = "";
		document.getElementById("loadGraph").value = "";

		// Clear weight filter elements
		minWeight = Infinity;
		maxWeight = 0.0;
		document.getElementById('edge-weight').min = 0.0;
		document.getElementById('edge-weight').max = 0.0;
		document.getElementById('edge-weight').value = 0.0;
		document.getElementById('edge-weight').step = 0.0;
		document.getElementById('min-weight-val').textContent = "0.0";
		document.getElementById('max-weight-val').textContent = "0.0";
		document.getElementById('max-weight-value').textContent = "0.0";

		// Clear plot
		Plotly.deleteTraces('edgesWeightsPlot', 0);
		Plotly.deleteTraces('edgesWeightsHistogram', 0);

		/* Displaying the node tab */
		$scope.changeTab("nodeTab");

		/** Setting the uploader as empty and disabling the buttons **/
		document.getElementById("loadFeatures").value = "";
		document.getElementById("loadDistancesMatrix").value = "";
		document.getElementById("loadGraph").value = "";
		document.getElementById("json").disabled = true;
		document.getElementById("gexf").disabled = true;
		document.getElementById("export").disabled = true;
		document.getElementById("startLayout").disabled = true;
		document.getElementById("stopLayout").disabled = true;
		document.getElementById("startflLayout").disabled = true;
		document.getElementById("stopflLayout").disabled = true;
		document.getElementById("frLayout").disabled = true;
		document.getElementById("smLayout").disabled = true;
		document.getElementById("msmLayout").disabled = true;
		document.getElementById("showHideEdges").disabled = true;
		document.getElementById("showHideImages").disabled = true;
		document.getElementById("reset").disabled = true;
		document.getElementById("previous").disabled = true;
		document.getElementById("next").disabled = true;
		document.getElementById("goToFirst").disabled = true;
		document.getElementById("goToLast").disabled = true;
		document.getElementById("backToLastSelected").disabled = true;
		
		/* Clearing the node information list */
		document.getElementById("selectedNode").innerHTML = "Click on a node to show its data";
		document.getElementById("selectedImage").innerHTML = "";
		document.getElementById("nodeId").innerHTML = "";
		document.getElementById("x").innerHTML = "";
		document.getElementById("y").innerHTML = "";
		document.getElementById("subgraphDetails").innerHTML = "";
		document.getElementById("neighboursList").innerHTML = "";
		document.getElementById("nodesInfo").hidden = true;
		
		/* Clearing the logfile */
		document.getElementById("logTabContent").innerHTML = "<p>Empty logfile</p>";
		logfile = [];
		logCursor = -1;
		lastSelected = -1;
		
	}



	/** Function to initialize the graph **/
	$scope.init = function()
	{
		//document.getElementById("currentNode")
		 // ...then set the internal size to match
		 //canvas.width  = canvas.offsetWidth;
		 //canvas.height = canvas.offsetHeight;

		 // Enable UI buttons
		 document.getElementById("json").disabled = false;
		document.getElementById("gexf").disabled = false;
		document.getElementById("export").disabled = false;
		document.getElementById("startLayout").disabled = false;
		document.getElementById("stopLayout").disabled = false;
		document.getElementById("startflLayout").disabled = false;
		document.getElementById("stopflLayout").disabled = false;
		document.getElementById("frLayout").disabled = false;
		document.getElementById("smLayout").disabled = false;
		document.getElementById("msmLayout").disabled = false;
		document.getElementById("showHideEdges").disabled = false;
		document.getElementById("showHideImages").disabled = false;
		document.getElementById("reset").disabled = false;
		document.getElementById("previous").disabled = false;
		document.getElementById("next").disabled = false;
		document.getElementById("goToFirst").disabled = false;
		document.getElementById("goToLast").disabled = false;
		document.getElementById("backToLastSelected").disabled = false;

		// Pre-treating the image path
		// FOR DINet ONLINE DEMO
		//imagePath = "file:///" + imagePath.replace(/\\/g, "/") + "/";


		/* Preprocessing each node */
		sig.graph.nodes().forEach(function(n) {

			// Assign image
			if (n.representative)
			{
				var parts = n.representative.split("/");
				n.image = imagePath + parts[parts.length - 1];
			}
			
			// Set the shape of the node as square
			n.type = "square";	
			
			// Save original attributes
			n.originalColor = (n.color)? n.color : sig.settings('defaultNodeColor');
			n.originalSize = (n.size)? n.size : sig.settings('minNodeSize');
			n.originalLabel = (n.label)? n.label : "";
		});
				
		/* Preprocessing each edge*/
		sig.graph.edges().forEach(function(e) {
		
			// Save original attributes
			e.originalColor = (e.color)? e.color : sig.settings('defaultEdgeColor');
			e.originalSize = (e.size)? e.size : sig.settings('minNodeSize');
			e.originalLabel = (e.label)? e.label : "";

			// Get min/max weights
			minWeight = Math.min(minWeight, e.weight);
			maxWeight = Math.max(maxWeight, e.weight);
		});

		// Update Weights slider
		minWeight = minWeight.toFixed(2);
		maxWeight = maxWeight.toFixed(2);
		document.getElementById('edge-weight').min = minWeight;
		document.getElementById('edge-weight').max = maxWeight;
		document.getElementById('edge-weight').value = maxWeight;
		document.getElementById('edge-weight').step = (maxWeight - minWeight) / 10;
		document.getElementById('min-weight-val').textContent = minWeight;
		document.getElementById('max-weight-val').textContent = maxWeight;
		document.getElementById('max-weight-value').textContent = maxWeight;

		// Plots
		$scope.BuildPlot();
		$scope.BuildHistogram();	

		//
		// SET LISTENERS
		//

		document.getElementById('edge-weight').addEventListener("input", $scope.applyEdgeWeightFilter);  // for Chrome and FF
  		document.getElementById('edge-weight').addEventListener("change", $scope.applyEdgeWeightFilter); // for IE10+, that sucks

		// Halo around neighbours
		sig.renderers[0].bind('render', function(e) {
		  sig.renderers[0].halo({
		    nodes: neighbours
		  });
		});


		// When a node is clicked
		sig.bind('clickNode', function(e) {
			// Displaying the informations of the node
			$scope.selectNode(e.data.node.id, logCursor + 1, "image", false);

			document.getElementById("backToLastSelected").disabled = true;
		});
		
							
		// When the background is left clicked, not for dragging
		sig.bind('clickStage', function(e) {
			if (!e.data.captor.isDragging){
				// Deselecting the node
				$scope.deselectNode();
				
				// Resetting the camera
				sigma.misc.animation.camera(
					sig.camera, 
					{
						x: 0, 
						y: 0,
						ratio: 1
					}, 
					{duration: 300}
				);
			}
		});
		
		// Displaying the image of the node and its representatives when the mouse is over it
		sig.bind('hovers', function(e) {
		
			// Handling non leaf node hover
			if (e.data.current.nodes.length > 0) {
			
				// Get hovered node
				hoveredNode = e.data.current.nodes[0];
				
				// Display node medoid as thumbnail
				if (hoveredNode.representative)
				{
					img = ( hoveredNode.image.url )? hoveredNode.image.url : hoveredNode.image;
					document.getElementById("currentNode").innerHTML = "<img id=\"miniCurrentImage\" src=\"" + img + "\"/>";	
				}								
					
				// Display node representatives as a pseudo treemap	
				//$scope.updateRepresentatives(hoveredNode);
			}
			else
			{
				// Reset thumbnail
				document.getElementById("currentNode").innerHTML = "";
				
			}
			
			
			// Handling edges on hover
			if (e.data.current.edges.length > 0) 
			{
				// Get hovered edge
				hoveredEdge = e.data.current.edges[0];
				
				// Highlight
				//hoveredEdge.size = 20;
				//hoveredEdge.color = "#ff0000";
				
			}
		});
	};


	/** Function that display a graph that has been load by sigma **/
	$scope.display = function()
	{
		// Resetting the displaying
		sigma.misc.animation.camera(
			sig.camera, 
			{
				x: 0, 
				y: 0,
				ratio: 1
			}, 
			{duration: 1}
		);

		// Get number of image in total
		var total_nb_images = 0;
		sig.graph.nodes().forEach(function(n) {
			total_nb_images += n.nb_images;
		});

		/* Preprocessing each node */
		sig.graph.nodes().forEach(function(n) {

			// Handle node image
			if (n.representative)
			{
				// Get imagename
				var parts = n.representative.split("/");

				// Setting the image as object to display them in the nodes
				if (displayImage)
					n.image = {
						url: imagePath + parts[parts.length - 1],
						clip: 1.0,
						scale: 1.0,
					}
				else 	// Setting the images only as path to hide them
					n.image = imagePath + parts[parts.length - 1];
			}

			// Set the shape of the node as square 
			n.type = "square";	
			
			// Assign default color and size + id as label
			n.color = displayImage?"#FFF":sig.settings('defaultNodeColor');
			n.size = (n.children)?  Math.max(n.nb_images * 10 / total_nb_images, 1) : 1 ;
			n.label = n.id;
		});
				
		/* Preprocessing each edge*/
		sig.graph.edges().forEach(function(e) {
			// Assign default color and size + weight as label
			e.color = sig.settings('defaultEdgeColor');
			e.size = sig.settings('maxEdgeSize');
			e.label = e.weight;
		});

		// Displaying the graph
		sig.refresh();

	}

	/** Function that go to the root of the tree **/
	/** Old $scope.reset() **/
	$scope.resetView = function()
	{
		/* Resetting the displaying */
		sig.graph.clear();

		// Loading initial graph
		sig.graph.read(currentGraph);

		// Display the graph
		$scope.display();

		// Deselect all nodes
		activeState.dropNodes();

		/* Displaying the node tab */
		$scope.changeTab("nodeTab");
		
		/* Clearing the node information list */
		document.getElementById("selectedNode").innerHTML = "Click on a node to show its data";
		document.getElementById("selectedImage").innerHTML = "";
		document.getElementById("nodeId").innerHTML = "";
		document.getElementById("x").innerHTML = "";
		document.getElementById("y").innerHTML = "";
		document.getElementById("subgraphDetails").innerHTML = "";
		document.getElementById("neighboursList").innerHTML = "";
		document.getElementById("nodesInfo").hidden = true;
		
		/* Clearing the logfile */
		document.getElementById("logTabContent").innerHTML = "<p>Empty logfile</p>";
		logfile = [];
		logCursor = -1;
		lastSelected = -1;

	}

	/** Function to export the current graph **/
	$scope.exporter = function()
	{
		var exportedGraph = "";
		
		/* Getting the name of the file without the extension */
		var filename = "";
		var graph = graphName;
		var parts = graph.split(".");
		for (i = 0 ; i < parts.length - 1 ; i++)
		{
			filename += parts[i];
			if (i != parts.length - 2)
			{
				filename += ".";
			}
		}
		
		/* If the JSON export is chosen */
		if (document.getElementById("json").checked)
		{
			exportedGraph = ExporterService.graphToJSON(sig, "");			
			filename += ".dinet.json";
		}
		
		/* If the GEXF export is chosen */
		else if (document.getElementById("gexf").checked)
		{
			exportedGraph = ExporterService.graphToGEXF(sig);
			filename += ".dinet.gexf";
		}
		
		/* Saving the file */
		var blob = new Blob([exportedGraph], {type: "text/plain;charset=utf-8"});
		saveAs(blob, filename);
	};

	
	/** Function to show or hide the edges of the graph **/
	$scope.showHideEdges = function()
	{	
		/* Showing the edges */
		if (!displayEdge)
		{
			document.getElementById("showHideEdgesImage").src = "images/hide_edges_black.png";
			displayEdge = true;
			
			sig.graph.edges().forEach(function(e) {
				e.hidden = false;
			});
		}
		/* Hiding the edges */
		else
		{
			document.getElementById("showHideEdgesImage").src = "images/show_edges_black.png";
			displayEdge = false;
			
			sig.graph.edges().forEach(function(e) {
				e.hidden = true;
			});
		}
		
		/* Refreshing the displaying */
		sig.refresh();
	}
	
	/** Function to display images in the node or hide them **/
	$scope.showHideImages = function()
	{
		/* Showing the images */
		if (!displayImage)
		{
			// Changing the button
			document.getElementById("showHideImagesImage").src = "images/hide_image_black.png";
			displayImage = true;
		
			// Setting the image as object to display them in the nodes
			sig.graph.nodes().forEach(function(n) {
				if (n.representative)
				{
					var parts = n.representative.split("/");

					n.image = {
						url: imagePath + parts[parts.length - 1],
						clip: 1.0,
						scale: 1.0
					}
				}
				n.color = "#fff";
			});
			sig.refresh();
		}
		/* Hiding the images */
		else
		{
			// Changing the button
			document.getElementById("showHideImagesImage").src = "images/show_image_black.png";
			displayImage = false;
			
			// Setting the images only as path
			sig.graph.nodes().forEach(function(n) {
			
				if (n.representative)
				{
					var parts = n.representative.split("/");
					n.image = imagePath + parts[parts.length - 1];
				}
					
				n.color = "#666";
				n.type = "circle";
			});
			sig.refresh();
		}
	}
	
	/** Function to start the ForceAtlas2 layout algorithm **/
	$scope.startLayout = function()
	{
		sig.startForceAtlas2();
		//sig.startForceAtlas2({worker: true, edgeWeightInfluence: 1, linLogMode: false});
	}
	
	/** Function to stop the ForceAtlas2 layout algorithm **/
	$scope.stopLayout = function()
	{
		sig.stopForceAtlas2();
	}
	
	/** Function to run the Fruchterman-Reingold layout algorithm **/
	$scope.frLayout = function()
	{
		// Configure the Fruchterman-Reingold algorithm:
		var frListener = sigma.layouts.fruchtermanReingold.configure(sig, {
		  iterations: 5000, //def=500
		  easing: 'quadraticInOut',
		  duration: 10000  //def=800
		});

		// Bind the events:
		frListener.bind('start stop interpolate', function(e) {
		  console.log(e.type);
		});
		
		// Start the Fruchterman-Reingold algorithm:
		sigma.layouts.fruchtermanReingold.start(sig);

	}
	
	/** Function to run the Stress Majorization layout algorithm **/
	$scope.smLayout = function()
	{
		// Configure the Stress Majorization algorithm:
		var smListener = sigma.layouts.stressMajorization.configure(sig, {
		  iterations: 1000, //def=500
		  easing: 'quadraticInOut',
		  duration: 10000  //def=800
		});

		// Bind the events:
		smListener.bind('start stop interpolate', function(e) {
		  console.log(e.type);
		});

		// Start the Stress Majorization algorithm:
		sigma.layouts.stressMajorization.start(sig);

	}

	/** Function to run the Maxent-Stress Majorization layout algorithm **/
	$scope.msmLayout = function()
	{
		// Configure the Maxent-Stress Majorization algorithm:
		var msmListener = sigma.layouts.maxentStress.configure(sig, {
		  iterations: 250, //def=250
		  easing: 'quadraticInOut',
		  duration: 10000  //def=800
		});

		// Bind the events:
		msmListener.bind('start stop interpolate', function(e) {
		  console.log(e.type);
		});

		// Start the Maxent-Stress Majorization algorithm:
		sigma.layouts.maxentStress.start(sig);

	}	
	
	/** Function to start the Force-Link layout algorithm **/
	$scope.startflLayout = function()
	{
		// Start the ForceLink algorithm:
		var fa = sigma.layouts.startForceLink(sig);
		
		// Bind all events:
		fa.bind('start stop interpolate', function(event) {
		  console.log(event.type);
		});

	}
	
	/** Function to stop the Force-Link layout algorithm **/
	$scope.stopflLayout = function()
	{
		sigma.layouts.stopForceLink();
	}

	/** Function that open the help page **/
	$scope.help = function()
	{
		window.open('help.html','_blank');
	}



	/** Function to change the node size **/
	$scope.changeNodeSize = function()
	{
		/* Getting the new value */
		var value = $scope.data.sizevalue;
		
		/* Updating the sigma instance maxNodeSize */
		sig.settings('maxNodeSize', maxNodeSize_*value);

		/* Refreshing the display */
		sig.refresh();
		
		/* Updating the UI */
		document.getElementById("nodeSize").innerHTML = value;
	}
	
	
	/** Function to select a node **/
	$scope.selectNode = function(nodeId, logPosition, type, previousOrNext)
	{
		var newSelectedNode;
		var newImage;

		/* Getting the node itself */
		sig.graph.nodes().forEach(function(n) {
			if (n.id == nodeId)
			{
				newSelectedNode = n;
			}
		});	


		// Deselect all nodes
		activeState.dropNodes();

		// Set the node as active
		activeState.addNodes(nodeId);
		
		/* Getting the image of the node */
		if (type == "image")
		{
			if (newSelectedNode.image.url)
			{
				newImage = newSelectedNode.image.url;
			}
			else
			{
				newImage = newSelectedNode.image;
			}
		}
		
		/* If the node to display is not already in the logfile */
		if (!previousOrNext)
		{
			// If the current node is not the last of the logfile
			if (logCursor < logfile.length - 1)
			{
				for (i = logfile.length - 1 ; i > logCursor ; i--)
				{
					logfile.pop();
				}
			}
			
			// Putting the node in the logfile
			logfile.push({ id: nodeId, image: newImage, type: type });
		}
		
		/* Updating the cursor of the log */
		logCursor = logPosition;

		// Moving the camera to zoom on the node
		sigma.misc.animation.camera(
			sig.camera, 
			{
				x: newSelectedNode[sig.camera.readPrefix + 'x'], 
				y: newSelectedNode[sig.camera.readPrefix + 'y'],
				ratio: zoomRatio
			}, 
			{duration: animDuration}
		);

		
		/* Displaying the information of the node */
		document.getElementById("selectedNode").innerHTML = "Selected node: " + newSelectedNode.label;
		document.getElementById("selectedImage").innerHTML = "<img id=\"miniSelectedImage\" src=\"" + newImage + "\" onclick=\"angular.element(this).scope().zoomImage(&quot;" + newImage + "&quot;)\"/><br />";
		document.getElementById("selectedImage").innerHTML += "<div id=\"zoomMessage\">Click on the image to show it entire</div>";
		document.getElementById("nodeId").innerHTML = "Id: " + nodeId;
		document.getElementById("x").innerHTML = "x: " + newSelectedNode.x;
		document.getElementById("y").innerHTML = "y: " + newSelectedNode.y;
		document.getElementById("nodesInfo").hidden = false;
		
		// Displaying the neighbours of the node
		neighbours = NeighbourhoodService.getNeighbours(sig, nodeId);
		document.getElementById("neighboursList").innerHTML = "";
		for (i = 0 ; i < neighbours.length ; i++)
		{
			var newNeighbourImage;
			if (newSelectedNode.image.url)
			{
				newNeighbourImage = neighbours[i].image.url;
			}
			else
			{
				newNeighbourImage = neighbours[i].image;
			}
			
			var newNeighbour = "<li><a href=\"#\">";
			newNeighbour += "<img class=\"neighbourImage\" src=\"" + newNeighbourImage + "\" onclick=\"angular.element(this).scope().selectNode(&quot;" + neighbours[i].id + "&quot;, " + (logCursor + 1) + ", &quot;image&quot;, false)\"/>";
			newNeighbour += "<img class=\"neighbourImageZoom\" src=\"" + newNeighbourImage + "\" onclick=\"angular.element(this).scope().selectNode(&quot;" + neighbours[i].id + "&quot;, " + (logCursor + 1) + ", &quot;image&quot;, false)\"/>";
			newNeighbour += "</a></li>";
			document.getElementById("neighboursList").innerHTML += newNeighbour;	
		}
		document.getElementById("neighboursList").hidden = false;
		
  		// Highlighting the neighbours of the node
		NeighbourhoodService.highlightNeighbours(sig, nodeId, neighbours);

		// Display node representatives as a pseudo treemap	
		//$scope.updateRepresentatives(newSelectedNode);

		/* Enabling or disabling the navigation buttons depending on the cursor */
		if (logCursor > 0)
		{
			document.getElementById("previous").disabled = false;
			document.getElementById("goToFirst").disabled = false;
		}
		else
		{
			document.getElementById("previous").disabled = true;
			document.getElementById("goToFirst").disabled = true;
		}
		if (logCursor < logfile.length - 1)
		{
			document.getElementById("next").disabled = false;
			document.getElementById("goToLast").disabled = false;
		}
		else
		{
			document.getElementById("next").disabled = true;
			document.getElementById("goToLast").disabled = true;
		}
		
		if (document.getElementById("backToLastSelected").disabled == false)
		{
			document.getElementById("backToLastSelected").disabled = true;
		}
		
		/* Displaying the updated logfile */
		$scope.viewLog();	
	}

	/** Function to deselect the current node **/
	$scope.deselectNode = function()
	{
		/* Deleting the node information list */
		document.getElementById("selectedNode").innerHTML = "Click on a node to show its data";
		document.getElementById("selectedImage").innerHTML = "";
		document.getElementById("nodeId").innerHTML = "";
		document.getElementById("x").innerHTML = "";
		document.getElementById("y").innerHTML = "";
		document.getElementById("subgraphDetails").innerHTML = "";
		document.getElementById("neighboursList").innerHTML = "";
		document.getElementById("nodesInfo").hidden = true;
		
		// Set all nodes as "inactive" 
		activeState.dropNodes();
		neighbours = [];

		/* Resetting the colours of edges */
		sig.graph.edges().forEach(function(e) {
			e.color = e.originalColor;
		});

		sig.refresh();
		
		/* Saving the position of the node in the logfile */
		lastSelected = logCursor;
		
		/* Enabling the back to last button and disabling the other buttons */
		document.getElementById("backToLastSelected").disabled = false;
		document.getElementById("previous").disabled = true;
		document.getElementById("next").disabled = true;
		document.getElementById("goToFirst").disabled = true;
		document.getElementById("goToLast").disabled = true;
		
		$scope.viewLog();
		
		// DAS2016
		// TODO un-highlight selected node
	}
	
	/** Function to view the current selected image full-sized **/
	$scope.zoomImage = function(image)
	{
		/* Getting the name of the image */
		var parts = image.split("/");
		var name = parts[parts.length - 1];
		
		/* Setting the image as the content of the window */
		var content = "<html><head><title>" + name + "</title></head>"
		content += "<body><img src=\"" + image + "\"></body></html>";
		
		/* Displaying the window */
		var popupImage = window.open("", "_blank", "toolbar=0, location=0, directories=0, menuBar=0, scrollbars=1, resizable=1");
		popupImage.document.open();
		popupImage.document.write(content);
		popupImage.document.close()
	}
	
	/** Function to display the logfile of the current graph **/
	$scope.viewLog = function()
	{
		var log = "<ul id=\"logfile\">";
		
		/* Displaying the id and the image of the nodes */
		for (i = 0 ; i < logfile.length ; i++)
		{			
			// Highlighting the current node
			if ((i == logCursor) && (document.getElementById("nodeId").innerHTML != ""))
			{
				log += "<li id=\"currentLogNode\">-" + logfile[i].id + "-<br />";
				log += "<img id=\"currentLogImage\" class=\"logImage\" src=\"" + logfile[i].image + "\"/>";
			}
			// Displaying the other nodes
			else
			{
				log += "<li>" + logfile[i].id + "<br />";
				log += "<img class=\"logImage\" src=\"" + logfile[i].image + "\" onclick=\"angular.element(this).scope().selectNode(&quot;" + logfile[i].id + "&quot;, " + i + ", &quot;" + logfile[i].type + "&quot;, true)\"/>";
			}
			log += "</li>";
		}
		log += "</ul>";
		
		/* Displaying the logfile */
		document.getElementById("logTabContent").innerHTML = log;
	}
	
	/** Function to display the previous node in the logfile **/
	$scope.previousNode = function()
	{
		/*var partsSrc = logfile[logCursor].id.split(".");
		var partsDest = logfile[logCursor - 1].id.split(".");
		var nbLvChanges = partsSrc.length - 1;
		
		for (i = 0 ; i < partsSrc.length - 1 ; i++)
		{
			if (partsSrc[i] == partsDest[i])
			{
				nbLvChanges--;
			}
		}
		
		for (i = 0 ; i < nbLvChanges ; i++)
		{
			if (i == 0)
			{
				$scope.rollUp();
			}
			else
			{
				setTimeout(function(){ $scope.rollUp() }, (animDuration * 2) + 10);
			}
		}*/
		
		if (logfile[logCursor - 1].type == "down")
		{
			$scope.rollUp(logCursor - 1, true);
		}
		else
		{
			$scope.selectNode(logfile[logCursor - 1].id, logCursor - 1, logfile[logCursor - 1].type, true);
			if (logfile[logCursor].type == "up")
			{
				sig.graph.nodes().forEach(function(n) {
					if (n.id == logfile[logCursor].id)
					{
						levelStack.push(n);
						levelCursor++;
					}
				});
				$scope.drillDown();
			}
		}
	}
	
	/** Function to display the next node in the logfile **/
	$scope.nextNode = function()
	{
		$scope.selectNode(logfile[logCursor + 1].id, logCursor + 1, logfile[logCursor + 1].type, true);
	}
	
	/** Function to go to the first node of the logfile **/
	$scope.goToFirst = function()
	{
		$scope.selectNode(logfile[0].id, 0, logfile[0].type, true);
	}
	
	/** Function to go to the last node of the logfile **/
	$scope.goToLast = function()
	{		
		$scope.selectNode(logfile[logfile.length - 1].id, logfile.length - 1, logfile[logfile.length - 1].type, true);
	}
	
	/** Function to reselect the last selected node **/
	$scope.backToLastSelected = function()
	{		
		/* Selecting the node */
		$scope.selectNode(logfile[lastSelected].id, lastSelected, logfile[lastSelected].type, true);
		lastSelected = -1;
	}
	
	/** Function to change the current displayed tab **/
	$scope.changeTab = function(newTab)
	{
		/* Changing the style of the tabs */
		document.getElementById(currentTab).className = "tab nonSelectedTab";
		document.getElementById(newTab).className = "tab selectedTab";
		
		/* Erasing the content of the current tab */
		document.getElementById(currentTab + "Content").className = "tabContent nonSelectedContent";
		
		/* Displaying the content of the new tab */
		document.getElementById(newTab + "Content").className = "tabContent selectedContent";
		currentTab = newTab;
	}

		/** Function to fade out the splash screen **/
	$scope.splashscreenOnClick = function()
	{
		// Assign splash screen click behaviour
		var splashscreen = document.getElementById("splashscreen");
		$scope.fadeOut(splashscreen);
		
		/* Run demo */
		setTimeout(function(){ $scope.runDemo(); }, 1500);
		//$scope.runDemo();
	}

	/** Function to fade out an element **/
	// http://www.chrisbuttery.com/articles/fade-in-fade-out-with-javascript/
	$scope.fadeOut = function (el)
	{
	  el.style.opacity = 1;

	  (function fade() {
	    if ((el.style.opacity -= .02) < 0) {
	      el.style.display = "none";
	    } else {
	      requestAnimationFrame(fade);
	    }
	  })();
	}


	$scope.applyEdgeWeightFilter = function(e) 
	{
		// Get new weight upper bound
	    var v = e.target.value;

	    // Update label for user notification
	    document.getElementById('max-weight-value').textContent = v;

	   	// Create filter
	    filter
	      .undo('max-weight')
	      .edgesBy(
	        function(e, params) {
	          return e.weight < params.maxWeightVal;
	        },
	        {
	          maxWeightVal: +v
	        },
	        'max-weight'
	      )
	      .apply();
  	}

	$scope.BuildPlot = function()
	{
		// Get x coordinates
		var indices = [];
		for (var i = 1; i <= sig.graph.edges().length; i++) {
		   indices.push(i);
		}

		// Get y coordiantes (edges weights)
		var weights = [];
		sig.graph.edges().forEach(function(e) {
			weights.push(e.weight);
		});		
		// Sort weights
		weights.sort();
		
		// Build data of the plot
		var data  = [
			{
				x: indices,
				y: weights,
				mode: 'lines',
				line: {
				  color: 'rgb(211, 202, 173)',
				  width: 3
				}
			}
		];

		// Layout of the plot
		var layout = {
		  title: 'Edges weights distribution',
		  xaxis: {
		    title: 'Edge',
		    titlefont: {
		      family: 'Courier New, monospace',
		      size: 18,
		      color: '#7f7f7f'
		    }
		  },
		  yaxis: {
		    title: 'Edge weight',
		    titlefont: {
		      family: 'Courier New, monospace',
		      size: 18,
		      color: '#7f7f7f'
		    }
		  }
		};

		// Plot !
		Plotly.plot( 'edgesWeightsPlot', data, layout );
	}

	$scope.BuildHistogram = function()
	{
		
		// Get edges weights
		var weights = [];
		sig.graph.edges().forEach(function(e) {
			weights.push(e.weight);
		});		

		// Build data of the plot
		var data = [
		  {
		    x: weights,
		    type: 'histogram',
			marker: {
			   color: 'rgb(211, 202, 173)'
			}
		  }
		];

		// Layout of the histogram
		var layout = {
		  title: 'Edges weights histogram',
		  xaxis: {
		    title: 'Edge weight',
		    titlefont: {
		      family: 'Courier New, monospace',
		      size: 18,
		      color: '#7f7f7f'
		    }
		  },
		  yaxis: {
		    title: '# edges',
		    titlefont: {
		      family: 'Courier New, monospace',
		      size: 18,
		      color: '#7f7f7f'
		    }
		  }
		};

		Plotly.newPlot('edgesWeightsHistogram', data, layout);
	}
	
	/** 
	 * Function to present an online demo
	 **/
	$scope.runDemo = function()
	{	
		var graphURL = "./data/DAS2016/words_BlockHOG_LDTW_sigmajs_layout.gexf";
		imagePath = "http://frederic.rayar.free.fr/dinet/data/DAS2016/grey/"

		var xmlhttp = new XMLHttpRequest();
		xmlhttp.onreadystatechange = function() {
			if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {

				// Read as JSON
				var jsonGraph = ConverterService.GEXFtoJSON(xmlhttp.responseText);
				currentGraph = JSON.parse(jsonGraph);

				// Read as sigma graph
				sig.graph.read(currentGraph);

				// Init the visualisation
				$scope.init();

				// Display the graph
				$scope.display();
			}
		};
		xmlhttp.open("GET", graphURL, true);
		xmlhttp.send();
	}

}]);