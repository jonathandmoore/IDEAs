<?php
	session_start();
	if (isset($_SESSION['username']) && isset($_POST['gene'])) {
		
		$gene = $_POST['gene']; 
		
		//Get default settings
		require("get_config.php");
		
		#Connect to database
		$link = mysql_connect($db_server, $db_user, $db_pass) or die('Could not connect: ' . mysql_error());
		mysql_select_db($db_instance) or die('Could not select database');

		$query = "SELECT node, attribute_value FROM graph_node_experiment_attribute_value WHERE node = '" . $gene . "'";
		$graph_node_result = mysql_query($query) or die('Query failed: ' . mysql_error());
		
		$line = mysql_fetch_array($graph_node_result);
		
		echo json_encode($line["attribute_value"]);
		mysql_close($link);
	}
?>
