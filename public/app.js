$(() => {
  // document ready functions
  handleSearch();
});

window.state = {

}

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
}

const callDiscogsAPI = (searchRequest) => {
  const request = $.ajax({
    type: 'POST',
    url: '/search',
    processData: false,
    data: searchRequest,
    contentType: 'application/json'
  });
  request.done((data) => {
    console.log(data);
    if (data.error){
      renderNoResultsFound(data.error);
    } else {
      renderRecord(data[0]);
    }
  });
  request.fail((jqXHR, textStatus) => {
    console.error(`Request Failed: ${textStatus}`);
  });
};

const bindToHTML = (data) => {
  let recordHTML = (
    `<li id=''>
      <img src=''>
      <p class='artist'></p>
      <p class='album'></p>
      <p class='releaseYear'></p>
      <p class='genre'></p>
      <a href='#' class='select-record'>Add</a>
    </li>`
  );

  let $record = $(recordHTML);

  // DECONSTRUCT ARTIST NAME AND ALBUM TITLE FROM API RESPONSE
  let artist = _.trim(data.title.substr(0,(data.title + '-').indexOf('-')));
  let album = _.trim(data.title.substr(data.title.indexOf('-') + 1));

  $record.data(data);
  $record.find('img').attr('src', data.thumb);
  $record.attr('id', data.id);
  $record.find('.artist').text((artist));
  $record.find('.album').text((album));
  $record.find('.releaseYear').text(data.year);
  if (data.style.length > 0){
    $record.find('.genre').text(data.style[0]);
  } else {
    $record.find('.genre').text(data.genre[0]);
  }

  return $record;
};

const renderRecord = (data) => {
  let recordHTML = bindToHTML(data);
  $('#results').append(recordHTML);
  renderCreateCustomRecordBtn();
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
}

const renderCreateCustomRecordBtn = () => {
  if ($('#custom-btn').length == 0){
    $('#results').after(`<a id='custom-btn' href='#'>Create Custom</a>`);
  }
}

