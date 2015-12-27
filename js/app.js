"use strict";
//MODEL
var places = [
	{
		pname: "Queen Mother",
		address: "208 Queen St W",
		postalcode: "M5V 1Z2",
		lat: 43.65057817,
		lng: -79.38911676,
		cuisine: "Fusion"
	},
	{
		pname: "Villa Restaurant",
		address: "2277 Bloor St W",
		postalcode: "M6S 1P1",
		lat: 43.6505038,
		lng: -79.4786229,
		cuisine: "Italian"
	},
	{
		pname: "Kupfert & Kim",
		address: "100 King St W",
		postalcode: "MX5 1C7",
		lat: 43.6485365,
		lng: -79.3820395,
		cuisine: "Vegan"
	},
	{
		pname: "Bunner's Bake Shop",
		address: "3054 Dundas St W",
		postalcode: "M6P 1Z7",
		lat: 43.6656916,
		lng: -79.4714453,
		cuisine: "Deserts"
	},
	{
		pname: "Live Organic Food Bar",
		address: "264 Dupont St",
		postalcode: "M5R 1V7",
		lat: 43.6750749,
		lng: -79.4067787,
		cuisine: "Vegan"
	}
];

//VIEW MODEL
var viewModel = function(){
	var self = this;
	//user input
	self.searchtext = ko.observable("");
	//foursquare variables
	var CLIENT_ID_Foursquare = 'N4AYC3BD4ILYEZIC3L5VKUVLX4RB1AZ4BKSJBGDZXT5MBNUF';
	var CLIENT_SECRET_Foursquare = '1J2ZQG2RWSFW1FN5KHDJJVJRBQGLIEZBHHLE4KOZI5YGCU3K';
	//basic map build
	self.mapCanvas = document.getElementById('map-canvas');
	var toronto = new google.maps.LatLng(43.68351525, -79.47595596);
	var mapOptions = {
			map: self.mapLoad,
			center: toronto,
			zoom: 12,
			mapTypeId: google.maps.MapTypeId.ROADMAP
		};
	self.map = new google.maps.Map(self.mapCanvas, mapOptions);
	//arrays
	self.placeList = [];  //all locations
	self.visible = ko.observableArray([]);  //visible markers
	//button code
	self.button1Visible = ko.observable(false);
	self.toggle1 = function(){
		self.button1Visible(!self.button1Visible());
	};
	//Create an array of all locations
	places.forEach(function(place) {
		self.placeList.push(new Location (place));
	});
	//Toggle bounce animation
	self.toggleBounce = function(clicked) {
		//stop animation of previous selected
		self.placeList.forEach(function(place) {
			place.marker.setAnimation(null);
			//set timeout of 3000ms for any clicked markers
			setTimeout(function() {
				place.marker.setAnimation(null)
			}, 3000);
		});
		if (clicked.getAnimation() !== null) {
			clicked.setAnimation(null);
		} else {
			clicked.setAnimation(google.maps.Animation.BOUNCE);
		}
	};
	//Initialize map
	self.placeList.forEach(function(place) {
		//Marker content
		var coords = new google.maps.LatLng(place.lat(), place.lng());
		var markerCredentials = new google.maps.Marker({
			position: coords,
			address: place.address(),
			cuisine: place.cuisine(),
			pname: place.pname(),
			postalcode: place.postalcode(),
			animation: google.maps.Animation.DROP
			//contents: contentString
		});
	//Foursquare API
		$.ajax({
			type: "GET",
			dataType: 'json',
			cache: false,
			url: 'https://api.foursquare.com/v2/venues/explore',
			data: 'll=' + place.lat() + ',' + place.lng() + '&query=' + place.pname() + '&client_id=' + CLIENT_ID_Foursquare + '&client_secret=' + CLIENT_SECRET_Foursquare + '&v=20151226&m=foursquare',
			async: true,
			//Save venue rating
			success: function(data) {
				place.rating = data.response.groups[0].items[0].venue.rating;
				if (!place.rating) {
					place.rating = 'No Foursquare rating';
				}
				//Callback once foursquare has loaded
				outputStuff();
				visiblePush();
			},
			//Error handling
			error: function(data) {
				alert("Could not load Foursquare data.");
			}
		});
		//Run this fun
		function outputStuff(){
			//Infowindow content
			var contentString = '<div id="content">' + '<h4>' + place.pname() + '</h4>' +
								'<h5>' +"Foursquare Rating: "+ place.rating + '</h5>' +
								'<p>' + place.address() + '</p>' +
								'<p>' + place.cuisine() + '</p>' +
								'<p>' + place.postalcode() + '</p>' + '</div>';
			var infowindow = new google.maps.InfoWindow({content: contentString});
			//Marker content
			var coords = new google.maps.LatLng(place.lat(), place.lng());
			var markerCredentials = new google.maps.Marker({
				position: coords,
				address: place.address(),
				cuisine: place.cuisine(),
				pname: place.pname(),
				postalcode: place.postalcode(),
				animation: google.maps.Animation.DROP,
				contents: contentString
			});
			//add marker credentials to placeList array
			place.marker = new google.maps.Marker(markerCredentials);
			//add infowindow content to placeList array
			place.marker.infoWindow = infowindow;
			//Add Event Listener
			google.maps.event.addListener(place.marker, "click", (function(marker, contentString, infoWindow){
				return function(){
					infowindow.setContent(contentString);
					infowindow.open(self.map,this);
					self.map.panTo(place.marker.position);
					self.toggleBounce(place.marker);
				};
			})(place.marker, contentString,infowindow));
		}
		//Set all content to visible to start and load markers
		function visiblePush() {
				self.visible.push(place);
				place.marker.setMap(self.map);
		}
	});
	//Filter the visible markers as content is typed into the search bar
	self.filterMarkers = function() {
		var search = self.searchtext().toLowerCase();
		self.visible.removeAll();
		//check if input matches place name
		self.placeList.forEach(function(place) {
			place.marker.setMap(null);
			if (place.pname().toLowerCase().indexOf(search) !== -1) {
				self.visible.push(place);
			};
		});
		//push markers to map if they match the user input
		self.visible().forEach(function(place) {
			place.marker.setMap(self.map);
		});
	};
	//Place constructor
	function Location (data){
		this.pname = ko.observable(data.pname);
		this.address = ko.observable(data.address);
		this.postalcode = ko.observable(data.postalcode);
		this.lat = ko.observable(data.lat);
		this.lng = ko.observable(data.lng);
		this.cuisine = ko.observable(data.cuisine);
		this.marker = null;
		this.rating = null;
		this.openInfoWindow = function (){
			this.marker.infoWindow.open(self.map,this.marker);
			self.toggleBounce(this.marker)
		};
	}
}
ko.applyBindings(new viewModel());