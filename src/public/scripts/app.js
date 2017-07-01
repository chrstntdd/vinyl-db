$(() => {
  // DOCUMENT READY FUNCTIONS
  handleSearch();
  handleLogout();
  handleRecordResult();
});

const handleSearch = () => {
  $('#search-form').on('submit', e => {
    e.preventDefault();
    $('#results').html(''); // CLEAR OLD SEARCH RESULTS
    const searchRequest = {
      artist: _.trim(_.toLower($('#search-artist').val())),
      album: _.trim(_.toLower($('#search-album').val())),
    };
    callDiscogsAPI(JSON.stringify(searchRequest));
  });
};

const callDiscogsAPI = searchRequest => {
  $.ajax({
    type: 'POST',
    url: '/search',
    processData: false,
    data: searchRequest,
    contentType: 'application/json',
  })
    .done(data => {
      if (data) {
        window.location.replace('/search/results');
      } else {
        window.location.replace('/search');
      }
    })
    .fail(err => {
      console.error(`Request Failed: ${err}`);
    });
};

const handleLogout = () => {
  $('nav #logout').on('click', e => {
    localStorage.clear();
  });
};

const handleRecordResult = () => {
  $('.vinyl').on({
    click() {
      if ($('.vinyl__record').hasClass('peek')) {
        $(this).toggleClass('active');
        $('.vinyl__record').removeClass('peek');
      } else {
        $(this).toggleClass('active');
      }
    },
    mouseenter() {
      if (!$(this).hasClass('active')) {
        $('.info, .vinyl__record, .vinyl__cover').addClass('peek');
      }
    },
    mouseleave() {
      $('.info, .vinyl__record, .vinyl__cover').removeClass('peek');
    },
  });
};
