//Version: 0.13 (20140326)
//Version: 0.12 (20140131)
//Version: 0.11 (20140127)
//Version: 0.1 (20140123)

function plotSingleNodeData(divID,nodeData,experimentStr)
{
    plotSingleNodeData(divID,nodeData,experimentStr,null);
}

function plotSingleNodeData(divID,nodeData,experimentStr,plotOptions)
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
    
    var mainDiv = $('#'+divID);
    var expNames = [];
    for(var x in nodeData.experiments)
        if(nodeData.experiments.hasOwnProperty(x))
            expNames.push(nodeData.experiments[x].name);
    
    if(nodeData.experiments[experimentStr.toUpperCase()] == 'undefined')
    {
        mainDiv.append('<p>Unknown experiment: "'+experimentStr+'"</p>');
        return;
    }
    
    var expSelected = experimentStr;
    
    mainDiv.append('<form id="'+divID+'expForm">Experiment:<select id="'+divID+'expSelect">');
    var comboBox = $('#'+divID+'expSelect');
    for(var x =0;x<expNames.length;x++)
    {
        if(expNames[x].toUpperCase() == expSelected.toUpperCase())
            comboBox.append('<option id="'+divID+'select_'+expNames[x]+'" selected="selected">'+expNames[x]+'</option>');
        else
            comboBox.append('<option id="'+divID+'select_'+expNames[x]+'">'+expNames[x]+'</option>');
    }
    mainDiv.append('</select></form>');
    
    var expSelect = $('#'+divID+'expSelect');
    expSelect.change(function()
    {
        clear(divID+'dataSelect');
        clear(divID+'normalisationSelect');
        expSelect.find("option:selected").each(function()
        {
                var name = $(this).attr("id");
                expSelected = name.substring(name.lastIndexOf('_')+1);
                
                allowNormalisation = nodeData.experiments[expSelected.toUpperCase()].allowNormalisation;
                
                generateData();
                generateConditionSelect();
                
                generateNormalisationSelect();
                    
                plotAccordingToChoices();
        });
    });
    //mainDiv.append('<br/>Gene: '+nodeData.gene);
    var experiment;
    var condNames;
    var condData;
    var condition;
    var numConditions;
    var isTimeSeries;
    var numObs;
    var errorbars;
    
    //set up plot option values
    var plotOptValues = [false,true,true,true];
    var plotOptStr = ["plotMean","plotMedian","plotFilled","plotDatapoints"];

    if(typeof plotOptions != "undefined")
    {
        for(var i = 0;i<plotOptStr.length;i++)
        {
            if(plotOptions[plotOptStr[i]] != "undefined")
            {
                var temp = plotOptions[plotOptStr[i]];
                //if its a boolean, so we can set the parameter
                if(typeof temp == "boolean")
                    plotOptValues[i] = temp;
            }
        }
    }
        
    function generateData()
    {
        experiment = nodeData.experiments[expSelected.toUpperCase()];

        var observations = experiment.observations;
        numObs = observations.length;
        isTimeSeries = experiment.isTimeSeries;
    
        condNames = new Array();
        for(var x in experiment.conditions)
            if(experiment.conditions.hasOwnProperty(x))
                condNames.push(experiment.conditions[x].name);
                
        numConditions = condNames.length;
        condData = new Array(numConditions);
        var sumConditions = new Array(numConditions);
        
        var allData = new Array(numConditions);
    
        for(var i=0;i<numConditions;i++)
        {
            allData[i] = experiment.conditions[condNames[i].toUpperCase()].data;
            condData[i] = new Array(8);
            for(var j=0;j<8;j++)
                condData[i][j] = new Array();
        }
        var rawRep = [];
        var normRep = [];
        var reps = [];
        var rawSum = 0;
        var normSum = 0;
        
        if(isTimeSeries)
        {
            if(experiment.allowNormalisation)
            {
                var normData = normalisation(allData);
                
                for(var i = 0;i<numConditions;i++)
                {
                    for(var j=0;j<numObs;j++)
                    {
                        rawSum = 0;
                        normSum = 0;
                        rawRep = [];
                        normRep = [];
                        reps = 0;
                        
                        for(var k=0;k<experiment.replicates;k++)
                        {
                            if(!isNaN(parseFloat(allData[i][k*numObs+j])) )
                            {
                                rawRep.push(allData[i][k*numObs+j]);
                                normRep.push(normData[i][k*numObs+j]);
                                rawSum += rawRep[reps];
                                normSum += normRep[reps];
                            
                                //all reps
                                condData[i][0].push([observations[j],rawRep[reps]]);
                                condData[i][1].push([observations[j],normRep[reps]]);
                                
                                reps++;
                            }
                        }
                        
                        //Only need to do the following if there are multiple replicates
                        if (reps >= 1) {
                            rawRep.sort(sortDescend);
                            normRep.sort(sortDescend);
                        
                            //mean
                            condData[i][2].push([observations[j],rawSum / reps]);
                            condData[i][3].push([observations[j],normSum / reps]);
                        
                            //median
                            condData[i][4].push([observations[j],median(rawRep)]);
                            condData[i][5].push([observations[j],median(normRep)]);
                        
                            //extremes
                            condData[i][6].push([observations[j],rawRep[0],rawRep[reps-1]]);
                            condData[i][7].push([observations[j],normRep[0],normRep[reps-1]]);
                        }
                    }
                }
            }
            else
            {
                //do not allow normalisation
                for(var i = 0;i<numConditions;i++)
                {
                    for(var j=0;j<numObs;j++)
                    {
                        rawSum = 0;
                        rawRep = [];
                        reps = 0;
                        
                        for(var k=0;k<experiment.replicates;k++)
                        {
                            if(!isNaN(parseFloat(allData[i][k*numObs+j])))
                            {
                                rawRep.push(allData[i][k*numObs+j]);
                                rawSum += rawRep[reps];
                            
                                //all reps
                                condData[i][0].push([observations[j],rawRep[reps]]);
                                reps++;
                            }
                        }
                        
                        //Only need to do the following if there are multiple replicates
                        if (reps >= 1) {
                            rawRep.sort(sortDescend);
                        
                            //mean
                            condData[i][2].push([observations[j],rawSum / reps]);
                        
                            //median
                            condData[i][4].push([observations[j],median(rawRep)]);
                        
                            //extremes
                            condData[i][6].push([observations[j],rawRep[0],rawRep[reps-1]]);
                        }
                    }
                }
            }
        }
        else
        {
            //plot bars at fixed intervals
            
            //need to change the timing to fixed intervals for bars
            var width = 1;
            var widthPerCondition = width / numConditions;
            var offset = widthPerCondition / 4;
            errorbars = new Array(numConditions);
            
            if(experiment.allowNormalisation)
            {
                var normData = normalisation(allData);
                
                for(var i = 0;i<numConditions;i++)
                {
                    errorbars[i] = new Array(numObs);
                    var condOffset = width/2 + i*widthPerCondition;
                    for(var j=0;j<numObs;j++)
                    {
                        rawSum = 0;
                        normSum = 0;
                        rawRep = [];
                        normRep = [];
                        reps = 0;
                        
                        errorbars[i][j] = new Array(8);
                        for(var k=0;k<experiment.replicates;k++)
                        {
                            if(!isNaN(parseFloat(allData[i][k*numObs+j])))
                            {
                                rawRep.push(allData[i][k*numObs+j]);
                                normRep.push(normData[i][k*numObs+j]);
                                rawSum += rawRep[reps];
                                normSum += normRep[reps];
                            
                                //all reps
                                condData[i][0].push([j*2+condOffset,rawRep[reps]]);
                                condData[i][1].push([j*2+condOffset,normRep[reps]]);
                                
                                reps++;
                            }
                        }
                        
                        //Only need to do the following if there are multiple replicates
                        if (reps >= 1) {
                            rawRep.sort(sortDescend);
                            normRep.sort(sortDescend);
                        
                            //mean
                            condData[i][2].push([j*2+condOffset,rawSum / reps]);
                            condData[i][3].push([j*2+condOffset,normSum / reps]);
                        
                            //median
                            condData[i][4].push([j*2+condOffset,median(rawRep)]);
                            condData[i][5].push([j*2+condOffset,median(normRep)]);
                        
                            //extremes
                            condData[i][6].push([j*2+condOffset,rawRep[0],rawRep[reps-1]]);
                            condData[i][7].push([j*2+condOffset,normRep[0],normRep[reps-1]]);
                            
                            for(var k=0;k<8;k++)
                                 errorbars[i][j][k] = new Array();
                            
                            //top error bar
                            errorbars[i][j][0].push([j*2+condOffset+offset,rawRep[0]]);
                            errorbars[i][j][0].push([j*2+condOffset+offset*3,rawRep[0]]);
                            
                            errorbars[i][j][1].push([j*2+condOffset+offset,normRep[0]]);
                            errorbars[i][j][1].push([j*2+condOffset+offset*3,normRep[0]]);
                            
                            errorbars[i][j][2].push([j*2+condOffset+offset*2,rawRep[0]]);
                            errorbars[i][j][3].push([j*2+condOffset+offset*2,normRep[0]]);
                            
                            //bottom error bar
                            errorbars[i][j][4].push([j*2+condOffset+offset*2,rawRep[reps-1]]);
                            errorbars[i][j][5].push([j*2+condOffset+offset*2,normRep[reps-1]]);
                            
                            errorbars[i][j][6].push([j*2+condOffset+offset,rawRep[reps-1]]);
                            errorbars[i][j][6].push([j*2+condOffset+offset*3,rawRep[reps-1]]);
                            
                            errorbars[i][j][7].push([j*2+condOffset+offset,normRep[reps-1]]);
                            errorbars[i][j][7].push([j*2+condOffset+offset*3,normRep[reps-1]]);
                            
                            if( plotOptValues[0]) //mean
                            {
                                //top error bar connector
                                errorbars[i][j][2].push([j*2+condOffset+offset*2,mean(rawRep)]);
                                errorbars[i][j][3].push([j*2+condOffset+offset*2,mean(normRep)]);
                                errorbars[i][j][4].push([j*2+condOffset+offset*2,mean(rawRep)]);
                                errorbars[i][j][5].push([j*2+condOffset+offset*2,mean(normRep)]);
                            }
                            else
                            {
                                errorbars[i][j][2].push([j*2+condOffset+offset*2,median(rawRep)]);
                                errorbars[i][j][3].push([j*2+condOffset+offset*2,median(normRep)]);
                                errorbars[i][j][4].push([j*2+condOffset+offset*2,median(rawRep)]);
                                errorbars[i][j][5].push([j*2+condOffset+offset*2,median(normRep)]);
                            }
                            
                        }
                    }
                }
            }
            else
            {
                //we dont want normalisation
                for(var i = 0;i<numConditions;i++)
                {
                    errorbars[i] = new Array(numObs);
                    var condOffset = width/2 + i*widthPerCondition;
                    for(var j=0;j<numObs;j++)
                    {
                        rawSum = 0;
                        rawRep = [];
                        reps = 0;
                        
                        errorbars[i][j] = new Array(8);
                        for(var k=0;k<experiment.replicates;k++)
                        {
                            if(!isNaN(parseFloat(allData[i][k*numObs+j])))
                            {
                                rawRep.push(allData[i][k*numObs+j]);
                                rawSum += rawRep[reps];
                            
                                //all reps
                                condData[i][0].push([j*2+condOffset,rawRep[reps]]);
                                
                                reps++;
                            }
                        }
                        
                        //Only need to do the following if there are multiple replicates
                        if (reps >= 1) {
                            rawRep.sort(sortDescend);
                        
                            //mean
                            condData[i][2].push([j*2+condOffset,rawSum / reps]);
                        
                            //median
                            condData[i][4].push([j*2+condOffset,median(rawRep)]);
                        
                            //extremes
                            condData[i][6].push([j*2+condOffset,normRep[0],rawRep[reps-1]]);
                            
                            for(var k=0;k<8;k++)
                                 errorbars[i][j][k] = new Array();
                            
                            //top error bar                            
                            errorbars[i][j][0].push([j*2+condOffset+offset,rawRep[0]]);
                            errorbars[i][j][0].push([j*2+condOffset+offset*3,rawRep[0]]);
                            
                            errorbars[i][j][2].push([j*2+condOffset+offset*2,rawRep[0]]);
                            
                            //bottom error bar
                            errorbars[i][j][4].push([j*2+condOffset+offset*2,rawRep[reps-1]]);
                            
                            errorbars[i][j][6].push([j*2+condOffset+offset,rawRep[reps-1]]);
                            errorbars[i][j][6].push([j*2+condOffset+offset*3,rawRep[reps-1]]);
                            
                            if( plotOptValues[0]) //mean
                            {
                                //top error bar connector
                                errorbars[i][j][2].push([j*2+condOffset+offset*2,mean(rawRep)]);
                                errorbars[i][j][4].push([j*2+condOffset+offset*2,mean(rawRep)]);
                            }
                            else
                            {
                                errorbars[i][j][2].push([j*2+condOffset+offset*2,median(rawRep)]);
                                errorbars[i][j][4].push([j*2+condOffset+offset*2,median(rawRep)]);
                            }

                        }
                    }
                }
            }
        }
    };
    generateData();
    
    var allowNormalisation = nodeData.experiments[expSelected.toUpperCase()].allowNormalisation;
    
	var pointSize = 2;
    //var col = [ "rgb(0,0,255)", "rgb(255,0,0)", "rgb(0,255,0)"];
    var col = [ "rgb(0,0,255)", "rgb(255,0,0)", "rgb(0,255,0)", "rgb(0,0,0)","rgb(0,0,128)", "rgb(128,0,0)", "rgb(0,128,0)", "rgb(128,128,128)", "rgb(0,128,128)","rgb(128,128,0)","rgb(128,0,128)"];
    
	//var mainDiv = $('#'+divID);
    var plotHeight = Math.round(mainDiv.width() * (2/3));
    mainDiv.append('<div id="'+divID+'plottingWindow" style="width:inherit;height:'+plotHeight+'px;"></div>');
    mainDiv.append('<table border="0" cellpadding="0" width="100%"><tr><td width="66%" valign="top"><div id="'+divID+'dataSelect"></div></td><td width="34%" valign="top"><div id="'+divID+'normalisationSelect"></div></td></tr></table>');
    
    var dataSelect;
    function generateConditionSelect()
    {
        //insert checkboxes
        dataSelect = $('#'+divID+'dataSelect');
        var dataStr = 'Select Condition:<table border="0" cellpadding="0" width="100%">';
        //dataSelect.append('Select Condition:<table border="0" cellpadding="0" width="100%">');
        for(var i=0;i<numConditions;i++)
        {
            condition = experiment.conditions[condNames[i].toUpperCase()];
            if( (i % 2) == 0) //&& i>0)
                //dataSelect.append('<tr>');
                dataStr = dataStr + '<tr>';
                
            //dataSelect.append('<td width="50%" valign="top"><input type="checkbox" name="'+divID+'Condition'+i+'" checked="checked" id="'+divID+'idCondition'+i+'"><label for="'+divID+'idCondition'+i+'" style="color:'+col[i]+';">'+condition.name+'</label></td>');
            dataStr = dataStr + '<td width="50%" valign="top"><input type="checkbox" name="'+divID+'Condition'+i+'" checked="checked" id="'+divID+'idCondition'+i+'"><label for="'+divID+'idCondition'+i+'" style="color:'+col[i]+';">'+condition.name+'</label></td>'
            
            if( (i % 2) == 1) //&& i>1)
                //dataSelect.append('</tr>');
                dataStr = dataStr + '</tr>';

            //dataSelect.append('</table>');
        }
        if( (numConditions % 2) == 0)
            dataStr = dataStr + '</tr>';
        dataStr = dataStr + '</table>';
        dataSelect.append(dataStr);
        dataSelect.find("input").click(plotAccordingToChoices);
    };
    generateConditionSelect();

	var normalisationSelect;
	function generateNormalisationSelect() {
		//insert radio button
		normalisationSelect = $('#'+divID+'normalisationSelect');
		var radioStr = 'Data scale:';
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

   
    
    
    //dont want mean and median, default to median
    if(plotOptValues[0] && plotOptValues[1])
        plotOptValues[0] = false;
    //if we dont plot anything at all, default to just median
    if(!plotOptValues[0] && !plotOptValues[1] && !plotOptValues[2] && !plotOptValues[3])
        plotOptValues[1] = true;
    
	function plotAccordingToChoices()
	{
		var data = [];
        var isNorm = false;
        var reps = experiment.replicates;
        
        if(allowNormalisation)
        {
			normalisationSelect.find("input:checked").each(function()
			{
				if($(this).attr("value") == "raw")
					isNorm = false;
				else
					isNorm = true;
			});
		} 
            
        if(isTimeSeries)
        {
            dataSelect.find("input:checked").each(function()
            {
                var name = $(this).attr("name");
                var condIdx = name.substring(name.lastIndexOf('n')+1);
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
                        data.push({color:col[condIdx],data:condData[condIdx][idx],lines:{show:true,lineWidth:0,fill:0.3}});
                    }
                    if(plotOptValues[3])
                    {
                        idx = 0;
                        if(isNorm)
                            idx++;
                        data.push({color:col[condIdx],data:condData[condIdx][idx],lines:{show:false},points:{show:true,radius:pointSize}});
                    }
                    if(plotOptValues[0])
                    {
                        idx = 2;
                        if(isNorm)
                            idx++;
                        data.push({color:col[condIdx],data:condData[condIdx][idx],shadowSize:0});
                    }
                    
                    if(plotOptValues[1])
                    {
                        idx = 4;
                        if(isNorm)
                            idx++;
                        data.push({color:col[condIdx],data:condData[condIdx][idx],shadowSize:0});
                    }
                } else {
                    idx = 0;
                    if(isNorm)
                        idx++;
                    data.push({color:col[condIdx],data:condData[condIdx][idx],lines:{show:true},points:{show:true,radius:pointSize}});	
                }
            });
            
            if(data.length > 0)
                $.plot($('#'+divID+'plottingWindow'),data);
            else
                $.plot($('#'+divID+'plottingWindow'), []);
        }
        else //just plot bars per observation, not time series
        {
            var width = 1;
            var widthPerCondition = width / numConditions;
            dataSelect.find("input:checked").each(function()
            {
                var name = $(this).attr("name");
                var condIdx = name.substring(name.lastIndexOf('n')+1);
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
                        data.push({color:col[condIdx],data:condData[condIdx][idx],bars:{show:true,barWidth:widthPerCondition,align:'left'}});
                    }
                    
                    if(plotOptValues[1]) //plot median
                    {
                        idx = 4;
                        if(isNorm)
                            idx++;
                        data.push({color:col[condIdx],data:condData[condIdx][idx],bars:{show:true,barWidth:widthPerCondition,align:'left'}});
                    }
                    for(var j=0;j<4;j++)
                    {
                        idx = j*2;
                        if(isNorm)
                            idx=j*2+1;
                        for(var i=0;i<numObs;i++)
                            data.push({color:col[condIdx],data:errorbars[condIdx][i][idx],lines:{show:true,fill:false},shadowSize:0});
                    }
                }
                else 
                {
                    idx = 0;
                    if(isNorm)
                        idx++;
                    data.push({color:col[condIdx],data:condData[condIdx][idx],bars:{show:true,barWidth:widthPerCondition,align:'left'}});	
                }
            });
            var xlabels = new Array(numObs);
            for(var i=0;i<numObs;i++)
                xlabels[i] = [i*2+1, experiment.observations[i]];
            
            if(data.length > 0)
                $.plot($('#'+divID+'plottingWindow'),data,{xaxis:{ticks:xlabels,min:0.5,max:(numObs-1)*2+1.5}});
            else
                $.plot($('#'+divID+'plottingWindow'), []);
        }

	}

	plotAccordingToChoices();
	
}