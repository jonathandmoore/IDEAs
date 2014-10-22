<?php
	//extract name of IDEAs instance and get config file of that name
	$currDir = $_SERVER['PHP_SELF'];
	$currDir = strtok($currDir,'/');
	
	# load defaults
	$url = "../../data/ideas/config/config_" . $currDir . ".json";
	//echo $_SERVER['PHP_SELF'] . "  -  " . $url  . ": " . (file_exists($url) ? "true" : "false") . "<br>";
	if(!file_exists($url))
		$url = "../../data/ideas/config/config_default.json";
	$config = json_decode(file_get_contents($url),true);
	$base_dir = $config["base_dir"];
	$service_root = $config["service_root"];
	
	#Appearance
	$page_title = $config["page_title"];
	$about_link = $config["about_link_address"];
	$logout_link = $config["logout_link"];
	$logo_file = $config["logo_file"];
	$search_depth_default = $config["search_depth_default"];
	$hide_unconnected = $config["hide_unconnected_nodes_checked"];
	$exclude_self = $config["exclude_self_interactions_checked"];
	
	#DB Settings
	$db_enabled = $config["db_enable"];
	$db_server = $config["db_server"];
	$db_user = $config["db_user"];
	$db_pass = $config["db_pass"];
	$db_instance = $config["db_instance"];
	
	#Edge limit
	$edge_warning_limit = $config["edge_warning_limit"];

	#BioGRID Settings
	$biogrid_enabled = $config["bg_enable"];
  	$biogrid_accesskey = $config["bg_accesskey"];
  	$biogrid_http = $config["bg_http"];
  	$biogrid_taxID = $config["bg_taxID"];
  	$biogrid_user_choose = $config["bg_display_options_to_user"];
  	$biogrid_physical_interactions = $config["bg_physical_interactions"];
  	$biogrid_genetic_interactions = $config["bg_genetic_interactions"];
  	$biogrid_ID_identifier = $config["bg_ID_identifier"];
  	$mappings = $config["biogrid_to_db_mappings"];
  	$bg_node_label_priority = $config["bg_node_label_priority"];
  	$db_node_label_priority = $config["db_node_label_priority"];
  	$node_label_user_selection = $config["node_label_user_selection"];
  	$fixed_node_key = $config["fixed_node_key"];	
  	$search_config = $config["search_config"];
  	
  	#Attribute Settings
	$node_attributes = $config["node_attributes"];
	$edge_attributes = $config["edge_attributes"];
	$att_config_show = $config["attribute_config_displayed"];
	
	#Expression Data Settings
	$experiment_data = $config["experiment_data"];
?>
