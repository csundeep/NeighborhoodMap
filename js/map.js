var map;
var clientID;
var clientSecret;

var infoWindow;

//Formatting the phone number
function formatPhone(phonenum) {
    var regexObj = /^(?:\+?1[-. ]?)?(?:\(?([0-9]{3})\)?[-. ]?)?([0-9]{3})[-. ]?([0-9]{4})$/;
    if (regexObj.test(phonenum)) {
        var parts = phonenum.match(regexObj);
        var phone = "";
        if (parts[1]) {
            phone += "+1 (" + parts[1] + ") ";
        }
        phone += parts[2] + "-" + parts[3];
        return phone;
    }
    else {
        return phonenum;
    }
}

//Functionality to set marker and populate it's info window for each location
var Location = function (data) {


    var self = this;
    self.name = data.title;
    self.lat = data.location.lat;
    self.long = data.location.lng;
    self.URL = "";
    self.street = "";
    self.city = "";
    self.phone = "";

    // This location marker visible on the map
    this.visible = ko.observable(true);


    var url = 'https://api.foursquare.com/v2/venues/search?ll=' + data.location.lat + ',' + data.location.lng + '&client_id=' + clientID + '&client_secret=' + clientSecret + '&v=20160118' + '&query=' + data.title;
    //Calling foursquare api to get address of the locations
    $.getJSON(url).done(function (data) {
        var results = data.response.venues[0];
        if (results) {
            self.URL = results.url;
            if (typeof self.URL === 'undefined') {
                self.URL = "";
            }
            self.street = results.location.formattedAddress[0];
            self.city = results.location.formattedAddress[1];
            self.phone = results.contact.phone;
        }
        if (typeof self.phone === 'undefined') {
            self.phone = "";
        } else {
            self.phone = formatPhone(self.phone);
        }
    }).fail(function () {
        alert("Error getting address for " + data.title);
    });


    this.marker = new google.maps.Marker({
        position: data.location,
        title: data.title,
        animation: google.maps.Animation.DROP
    });


    this.showMarker = ko.computed(function () {
        if (this.visible() === true) {
            this.marker.setMap(map);
        } else {
            this.marker.setMap(null);
        }
        return true;
    }, this);


    // Listener to populate marker's info window
    this.marker.addListener('click', function () {


        self.contentString = '<div ><div><b>' + data.title + "</b></div>" +
            '<div><a href="' + self.URL + '">' + self.URL + "</a></div>" +
            '<div >' + self.street + "</div>" +
            '<div>' + self.city + "</div>" +
            '<div ><a href="tel:' + self.phone + '">' + self.phone + "</a></div></div>";

        console.log(self.contentString);
        infoWindow.setContent(self.contentString);

        infoWindow.open(map, this);

        self.marker.setAnimation(google.maps.Animation.BOUNCE);
        setTimeout(function () {
            self.marker.setAnimation(null);
        }, 2100);
    });

    // Triggers the selected marker on the map
    this.selectLocation = function (place) {
        google.maps.event.trigger(self.marker, 'click');
    };
};


var ViewModel = function () {


    // FourSquare API client is and client secret id
    clientID = "QP0I4A4N1SHDRADILAQGCIXMBFQTS2EB2MUYKMHNEJLRUCU2";
    clientSecret = "PKW3CMMSCXOGOI2KGBT1F4RZNXGWVGIVPNPRKYGSP5HZSYHZ";

    var self = this;

    self.locationList = ko.observableArray([]);
    self.searchData = ko.observable("");
    bounds = new google.maps.LatLngBounds();


    // Setting up map on Manhattan location
    map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: 40.7413549, lng: -73.9980244},
        zoom: 13,
        mapTypeControl: false
    });


    $.getJSON("locations.json", function (data) {
        var items = [];
        $.each(data, function (i, item) {
            self.locationList.push(new Location(item));
        });

    });




    // Filtering the list locations from the search box input
    this.filteredList = ko.computed(function () {
        var filter = self.searchData().toLowerCase();
        if (!filter) {
            self.locationList().forEach(function (locationItem) {
                locationItem.visible(true);
            });
            return self.locationList();
        } else {
            return ko.utils.arrayFilter(self.locationList(), function (locationItem) {
                var string = locationItem.name.toLowerCase();
                var result = (string.search(filter) >= 0);
                locationItem.visible(result);
                return result;
            });
        }
    }, self);


};
function initMap(markers) {
    ko.applyBindings(new ViewModel());
}

function errorHandling() {
    alert("Google Maps has failed to load. Please check your internet connection and try again.");
}