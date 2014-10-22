//Version: 0.12 (20140415)
//Version: 0.11 (20140213)
//Version: 0.1 (20140123)

function loadExperimentsFromTable(rawData,delimiter,allowNormalisation,divID)
{   
    //FOR DEBUG
    var textDiv = $('#'+divID);
    
    //OK we have a big string loaded in witht the expression data, need to parse it
    //var lines = rawData.trim().split("\r"); //we need to check the EOL char
    var lines = rawData.trim().replace(/(\r\n|\n)/gm,"\r").split("\r"); //we need to check the EOL char
    var headerLine = lines[0];
    
    //get headers, but ignore first, as it is gene name
    var headers = headerLine.substring(headerLine.trim().indexOf(delimiter)+1).trim().split(delimiter);
    
    var nodeNames = new Array(lines.length-1);
    var data = new Array(lines.length-1);
      
    
    //check to see if the first column header has the correct number of '_' parts (3 for no reps, 4 with reps)
    var numParts = 1;
    var label = headers[0];
    while(label.indexOf('_') >= 0)
    {
        numParts++;
        label = label.substring(label.indexOf('_')+1);
    }
    
    for(var x = 1;x<lines.length;x++)
    {
        var currLine = lines[x];
        nodeNames[x-1] = currLine.trim().substring(0,currLine.trim().indexOf(delimiter));
        data[x-1] = currLine.substring(currLine.trim().indexOf(delimiter)+1).trim().split(delimiter);
        for(var y = 0;y<data[x-1].length;y++)
            data[x-1][y] = parseFloat(data[x-1][y]);
    }
    
    //if we have 3 components, we dont have replicates
    //4 if we have replicates
    var hasReps = numParts == 4;
    
    //now need to split into experiment, treatment, sample (rep)
    //First find the experiments
    var expNames = {};
    for(var x = 0;x<headers.length;x++)
    {
        var expName = headers[x].substring(0,headers[x].trim().indexOf('_'));
        if( !(expName in expNames))
        {
            //we dont have the experiment, so create a new entry
            expNames[expName] = {};
        }
    }
    
    //now find treatments for each experiment
    for(var x in expNames)
    {
        var condNames = {};
        var condOrder = [];
        for(var y=0;y<headers.length;y++)
        {
            //if we have the experiment
            if( headers[y].substring(0,headers[y].trim().indexOf('_')) == x)
            {
                var rest = headers[y].substring(headers[y].trim().indexOf('_')+1);
                var condName = rest.substring(0,rest.trim().indexOf('_'));
                if( !(condName in condNames))
                {
                    //we dont have the condition, so create a new entry
                    condNames[condName] = {};
                    condOrder.push(condName);
                }
            }   
        }
        expNames[x].conditions = condNames;
        expNames[x].conditionsArray = condOrder;  
    }
    
    //ok we now have experiments and condition names within each now get labels
    experiments = [];
    for(var x in expNames)
    {
        //textDiv.append('<p>Experiment: '+x+'</p>');
        var maxReps = 0;
        var labels = {};
        for(var y in expNames[x].conditions)
        {
            var currStr = x+'_'+y+'_';
            var len = currStr.length;
            //textDiv.append('Condition: '+y+' length: '+len+'<br>');
            for(var z=0;z<headers.length;z++)
                if(headers[z].indexOf(currStr)>=0)
                {
                    var label = headers[z].substring(len);
                    if(hasReps)
                        label = label.substring(0,label.indexOf('_'));
                    if( !(label in labels))
                    {
                        //new label so create an entry
                        labels[label] = 1;
                    }
                    else
                        labels[label] = labels[label] + 1;
                }
            
            //iterate over the labels and the number of replicates
            for(var z in labels)
            {
                //textDiv.append('Label: '+z+' replicates: '+labels[z]+'<br>');
                if(labels[z] > maxReps)
                    maxReps = labels[z];
                labels[z] = 0;  //reset for next condition
            }
        }
        var labelStr = new Array(size(labels));
        var c = 0;
        var isTimeSeries = true;
        for(var z in labels)
        {
            labelStr[c] = z;
            c++;
            
            //if( isNaN(parseFloat(z)) )
            if( !isFinite(z) )
                isTimeSeries = false;
        }
        
        var ts = new Array(size(labels));
        if(isTimeSeries)
        {
            var c = 0;
            for(var z in labels)
            {
                ts[c] = parseFloat(z);
                c++;
            }
            
            var tsSort = new Array(ts.length);
            for(var z=0;z<ts.length;z++)
            {
                var temp = Infinity;
                var idx = -1;
                for(var y=0;y<ts.length;y++)
                {
                    if(ts[y] < temp)
                    {
                        temp = ts[y];
                        idx = y;
                    }
                }
                tsSort[z] = temp;
                ts[idx] = Infinity;
            }
            
            labels = new Array(ts.length);
            for(var z=0;z<tsSort.length;z++)
                labels[z] = ''+tsSort[z];
        }
        expNames[x].labels = labelStr;
        expNames[x].ts = tsSort;
        expNames[x].isTimeSeries = isTimeSeries;
        expNames[x].replicates = maxReps;
    }
    
    var nodeData = new Object();
    
    for(var x=0;x<nodeNames.length;x++)
    {
        var node = {};
        node.ID = nodeNames[x];
        var nodeExps = {};
        for(var y in expNames)
        {
            var currExp = {};
            currExp.name = y;
            if(expNames[y].isTimeSeries)
                currExp.observations = expNames[y].ts;
            else
                currExp.observations = expNames[y].labels;
            currExp.isTimeSeries = expNames[y].isTimeSeries;
            currExp.observationUnits = '';
            currExp.dataUnits = '';
            currExp.replicates = expNames[y].replicates;
            currExp.allowNormalisation = allowNormalisation;
            
            var conds = {};
            for(var z in expNames[y].conditions)
            {
                var currCond = {};
                currCond.name = z;
                var cData = new Array(currExp.observations.length*currExp.replicates);
                var baseStr = y+'_'+z;
                var dataIdx;
                for(var n=0;n<currExp.observations.length;n++)
                {
                    var addStr = '_'+currExp.observations[n];
                    if(currExp.replicates == 1)
                    {
                        dataIdx = n;
                        idx = findIndex(baseStr+addStr,headers);
                        cData[dataIdx] = data[x][idx];
                    }
                    else
                        for(var m=1;m<=currExp.replicates;m++)
                        {
                            dataIdx = (m-1)*currExp.observations.length+n;
                            idx = findIndex(baseStr+addStr+'_'+m,headers);                            
                            cData[dataIdx] = data[x][idx];
                        }
                }
                currCond.data = cData;
                conds[z.toUpperCase()] = currCond;
            }
            currExp.conditions = conds;
            
            nodeExps[y.toUpperCase()] = currExp;
        }
        node.experiments = nodeExps;
        nodeData[nodeNames[x].toUpperCase()] = node;
    }
    
    var allData = {};
    allData.nodeData = nodeData;
    
    var expInfo = {};
    for(var x in expNames)
    {
        var cExp = {};
        cExp.name = x;
        var cName = [];
        var cNames = {};
        for(var y in expNames[x].conditions)
        {
            cName.push(y);
            cNames[y.toUpperCase()] = {};
        }
        cExp.conditionsArray = cName;
        cExp.conditions = cNames;
        if(expNames[x].isTimeSeries)
            cExp.observations = expNames[x].ts;
        else
            cExp.observations = expNames[x].labels;
        cExp.isTimeSeries = expNames[x].isTimeSeries;
        cExp.replicates = expNames[x].replicates;
        cExp.allowNormalisation = allowNormalisation;
        
        expInfo[x.toUpperCase()] = cExp;
    }
    allData.experimentInfo = expInfo;
    allData.nodeAttributeInfo = {};
    return allData;
    /*
        //textDiv.append('<p>Experiment: '+x+' has '+size(expNames[x].conditions)+' conditions with '+size(labels)+' samples and max of '+maxReps+' replicates</p>');
        
        //now we want to create the 'experiment' object, containing labels,replicates and gene names along with individual conditions and data
        experiment = {};
        experiment["name"] = x;
        //experiment["timepoints"] = labels.length;
        experiment["observations"] = labels;
        experiment["replicates"] = maxReps;
        experiment["genes"] = geneNames;
        var conditions = new Array(size(expNames[x].conditions));
        
        var i=0;
        for(var y in expNames[x].conditions)
        {
            var expDataIdx = new Array(labels.length * maxReps);
            var expStr = x + '_' + y + '_';
            
            var count = 0;
            if(maxReps > 1)
            {
                //we start the replicate numbering from 1, not 0
                for(z=1;z<=maxReps;z++)
                {
                    for(var m=0;m<labels.length;m++)
                    {
                        var idx = findIndex(expStr+labels[m]+'_'+z,headers);
                        expDataIdx[count] = idx;
                        count++;
                    }
                }
            }
            else
            {
                for(var m=0;m<labels.length;m++)
                {
                    var idx = findIndex(expStr+labels[m],headers);
                    expDataIdx[count] = idx;
                    count++;
                }
            }
            
            var condExpData = new Array(geneNames.length);
            for(var z=0;z<geneNames.length;z++)
            {
                indExpData = new Array(labels.length*maxReps);
                for(var m=0;m<indExpData.length;m++)
                {
                    if(expDataIdx[m] >= 0)
                        indExpData[m] = data[z][expDataIdx[m]];
                    else
                        indExpData[m] = NaN;
                }
                condExpData[z] = indExpData;
            }
            var cond = {"name":y,"data":condExpData};
            conditions[i] = cond;
            i++;
        }
        experiment["conditions"] = conditions;
        
        experiments.push(experiment);
    }
    return experiments;*/
    
    
    /*    for(var cond in condNames)
        {
            var index = [];
            var labels = [];
            for(var y=0;y<headers.length;y++)
            {
                //if we have the experiment
                if( headers[y].substring(0,headers[y].trim().indexOf('_')) == x)
                {
                    var rest = headers[y].substring(headers[y].trim().indexOf('_')+1);
                    if(rest.substring(0,rest.trim().indexOf('_')) == cond)
                    {
                        labels.push(rest.substring(rest.trim().indexOf('_')+1));
                        index.push(y);
                    }
                }
            }
            expNames[x].conditions[cond] = {'labels':labels,'index':index};
            //textDiv.append('<p>'+x+' '+cond+' labels: '+labels+' indices: '+index+'</p>');
        }
    }
    
    
    var allData = {'ID':geneNames,'experiments':expNames,'data':data};
    
    return allData;*/
}

function findIndex(str,allStr)
{
    var count = 0;
    var found = false;
    var idx = -1;
    while( (count < allStr.length) && !found)
    {
        if(str == allStr[count])
        {
            found = true;
            idx = count;
        }
        else
            count++;
    }
    return idx;
}

function size(obj)
{
    var count = 0;
    for(x in obj)
        count++;
    return count;
}