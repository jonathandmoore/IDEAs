//Version: 0.2 (20140217)
//Version: 0.1 (20140123)

function combineReplicates(data,timepoints,replicates)
{
    if($.isArray(data[0]))
    {
        var numNodes = data.length;
        
        //simply average over the replicates
        allCombData = new Array(numNodes);
        for(var x=0;x<numNodes;x++)
            allCombData[x] = combine(data[x],timepoints,replicates);
        return allCombData;
    }
    else
        return combine(data,timepoints,replicates);
}

function combine(data,timepoints,replicates)
{
    var conditions = data.length / (timepoints * replicates);
    var combData = new Array(timepoints * conditions);
    for(var x=0;x<conditions;x++)
    {
        var offset = x*timepoints*replicates;
        
        for(var z=0;z<timepoints;z++)
        {
            var repsUsed = 0;
            var comb = 0;
            for(var y=0;y<replicates;y++)
                if(!isNaN(data[(y*timepoints)+z+offset]))
                {
                    repsUsed++;
                    comb += data[(y*timepoints)+z+offset]
                }
            combData[z+x*timepoints] = comb/repsUsed;
        }
    }
    return combData;
}