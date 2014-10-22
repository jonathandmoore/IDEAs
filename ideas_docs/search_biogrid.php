<?php
	session_start();
	if(isset($_SESSION['username'])){
	
		$gene_text = "";
		$edge_file = "";
		$edge_file_keeps = array();
		$edge_file_arrows = "true";
		$file_separator = "\t";
		$hide_unconnected_nodes = "false";
		$edges = array(); 
		$throughput = "any"; 
		$exclude_self_ints = "false";
		$biogrid_exclude_interspecies = "true";
		$bg_edges = "";
		$search_mode = "depth0";
		$bg_addIds = "";
		$db_search_attributes = "";
		
		//Get default settings
		require("get_config.php");
	
		#Get POST data / overwriting default values with user selections if necessary
		if ( isset($_POST['gene_text']) ) { $gene_text = strip_tags($_POST['gene_text']); } 
		if ( isset($_POST['file_data']) ) { $edge_file = strip_tags($_POST['file_data']); } 
		if ( isset($_POST['edge_file_arrows']) ) { $edge_file_arrows = $_POST['edge_file_arrows']; } 
		if ( isset($_POST['edge_file_separator']) ) { $file_separator = $_POST['edge_file_separator']; } 
		if ( isset($_POST['hide_unconnected_nodes']) ) { $hide_unconnected_nodes = $_POST['hide_unconnected_nodes']; } 
		if ( isset($_POST['edges']) ) { $edges = $_POST['edges']; } 
		if ( isset($_POST['bg_throughput']) ) { $throughput = $_POST['bg_throughput']; } 
		if ( isset($_POST['exclude_self_ints']) ) { $exclude_self_ints = $_POST['exclude_self_ints']; } 
		if ( isset($_POST['exclude_interspecies_ints']) ) { $biogrid_exclude_interspecies = $_POST['exclude_interspecies_ints']; }
		if ( isset($_POST['bg_tax_ID']) ) { $biogrid_taxID = $_POST['bg_tax_ID']; }
		if ( isset($_POST['bg_edges']) ) { $bg_edges = implode("|", $_POST['bg_edges']); }
		if ( isset($_POST['search_mode']) ) { $search_mode = $_POST['search_mode']; }
		if ( isset($_POST['search_config']) ) { $user_search_config = $_POST['search_config']; }
	
		#Set other global variables
		$genes_of_interest = array(); #All search nodes entered by user (file nodes + gene text box nodes)
		$node_JSON = array();
		$edge_JSON = array();
		$edge_counts = array();
		
		if ($bg_edges=="") {
			$search_biogrid = "false";
		} else {
			$search_biogrid = "true";
		}
		
		$bg_addIdsArray = array();
		$db_search_attributes_array = array();
		
		//Set additional identifiers based on user selections
		foreach ($search_config as $config) {
			if ($config["display"]=='yes') {
				if ($config["type"]=='db') {
					if ($user_search_config['db_' . $config["name"]] == "true") {
						$db_search_attributes_array[] = "'" . $config["name"] . "'";
					}
				} else if ($config["type"]=='bg') {
					if ($user_search_config['bg_' . $config["name"]] == "true") {
						$bg_addIdsArray[] = $config["name"];
					}
				}	
			} else {
				//add to appropriate array
				if ($config["type"]=='db') {
					$db_search_attributes_array[] = "'" . $config["name"] . "'";	 
				} else if ($config["type"]=='bg') {
					$bg_addIdsArray[] = $config["name"];	
				}
			}
		}
		$bg_addIds = implode("|", $bg_addIdsArray);
		$db_search_attributes = implode(",", $db_search_attributes_array);
					
  		$biogrid_col_array = array();
		$biogrid_col_array["#BioGRID Interaction ID"] = 0;
		$biogrid_col_array["Entrez Gene Interactor A"] = 1;
		$biogrid_col_array["Entrez Gene Interactor B"] = 2;
		$biogrid_col_array["BioGRID ID Interactor A"] = 3;
		$biogrid_col_array["BioGRID ID Interactor B"] = 4;
		$biogrid_col_array["Systematic Name Interactor A"] = 5;   
		$biogrid_col_array["Systematic Name Interactor B"] = 6;   
		$biogrid_col_array["Official Symbol Interactor A"] = 7;
		$biogrid_col_array["Official Symbol Interactor B"] = 8;
		$biogrid_col_array["Synonyms Interactor A"] = 9;
		$biogrid_col_array["Synonyms Interactor B"] = 10;
		$biogrid_col_array["Experimental System"] = 11;  
		$biogrid_col_array["Experimental System Type"] = 12;
		$biogrid_col_array["Author"] = 13;  
		$biogrid_col_array["Pubmed ID"] = 14; 
		$biogrid_col_array["Organism Interactor A"] = 15;
		$biogrid_col_array["Organism Interactor B"] = 16;
		$biogrid_col_array["Throughput"] = 17;  
		$biogrid_col_array["Score"] = 18;   
		$biogrid_col_array["Modification"] = 19;
		$biogrid_col_array["Phenotypes"] = 20;
		$biogrid_col_array["Qualifications"] = 21;
		$biogrid_col_array["Tags"] = 22;
		$biogrid_col_array["Source Database"] = 23;
		$biogrid_col_array["Source Database Identifiers"] = 24;
		$biogrid_col_array["Number of Interactions In Publication"] = 25;
		$biogrid_col_array["Additional Identifiers Interactor A"] = 26;
		$biogrid_col_array["Number of Identifiers Interactor B"] = 27;
		
		$organism["7029"]="Acyrthosiphon pisum";
		$organism["7159"]="Aedes aegypti";
		$organism["9646"]="Ailuropoda melanoleuca";
		$organism["400682"]="Amphimedon queenslandica";
		$organism["28377"]="Anolis carolinensis";
		$organism["7165"]="Anopheles gambiae";
		$organism["7460"]="Apis mellifera";
		$organism["59689"]="Arabidopsis lyrata";
		$organism["3702"]="Arabidopsis thaliana";
		$organism["227321"]="Aspergillus nidulans";
		$organism["224308"]="Bacillus subtilis";
		$organism["9913"]="Bos taurus";
		$organism["15368"]="Brachypodium distachyon";
		$organism["6238"]="Caenorhabditis briggsae";
		$organism["6239"]="Caenorhabditis elegans";
		$organism["31234"]="Caenorhabditis remanei";
		$organism["9483"]="Callithrix jacchus";
		$organism["407148"]="Campylobacter jejuni";
		$organism["237561"]="Candida albicans";
		$organism["9615"]="Canis familiaris";
		$organism["10141"]="Cavia porcellus";
		$organism["3055"]="Chlamydomonas reinhardtii";
		$organism["10029"]="Cricetulus griseus";
		$organism["7176"]="Culex quinquefasciatus";
		$organism["7955"]="Danio rerio";
		$organism["352472"]="Dictyostelium discoideum";
		$organism["7227"]="Drosophila melanogaster";
		$organism["9796"]="Equus caballus";
		$organism["511145"]="Escherichia coli";
		$organism["9031"]="Gallus gallus";
		$organism["3847"]="Glycine max";
		$organism["11103"]="Hepatitus C Virus";
		$organism["9606"]="Homo sapiens";
		$organism["10298"]="Human Herpesvirus 1";
		$organism["10310"]="Human Herpesvirus 2";
		$organism["10335"]="Human Herpesvirus 3";
		$organism["10376"]="Human Herpesvirus 4";
		$organism["10359"]="Human Herpesvirus 5";
		$organism["10368"]="Human Herpesvirus 6";
		$organism["10372"]="Human Herpesvirus 7";
		$organism["435895"]="Human Herpesvirus 8";
		$organism["11676"]="HIV 1";
		$organism["11709"]="HIV 2";
		$organism["5664"]="Leishmania major";
		$organism["9785"]="Loxodonta africana";
		$organism["6945"]="Lxodes scapularis";
		$organism["9544"]="Macaca mulatta";
		$organism["9103"]="Meleagris gallopavo";
		$organism["13616"]="Monodelphis domestica";
		$organism["10366"]="Murid Herpesvirus 1";
		$organism["10090"]="Mus musculus";
		$organism["272634"]="Mycoplasma pneumoniae";
		$organism["246197"]="Myxococcus xanthus";
		$organism["45351"]="Nematostella vectensis";
		$organism["5141"]="Neurospora crassa";
		$organism["61853"]="Nomascus leucogenys";
		$organism["9258"]="Ornithorhynchus anatinus";
		$organism["9986"]="Oryctolagus cuniculus";
		$organism["39947"]="Oryza sativa";
		$organism["9598"]="Pan troglodytes";
		$organism["121225"]="Pediculus humanus";
		$organism["3218"]="Physcomitrella patens";
		$organism["4787"]="Phytophthora infestans";
		$organism["36329"]="Plasmodium falciparum";
		$organism["4754"]="Pneumocystis carinii";
		$organism["9601"]="Pongo abelii";
		$organism["3694"]="Populus trichocarpa";
		$organism["10116"]="Rattus norvegicus";
		$organism["3988"]="Ricinus communis";
		$organism["559292"]="Saccharomyces cerevisiae";
		$organism["6183"]="Schistosoma mansoni";
		$organism["4896"]="Schizosaccharomyces pombe";
		$organism["88036"]="Selaginella moellendorffii";
		$organism["57667"]="SIV";
		$organism["4558"]="Sorghum bicolor";
		$organism["525381"]="Streptococcus pneumoniae";
		$organism["7668"]="Strongylocentrotus purpuratus";
		$organism["9823"]="Sus scrofa";
		$organism["1140"]="Synechococcus elongatus";
		$organism["59729"]="Taeniopygia guttata";
		$organism["31033"]="Takifugu rubripes";
		$organism["10228"]="Trichoplax adhaerens";
		$organism["5270"]="Ustilago maydis";
		$organism["8355"]="Xenopus laevis";
		$organism["4577"]="Zea mays";
  		
		function processGeneText() {
		
			global $genes_of_interest, $gene_text;
		
			$genes = mb_convert_case($gene_text, MB_CASE_UPPER, "UTF-8");		
			$genes_array_prelim = explode("\n", $genes);
			
			foreach ($genes_array_prelim as $value) {
				if (trim($value) != "" && strlen(trim($value))>2) {
					$genes_of_interest[trim($value)] = array();
				}
			}
		}
		
		function processFileText() {
			
			global $file_separator, $edge_file, $edge_file_keeps, $genes_of_interest, $node_JSON, $edge_JSON, $hide_unconnected_nodes, $edge_counts, $exclude_self_ints;
			
			#Set file separator based on user selection
			$delim = "\t";
			if ($file_separator == "space") {
				$delim = " ";
			} else if ($file_separator == "comma") {
 				$delim = ",";	
 			}

			$file_edges = preg_split( '/\r\n|\r|\n/', $edge_file);
			foreach ($file_edges as $edge) {
				$trimmed_edge = trim($edge);
				if ($trimmed_edge != "") {
					$edge_comps = explode($delim, $edge);
					# Deal with any rows that have 3 columns
					if (count($edge_comps) >= 3) {
						$edge_comps[0] = strtoupper(trim($edge_comps[0]));
						$edge_comps[1] = trim($edge_comps[1]);
						$edge_comps[2] = strtoupper(trim($edge_comps[2]));
						
						#Only add if all three elements are not empty string
						if ($edge_comps[0] != "" and $edge_comps[1] != "" and $edge_comps[2] != "") {
							
							if ((strlen($edge_comps[0])>2) && (strlen($edge_comps[2])>2)) {
								$genes_of_interest[$edge_comps[0]] = array();
								$genes_of_interest[$edge_comps[2]] = array();
							
								#Add edges to temporary array
								if ($exclude_self_ints == "true") {
									if ($edge_comps[0] != $edge_comps[2]) {
										$edge_file_keeps[] = $edge_comps[0] . "\t" . $edge_comps[1] . "\t" . $edge_comps[2];	
									}
								} else {
									$edge_file_keeps[] = $edge_comps[0] . "\t" . $edge_comps[1] . "\t" . $edge_comps[2];
								}
							}
						}
						
					# Deal with any rows that do not have 3 columns (ignore anything after 1st column)
					} else {
						$edge_comps[0] = strtoupper(trim($edge_comps[0]));
						if (strlen($edge_comps[0])>2) {
							$genes_of_interest[$edge_comps[0]] = array();
						}
					}
				}
			}
		}
		
		function getBioGridNodesAndEdges($nodes, $depth, $identifiers, $key) {
		
			global $node_label_user_selection, $bg_node_label_priority, $organism, $throughput, $exclude_self_ints, $node_JSON, $edge_JSON, $biogrid_http, $biogrid_search_mode, $biogrid_accesskey, $biogrid_taxID, $biogrid_col_array, $biogrid_exclude_interspecies, $bg_edges, $edge_counts, $genes_of_interest;

			#Create $node_string
			$node_string = implode("|", array_keys($nodes));
		
			$request;
			if ($depth == "depth0") {
				$request = $biogrid_http . "?additionalIdentifierTypes=" . $identifiers ."&geneList=" . $node_string . "&includeEvidence=true&evidenceList=" . $bg_edges . "&includeInteractors=false&interSpeciesExcluded=" . $biogrid_exclude_interspecies . "&includeHeader=true&throughputTag=" . $throughput . "&selfInteractionsExcluded=" . $exclude_self_ints . "&taxID=" . $biogrid_taxID . "&accesskey=" . $biogrid_accesskey;

			} 
			else if ($depth == "depth1_basic") {
				$request = $biogrid_http . "?additionalIdentifierTypes=" . $identifiers . "&geneList=" . $node_string . "&includeEvidence=true&evidenceList=" . $bg_edges . "&includeInteractors=true&includeInteractorInteractions=false&interSpeciesExcluded=" . $biogrid_exclude_interspecies . "&includeHeader=true&throughputTag=" . $throughput . "&selfInteractionsExcluded=" . $exclude_self_ints . "&taxID=" . $biogrid_taxID . "&accesskey=" . $biogrid_accesskey;
			}
			$biogrid_counts = array();
			$biogrid_results_array = file($request);
			if ($biogrid_results_array != FALSE) {
			
				#Remove header before continuing
				array_shift($biogrid_results_array);
				
				foreach ($biogrid_results_array as $res) {
					$current = explode("\t", $res);
					#There should be 24 elements - do not process if not
					if (count($current)==24) {
					
						$source_ID = strtoupper($current[$biogrid_col_array[$key . " Interactor A"]]);
						$target_ID = strtoupper($current[$biogrid_col_array[$key . " Interactor B"]]);
						
						//ADD SOURCE NODE IF IT DOESN'T ALREADY EXIST
						if (!array_key_exists($source_ID, $node_JSON)) {
							//Add to $node_JSON
							$current_node_array = array();
							$current_node_array["id"] = $source_ID;
							$current_node_array["Organism"] = $organism[$current[$biogrid_col_array["Organism Interactor A"]]];
							$current_node_array["Entrez Gene ID"] = strtoupper($current[$biogrid_col_array["Entrez Gene Interactor A"]]);
							$current_node_array["Official Symbol"] = strtoupper($current[$biogrid_col_array["Official Symbol Interactor A"]]);
							$current_node_array["Synonyms"] = strtoupper($current[$biogrid_col_array["Synonyms Interactor A"]]);
							$current_node_array["Systematic Name"] = strtoupper($current[$biogrid_col_array["Systematic Name Interactor A"]]);
							
							//Assign label
							$i = 0;
							$cont = true;
							do {
								if ($current_node_array[$bg_node_label_priority[$i]]!="-") {
									$current_node_array["label"] = $current_node_array[$bg_node_label_priority[$i]];
									$cont = false;
								} else {
									$i = $i + 1;
								}
							} while ($cont);
							
							//Make sure this node has a value for all the possible node label attributes
							if (count($node_label_user_selection)>0) {
								foreach($node_label_user_selection as $node_att) {
									if (!array_key_exists($node_att, $current_node_array)) {
										$current_node_array[$node_att] = "-";
									}
								}
							}
							
							//Check which input genes this node matches (if any)
							if ($bg_official_symbol == "true") {
								if (array_key_exists($current_node_array["Official Symbol"],$genes_of_interest)) {
									$genes_of_interest[$current_node_array["Official Symbol"]][] = $source_ID;
									$current_node_array["of_interest_here"] = "1";
								}
							}
							if ($bg_systematic_name == "true") {
								if (array_key_exists($current_node_array["Systematic Name"],$genes_of_interest)) {
									$genes_of_interest[$current_node_array["Systematic Name"]][] = $source_ID;
									$current_node_array["of_interest_here"] = "1";
								}
							
							}
							if ($bg_entrez_gene == "true") {
								if (array_key_exists($current_node_array["Entrez Gene ID"],$genes_of_interest)) {
									$genes_of_interest[$current_node_array["Entrez Gene ID"]][] = $source_ID;
									$current_node_array["of_interest_here"] = "1";
								}
							
							}
							if ($bg_synonyms == "true") {
								$syns = explode("|",$current_node_array["Synonyms"]);
								foreach($syns as $syn) {
									if (array_key_exists($syn,$genes_of_interest)) {
										$genes_of_interest[$syn][] = $source_ID;
										$current_node_array["of_interest_here"] = "1";
									}	
								}
							}
							$node_JSON[$source_ID] = $current_node_array;
						}
					
						//ADD TARGET NODE IF IT DOESN'T ALREADY EXIST
						if (!array_key_exists($target_ID, $node_JSON)) {
							//Add to $node_JSON
							$current_node_array = array();
							$current_node_array["id"] = $target_ID;
							$current_node_array["Organism"] = $organism[$current[$biogrid_col_array["Organism Interactor B"]]];
							$current_node_array["Entrez Gene ID"] = strtoupper($current[$biogrid_col_array["Entrez Gene Interactor B"]]);
							$current_node_array["Official Symbol"] = strtoupper($current[$biogrid_col_array["Official Symbol Interactor B"]]);
							$current_node_array["Synonyms"] = strtoupper($current[$biogrid_col_array["Synonyms Interactor B"]]);
							$current_node_array["Systematic Name"] = strtoupper($current[$biogrid_col_array["Systematic Name Interactor B"]]);
							
							//Assign label
							$i = 0;
							$cont = true;
							do {
								if ($current_node_array[$bg_node_label_priority[$i]]!="-") {
									$current_node_array["label"] = $current_node_array[$bg_node_label_priority[$i]];
									$cont = false;
								} else {
									$i = $i + 1;
								}
							} while ($cont);
							
							//Make sure this node has a value for all the possible node label attributes
							if (count($node_label_user_selection)>0) {
								foreach($node_label_user_selection as $node_att) {
									if (!array_key_exists($node_att, $current_node_array)) {
										$current_node_array[$node_att] = "-";
									}
								}
							}
							
							//Check which input genes this node matches (if any)
							if ($bg_official_symbol == "true") {
								if (array_key_exists($current_node_array["Official Symbol"],$genes_of_interest)) {
									$genes_of_interest[$current_node_array["Official Symbol"]][] = $target_ID;
									$current_node_array["of_interest_here"] = "1";
								}
							}
							if ($bg_systematic_name == "true") {
								if (array_key_exists($current_node_array["Systematic Name"],$genes_of_interest)) {
									$genes_of_interest[$current_node_array["Systematic Name"]][] = $target_ID;
									$current_node_array["of_interest_here"] = "1";
								}
							
							}
							if ($bg_entrez_gene == "true") {
								if (array_key_exists($current_node_array["Entrez Gene ID"],$genes_of_interest)) {
									$genes_of_interest[$current_node_array["Entrez Gene ID"]][] = $target_ID;
									$current_node_array["of_interest_here"] = "1";
								}
							}
							if ($bg_synonyms == "true") {
								$syns = explode("|",$current_node_array["Synonyms"]);
								foreach($syns as $syn) {
									if (array_key_exists($syn,$genes_of_interest)) {
										$genes_of_interest[$syn][] = $target_ID;
										$current_node_array["of_interest_here"] = "1";
									}	
								}
							}
							$node_JSON[$target_ID] = $current_node_array;
						}
						
						// #Add edge to $edge_JSON
						$current_edge_array = array();
						$current_edge_array["source"] = $source_ID;
						$current_edge_array["target"] = $target_ID;
						$current_edge_array["origin"] = "biogrid";
						$current_edge_array["type"] = $current[$biogrid_col_array["Experimental System"]];
						$current_edge_array["Experimental System"] = $current[$biogrid_col_array["Experimental System"]];
						$current_edge_array["Experimental System Type"] = $current[$biogrid_col_array["Experimental System Type"]];
						$current_edge_array["Author"] = $current[$biogrid_col_array["Author"]];
						$current_edge_array["Pubmed ID"] = $current[$biogrid_col_array["Pubmed ID"]];
						$current_edge_array["Throughput"] = $current[$biogrid_col_array["Throughput"]];
						$current_edge_array["Score"] = $current[$biogrid_col_array["Score"]];
						$current_edge_array["Modification"] = $current[$biogrid_col_array["Modification"]];
						$current_edge_array["Phenotypes"] = $current[$biogrid_col_array["Phenotypes"]];
						$current_edge_array["Qualifications"] = $current[$biogrid_col_array["Qualifications"]];
						$current_edge_array["Tags"] = $current[$biogrid_col_array["Tags"]];	
						$current_edge_array["Source Organism"] = $organism[$current[$biogrid_col_array["Organism Interactor A"]]];
						$current_edge_array["Target Organism"] = $organism[$current[$biogrid_col_array["Organism Interactor B"]]];
						
						#Add direction (make all genetic interactions directed / all physical interactions undirected)
						if ($current_edge_array["Experimental System Type"] == 'genetic') {
							$current_edge_array["directed"] = true;
						} else {
							$current_edge_array["directed"] = false;
						}
						$edge_JSON[] = $current_edge_array;
						
						if (array_key_exists($current[$biogrid_col_array["Experimental System"]], $biogrid_counts)) {
    						$biogrid_counts[$current[$biogrid_col_array["Experimental System"]]] = $biogrid_counts[$current[$biogrid_col_array["Experimental System"]]] + 1;
						} else {
							$biogrid_counts[$current[$biogrid_col_array["Experimental System"]]] = 1;
						}
						
					}
				}
			
			} else {
				//Report back that there was a problem with BioGRID
				$biogrid_counts["ERROR"] = "$request";
			}
			
			if (count($biogrid_counts)>0) {
				$edge_counts["biogrid"] = $biogrid_counts; 
			}
		
		} 
		
		function getBioGridNodesAndEdgesDB($nodes, $depth, $identifiers, $key) {
		
			global $node_label_user_selection, $bg_node_label_priority, $mappings, $organism, $throughput, $exclude_self_ints, $node_JSON, $edge_JSON, $biogrid_http, $biogrid_search_mode, $biogrid_accesskey, $biogrid_taxID, $biogrid_col_array, $biogrid_exclude_interspecies, $bg_edges, $edge_counts, $genes_of_interest;

			#Create $node_string
			$node_string = implode("|", array_keys($nodes));
		
			$request;
			if ($depth == "depth0") {
				$request = $biogrid_http . '?additionalIdentifierTypes=' . $identifiers .'&geneList=' . $node_string . '&includeEvidence=true&evidenceList=' . $bg_edges . '&includeInteractors=false&interSpeciesExcluded=' . $biogrid_exclude_interspecies . '&includeHeader=true&throughputTag=' . $throughput . '&selfInteractionsExcluded=' . $exclude_self_ints . '&taxID=' . $biogrid_taxID . '&accesskey=' . $biogrid_accesskey;

			} else if ($depth == "depth1_basic") {
				$request = $biogrid_http . '?additionalIdentifierTypes=' . $identifiers . '&geneList=' . $node_string . '&includeEvidence=true&evidenceList=' . $bg_edges . '&includeInteractors=true&includeInteractorInteractions=false&interSpeciesExcluded=' . $biogrid_exclude_interspecies . '&includeHeader=true&throughputTag=' . $throughput . '&selfInteractionsExcluded=' . $exclude_self_ints . '&taxID=' . $biogrid_taxID . '&accesskey=' . $biogrid_accesskey;
			}
			
			$biogrid_counts = array();
			$biogrid_results_array = file($request);
			
			if ($biogrid_results_array != FALSE) {
			
				#Remove header before continuing
				array_shift($biogrid_results_array);
				
				foreach ($biogrid_results_array as $res) {
					$current = explode("\t", $res);
					#There should be 24 elements - do not process if not
					if (count($current)==24) {
					
						$source_ID = strtoupper($current[$biogrid_col_array[$key . " Interactor A"]]);
						$target_ID = strtoupper($current[$biogrid_col_array[$key . " Interactor B"]]);
						
						//ADD SOURCE NODE IF IT DOESN'T ALREADY EXIST
						if (!array_key_exists($source_ID, $node_JSON)) {
							//Add to $node_JSON
							$current_node_array = array();
							//$current_node_array["label"] = strtoupper($current[$biogrid_col_array[$nodeLabel . " Interactor A"]]);
							$current_node_array["id"] = $source_ID;
							$current_node_array["Organism"] = $organism[$current[$biogrid_col_array["Organism Interactor A"]]];
							$current_node_array["Entrez Gene ID"] = strtoupper($current[$biogrid_col_array["Entrez Gene Interactor A"]]);
							$current_node_array["Official Symbol"] = strtoupper($current[$biogrid_col_array["Official Symbol Interactor A"]]);
							$current_node_array["Synonyms"] = strtoupper($current[$biogrid_col_array["Synonyms Interactor A"]]);
							$current_node_array["Systematic Name"] = strtoupper($current[$biogrid_col_array["Systematic Name Interactor A"]]);
							//Assign label
							$i = 0;
							$cont = true;
							do {
								if ($current_node_array[$bg_node_label_priority[$i]]!="-") {
									$current_node_array["label"] = $current_node_array[$bg_node_label_priority[$i]];
									$cont = false;
								} else {
									$i = $i + 1;
								}
							} while ($cont);
							
							//Remap attribute names
							if (count($mappings)>0) {
								foreach($mappings as $mapping) {
									$current_node_array[$mapping["db"]] = $current_node_array[$mapping["bg"]];
									unset($current_node_array[$mapping["bg"]]);
								}
							}
							
							//Make sure this node has a value for all the possible node label attributes
							if (count($node_label_user_selection)>0) {
								foreach($node_label_user_selection as $node_att) {
									if (!array_key_exists($node_att, $current_node_array)) {
										$current_node_array[$node_att] = "-";
									}
								}
							}
							$node_JSON[$source_ID] = $current_node_array;
						}
					
						//ADD TARGET NODE IF IT DOESN'T ALREADY EXIST
						if (!array_key_exists($target_ID, $node_JSON)) {
							//Add to $node_JSON
							$current_node_array = array();
							//$current_node_array["label"] = strtoupper($current[$biogrid_col_array[$nodeLabel . " Interactor B"]]);
							$current_node_array["id"] = $target_ID;
							$current_node_array["Organism"] = $organism[$current[$biogrid_col_array["Organism Interactor B"]]];
							$current_node_array["Entrez Gene ID"] = strtoupper($current[$biogrid_col_array["Entrez Gene Interactor B"]]);
							$current_node_array["Official Symbol"] = strtoupper($current[$biogrid_col_array["Official Symbol Interactor B"]]);
							$current_node_array["Synonyms"] = strtoupper($current[$biogrid_col_array["Synonyms Interactor B"]]);
							$current_node_array["Systematic Name"] = strtoupper($current[$biogrid_col_array["Systematic Name Interactor B"]]);
							
							$i = 0;
							$cont = true;
							do {
								if ($current_node_array[$bg_node_label_priority[$i]]!="-") {
									$current_node_array["label"] = $current_node_array[$bg_node_label_priority[$i]];
									$cont = false;
								} else {
									$i = $i + 1;
								}
							} while ($cont);
							
							if (count($mappings)>0) {
								foreach($mappings as $mapping) {
									$current_node_array[$mapping["db"]] = $current_node_array[$mapping["bg"]];
									unset($current_node_array[$mapping["bg"]]);
								}
							}
							
							//Make sure this node has a value for all the possible node label attributes
							if (count($node_label_user_selection)>0) {
								foreach($node_label_user_selection as $node_att) {
									if (!array_key_exists($node_att, $current_node_array)) {
										$current_node_array[$node_att] = "-";
									}
								}
							}
							$node_JSON[$target_ID] = $current_node_array;
						}
						
						// #Add edge to $edge_JSON
						$current_edge_array = array();
						$current_edge_array["source"] = $source_ID;
						$current_edge_array["target"] = $target_ID;
						$current_edge_array["origin"] = "biogrid";
						$current_edge_array["type"] = $current[$biogrid_col_array["Experimental System"]];
						$current_edge_array["Experimental System"] = $current[$biogrid_col_array["Experimental System"]];
						$current_edge_array["Experimental System Type"] = $current[$biogrid_col_array["Experimental System Type"]];
						$current_edge_array["Author"] = $current[$biogrid_col_array["Author"]];
						$current_edge_array["Pubmed ID"] = $current[$biogrid_col_array["Pubmed ID"]];
						$current_edge_array["Throughput"] = $current[$biogrid_col_array["Throughput"]];
						$current_edge_array["Score"] = $current[$biogrid_col_array["Score"]];
						$current_edge_array["Modification"] = $current[$biogrid_col_array["Modification"]];
						$current_edge_array["Phenotypes"] = $current[$biogrid_col_array["Phenotypes"]];
						$current_edge_array["Qualifications"] = $current[$biogrid_col_array["Qualifications"]];
						$current_edge_array["Tags"] = $current[$biogrid_col_array["Tags"]];	
						$current_edge_array["Source Organism"] = $current[$biogrid_col_array["Organism Interactor A"]];
						$current_edge_array["Target Organism"] = $current[$biogrid_col_array["Organism Interactor B"]];
						
						#Add direction (make all genetic interactions directed / all physical interactions undirected)
						if ($current_edge_array["Experimental System Type"] == 'genetic') {
							$current_edge_array["directed"] = true;
						} else {
							$current_edge_array["directed"] = false;
						}
						$edge_JSON[] = $current_edge_array;
						
						if (array_key_exists($current[$biogrid_col_array["Experimental System"]], $biogrid_counts)) {
    						$biogrid_counts[$current[$biogrid_col_array["Experimental System"]]] = $biogrid_counts[$current[$biogrid_col_array["Experimental System"]]] + 1;
						} else {
							$biogrid_counts[$current[$biogrid_col_array["Experimental System"]]] = 1;
						}
						
					}
				}
			
			} else {
				//Report back that there was a problem with BioGRID
				$biogrid_counts["ERROR"] = "";
			}
			
			if (count($biogrid_counts)>0) {
				$edge_counts["biogrid"] = $biogrid_counts; 
			}
		
		} 
		
		function BioGridDepthOneNodes($nodes, $addIds, $type) {
		
			global $throughput, $exclude_self_ints, $exclude_interspecies_ints, $biogrid_http, $biogrid_accesskey, $biogrid_taxID, $biogrid_col_array, $biogrid_exclude_interspecies, $bg_edges;
			
			#Create $node_string
			$node_string = implode("|", array_keys($nodes));
			//$request = $biogrid_http . '?searchIds=' . $biogrid_search_IDs . '&searchNames=' . $biogrid_search_names . '&searchSynonyms=' . $biogrid_search_synonyms . '&geneList=' . $node_string . '&includeEvidence=true&evidenceList=' . $bg_edges . '&includeInteractors=true&includeInteractorInteractions=false&interSpeciesExcluded=' . $biogrid_exclude_interspecies . '&includeHeader=true&throughputTag=' . $throughput . '&selfInteractionsExcluded=' . $exclude_self_ints . '&taxID=' . $biogrid_taxID . '&accesskey=' . $biogrid_accesskey;
			$request = $biogrid_http . '?additionalIdentifierTypes=' . $addIds . '&geneList=' . $node_string . '&includeEvidence=true&evidenceList=' . $bg_edges . '&includeInteractors=true&includeInteractorInteractions=false&interSpeciesExcluded=' . $biogrid_exclude_interspecies . '&includeHeader=true&throughputTag=' . $throughput . '&selfInteractionsExcluded=' . $exclude_self_ints . '&taxID=' . $biogrid_taxID . '&accesskey=' . $biogrid_accesskey;

			$biogrid_results_array = file($request);
			$depthOneNodes = array();
			//$type = "BioGRID ID";
			
			//$biogrid_results_array will be equal to FALSE if a BioGRID error occurred
			if (($biogrid_results_array != FALSE) && (count($biogrid_results_array)>0)) {
				#Remove header before continuing
				array_shift($biogrid_results_array);
				
				foreach ($biogrid_results_array as $res) {
			
					$current = explode("\t", $res);
					#There should be 24 elements - do not process if not
					if (count($current)==24) {
				
						$depthOneNodes[strtoupper($current[$biogrid_col_array[$type . " Interactor A"]])] = "";
						$depthOneNodes[strtoupper($current[$biogrid_col_array[$type . " Interactor B"]])] = "";
					}
				}
			}
			return $depthOneNodes;
		}
		
		function addNodes() {
		
			global $genes_of_interest, $node_JSON, $search_biogrid;
			
			foreach ($genes_of_interest as $name => $value) {
			
				if (count($value)==0) {
					$current_node_array = array();
					$current_node_array["id"] = $name;
					$current_node_array["label"] = $name;
					$current_node_array["of_interest_here"] = "1";
					$current_node_array["Entrez Gene ID"] = "-";
					$current_node_array["Official Symbol"] = "-";
					$current_node_array["Systematic Name"] = "-";
					$genes_of_interest[$name][] = $name;
					$node_JSON[$name] = $current_node_array;	
				}
			}
		}
		
		function addFileEdges() {
			
			global$node_label_user_selection, $edge_file_arrows, $genes_of_interest, $node_JSON, $edge_JSON, $edge_file_keeps, $edge_counts;
			
			$file_edge_counts = array();

			#Determine whether or not the edges need arrows
			$direction = true;
			if ($edge_file_arrows == "false") {
				$direction = false;
			} 

			$edge_comps;
			foreach ($edge_file_keeps as $edge) {
				$edge_comps = explode("\t", $edge);	
				
				//Source
				if (count($genes_of_interest[$edge_comps[0]])==0) {
					$current_node_array = array();
					$current_node_array["id"] = $edge_comps[0];
					$current_node_array["label"] = $edge_comps[0];
					$current_node_array["of_interest_here"] = "1";
					//Make sure this node has a value for all the possible node label attributes
					if (count($node_label_user_selection)>0) {
						foreach($node_label_user_selection as $node_att) {
							if (!array_key_exists($node_att, $current_node_array)) {
								$current_node_array[$node_att] = "-";
							}
						}
					}
					$genes_of_interest[$edge_comps[0]][] = $edge_comps[0];
					$node_JSON[$edge_comps[0]] = $current_node_array;
				}
				
				//Target
				if (count($genes_of_interest[$edge_comps[2]])==0) {
					//Node doesn't exist
					$current_node_array = array();
					$current_node_array["id"] = $edge_comps[2];
					$current_node_array["label"] = $edge_comps[2];
					$current_node_array["of_interest_here"] = "1";
					//Make sure this node has a value for all the possible node label attributes
					if (count($node_label_user_selection)>0) {
						foreach($node_label_user_selection as $node_att) {
							if (!array_key_exists($node_att, $current_node_array)) {
								$current_node_array[$node_att] = "-";
							}
						}
					}
					$genes_of_interest[$edge_comps[2]][] = $edge_comps[2];
					$node_JSON[$edge_comps[2]] = $current_node_array;
				}
				
				foreach ($genes_of_interest[$edge_comps[0]] as $source_node) {
					foreach ($genes_of_interest[$edge_comps[2]] as $target_node) {
						$current_edge_array = array();
						$current_edge_array["source"] = $source_node;
						$current_edge_array["target"] = $target_node;
						$current_edge_array["origin"] = "file";
						$current_edge_array["type"] = $edge_comps[1];
						$current_edge_array["directed"] = $direction;
						$edge_JSON[] = $current_edge_array;
						
						if (array_key_exists($edge_comps[1], $file_edge_counts)) {
							$file_edge_counts[$edge_comps[1]] = $file_edge_counts[$edge_comps[1]] + 1;
						} else {
							$file_edge_counts[$edge_comps[1]] = 1;
						}
					}
				}
			}
			$edge_counts["file"] = $file_edge_counts;
		}
		
		function addFileEdgesDB() {
			
			global $node_label_user_selection, $edge_file_arrows, $genes_of_interest, $node_JSON, $edge_JSON, $edge_file_keeps, $edge_counts;
			
			$file_edge_counts = array();

			#Determine whether or not the edges need arrows
			$direction = true;
			if ($edge_file_arrows == "false") {
				$direction = false;
			} 

			$edge_comps;
			foreach ($edge_file_keeps as $edge) {
				$edge_comps = explode("\t", $edge);	
				
				//Source
				if (!array_key_exists($edge_comps[0],$node_JSON)) {
					$current_node_array = array();
					$current_node_array["id"] = $edge_comps[0];
					$current_node_array["label"] = $edge_comps[0];
					//Make sure this node has a value for all the possible node label attributes
					if (count($node_label_user_selection)>0) {
						foreach($node_label_user_selection as $node_att) {
							if (!array_key_exists($node_att, $current_node_array)) {
								$current_node_array[$node_att] = "-";
							}
						}
					}
					$node_JSON[$edge_comps[0]] = $current_node_array;
				}
				
				//Target
				if (!array_key_exists($edge_comps[2],$node_JSON)) {
					//Node doesn't exist
					$current_node_array = array();
					$current_node_array["id"] = $edge_comps[2];
					$current_node_array["label"] = $edge_comps[2];
					//Make sure this node has a value for all the possible node label attributes
					if (count($node_label_user_selection)>0) {
						foreach($node_label_user_selection as $node_att) {
							if (!array_key_exists($node_att, $current_node_array)) {
								$current_node_array[$node_att] = "-";
							}
						}
					}
					$node_JSON[$edge_comps[2]] = $current_node_array;
				}
				
				$current_edge_array = array();
				$current_edge_array["source"] = $edge_comps[0];
				$current_edge_array["target"] = $edge_comps[2];
				$current_edge_array["origin"] = "file";
				$current_edge_array["type"] = $edge_comps[1];
				$current_edge_array["directed"] = $direction;
				$edge_JSON[] = $current_edge_array;
						
				if (array_key_exists($edge_comps[1], $file_edge_counts)) {
					$file_edge_counts[$edge_comps[1]] = $file_edge_counts[$edge_comps[1]] + 1;
				} else {
					$file_edge_counts[$edge_comps[1]] = 1;
				}
			}
			$edge_counts["file"] = $file_edge_counts;
		}
		
		function getDBNodeString($nodeArray) {
			#Add single quotation marks to each node
			$resultArray = array();
			foreach ($nodeArray as $node) {
				$resultArray[] = "'" . $node . "'";
			}
			
			#Implode array with a comma
			$node_string = implode(",", $resultArray);
			return $node_string;
		}
		
		function getDBEdges($nodeArray, $SQL_FILE_NAME) {
			global $edge_JSON, $edges, $base_dir, $edge_counts, $exclude_self_ints;
			
			$db_edge_counts = array();
			
			#Work out $node_string
			$node_string = getDBNodeString(array_keys($nodeArray));
			
			#Work out $selected_edge_string
			$selected_edge_str = implode(",", $edges);
				
			if ($exclude_self_ints == "true") {
				$graph_edge_file= "$base_dir/sql/" . $SQL_FILE_NAME . "_NOSELFINTS.sql";
			} else {
				$graph_edge_file= "$base_dir/sql/" . $SQL_FILE_NAME . ".sql";
			}
			$graph_edge_query = file($graph_edge_file);
			# append specific elements
			$graph_edge_query[0] .= " ($node_string)";
			$graph_edge_query[1] .= " ($node_string)";
			$graph_edge_query[2] .= " ($selected_edge_str)";
			$graph_edge_query_string = implode("\n",$graph_edge_query);	
				
			$graph_edge_result = mysql_query($graph_edge_query_string) or die('Query failed: ' . mysql_error());
			$num_edge_results = mysql_num_rows($graph_edge_result);
				
			if ($num_edge_results > 0) {
				#Get first result row and set $current_edge
				$line = mysql_fetch_array($graph_edge_result, MYSQL_ASSOC);
				$current_edge = $line["edge"];
				$current_edge_array = array();
				$current_edge_array["source"] = $line["source"];
				$current_edge_array["target"] = $line["target"];			
				$current_edge_array["type"] = $line["type"]; 
				$current_edge_array["origin"] = "db"; 
				$edge_array=array();
				if (array_key_exists($line["type"], $db_edge_counts)) {
					$db_edge_counts[$line["type"]] = $db_edge_counts[$line["type"]] + 1;
				} else {
					$db_edge_counts[$line["type"]] = 1;
				}
				
		  		for ($i=1; $i<=$num_edge_results; $i++) {
			
					if ($current_edge != $line["edge"])	{
			
						#Add directed attribute
						if ($edge_array["directed"] == "true") {
							$current_edge_array["directed"] = true;
						} else {
							$current_edge_array["directed"] = false;
						}
						unset($edge_array["directed"]);
			
						foreach ($edge_array as $name => $value) {
							$current_edge_array[$name] = $value;
						}
						$edge_JSON[] = $current_edge_array;
			
						//reset edge array source & target
						$current_edge = $line["edge"];
						$edge_array=array();
						$current_edge_array = array();
						$current_edge_array["source"] = $line["source"];
						$current_edge_array["target"] = $line["target"];
						$current_edge_array["type"] = $line["type"];
						$current_edge_array["origin"] = "db";
						if (array_key_exists($line["type"], $db_edge_counts)) {
							$db_edge_counts[$line["type"]] = $db_edge_counts[$line["type"]] + 1;
						} else {
							$db_edge_counts[$line["type"]] = 1;
						}
					} 
					#Add row details to array
					$edge_array[$line["name"]] = $line["value"];
				
					#Get next row	
					$line = mysql_fetch_array($graph_edge_result, MYSQL_ASSOC);	
				}
		  
				#Output last row
				#Add directed attribute
				if ($edge_array["directed"] == "true") {
					$current_edge_array["directed"] = true;
				} else {
					$current_edge_array["directed"] = false;
				}
				unset($edge_array["directed"]);
				
				foreach ($edge_array as $name => $value) {
					$current_edge_array[$name] = $value;
				}
				$edge_JSON[] = $current_edge_array;
	
				mysql_free_result($graph_edge_result);
			}
			if (count($db_edge_counts)>0) {
				$edge_counts["db"] = $db_edge_counts;
			}
		}
		
		function dbNodeAttSearch($nodeArray) {
		
			global $node_JSON, $edge_JSON, $base_dir, $db_node_label_priority, $node_label_user_selection;
			
			if (count($nodeArray)>0) {
		
				#Work out node string for searching
				$node_string = getDBNodeString(array_keys($nodeArray));
					
				#Now get nodes
				$graph_node_file = "$base_dir/sql/NODE_ATTRIBUTES.sql";	
				$graph_node_query = file($graph_node_file);
				# append specific elements
				$graph_node_query[0] .= " ($node_string)";
				$graph_node_query_string = implode("\n",$graph_node_query);
					
				$graph_node_result = mysql_query($graph_node_query_string) or die('Query failed: ' . mysql_error());
					
				# Add nodes
				$last_gene = "ZZZZZZZZZZZ";
				$first_gene = 1;
				$this_gene = "";
				$gene_attributes = array(  );
				while ($line = mysql_fetch_array($graph_node_result, MYSQL_ASSOC)) {
					$this_gene = $line["node"];
						
					if ($this_gene != $last_gene) {
						# we are starting a new gene
						if ($first_gene == 0) {
							# we have already done one previously - add it to the node result
							$current_node_array = array();
							
							if (isset($gene_attributes)) {
								foreach ($gene_attributes as $attribute_name => &$attribute_value) {
									$current_node_array[$attribute_name] = $attribute_value;
								}
								unset ($attribute_name, $attribute_value);
								unset ($gene_attributes);
							} 
							if (array_key_exists($last_gene,$node_JSON)) {
								$node_JSON[$last_gene] = array_merge($node_JSON[$last_gene],$current_node_array);
							} else {
								$current_node_array["id"] = $last_gene;
								$node_JSON[$last_gene] = $current_node_array;
							}
							
							//SET LABEL
							$i = 0;
							$cont = true;
							do {
								if (array_key_exists($db_node_label_priority[$i],$node_JSON[$last_gene])) {
									$node_JSON[$last_gene]["label"] = $node_JSON[$last_gene][$db_node_label_priority[$i]];
									$cont = false;
								} else {
									$i = $i + 1;
								}
							} while ($cont);
							
							if (count($node_label_user_selection)>0) {
								foreach($node_label_user_selection as $node_att) {
									if (!array_key_exists($node_att, $node_JSON[$last_gene])) {
										$node_JSON[$last_gene][$node_att] = "-";
									}
								}
							}
						}
					} 
					$first_gene = 0;
					if ($line["attribute_name"] != NULL) {
						$gene_attributes[$line["attribute_name"]] = $line["attribute_value"];
					}
					$last_gene = $this_gene;
				}
			  
				# finish off the last one
				if ($first_gene == 0) {
		  
					# we have already done one previously - add it to the node result
					$current_node_array = array();
					
					foreach ($gene_attributes as $attribute_name => &$attribute_value) {
						$current_node_array[$attribute_name] = $attribute_value;
					}
					if (array_key_exists($last_gene,$node_JSON)) {
						$node_JSON[$last_gene] = array_merge($node_JSON[$last_gene],$current_node_array);
					} else {
						$current_node_array["id"] = $last_gene;
						$node_JSON[$last_gene] = $current_node_array;
					}
					
					//SET LABEL
					$i = 0;
					$cont = true;
					do {
						if (array_key_exists($db_node_label_priority[$i],$node_JSON[$last_gene])) {
							$node_JSON[$last_gene]["label"] = $node_JSON[$last_gene][$db_node_label_priority[$i]];
							$cont = false;
						} else {
							$i = $i + 1;
						}
					} while ($cont);
					
					if (count($node_label_user_selection)>0) {
						foreach($node_label_user_selection as $node_att) {
							if (!array_key_exists($node_att, $node_JSON[$last_gene])) {
								$node_JSON[$last_gene][$node_att] = "-";
							}
						}
					}
					
					unset ($attribute_name, $attribute_value);
					unset ($gene_attributes);
				}
			} 
		}
		
		function markOfInterestNodes() {
		
			global $genes_of_interest, $node_JSON;
			
			#Mark as of_interest all the nodes in $genes_of_interest array
				foreach ($genes_of_interest as $name => $value) {
				if (array_key_exists($name, $node_JSON)) {
					#Add of_interest here attribute
					$node_JSON[$name]["of_interest_here"] = "1";
				}
			}	
		
		}
		
		function getDBResultNodes($searchType, $node_string, $selected_edge_str) {
	
			global $base_dir, $exclude_self_ints;
		
			#Three possible types:
			#EDGES_DEPTH0_HIDEUNCONNECTED
			#EDGES_DEPTH1_SHOWUNCONNECTED
			#EDGES_DEPTH1_HIDEUNCONNECTED
			
			$dbResultNodes = array();
			if ($node_string != "" && $selected_edge_str != "") {
			
				switch ($searchType) {
					
					case "EDGES_DEPTH0_HIDEUNCONNECTED":
						if ($exclude_self_ints == "true") { 
							$sql_file = "$base_dir/sql/EDGES_DEPTH0_HIDEUNCONNECTED_NOSELFINTS.sql";
						} else {
							$sql_file = "$base_dir/sql/EDGES_DEPTH0_HIDEUNCONNECTED.sql";
						}
						$query = file($sql_file);
						# append specific elements
						$query[0] .= " ($node_string)";
						$query[1] .= " ($node_string)";
						$query[2] .= " ($selected_edge_str)";
						$query[3] .= " ($node_string)";
						$query[4] .= " ($node_string)";
						$query[5] .= " ($selected_edge_str)";
						break;
						
					case "EDGES_DEPTH1_SHOWUNCONNECTED":
						if ($exclude_self_ints == "true") { 
							$sql_file = "$base_dir/sql/EDGES_DEPTH1_SHOWUNCONNECTED_NOSELFINTS.sql";
						} else {
							$sql_file = "$base_dir/sql/EDGES_DEPTH1_SHOWUNCONNECTED.sql";	
						}
						$query = file($sql_file);
						# append specific elements
						$query[0] .= " ($node_string)";
						$query[1] .= " ($node_string)";
						$query[2] .= " ($node_string)";
						$query[3] .= " ($selected_edge_str)";
						$query[4] .= " ($node_string)";
						$query[5] .= " ($node_string)";
						$query[6] .= " ($selected_edge_str)";
						break;
						
					case "EDGES_DEPTH1_HIDEUNCONNECTED":
						if ($exclude_self_ints == "true") { 
							$sql_file = "$base_dir/sql/EDGES_DEPTH1_HIDEUNCONNECTED_NOSELFINTS.sql";
						} else {
							$sql_file = "$base_dir/sql/EDGES_DEPTH1_HIDEUNCONNECTED.sql";	
						}
						$query = file($sql_file);
						# append specific elements
						$query[0] .= " ($node_string)";
						$query[1] .= " ($node_string)";
						$query[2] .= " ($selected_edge_str)";
						$query[3] .= " ($node_string)";
						$query[4] .= " ($node_string)";
						$query[5] .= " ($selected_edge_str)";
						break;
				}
				$node_query_string = "";
				$node_query_string = implode("\n",$query);
				
				$graph_node_result = mysql_query($node_query_string) or die('Query failed: ' . mysql_error());
				$num_of_db_nodes = mysql_num_rows($graph_node_result);
				
				if ($num_of_db_nodes > 0) {
					while ($line = mysql_fetch_array($graph_node_result, MYSQL_ASSOC)) {
						$dbResultNodes[$line["node_name"]] = "";
					}
					mysql_free_result($graph_node_result);
				}
			}
			return $dbResultNodes;
		}
		
		function getNodeList() {
		
			global $base_dir, $genes_of_interest, $db_search_attributes;
			
			$node_string = getDBNodeString(array_keys($genes_of_interest));
			
			$sql_file = "$base_dir/sql/CONVERT_NODES.sql";
			$query = file($sql_file);
			# append specific elements
			$query[0] .= " ($node_string)";
			$query[1] .= " ($db_search_attributes)";
			
			$node_query_string = implode("\n",$query);
			$graph_node_result = mysql_query($node_query_string) or die('Query failed: ' . mysql_error());
			$num = mysql_num_rows($graph_node_result);
			
			if ($num > 0) {
				while ($line = mysql_fetch_array($graph_node_result, MYSQL_ASSOC)) {
					$genes_of_interest[strtoupper($line["attribute_value"])][] = strtoupper($line["node"]);
				}	
			}
			mysql_free_result($graph_node_result);
			
			$new_genes_of_interest = array();
			foreach ($genes_of_interest as $name => $value) {
				if (count($value)==0) {
					//Add original
					$new_genes_of_interest[$name] = "";
				} else {
					//Add all results
					foreach($value as $res) {
						$new_genes_of_interest[$res] = "";	
					}
				}
			}
			$genes_of_interest = $new_genes_of_interest;
		}
	
		#=================================================================================================================================
		
		#Add all nodes and edges in any files to JSON result. Only add edge nodes if 'hide unconnected nodes' is checked
		#Add all file nodes to genes of interest array
		if ($edge_file != "") {
			processFileText();
		}
		#Add all genes in text area to genes of interest array
		if ($gene_text != "") {
			processGeneText();
		}
		
		#Check that some options are selected for searching (HACK TO STOP ERROR APPEARING IF USER DESELECTS EVERYTHING)
		$cont = true;
		if ($search_biogrid == "true") {
		 	if (count($bg_addIdsArray) < 1) {
		 		$cont = false;
		 	}
		}
		if ($db_enabled == "true") {
			if (count($db_search_attributes_array) < 1) {
		 		$cont = false;
		 	}
		}
			
		#ONLY CONTINUE IF SOME GENES OF INTEREST WERE FOUND
		if ((count($genes_of_interest) > 0) AND ($cont==true)) {
		
			if ($db_enabled == "true") {
			
				#Connect to database
				$link = mysql_connect($db_server, $db_user, $db_pass) or die('Could not connect: ' . mysql_error());
				mysql_select_db($db_instance) or die('Could not select database');
				
				//SEARCH DB AND UPDATE GENES OF INTEREST
				getNodeList();
				
				if (count($genes_of_interest) > 0) { 
				
					if ($search_mode == "depth0") {
					
						//Get BioGRID edges and nodes
						if ($search_biogrid == "true") {
							getBioGridNodesAndEdgesDB($genes_of_interest, "depth0", $bg_addIds, $biogrid_ID_identifier);
						}
						
						if ($hide_unconnected_nodes == "false") {
							
							#Add DB edges to JSON result (search using all genes in genes of interest array)
							if (isset($edges[0])) {
								getDBEdges($genes_of_interest, "RETRIEVE_DB_EDGES");
							}
							//Add in any file edges and nodes from file not found in BioGRID or DB
							if (count($edge_file_keeps)>0) {
								addFileEdgesDB();
							}
							dbNodeAttSearch($genes_of_interest);
							markOfInterestNodes();
						
						} else if ($hide_unconnected_nodes == "true") {
							
							$db_result_nodes = array();
							if (isset($edges[0])) {
							
								$node_string = getDBNodeString(array_keys($genes_of_interest));
								$selected_edge_str = implode(",", $edges);
								$db_result_nodes = getDBResultNodes("EDGES_DEPTH0_HIDEUNCONNECTED", $node_string, $selected_edge_str);
								
								if (count($db_result_nodes) > 0) {
									getDBEdges($genes_of_interest, "RETRIEVE_DB_EDGES");
								}
							}
							//Add in any file edges and nodes not found in BioGRID
							if (count($edge_file_keeps)>0) {
								addFileEdgesDB();
							}
							dbNodeAttSearch(array_merge($db_result_nodes,$node_JSON));
							markOfInterestNodes();
						}
						
					} else if ($search_mode == "depth1_basic") {
					#DEPTH 1 BASIC	
					
						if (isset($edges[0])) {
						
							#Add BioGRID nodes and edges to JSON result (search using all genes in genes of interest array)
							if ($search_biogrid == "true") {
								getBioGridNodesAndEdgesDB($genes_of_interest, "depth1_basic", $bg_addIds, $biogrid_ID_identifier);
							}
							
							$node_string = getDBNodeString(array_keys($genes_of_interest));
							$selected_edge_str = implode(",", $edges);
							$db_result_nodes = array();
							
							//Get db edges
							getDBEdges($genes_of_interest, "RETRIEVE_DB_EDGES_D1_BASIC");
							
							if ($hide_unconnected_nodes == "true") {
								$db_result_nodes = getDBResultNodes("EDGES_DEPTH1_HIDEUNCONNECTED", $node_string, $selected_edge_str);
							} else if ($hide_unconnected_nodes == "false") {
								$db_result_nodes = getDBResultNodes("EDGES_DEPTH1_SHOWUNCONNECTED", $node_string, $selected_edge_str);
							}
							//Add in any file edges and nodes not found in BioGRID
							if (count($edge_file_keeps)>0) {
								addFileEdgesDB();
							}
							dbNodeAttSearch(array_merge($db_result_nodes,$node_JSON));
							markOfInterestNodes();
						
						} else {
							#No database edges selected so just search biogrid for edges 
							
							if ($search_biogrid == "true") {
								getBioGridNodesAndEdgesDB($genes_of_interest, "depth1_basic", $bg_addIds, $biogrid_ID_identifier);
							}
							if (count($edge_file_keeps)>0) {
								addFileEdgesDB();
							}
							if ($hide_unconnected_nodes == "false") {
								dbNodeAttSearch(array_merge($genes_of_interest,$node_JSON));
							} else {
								dbNodeAttSearch($node_JSON);
							}
							markOfInterestNodes();
						}
					
					} else if ($search_mode == "depth1_extended") { 
						
						if (isset($edges[0])) {
						
							$depthOneNodes = array();
 							
 							#Get DEPTH1 nodes from BioGrid
 							if ($search_biogrid == "true") {
 								$depthOneNodes = BioGridDepthOneNodes($genes_of_interest, $bg_addIds, $biogrid_ID_identifier);
 							}
 					
 							$db_result_nodes = array();
 						
 							#SHOW UNCONNECTED NODES
							if ($hide_unconnected_nodes == "false") {
								
								#Get DEPTH 1 DB nodes (+ unconnected nodes)
								$node_string = getDBNodeString(array_keys($genes_of_interest));
								$selected_edge_str = implode(",", $edges);
								$db_result_nodes = getDBResultNodes("EDGES_DEPTH1_SHOWUNCONNECTED", $node_string, $selected_edge_str);
							
							} else {
								#HIDE UNCONNECTED NODES
								
								#Get DEPTH 1 DB nodes (no unconnected nodes)
								$node_string = getDBNodeString(array_keys($genes_of_interest));
								$selected_edge_str = implode(",", $edges);
								$db_result_nodes = getDBResultNodes("EDGES_DEPTH1_HIDEUNCONNECTED", $node_string, $selected_edge_str);
							}
						
							$combinedNodes = array();
							$combinedNodes = array_merge($db_result_nodes, $depthOneNodes);
						
							#Only continue if $combinedNodes is not empty
							if (count($combinedNodes) > 0) {
								#Add BioGRID edges
								if ($search_biogrid == "true") {
									getBioGridNodesAndEdgesDB($combinedNodes, "depth0", $bg_addIds, $biogrid_ID_identifier);
								}
									
								#Add DB edges
								getDBEdges($combinedNodes, "RETRIEVE_DB_EDGES");
							}
							
							if (count($edge_file_keeps)>0) {
								addFileEdgesDB();
							}
								
							$combinedNodes = array_merge($combinedNodes, $node_JSON);
							
							if (count($combinedNodes) > 0) {
								#Do node attribute search
								dbNodeAttSearch($combinedNodes);
							}
							
							markOfInterestNodes();
						
						} else {
							
							if ($search_biogrid == "true") {
								$depthOneNodes = BioGridDepthOneNodes($genes_of_interest, $bg_addIds, $biogrid_ID_identifier);
								if (count($depthOneNodes)>0) {
								getBioGridNodesAndEdgesDB($depthOneNodes, "depth0", $bg_addIds, $biogrid_ID_identifier);
								}
							}
							
							if (count($edge_file_keeps)>0) {
								addFileEdgesDB();
							}
							
							if ($hide_unconnected_nodes == "false") {
								dbNodeAttSearch(array_merge($genes_of_interest,$node_JSON));
							} else {
								dbNodeAttSearch($node_JSON);
							}
							markOfInterestNodes();
						}
					}
				}
				mysql_close($link);
			
			} else {
				
				//NO DB ENABLED
				if ($search_biogrid == "true") {
				
					if ($search_mode == 'depth0') {
						getBioGridNodesAndEdges($genes_of_interest, 'depth0', $bg_addIds, $biogrid_ID_identifier);
					} else if ($search_mode == 'depth1_basic') {
						getBioGridNodesAndEdges($genes_of_interest, 'depth1_basic', $bg_addIds, $biogrid_ID_identifier);
					} else if ($search_mode == 'depth1_extended') {
						$depthOneNodes = BioGridDepthOneNodes($genes_of_interest, $bg_addIds, $biogrid_ID_identifier);
						if (count($depthOneNodes) > 0) {
							getBioGridNodesAndEdges($depthOneNodes, 'depth0', "BIOGRID", $biogrid_ID_identifier);
						}
					}
				}
				
				//Add in any file edges and nodes not found in BioGRID
				if (count($edge_file_keeps)>0) {
					addFileEdges();
				}
				
				if ($hide_unconnected_nodes == "false") {
					addNodes();	
				}
			}
		}
		echo json_encode(array('edges_json' => $edge_JSON, 'nodes_json' => array_values($node_JSON), 'edge_counts' => $edge_counts, 'genes_of_interest' => $genes_of_interest));
	}
?>