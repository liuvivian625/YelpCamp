//show页面上显示map的js

//show.ejs开头有script用ejs获得mapToken
maptilersdk.config.apiKey = mapToken;

//display map
const map = new maptilersdk.Map({
  container: 'map', // container's id or the HTML element in which SDK will render the map
  style: maptilersdk.MapStyle.BASIC,
  center: campground.geometry.coordinates, // starting position [lng, lat]
  zoom: 14 // starting zoom
});

// create the popup
var popup = new maptilersdk.Popup({ offset: 25 }).setHTML(
  `<h3>${campground.title}</h3><p>${campground.location}</p>`
);

//display marker
const marker = new maptilersdk.Marker()
  .setLngLat(campground.geometry.coordinates)
  .setPopup(popup) // sets a popup on this marker
  .addTo(map);



