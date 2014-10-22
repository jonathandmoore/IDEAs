//Version: 0.12 (20140131)
//Version: 0.11 (20140127)
//Version: 0.1 (20140123)

function plotEdgeData(divID,nodeData1,nodeData2,experimentStr)
{
    plotEdgeData(divID,nodeData1,nodeData2,experimentStr,null);
}

function plotEdgeData(divID,nodeData1,nodeData2,experimentStr,plotOptions)
{
	function sortDescend(a,b)
	{
		return b-a;
	};
    
    function median(values)
    {
        if( values.length == 1)
            return values;
        if( (values.length % 2) == 0)
        {
            var mid = values.length/2;
            return (values[mid] + values[mid-1])/2;
        }
        else
            return values[ Math.floor(values.length / 2) ];
    };
    
    function clear(panel)
    { 
        $('#'+panel).empty(); 
    }
    
    //first, set up our div for editing
    var mainDiv = $('#'+divID);
    
    //check if we have any data for the experiment
    if(!nodeData1.experiments.hasOwnProperty(experimentStr.toUpperCase()) || !nodeData2.experiments.hasOwnProperty(experimentStr.toUpperCase()))
    {
        mainDiv.append('<p>No data for experiment: "'+experimentStr+'"</p>');
        return;
    }
    
    //set up plot option values
    var plotOptValues = [false,true,true,true,false];

    var plotOptStr = ["plotMean","plotMedian","plotFilled","plotDatapoints","normalise"];
    var conditionName = "";
    var showNodeIDs = true;
    var changeExp = true;
    var rawData = true;
    var showDE = false; //hidden option
        
    if(typeof plotOptions != "undefined")
    {
        for(var i = 0;i<plotOptStr.length;i++)
        {
            if(plotOptions[plotOptStr[i]] != undefined)
            {
                var temp = plotOptions[plotOptStr[i]];
                //if its a boolean, so we can set the parameter
                if(typeof temp == "boolean")
                    plotOptValues[i] = temp;
            }
        }
        if(plotOptions["condition"] != undefined)
        {
            var temp = plotOptions["condition"];
            //if its a string, so we can set the parameter
            if(typeof temp == "string")
            {
                conditionName = temp;
            }
        }
        if(plotOptions["showNodeID"] != undefined)
        {
            var temp = plotOptions["showNodeID"];
            //if its a string, so we can set the parameter
            if(typeof temp == "boolean")
            {
                showNodeIDs = temp;
            }
        }
        if(plotOptions["changeExp"] != undefined)
        {
            var temp = plotOptions["changeExp"];
            //booleam
            if(typeof temp == "boolean")
                changeExp = temp;
        }
        if(plotOptions["showDE"] != undefined)
        {
            var temp = plotOptions["showDE"];
            //booleam
            if(typeof temp == "boolean")
                showDE = temp;
        }
    }
        
    //dont want mean and median, default to median
    if(plotOptValues[0] && plotOptValues[1])
        plotOptValues[0] = false;
    //if we dont plot anything at all, default to just median
    if(!plotOptValues[0] && !plotOptValues[1] && !plotOptValues[2] && !plotOptValues[3])
        plotOptValues[1] = true;
    
    
    //get experiments where we have data for both nodes
    var expNames = [];
    for(var n in nodeData1.experiments)
        if(nodeData1.experiments.hasOwnProperty(n) && nodeData2.experiments.hasOwnProperty(n))
            expNames.push(nodeData1.experiments[n].name);
    
    if(expNames.length == 0)
    {
        mainDiv.append('<p>No data for both nodes</p>');
        return;
    }
        
    var experiment1;
    var experiment2;
    
    var experimentSelected = experimentStr;
            
    //we might not want the experiment to change
    if(changeExp)
    {
        mainDiv.append('<form id="'+divID+'expForm">Experiment:<select id="'+divID+'expSelect">');
        var comboBox = $('#'+divID+'expSelect');
        for(var x =0;x<expNames.length;x++)
        {
            if(expNames[x].toUpperCase() == experimentSelected.toUpperCase())
                comboBox.append('<option id="'+divID+'select_'+x+'" selected="selected" value="'+expNames[x]+'">'+expNames[x]+'</option>');
            else
                comboBox.append('<option id="'+divID+'select_'+x+'" value="'+expNames[x]+'">'+expNames[x]+'</option>');
        }
        mainDiv.append('</select></form>');
        
        var expSelect = $('#'+divID+'expSelect');
        expSelect.change(function()
        {
            clear(divID+'dataSelect');
            clear(divID+'normalisationSelect');
            expSelect.find("option:selected").each(function()
            {
                    var name = $(this).attr("value");
                    experimentSelected = name;
                    
                    experiment1 = nodeData1.experiments[experimentSelected.toUpperCase()];
                    experiment2 = nodeData2.experiments[experimentSelected.toUpperCase()];
                    
                    //raw or normalised data scale
                    allowNormalisation = experiment1.allowNormalisation && experiment2.allowNormalisation;
                    
                    generateData();
                    generateConditionSelect();
                    
                    generateNormalisationSelect();
                    
                    plotAccordingToChoices();
            });
        });
    }
    
    var colAll = [ "rgb(255,0,0)","rgb(128,0,0)", "rgb(0,0,255)","rgb(0,0,128)"];
    
    if(showNodeIDs)
        mainDiv.append('<table border="0" cellpadding="0" width="100%"><tr><td width="50%" valign="top"><p style="color:'+colAll[0]+';">ID: '+nodeData1.ID+'</p></td><td width="50%" valign="top"><p style="color:'+colAll[2]+';">ID: '+nodeData2.ID+'</p></td></tr></table>');

    var condData1;
    var condData2;
    var condition1;
    var condition2;
    var numConditions;
    var conditionNames;
    var errorbars1;
    var errorbars2;
        
    function generateData()
    {
        experiment1 = nodeData1.experiments[experimentSelected.toUpperCase()];
        experiment2 = nodeData2.experiments[experimentSelected.toUpperCase()];

        var observations = experiment1.observations;
        
        conditionNames = [];
        for(var x in experiment1.conditions)
            if(experiment1.conditions.hasOwnProperty(x))
                conditionNames.push(experiment1.conditions[x].name);
                
        numConditions = conditionNames.length;
                
        var numObs = observations.length;
        
        var overallMinRaw = new Array(numConditions);
        var overallMaxRaw = new Array(numConditions);
        var overallMinNorm = new Array(numConditions);
        var overallMaxNorm = new Array(numConditions);
        
        var allData1 = new Array(numConditions);
        var allData2 = new Array(numConditions);
        condData1 = new Array(numConditions);
        condData2 = new Array(numConditions);
            
        var rawRep1 = [];
        var normRep1 = [];
        var rawSum1 = 0;
        var normSum1 = 0;
        var rawRep2 = [];
        var normRep2 = [];
        var rawSum2 = 0;
        var normSum2 = 0;
        var reps1 = 0;
        var reps2 = 0;
            
        for(var i=0;i<numConditions;i++)
        {
            allData1[i] = experiment1.conditions[conditionNames[i].toUpperCase()].data;
            allData2[i] = experiment2.conditions[conditionNames[i].toUpperCase()].data;
            condData1[i] = new Array(8);
            condData2[i] = new Array(8);
            for(var j=0;j<condData1[i].length;j++)
            {
                condData1[i][j] = new Array();
                condData2[i][j] = new Array();
            }
        }
        
        if(experiment1.isTimeSeries)
        {
            if(experiment1.allowNormalisation)
            {
                var normData1 = normalisation(allData1);
                var normData2 = normalisation(allData2);
                
                for(var i = 0;i<numConditions;i++)
                {
                    condition1 = experiment1.conditions[conditionNames[i].toUpperCase()];
                    condition2 = experiment2.conditions[conditionNames[i].toUpperCase()];
                    conditionNames[i] = condition1.name;
                    
                    overallMinRaw[i] = 100000000;
                    overallMaxRaw[i] = -100000000;
                    overallMinNorm[i] = 1000000000;
                    overallMaxNorm[i] = -1000000000;
                    for(var j=0;j<numObs;j++)
                    {
                        rawSum1 = 0;
                        normSum1 = 0;
                        
                        rawSum2 = 0;
                        normSum2 = 0;
                        
                        rawRep1 = [];
                        normRep1 = [];
                        
                        rawRep2 = [];
                        normRep2 = [];
                        
                        reps1 = 0;
                        reps2 = 0;
                        
                        for(var k=0;k<experiment1.replicates;k++)
                        {
                            if(!isNaN(parseFloat(allData1[i][k*numObs+j])))
                            {
                                rawRep1.push(allData1[i][k*numObs+j]);
                                normRep1.push(normData1[i][k*numObs+j]);
                                rawSum1 += rawRep1[reps1];
                                normSum1 += normRep1[reps1];
                                
                                condData1[i][0].push([observations[j],rawRep1[reps1]]);
                                condData1[i][1].push([observations[j],normRep1[reps1]]);
                                
                                reps1++;
                            }
                            if(!isNaN(parseFloat(allData2[i][k*numObs+j])))
                            {
                                rawRep2.push(allData2[i][k*numObs+j]);
                                normRep2.push(normData2[i][k*numObs+j]);
                                rawSum2 += rawRep2[reps2];
                                normSum2 += normRep2[reps2];
                        
                                //all reps
                                
                                condData2[i][0].push([observations[j],rawRep2[reps2]]);
                                condData2[i][1].push([observations[j],normRep2[reps2]]);
                                
                                reps2++;
                            }
                        }
                        rawRep1.sort(sortDescend);
                        normRep1.sort(sortDescend);
                        rawRep2.sort(sortDescend);
                        normRep2.sort(sortDescend);
                        
                        if(reps1 >= 1)
                        {
                            //mean
                            condData1[i][2].push([observations[j],rawSum1 / reps1]);
                            condData1[i][3].push([observations[j],normSum1 / reps1]);
                    
                            //median
                            condData1[i][4].push([observations[j],median(rawRep1)]);
                            condData1[i][5].push([observations[j],median(normRep1)]);
                    
                            //extremes
                            condData1[i][6].push([observations[j],rawRep1[0],rawRep1[reps1-1]]);
                            condData1[i][7].push([observations[j],normRep1[0],normRep1[reps1-1]]);
                            
                            if(rawRep1[0] > overallMaxRaw[i])
                                overallMaxRaw[i] = rawRep1[0];
                            if(normRep1[0] > overallMaxNorm[i])
                                overallMaxNorm[i] = normRep1[0];
                            if(rawRep1[reps1-1] < overallMinRaw[i])
                                overallMinRaw[i] = rawRep1[reps1-1];
                            if(normRep1[reps1-1] < overallMinNorm[i])
                                overallMinNorm[i] = normRep1[reps1-1];
                        }
                        if(reps2 >= 1)
                        {
                            //mean
                            condData2[i][2].push([observations[j],rawSum2 / reps2]);
                            condData2[i][3].push([observations[j],normSum2 / reps2]);
                            
                            //median
                            condData2[i][4].push([observations[j],median(rawRep2)]);
                            condData2[i][5].push([observations[j],median(normRep2)]);
                            
                            //extremes
                            condData2[i][6].push([observations[j],rawRep2[0],rawRep2[reps2-1]]);
                            condData2[i][7].push([observations[j],normRep2[0],normRep2[reps2-1]]);
                            
                            if(rawRep2[0] > overallMaxRaw[i])
                                overallMaxRaw[i] = rawRep2[0];
                            if(normRep2[0] > overallMaxNorm[i])    
                                overallMaxNorm[i] = normRep2[0];
                            if(rawRep2[reps2-1] < overallMinRaw[i])
                                overallMinRaw[i] = rawRep2[reps2-1];
                            if(normRep2[reps2-1] < overallMinNorm[i])
                                overallMinNorm[i] = normRep2[reps2-1];
                        }
                    }
                }
            }
            else
            {
                //already normalised
                for(var i = 0;i<numConditions;i++)
                {
                    condition1 = experiment1.conditions[conditionNames[i].toUpperCase()];
                    condition2 = experiment2.conditions[conditionNames[i].toUpperCase()];
                    conditionNames[i] = condition1.name;
                    
                    overallMinNorm[i] = 1000000000;
                    overallMaxNorm[i] = -1000000000;
                    for(var j=0;j<numObs;j++)
                    {
                        rawSum1 = 0;
                        
                        rawSum2 = 0;
                        
                        rawRep1 = [];
                        
                        rawRep2 = [];
                        
                        reps1 = 0;
                        reps2 = 0;
                        
                        for(var k=0;k<experiment1.replicates;k++)
                        {
                            if(!isNaN(parseFloat(allData1[i][k*numObs+j])))
                            {
                                rawRep1.push(allData1[i][k*numObs+j]);
                                rawSum1 += rawRep1[reps1];
                                
                                condData1[i][0].push([observations[j],rawRep1[reps1]]);
                                
                                reps1++;
                            }
                            if(!isNaN(parseFloat(allData2[i][k*numObs+j])))
                            {
                                rawRep2.push(allData2[i][k*numObs+j]);
                                rawSum2 += rawRep2[reps2];
                        
                                //all reps
                                condData2[i][0].push([observations[j],rawRep2[reps2]]);
                                
                                reps2++;
                            }
                        }
                        rawRep1.sort(sortDescend);
                        rawRep2.sort(sortDescend);
                        
                        if(reps1 >= 1)
                        {
                            //mean
                            condData1[i][2].push([observations[j],rawSum1 / reps1]);
                    
                            //median
                            condData1[i][4].push([observations[j],median(rawRep1)]);
                                                
                            //extremes
                            condData1[i][6].push([observations[j],rawRep1[0],rawRep1[reps1-1]]);
                            
                            if(rawRep1[0] > overallMaxRaw[i])
                                overallMaxRaw[i] = rawRep1[0];
                            if(rawRep1[reps1-1] < overallMinRaw[i])
                                overallMinRaw[i] = rawRep1[reps1-1];
                        }
                        if(reps2 >= 1)
                        {
                            //mean
                            condData2[i][2].push([observations[j],rawSum2 / reps2]);
                            
                            //median
                            condData2[i][4].push([observations[j],median(rawRep2)]);
                            
                            //extremes
                            condData2[i][6].push([observations[j],rawRep2[0],rawRep2[reps2-1]]);
                            
                            if(rawRep2[0] > overallMaxRaw[i])    
                                overallMaxRaw[i] = rawRep2[0];
                            if(rawRep2[reps2-1] < overallMinRaw[i])
                                overallMinRaw[i] = rawRep2[reps2-1];
                        }
                    }
                }
            }
        }
        else
        {
            //not time-series data, plot as bars, so get positions on x-axis
            //need to change the timing to fixed intervals for bars
            var width = 1;
            var offset = width / 8;
            errorbars1 = new Array(numConditions);
            errorbars2 = new Array(numConditions);
            
            if(experiment1.allowNormalisation)
            {
                var normData1 = normalisation(allData1);
                var normData2 = normalisation(allData2);
                
                for(var i = 0;i<numConditions;i++)
                {
                    errorbars1[i] = new Array(numObs);
                    errorbars2[i] = new Array(numObs);
                    var condOffset1 = width/2;
                    var condOffset2 = width;
                    for(var j=0;j<numObs;j++)
                    {
                        rawSum1 = 0;
                        normSum1 = 0;
                        rawSum2 = 0;
                        normSum2 = 0;
                        
                        rawRep1 = [];
                        normRep1 = [];
                        
                        rawRep2 = [];
                        normRep2 = [];
                        
                        reps1 = 0;
                        reps2 = 0;
                        
                        errorbars1[i][j] = new Array(8);
                        errorbars2[i][j] = new Array(8);
                        for(var k=0;k<experiment1.replicates;k++)
                        {
                            if(!isNaN(parseFloat(allData1[i][k*numObs+j])))
                            {
                                rawRep1.push(allData1[i][k*numObs+j]);
                                normRep1.push(normData1[i][k*numObs+j]);
                                rawSum1 += rawRep1[reps1];
                                normSum1 += normRep1[reps1];
                                
                                //all reps
                                condData1[i][0].push([j*2+condOffset1,rawRep1[reps1]]);
                                condData1[i][1].push([j*2+condOffset1,normRep1[reps1]]);
                                
                                reps1++;
                            }
                            if(!isNaN(parseFloat(allData2[i][k*numObs+j])))
                            {
                                rawRep2.push(allData2[i][k*numObs+j]);
                                normRep2.push(normData2[i][k*numObs+j]);
                                rawSum2 += rawRep2[reps2];
                                normSum2 += normRep2[reps2];
                                
                                condData2[i][0].push([j*2+condOffset2,rawRep2[reps2]]);
                                condData2[i][1].push([j*2+condOffset2,normRep2[reps2]]);
                                
                                reps2++;
                            }
                        }
                        
                        //Only need to do the following if there are multiple replicates
                        if (reps1 >= 1) {
                            rawRep1.sort(sortDescend);
                            normRep1.sort(sortDescend);
                                                    
                            //mean
                            condData1[i][2].push([j*2+condOffset1,rawSum1 / reps1]);
                            condData1[i][3].push([j*2+condOffset1,normSum1 / reps1]);
                        
                            //median
                            condData1[i][4].push([j*2+condOffset1,median(rawRep1)]);
                            condData1[i][5].push([j*2+condOffset1,median(normRep1)]);
                        
                            //extremes
                            condData1[i][6].push([j*2+condOffset1,rawRep1[0],rawRep1[reps1-1]]);
                            condData1[i][7].push([j*2+condOffset1,normRep1[0],normRep1[reps1-1]]);
                            
                            for(var k=0;k<8;k++)
                                 errorbars1[i][j][k] = new Array();
                            
                            //node1
                            //top error bar
                            errorbars1[i][j][0].push([j*2+condOffset1+offset,rawRep1[0]]);
                            errorbars1[i][j][0].push([j*2+condOffset1+offset*3,rawRep1[0]]);
                            
                            errorbars1[i][j][1].push([j*2+condOffset1+offset,normRep1[0]]);
                            errorbars1[i][j][1].push([j*2+condOffset1+offset*3,normRep1[0]]);
                            
                            errorbars1[i][j][2].push([j*2+condOffset1+offset*2,rawRep1[0]]);
                            errorbars1[i][j][3].push([j*2+condOffset1+offset*2,normRep1[0]]);
                            
                            //bottom error bar
                            errorbars1[i][j][4].push([j*2+condOffset1+offset*2,rawRep1[reps1-1]]);
                            errorbars1[i][j][5].push([j*2+condOffset1+offset*2,normRep1[reps1-1]]);
                            
                            errorbars1[i][j][6].push([j*2+condOffset1+offset,rawRep1[reps1-1]]);
                            errorbars1[i][j][6].push([j*2+condOffset1+offset*3,rawRep1[reps1-1]]);
                            
                            errorbars1[i][j][7].push([j*2+condOffset1+offset,normRep1[reps1-1]]);
                            errorbars1[i][j][7].push([j*2+condOffset1+offset*3,normRep1[reps1-1]]);
                            
                            if( plotOptValues[0]) //mean
                            {
                                //top error bar connector
                                errorbars1[i][j][2].push([j*2+condOffset1+offset*2,mean(rawRep1)]);
                                errorbars1[i][j][3].push([j*2+condOffset1+offset*2,mean(normRep1)]);
                                errorbars1[i][j][4].push([j*2+condOffset1+offset*2,mean(rawRep1)]);
                                errorbars1[i][j][5].push([j*2+condOffset1+offset*2,mean(normRep1)]);
                            }
                            else
                            {
                                errorbars1[i][j][2].push([j*2+condOffset1+offset*2,median(rawRep1)]);
                                errorbars1[i][j][3].push([j*2+condOffset1+offset*2,median(normRep1)]);
                                errorbars1[i][j][4].push([j*2+condOffset1+offset*2,median(rawRep1)]);
                                errorbars1[i][j][5].push([j*2+condOffset1+offset*2,median(normRep1)]);
                            }
                        }
                        
                        if(reps2 >= 1)
                        {
                            rawRep2.sort(sortDescend);
                            normRep2.sort(sortDescend);
                            
                            //mean
                            condData2[i][2].push([j*2+condOffset2,rawSum2 / reps2]);
                            condData2[i][3].push([j*2+condOffset2,normSum2 / reps2]);
                            
                            //median
                            condData2[i][4].push([j*2+condOffset2,median(rawRep2)]);
                            condData2[i][5].push([j*2+condOffset2,median(normRep2)]);
                            
                            //extremes
                            condData2[i][6].push([j*2+condOffset2,rawRep2[0],rawRep2[reps2-1]]);
                            condData2[i][7].push([j*2+condOffset2,normRep2[0],normRep2[reps2-1]]);
                            
                            for(var k=0;k<8;k++)
                                 errorbars2[i][j][k] = new Array();
                        
                            //node2
                            //top error bar
                            errorbars2[i][j][0].push([j*2+condOffset2+offset,rawRep2[0]]);
                            errorbars2[i][j][0].push([j*2+condOffset2+offset*3,rawRep2[0]]);
                            
                            errorbars2[i][j][1].push([j*2+condOffset2+offset,normRep2[0]]);
                            errorbars2[i][j][1].push([j*2+condOffset2+offset*3,normRep2[0]]);
                            
                            errorbars2[i][j][2].push([j*2+condOffset2+offset*2,rawRep2[0]]);
                            errorbars2[i][j][3].push([j*2+condOffset2+offset*2,normRep2[0]]);
                            
                            //bottom error bar
                            errorbars2[i][j][4].push([j*2+condOffset2+offset*2,rawRep2[reps2-1]]);
                            errorbars2[i][j][5].push([j*2+condOffset2+offset*2,normRep2[reps2-1]]);
                            
                            errorbars2[i][j][6].push([j*2+condOffset2+offset,rawRep2[reps2-1]]);
                            errorbars2[i][j][6].push([j*2+condOffset2+offset*3,rawRep2[reps2-1]]);
                            
                            errorbars2[i][j][7].push([j*2+condOffset2+offset,normRep2[reps2-1]]);
                            errorbars2[i][j][7].push([j*2+condOffset2+offset*3,normRep2[reps2-1]]);
                            
                            if( plotOptValues[0]) //mean
                            {
                                //top error bar connector
                                errorbars2[i][j][2].push([j*2+condOffset2+offset*2,mean(rawRep2)]);
                                errorbars2[i][j][3].push([j*2+condOffset2+offset*2,mean(normRep2)]);
                                errorbars2[i][j][4].push([j*2+condOffset2+offset*2,mean(rawRep2)]);
                                errorbars2[i][j][5].push([j*2+condOffset2+offset*2,mean(normRep2)]);
                            }
                            else
                            {
                                errorbars2[i][j][2].push([j*2+condOffset2+offset*2,median(rawRep2)]);
                                errorbars2[i][j][3].push([j*2+condOffset2+offset*2,median(normRep2)]);
                                errorbars2[i][j][4].push([j*2+condOffset2+offset*2,median(rawRep2)]);
                                errorbars2[i][j][5].push([j*2+condOffset2+offset*2,median(normRep2)]);
                            }

                        }
                    }
                }
            }
            else
            {
                //already normalised
                for(var i = 0;i<numConditions;i++)
                {
                    errorbars1[i] = new Array(numObs);
                    errorbars2[i] = new Array(numObs);
                    var condOffset1 = width/2;
                    var condOffset2 = width;
                    for(var j=0;j<numObs;j++)
                    {
                        rawSum1 = 0;
                        rawSum2 = 0;
                        
                        rawRep1 = [];
                        rawRep2 = [];
                        
                        reps1 = 0;
                        reps2 = 0;
                        
                        errorbars1[i][j] = new Array(8);
                        errorbars2[i][j] = new Array(8);
                        for(var k=0;k<experiment1.replicates;k++)
                        {
                            if(!isNaN(parseFloat(allData1[i][k*numObs+j])))
                            {
                                rawRep1.push(allData1[i][k*numObs+j]);
                                rawSum1 += normRep1[reps1];
                                                            
                                //all reps
                                condData1[i][0].push([j*2+condOffset1,rawRep1[reps1]]);
                                
                                reps1++;
                            }
                            if(!isNaN(parseFloat(allData2[i][k*numObs+j])))
                            {
                                rawRep2.push(allData2[i][k*numObs+j]);
                                rawSum2 += normRep2[reps2];

                                condData2[i][0].push([j*2+condOffset2,rawRep2[reps2]]);
                                
                                reps2++;
                            }
                        }
                        
                        //Only need to do the following if there are multiple replicates
                        if (reps1 >= 1) {
                            rawRep1.sort(sortDescend);
                        
                            //mean
                            condData1[i][2].push([j*2+condOffset1,rawSum1 / reps]);
                        
                            //median
                            condData1[i][4].push([j*2+condOffset1,median(rawRep1)]);
                        
                            //extremes
                            condData1[i][6].push([j*2+condOffset1,rawRep1[0],rawRep1[reps1-1]]);
                            
                            for(var k=0;k<8;k++)
                                 errorbars1[i][j][k] = new Array();
                            
                            //node1
                            //top error bar
                            errorbars1[i][j][0].push([j*2+condOffset1+offset,rawRep1[0]]);
                            errorbars1[i][j][0].push([j*2+condOffset1+offset*3,rawRep1[0]]);
                            
                            errorbars1[i][j][2].push([j*2+condOffset1+offset*2,rawRep1[0]]);
                            
                            //bottom error bar
                            errorbars1[i][j][4].push([j*2+condOffset1+offset*2,rawRep1[reps1-1]]);
                            
                            errorbars1[i][j][6].push([j*2+condOffset1+offset,rawRep1[reps1-1]]);
                            errorbars1[i][j][6].push([j*2+condOffset1+offset*3,rawRep1[reps1-1]]);
                            
                            if( plotOptValues[0]) //mean
                            {
                                //top error bar connector
                                errorbars1[i][j][2].push([j*2+condOffset1+offset*2,mean(rawRep1)]);
                                errorbars1[i][j][4].push([j*2+condOffset1+offset*2,mean(rawRep1)]);
                            }
                            else
                            {
                                errorbars1[i][j][2].push([j*2+condOffset1+offset*2,median(rawRep1)]);
                                errorbars1[i][j][4].push([j*2+condOffset1+offset*2,median(rawRep1)]);
                            }
                        }
                        
                        if(reps2 >= 1)
                        {    
                            rawRep2.sort(sortDescend);
                            
                            //mean
                            condData2[i][2].push([j*2+condOffset2,rawSum2 / reps]);
                            
                            //median
                            condData2[i][4].push([j*2+condOffset2,median(rawRep2)]);
                            
                            //extremes
                            condData2[i][6].push([j*2+condOffset2,rawRep2[0],rawRep2[reps2-1]]);
                            
                            for(var k=0;k<8;k++)
                                 errorbars2[i][j][k] = new Array();
                            
                            //node2
                            //top error bar
                            errorbars2[i][j][0].push([j*2+condOffset2+offset,rawRep2[0]]);
                            errorbars2[i][j][0].push([j*2+condOffset2+offset*3,rawRep2[0]]);
                            
                            errorbars2[i][j][2].push([j*2+condOffset2+offset*2,rawRep2[0]]);
                            
                            //bottom error bar
                            errorbars2[i][j][4].push([j*2+condOffset2+offset*2,rawRep2[reps2-1]]);
                            
                            
                            errorbars2[i][j][6].push([j*2+condOffset2+offset,rawRep2[reps2-1]]);
                            errorbars2[i][j][6].push([j*2+condOffset2+offset*3,rawRep2[reps2-1]]);
                            
                            if( plotOptValues[0]) //mean
                            {
                                //top error bar connector
                                errorbars2[i][j][2].push([j*2+condOffset2+offset*2,mean(rawRep2)]);
                                errorbars2[i][j][4].push([j*2+condOffset2+offset*2,mean(rawRep2)]);
                            }
                            else
                            {
                                errorbars2[i][j][2].push([j*2+condOffset2+offset*2,median(rawRep2)]);
                                errorbars2[i][j][4].push([j*2+condOffset2+offset*2,median(rawRep2)]);
                            }

                        }
                    }
                }
            }
        }
    };
    generateData();
    
      
	var pointSize = 2;
    
	//var mainDiv = $('#'+divID);
    var plotHeight = Math.round(mainDiv.width() * (2/3));
    mainDiv.append('<div id="'+divID+'plottingWindow" style="width:inherit;height:'+plotHeight+'px;"></div>');
    mainDiv.append('<table border="0" cellpadding="0" width="100%"><tr><td width="66%" valign="top"><div id="'+divID+'dataSelect"></div></td><td width="34%" valign="top"><div id="'+divID+'normalisationSelect"></div></td></tr></table>');
    
    var dataSelect;
    var idCount = 0;
    
    var selectCondition = 0;
    if(conditionName != "")
    {
        for(var x=0;x<conditionNames.length;x++)
        {
            if(conditionNames[x] == conditionName)
                selectCondition = x;
        }
    }
    function generateConditionSelect()
    {
        //insert checkboxes
        dataSelect = $('#'+divID+'dataSelect');
        var radioStr = 'Select Condition:<table border="0" cellpadding="0" width="100%"><tr>';
        
        if (numConditions < selectCondition + 1)
        	selectCondition2 = 0;
        else
        	selectCondition2 = selectCondition;
                
        for(var i=0;i<numConditions;i++)
        {
            condition = experiment1.conditions[conditionNames[i].toUpperCase()];
            if( (i % 2) == 0 && i>0)
                radioStr = radioStr + '<tr>';
            if(i==selectCondition2)
				radioStr = radioStr + '<td width="50%" valign="top"><input type="radio" name="'+divID+'ConditionSelect" checked=true defaultChecked=true value='+i+' id="'+divID+'idCondition'+idCount+'"><label for="'+divID+'idCondition'+idCount+'">'+condition.name+'</label></td>';
            else
            	radioStr = radioStr + '<td width="50%" valign="top"><input type="radio" name="'+divID+'ConditionSelect" defaultChecked=false value='+i+' id="'+divID+'idCondition'+idCount+'"><label for="'+divID+'idCondition'+idCount+'">'+condition.name+'</label></td>';
            if( (i % 2) == 1 && i>1)
                radioStr = radioStr + '</tr>';
            idCount++;
        }
    	dataSelect.append(radioStr);
    	
    	dataSelect.find("input").click(plotAccordingToChoices);
    };
    generateConditionSelect();

	//insert radio button
	var normalisationSelect;
	
	function generateNormalisationSelect() {
		normalisationSelect = $('#'+divID+'normalisationSelect');
		radioStr = 'Data scale:';
        allowNormalisation = experiment1.allowNormalisation && experiment2.allowNormalisation;

        radioStr = radioStr + '<br/><input type="radio" name="'+divID+'normSelect" checked=true defaultChecked=true value="raw" id="'+divID+'rawButton"><label for="'+divID+'rawButton">Raw</label>';
        if(allowNormalisation)
            radioStr = radioStr + '<br/><input type="radio" name="'+divID+'normSelect" defaultChecked=false value="norm" id="'+divID+'normButton"><label for="'+divID+'normButton">Normalise</label>';
        else
            radioStr = radioStr + '<br/><input type="radio" name="'+divID+'normSelect" disabled=true defaultChecked=false value="norm" id="'+divID+'normButton"><label for="'+divID+'normButton">Normalise</label>';
		
		normalisationSelect.append(radioStr);
		normalisationSelect.find("input").click(plotAccordingToChoices);
	}
	var plotWindow = $('#'+divID+'plottingWindow');
	
    generateNormalisationSelect();

	function plotAccordingToChoices()
	{
		var data = [];
        var isNorm = false;
        var reps = experiment1.replicates;
        var col = new Array(2);
        
        if(allowNormalisation) {
			normalisationSelect.find("input:checked").each(function()
			{
				if($(this).attr("value") == "raw")
					isNorm = false;
				else
					isNorm = true;
			});
		}
        
        if(experiment1.isTimeSeries)
        {
            dataSelect.find("input:checked").each(function()
            {
                var condIdx = $(this).attr("value");
                
                col[0] = colAll[0];
                col[1] = colAll[2];
                if(showDE)
                {
                    if(experiment1.conditions[conditionNames[condIdx].toUpperCase()].hasOwnProperty("isDE"))
                    {
                        if(!experiment1.conditions[conditionNames[condIdx].toUpperCase()].isDE)
                            col[0] = colAll[1];
                    }
                    else
                        col[0] = colAll[1];
                    if(experiment2.conditions[conditionNames[condIdx].toUpperCase()].hasOwnProperty("isDE"))
                    {
                        if(!experiment2.conditions[conditionNames[condIdx].toUpperCase()].isDE)
                            col[1] = colAll[3];
                    }
                    else
                        col[1] = colAll[3];

                        
                }
                //we will want to plot filled area first
                //then data points
                //followed by mean/median
                
                var idx;
                if (reps > 1) {
                    if(plotOptValues[2])
                    {
                        idx = 6;
                        if(isNorm)
                            idx++;
                        if(experiment1 != "undefined")
                            data.push({color:col[0],data:condData1[condIdx][idx],lines:{show:true,lineWidth:0,fill:0.3}});
                        if(experiment2 != "undefined")
                            data.push({color:col[1],data:condData2[condIdx][idx],lines:{show:true,lineWidth:0,fill:0.3}});                    
                    }
                    if(plotOptValues[3])
                    {
                        idx = 0;
                        if(isNorm)
                            idx++;
                        if(experiment1 != "undefined")
                             data.push({color:col[0],data:condData1[condIdx][idx],lines:{show:false},points:{show:true,radius:pointSize}});
                        if(experiment2 != "undefined")
                             data.push({color:col[1],data:condData2[condIdx][idx],lines:{show:false},points:{show:true,radius:pointSize}});
                    }
                    if(plotOptValues[0])
                    {
                        idx = 2;
                        if(isNorm)
                            idx++;
                        if(experiment1 != "undefined")
                            data.push({color:col[0],data:condData1[condIdx][idx],shadowSize:0});
                        if(experiment2 != "undefined")
                            data.push({color:col[1],data:condData2[condIdx][idx],shadowSize:0});
                    }
                    
                    if(plotOptValues[1])
                    {
                        idx = 4;
                        if(isNorm)
                            idx++;
                        if(experiment1 != "undefined")
                            data.push({color:col[0],data:condData1[condIdx][idx],shadowSize:0});
                        if(experiment2 != "undefined")
                            data.push({color:col[1],data:condData2[condIdx][idx],shadowSize:0});
                    }
                } else {
                    idx = 0;
                    if(isNorm)
                        idx++;
                    if(experiment1 != "undefined")
                         data.push({color:col[0],data:condData1[condIdx][idx],lines:{show:true},points:{show:true,radius:pointSize},shadowSize:0});
                    if(experiment2 != "undefined")
                         data.push({color:col[1],data:condData2[condIdx][idx],lines:{show:true},points:{show:true,radius:pointSize},shadowSize:0});
                }
                
            });
            if(data.length > 0)
                $.plot($('#'+divID+'plottingWindow'),data,{xaxis:{min:experiment1.observations[0],max:experiment1.observations[experiment1.observations.length-1]}});
            else
                $.plot($('#'+divID+'plottingWindow'), []);
        }
        else
        {
            var width = 1;
            var numObs = experiment1.observations.length;
            dataSelect.find("input:checked").each(function()
            {
                var condIdx = $(this).attr("value");
                
                col[0] = colAll[0];
                col[1] = colAll[2];
                if(showDE)
                {
                    if(experiment1.conditions[conditionNames[condIdx].toUpperCase()].hasOwnProperty("isDE"))
                    {
                        if(!experiment1.conditions[conditionNames[condIdx].toUpperCase()].isDE)
                            col[0] = colAll[1];
                    }
                    else
                        col[0] = colAll[1];
                    if(experiment2.conditions[conditionNames[condIdx].toUpperCase()].hasOwnProperty("isDE"))
                    {
                        if(!experiment2.conditions[conditionNames[condIdx].toUpperCase()].isDE)
                            col[1] = colAll[3];
                    }
                    else
                        col[1] = colAll[3];

                        
                }
                //we will want to plot filled area first as mean/median
                //then error bars
                var idx;
                if (reps > 1)
                {
                    if(plotOptValues[0]) //plot mean
                    {
                        idx = 2;
                        if(isNorm)
                            idx++;
                        data.push({color:col[0],data:condData1[condIdx][idx],bars:{show:true,barWidth:width/2,align:'left'}});
                        data.push({color:col[1],data:condData2[condIdx][idx],bars:{show:true,barWidth:width/2,align:'left'}});
                    }
                    
                    if(plotOptValues[1]) //plot median
                    {
                        idx = 4;
                        if(isNorm)
                            idx++;
                        data.push({color:col[0],data:condData1[condIdx][idx],bars:{show:true,barWidth:width/2,align:'left'}});
                        data.push({color:col[1],data:condData2[condIdx][idx],bars:{show:true,barWidth:width/2,align:'left'}});
                    }
                    for(var j=0;j<4;j++)
                    {
                        idx = j*2;
                        if(isNorm)
                            idx=j*2+1;
                        for(var i=0;i<numObs;i++)
                        {
                            data.push({color:col[0],data:errorbars1[condIdx][i][idx],lines:{show:true,fill:false},shadowSize:0});
                            data.push({color:col[1],data:errorbars2[condIdx][i][idx],lines:{show:true,fill:false},shadowSize:0});
                        }
                    }
                }
                else 
                {
                    idx = 0;
                    if(isNorm)
                        idx++;
                    data.push({color:col[0],data:condData1[condIdx][idx],bars:{show:true,barWidth:width/2,align:'left'}});
                    data.push({color:col[1],data:condData2[condIdx][idx],bars:{show:true,barWidth:width/2,align:'left'}});	
                }
            });
            var xlabels = new Array(numObs);
            for(var i=0;i<numObs;i++)
                xlabels[i] = [i*2+1, experiment1.observations[i]];
            
            if(data.length > 0)
                $.plot($('#'+divID+'plottingWindow'),data,{xaxis:{ticks:xlabels,min:0.5,max:(numObs-1)*2+1.5}});
            else
                $.plot($('#'+divID+'plottingWindow'), []);
        }
	}

	plotAccordingToChoices();
}
