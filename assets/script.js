//Identify global variables for later use
let cityLat = 0;
let cityLon = 0;
let cityName = '';
let countryCode = '';
let tempTxt = 0;
let humidity = 0;
let windSpeed = 0;
let uvIndex = 0;
let iconName = '';
let iconURL = 'https://openweathermap.org/img/wn/';
let weatherIcon = '';
let weatherInfo = 'https://api.openweathermap.org/data/2.5/';
let fivedayrequest = 'https://api.openweathermap.org/data/2.5/forecast?q=';
let uvi = 'uvi?'
const apiKey = "&appid=" + config.OpWe_APIkey;
let searchHistory = {};

//Function to save searched cities/data in local storage.
let saveToLocalStorage = (searchHx => {
  return localStorage.setItem('searchHistory', JSON.stringify(searchHx));
});

//Function to place searched cities in city list.
const addToSearchHistory = (searchString, timeStamp) => {
  let obj = {
    "searchString": searchString,
    "timeStamp": timeStamp
  }
  let searchHx = JSON.parse(localStorage.getItem('searchHistory'));
  if (!searchHx) {
    searchHx = [];
  }

  let len = searchHx.length;
  let inArray = false;
  for (let i = 0; i < len; ++i) {
    if (searchHx[i].searchString === obj.searchString) {
      searchHx[i].timeStamp = obj.timeStamp;
      inArray = true;
    }
  }

  if (inArray === false) {
    searchHx.push(obj);
  }

  searchHx.sort((b, a) => {
    return a.timeStamp - b.timeStamp;
  });

  saveToLocalStorage(searchHx);
}

//Function to pull search history from local storage.
const renderSearchHistory = () => {
  let searchHx = JSON.parse(localStorage.getItem('searchHistory'));
  if (searchHx) {
    arrayLength = searchHx.length;
    for (let i = 0; i < arrayLength; ++i) {
      $(`#row${i}`).html(`<td><button class="recent btn btn-link p-0 text-muted">${searchHx[i].searchString}</button></td>`);
    }
  }
}

//Function to display search history in designated area when page is loaded.
$(document).ready(() => {
  renderSearchHistory();
})

//Function to display data when city name in search list is clicked on.
$("table").on("click", "button.recent", function () {
  event.preventDefault();
  getWeatherInformation($(this).text());
});


let initializeLocalStorage = (() => {
  localStorage.setItem('searchHistory', '[]');
});

//Function to make search button work as intended.
$('#city-search').click(() => {
  event.preventDefault();
  let citySearchString = validatedSearchString($('input').attr("placeholder", "City Name").val());
  getWeatherInformation(citySearchString);
})

//Function to allow user to initiate search for desired city.
$('input').keypress(event => {
  if (event.which == 13) {
    event.preventDefault();
    let citySearchString = validatedSearchString($('input').attr("placeholder", "City Name").val());
    getWeatherInformation(citySearchString);
  }
})

//Function to allow user to search for desired city.
let validatedSearchString = (city => {
  let search = city.split(',');
  if (search.length > 1) {
    let first = search[0].length;
    let second = search[1].length;
    if (first === 0 || second === 0) {
      return first > second ? search[0] : search[1];
    }
    return search[0] + ',' + search[1];
  } else {
    return city;
  }
})

//Function to retrieve data from weather api using api key.
let getWeatherInformation = (citySearchString => {
  let cityQuery = 'weather?q=' + citySearchString;
  $.ajax({
    url: weatherInfo + cityQuery + apiKey,
    method: "GET",
    error: (err => {
      err = alert("Your city was not found.")
      return;
    })
  })
    .then((response) => {
      cityLat = response.coord.lat;
      cityLon = response.coord.lon;
      cityName = response.name;
      countryCode = response.sys.country;
      tempTxt = response.main.temp;
      humidity = response.main.humidity;
      windSpeed = response.wind.speed;
      iconName = response.weather[0].icon;
    })
    .then(() => {
      return $.ajax({
        url: weatherInfo + uvi + apiKey + '&lat=' + cityLat + '&lon=' + cityLon,
        method: "GET"
      })
        .then(response => {
          uvIndex = response.value;
        })
        .then(() => {
          showValuesOnPage();
        })
    })

  $.ajax({
    url: fivedayrequest + citySearchString + apiKey,
    method: "GET"
  })
    .then(response => {
      return setFiveDayData(response);
    })
})

//Function to display current date and time in designated format.
let dateString = (unixTime => {
  return moment(unixTime).format('MM/DD/YYYY');
})

//Function to display retrieved data on page.
let showValuesOnPage = (() => {
  let searchString = cityName + ', ' + countryCode;
  $('#city-name').text(searchString + ' (' + dateString(Date.now()) + ')');
  addToSearchHistory(searchString, Date.now());
  renderSearchHistory();
  $('#weather-icon').attr('src', iconURL + iconName + '.png')
  $('#temp-data').text('Temperature: ' +
    (tempTxt - 273.15).toFixed(2) + ' ' + String.fromCharCode(176) + 'C (' +
    ((tempTxt - 273.15) * 9 / 5 + 32).toFixed(2) + ' ' + String.fromCharCode(176) + 'F)');
  $('#hum-data').text('Humidity: ' + humidity + '%');
  $('#wind-data').text('Wind Speed: ' + windSpeed + ' MPH');
  $('#uvi-data').text('UV Index: ' + uvIndex);
});

//Function to display five day forecast from retrieved data.
let setFiveDayData = (response => {
  let dataArray = response.list;
  let size = dataArray.length;
  let dayNumber = 1;
  //Loop to change data in each column to relevant day.
  for (let i = 0; i < size; i += 8) {
    $(`#five-day-${dayNumber}`).find('h6').text(dateString(dataArray[i].dt * 1000));
    $(`#five-day-${dayNumber}`).find('.weather-icon').attr('src', iconURL + dataArray[i].weather[0].icon + '.png');
    $(`#five-day-${dayNumber}`).find('.temp-5').text('Temperature: ' +
      (dataArray[i].main.temp - 273.15).toFixed(2) + ' ' + String.fromCharCode(176) + 'C (' +
      ((dataArray[i].main.temp - 273.15) * 9 / 5 + 32).toFixed(2) + ' ' + String.fromCharCode(176) + 'F)');
    $(`#five-day-${dayNumber}`).find('.hum-5').text('Humidity: ' + dataArray[i].main.humidity + '%');
    ++dayNumber;
  }
})