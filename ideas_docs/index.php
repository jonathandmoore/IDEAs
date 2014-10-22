<?php
// check user authorization
session_start();
//if(!isset($_SESSION['username'])){
//   header("Location: loginform.php");
//   exit;
// }
$_SESSION['username'] = "public";
?>

<html>
<!--
explore.php

Version 1.3c
Clare Boddington, Dafyd Jenkins, Alex Jironkin, Jay Moore.  (c) 2012 University of Warwick Systems Biology Centre

-->
<head>

	<?php
	require("get_config.php");
	echo '<title>' . $page_title . '</title>';

	echo '<script language="javascript" type="text/javascript" src="js/jquery-1.9.1.js"></script>';
	echo '<link type="text/css" href="css/pw_base.css" rel="stylesheet" />';
  	echo '<script type="text/javascript" src="jquery-ui-1.10.2.custom/js/jquery-ui-1.10.2.custom.min.js"></script>';
  	echo '<link type="text/css" href="jquery-ui-1.10.2.custom/css/smoothness/jquery-ui-1.10.2.custom.min.css" rel="stylesheet">';
	?>
	
	<script type="text/javascript" src="js/AC_OETags.min.js"></script>
	<script type="text/javascript" src="js/json2.min.js"></script>
	<script type="text/javascript" src="js/cytoscapeweb.min.js"></script>
	<script language="javascript" type="text/javascript" src="js/flot/jquery.flot.min.js"></script>
	<script language="javascript" type="text/javascript" src="js/flot/jquery.flot.canvas.min.js"></script>
	<script language="javascript" type="text/javascript" src="js/flot/plotSingleNodeData.js"></script>
	<script language="javascript" type="text/javascript" src="js/flot/plotEdgeData.js"></script>
	<script language="javascript" type="text/javascript" src="js/flot/plotMultipleNodeData.js"></script>
	<script language="javascript" type="text/javascript" src="js/flot/loadExperimentsFromTable.js"></script>
	<script language="javascript" type="text/javascript" src="js/flot/normalisation.js"></script>
	<script language="javascript" type="text/javascript" src="js/flot/mergeNodeData.js"></script>
	<link rel="stylesheet" href="css/tabber.css" TYPE="text/css" MEDIA="screen">
	<link rel="stylesheet" href="css/tabber-print.css" TYPE="text/css" MEDIA="print">
	<script language="javascript" type="text/javascript" src="js/ideas.js"></script>
	<script src="js/jquery.colorPicker.min.js" type="text/javascript"></script>
	

<script type="text/javascript">

/* Optional: Temporarily hide the "tabber" class so it does not "flash"
   on the page as plain HTML. After tabber runs, the class is changed
   to "tabberlive" and it will appear. */

document.write('<style type="text/css">.tabber{display:none;}<\/style>');

/*==================================================
  Set the tabber options (must do this before including tabber.js)
  ==================================================*/
var tabberOptions = {

  'cookie':"tabber", /* Name to use for the cookie */

  'onLoad': function(argsObj)
  {
    var t = argsObj.tabber;
    var i;

    /* Optional: Add the id of the tabber to the cookie name to allow
       for multiple tabber interfaces on the site.  If you have       multiple tabber interfaces (even on different pages) I suggest
       setting a unique id on each one, to avoid having the cookie set
       the wrong tab.
    */
    if (t.id) {
      t.cookie = t.id + t.cookie;
    }

    /* If a cookie was previously set, restore the active tab */
    i = parseInt(getCookie(t.cookie));
    if (isNaN(i)) { return; }
    t.tabShow(i);
    //alert('getCookie(' + t.cookie + ') = ' + i);
    
    
  },

  'onClick':function(argsObj)
  {
    var c = argsObj.tabber.cookie;
    var i = argsObj.index;
    //alert('setCookie(' + c + ',' + i + ')');
    setCookie(c, i);   
  }
       
};


/*==================================================
  Cookie functions
  ==================================================*/
function setCookie(name, value, expires, path, domain, secure) {
    document.cookie= name + "=" + escape(value) +
        ((expires) ? "; expires=" + expires.toGMTString() : "") +
        ((path) ? "; path=" + path : "") +
        ((domain) ? "; domain=" + domain : "") +
        ((secure) ? "; secure" : "");
}

function getCookie(name) {
    var dc = document.cookie;
    var prefix = name + "=";
    var begin = dc.indexOf("; " + prefix);
    if (begin == -1) {
        begin = dc.indexOf(prefix);
        if (begin != 0) return null;
    } else {
        begin += 2;
    }
    var end = document.cookie.indexOf(";", begin);
    if (end == -1) {
        end = dc.length;
    }
    return unescape(dc.substring(begin + prefix.length, end));
}
function deleteCookie(name, path, domain) {
    if (getCookie(name)) {
        document.cookie = name + "=" +
            ((path) ? "; path=" + path : "") +
            ((domain) ? "; domain=" + domain : "") +
            "; expires=Thu, 01-Jan-70 00:00:01 GMT";
    }
}

</script>

<!-- Include the tabber code -->
<script type="text/javascript" src="js/tabber-minimized.js"></script>

</head>
<body>

<?php     
require("get_config.php");
echo '<div id="page-header" align="left" width="100%" style="background-color:white" >';
if ($logout_link == 'true') {
	echo '<img src=../ideas_images/' . $logo_file . '></img><div style="float:right"><a href="logout.php">Log out</a>&nbsp&nbsp&nbsp<a href=' . $about_link . ' target="_blank">About</a></div>';
} else {
	echo '<img src=../ideas_images/' . $logo_file . '></img><div style="float:right"><a href=' . $about_link . ' target="_blank">About</a></div>';
}

echo '</div>';

echo "<div>";
echo '<table border="0" cellpadding="2">';
echo "<tr>";
echo "<td valign=top>";
echo '<div class="text" style="width:200px">';

echo '<p>';
echo '<div class="tabber" id="mytabber1">';

     echo '<div class="tabbertab" id="nodes_tab">';
     echo '<h2>Nodes</h2>';
     echo '<p></p>';
     	if (($biogrid_enabled == 'true') && ($biogrid_user_choose == 'true')) {
echo "Organism:<br> <select id='tax_ID'>
<option value='All'>All</option>	
<option value='7029'>Acyrthosiphon pisum</option>
<option value='7159'>Aedes aegypti</option>
<option value='9646'>Ailuropoda melanoleuca</option>
<option value='400682'>Amphimedon queenslandica</option>
<option value='28377'>Anolis carolinensis</option>
<option value='7165'>Anopheles gambiae</option>
<option value='7460'>Apis mellifera</option>
<option value='59689'>Arabidopsis lyrata</option>
<option value='3702'>Arabidopsis thaliana</option>
<option value='227321'>Aspergillus nidulans</option>
<option value='224308'>Bacillus subtilis</option>
<option value='9913'>Bos taurus</option>
<option value='15368'>Brachypodium distachyon</option>
<option value='6238'>Caenorhabditis briggsae</option>
<option value='6239'>Caenorhabditis elegans</option>
<option value='31234'>Caenorhabditis remanei</option>
<option value='9483'>Callithrix jacchus</option>
<option value='407148'>Campylobacter jejuni</option>
<option value='237561'>Candida albicans</option>
<option value='9615'>Canis familiaris</option>
<option value='10141'>Cavia porcellus</option>
<option value='3055'>Chlamydomonas reinhardtii</option>
<option value='10029'>Cricetulus griseus</option>
<option value='7176'>Culex quinquefasciatus</option>
<option value='7955'>Danio rerio</option>
<option value='352472'>Dictyostelium discoideum</option>
<option value='7227'>Drosophila melanogaster</option>
<option value='9796'>Equus caballus</option>
<option value='511145'>Escherichia coli</option>
<option value='9031'>Gallus gallus</option>
<option value='3847'>Glycine max</option>
<option value='11103'>Hepatitus C Virus</option>
<option value='9606'>Homo sapiens</option>
<option value='10298'>Human Herpesvirus 1</option>
<option value='10310'>Human Herpesvirus 2</option>
<option value='10335'>Human Herpesvirus 3</option>
<option value='10376'>Human Herpesvirus 4</option>
<option value='10359'>Human Herpesvirus 5</option>
<option value='10368'>Human Herpesvirus 6</option>
<option value='10372'>Human Herpesvirus 7</option>
<option value='435895'>Human Herpesvirus 8</option>
<option value='11676'>HIV 1</option>
<option value='11709'>HIV 2</option>
<option value='5664'>Leishmania major</option>
<option value='9785'>Loxodonta africana</option>
<option value='6945'>Lxodes scapularis</option>
<option value='9544'>Macaca mulatta</option>
<option value='9103'>Meleagris gallopavo</option>
<option value='13616'>Monodelphis domestica</option>
<option value='10366'>Murid Herpesvirus 1</option>
<option value='10090'>Mus musculus</option>
<option value='272634'>Mycoplasma pneumoniae</option>
<option value='246197'>Myxococcus xanthus</option>
<option value='45351'>Nematostella vectensis</option>
<option value='5141'>Neurospora crassa</option>
<option value='61853'>Nomascus leucogenys</option>
<option value='9258'>Ornithorhynchus anatinus</option>
<option value='9986'>Oryctolagus cuniculus</option>
<option value='39947'>Oryza sativa</option>
<option value='9598'>Pan troglodytes</option>
<option value='121225'>Pediculus humanus</option>
<option value='3218'>Physcomitrella patens</option>
<option value='4787'>Phytophthora infestans</option>
<option value='36329'>Plasmodium falciparum</option>
<option value='4754'>Pneumocystis carinii</option>
<option value='9601'>Pongo abelii</option>
<option value='3694'>Populus trichocarpa</option>
<option value='10116'>Rattus norvegicus</option>
<option value='3988'>Ricinus communis</option>
<option value='559292'>Saccharomyces cerevisiae</option>
<option value='6183'>Schistosoma mansoni</option>
<option value='4896'>Schizosaccharomyces pombe</option>
<option value='88036'>Selaginella moellendorffii</option>
<option value='57667'>SIV</option>
<option value='4558'>Sorghum bicolor</option>
<option value='525381'>Streptococcus pneumoniae</option>
<option value='7668'>Strongylocentrotus purpuratus</option>
<option value='9823'>Sus scrofa</option>
<option value='1140'>Synechococcus elongatus</option>
<option value='59729'>Taeniopygia guttata</option>
<option value='31033'>Takifugu rubripes</option>
<option value='10228'>Trichoplax adhaerens</option>
<option value='5270'>Ustilago maydis</option>
<option value='8355'>Xenopus laevis</option>
<option value='4577'>Zea mays</option>
</select><br>";     	
     	}
        echo '<p>Genes of interest, one per line:<br />';
         echo '<textarea id="genes" cols=22 rows=10 ></textarea /><br><p><p>';
         echo "<input type='button' value='Clear' id='clear_gene_text'/><br><br>";
    
   	// DISPLAY NODE SEARCH OPTIONS (IF ANY)
   	foreach ($search_config as $config) {
   		if ($config["display"] == 'yes') {
   			$label = $config["type"] . "_" . $config["name"];
   			if ($config["checked"] == "yes") {
   				echo "<input type='checkbox' id='" . $label . "' checked class='search_config'/><label for='" . $label . "'>" . $config["display_text"] . "</label><br>";
   			} else {
   				echo "<input type='checkbox' id='" . $label . "' class='search_config'/><label for='" . $label . "'>" . $config["display_text"] . "</label><br>";
   			}
   		}
   	}
   	
    echo '</div>';


     echo '<div class="tabbertab" id="edges_tab">';
     echo '<h2>Edges</h2>';

	if ($db_enabled == "true") {
		$link = mysql_connect($db_server, $db_user, $db_pass) or die('Could not connect: ' . mysql_error());
			mysql_select_db($db_instance) or die('Could not select database');
			
			#Get edge types
			$edge_source_query_file = "$base_dir/sql/retrieve_graph_edge_types.sql";
			$edge_source_query = file($edge_source_query_file);
			$edge_source_query_string = implode("\n",$edge_source_query);
		
			# Performing SQL query to get list of edge sources
			$edge_source_result = mysql_query($edge_source_query_string) or die('Query failed: ' . mysql_error());
			$num_edges = mysql_num_rows($edge_source_result);
			$half = ceil($num_edges / 2);
			if ($num_edges > 0) {
				echo 'Types of DB edge:<br>';
				echo '<table id="edgeTypeTable" border="0" width="100%"><col width="50%" /><col width="50%" /><tr><td valign="top">';
				$count = 1;
				while ($line = mysql_fetch_array($edge_source_result, MYSQL_ASSOC)) {
					if ($count == $half+1) {
						echo '</td><td valign=\"top\">';
					}
					echo "<br /><input type='checkbox' name='edge_source[]' value='" . $line['source'] . "'";
					echo '/> <label for="' . $line['source'] . '_db_edge">' . $line['source'] . '</label>';
					echo "<input id='" . $line['source'] . "' name='" . $line['source'] . "' type='text' class='cp_db' value='#c0c0c0' />";
					$count = $count + 1;
				}
				echo '</td></tr></table>';
				echo '<input type="button" value="All" id="all_edges"/><input type="button" value="None" id="no_edges"/></p>';
			}
			
			mysql_free_result($edge_source_result);
			mysql_close($link);
	}
	#Add BioGrid search options
	if ($biogrid_enabled == 'true') {
		echo "BioGRID edge selections:<br><br>";
		echo "<input type='checkbox' id='exclude_interspecies_ints' checked/><label for='exclude_interspecies_ints'>Exclude interspecies interactions</label><br>";
		echo "Throughput: <input type='radio' name='bg_throughput' value='any' checked>any<input type='radio' name='bg_throughput' value='low'>low<input type='radio' name='bg_throughput' value='high'>high<br>";
		#Add physical interactions
		echo "<br>Physical Interactions:<br>";
		echo '<table id="bgPhyIntTypeTable" border="0" width="100%"><col width="50%" /><tr><td valign="top">';
		foreach ($biogrid_physical_interactions as $int) {
			echo "<br /><input type='checkbox' name='bg_phy_source[]' value='" . str_replace(" ", "_", $int) . "'";
			echo '/> <label for="' . str_replace(" ", "_", $int) . '_bg_phy_edge">' . str_replace(" ", "_", $int) . '</label>';
			echo "<input id=" . str_replace(" ", "_", $int) . " name=" . str_replace(" ", "_", $int) . " type='text' class='cp_bg' value='#c0c0c0' />";	
		}
		echo '</td></tr></table>';
		echo '<input type="button" value="All" id="all_bg_phy"/><input type="button" value="None" id="no_bg_phy"/></p>';
		#Add genetic interactions
		echo "Genetic Interactions:<br>";
		echo '<table id="bgGenIntTypeTable" border="0" width="100%"><col width="50%" /><tr><td valign="top">';
		foreach ($biogrid_genetic_interactions as $int) {
			echo "<br /><input type='checkbox' name='bg_gen_source[]' value='" . str_replace(" ", "_", $int) . "'";
			echo '/> <label for="' . str_replace(" ", "_", $int) . '_bg_gen_edge">' . str_replace(" ", "_", $int) . '</label>';
			echo "<input id=" . str_replace(" ", "_", $int) . " name=" . str_replace(" ", "_", $int) . " type='text' class='cp_bg' value='#c0c0c0' />";	
		}
		echo '</td></tr></table>';
		echo '<input type="button" value="All" id="all_bg_gen"/><input type="button" value="None" id="no_bg_gen"/></p>';
	}
	echo '<br>Select an edge file:<br><br>';
	echo "<div><label for='filecol'>File edge colour selection:</label>";
	echo "<input id='filecol' name='filecol' type='text' class='cp1' value='#c0c0c0' /></div>";
	echo "<div id='edge_file_div'>";
	echo "<input type='file' id='edge_file' accept='txt/html'><input type='button' value='Remove File' id='edge_remove_file'/>";
	echo "</div>";
	echo "<br>Separator: <input type='radio' name='sep' value='tab' checked='checked'>tab<input type='radio' name='sep' value='space'>space<input type='radio' name='sep' value='comma'>comma";
	echo "<br><input type='checkbox' id='edge_file_arrows' checked='yes'/><label for='edge_file_arrows'>Arrows on user edges</label><br>";
	echo '<div id="file_result_div"></div>';
	echo '</div>';
	echo '<div class="tabbertab" id="graph_tab">';
    echo '<h2>Graph</h2>';
    echo '<p>Graph settings:</p>';
    if ($search_depth_default == "depth0") {
    	echo '<input type="radio" name="search_mode" value="depth0" checked="checked"/>Depth 0<br>';	
    } else {
    	echo '<input type="radio" name="search_mode" value="depth0"/>Depth 0<br>';
    }
    if ($search_depth_default == "depth1_basic") {
    	echo '<input type="radio" name="search_mode" value="depth1_basic" checked="checked"/>Depth 1 (no interactor interactions)<br>';
    } else {
    	echo '<input type="radio" name="search_mode" value="depth1_basic"/>Depth 1 (no interactor interactions)<br>';
    }
    if ($search_depth_default == "depth1_extended") {
    	echo '<input type="radio" name="search_mode" value="depth1_extended" checked="checked"/>Depth 1 (fetch interactor interactions)<br><br>';
    } else {
    	echo '<input type="radio" name="search_mode" value="depth1_extended"/>Depth 1 (fetch interactor interactions)<br><br>';
    }
	if ($hide_unconnected == "true") {
		echo '<input type="checkbox" name="hide_unconnected_checkbox" id="hide_unconnected_checkbox" value="Yes" checked/>Hide unconnected nodes<br>';
	} else {
		echo '<input type="checkbox" name="hide_unconnected_checkbox" id="hide_unconnected_checkbox" value="Yes" unchecked/>Hide unconnected nodes<br>';
	}
	if ($exclude_self == "true") {
		echo '<input type="checkbox" name="exclude_self_interactions_checkbox" id="exclude_self_ints" value="Yes" checked/>Exclude self interactions<br>';
	} else {
		echo '<input type="checkbox" name="exclude_self_interactions_checkbox" id="exclude_self_ints" value="Yes" unchecked/>Exclude self interactions<br>';
	}
	echo '<br>';
	echo '<p>Visual style:</p>';
    echo '<input type="checkbox" name="hide_node_labels" id="hide_node_labels" value="Yes" unchecked />Hide node labels<br>';
    echo '<input type="checkbox" name="hide_edge_labels" id="hide_edge_labels" value="Yes" unchecked />Hide edge labels<br><br>';
    if (count($node_label_user_selection) > 0) {
    echo 'Node label: ';
    echo '<select id="node_label">';
		foreach ($node_label_user_selection as $node_att) {
			echo '<option value="' . $node_att . '">' . $node_att . '</option>';	
		}
	echo '</select><br><br>';	
    }
	echo 'Node size: <input type="button" value="Up" id="node_size_up"/><input type="button" value="Down" id="node_size_down"/><br>';
    echo 'Edge width: <input type="button" value="Up" id="edge_width_up"/><input type="button" value="Down" id="edge_width_down"/><br>';
    echo 'Node width: <input type="button" value="Up" id="node_width_up"/><input type="button" value="Down" id="node_width_down"/><br>';
    echo "<div><label for='oin_col'>Of interest node border colour:</label><input id='oin_col' class='cp1' name='oin_col' type='text' value='#FF0B0B' /></div>";
	echo "<div><label for='oin_fill_col'>Of interest node fill colour:</label><input id='oin_fill_col' class='cp1' name='oin_fill_col' type='text' value='#FFF' /></div>";
    echo '<br><input type="button" id="default_visual_style" value="Default style"/><br><br>';
	echo "</div>";
	echo "<div class='tabbertab' id='inputdata_tab'>";
	echo "<h2>Upload</h2>";
	echo "Expression Data Upload:<br><br>";
	echo "<div id='exp_file_div'>";
	echo "<input type='file' id='exp_file' accept='txt/html'/>";
	echo "<input type='button' value='Remove File' id='exp_remove_file'/><br>";
	echo "</div>";
	echo "Separator: <input type='radio' name='exp_sep' value='tab' checked='checked'>tab<input type='radio' name='exp_sep' value='space'>space<input type='radio' name='exp_sep' value='comma'>comma<br>";
	echo "Allow normalisation: <input type='radio' name='rawScale' value='yes' checked='checked'>Yes<input type='radio' name='rawScale' value='no'>No<br>";
	echo "<input type='button' value='Upload' id='upload_exp_file'/><br>";
	if (count($experiment_data)>0) {
		echo "<br>System Expression Data:<br><br>";
		echo "<div id='existing_exp_data'>";
		foreach ($experiment_data as $key => $value) {
			echo $value["name"] . " - " . count($value["conditions"]) . " condition(s)<br>";
		}
		echo "</div>";
	}
	echo "<br>Uploaded Expression Data:<br><br>";
	echo "<div id='uploaded_exp_data'>";
	echo "None";
	echo "</div>";
	echo "<br><input type='button' value='Delete selected' id='delete_selected_exp_files' hidden/><br>";
	echo "</div>";

	echo "<p>";
	echo "<input type='button' id='show_connections_biogrid' value='Show connections' /><input type='button' id='no_network' value='Report' />";

?>
</div>

</td>
<td valign="top" width=80%>
<p>

<div id="cytoscapeweb" style="height:500px;"></div>
<div id="note"></div>

</td>

<td valign="top">

<div class="tabber" id="mytabber2"}>
  <div class="tabbertab" id="plots_tab">
  	<h2>Plots</h2>
  	<p>
  	<div id="plots"></div>
  </div>
  <div class="tabbertab" id="data_tab">
  <h2>Data</h2>
  <input type="button" value="Download network (sif)" id="download_network_sif"/><br>
  <input type="button" value="Download network (pdf)" id="download_network_pdf"/><br>
  <input type="button" value="All nodes" id="all_nodes_button"/><br>
  <input type="button" value="All edges" id="all_edges_button"/><br>
  <input type="button" value="Selected nodes" id="selected_nodes_button"/><br>
  <input type="button" value="Selected edges" id="selected_edges_button"/><br>
  <input type="button" value="Download node attributes (all nodes)" id="download_node_attributes_all"/><br>
  <input type="button" value="Download edge attributes (all edges)" id="download_edge_attributes_all"/><br>
  <input type="button" value="Download node attributes (selected nodes)" id="download_node_attributes_selected"/><br>
  <input type="button" value="Download edge attributes (selected edges)" id="download_edge_attributes_selected"/><br><br>
  <?php
  	require("get_config.php");
  	$node_attribute_groups = array();
	$edge_attribute_groups = array();
    
    foreach ($node_attributes as $atts) {
    	$node_attribute_groups[$atts['group']] = 'yes';
	}
	foreach ($edge_attributes as $atts) {
    	$edge_attribute_groups[$atts['group']] = 'yes';
	}
	
	if ($att_config_show == "true") {
		echo '<p>Node attribute groups to display and download:</p>';
		foreach ($node_attribute_groups as $key => $value) {
			echo "<input type='checkbox' name='node_attribute_group[]' value='" . $key . "' checked='yes'/><label for='" . $key . "'>" . $key . "</label><br>";
		}
		echo '<p>Edge attribute groups to display and download:</p>';
		foreach ($edge_attribute_groups as $key => $value) {
			echo "<input type='checkbox' name='edge_attribute_group[]' value='" . $key . "' checked='yes'/><label for='" . $key . "'>" . $key . "</label><br>";
		}
	}
  echo "<br>Plotting options:<br><br>";

  if (count($experiment_data)>0) {
  	for ($i = 0; $i <= 5; $i++) {
  		echo $i+1 . ": <select id='plotting" . $i . "' class='plotclass'><option value='None'>None</option>";
		$count = 0;
		foreach ($experiment_data as $key => $value) {
			if ($count == $i) {
				echo "<option value='" . $value["name"] . "'selected>". $value["name"] . "</option>";
			} else {
				echo "<option value='" . $value["name"] . "'>". $value["name"] . "</option>";
			}
			$count++;
		}
  		echo "</select><select id='plotting" . $i . "size' class='plotoptions'><option value='Full'>Full width</option><option value='Half' selected=true>Half width</option></select><br>";
	}
	echo "<br>";
  } 
	else
	{
		for($i=0;$i<=5;$i++)
			echo $i+1 . ": <select id='plotting" . $i . "' class='plotclass' disabled><option value='None'>None</option></select>
<select id='plotting" . $i . "size' class='plotoptions'><option value='Full'>Full width</option><option value='Half'>Half width</option></select><br>";
		echo "<br>";
  	}
  echo "Heatmap options:<br><br>";
  echo '<div id="heatmap_options">';

  if (count($experiment_data)>0) {
  	#echo "<input type='radio' name='cluster_opt' disabled value='cluster_opt0'><select id='heatmap_exp0' class='heatmap_exp'><option value='None'>None</option>";
  	echo "<select id='heatmap_exp0' class='heatmap_exp'><option value='None'>None</option>";
	foreach ($experiment_data as $key => $value) {
		echo "<option value='" . $value["name"] . "'>" . $value["name"] . "</option>";		
	}
  	echo "</select><select id='heatmap_con0' class='heatmap_con' disabled><option value='None'>None</option></select><br>";
  	#echo "<input type='radio' name='cluster_opt' disabled value='cluster_opt1'><select id='heatmap_exp1' class='heatmap_exp'><option value='None'>None</option>";
  	echo "<select id='heatmap_exp1' class='heatmap_exp'><option value='None'>None</option>";
	foreach ($experiment_data as $key => $value) {
		echo "<option value='" . $value["name"] . "'>" . $value["name"] . "</option>";		
	}
  	echo "</select><select id='heatmap_con1' class='heatmap_con' disabled><option value='None'>None</option></select><br><br>";
  } else {
  	#echo "<input type='radio' name='cluster_opt' disabled value='cluster_opt0'><select id='heatmap_exp0' class='heatmap_exp' disabled><option value='None'>None</option></select><select id='heatmap_con0' class='heatmap_con' disabled><option value='None'>None</option></select><br>";
  	echo "<select id='heatmap_exp0' class='heatmap_exp' disabled><option value='None'>None</option></select><select id='heatmap_con0' class='heatmap_con' disabled><option value='None'>None</option></select><br>";
  	echo "<select id='heatmap_exp1' class='heatmap_exp' disabled><option value='None'>None</option></select><select id='heatmap_con1' class='heatmap_con' disabled><option value='None'>None</option></select><br><br>";
	#echo "<input type='radio' name='cluster_opt' disabled value='cluster_opt1'><select id='heatmap_exp1' class='heatmap_exp' disabled><option value='None'>None</option></select><select id='heatmap_con1' class='heatmap_con' disabled><option value='None'>None</option></select><br><br>";
  }
  #echo "Clustering <input type='radio' name='cluster' value='no' checked='checked' disabled>no<input type='radio' name='cluster' value='yes' disabled>yes<br><br>";
  ?>
  <input type='button' value='Heatmap All Nodes' id='heatmap_all_nodes' disabled/><br>
  <input type='button' value='Heatmap Selected Nodes' id='heatmap_selected_nodes' disabled/><br><br>
  </div>
  <div id="data_div"></div>
  </div>
  <div class="tabbertab">
  <h2>Hide</h2>
  <p>
  <div id="hide" id="hide_tab"></div>
  </div>
</div>

</td>
</tr>
</table>
</div>
<div class="modal"></div>

<script>
	
$(document).ready(function () {
	
		if (!window.FileReader) {
			
			$('#edge_file_div').empty();
			$('#edge_file_div').append("<input type='button' id='edge_file' value='Choose File'/><input type='button' value='Remove File' id='edge_remove_file'/><div id='edge_file_text'>No file selected</div>");
			
			$('#exp_file_div').empty();
			$('#exp_file_div').append("<input type='button' id='exp_file' value='Choose File'/><input type='button' value='Remove File' id='exp_remove_file'/><div id='exp_file_text'>No file selected</div>");
			
			$.ajax({
			  type: "GET",
			  url: "js/swfobject/swfobject.js",
			  dataType: "script",
			  async: false
			});
			$.ajax({
			  type: "GET",
			  url: "js/jquery.FileReader.js",
			  dataType: "script",
			  async: false
			});
			$('#edge_file').fileReader({id:'edgefileReaderSWFObject'});
		    $('#exp_file').fileReader({id:'expfileReaderSWFObject'});
		} 
		ideas.initialise();
});
</script>

</body>
</html>
