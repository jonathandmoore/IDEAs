IDEAs
=====

Interactions, Domains, Experiments and Annotations browser

The purpose of the software is to allow a complex network of relationships to be searched for 'neighborhoods of interest', and then for data about these neighborhoods to be visualised.

This software implements a website to allow search and navigation of a graph of connections between items. The graph of network relationships can be submitted to the browser in a file, stored in a MySQL database, or retrieved from a webservice (BioGrid is currently implemented), or any of all of the above.

When a query for nodes of interest is submitted to the website, the above sources are searched for network neighbours of the nodes of interest.  The resulting subgraph is then visualised as a network of related nodes.

On clicking on one or more nodes, plots of case-control or timeseries data associated with selected nodes, with or without replicates, can be visualised as barcharts, timeseries or heatmaps.

The software was created to allow for search among relationships between genes, and to visualise gene expresion data, but is very flexible and can be used in any context where a set of related nodes is available, and a set of information about each node.

The software depends on a webserver which supports PHP.
