var ideas = (function () {

	var edgeFiles = new Array();
	var expFiles = new Array();
	var experData = new Object();
	var edgeCounts = new Object();
	var attConfigShown;
	var edgeWarningLimit;
	var graphShown = false;
	var chosenID = "";
	var nodeAtt = "";
	var userNodeData;
	var systemDataAvail = false;
	var userDataAvail = false;
	
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
		  var fn = vis.firstNeighbors([evt.target.data.id])
		  
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
             
             var type = evt.target.data.type;
             var allEdges = vis.edges();
             
             $.each(allEdges, function(ind, val) {
		  		if (val.data.type == type) {
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
             
             $.each(selEdges, function(ind, val) {
		  		deleteEdge(val);
 		  	 });
         })
        vis.addContextMenuItem("Add node to search", "nodes", function(evt) {
           var currText = $('#genes').val();
           currText = currText.replace(/(\r\n|\r)/gm,"\n");
           var node_id;
           if (evt.target.data[nodeAtt] == "-") {
          		node_id = evt.target.data["label"];
           } else {
           		node_id = evt.target.data[nodeAtt];
           }
           
           if (currText.charAt(currText.length-1) == '\n' || currText == "") {
           		$('#genes').val(currText + node_id + "\n");
           	} else {
           		$('#genes').val(currText + '\n' + node_id + "\n");
           	}
        })
         .addContextMenuItem("Add selected nodes to search", function(evt) {
             var currText = $('#genes').val();
             currText = currText.replace(/(\r\n|\r)/gm,"\n");
    
             var items = vis.selected("nodes");
             var newText = "";
             var node_id;
             $.each(items, function(ind, val) {
             	if (val.data[nodeAtt] == "-") {
					node_id = val.data["label"];
			   	} else {
					node_id = val.data[nodeAtt];
			   	}
             	newText = newText + node_id + "\n";
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
		var origin = edge.data.origin;
		var type = edge.data.type;
		edgeCounts[origin][type] = edgeCounts[origin][type] - 1;
		if (edgeCounts[origin][type] == 0 && origin != "file") {
			//Uncheck checkbox, unbold text and remove active class
			var type2 = type.replace(/ /g,"_");
			$('input:checkbox[value=' + type2 + ']').prop("checked", false);
			$('input:checkbox[value=' + type2 + ']').removeClass('active');
			if (origin == "db") {
				$('label[for="' + type2 + '_db_edge"]').removeClass('bold');
			} else if (origin == "biogrid") {
				$('label[for="' + type2 + '_bg_gen_edge"]').removeClass('bold');
				$('label[for="' + type2 + '_bg_phy_edge"]').removeClass('bold');
			}
			//Check if entire graph has been deleted
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
			
			//Search config values
			var search_config = new Object();
			$.each($(".search_config"), function(ind, value) {
 				search_config[this.id] = this.checked;
 			});
			
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
		display_graph();
	}
	
	function display_graph() {
		
		//set_visual_style();
		vis.draw(draw_options);
		graphShown = true;
		
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

		var resStr = "";
		resStr = resStr + display_search_options();
		
		resStr = resStr + "<h3>SEARCH RESULTS:</h3>";
		
		resStr = resStr + data.nodes_json.length + " nodes found<br>";
		
		if (data.edges_json.length > edgeWarningLimit) {
			resStr = resStr + data.edges_json.length + " edges found ";
			resStr = resStr + "<font color='red'>***NUMBER OF EDGES LARGE - GRAPH DISPLAY MIGHT BE SLOW!!!!!!***</font><br>";
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
	}
	
	
	function refresh_plots(geneArray, panel) {
	
		var plotNodeData = new Object();
	
		//RETRIEVE SYSTEM DATA (IF DEFINED)
		if (systemDataAvail) {
		
			$.each(geneArray, function(i, item) {
				
				var sendData = {
					"gene": item
				}
				
				$.ajax(
				{
					type: "POST",
					url:"plotdata.php",
					dataType:"json",
					async:false,
					data: sendData,
					success:function(data) {
						plotNodeData[item] = JSON.parse(data);
					}
				});
			
			});
		}
		
		console.log(plotNodeData);
		
		//GET USER DATA AND MERGE IF NECESSARY
		if (userDataAvail) {
			
			$.each(geneArray, function(ind, val) {
				if (val in userNodeData) { 
					temp = new Object();
					temp[val] = userNodeData[val];
					plotNodeData = mergeNodeData(temp,plotNodeData);
				}
			}); 
		}
		
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
        	
			var count = 0;
			$.each($('.plotclass'), function(i, item) {
				if ($(item).val() != "None") {
					plotSingleNodeData("plottingWindow" + count,plotNodeData[geneArray[0]],$(item).val().toUpperCase());
					count++;
				} 
			});
			if (count == 0) {
				$('#plots').empty();
				$('#plots').append("No experiments selected under Data tab");
			}
		
		 } else if (geneArray.length === 2) {
		 	
		 	console.log(plotNodeData);
         	var count = 0;
			$.each($('.plotclass'), function(i, item) {
				if ($(item).val() != "None") {
					plotEdgeData("plottingWindow" + count,plotNodeData[geneArray[0]],plotNodeData[geneArray[1]],$(item).val());
					count++;
				} 
			});
			if (count == 0) {
				$('#plots').empty();
				$('#plots').append("No experiments selected under Data tab");
			}
		
         } else if (geneArray.length > 2) {
         
         	console.log(plotNodeData);
         	var count = 0;
			$.each($('.plotclass'), function(i, item) {
				if ($(item).val() != "None") {
					plotMultipleNodeData("plottingWindow" + count,plotNodeData,experData,$(item).val());
					count++;
				} 
			});
			if (count == 0) {
				$('#plots').empty();
				$('#plots').append("No experiments selected under Data tab");
			}
         
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
            
            var node_id;
            if (target.data[nodeAtt] == "-") {
            	node_id = target.data["label"];
            } else {
            	node_id = target.data[nodeAtt];
            }
        	
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
				$("#plots").append("No experiment data loaded");
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
				var geneArray=new Array(source_id, target_id); 
				refresh_plots(geneArray, "plots");
				
			} else {
				$("#plots").append("No experiment data loaded");
			}
		} else if (numberOfNodesSelected > 2) {
			if (!$.isEmptyObject(experData)) {
			
 				var targets = vis.selected("nodes");
 				var geneArray=new Array();
				$.each(targets, function() {
 					if (this.data[nodeAtt] == "-") {
              			geneArray.push(this.data["id"]);
 					} else {
 						geneArray.push(this.data[nodeAtt]);
 					}	
 				});
 				refresh_plots(geneArray, "plots");
 				
 			} else {
 				$("#plots").append("No experiment data loaded");
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
        
        //Set source node
        var source_node;
        if (vis.node(target.data.source).data[nodeAtt] == "-") {
			target.data.source = vis.node(target.data.source).data["label"];
			source_node = target.data.source
		} else {
			target.data.source = vis.node(target.data.source).data[nodeAtt];
			source_node = target.data.source;
		}
        
        //Set target node
        var target_node;
        if (vis.node(target.data.target).data[nodeAtt] == "-") {
			target.data.target = vis.node(target.data.target).data["label"];
			target_node = target.data.target;
		} else {
			target.data.target = vis.node(target.data.target).data[nodeAtt];
			target_node = target.data.target;
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
			var geneArray;
			if (source_node === target_node) {
				geneArray=new Array(source_node); 
			} else {
				geneArray=new Array(source_node, target_node);
			}
			refresh_plots(geneArray, "plots");
		} else {
			$("#plots").append("No experiment data loaded");
		}
	}
			
	function handle_node_dblclick(event) {
		var target = event.target;
		//Add attribute based on user selection
		var node_id;
		if (target.data[nodeAtt] == "-") {
			node_id = target.data["label"];
		} else {
			node_id = target.data[nodeAtt];
		}
		$("#genes").val(node_id);
		show_connections_biogrid("graph");
	}
			
	function handle_edge_dblclick(event) {
		var target = event.target;
		var source_id;
		if (vis.node(target.data.source).data[nodeAtt] == "-") {
			source_id = vis.node(target.data.source).data["label"];
		} else {
			source_id = vis.node(target.data.source).data[nodeAtt];
		}
		var genes = "";
		if (target.data.source === target.data.target) {
			genes += source_id + "\n";
		} else {
			var target_id;
			if (vis.node(target.data.target).data[nodeAtt] == "-") {
				target_id = vis.node(target.data.target).data["label"];
			} else {
				target_id = vis.node(target.data.target).data[nodeAtt];
			}
			genes += source_id + "\n" + target_id + "\n";
		}
		$("#genes").val(genes);
		show_connections_biogrid("graph");
	}

	function network_JSON_to_sif() {
		//Convert network JSON to sif format
		var converted_res = new Array();
		var edges_length = network_json.data.edges.length;
		var used_nodes = new Object();
		var nodes_length = network_json.data.nodes.length;
		
		//Create associative object for nodes
		var nodeMap = new Object();
		for (var i = 0; i < nodes_length; i++) {
			nodeMap[network_json.data.nodes[i]['id']] = network_json.data.nodes[i][nodeAtt];
		}
		
		for (var i = 0; i < edges_length; i++) {
  			//Add edge to results
  			var source = network_json.data.edges[i]["source"];
  			var target = network_json.data.edges[i]["target"];
  			used_nodes[source] = "";
  			used_nodes[target] = "";
  			converted_res.push(nodeMap[source] + "\t" + network_json.data.edges[i]["type"] + "\t" + nodeMap[target]); 
  		}
		
		//Add any singleton nodes
		for (var i = 0; i < nodes_length; i++) {
			
			var node = network_json.data.nodes[i]['id']
			if (!(node in used_nodes)) {
				converted_res.push(nodeMap[node]);	
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
			if (vis.node(curr_edge_data["source"]).data[nodeAtt] == "-") {
				curr_edge_data["source"] = vis.node(curr_edge_data["source"]).data["label"];
			} else {
				curr_edge_data["source"] = vis.node(curr_edge_data["source"]).data[nodeAtt];
			}
			//Replace target value
			if (vis.node(curr_edge_data["target"]).data[nodeAtt] == "-") {
				curr_edge_data["target"] = vis.node(curr_edge_data["target"]).data["label"];
			} else {
				curr_edge_data["target"] = vis.node(curr_edge_data["target"]).data[nodeAtt];
			}
			
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
			if (vis.node(curr_edge_data["source"]).data[nodeAtt] == "-") {
				curr_edge_data["source"] = vis.node(curr_edge_data["source"]).data["label"];
			} else {
				curr_edge_data["source"] = vis.node(curr_edge_data["source"]).data[nodeAtt];	
			}
			
			//Replace target
			if (vis.node(curr_edge_data["target"]).data[nodeAtt] == "-") {
				curr_edge_data["target"] = vis.node(curr_edge_data["target"]).data["label"];
			} else {
				curr_edge_data["target"] = vis.node(curr_edge_data["target"]).data[nodeAtt];
			}
			
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
	
	function heatmapProcessing(nodes) {
		
		var node_id;
		var heatmapNodeData = new Object();
	
		//RETRIEVE SYSTEM DATA (IF DEFINED)
		if (systemDataAvail) {
		
			$.each(nodes, function(i, item) {
				
				if (item.data[nodeAtt] == "-") {
					node_id = item.data["label"];
				} else {
					node_id = item.data[nodeAtt];
				}
			
				var sendData = {
					"gene": node_id
				}
				
				$.ajax(
				{
					type: "POST",
					url:"plotdata.php",
					dataType:"json",
					async:false,
					data: sendData,
					success:function(data) {
						heatmapNodeData[item.data.id] = JSON.parse(data);
					}
				});
			
			});
		}
		
		//GET USER DATA AND MERGE IF NECESSARY
		if (userDataAvail) {
		
			$.each(nodes, function(ind, val) {
				if (val.data[nodeAtt] == "-") {
					node_id = val.data["label"];
				} else {
					node_id = val.data[nodeAtt];
				}
				if (node_id in userNodeData) { 
					temp = new Object();
					temp[node_id] = userNodeData[node_id];
					heatmapNodeData = mergeNodeData(temp,heatmapNodeData);
				}
			}); 
		}
		
		//Send to new window to be processed
		var heatmapsWin=window.open('heatmaps.html', '_blank');
 		$(heatmapsWin).load(function(){
 			var heatmap_data = Object();
 			heatmap_data["node_data"] = heatmapNodeData;
 			heatmap_data["exp_data"] = experData;
 			heatmap_data["experiment1"] = $("#heatmap_exp0").val();
 			heatmap_data["experiment2"] = $("#heatmap_exp1").val();
 			heatmap_data["condition1"] = $("#heatmap_con0").val();
 			heatmap_data["condition2"] = $("#heatmap_con1").val();
 			heatmapsWin.setup(heatmap_data);
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
		
		userDataAvail = false;
		systemDataAvail = false;
	
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
				
				if (size(data.exp_data)>0) {
					systemDataAvail = true;
				} 
				
 				$.each(data.exp_data, function(index, value) {
  					experData[value.name.toUpperCase()] = value;
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
				//$('[name=cluster_opt][value=cluster_opt' + n + ']').attr("disabled", true);
				//$('[name=cluster_opt][value=cluster_opt' + n + ']').attr("checked", false);
				//$('[name=cluster_opt][value=cluster_opt' + n + ']').removeClass('testclass');
				$('#heatmap_con' + n).removeClass('testclass');
				$('#heatmap_con' + n).attr("disabled", true);
				
			} else {
				//Add appropriate conditions from expData
				//$('[name=cluster_opt][value=cluster_opt' + n + ']').addClass('testclass');
				$('#heatmap_con' + n).addClass('testclass');
				$('#heatmap_con' + n).html("");
				
				$.each(experData[selection.toUpperCase()].conditionsArray, function(key2, value2) {
					$('#heatmap_con' + n).append("<option value=" + value2 + ">" + value2 + " </option>");
				});
				$("#heatmap_con" + n).attr("disabled", false);
			}
			
			if ($('.testclass').length > 0) {
				
				//$('[name=cluster][value=no]').attr('disabled',false);
				//$('[name=cluster][value=yes]').attr('disabled',false);
				
				$('#heatmap_all_nodes').attr('disabled',false);
				$('#heatmap_selected_nodes').attr('disabled',false);
				
				//var opt = $("input[name='cluster']:checked").val()
				//if (opt === "yes") {
				//	$('.testclass').attr('disabled',false);	
				//} 
			
			} else {
			
				//$('[name=cluster][value=no]').attr('disabled',true);
				//$('[name=cluster][value=yes]').attr('disabled',true);
				
				$('#heatmap_all_nodes').attr('disabled',true);
				$('#heatmap_selected_nodes').attr('disabled',true);
				
				//if (opt === "yes") {
				//	$('.testclass').attr('disabled',true);	
				//} 
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
							} else {
								$("#edge_file_text").html(edgeFiles[0].name);
								$("#edge_remove_file").attr("disabled", false);
							}
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
					} else {
						$("#upload_exp_file").attr("disabled", false);
						$("#exp_remove_file").attr("disabled", false);
					}
				} else {
					//We are using the FLASH filereader code hack for safari
					if (expFiles[0].size > 0) {
						$("#exp_file_text").html(expFiles[0].name);
						$("#upload_exp_file").attr("disabled", false);
						$("#exp_remove_file").attr("disabled", false);
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
						  resultData = loadExperimentsFromTable(expFileReader.result,'\t',isRawScale);
						  break;
						case "space":
						  resultData = loadExperimentsFromTable(expFileReader.result,' ',isRawScale);
						  break;
						case "comma":
						  resultData = loadExperimentsFromTable(expFileReader.result,',',isRawScale);
						  break;
						default:
						  //error
					}
					//Update experData 
					$.each(resultData.experimentInfo, function(key,value) {
						if (value.name.toUpperCase() in experData) {
 							alert("Experiment name in use (" + value.name + ") - please rename and try again");
 						} else {
 						
 							value.origin = "user";
 							experData[value.name.toUpperCase()] = value;
 							userDataAvail = true;
 							
 							if ($.isEmptyObject(userNodeData)) {
 								//Nothing to merge with
 								userNodeData = resultData.nodeData;
 							} else {
 								//Merge new nodeData with existing
 								userNodeData = mergeNodeData(resultData.nodeData,userNodeData);
 							}
 						
 							if ($("#uploaded_exp_data").text() == "None") {
 								$("#uploaded_exp_data").empty();
 							}
 							
 							//Append newest experiment to #uploaded_exp_data div
							$("#uploaded_exp_data").append(value.name + ' - ' + value.conditionsArray.length + " condition(s)<br>");
							
							//Add newest experiment to select boxes
							$('.heatmap_exp').append("<option value=" + value.name + ">" + value.name + "</option>");
							$('.plotclass').append("<option value=" + value.name + ">" + value.name + "</option>");
 						}
					});
					
					console.log(experData);
					
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
		
		$('#edge_remove_file').on('click', function(evt) {

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
		
		//$('#delete_selected_exp_files').on('click', function(evt) {
		//});
		
		$(document).on( "click", '#export_sif_nodraw', network_JSON_to_sif );
		$(document).on( "click", '#display_graph', display_graph );
		
	} //End initialise
	
	return {
		initialise: initialise
	}

})();


  