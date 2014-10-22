SELECT node node_name FROM graph_node WHERE node IN
UNION SELECT from_node node_name FROM graph_edge WHERE (graph_edge.to_node<>graph_edge.from_node) AND (graph_edge.to_node IN
OR graph_edge.from_node IN
) AND graph_edge.type IN
UNION SELECT to_node node_name FROM graph_edge WHERE (graph_edge.to_node<>graph_edge.from_node) AND (graph_edge.to_node IN
OR graph_edge.from_node IN
) AND graph_edge.type IN
ORDER BY node_name;