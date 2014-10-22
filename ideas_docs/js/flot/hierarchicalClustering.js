//Version: 0.21 (20140414)
//Version: 0.2 (20140409)
//Version: 0.1 (20140123)

function hierarchicalClustering(nodeData,experiment,condition)
{
    return hierarchicalClustering(nodeData,experiment,condition,null);
}

function hierarchicalClustering(nodeData,experiment,condition,clusterOptions)
{
    //ignore cluster options for the time being
    //get all data for experiment/condition
    var nodeNames = getNames(nodeData);
    var numObs = experiment.observations.length;
    var reps = experiment.replicates;    
    var condData = new Array(nodeNames.length);
    for(var x = 0;x<condData.length;x++)
    {
        condData[x] = new Array(numObs * reps);
        if(nodeData[nodeNames[x].toUpperCase()].experiments.hasOwnProperty(experiment.name.toUpperCase()))
        {
            var e = nodeData[nodeNames[x].toUpperCase()].experiments[experiment.name.toUpperCase()];
            if(e.conditions.hasOwnProperty(condition.toUpperCase()))
            {
                var d = e.conditions[condition.toUpperCase()].data;
                for(var z=0;z<d.length;z++)
                    condData[x][z] = d[z];
            }
        }
    }
    
    if(reps > 1)
        condData = combineReplicates(condData,numObs,reps);
    if(experiment.allowNormalisation)
        //normalise
        condData = normalisation(condData);
    
    var distances = computeDistance(condData,'euclidean');
    var root = hierarchicalClusteringMain(distances,'single');
    var orderingIndex = orderClustering(root,0);
    var ordering = new Array(nodeNames.length);
    for(var x=0;x<nodeNames.length;x++)
        ordering[x] = nodeNames[orderingIndex[x]];
    return ordering;
}

function getNames(nodes)
{
    var names = [];
    for(var x in nodes)
        if(nodes.hasOwnProperty(x))
            names.push(nodes[x].ID);
            
    return names;
}

function computeDistance(nodeData,distanceMeasure)
{
    //check the distanceMeasure is valid
    var distMeasures = ["euclidean"];
    
    //NOTE this doesnt seem to be catching erroneous values
    if( distMeasures[distanceMeasure] == "undefined" )
    {
        //invlaid distance measure, default to euclidean
        distanceMeasure = "euclidean";
    }
    
    
    var nodeNum = nodeData.length;
    var tp = nodeData[0].length;
        
    var dist = new Array(nodeNum);
    for(var x=0;x<nodeNum;x++)
    {
        dist[x] = new Array(nodeNum);
    }
    
    //euclidean
    if( distanceMeasure == distMeasures[0])
    {
        for(var x=0;x<nodeNum;x++)
        {
            dist[x][x] = 0;
            for(var y=(x+1);y<nodeNum;y++)
            {
                var error = 0;
                for(var z=0;z<tp;z++)
                    if( !isNaN(parseFloat(nodeData[x][z])) && !isNaN(parseFloat(nodeData[y][z])) )
                        error = error + Math.pow(nodeData[x][z] - nodeData[y][z],2);
                
                dist[x][y] = Math.sqrt(error);
                dist[y][x] = dist[x][y];
            }
        }
    }
    return dist;
}



//Hierarchical clustering code adapted from:
// http://code.google.com/p/figue/source/browse/trunk/figue.js

function Node(index,left,right)
{
    this.index = index;
    this.left = left;
    this.right = right;
    this.hasLeft = true;
    this.hasRight = true;
    if(left == null)
        this.hasLeft = false;
    if(right == null)
        this.hasRight = false;
    if(this.hasLeft && this.hasRight)
        this.isLeaf = false;
    else
        this.isLeaf = true;
}

function orderClustering(node,depth)
{
    if(node.isLeaf)
        return [node.index];
    else
    {
        if(depth < 1000)
        {
            var leftIndex = [];
            var rightIndex = [];
            if(node.hasLeft)
                leftIndex = orderClustering(node.left,depth+1);
            if(node.hasRight)
                rightIndex = orderClustering(node.right,depth+1);
            var currIndex = new Array(leftIndex.length + rightIndex.length);
            for(var x=0;x<leftIndex.length;x++)
                currIndex[x] = leftIndex[x];
            for(var x=0;x<rightIndex.length;x++)
                currIndex[x+leftIndex.length] = rightIndex[x];
            return currIndex;
        }
        return [];
    }
}


function hierarchicalClusteringMain(distances,linkage)
{
    //first need to make self distance to Infinity
    var numNodes = distances.length;
    
    for(var x=0;x<numNodes;x++)
        distances[x][x] = Infinity;

    //find the smallest distance index for each entry
    var dMin = new Array(numNodes);
    for(var x=0;x<numNodes;x++)
    {
        dMin[x] = 0;
        //console.log(distances[x][dMin[x]]);
        for(var y=0;y<numNodes;y++)
            if(distances[x][dMin[x]] > distances[x][y])
                dMin[x] = y;
    }
    var clusters = new Array(numNodes);
    var clusterSize = new Array(numNodes);
    for(var x=0;x<numNodes;x++)
    {
        clusters[x] = [];
        clusters[x][0] = new Node(x,null,null);
        clusterSize[x] = 1;
    }
    
    var root;
    for(var z=0;z<(numNodes-1);z++)
    {
        c1 = 0;
        //find smallest distance
        for(var x=0;x<numNodes;x++)
            if(distances[x][dMin[x]] < distances[c1][dMin[c1]])
                c1 = x;
        c2 = dMin[c1];
        
        c1Cluster = clusters[c1][0];
        c2Cluster = clusters[c2][0];
        
        newCluster = new Node(-1,c1Cluster,c2Cluster);
        clusters[c1].splice(0,0,newCluster);
        clusterSize[c1] += clusterSize[c2];
        
        for(var x=0;x<numNodes;x++)
        {
            if(linkage == 'single')
            {
                //single linkage - take the smallest value of the pair
                if(distances[c1][x] > distances[c2][x])
                {
                    distances[c1][x] = distances[c2][x];
                    distances[x][c2] = distances[c2][x];
                }
            }
            else if(linkage == 'complete')
            {
                //single linkage - take the largest value of the pair
                if(distances[c1][x] < distances[c2][x])
                {
                    distances[c1][x] = distances[c2][x];
                    distances[x][c2] = distances[c2][x];
                }
            }
            else
            {
                //default to single linkage
                
                //single linkage - take the smallest value of the pair
                if(distances[c1][x] > distances[c2][x])
                {
                    distances[c1][x] = distances[c2][x];
                    distances[x][c2] = distances[c2][x];
                }
            }
        }
        distances[c1][c1] = Infinity;
        
        //remove c2 distance entries
        for(var x=0;x<numNodes;x++)
        {
            distances[c2][x] = Infinity;
            distances[x][c2] = Infinity;
        }
        
        //replace c2 dMin instances with c1
        for(var x=0;x<numNodes;x++)
        {
            if(dMin[x] == c2)
                dMin[x] = c1;
            if(distances[c1][x] < distances[c1][dMin[c1]])
                dMin[c1] = x;
        }
        root = newCluster;
    }
    return root;
}