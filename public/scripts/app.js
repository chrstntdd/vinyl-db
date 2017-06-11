$(() => {
  // document ready functions
  handleSearch();
  handleLogout();
});


const handleSearch = () => {
  $('#search-form').on('submit', (e) => {
    e.preventDefault();
    $('#results').html(''); // CLEAR OLD SEARCH RESULTS
    let searchRequest = {
      artist: _.startCase($('#search-artist').val()),
      album: _.startCase($('#search-album').val()),
    }
    callDiscogsAPI(JSON.stringify(searchRequest));
    setTimeout(() => {
      $('#search-artist').val('');
      $('#search-album').val('');
    }, 1000);
  });
};

const callDiscogsAPI = (searchRequest) => {
  const request = $.ajax({
    type: 'POST',
    url: '/search',
    processData: false,
    data: searchRequest,
    contentType: 'application/json'
  });
  request.done((data) => {
    data.error ?
      renderNoResultsFound(data.error) :
      getRelevantData(data[0]);
  });
  request.fail((jqXHR, textStatus) => {
    console.error(`Request Failed: ${textStatus}`);
  });
};

const getRelevantData = (data) => {
  const recordData = {
    // DECONSTRUCT ARTIST NAME AND ALBUM TITLE FROM API RESPONSE
    artist: _.trim(data.title.substr(0, (data.title + '-').indexOf('-'))),
    album: _.trim(data.title.substr(data.title.indexOf('-') + 1)),
    releaseYear: data.year,
    // USE STYLE PROPERTY FOR GENRE IF IT EXISTS.
    genre: data.style.length > 0 ? data.style[0] : data.genre[0],
    thumb: data.thumb,
    discogsId: data.id,
  }
  renderRecord(recordData);
  tempStoreData(recordData);
}

const bindToHTML = (recordData) => {
  let recordHTML = (
    `<li id=''>
      <img src=''>
      <p class='artist'></p>
      <p class='album'></p>
      <p class='releaseYear'></p>
      <p class='genre'></p>
      <a href='/search/details' class='select-record'>Add</a>
    </li>`
  );

  let $record = $(recordHTML);

  $record.find('img').attr('src', recordData.thumb);
  $record.attr('id', recordData.discogsId);
  $record.find('.artist').text(recordData.artist);
  $record.find('.album').text(recordData.album);
  $record.find('.releaseYear').text(recordData.year);
  $record.find('.genre').text(recordData.genre);

  return $record;
};

const renderRecord = (data) => {
  let recordHTML = bindToHTML(data);
  $('#results').append(recordHTML);
};

const renderNoResultsFound = (error) => {
  let noResultsHTML = (
    `<li>
      <p class='error-message'></p>
    </li>`
  );
  let $error = $(noResultsHTML);
  $error.find('.error-message').text(error);
  $('#results').append($error);
};

const tempStoreData = (recordData) => {
  // SET OBJECT IN STORAGE
  sessionStorage.tempDataStore = JSON.stringify(recordData);
}

const handleLogout = () => {
  $('nav #logout').on('click', (e) => {
    localStorage.clear();
  });
};

// FEATURE FOR A LATER DATE

// const handleCustomBtn = () => {
//   // FORGO POPULATING DETAILS FORM WHEN CREATING A CUSTOM RECORD
//   $('#custom-btn').on('click', (e) => {
//     sessionStorage.clear();
//   });
// };