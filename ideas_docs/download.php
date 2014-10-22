<?php
	session_start();
	if (isset($_SESSION['username']) && isset($_POST['data'])) {
		#Get data
		$data = $_POST['data'];
		
		#Set filename and content_type if specified (else use text/plain and result_file.txt)
		if (isset($_POST['filename']) ) { 
			$filename = $_POST['filename']; 
		} else {
			$filename = "result_file.txt";	
		}
		
		if (isset($_POST['content_type']) ) { 
			$content_type = $_POST['content_type']; 
		} else {
			$content_type = "text/plain";	
		}
	
		header('Content-type:' . $content_type);
	
		#To force the browser to download the file:
		header('Content-disposition: attachment; filename="' . $filename . '"');
		
		#Send the data to the browser:
		print $data;
	}
?>