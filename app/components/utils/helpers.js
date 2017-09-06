// Include the axios package for performing HTTP requests (promise based alternative to request)
var axios = require("axios");
// Key for Google Place API
const googleApi = {
    key: 'AIzaSyD7ZhwbUi-N6KzufXETDFGoIgoP4spZplA',
    url: 'https://maps.googleapis.com/maps/api/place/textsearch/json?query='
};


// Helper functions for making API Calls
var helper = {
    // This function serves our purpose of running the query to geolocate.
    runQuery: function(place) {
        console.log('called function');
    }
};

// We export the API helper
module.exports = helper;