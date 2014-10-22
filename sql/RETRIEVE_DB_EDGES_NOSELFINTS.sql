SELECT e.edge edge, e.from_node source, e.to_node target, e.type type, a.attribute_name name, a.attribute_value value FROM graph_edge e INNER JOIN graph_edge_attribute_value a ON e.edge = a.edge WHERE (e.from_node <> e.to_node AND e.from_node IN 
AND e.to_node IN 
AND e.type IN 
) order by e.edge;