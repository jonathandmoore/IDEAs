var ideas = (function () {

	var edgeFiles = new Array();
	var expFiles = new Array();
	var experData = new Object();
	var expIndexes = new Object();
	var edgeCounts = new Object();
	var attConfigShown;
	var edgeWarningLimit;
	var graphShown = false;
	var chosenID = "";
	var nodeAtt = "";
	var userNodeData = new Object();
	
	var edgeFileReader;
	var expFileReader;
	
	var network_json = {
		dataSchema: {
			nodes: "",
			edges: ""
		},
		data: {
			nodes: "",
			edges: ""
		}
	};
	
	var nameMapper = {
		attrName: "label"
	}

	var colorMapper = {
       	attrName: "type",
       	entries: []
	};
	
	var visual_style = {
		global: {
	  	},
	  	nodes: {
	  		label: { passthroughMapper: { attrName: "label" } },
			size: 25,
			borderWidth: 1,
			color: {
				discreteMapper: {
					attrName: "of_interest_here",
					entries: [
			  			{ attrValue: 1, value: "#FFFFFF" }
					]
				}
			},
			borderColor: {
		  	discreteMapper: {
			attrName: "of_interest_here",
			entries: [
			  { attrValue: 1, value: "#FF0B0B" }
			]
			}
		}
	  	},
	  	edges: {
			color: { discreteMapper: colorMapper },
			label: { passthroughMapper: { attrName: "type" } },
			width: 1
		}
	}
	var draw_options = {
		network: "",
	  	nodeLabelsVisible: true,
	  	edgeLabelsVisible: true,
	  	layout: "ForceDirected",
	  	visualStyle: visual_style,
	};
	
	var node_attribute_order = new Array();
	var edge_attribute_order = new Array();
	var node_attribute_group = new Array();
	var edge_attribute_group = new Array();
	var node_attribute_groups = new Array();
	var edge_attribute_groups = new Array();  
	var vis = new org.cytoscapeweb.Visualization("cytoscapeweb");
	
	vis.ready(function() {
        
        $("body").removeClass("loading");
        
	   vis.addContextMenuItem("Delete node", "nodes", function(evt) {
		  //console.log(vis.firstNeighbors([evt.target.data.id]));
		  var fn = vis.firstNeighbors([evt.target.data.id])
		  //console.log(fn["edges"]);
		  
		  if ((vis.nodes().length == 1) && (vis.edges().length == 0)) {
				//Hide second set of tabs
				new_search_reset_page();
		  }
			
		  vis.removeNode(evt.target.data.id, true);
		  
		  $.each(fn["edges"], function(ind, val) {
		  		deleteEdge(val);
 		  });
 		  
 		  
		  
	   })
        vis.addContextMenuItem("Hide node", "nodes", function(evt) {
               var id = evt.target.data.id;
               vis.filter("nodes", function(node) {
     			return (node.data.id != id && node.visible != false);
 			}, true);
         })
         vis.addContextMenuItem("Hide edge", "edges", function(evt) {
             var id = evt.target.data.id;
             vis.filter("edges", function(edge) {
     			return (edge.data.id != id && edge.visible != false);
 			}, true);
 			
 			
 			
         })
         .addContextMenuItem("Delete edges of this type", "edges", function(evt) {
             
             console.log("HELLO");
             var type = evt.target.data.type;
             var allEdges = vis.edges();
             console.log(allEdges);
             
             $.each(allEdges, function(ind, val) {
             	//console.log(val);
		  		if (val.data.type == type) {
		  			//console.log("MATCH");
		  			vis.removeEdge(val.data.id, true);
		  			deleteEdge(val);
		  		} 
		  	});          		
         })
         .addContextMenuItem("Delete edge", "edges", function(evt) {
             vis.removeEdge(evt.target.data.id, true);
             
             deleteEdge(evt.target);
                       		
         })
         .addContextMenuItem("Delete selected", function(evt) {
             var items = vis.selected();
             var selEdges = vis.selected("Edges");
             if (items.length > 0) { vis.removeElements(items, true); }
             
             console.log(selEdges);
             $.each(selEdges, function(ind, val) {
		  		deleteEdge(val);
 		  	 });
         })
        vis.addContextMenuItem("Add node to search", "nodes", function(evt) {
           var currText = $('#genes').val();
           currText = currText.replace(/(\r\n|\r)/gm,"\n");
           
           if (currText.charAt(currText.length-1) == '\n' || currText == "") {
           
           		$('#genes').val(currText + evt.target.data.id + "\n");
           	} else {
           		$('#genes').val(currText + '\n' + evt.target.data.id + "\n");
           	}
        })
         .addContextMenuItem("Add selected nodes to search", function(evt) {
             var currText = $('#genes').val();
             currText = currText.replace(/(\r\n|\r)/gm,"\n");
    
             var items = vis.selected("nodes");
             var newText = "";
             $.each(items, function(ind, val) {
 				newText = newText + val.data.id + "\n";
 			});
 		
 			//Check if the final character is a \n and add one if not
 			if (currText.charAt(currText.length-1) == '\n' || currText == "") {
            	$('#genes').val(currText + newText);	 
            } else {
            	$('#genes').val(currText + '\n' + newText);
            }
         })
         .addContextMenuItem("Hide edges of this type", "edges", function(evt) {
         	var type = evt.target.data.type;
         	var type2 = type.replace(/ /g,"_");
         	vis.filter("edges", function(edge) {
     			return (edge.data.type != type && edge.visible != false);
 			}, true);
 			var origin = evt.target.data.origin;
 			//Uncheck this edge
 			if (origin != "file") {
 				$('input:checkbox[value=' + type2 + ']').prop("checked", false);
 			}
 		})
 		.addContextMenuItem("Hide all edges not of this type", "edges", function(evt) {
         	var type = evt.target.data.type;
         	var type2 = type.replace(/ /g,"_");
         	vis.filter("edges", function(edge) {
     			return edge.data.type == type;
 			}, true);
 			$.each($("input[name='edge_source[]']"), function() {
 				$(this).prop("checked", false);
 			});
 			$.each($("input[name='bg_phy_source[]']"), function() {
 				$(this).prop("checked", false);
 			});
 			$.each($("input[name='bg_gen_source[]']"), function() {
 				$(this).prop("checked", false);
 			});
 			$('input:checkbox[value=' + type2 + ']').prop("checked", true);
 		})
 		.addContextMenuItem("Remove all filters", function(evt) {
         	vis.removeFilter();
         	//Reset edge checkboxes
         	$('.active').prop("checked", true);
 		})
 		.addContextMenuItem("Update edge filters", function(evt) {
        	//Go through all edges in bold and add to list if they are selected
         	var edgesToKeep = new Array();
         	var type;
         	var type2;
         	$.each($('.active'), function() {
 				if ($(this).is(":checked")) {
 					type = $(this).val();
 					type2 = type.replace(/_/g," ");
 					edgesToKeep.push(type2);	
 				}
 			});
 			
 			vis.filter("edges", function(edge) {
 				return $.inArray(edge.data.type, edgesToKeep) != -1 || (edge.data.origin == "file" && edge.visible == true);
 			}, true);
		});
	});
	
	var _mouseOverNode;
	
	vis.addListener("click", "edges", function(event) {
    		handle_edge_click(event);
	})
	.addListener("mouseover", "nodes", function(event) {
		_mouseOverNode = event.target;
		highlighFirstNeighbors(event.target);
	})
	.addListener("mouseout", "nodes", function(event) {
		_mouseOverNode = null;
		clearFirstNeighborsHighligh();
	})
	.addListener("dblclick", "nodes", function(event) {
		handle_node_dblclick(event);
	})
	.addListener("dblclick", "edges", function(event) {
		handle_edge_dblclick(event);
	})
	.addListener("select", "nodes", function(event) {
		handle_selected_nodes(event);
	});
	

	//Function definitions
	function deleteEdge(edge) {
		console.log(edge["data"]);
		var origin = edge.data.origin;
		var type = edge.data.type;
		console.log(origin);
		console.log(type);
		console.log(edgeCounts);
		console.log(edgeCounts[origin][type]);
		edgeCounts[origin][type] = edgeCounts[origin][type] - 1;
		console.log(edgeCounts[origin][type]);
		if (edgeCounts[origin][type] == 0 && origin != "file") {
			//Uncheck checkbox, unbold text and remove active class
			var type2 = type.replace(/ /g,"_");
			console.log(type2);
			$('input:checkbox[value=' + type2 + ']').prop("checked", false);
			$('input:checkbox[value=' + type2 + ']').removeClass('active');
			if (origin == "db") {
				$('label[for="' + type2 + '_db_edge"]').removeClass('bold');
			} else if (origin == "biogrid") {
				$('label[for="' + type2 + '_bg_gen_edge"]').removeClass('bold');
				$('label[for="' + type2 + '_bg_phy_edge"]').removeClass('bold');
			}
			
			//Check if entire graph has been deleted
			//console.log(vis.nodes().length);
			//console.log(vis.edges().length);
			if ((vis.nodes().length == 0) && (vis.edges().length == 0)) {
				//Hide second set of tabs
				new_search_reset_page();
			}
		}
	}
	
	
	function show_connections_biogrid(result_type) {
	
		var action = result_type; //"graph" or "report"
		new_search_reset_page();
		
		//Check for gene text
		var gene_text = process_gene_text_box();
		
		//Check for edge file
		var edge_file_text = process_edge_file();
			
		//Only continue if possible search genes found
		if (gene_text.length != 0 || edge_file_text.length != 0) {
			
			//Get Any DB Edge Selections	
			var edges = [];
			$.each($("input[name='edge_source[]']:checked"), function() {
				edges.push('"' + $(this).val() + '"');
			});
			
			//Get Any BioGRID Edge Selections
			var temp_name;
			var bg_edges = [];
			$.each($("input[name='bg_phy_source[]']:checked"), function() {
				temp_name = $(this).val();
				temp_name = temp_name.replace(/_/g,"%20");
				bg_edges.push(temp_name);
			});
			$.each($("input[name='bg_gen_source[]']:checked"), function() {
				temp_name = $(this).val();
				temp_name = temp_name.replace(/_/g,"%20");
				bg_edges.push(temp_name);
			});
			
			//Search config
			var search_config = new Object();
			$.each($(".search_config"), function(ind, value) {
 				search_config[this.id] = this.checked;
 			});
 			//console.log(search_config);
			
			var sendData = {
				"gene_text": gene_text,
				"edges": edges,
				"file_data": edge_file_text,
				"edge_file_arrows": $('#edge_file_arrows').is(':checked'),
				"edge_file_separator": $('input:radio[name=sep]:checked').val(),
				"hide_unconnected_nodes": $('#hide_unconnected_checkbox').is(':checked'),
				"bg_tax_ID": $('#tax_ID option:selected').val(),
				"exclude_interspecies_ints": $('#exclude_interspecies_ints').is(':checked'),
				"exclude_self_ints": $('#exclude_self_ints').is(':checked'),
				"bg_throughput": $('input:radio[name=bg_throughput]:checked').val(),
				"bg_edges": bg_edges,
				"search_config": search_config,
				"search_mode": $('input:radio[name=search_mode]:checked').val()
			};
			
			//console.log(sendData);
			
			//Ajax processing
			$.ajax({
				type: "POST",  
				url: "search_biogrid.php", 
				data: sendData,
				async: true,
				dataType: "json",
				beforeSend: function() {
					$("body").addClass("loading"); 
				},
				success: function(data) {
					
					if (data.nodes_json.length == 0) {
						$("body").removeClass("loading");
						set_data_display_report(data);
					} else {
						if (action === "graph") {
							if (data.edges_json.length > edgeWarningLimit) {
								//Number of edges greater than the max configured so display report
								set_data_display_report(data);
								$("body").removeClass("loading");
							} else {
								set_data_display_graph(data);
							}
							
						} else if (action === "report") {
							set_data_display_report(data);
							$("body").removeClass("loading");
						}
					}
				},
				error: function(data) {
					display_error("An error occurred - please try again later");
					$("body").removeClass("loading");
				}
			});
			
		} else {
			//No search genes found;
			display_error("no search nodes entered");
		}
		
	}

	function process_gene_text_box() {
		var result = $('#genes').val();
		return result;
	}
	
	function process_edge_file() {
	
		var result = "";
		if (edgeFiles.length != 0) {
			result = edgeFileReader.result;
		}
		return result;
	}
	
	function set_data_display_graph(data) {
		network_json.data.nodes = data.nodes_json;
		network_json.data.edges = data.edges_json;
		draw_options.network = network_json;
		edgeCounts = data.edge_counts;
		
		//Update page header
		//$("#page-header").empty();
		//$("#page-header").append('<img src="images/presta_ideas_logo.png"></img>');
		//$("#page-header").append('<div style="float:right"><a href="logout.php">Log out</a>&nbsp&nbsp&nbsp<a href="https://www.wsbc.warwick.ac.uk/groups/presta/wiki/53adf/IDEAs_database_Documentation.html" target="_blank">About</a></div>');
			
		display_graph();
	}
	
	function display_graph() {
		
		//set_visual_style();
		vis.draw(draw_options);
		graphShown = true;
		//$('#update_visual_style').prop('disabled', false);
		//$('#default_visual_style').prop('disabled', false);
		
		//Set labels of all edges to bold and add active class
		if ('db' in edgeCounts) {
			$.each($("input[name='edge_source[]']"), function() {
				var type = $(this).val();
				if (type in edgeCounts["db"]) {
					$(this).addClass('active');
					$('label[for="' + type + '_db_edge"]').addClass('bold');
				}
			});
		}
			
		if (('biogrid' in edgeCounts) && !("ERROR" in edgeCounts["biogrid"])) {
			var type;
			//Physical Interactions
			$.each($("input[name='bg_phy_source[]']"), function() {
				type = $(this).val();
				var type2 = type.replace(/_/g," ");
				if (type2 in edgeCounts["biogrid"] ) {
					$(this).addClass('active');
					$('label[for="' + type + '_bg_phy_edge"]').addClass('bold');
				}
			});
			
			//Genetic Interactions
			$.each($("input[name='bg_gen_source[]']"), function() {
				type = $(this).val();
				var type2 = type.replace(/_/g," ");
				if (type2 in edgeCounts["biogrid"]) {
					$(this).addClass('active');
					$('label[for="' + type + '_bg_gen_edge"]').addClass('bold');
				}
			});
		}
		
		if ('file' in edgeCounts) {
			var selection = $('#filecol').val();
			
			if (selection != "#c0c0c0") {
				
				var notfound;
				var i;
				var len;
				$.each(edgeCounts['file'], function(ind, val) {
					
					notfound = true;
					i = 0;
					len = colorMapper.entries.length;
					while (notfound && i < len) {
						if (colorMapper.entries[i].attrValue == ind) {
							colorMapper.entries[i].value = selection;
							notfound = false;
						}
						i = i + 1;
					}
					
					//Add if not found
					if (notfound) {
						colorMapper.entries.push( { attrValue: ind, value: selection } );
					}	
				});
			}
		}
			
		//Unhide second set of tabs
		$('#mytabber2').show();
	}
	
	function display_error(error) {
	
		var resStr = "";
		resStr = resStr + display_search_options();
		
		resStr = resStr + "<br><h3>SEARCH RESULTS:</h3>";
		resStr = resStr + "None: " + error + "<br>";
	
		$("#cytoscapeweb").empty();
		$("#cytoscapeweb").append(resStr);
	}
	
	function display_search_options() {
		var resStr = "<br><br><h3>SEARCH OPTIONS:</h3>";
		//Display depth selection
		if ($('input:radio[name=search_mode]:checked').val()=="depth0") {
			resStr = resStr + "Depth 0 selected (only nodes entered by user displayed)<br>";
		} else if ($('input:radio[name=search_mode]:checked').val()=="depth1_basic") {
			resStr = resStr + "Depth 1 selected (without interactor interactions)<br>";
		} else if ($('input:radio[name=search_mode]:checked').val()=="depth1_extended") {
			resStr = resStr + "Depth 1 selected (with interactor interactions)<br>";
		}
		//Display unconnected node status
		if ($('#hide_unconnected_checkbox').is(':checked')) {
			resStr = resStr + "Unconnected nodes: hidden<br>";
		} else {
			resStr = resStr + "Unconnected nodes: not hidden<br>";
		}
		//Display self interaction status
		if ($('#exclude_self_ints').is(':checked')) {
			resStr = resStr + "Self interactions: excluded<br>";
		} else {
			resStr = resStr + "Self interactions: included<br>";
		}
		return resStr;
	}

	function set_data_display_report(data) {
		network_json.data.nodes = data.nodes_json;
		network_json.data.edges = data.edges_json;
		edgeCounts = data.edge_counts;
		draw_options.network = network_json;
		 
		//Update page header
		//$("#page-header").empty();
		//$("#page-header").append('<img src="images/presta_ideas_logo.png"></img>');
		//$("#page-header").append('<div style="float:right"><a href="logout.php">Log out</a>&nbsp&nbsp&nbsp<a href="https://www.wsbc.warwick.ac.uk/groups/presta/wiki/53adf/IDEAs_database_Documentation.html" target="_blank">About</a></div>');

		var resStr = "";
		resStr = resStr + display_search_options();
		
		resStr = resStr + "<h3>SEARCH RESULTS:</h3>";
		
		resStr = resStr + data.nodes_json.length + " nodes found<br>";
		
		if (data.edges_json.length > edgeWarningLimit) {
			resStr = resStr + data.edges_json.length + " edges found ";
			resStr = resStr + "<font color='red'>***NUMBER OF EDGES VERY LARGE - GRAPH DISPLAY MIGHT BE SLOW!!!!!!***</font><br>";
		} else {
			resStr = resStr + data.edges_json.length + " edges found<br>";
		}
		
		//DB
		if ('db' in data.edge_counts) {
			resStr = resStr + "<br><b>Database edge counts:</b><br>";
			$.each(data.edge_counts["db"], function(edge, count) {
				resStr = resStr + edge + " - " + count + "<br>";
			});
		}
		
		//BIOGRID
		if ('biogrid' in data.edge_counts) {
			resStr = resStr + "<br><b>BioGRID edge counts:</b><br>";
			if ('ERROR' in data.edge_counts["biogrid"]) {
				resStr = resStr + "BioGRID search unsuccessful (error returned)<br>";	
			} else {
				var tempResStr = ""
				//Add physical interactions (in same order as they appear on page)
				$.each($("input[name='bg_phy_source[]']:checked"), function() {
					temp_name = $(this).val();
					temp_name = temp_name.replace(/_/g," ");
					if (temp_name in data.edge_counts["biogrid"]) {
						tempResStr = tempResStr + temp_name + " - " + data.edge_counts["biogrid"][temp_name] + "<br>";
					}
				});
				
				if (tempResStr != "") {
					resStr = resStr + "<br>Physical interactions:<br>" + tempResStr;	
				} 
				
				tempResStr = ""
				//Add genetic interactions (in same order as they appear on page)
				$.each($("input[name='bg_gen_source[]']:checked"), function() {
					temp_name = $(this).val();
					temp_name = temp_name.replace(/_/g," ");
					if (temp_name in data.edge_counts["biogrid"]) {
						tempResStr = tempResStr + temp_name + " - " + data.edge_counts["biogrid"][temp_name] + "<br>";
					}
				});
				
				if (tempResStr != "") {
					resStr = resStr + "<br>Genetic Interactions:<br>" + tempResStr;	
				} 
			}
		} 
		
		//FILE
		if ('file' in data.edge_counts) {
			resStr = resStr + "<br><b>File edge counts:</b><br>";
			$.each(data.edge_counts["file"], function(edge, count) {
				resStr = resStr + edge + " - " + count + "<br>"
			});
		} 
		
		if (data.nodes_json.length != 0) {
		//Add download sif button here
			resStr = resStr + "<br><input type='button' value='Download sif file' id='export_sif_nodraw'/>";
			resStr = resStr + "<input type='button' value='Display graph' id='display_graph'/>";
		}
	
		$("#cytoscapeweb").empty();
		$("#cytoscapeweb").append(resStr);
	}

	function new_search_reset_page() {
		$('#note').empty();
		$('#plots').empty();
		$('#data_div').empty();
		$('#cytoscapeweb').empty();
		$('#mytabber2').hide();
		$('.bold').removeClass('bold');
		$('.active').removeClass('active');
		
		graphShown = false;
		
		//Reset network
		//network_json.data.nodes = "";
		//network_json.data.edges = "";	
	}
	
	function refresh_plots(geneArray, panel) {
	
		console.log("refresh plots");
		//Get gene data by ajax and set expData
		var sendData = {
			"geneData": geneArray
		}
		
		var allExpData = new Object();
		$.each(geneArray, function(geneIndex, geneName) {
			allExpData[geneName] = new Object();
			allExpData[geneName]["gene"] = geneName;
			console.log(geneName);
			allExpData[geneName]["experiments"] = new Array();
		
		});
		
		console.log(experData);
		var systemData = false;
		//First, retrieve any expression data from user defined files
		$.each(experData, function(expIndex, expDetails) {	
			if (expDetails['origin'] == 'user') {
				//Search for each gene
				$.each(geneArray, function(geneIndex, geneName) {
					var index;
					var num = expDetails['genes'].length;
					var cont = true;
					var i = 0;
					while (cont && i < num) {
					
						if (expDetails['genes'][i].toUpperCase() == geneName) {
							cont = false;
							index = i;
						} 
						i++;
					}
					
					//If found
					if (!cont) {
						var treatments = new Array();
						var treatment;
						$.each(expDetails['conditions'], function(conIndex, conDetails) {
							treatment = new Object();
							treatment["treatment"] = conDetails["condition"];
							//Add obsNorm
							treatment["obsNorm"] = conDetails["obsNorm"][index]
							//Add empty array for obsRaw so plotting script will run
							treatment["obsRaw"] = [];
							//Add empty array for switches so plotting script will run
							treatment["switches"] = [];
							treatments.push(treatment);
						});
						var experiment = new Object();
						experiment["experiment"] = expDetails['experiment'];
						experiment["replicates"] = expDetails['replicates'];
						experiment["timepoints"] = expDetails['sampleLabels'];
						experiment["treatments"] = treatments;
						
						allExpData[geneName]["experiments"].push(experiment);
					}
				});
			} else if (expDetails['origin'] == 'system') {
				systemData = true;	
			}
		});
	
		console.log(systemData);
	
		//Only do this if there is some system expression data defined
		if (systemData) {
			$.ajax(
			{
				type: "POST",
				url:"plotdata.php",
				dataType:"json",
				async:false,
				data: sendData,
				success:function(data) {
					expData = data.geneData;
					$.each(expData, function(ind, adata) {
						$.each(adata["experiments"], function(index, experimentDetails) {
							allExpData[adata["ID"].toUpperCase()]["experiments"].push(experimentDetails)	
						});
					});
				}
			});
		}
		
		console.log(allExpData);
		
        var panelString = '<div style=\"margin: 0; overflow: auto; width: 600px;\">';
			panelString += '<div id=\"plottingWindow0\" style=\"float: left; width: 300px;\"></div>';
			panelString += '<div id=\"plottingWindow1\" style=\"float: left; width: 300px;\"></div>';
			panelString += '<div id=\"plottingWindow2\" style=\"float: left; width: 300px;\"></div>';
			panelString += '<div id=\"plottingWindow3\" style=\"float: left; width: 300px;\"></div>';
			panelString += '<div id=\"plottingWindow4\" style=\"float: left; width: 300px;\"></div>';
			panelString += '<div id=\"plottingWindow5\" style=\"float: left; width: 300px;\"></div>';
			panelString += '</div>';
		document.getElementById(panel).innerHTML += panelString;
                      
        if (geneArray.length === 1) {
        
        	console.log("LENGTH1");
        
        	//plotExpressionSingleGene("plottingWindow0",expData[geneArray[0]],"botrytis");
			//plotExpressionSingleGene("plottingWindow1",expData[geneArray[0]],"pseudomonas");
			//plotExpressionSingleGene("plottingWindow2",expData[geneArray[0]],"drought");
			//plotExpressionSingleGene("plottingWindow3",expData[geneArray[0]],"highlight");
			//plotExpressionSingleGene("plottingWindow4",expData[geneArray[0]],"long day");
			//plotExpressionSingleGene("plottingWindow5",expData[geneArray[0]],"short day");
			
			allExpData[geneArray[0]];
			
			var count = 0;
			$.each($('.plotclass'), function(i, item) {
				if ($(item).val() != "None") {
					plotDataSingleNode("plottingWindow" + count,allExpData[geneArray[0]],$(item).val());
					count++;
				} 
			});
			if (count == 0) {
				console.log("No experiments selected");
			}
			
         
         } else if (geneArray.length === 2) {
         
         	console.log("LENGTH2");
         
         	//var plotSwitches = true;
			//var filterSwitchStr = 0.5;
			//var showRange = false;
			//var changeExp = true;

			//plotExpressionTwoGenes("plottingWindow0",expData[geneArray[0]],expData[geneArray[1]],"botrytis",{"normalised":true,"treatment":"treated","geneNames":true,"plotSwitches":plotSwitches,"showDE":true,"changeExp":changeExp,"filterSwitchStr":filterSwitchStr,"showSwitchRange":showRange});
			//plotExpressionTwoGenes("plottingWindow1",expData[geneArray[0]],expData[geneArray[1]],"pseudomonas",{"normalised":true,"treatment":"hrpA","geneNames":true,"plotSwitches":plotSwitches,"showDE":true,"changeExp":changeExp,"filterSwitchStr":filterSwitchStr,"showSwitchRange":showRange});
			//plotExpressionTwoGenes("plottingWindow2",expData[geneArray[0]],expData[geneArray[1]],"drought",{"normalised":true,"treatment":"treated","geneNames":true,"plotSwitches":plotSwitches,"showDE":true,"changeExp":changeExp,"filterSwitchStr":filterSwitchStr,"showSwitchRange":showRange});
			//plotExpressionTwoGenes("plottingWindow3",expData[geneArray[0]],expData[geneArray[1]],"highlight",{"normalised":true,"treatment":"treated","geneNames":true,"plotSwitches":plotSwitches,"showDE":true,"changeExp":changeExp,"filterSwitchStr":filterSwitchStr,"showSwitchRange":showRange});
			//plotExpressionTwoGenes("plottingWindow4",expData[geneArray[0]],expData[geneArray[1]],"long day",{"normalised":true,"treatment":"LD11","geneNames":true,"plotSwitches":plotSwitches,"showDE":true,"changeExp":changeExp,"filterSwitchStr":filterSwitchStr,"showSwitchRange":showRange});
			//plotExpressionTwoGenes("plottingWindow5",expData[geneArray[0]],expData[geneArray[1]],"short day",{"normalised":true,"treatment":"SD19","geneNames":true,"plotSwitches":plotSwitches,"showDE":true,"changeExp":changeExp,"filterSwitchStr":filterSwitchStr,"showSwitchRange":showRange});
         
         	var count = 0;
			$.each($('.plotclass'), function(i, item) {
				if ($(item).val() != "None") {
					plotDataTwoNodes("plottingWindow" + count,allExpData[geneArray[0]],allExpData[geneArray[1]],$(item).val());
					count++;
				} 
			});
         
         } else {
         
         	//console.log("Can only handle max two genes at the moment");
         }
    }
	
	function show_promoter(source_node, panel) {
		//Use source_node to retrieve data about ReMos/DNAse and Y1H
		var panelString = "<iframe style=\"padding:0;margin:0\" src=\"dnase.html?width=596&atg=" + source_node + "\" width=\"596px\" height=\"550\" />"
		
		//Write it as part of the panel "promoter"
		document.getElementById(panel).innerHTML = panelString;
    }
    
     function handle_selected_nodes(event) {
        
        var numberOfNodesSelected = vis.selected("nodes").length;
        $("#note").empty();
        $("#plots").empty();
                		
        if (numberOfNodesSelected == 1) {
        
        	var target = event.target[0];
        	$("#note").append("<strong>" + event.group.substr(0,4) + ":</strong>");
            
            //var intAtt = $('#node_label option:selected').val();
            //target.data["id"] = target.data[intAtt];
            console.log(nodeAtt);
            var node_id;
            if (target.data[nodeAtt] == "-") {
            	node_id = target.data["id"];
            } else {
            	node_id = target.data[nodeAtt];
            }
        	console.log(node_id); 
        	
			var table_string = "<p><table>";
			
			if ( target.data["Entrez Gene ID"] !== null && target.data["Entrez Gene ID"]!=="-") {
    			target.data["Entrez Gene ID"] = '<a href="http://www.ncbi.nlm.nih.gov/gene/?term=' + target.data["Entrez Gene ID"] + '" target="_blank">' + target.data["Entrez Gene ID"] + '</a>';
    		}
    	
			for (var i = 0; i < node_attribute_order.length; i++) {
				if (attConfigShown == 'true') {
					if ((target.data[node_attribute_order[i]] != null) && ($("input[name='node_attribute_group[]']").filter("input[value='" + node_attribute_group[node_attribute_order[i]] + "']").is(':checked')) ) {
						table_string += '<tr><td><div class=\"note\">' + node_attribute_order[i] + '</div></td><td><div class=\"note\">' + target.data[node_attribute_order[i]] + "</div></td></tr>";
					}
				} else {
					if (target.data[node_attribute_order[i]] != null) {
						table_string += '<tr><td><div class=\"note\">' + node_attribute_order[i] + '</div></td><td><div class=\"note\">' + target.data[node_attribute_order[i]] + "</div></td></tr>";
					}
				}
			}
			table_string += "</table>";
			$("#note").append(table_string);
			
			//Only do this if there is some expression data available...
			var geneArray=new Array(node_id);
			if (!$.isEmptyObject(experData)) {
				refresh_plots(geneArray, "plots");
			} else {
				//console.log("No expression data available");
			}
			
			// Update the promoter tab with the dnase information
			//show_promoter(node_id, "promoter");
			
		} else if (numberOfNodesSelected == 2) {
			if (!$.isEmptyObject(experData)) {
				var targets = vis.selected("nodes");
				var source_id;
				if (targets[0].data[nodeAtt] == "-") {
            		source_id = targets[0].data["id"];
				} else {
					source_id = targets[0].data[nodeAtt];
				}
        	
				var target_id;
				if (targets[0].data[nodeAtt] == "-") {
            		target_id = targets[1].data["id"];
				} else {
					target_id = targets[1].data[nodeAtt];
				}
				//var geneArray=new Array(targets[0].data["id"], targets[1].data["id"]); 
				var geneArray=new Array(source_id, target_id); 
				refresh_plots(geneArray, "plots");
			}
		} 
    }
    	
    function highlighFirstNeighbors(target) {
		setTimeout(function() {
		if (_mouseOverNode != null && _mouseOverNode.data['id'] === target.data['id']) {
			var fn = vis.firstNeighbors([target]);
			var bypass = { nodes: {}, edges: {} };
			var allNodes = vis.nodes();
            for (var i=0; i < allNodes.length; i++) {
                var n = allNodes[i];
			  	bypass["nodes"][n.data["id"]] = { opacity: 0.4,
                                                            labelFontSize: 11 };
            }
			var neighbors = fn.neighbors;
			neighbors = neighbors.concat(fn.rootNodes);
            for (var i=0; i < neighbors.length; i++) {
                var n = neighbors[i];
                bypass["nodes"][n.data.id] = { opacity: 1,
                                                         labelFontSize: 13 };
            }
		
			var allEdges = vis.edges();
            for (var i=0; i < allEdges.length; i++) {
            	var e = allEdges[i];
                bypass["edges"][e.data["id"]] = { opacity: 0.2 };
            }
			var edges = fn.edges;
            for (var i=0; i < edges.length; i++) {
                var e = edges[i];
                bypass["edges"][e.data["id"]] = { opacity: 1 };
            }
		
			vis.visualStyleBypass(bypass);
			}
		}, 10);
	}
		
	function clearFirstNeighborsHighligh() {
		setTimeout(function() {
		if (_mouseOverNode == null) {
			vis.visualStyleBypass({});
		}
		}, 10);
	}
		
	function handle_edge_click(event) {
	
    	var target = event.target;
    	$("#note").empty();
        $("#plots").empty();
        $("#note").append("<strong>" + event.group.substr(0,4) + ":</strong>");
    
    	//var intAtt = $('#node_label option:selected').val();
    
        //Replace source node
        //target.data.source = vis.node(target.data.source).data[intAtt];
        
        //Replace target node
        //target.data.target = vis.node(target.data.target).data[intAtt];
        
        //var source_node = target.data.source;
        //var target_node = target.data.target;
        
        //Set source node
        var source_node;
        if (vis.node(target.data.source).data[nodeAtt] == "-") {
			source_node = vis.node(target.data.source).data["id"];
		} else {
			source_node = vis.node(target.data.source).data[nodeAtt];
		}
        
        //Set target node
        var target_node;
        if (vis.node(target.data.target).data[nodeAtt] == "-") {
			target_node = vis.node(target.data.target).data["id"];
		} else {
			target_node = vis.node(target.data.target).data[nodeAtt];
		}
        
        //Temporary code to display Pubmed IDs as links
        if( target.data["Pubmed ID"] !== null ) {
    		//Replace with link
    		target.data["Pubmed ID"] = '<a href="http://www.ncbi.nlm.nih.gov/pubmed/?term=' + target.data["Pubmed ID"] + '" target="_blank">' + target.data["Pubmed ID"] + '</a>';
    	} 
        var len = edge_attribute_order.length;
        var table_string = "<p><table>";
		for (var i = 0; i < len; i++) {
			if (attConfigShown == 'true') {
				if (target.data[edge_attribute_order[i]] != null && ($("input[name='edge_attribute_group[]']").filter("input[value='" + edge_attribute_group[edge_attribute_order[i]] + "']").is(':checked'))) {
					table_string += '<tr><td><div class=\"note\">' + edge_attribute_order[i] + '</div></td><td><div class=\"note\">' + target.data[edge_attribute_order[i]] + "</div></td></tr>";
				}
			} else {
				if (target.data[edge_attribute_order[i]] != null) {
					table_string += '<tr><td><div class=\"note\">' + edge_attribute_order[i] + '</div></td><td><div class=\"note\">' + target.data[edge_attribute_order[i]] + "</div></td></tr>";	
				}
			}
		}
		table_string += "</table>";
		$("#note").append(table_string);
		if (!$.isEmptyObject(experData)) {
			//refresh_plots(source_node, target_node, "plots");
			var geneArray;
			if (source_node === target_node) {
				geneArray=new Array(source_node); 
			} else {
				geneArray=new Array(source_node, target_node);
			}
			refresh_plots(geneArray, "plots");
		}
	}
			
	function handle_node_dblclick(event) {
		var target = event.target;
		$("#genes").val(target.data["id"]);
		show_connections_biogrid("graph");
	}
			
	function handle_edge_dblclick(event) {
		var target = event.target;
		var genes = "";
		if (target.data.source === target.data.target) {
			genes += target.data.source + "\n";
		} else {
			genes += target.data.source + "\n" + target.data.target + "\n";
		}
		$("#genes").val(genes);
		show_connections_biogrid("graph");
	}

	function network_JSON_to_sif() {
		//Convert network JSON to sif format
		var converted_res = new Array();
		var edges_length = network_json.data.edges.length;
		var used_nodes = new Object();
		
		for (var i = 0; i < edges_length; i++) {
  			//Add edge to results
  			var source = network_json.data.edges[i]["source"];
  			var target = network_json.data.edges[i]["target"];
  			
  			converted_res.push(source + "\t" + network_json.data.edges[i]["label"] + "\t" + target); 
  			used_nodes[source] = "";
  			used_nodes[target] = "";
  		}
		
		//Add any singleton nodes
		var nodes_length = network_json.data.nodes.length;
		for (var i = 0; i < nodes_length; i++) {
			
			var node = network_json.data.nodes[i]['id']
			if (!(node in used_nodes)) {
				converted_res.push(node);	
			}
		}
		var data = converted_res.join("\n");
		
		hiddenFormDownload(data, "network_sif.txt", "text/plain");
		
	}
	
	function hiddenFormDownload(data, filename, content_type) {
		//Send string to server
		$('<form action="download.php" method="POST">' + '<input type="hidden" name="data" value="' + data + '"><input type="hidden" name="filename" value=' + filename + '><input type="hidden" name="content_type" value=' + content_type + '></form>').submit();	
	}
	
	function display_selected_nodes() {
		$('#data_div').empty();
		var nodes = vis.selected("nodes");	
		if (nodes.length == 0) {
			$('#data_div').append(" No nodes selected.");	
		} else {
			display_nodes(nodes);
		}
	}
	
	function display_all_nodes() {
		$('#data_div').empty();
		var nodes = vis.nodes();	
		if (nodes.length == 0) {
			$('#data_div').append(" No nodes found.");	
		} else {
			display_nodes(nodes);
		}
	}
	
	function display_nodes(nodes) {			
			
		var table_string = "<p><table bgcolor=#FFFFFF border=1 bordercolor=lightgrey CELLPADDING='3' CELLSPACING='2' style='border-collapse:collapse;'><tr>";
		//Generate the table header
		var len = node_attribute_order.length;
		for (var i = 0; i < len; i++) {
		
			//Only show attribute if attribute group is selected
			if (attConfigShown == 'true') {
				if ($("input[name='node_attribute_group[]']").filter("input[value='" + node_attribute_group[node_attribute_order[i]] + "']").is(':checked')) {
					table_string += '<td ALIGN="CENTER" bgcolor=#E0FFE0><H4>' + node_attribute_order[i] + '<H4></td>';
				}
			} else {
				table_string += '<td ALIGN="CENTER" bgcolor=#E0FFE0><H4>' + node_attribute_order[i] + '<H4></td>';
			}
		}
		
		table_string += "</tr>\n";
		for (var node in nodes) {
			var curr_node_data = nodes[node].data;
			table_string += '<tr>';
			for (var i = 0; i < len; i++) {
				if (attConfigShown == 'true') {
					if ($("input[name='node_attribute_group[]']").filter("input[value='" + node_attribute_group[node_attribute_order[i]] + "']").is(':checked')) {
						if (curr_node_data[node_attribute_order[i]] !== null) {
							table_string += '<td>' + curr_node_data[node_attribute_order[i]] + "</div></td>\n";
						} else {
							table_string += '<td>' + '-' + "</div></td>\n";
						}
					}
				} else {
					if (curr_node_data[node_attribute_order[i]] !== null) {
							table_string += '<td>' + curr_node_data[node_attribute_order[i]] + "</div></td>\n";
					} else {
						table_string += '<td>' + '-' + "</div></td>\n";
					}
				}
			}
			table_string += "</tr>\n";
		}
		table_string += "</table>\n";
		
		//Display this in a separate tab
		var win=window.open('display.html', '_blank');
		$(win).load(function(){
			win.document.getElementById("content").innerHTML = table_string;
		});	
	}
	
	function display_selected_edges() {
		$('#data_div').empty();
		var edges = vis.selected("edges");
		if (edges.length == 0) {
			$('#data_div').append(" No edges selected.");
		} else {
			display_edges(edges);
		}
	}
	
	function display_all_edges() {
		$('#data_div').empty();
		var edges = vis.edges();
		if (edges.length == 0) {
			$('#data_div').append(" No edges found.");
		} else {
			display_edges(edges);
		}
	}

	function display_edges(edges) {
		
		var table_string = "<p><table bgcolor=#FFFFFF border=1 bordercolor=lightgrey CELLPADDING='3' CELLSPACING='2' style='border-collapse:collapse;'><tr>";
		var len = edge_attribute_order.length;
		//Generate the table header
		for (var i = 0; i < len; i++) {
			if (attConfigShown == 'true') {
				if ($("input[name='edge_attribute_group[]']").filter("input[value='" + edge_attribute_group[edge_attribute_order[i]] + "']").is(':checked')) {
					table_string += '<td ALIGN="CENTER" bgcolor=#E0FFE0><H4>' + edge_attribute_order[i] + '<H4></td>';
				}
			} else {
				table_string += '<td ALIGN="CENTER" bgcolor=#E0FFE0><H4>' + edge_attribute_order[i] + '<H4></td>';
			}
		}
		table_string += "</tr>\n";
		//Determine which interactionAttr to use
		for (var edge in edges) {
			var curr_edge_data = edges[edge].data;
			//Temporary code to display Pubmed IDs as links
			if( curr_edge_data["Pubmed ID"] !== null ) {
				//Replace with link
				curr_edge_data["Pubmed ID"] = '<a href="http://www.ncbi.nlm.nih.gov/pubmed/?term=' + curr_edge_data["Pubmed ID"] + '" target="_blank">' + curr_edge_data["Pubmed ID"] + '</a>';
			}
			
			//Replace source value 
			curr_edge_data["source"] = vis.node(curr_edge_data["source"]).data[nodeAtt];
			//Replace target value
			curr_edge_data["target"] = vis.node(curr_edge_data["target"]).data[nodeAtt];
			
			table_string += '<tr>';
			for (var i = 0; i < len; i++) {
				if (attConfigShown == 'true') {
					if ($("input[name='edge_attribute_group[]']").filter("input[value='" + edge_attribute_group[edge_attribute_order[i]] + "']").is(':checked')) {
						if (curr_edge_data[edge_attribute_order[i]] !== null) {
							table_string += '<td>' + curr_edge_data[edge_attribute_order[i]] + "</div></td>\n";
						} else {
							table_string += '<td>' + "-" + "</div></td>\n";
						}
					}
				} else {
					if (curr_edge_data[edge_attribute_order[i]] !== null) {
							table_string += '<td>' + curr_edge_data[edge_attribute_order[i]] + "</div></td>\n";
					} else {
						table_string += '<td>' + "-" + "</div></td>\n";
					}	
				}
			}
			table_string += "</tr>\n";
		}
		table_string += "</table>\n";
		//Display this in a separate tab
		var win=window.open('display.html', '_blank');
		$(win).load(function(){
			win.document.getElementById("content").innerHTML = table_string;
		});
	}
	
	function download_node_attributes_all() {
		$('#data_div').empty();
		var nodes = vis.nodes();
		download_node_attributes(vis.nodes());
	}
	
	function download_node_attributes_selected() {
		$('#data_div').empty();
		if (vis.selected("nodes").length == 0) {
			$('#data_div').append("<br>No nodes selected.");	
		} else {	
			download_node_attributes(vis.selected("nodes"));
		}
	}
	
	function download_node_attributes(nodes) {
		var len = node_attribute_order.length;
		var header_array = new Array ();
	
		//Generate header
		for (var i = 0; i < len; i++) {
			if (attConfigShown == 'true') {
				if ($("input[name='node_attribute_group[]']").filter("input[value='" + node_attribute_group[node_attribute_order[i]] + "']").is(':checked')) {
					header_array.push(node_attribute_order[i]);
				}
			} else {
				header_array.push(node_attribute_order[i]);	
			}
		}
		var header = header_array.join('\t');
		var body = new Array();
		
		for (var node in nodes) {
			
			var curr_node_data = nodes[node].data;
			var curr_node = new Array ();
			
			for (var i = 0; i < len; i++) {
				if (attConfigShown == 'true') {
					if ($("input[name='node_attribute_group[]']").filter("input[value='" + node_attribute_group[node_attribute_order[i]] + "']").is(':checked')) {
						curr_node.push(curr_node_data[node_attribute_order[i]]);
					}
				} else {
					curr_node.push(curr_node_data[node_attribute_order[i]]);
				}
			}
			body.push(curr_node.join('\t'));
		}
		var data = header + '\n' + body.join('\n') + '\n';
		
		hiddenFormDownload(data, "node_attributes.txt", "text/plain");
	}
 	
	function download_edge_attributes_all() {
		$('#data_div').empty();
		if (vis.edges().length == 0) {
			$('#data_div').append("<br>No edges found.");
		} else {	
			download_edge_attributes(vis.edges());
		}				
	}
	
	function download_edge_attributes_selected() {
		$('#data_div').empty();
		if (vis.selected("edges").length == 0) {
			$('#data_div').append("<br>No edges selected.");
		} else {	
			download_edge_attributes(vis.selected("edges"));
		}	
	}
	
	function download_edge_attributes(edges) {
		var len = edge_attribute_order.length;
		var header_array = new Array ();
		
		//Generate header
		for (var i = 0; i < len; i++) {
			if (attConfigShown == 'true') {
				if ($("input[name='edge_attribute_group[]']").filter("input[value='" + edge_attribute_group[edge_attribute_order[i]] + "']").is(':checked')) {
					header_array.push(edge_attribute_order[i]);
				}
			} else {
				header_array.push(edge_attribute_order[i]);
			}
		}
		var header = header_array.join('\t');
		var body = new Array();
		
		for (var edge in edges) {
			
			var curr_edge_data = edges[edge].data;
			
			//Replace source
			curr_edge_data["source"] = vis.node(curr_edge_data["source"]).data[nodeAtt];
			
			//Replace target
			curr_edge_data["target"] = vis.node(curr_edge_data["target"]).data[nodeAtt];
			
			var curr_edge = new Array ();
			
			for (var i = 0; i < len; i++) {
				if (attConfigShown == 'true') {
					if ($("input[name='edge_attribute_group[]']").filter("input[value='" + edge_attribute_group[edge_attribute_order[i]] + "']").is(':checked')) {
						curr_edge.push(curr_edge_data[edge_attribute_order[i]]);
					}
				} else {
					curr_edge.push(curr_edge_data[edge_attribute_order[i]]);
				}
			}
			body.push(curr_edge.join('\t'));
		}
		var data = header + '\n' + body.join('\n') + '\n';
		
		hiddenFormDownload(data, "edge_attributes.txt", "text/plain");
	}
	
	function default_visual_style() {
	
		colorMapper.entries = [];
		
		$.each($("input[name='edge_source[]']"), function() {
			var type = $(this).val();
			$('#' + type).val('c0c0c0');
			$('#' + type).change();
		});
				
		$.each($("input[name='bg_phy_source[]']"), function() {
			var type = $(this).val();
			$('#' + type).val('c0c0c0');
			$('#' + type).change();
		});
		
		$.each($("input[name='bg_gen_source[]']"), function() {
			var type = $(this).val();
			$('#' + type).val('c0c0c0');
			$('#' + type).change();
		});
			
		$('#filecol').val('c0c0c0');
		$('#filecol').change();
		
		visual_style.nodes.size = 25
		visual_style.edges.width = 1;
		visual_style.nodes.borderWidth = 1;
		
		$('#oin_col').val('#FF0B0B');
		$("#oin_col").change();
		$('#oin_fill_col').val('#FFF');
		$("#oin_fill_col").change();
		
		$('#hide_edge_labels').prop('checked',false);
		$('#hide_node_labels').prop('checked',false);
			
		if (graphShown) {
			vis.visualStyle(visual_style);
		}
	}
	
	function update_visual_style() {	
		set_visual_style();
		vis.visualStyle(visual_style);
	}
	
	function updateGeneIndexes(expName, geneNames) {
	//Create object containing indexes of genes in experiment data
	
		var tempObj = new Object();
		var geneNum = experData[expName].genes.length;
		var geneIndexes = new Object();
		
		//Do for each gene in geneNames array
		$.each(geneNames, function(key, geneName) {		
			
			//If gene is not found in experiment data then set to "NOTFOUND"
			tempObj[geneName] = "NOTFOUND";
			var notFound = "true";
			var count = 0;
			var geneName2;
			
			//Search until gene is found and record the index
			while (notFound === "true" && count < geneNum) {
				geneName2 = experData[expName].genes[count];
				if (geneName.toUpperCase() === geneName2.toUpperCase()) {
					tempObj[geneName] = count;
					notFound = "false";
				} 
				count++;
			}
		});
		geneIndexes[expName] = tempObj;
		return geneIndexes;
		
	} // End updateGeneIndexes
	
	function heatmapProcessing(nodes) {
	
		//Create array of node IDs
		var geneNames = Array();
		var geneIndexes;
		$.each(nodes, function(key, value) {
			if (value.data[nodeAtt] != "-") {
				geneNames.push(value.data[nodeAtt]);
			} else {
				geneNames.push(value.data["id"]);
			}
		});
		numGenes = geneNames.length;
		
		//Get all experiment / condition data for all the genes selected and send to new window to display
		var systemExps = new Object();
		var userExps = new Object();
		$.each(experData, function(exp, val) {
		
			if (val.origin == "system") {
				systemExps[exp] = val.conditionIndexes;
				
			} else if (val.origin == "user") {
				userExps[exp] = val.conditionIndexes;
			}
		});
	
		var datat;
		//Retrieve system data
		if (!$.isEmptyObject(systemExps)) {
			
			var sendData = {
				"experiments": systemExps,
				"geneNames": geneNames
			}
			
			$.ajax({
				type: "POST",
				url:"expressiondata2.php",
				dataType:"json",
				async:false,
				data: sendData,
				  success:function(data) {
					datat = data.result;
					//console.log(datat);
				},
				error: function(data) {
				}
			});
		}
		
		//Retrieve user data
		if (datat === undefined) {
			datat = new Object();
		}
		if (!$.isEmptyObject(userExps)) {
			
			$.each(userExps, function(expe, conds) {
			
				datat[expe] = new Object();
				var data = new Object();
				geneIndexes = updateGeneIndexes(expe, geneNames);
				$.each(conds, function(cond, ind) {
					var temp = new Array();
					
					//Get values for this condition
					$.each(geneNames, function(key, geneName) {
						
						if (geneIndexes[expe][geneName] === 'NOTFOUND') {
							temp.push([]);
						} else {
							temp.push(experData[expe].conditions[ind].obsNorm[geneIndexes[expe][geneName]]);
						}
					});
					//Add to result
					data[cond] = temp;
					
				});
				//Add experiment data to result
				datat[expe]["data"] = data;
			});
		} 
				
		//Add replicates, samplelabels and timepoints 
		$.each(datat, function(key, value) {
			datat[key]["replicates"] = experData[key].replicates;
			datat[key]["timepoints"] = experData[key].timepoints;
			datat[key]["sampleLabels"] = experData[key].sampleLabels;
		});
		
		
		var heatmapsWin=window.open('heatmaps.html', '_blank');
		$(heatmapsWin).load(function(){
			var dataz = Object();
			dataz["geneNames"] = geneNames;
			dataz["data"] = datat;
			dataz["experiment1"] = $("#heatmap_exp0").val();
			dataz["experiment2"] = $("#heatmap_exp1").val();
			dataz["condition1"] = $("#heatmap_con0").val();
			dataz["condition2"] = $("#heatmap_con1").val();
			dataz["cluster"] = $("input[name='cluster']:checked").val();
			dataz["cluster_opt"] = $("input[name='cluster_opt']:checked").val();
			heatmapsWin.setup(dataz);
		});
	}

	//INITIALISATION
	function initialise() {
	
		//Initialise colour pickers
		$("#bgcol").colorPicker();		
		$("#filecol").colorPicker();
 		$("#oin_col").colorPicker();
 		$("#oin_fill_col").colorPicker();
 		
 		var edge_name;
 		$.each($("input[name='edge_source[]']"), function() {
 			edge_name = $(this).val();
 			$("#" + edge_name).colorPicker();
 		});
 		
 		$.each($("input[name='bg_phy_source[]']"), function() {
 			edge_name = $(this).val();
 			$("#" + edge_name).colorPicker();
 		});
 		
 		$.each($("input[name='bg_gen_source[]']"), function() {
 			edge_name = $(this).val();
 			$("#" + edge_name).colorPicker();
 		});
 		
		$('#mytabber2').hide();
		
		edgeFileReader = new FileReader();
		expFileReader = new FileReader();
	
		//Get data schema and attribute order
		$.ajax({  
			type: "POST",  
			url: "initialisation.php",
			async: false,
			dataType: "json",
			success: function(data) { 
			
				network_json.dataSchema.nodes = data.node_schema;		
				network_json.dataSchema.edges = data.edge_schema;
				node_attribute_order = data.node_attribute_order;
				edge_attribute_order = data.edge_attribute_order;
				node_attribute_group = data.node_attribute_group;
				edge_attribute_group = data.edge_attribute_group;
				node_attribute_groups = data.node_attribute_groups;
				edge_attribute_groups = data.edge_attribute_groups;
				attConfigShown = data.att_config;
				edgeWarningLimit = data.edge_warning_limit;
				chosenID = data.fixed_node_key;
				if (chosenID == "") {
					nodeAtt = $('#node_label option:selected').val();
				} else {
					nodeAtt = data.fixed_node_key;
				}
				
 				$.each(data.exp_data, function(index, value) {
  					experData[value.experiment] = value;
  					//Create conditionIndex
  					experData[value.experiment]['conditionIndexes'] = new Object();
  					$.each(value.conditions, function(index1, value1) {
  						experData[value.experiment]['conditionIndexes'][value1.condition] = index1;
  					});
				});
			}
		});
	
    	$('#all_bg_phy').on("click", function() {
			$.each($("input[name='bg_phy_source[]']"), function() {
				$(this).prop("checked", true);
			});
 		});
 		
 		$('#no_bg_phy').on("click", function() {
			$.each($("input[name='bg_phy_source[]']"), function() {
				$(this).prop("checked", false);
			});
		});
		
		$('#all_bg_gen').on("click", function() {
			$.each($("input[name='bg_gen_source[]']"), function() {
				$(this).prop("checked", true);
			});
 		});
 		
 		$('#no_bg_gen').on("click", function() {
			$.each($("input[name='bg_gen_source[]']"), function() {
				$(this).prop("checked", false);
			});
		});
		
		$('#all_edges').on("click", function() {
			$.each($("input[name='edge_source[]']"), function() {
				$(this).prop("checked", true);
			});
 		});
 		
 		$('#no_edges').on("click", function() {
			$.each($("input[name='edge_source[]']"), function() {
				$(this).prop("checked", false);
			});
		});
		
		//Search buttons
		$("#no_network").on("click", function() {
			show_connections_biogrid("report");
		});
		$("#show_connections_biogrid").on("click", function() {
			show_connections_biogrid("graph");
		});
		
		//Graph tab buttons
		$('#update_visual_style').on("click", update_visual_style);
		$('#default_visual_style').on("click", default_visual_style);
		
		
		//Data tab button click events
		$('#download_network_sif').on("click", function() {
			
			//Determine which interactionAttr to use
			vis.exportNetwork('sif', 'export.php?type=txt', { interactionAttr: "type", nodeAttr: nodeAtt });
		});
	
		$('#download_network_pdf').on("click", function() {
			vis.exportNetwork('pdf', 'export.php?type=pdf');
		});
		
		$('#selected_nodes_button').on("click", display_selected_nodes);
		$('#selected_edges_button').on("click", display_selected_edges);
		$('#all_nodes_button').on("click", display_all_nodes);
		$('#all_edges_button').on("click", display_all_edges);
		$('#download_edge_attributes_all').on("click", download_edge_attributes_all);
		$('#download_node_attributes_all').on("click", download_node_attributes_all);
		$('#download_edge_attributes_selected').on("click", download_edge_attributes_selected);
		$('#download_node_attributes_selected').on("click", download_node_attributes_selected);
		
		$('#heatmap_all_nodes').on("click", function() {
			
			$('#data_div').empty();
			//Is clustering on?
			if ($("input[name='cluster']:checked").val() === 'yes' && $("input[name='cluster_opt']:checked").val() === undefined) {
				$('#data_div').append(" Please select an experiment / treatment to cluster on or disable clustering.");
			} else if (vis.nodes().length <= 200) {
				//Construct array of visible nodes
				heatmapProcessing(vis.nodes());
			} else {
				$('#data_div').append(" Please select a maximum of 200 genes.");
			}
		});
		
		$('#heatmap_selected_nodes').on("click", function() {
			$('#data_div').empty();
			if (vis.selected("nodes").length == 0) {
				$('#data_div').append(" None selected.");	
			} else if (vis.selected("nodes").length >= 200) { 
				$('#data_div').append(" Please select a maximum of 200 genes.");
			} else if ($("input[name='cluster']:checked").val() === 'yes' && $("input[name='cluster_opt']:checked").val() === undefined) {
				$('#data_div').append(" Please select an experiment / treatment to cluster on or disable clustering.");
			} else {
				heatmapProcessing(vis.selected("nodes"));
			}
		});
		
		$('#hide_node_labels').on("click", function() {
			if ($('#hide_node_labels').is(':checked')) {
				visual_style.nodes.label = "";
			} else {
				var selection = $('#node_label option:selected').val();
				visual_style.nodes.label = { passthroughMapper: { attrName: selection } };
			}
			if (graphShown) {
				vis.visualStyle(visual_style);
			}
		});
		
		$('#hide_edge_labels').on("click", function() {
			if ($('#hide_edge_labels').is(':checked')) {
			visual_style.edges.label = "";
			} else {
				visual_style.edges.label = { passthroughMapper: { attrName: "type" } };
			}
			if (graphShown) {
				vis.visualStyle(visual_style);
			}
		});
		
		$('#node_size_up').on("click", function() {
			
			if (graphShown) {
				var curr = visual_style.nodes.size;
				visual_style.nodes.size = curr + 5;
				vis.visualStyle(visual_style);
			}
		});
		
		$('#node_size_down').on("click", function() {
		
			if (graphShown) {
				var curr = visual_style.nodes.size;
				if (curr != 0) {
					visual_style.nodes.size = curr - 5;
					vis.visualStyle(visual_style);
				}
			}
		});
		
		$('#edge_width_up').on("click", function() {
			
			if (graphShown) {
				var curr = visual_style.edges.width;
				visual_style.edges.width = curr + 1;
				vis.visualStyle(visual_style);
			}
		});
		
		$('#edge_width_down').on("click", function() {
			if (graphShown) {
				var curr = visual_style.edges.width;
				if (curr != 0) {
					visual_style.edges.width = curr - 1;
					vis.visualStyle(visual_style);
				}
			}
		});
		
		$('#node_width_up').on("click", function() {
			var curr = visual_style.nodes.borderWidth;
			visual_style.nodes.borderWidth = curr + 1;
			if (graphShown) {
				vis.visualStyle(visual_style);
			}
		});
		
		$('#node_width_down').on("click", function() {
			if (graphShown) {
				var curr = visual_style.nodes.borderWidth;
				if (curr != 0) {
					visual_style.nodes.borderWidth = curr - 1;
					vis.visualStyle(visual_style);
				}
			}
		});
		
		$("#node_label").change(function(evt) {
		
			var selection = $('#node_label option:selected').val();
			
			if ($('#hide_node_labels').is(':checked'));
			
			if (chosenID == "") {
				console.log("Changing ID");
				nodeAtt = selection;
			}
			
			if (!$('#hide_node_labels').is(':checked')) {
				visual_style.nodes.label = { passthroughMapper: { attrName: selection } };
	  			if (graphShown ) {	
	  				vis.visualStyle(visual_style);
	  			}
			}
		});
		
		$(".heatmap_exp").change(function(evt) {
		
			var id = evt.target.id;
			var n = id.charAt(id.length-1);
			var selection = $('#' + id + ' option:selected').val();
			
			//Populate heatmap_con select box
			if (selection==="None") {
				//Set to None and disable
				$('#heatmap_con' + n).html("<option value=None>None</option>");
				$('[name=cluster_opt][value=cluster_opt' + n + ']').attr("disabled", true);
				$('[name=cluster_opt][value=cluster_opt' + n + ']').attr("checked", false);
				$('[name=cluster_opt][value=cluster_opt' + n + ']').removeClass('testclass');
				$('#heatmap_con' + n).attr("disabled", true);
				
			} else {
				//Add appropriate conditions from expData
				$('[name=cluster_opt][value=cluster_opt' + n + ']').addClass('testclass');
				$('#heatmap_con' + n).html("");
				
				$.each(experData, function(key, value) {
					if (value.experiment === selection) {
						$.each(value.conditions, function(key2, value2) {
							$('#heatmap_con' + n).append("<option value=" + value2.condition + ">" + value2.condition + " </option>");
						});
					}
				});
				$("#heatmap_con" + n).attr("disabled", false);
			}
			
			if ($('.testclass').length > 0) {
				
				$('[name=cluster][value=no]').attr('disabled',false);
				$('[name=cluster][value=yes]').attr('disabled',false);
				
				$('#heatmap_all_nodes').attr('disabled',false);
				$('#heatmap_selected_nodes').attr('disabled',false);
				
				var opt = $("input[name='cluster']:checked").val()
				if (opt === "yes") {
					$('.testclass').attr('disabled',false);	
				} 
			
			} else {
			
				$('[name=cluster][value=no]').attr('disabled',true);
				$('[name=cluster][value=yes]').attr('disabled',true);
				
				$('#heatmap_all_nodes').attr('disabled',true);
				$('#heatmap_selected_nodes').attr('disabled',true);
				
				if (opt === "yes") {
					$('.testclass').attr('disabled',true);	
				} 
			}
		});
		
		//Edge File Handling
		$('#edge_file').on('change', function(evt) {
			edgeFiles = evt.target.files;
			if (edgeFiles.length > 0) {
				
				if ($("#edge_file_text").length < 1) {
					if (edgeFiles[0].size > 0) {
						edgeFileReader.readAsText(edgeFiles[0]);
						edgeFileReader.onload = function(event) {
							//Abort if file contents is not ASCII
							if (event.target.result.match(/[^\u0000-\u007f]/)) {
								alert("Please select a valid file");
								$("#edge_file").val("");
							} 
						}
						edgeFileReader.onerror = function() {
							alert("Error reading file");
							$("#edge_file").val("");
						}
					} else {
						alert("Please select a valid file");
						$("#edge_file").val("");
					}	
				
				} else {
					if (edgeFiles[0].size > 0) {
						edgeFileReader.readAsText(edgeFiles[0]);
						edgeFileReader.onload = function(event) {
							//Abort if file contents is not ASCII
							if (event.target.result.match(/[^\u0000-\u007f]/)) {
								alert("Please select a valid file");
								$("#edge_file_text").html("No file selected");
							} 
							$("#edge_file_text").html(edgeFiles[0].name);
						}
						edgeFileReader.onerror = function() {
							alert("Error reading file");
							$("#edge_file_text").html("No file selected");
						}
					} else {
						alert("Please select a valid file");
						$("#edge_file_text").html("No file selected");
					}
				}
			}
		});
		
		
		//Exp File handling
		$('#exp_file').on('change', function(evt) {
			expFiles = evt.target.files;
			if (expFiles.length > 0) {
				if ($("#exp_file_text").length < 1) {
					//We are using the standard FileReader code
					if (expFiles[0].size < 1) {
						alert("Please select a valid file");
						$("#exp_file").val("");
					}
				
				} else {
					//We are using the FLASH filereader code hack for safari
					if (expFiles[0].size > 0) {
						$("#exp_file_text").html(expFiles[0].name);	
					} else {
						alert("Please select a valid file");
						$("#exp_file_text").html("No file selected");
					}
				}
			} 
		});
		
		$('.cp_bg').on('change', function(evt) {
			var id = evt.target.id;
			var id2 = id.replace(/_/g," ");
			var notfound = true;
			var ind = 0;
			var len = colorMapper.entries.length;
			while (notfound && ind < len) {
				if (colorMapper.entries[ind].attrValue == id2) {
					colorMapper.entries[ind].value = $('#' + id).val();
					notfound = false;
				}
				ind = ind + 1;
			}
			
			//Add if not found
			if (notfound) {
				colorMapper.entries.push( { attrValue: id2, value: $('#' + id).val() } );
			}
			if (graphShown) {
				vis.visualStyle(visual_style);
			}
		});
		
		$('.cp_db').on('change', function(evt) {
			var id = evt.target.id;
			var notfound = true;
			var ind = 0;
			var len = colorMapper.entries.length;
			while (notfound && ind < len) {
				if (colorMapper.entries[ind].attrValue == id) {
					colorMapper.entries[ind].value = $('#' + id).val();
					notfound = false;
				}
				ind = ind + 1;
			}
			
			//Add if not found
			if (notfound) {
				colorMapper.entries.push( { attrValue: id, value: $('#' + id).val() } );
			}
			
			
			if (graphShown) {
				vis.visualStyle(visual_style);
			}
		});
		
		$('.cp1').on('change', function(evt) {
			var id = evt.target.id;
			switch(id)
			{
				case 'oin_col':
				  visual_style.nodes.borderColor.discreteMapper.entries[0].value = $('#oin_col').val();
				  break;
				case 'oin_fill_col':
				  visual_style.nodes.color.discreteMapper.entries[0].value = $('#oin_fill_col').val();
				  break;
				case 'filecol':
					if (graphShown && 'file' in edgeCounts) {
						var notfound;
						var i;
						var len;
						$.each(edgeCounts['file'], function(ind, val) {
							
							notfound = true;
							i = 0;
							len = colorMapper.entries.length;
							while (notfound && i < len) {
								if (colorMapper.entries[i].attrValue == ind) {
									colorMapper.entries[i].value = $('#filecol').val();
									notfound = false;
								}
								i = i + 1;
							}
							
							//Add if not found
							if (notfound) {
								colorMapper.entries.push( { attrValue: ind, value: $('#filecol').val() } );
							}	
						});
					}
				break;
				default:
			}
			if (graphShown) {
				vis.visualStyle(visual_style);
			}
		});
		
		$('#upload_exp_file').on('click', function(evt) {
		
			console.log("UPLOADING USER DATA");
			
			//Get results from loadDataFromTable
			var uploadResult = new Object();
			
			uploadResult["AT1G13960"] = {"ID":"AT1G13960","experiments":[{"name":"exp1","observations":[0,1,3,6],"isTimeSeries":true,"units":"hours","replicates":4,"allowNormalisation":true,"conditions":[{"name":"cond1","data":[9,10,12,9,8,11,11.5,9.2,8.5,10.5,11.5,8.8,9.1,10.1,12.1,8.9]},{"name":"cond2","data":[9,7,6.5,6,9.2,7.5,6.7,6.6,9.5,7.7,6,5.8,8.6,7.1,6,6,9.5,7.1,6.2,5.8]}]}]};
			console.log(uploadResult);
		});
		
		$('#upload_exp_fileOLD').on('click', function(evt) {
			
			if (expFiles.length > 0) {
				expFileReader.readAsText(expFiles[0]);
				
				expFileReader.onload = function(event) {
				
					var isRawScale;
					if ($('input:radio[name=rawScale]:checked').val() === "no") {
						isRawScale = false;
					} else {
						isRawScale = true;
					}
										
					var separator = $('input:radio[name=exp_sep]:checked').val();
					var resultData = new Array();
					switch(separator)
					{
						case "tab":
						  resultData = extractExpressionData(expFileReader.result,'\t',isRawScale);
						  break;
						case "space":
						  resultData = extractExpressionData(expFileReader.result,' ',isRawScale);
						  break;
						case "comma":
						  resultData = extractExpressionData(expFileReader.result,',',isRawScale);
						  break;
						default:
						  //error
					}
				
					$.each(resultData, function(key, value) {
						
						if (value.experiment in experData) {
							alert("Experiment name in use (" + value.experiment + ") - please rename and try again");
						} else {
						
							value["origin"] = "user";
							experData[value.experiment] = value;
							
							//Add conditions index
							var condsIndex = new Object();
							$.each(value.conditions, function(condIndex, condDetails) {
								condsIndex[condDetails.condition] = condIndex;
							});
							value['conditionIndexes'] = condsIndex;
							
							if ($("#uploaded_exp_data").text() == "None") {
								$("#uploaded_exp_data").empty();
								$("#delete_selected_exp_files").show();
							} 
							
							//Append newest experiment to #uploaded_exp_data div
							$("#uploaded_exp_data").append("<input type='checkbox' name='uploaded_exp_files[]' value='" + value.experiment + "' unchecked /> " + value.experiment + ' - ' + value.conditions.length + " condition(s)<br>");
							
							//Add newest experiment to select boxes
							$('.heatmap_exp').append("<option value=" + value.experiment + ">" + value.experiment + "</option>");
							$('.plotclass').append("<option value=" + value.experiment + ">" + value.experiment + "</option>");
						}
					});
					
					if ($("#exp_file_text").length < 1) {
						$("#exp_file").val("");
					} else {
						$("#exp_file_text").html("No file selected");
					}
					if (!$.isEmptyObject(experData)) {
						$(".heatmap_exp").attr("disabled", false);
						$(".plotclass").attr("disabled", false);
					} 
				}
				
				expFileReader.onerror = function() {
					alert("Error reading file");
					if ($("#exp_file_text").length < 1) {
						$("#exp_file").val("");
					} else {
						$("#exp_file_text").html("No file selected");
					}
				}
			} 
		});
		
		$('#remove_file').on('click', function(evt) {

			if ($("#edge_file_text").length < 1) {
				$("#edge_file").val("");	//NOT SURE THIS WILL WORK IN ALL BROWSERS
			} else {
				$("#edge_file_text").html("No file selected");
			}
			edgeFiles = [];
		});
		
		$('#clear_gene_text').on('click', function(evt) {
			$("#genes").val("");
		});
			
		$('#exp_remove_file').on('click', function(evt) {
			if ($("#exp_file_text").length < 1) {
				$("#exp_file").val("");	//NOT SURE THIS WILL WORK IN ALL BROWSERS
			} else {
				$("#exp_file_text").html("No file selected");
			}
			expFiles = [];
		});
		
		$("input[name='cluster']").on('change', function(evt) {
			//Get selection
			var opt = $("input[name='cluster']:checked").val();

			switch(opt)
			{
				case "no":
				  $('.testclass').attr('disabled',true);
				  $('.testclass').attr('checked',false);
				  break;
				case "yes":
				  $('.testclass').attr('disabled',false);
				  break;
			}
		});
		
		$('#delete_selected_exp_files').on('click', function(evt) {
		
			$.each($("input[name='uploaded_exp_files[]']:checked"), function() {
				var val = $(this).val();
				delete experData[val];
				$(".plotclass option[value='" + val + "']").remove();
				
				$.each($(".testclass"), function() {
 					var id = $(this).val();
 					var n = id.charAt(id.length-1);
 					if ($("#heatmap_exp" + n).val() == val) {
 						//Set options to None and disable
 						$('#heatmap_con' + n).empty();
 						$('#heatmap_con' + n).append("<option value='None'>None</option>");
 						$('#heatmap_con' + n).attr('disabled',true);
 					}
 				});
				
				$(".heatmap_exp option[value='" + val + "']").remove();
			});
			
			//Update interface and remove deleted files
			$("#uploaded_exp_data").empty();
			var found = false;
			$.each(experData, function(ind, value) {
				if (value['origin'] == "user") {
					$("#uploaded_exp_data").append("<input type='checkbox' name='uploaded_exp_files[]' value='" + ind + "' unchecked /> " + ind + ' - ' + value.conditions.length + " condition(s)<br>");
					found = true;
				}
			});
			
			if (!found) {
				$("#uploaded_exp_data").append("None");
				$('#delete_selected_exp_files').hide()
			} 
			
			if ($.isEmptyObject(experData)) {
				$(".heatmap_exp").attr("disabled", true);
				$(".plotclass").attr("disabled", true);
			} 
		});
		
		$(document).on( "click", '#export_sif_nodraw', network_JSON_to_sif );
		$(document).on( "click", '#display_graph', display_graph );
		
	} //End initialise
	
	return {
		initialise: initialise
	}

})();


  