function DemetraFrontend (mac) {
    this.mac = mac;
    this.currentPoint;
    this.callbackName = "df.getDSData_callack"; //it would be better to get the name from the method metadata
    this.updatePeriod = 60*1000;
    this.startSync = function(startPoint)
    {
      localStorage.removeItem(this.mac);
      localStorage.removeItem('currentPoint');
      this.getDSData(startPoint);
    };

    this.getDSData = function(startPoint)
    {
      this.currentPoint = getTimestamp();
      var finalUrl = "http://crowdsensing.ismb.it/SC/rest/apis/device/"+ this.mac + "/postsbydate?from="+startPoint+"&to="+this.currentPoint;
      var proxyUrl = "https://jsonp.afeld.me/?callback="+df.callbackName+"&url="+finalUrl;
      console.log("Taking data from "+startPoint+" to "+this.currentPoint);
      $.ajax({
        url:proxyUrl,
        jsonp: df.callbackName,
        dataType: "jsonp",
        error:function (xhr, ajaxOptions, thrownError){
          if(xhr.status==404) { //No new data in the previous interval
            console.log("No new data, waiting " + df.updatePeriod/1000 + " seconds");
            setTimeout
            (
              function(){df.getDSData(df.currentPoint)},
              df.updatePeriod
            );
          }
          if(xhr.status==502) {
            console.log("RED CODE! The proxy is down!");
            setTimeout
            (
              function(){df.getDSData(df.currentPoint)},
              df.updatePeriod
            );
          }
        }
      });      
    };
    this.getDSData_callack = function(response)
    {
      console.log(response.length + " new data taken! Waiting " + this.updatePeriod/1000 + " seconds");

      //Store data locally
      var lastData = localStorage.getItem(this.mac);
      var newData = JSON.stringify(response);
      localStorage.setItem(this.mac, lastData==null?newData:lastData+newData);
      localStorage.setItem('currentPoint', this.currentPoint);

      //Call function to update GUI
      this.updateGUI(this.mac);
      setTimeout
      (
        function(){df.getDSData(df.currentPoint)},
        df.updatePeriod
      );
    };
    this.updateGUI = function(id)
    {
        var data = JSON.parse(localStorage.getItem(id));

        var statesArray = [["X", "Air", "Ground", "", ""]];
        var i = 0;
                
        for(var sample_index=0; sample_index<data.length; sample_index++){
            var sample = data[sample_index];
                     
            var air_temp;
            var ground_temp;
            
            var high_line = 21;
            var low_line = 17;
                     
            $.each(sample.sensor_values, function() {
                if(this["local_feed_id"]==1){
                    air_temp = this["average_value"];
                }
                if(this["local_feed_id"]==3){
                    ground_temp = this["average_value"];
                }
                        
                if(air_temp!=null && ground_temp!=null){
                    var stateitem = [i++, air_temp, ground_temp, high_line, low_line];
                    statesArray.push(stateitem);
                }
            })
        }
        
        var options = {
            hAxis: {
              title: 'Sample'
            },
            vAxis: {
              title: 'Temperature'
            },
            colors: ['#a52714', '#097138', '#FF0000', '#FF0000'],
            
            seriesType: "line",
            series: {
                2: {
                    lineDashStyle: [40, 10],
                    lineWidth: 1, 
                    visibleInLegend: false, 
                    areaOpacity: 0},
                3: {
                    lineWidth: 1,
                    lineDashStyle: [40, 10],
                    visibleInLegend: false, 
                    areaOpacity: 0}
                },
        };
        
        var statesData = google.visualization.arrayToDataTable(statesArray);
        var chart = new google.visualization.LineChart(document.getElementById('chart_div'));
        chart.draw(statesData, options);
    }
}


// UTILITY

function getTimestamp()
{
  //add 0 filling
  var d = new Date();
  var year = d.getFullYear();
  var month =   (d.getMonth() + 1)<10?'0'+(d.getMonth() + 1):(d.getMonth() + 1);
  var day =     d.getDate()   <10?'0'+d.getDate()   :d.getDate();
  var hour =    d.getHours()  <10?'0'+d.getHours()  :d.getHours();
  var minute =  d.getMinutes()<10?'0'+d.getMinutes():d.getMinutes();
  var second =  d.getSeconds()<10?'0'+d.getSeconds():d.getSeconds();
  var timestamp = year+"-"+month+"-"+day+"T"+hour+":"+minute+":"+second+"Z";
  return timestamp;
}