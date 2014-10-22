//Version: 0.25 (20140904)
//Version: 0.24 (20140415)
//Version: 0.23 (20140321)
//Version: 0.22 (20140224)
//Version: 0.21 (20140217)
//Version: 0.2 (20140212)
//Version: 0.11 (20140127)
//Version: 0.1 (20140123)

function plotHeatmap(divID,nodeData,experimentInfo,expName,condName)
{
    plotHeatmap(divID,nodeData,experimentInfo,expName,condName,null);
}

function plotHeatmap(divID,nodeData,experimentInfo,expName,condName,plotOptions)
{   
    var mainDiv = $('#'+divID);
    
    var showLabels = true;
    var ROW_HEIGHT_LABELS = 10;
    var ROW_HEIGHT_NONE = 5;
    var dataRange = null;
    
    var nodeNames = getNames(nodeData);
    var numNodes = nodeNames.length;
    
    //need to check some options early
    if( plotOptions != null )
    {       
        //check if we want to sync the heatmap with others
        if(typeof plotOptions["syncScroll"] != 'undefined')
        {
            var syncedDivs = plotOptions["syncScroll"];
            $('#'+divID+'ScrollDiv').scroll(function()
            {
                for(var x=0;x<syncedDivs.length;x++)
                    $('#'+syncedDivs[x]+'ScrollDiv').scrollTop($(this).scrollTop());
            });
        }
        //user defined range
        if(typeof plotOptions["dataRange"] != "undefined")
        {
            if($.isArray(plotOptions["dataRange"]) )
            {
                dataRange = plotOptions["dataRange"];
                if(dataRange.length == 2)
                {
                    var accept = true;
                    for(var x=0;x<2;x++)
                        if(isNaN(parseFloat(dataRange[x])))
                            accept = false;
                    if( (dataRange[0] > dataRange[1]) )
                    {
                        //min and max are the wrong way round, so we'll try swapping them
                        var temp = dataRange[0];
                        dataRange[0] = dataRange[1];
                        dataRange[1] = temp;
                    }
                        
                    if(!accept)
                        dataRange = null;
                    else
                        dataRange = [dataRange[0],(dataRange[1]-dataRange[0])/2+dataRange[0],dataRange[1]];
                }
            }
        }
        if(typeof plotOptions["clustering"] != "undefined")
        {
            var cluster = plotOptions["clustering"];
            if($.isArray(cluster) )    
                if(cluster.length == nodeNames.length)
                    nodeNames = cluster;
        }
        if(typeof plotOptions["showLabels"] != "undefined")
        {
            var showLabelsInput = plotOptions["showLabels"];
            if(typeof showLabelsInput === "boolean")
                showLabels = showLabelsInput;
        }
        
    }
    var rowHeight = [];
    if(showLabels)
        rowHeight = ROW_HEIGHT_LABELS;
    else
        rowHeight = ROW_HEIGHT_NONE;
        
    //console.log(""+rowHeight);
    
    mainDiv.append('<p>Experiment: '+expName+': '+condName+' Nodes: '+numNodes+'</p>');
    
    var plotHeight = numNodes * rowHeight;
    
    var maxHeight = 650; //need to open this up
    if(plotHeight >= maxHeight)
        mainDiv.append('<div id="'+divID+'ScrollDiv" style="height:'+maxHeight+'px;overflow:auto"><div id="'+divID+'plottingWindow" style="width:100%;height:'+plotHeight+'px"></div></div><br><div id="'+divID+'ColourBar" style="height:50px;width:100%"></div>');
    else
        mainDiv.append('<div id="'+divID+'ScrollDiv" style="height:'+plotHeight+'px;overflow:auto"><div id="'+divID+'plottingWindow" style="width:100%;height:'+plotHeight+'px"></div></div><br><div id="'+divID+'ColourBar" style="height:50px;width:100%"></div>');
        
    //check for sync scrolling separately
    if( plotOptions != null )
    {       
        //check if we want to sync the heatmap with others
        if(typeof plotOptions["syncScroll"] != 'undefined')
        {
            var syncedDivs = plotOptions["syncScroll"];
            $('#'+divID+'ScrollDiv').scroll(function()
            {
                for(var x=0;x<syncedDivs.length;x++)
                    $('#'+syncedDivs[x]+'ScrollDiv').scrollTop($(this).scrollTop());
            });
        }
    }

    var experiment = [];
    var condOrder = [];
    if(experimentInfo.hasOwnProperty(expName.toUpperCase()))
    {
        experiment = experimentInfo[expName.toUpperCase()];
        if(!experiment.conditions.hasOwnProperty(condName.toUpperCase()))
        {
            mainDiv.append("Unknown condition");
            return;
        }
        else
        {
            for(y in experiment.conditions)
                if(experiment.conditions.hasOwnProperty(y))
                    condOrder.push(y); 
        }
    }
    else
    {
        mainDiv.append("Unknown experiment");
        return;
    }
    
    var numObs = experiment.observations.length;
    var reps = experiment.replicates;
    
    var allData = new Array(numNodes);
    
    
    var numConds = size(experiment.conditions);
    for(var x = 0;x<numNodes;x++)
    {
        allData[x] = new Array(numObs*reps*numConds);
        var startIdx = 0;
        if(nodeData[nodeNames[x].toUpperCase()].experiments.hasOwnProperty(expName.toUpperCase()))
        {
            var e = nodeData[nodeNames[x].toUpperCase()].experiments[expName.toUpperCase()];
            for(var y=0;y<condOrder.length;y++)
            {
                if(e.conditions.hasOwnProperty(condOrder[y]))
                {
                    var d = e.conditions[condOrder[y]].data;
                    for(var z=0;z<d.length;z++)
                        allData[x][startIdx+z] = d[z];
                }
                startIdx += (numObs*reps);
            }
        }
    }
    if(reps > 1)
        //combine replicates
        allData = combineReplicates(allData,numObs,reps);
    if(experiment.allowNormalisation)
        //normalise
        allData = normalisation(allData);
    var condData;
    if(numConds > 1)
    {
        var startIdx;
        //need to extract out the data for the given condition
        for(var x = 0;x<condOrder.length;x++)
            if(condOrder[x].toUpperCase() == condName.toUpperCase())
                startIdx = x*numObs;
        condData = new Array(numNodes);
        for(var x=0;x<numNodes;x++)
        {
            condData[x] = new Array(numObs);
            for(y=0;y<numObs;y++)
                condData[x][y] = allData[x][y+startIdx];
        }
    }
    else
        condData = allData;
    
    //get simple data range and check
    //find data extremes
    var minVal = Infinity;
    var maxVal = -Infinity;
    for(var x=0;x<numNodes;x++)
    {
        for(y=0;y<numObs;y++)
        {
            if(condData[x][y] < minVal)
                minVal = condData[x][y];
            if(condData[x][y] > maxVal)
                maxVal = condData[x][y];
        }
    }
    //check if the predefined range is valid at all
    if(dataRange == null || (dataRange[0] == dataRange[1]) || (minVal >= dataRange[2]) || (maxVal <= dataRange[0]))
        dataRange = [minVal,(maxVal-minVal)/2 + minVal,maxVal];
    //console.log(dataRange);
    
    function plotHeatmapSeparateRect()
    {
        var data = [];
        
        var ylabels = new Array(numNodes);
        var xlabels = new Array(numObs);
        
        var count = 0;
        for(var y = (numNodes-1);y>=0;y--)
        {
            //plot each data point as a rectangle
            for(var x=0;x<numObs;x++)
            {
                var pointData = new Array(4);
                pointData[0] = [x-0.5,count-0.5];
                pointData[1] = [x+0.5,count-0.5];
                pointData[2] = [x+0.5,count+0.5];
                pointData[3] = [x-0.5,count+0.5];
                
                data.push({color:getColour(condData[y][x],dataRange),data:pointData,lines:{show:true,lineWidth:0,fill:1}});
            }
            if(showLabels)
                ylabels[count] = [y, nodeNames[count]];
            else
                ylabels[count] = [y, ""];
            count++;
        }
        for(var y = 0;y<numObs;y++)
            xlabels[y] = [y,experiment.observations[y]+""];
        if(data.length > 0)
        {
            var plot = $.plot($('#'+divID+'plottingWindow'),data,{xaxis:{min:-0.5,max:numObs-0.5,ticks:xlabels},yaxis:{min:-0.5,max:numNodes-0.5,ticks:ylabels},canvas:false});
            var canvas = plot.getCanvas();
            //canvas.backgroundColor = 'white'; //Doesnt work
            
            //hack to save plot as image
            //var image = canvas.toDataURL('image/png').replace('image/png','image/octet-stream'); //converts the canvas to byte stream
            //document.location.href=image; //tries to output byte stream to browser, but downloads instead - hopefully can replace this with a file browser to give it a proper name and location
        }
		else
			$.plot($('#'+divID+'plottingWindow'), []);
    }
    
    plotHeatmapSeparateRect();
    
    function plotColourBar()
    {
        var data = [];
        var points = 25;
        var minVal = dataRange[0];
        var toMid = dataRange[1]-dataRange[0];
        var maxVal = dataRange[2];
        var toMax = dataRange[2]-dataRange[1];
        var toMidInc = toMid/points;
        var toMaxInc = toMax/points;
        //var colourBarData = new Array(points*2+1);
        //min to mid
        for(var x=0;x<points;x++)
        {
            var pointData = new Array(4);
            pointData[0] = [x,-0.5];
            pointData[1] = [x+1,-0.5];
            pointData[2] = [x+1,0.5];
            pointData[3] = [x,0.5];
            
            data.push({color:getColour(minVal + (x*toMidInc),dataRange),data:pointData,lines:{show:true,lineWidth:0,fill:1}});
            //colourBarData[x] = minVal + (x*toMidInc);
        }
        //mid
        var pointData = new Array(4);
        pointData[0] = [points,-0.5];
        pointData[1] = [points+1,-0.5];
        pointData[2] = [points+1,0.5];
        pointData[3] = [points,0.5];
            
        data.push({color:getColour(dataRange[1],dataRange),data:pointData,lines:{show:true,lineWidth:0,fill:1}});
        
        //colourBarData[points] = dataRange[1];
        
        //mid to max
        for(var x=0;x<points;x++)
        {
            var pointData = new Array(4);
            pointData[0] = [points+1+x,-0.5];
            pointData[1] = [points+2+x,-0.5];
            pointData[2] = [points+2+x,0.5];
            pointData[3] = [points+1+x,0.5];
            
            data.push({color:getColour(dataRange[1] + ((x+1)*toMaxInc),dataRange),data:pointData,lines:{show:true,lineWidth:0,fill:1}});
            
            //colourBarData[points+1+x] = dataRange[1] + ((x+1)*toMaxInc);
        }
        
        //console.log(colourBarData);
        
        var xlabels = new Array(3);
        xlabels[0] = [0.5,minVal+""];
        xlabels[1] = [points+0.5,dataRange[1]+""];
        xlabels[2] = [points*2+0.5,maxVal+""];
        if(data.length > 0)
        {
			var plot = $.plot($('#'+divID+'ColourBar'),data,{xaxis:{min:0,max:points*2+1,ticks:xlabels},yaxis:{min:-0.5,max:0.5,ticks:[]},canvas:false});
            var canvas = plot.getCanvas();
            //canvas.backgroundColor = 'white'; //Doesnt work
            
            //hack to save plot as image
            //var image = canvas.toDataURL('image/png').replace('image/png','image/octet-stream'); //converts the canvas to byte stream
            //document.location.href=image; //tries to output byte stream to browser, but downloads instead - hopefully can replace this with a file browser to give it a proper name and location
        }
		else
			$.plot($('#'+divID+'ColourBar'), []);
    }

    plotColourBar();
}

function getColour(value,range)
{
    if(isNaN(parseFloat(value)))
        return "rgb(255,255,255)";
    else if(value > range[1])
        return "rgb("+Math.round( ((Math.min(value,range[2])-range[1]) / (range[2]-range[1]) )*255)+",0,0)";
    else
    return "rgb(0,"+Math.round( ((Math.max(value,range[0])-range[1]) / (range[0]-range[1]) )*255)+",0)";
        //return "rgb(0,"+(Math.round(Math.abs((Math.max(value,range[0])/range[0])) * 255))+",0)";
}

function getNames(nodes)
{
    var names = [];
    for(var x in nodes)
        if(nodes.hasOwnProperty(x))
            names.push(nodes[x].ID);
            
    return names;
}

function size(obj)
{
    var count = 0;
    for(x in obj)
        if(obj.hasOwnProperty(x))
            count++;
    return count;
}
