<?php
	session_start();
	if(isset($_SESSION['username'])){
		require("get_config.php");
		
		#Attribute processing
		$node_schema = array();
		$edge_schema = array();
		$edge_attribute_order = array();
		$node_attribute_order = array();
		$node_attribute_group = array();
		$edge_attribute_group = array();
		$node_attribute_groups = array();
		$edge_attribute_groups = array();
		
		foreach ($node_attributes as $atts) {
		
			#Add to node_schema
			$att = array();
			$att["name"] = $atts['name'];
			$att["type"] = "string";
			$node_schema[] = $att;
			
			#Add to node_attribute_order & node_attribute_group
			if ($atts['display'] == 'yes') { 
				$node_attribute_order[] = $atts['name'];
				$node_attribute_group[$atts['name']] = $atts['group'];	
			}
			
			#Add to node_attribute_groups
			$node_attribute_groups[$atts['group']] = 'yes';
		}
		
		foreach ($edge_attributes as $atts) {
		
			#Add to edge_schema
			$att = array();
			$att["name"] = $atts['name'];
			$att["type"] = "string";
			$edge_schema[] = $att;
			
			#Add to edge_attribute_order & edge_attribute_group
			if ($atts['display'] == 'yes') {
				$edge_attribute_order[] = $atts['name'];
				$edge_attribute_group[$atts['name']] = $atts['group'];	
			}
			
			#Add to edge_attribute_groups
			$edge_attribute_groups[$atts['group']] = 'yes';
		}
		
		//Experiment data processing
		$exp_data = array();
		if (count($experiment_data)>0) {
			foreach ($experiment_data as $key => $value) {
				$new = array();
				$new["conditionsArray"] = array();
				$new["conditions"] = array();
				foreach ($value["conditions"] as $key2 => $value2) {
					$new["conditions"][strtoupper($value2)] = "";
					$new["conditionsArray"][] = $value2;
				}
				$new["name"] = $value["name"];
				$new["replicates"] = $value["replicates"];
				$new["observations"] = $value["observations"];
				$new["isTimeSeries"]=$value["isTimeSeries"];
				$new["origin"] = "system";
				$new["allowNormalisation"] = $value["allowNormalisation"];
				$exp_data[] = $new; 		
			}
		}
		
		echo json_encode(array('node_schema' => $node_schema, 'edge_schema' => $edge_schema, 'node_attribute_order' => $node_attribute_order, 'edge_attribute_order' => $edge_attribute_order, 'node_attribute_group' => $node_attribute_group, 'edge_attribute_group' => $edge_attribute_group,'node_attribute_groups' => $node_attribute_groups, 'edge_attribute_groups' => $edge_attribute_groups, 'exp_data' => $exp_data, 'att_config' => (string)$att_config_show, 'edge_warning_limit' => $edge_warning_limit, 'fixed_node_key' => (string)$fixed_node_key));
	}
?>