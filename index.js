
var df;

$(document).ready(function() {

	
	
    google.charts.load('current', {packages: ['corechart', 'line']});
    google.charts.setOnLoadCallback(function(){df = new DemetraFrontend("80:1F:02:87:82:8D"); df.startSync("2016-03-30T00:00:00Z")});
    
    

});



