//Version: 0.1 (20140123)

function mergeNodeData(newNodeData,mergedNodeData)
{
    //add all of newNodeData data into  mergedNodeData        
    var first = true;
    for(var x in newNodeData)
    {
        //check if we have a node with the same ID as x
        if(mergedNodeData[x] != null && mergedNodeData[x] != 'undefined')
        {
            //we have node data to merge
            var newData = newNodeData[x];
            var origData = mergedNodeData[x];
            
            //this isnt copying the user attributes, do that now
            for(var key in newData)
                if(newData.hasOwnProperty(key) && !origData.hasOwnProperty(key))
                    origData[key] = newData[key];
            
            for(var y in newData.experiments)
            {
                //experiment data
                if(newData.experiments.hasOwnProperty(y) && !origData.experiments.hasOwnProperty(y))
                    origData.experiments[y] = newData.experiments[y];
                else
                {
                    //check to see if there are any attributes to copy from experiment and condition
                    for(var expKey in newData.experiments[y])
                        if(newData.experiments[y].hasOwnProperty(expKey) && !origData.experiments[y].hasOwnProperty(expKey))
                            origData.experiments[y][expKey] = newData.experiments[y][expKey];
                    //each condition
                    for(var z in newData.experiments[y].conditions)
                        if(newData.experiments[y].conditions.hasOwnProperty(z) && !origData.experiments[y].conditions.hasOwnProperty(z))
                            origData.experiments[y].conditions[z] = newData.experiments[y].conditions[z];
                        else
                            for(var condKey in newData.experiments[y].conditions[z])
                                if(newData.experiments[y].conditions[z].hasOwnProperty(condKey) && !origData.experiments[y].conditions[z].hasOwnProperty(condKey))
                                    origData.experiments[y].conditions[z][condKey] = newData.experiments[y].conditions[z][condKey];
                }    
            }
        }
        else
            //we dont have the node, so add it
            mergedNodeData[x] = newNodeData[x];
        first = false;
    }
    
    /*
    //add experiment info to mergedNodeData
    var origExpNames = getExpNames(mergedNodeData.experimentInfo);
    for(var x=0;x<newNodeData.experimentInfo.length;x++)
        if(origExpNames[x] == null || origExpNames[x] == 'undefined')
            mergedNodeData.experimentInfo.push(newNodeData.experimentInfo[x]);
    */
    
    return mergedNodeData;
}

function getExperimentNames(experiments)
{
    var expNames = {};
    for(var x in experiments)
        expNames[x];
    return expNames;
}