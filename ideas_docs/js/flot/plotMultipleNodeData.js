//Version: 0.13 (20140225)
//Version: 0.12 (20140131)
//Version: 0.11 (20140127)
//Version: 0.1 (20140123)

function plotMultipleNodeData(divID,nodeData,experimentInfo,experimentStr)
{
    plotMultipleNodeData(divID,nodeData,experimentInfo,experimentStr,null);
}

function plotMultipleNodeData(divID,nodeData,experimentInfo,experimentStr,plotOptions)
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
    var expIdx = -1;
    var count = 0;
    //get experiments known in system...ignore non-time series for the time being
    for(var x in experimentInfo)
        if(experimentInfo.hasOwnProperty(x)) //&& experimentInfo[x].isTimeSeries)
        {
            expNames.push(experimentInfo[x].name);
            if(expNames[count].toUpperCase() == experimentStr.toUpperCase())
                expIdx = count;
            count++;
        }
    
    if(expIdx < 0)
    {
        mainDiv.append('<p>Unknown experiment: "'+experimentStr+'"</p>');
        return;
    }
    var experimentSelected = experimentStr;
    
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
    
    
    var experiment;
    
    var expSelect = $('#'+divID+'expSelect');
    expSelect.change(function()
    {
        clear(divID+'dataSelect');
        clear(divID+'normalisationSelect');
        expSelect.find("option:selected").each(function()
        {
                var name = $(this).attr("value");
                experimentSelected = name;
                
                experiment = experimentInfo[experimentSelected.toUpperCase()];
                allowNormalisation = experimentInfo[experimentSelected.toUpperCase()].allowNormalisation;
                
                generateData();
                generateConditionSelect();
                
                generateNormalisationSelect();
                    
                plotAccordingToChoices();
        });
    });
    //mainDiv.append('<br/>Gene: '+nodeData.gene);
    var condData;
    var condition;
    var numConditions;
    var isTimeSeries;
    var numObs;
    var errorbars;
    var barWidth = 1;
    
    //set up plot option values
    var plotOptValues = [false,true];
    var plotOptStr = ["plotMean","plotMedian"];

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
        experiment = experimentInfo[experimentSelected.toUpperCase()];
        
        var nodesToUse = [];
        
        for(var x in nodeData)
            if(nodeData[x].experiments.hasOwnProperty(experimentSelected.toUpperCase()))
                nodesToUse.push(x);

        isTimeSeries = experiment.isTimeSeries;
        var observations;
        if(isTimeSeries)
            observations = experiment.observations;
        else
        {
            var observations = new Array(experiment.observations.length);
            for(var x=0;x<observations.length;x++)
                observations[x] = x;
        }
                
        numObs = observations.length;
        
        numConditions = experiment.conditionsArray.length;
        condData = new Array(nodesToUse.length);
        var sumConditions = new Array(numConditions);
        
        var allData = new Array(nodesToUse.length);
        
        for(var x=0;x<nodesToUse.length;x++)
        {
            allData[x] = new Array(numConditions);
            condData[x] = new Array(numConditions);
            for(var i=0;i<numConditions;i++)
            {
                allData[x][i] = nodeData[nodesToUse[x]].experiments[experimentSelected.toUpperCase()].conditions[experiment.conditionsArray[i].toUpperCase()].data;
                condData[x][i] = new Array(4);
                for(var j=0;j<4;j++)
                    condData[x][i][j] = new Array();
            }
        }
        var rawRep = [];
        var normRep = [];
        var rawSum = 0;
        var normSum = 0;
        var reps = [];
        
        //if(isTimeSeries)
        //{
            if(experiment.allowNormalisation)
            {
                for(var x = 0;x<nodesToUse.length;x++)
                {
                    var normData = normalisation(allData[x]);
                    
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
                                if(!isNaN(parseFloat(allData[x][i][k*numObs+j])))
                                {
                                    rawRep.push(allData[x][i][k*numObs+j]);
                                    normRep.push(normData[i][k*numObs+j]);
                                    rawSum += rawRep[reps];
                                    normSum += normRep[reps];
                                    
                                    reps++;
                                }
                            
                                /*//all reps
                                condData[i][0].push([observations[j],numObs[k]]);
                                condData[i][1].push([observations[j],numObs[k]]);*/
                            }
                            
                            //Only need to do the following if there are multiple replicates
                            if (reps >= 1) {
                                rawRep.sort(sortDescend);
                                normRep.sort(sortDescend);
                            
                                //mean
                                condData[x][i][0].push([observations[j],rawSum / reps]);
                                condData[x][i][1].push([observations[j],normSum / reps]);
                            
                                //median
                                condData[x][i][2].push([observations[j],median(rawRep)]);
                                condData[x][i][3].push([observations[j],median(normRep)]);
                            }
                        }
                    }
                }
            }
            else
            {
                //only have normalised data
                for(var x = 0;x<nodesToUse.length;x++)
                {

                    for(var i = 0;i<numConditions;i++)
                    {
                        for(var j=0;j<numObs;j++)
                        {
                            rawSum = 0;
                            rawRep = [];
                            reps = 0;
                            
                            for(var k=0;k<experiment.replicates;k++)
                            {
                                if(!isNaN(parseFloat(allData[x][i][k*numObs+j])))
                                {
                                    rawRep.push(allData[x][i][k*numObs+j]);
                                    rawSum += rawRep[reps];
                                    
                                    reps++;
                                }
                            
                                //all reps
                                //condData[x][i][0].push([observations[j],normRep[k]]);
                                //condData[x][i][1].push([observations[j],normRep[k]]);
                            }
                            
                            //Only need to do the following if there are multiple replicates
                            if (reps >= 1) {
                                rawRep.sort(sortDescend);
                            
                                //mean
                                condData[x][i][0].push([observations[j],rawSum / reps]);
                                condData[x][i][1].push([observations[j],rawSum / reps]);
                            
                                //median
                                condData[x][i][2].push([observations[j],median(rawRep)]);
                                condData[x][i][3].push([observations[j],median(rawRep)]);
                            
                            }
                            
                        }
                    }
                }
            }
        //}
        /*else
        {
            //plot bars at fixed intervals
            
            //need to change the timing to fixed intervals for bars
            
            errorbars = new Array(numConditions);
            
            if(experiment.allowNormalisation)
            {
                var normData = normalisation(allData);
                
                for(var i = 0;i<numConditions;i++)
                {
                    errorbars[i] = new Array(numObs);
                    for(var j=0;j<numObs;j++)
                    {
                        rawSum = 0;
                        normSum = 0;
                        
                        errorbars[i][j] = new Array(8);
                        for(var k=0;k<reps;k++)
                        {
                            rawRep[k] = allData[i][k*numObs+j];
                            normRep[k] = normData[i][k*numObs+j];
                            rawSum += rawRep[k];
                            normSum += normRep[k];
                        
                            //all reps
                            //condData[i][0].push([j*2+condOffset,rawRep[k]]);
                            //condData[i][1].push([j*2+condOffset,normRep[k]]);
                        }
                        
                        //Only need to do the following if there are multiple replicates
                        if (reps >= 1) {
                            rawRep.sort(sortDescend);
                            normRep.sort(sortDescend);
                        
                            //mean
                            condData[i][0].push([j,rawSum / reps]);
                            condData[i][1].push([j,normSum / reps]);
                        
                            //median
                            condData[i][2].push([j,median(rawRep)]);
                            condData[i][3].push([j,median(normRep)]);
                        
                            //extremes
                            //condData[i][4].push([j,rawRep[0],rawRep[reps-1]]);
                            //condData[i][5].push([j,normRep[0],normRep[reps-1]]);
                            
                            if( reps > 0)
                            {
                                for(var k=0;k<8;k++)
                                     errorbars[i][j][k] = new Array();
                                
                                //top error bar
                                errorbars[i][j][0].push([j-(barWidth/4),rawRep[0]]);
                                errorbars[i][j][0].push([j+(barWidth/4),rawRep[0]]);
                                
                                errorbars[i][j][1].push([j-(barWidth/4),normRep[0]]);
                                errorbars[i][j][1].push([j+(barWidth/4),normRep[0]]);
                                
                                errorbars[i][j][2].push([j,rawRep[0]]);
                                errorbars[i][j][3].push([j,normRep[0]]);
                                
                                //bottom error bar
                                errorbars[i][j][4].push([j,rawRep[reps-1]]);
                                errorbars[i][j][5].push([j,normRep[reps-1]]);
                                
                                errorbars[i][j][6].push([j-(barWidth/4),rawRep[reps-1]]);
                                errorbars[i][j][6].push([j+(barWidth/4),rawRep[reps-1]]);
                                
                                errorbars[i][j][7].push([j-(barWidth/4),normRep[reps-1]]);
                                errorbars[i][j][7].push([j+(barWidth/4),normRep[reps-1]]);
                                
                                if( plotOptValues[0]) //mean
                                {
                                    //top error bar connector
                                    errorbars[i][j][2].push([j,mean(rawRep)]);
                                    errorbars[i][j][3].push([j,mean(normRep)]);
                                    errorbars[i][j][4].push([j,mean(rawRep)]);
                                    errorbars[i][j][5].push([j,mean(normRep)]);
                                }
                                else
                                {
                                    errorbars[i][j][2].push([j,median(rawRep)]);
                                    errorbars[i][j][3].push([j,median(normRep)]);
                                    errorbars[i][j][4].push([j,median(rawRep)]);
                                    errorbars[i][j][5].push([j,median(normRep)]);
                                }
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
                    for(var j=0;j<numObs;j++)
                    {
                        rawSum = 0;
                        
                        errorbars[i][j] = new Array(8);
                        for(var k=0;k<reps;k++)
                        {
                            rawRep[k] = allData[i][k*numObs+j];
                            rawSum += rawRep[k];
                        
                            //all reps
                            //condData[i][0].push([j*2+condOffset,rawRep[k]]);
                        }
                        
                        //Only need to do the following if there are multiple replicates
                        if (reps >= 1)
                        {
                            rawRep.sort(sortDescend);
                        
                            //mean
                            condData[i][2].push([j,rawSum / reps]);
                        
                            //median
                            condData[i][4].push([j,median(rawRep)]);
                        
                            //extremes
                            condData[i][6].push([j,normRep[0],rawRep[reps-1]]);
                            
                            if(reps > 1)
                            {
                                for(var k=0;k<8;k++)
                                     errorbars[i][j][k] = new Array();
                                
                                //top error bar                            
                                errorbars[i][j][0].push([j-(barWidth/4),rawRep[0]]);
                                errorbars[i][j][0].push([j+(barWidth/4),rawRep[0]]);
                                
                                errorbars[i][j][2].push([j,rawRep[0]]);
                                
                                //bottom error bar
                                errorbars[i][j][4].push([j,rawRep[reps-1]]);
                                
                                errorbars[i][j][6].push([j-(barWidth/4),rawRep[reps-1]]);
                                errorbars[i][j][6].push([j+(barWidth/4),rawRep[reps-1]]);
                                
                                if( plotOptValues[0]) //mean
                                {
                                    //top error bar connector
                                    errorbars[i][j][2].push([j,mean(rawRep)]);
                                    errorbars[i][j][4].push([j,mean(rawRep)]);
                                }
                                else
                                {
                                    errorbars[i][j][2].push([j,median(rawRep)]);
                                    errorbars[i][j][4].push([j,median(rawRep)]);
                                }
                            }
                        }
                    }
                }
            }
        }*/
    };
    generateData();
    
    var allowNormalisation = experiment.allowNormalisation;
    
	var pointSize = 2;
    //var col = [ "rgb(0,0,255)", "rgb(255,0,0)", "rgb(0,255,0)"];
    //var col = [ "rgb(0,0,255)", "rgb(255,0,0)", "rgb(0,255,0)", "rgb(0,0,0)", "rgb(128,128,128)", "rgb(128,0,0)","rgb(128,128,0)","rgb(0,128,0)","rgb(128,0,128)","rgb(0,128,128)"];
    var col = [[0,0,255], [255,0,0], [0,255,0], [0,0,0], [128,128,128], [128,0,0],[128,128,0],[0,128,0],[128,0,128],[0,128,128]];
    
	//var mainDiv = $('#'+divID);
    var plotHeight = Math.round(mainDiv.width() * (2/3));
    mainDiv.append('<div id="'+divID+'plottingWindow" style="width:inherit;height:'+plotHeight+'px;"></div>');
    mainDiv.append('<table border="0" cellpadding="0" width="100%"><tr><td width="66%" valign="top"><div id="'+divID+'dataSelect"></div></td><td width="34%" valign="top"><div id="'+divID+'normalisationSelect"></div></td></tr></table>');
    
    var dataSelect;
    function generateConditionSelect()
    {
        //insert checkboxes
        dataSelect = $('#'+divID+'dataSelect');
                 
        var radioStr = 'Select Condition:<table border="0" cellpadding="0" width="100%"><tr>';
        //dataSelect.append('Select Condition:<table border="0" cellpadding="0" width="100%"><tr>');
        for(var i=0;i<numConditions;i++)
        {
            condition = experiment.conditionsArray[i];
            if( (i % 2) == 0 && i>0)
                //dataSelect.append('<tr>');
                radioStr = radioStr + '<tr>';
            
            if(i == 0)
                radioStr = radioStr + '<td width="50%" valign="top"><input type="radio" name="'+divID+'ConditionSelect" checked=true defaultChecked=true id="'+divID+'idCondition'+i+'" value='+i+'><label for="'+divID+'idCondition'+i+'" style="color:rgb('+col[i][0]+','+col[i][1]+','+col[i][2]+');">'+condition+'</label></td>';
            else
                radioStr = radioStr + '<td width="50%" valign="top"><input type="radio" name="'+divID+'ConditionSelect" defaultChecked=false id="'+divID+'idCondition'+i+'" value='+i+'><label for="'+divID+'idCondition'+i+'" style="color:rgb('+col[i][0]+','+col[i][1]+','+col[i][2]+');">'+condition+'</label></td>';
            //dataSelect.append('<td width="50%" valign="top"><input type="checkbox" name="'+divID+'Condition'+i+'" checked="checked" id="'+divID+'idCondition'+i+'"><label for="'+divID+'idCondition'+i+'" style="color:'+col[i]+';">'+condition+'</label></td>');
            if( (i % 2) == 1 && i>1)
                radioStr = radioStr + '</tr>';
                //dataSelect.append('</tr>');
        }
        if( (numConditions % 2) == 0)
            radioStr = radioStr + '</tr>';
        dataSelect.append(radioStr+'</table>');
        
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
					isNorm = true;;
			});
		} 
        
        var pointSize = 1;
        //if(isTimeSeries)
        //{
            dataSelect.find("input:checked").each(function()
            {
                var name = $(this).attr("name");
                var condIdx = $(this).attr("value");
                //we will want to plot filled area first
                //then data points
                //followed by mean/median
                var col1 = "rgb("+col[condIdx][0]+","+col[condIdx][1]+","+col[condIdx][2]+")";
                var col2val = changeColour(col[condIdx],0.75);
                var col2 = "rgb("+col2val[0]+","+col2val[1]+","+col2val[2]+")";
                
                var idx;
                if(plotOptValues[0])
                {
                    idx = 0;
                    if(isNorm)
                        idx++;
                }
                if(plotOptValues[1])
                {
                    idx = 2;
                    if(isNorm)
                        idx++;
                }
                for(var z = 0;z<condData.length;z++)
                {
                    data.push({color:col2,data:condData[z][condIdx][idx],shadowSize:0});
                    data.push({color:col1,data:condData[z][condIdx][idx],lines:{show:false},points:{show:true,radius:pointSize}});
                }
            });
            
            if(isTimeSeries)
            {
                if(data.length > 0)
                    $.plot($('#'+divID+'plottingWindow'),data);
                else
                    $.plot($('#'+divID+'plottingWindow'), []);
            }
            else
            {
                
                var xlabels = new Array(numObs);
                for(var i=0;i<numObs;i++)
                    xlabels[i] = [i, experiment.observations[i]];
                if(data.length > 0)
                    $.plot($('#'+divID+'plottingWindow'),data,{xaxis:{ticks:xlabels,min:0,max:numObs-1}});
                else
                    $.plot($('#'+divID+'plottingWindow'), []);
            }
        //}
        /*else //just plot bars per observation, not time series
        {
            //var width = 1;
            
            dataSelect.find("input:checked").each(function()
            {
                var name = $(this).attr("name");
                var condIdx = $(this).attr("value");
                //we will want to plot filled area first as mean/median
                //then error bars
                
                var idx;
                if (reps > 1)
                {
                    if(plotOptValues[0]) //plot mean
                    {
                        idx = 0;
                        if(isNorm)
                            idx++;
                        data.push({color:col[condIdx],data:condData[condIdx][idx],bars:{show:true,barWidth:barWidth,align:'left'}});
                    }
                    
                    if(plotOptValues[1]) //plot median
                    {
                        idx = 2;
                        if(isNorm)
                            idx++;
                        data.push({color:col[condIdx],data:condData[condIdx][idx],bars:{show:true,barWidth:barWidth,align:'left'}});
                    }
                    for(var j=0;j<4;j++)
                    {
                        idx = j*2;
                        if(isNorm)
                            idx=j*2+1;
                        for(var i=0;i<numObs;i++)
                            data.push({color:col[condIdx],data:errorbars[condIdx][i][idx],lines:{show:true,fill:false}});
                    }
                }
                else 
                {
                    idx = 0;
                    if(isNorm)
                        idx++;
                    console.log(JSON.stringify(condData[condIdx][idx],null,4));
                    data.push({color:col[condIdx],data:condData[condIdx][idx],bars:{show:true,barWidth:barWidth,align:'left'}});	
                }
            });
            var xlabels = new Array(numObs);
            for(var i=0;i<numObs;i++)
                xlabels[i] = [i*2+1, experiment.observations[i]];
            
            if(data.length > 0)
                $.plot($('#'+divID+'plottingWindow'),data,{xaxis:{ticks:xlabels,min:0.5,max:(numObs-1)*2+1.5}});
            else
                $.plot($('#'+divID+'plottingWindow'), []);
        }*/

	}

	plotAccordingToChoices();
	
}

function changeColour(col,change)
{
    var newCol = new Array(3);
    var t = change<0?0:255;
    var p = change<0?-change:change;
    
    newCol[0] = Math.max(Math.min(Math.round((t-col[0])*p)+col[0],255),0);
    newCol[1] = Math.max(Math.min(Math.round((t-col[1])*p)+col[1],255),0);
    newCol[2] = Math.max(Math.min(Math.round((t-col[2])*p)+col[2],255),0);
    
    return newCol;
}