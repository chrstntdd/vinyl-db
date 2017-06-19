$(() => {
  // DOCUMENT READY FUNCTIONS
  handleSearch();
  handleLogout();
});


const handleSearch = () => {
  $('#search-form').on('submit', (e) => {
    e.preventDefault();
    $('#results').html(''); // CLEAR OLD SEARCH RESULTS
    let searchRequest = {
      artist: _.trim(_.toLower($('#search-artist').val())),
      album: _.trim(_.toLower($('#search-album').val())),
    }
    callDiscogsAPI(JSON.stringify(searchRequest));
  });
};

const callDiscogsAPI = (searchRequest) => {
  $.ajax({
      type: 'POST',
      url: '/search',
      processData: false,
      data: searchRequest,
      contentType: 'application/json'
    })
    .done((data) => {
      if (data) {
        window.location.replace('/search/results');
      } else {
        window.location.replace('/search');
      }
    })
    .fail((err) => {
      console.error(`Request Failed: ${err}`);
    });
};

const handleLogout = () => {
  $('nav #logout').on('click', (e) => {
    localStorage.clear();
  });
};