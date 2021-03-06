var CLIENT_ID = 'PUT_YOUR_CLIENT_ID_HERE';
var CLIENT_SECRET = 'PUT_SECRET_HERE';

var map;
var currentToolTip;
var currentPoint;

var placesModel = [
    {
      name: "America Airlines Arena",
      lat: 25.781331, 
      long: -80.187927
    },
    {
      name: 'Mandarin Oriental, Miami',
      lat: 25.765025,
      long: -80.185173
    },
    {
      name: 'Brickell Key Jogging Trail',
      lat: 25.769032,
      long: -80.186610
    },
    {
      name: 'Adrienne Arsht Center',
      lat: 25.787135, 
      long: -80.189716
    },
    {
      name: 'Brickell City Centre',
      lat: 25.767302, 
      long: -80.193264
    }
]


var Place = function (data) { 
  var self = this;

  self.name = ko.observable(data.name);
  self.searchPlace = ko.observable(data.name.toLowerCase());
  self.address = ko.observable();
  self.isHide = ko.observable();
  self.categorie = ko.observable();
  self.likesCount = ko.observable();
  self.isOpen = ko.observable();
  self.rating = ko.observable();
  self.isHereNow = ko.observable();

  var url = 'https://api.foursquare.com/v2/venues/search?v=20161016&ll=';
  url += data.lat + ',';
  url += data.long;
  url += '&intent=global&query=' + data.name;
  url += '&client_id=' + CLIENT_ID + '&client_secret=' + CLIENT_SECRET;
  
  // Search place from Foursquare API
  $.getJSON(url).done(function(data) {
    
    var venueID = data.response.venues[0].id;
    var url = 'https://api.foursquare.com/v2/venues/' + venueID + '?';
    url += 'v=20161016';
    url += '&client_id=' + CLIENT_ID + '&client_secret=' + CLIENT_SECRET;
    
    // Get place details from Foursquare API from ID
    $.getJSON(url).done(function(data) {

      var ret = data.response.venue;
      
      self.address(ret.location.formattedAddress.join(', '));
      self.categorie(ret.categories[0].name);
      self.likesCount(ret.likes.count);
      self.isOpen(ret.popular.isOpen);
      self.rating(ret.rating);
      self.isHereNow(ret.hereNow.count);

    }).fail(function() {
      alert('Foursquare API failure to get the venue details. Please try again later.');
    });

  }).fail(function() {
    alert('Foursquare API failure to get the venues from search. Please try again later.');
  });

  self.point = new google.maps.Marker({
    map: map,
    position: new google.maps.LatLng(data.lat, data.long),
    name: self.name()
  });

  self.setPoint = ko.computed(function() {
    // Check if should hide or show tooltip from point place
    if(self.isHide()) {
      self.point.setMap(null);
    } else {
      self.point.setMap(map);
    }
    return true;
  });

  self.point.addListener('click', function() {
    
    if(currentToolTip) {
      currentToolTip.close();
    }

    var disableBounce = function() {
      currentPoint.setAnimation(null);
      currentPoint = null;
    };

    if(currentPoint)
    {
      disableBounce();
    }
    
    var formatedAddr = self.address().trim();
    var isOpen = (self.isOpen) ? "Open" : "Closed";

    var infoHtml = [
      '<div class="info text-center">',
        '<h3>', self.name(), '</h3>',
        '<h5> Category: ', self.categorie(), '</h5>',
        '<h5> Rating: ', self.rating(), '</h5>',
        '<p>',
        'Now, this place is <strong>', isOpen, '</strong>',
        ' and there is/are <strong>', self.isHereNow(), '</strong> people visiting at this moment.',
        '</p>',
        '<p>',
        '<strong>', self.likesCount(), '</strong> liked to be here.',
        '</p>',
        '<br>',
        '<span class="glyphicon glyphicon-screenshot" aria-hidden="true"></span>',
        '<strong>', formatedAddr, '</strong>',
      '</div>'
    ];

    var newToolTip = new google.maps.InfoWindow({ content: infoHtml.join('') });
    newToolTip.open(map, self.point);

    // Add animation to point place
    self.point.setAnimation(google.maps.Animation.BOUNCE);

    // Update actual place point
    currentToolTip = newToolTip;

    // Get point to disable later
    currentPoint = self.point;

    google.maps.event.addListener(newToolTip, 'closeclick', disableBounce);
  });

  // Implement click event on place
  self.selectLocation = function() {
    google.maps.event.trigger(self.point, 'click');
  };
}

var ViewModel = function () { 
    var self = this;

    this.searchText = ko.observable('');
    this.placeList = ko.observableArray([]);

    map = new google.maps.Map(document.getElementById('mapDiv'), {
      center: { lat: 25.765859, lng: -80.174280 },
      zoom: 14
    });

    // Fill the places list from model
    placesModel.forEach(function (newItem){
      var place = new Place(newItem);  
      place.isHide(false);
      self.placeList.push(place);
    })

    // Implement filter from place list
    this.filteredPlaces = ko.computed(function() {
      return this.placeList().filter(function(place) {
        var state = place.searchPlace().indexOf(this.searchText().toLowerCase()) !== -1;
        place.isHide(!state);
        return state;
      }, this);
    }, this);
}

function init() {
  ko.applyBindings(new ViewModel());
};

onMapsError = function() {
  alert('Google Maps is unavailable. Please try again later.');
};

// Implement toogle button
$("#menu-toggle").click(function(e) {
  e.preventDefault();
  $("#wrapper").toggleClass("toggled");
});
