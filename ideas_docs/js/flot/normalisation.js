//Version: 0.11 (20140213)
//Version: 0.1 (20140123)

function normalisation(rawData)
{  
    if($.isArray(rawData[0]))
    {
        //we have an array of different datas
        var data = new Array(rawData.length);
        
        //calculate grand mean, and remove from all condition data
        for(var x=0;x<rawData.length;x++)
            data[x] = normalise(rawData[x]);
        return data;
    }
    else
    {
        return normalise(rawData);
    }
}

function normalise(data)
{
    var sum = 0;
    var c = 0;
    var d = new Array(data.length);
            
    //calculate mean and 0-centre
    for(var y=0;y<data.length;y++)
        if(!isNaN(parseFloat(data[y])))
        {
            sum += data[y];
            c++;
        }
            
    var mean = sum / c;
    sum = 0;
    c = 0;
    
    for(var y=0;y<d.length;y++)
    {
        if(!isNaN(parseFloat(data[y])))
        {
            d[y] = data[y] - mean;
            sum+= d[y] * d[y];
            c++;
        }
    }
    
    var s_dev = Math.sqrt( sum / (c-1));

    for(var y=0;y<d.length;y++)
        if(!isNaN(parseFloat(data[y])))
            d[y] = d[y] / s_dev;
    
    return d;
}