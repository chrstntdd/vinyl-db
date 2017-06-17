$(() => {
  // DOCUMENT READY FUNCTIONS

  // CALL FOR USER'S COLLECTION USING THEIR ID STORED IN SESSION, PASSED INTO VIEW, THEN PASSED IN HERE
  getCollection(user._id);
  handleRecordSelection();
  handlePlayCountInc();
});

const getCollection = (userId) => {
  $.ajax({
    method: 'GET',
    url: `/records/${userId}`,
    dataType: 'json',
  }).then((res) => {
    renderRecords(res);
  }).fail((err) => {
    console.error(err);
  });
};

const bindRecordDataToHTML = (res) => {
  let basicRecordHTML = (
    `
    <div id='' class='card'>
        <div class='card-img-container'>
          <img src=''>
        </div>
        <div class="card-title">
            <a href="#" class="toggle-info btn">
              <span class="left"></span>
              <span class="right"></span>
            </a>
            <h2 class='album ellipsis'></h2>
            <h3 class='artist ellipsis'></h3>
        </div>
        <div class="card-flap flap1">
            <div class="card-description">
              <p class='genre'></p>
              <p class='release-year'></p>
              <div class=play-count-container>
                <p class='play-count'></p>
                <p>Spins</p>
                <button class='increment-play-count'>+</button>
              </div>
            </div>
            <div class="card-flap flap2">
                <div class="card-actions">
                    <a id='btn-rec-details' href=''>
                      <button>See more details</button>
                    </a>
                </div>
            </div>
        </div>
    </div>
    `
  );

  let $record = $(basicRecordHTML);
  $record.find('img').attr('src', res.thumb ? res.thumb : '../img/album-art-placeholder.svg');
  $record.find('#btn-rec-details').attr('href', `/collection/details`)
  $record.attr('id', res._id);
  $record.find('.artist').text(`${res.artist}`);
  $record.find('.play-count').text(`${res.playCount}`);
  $record.find('.album').text(`${res.album}`);
  $record.find('.release-year').html(`<i class="fa fa-calendar" aria-hidden="true"></i> ${res.releaseYear}`);
  $record.find('.genre').html(`<i class="fa fa-music" aria-hidden="true"></i> ${res.genre}`);
  return $record;
};

const renderRecords = (res) => {
  // BIND EACH RECORD TO HTML TEMPLATE THEN RENDER
  _.map(res, record => {
    let basicRecordHTML = bindRecordDataToHTML(record);
    $('.cards').append(basicRecordHTML);
  });
};

const handlePlayCountInc = () => {
  $('.cards').on('click', '.increment-play-count', function (e) {
    let currentSpinCount = $(this).siblings('.play-count');
    let selectedRecordId = $(this).closest('.card').attr('id');

    currentSpinCount.html((i, val) => {
      $.ajax({
          method: 'PATCH',
          url: `/records/${user._id}/${selectedRecordId}`,
          data: { increment: true },
        })
        .done(() => {
          return;
        })
        .fail((err) => {
          console.error(err);
        })
      return +val + 1;
    })
  });
};

const handleRecordSelection = () => {
  // SET SELECTED RECORD DISCOGS ID FOR USE IN COLLECTION DETAILS
  $('.cards').on('click', '#btn-rec-details', function (e) {
    let selectedRecordId = $(this).closest('.card').attr('id');
    localStorage.selectedRecordId = selectedRecordId;
    // BUG. CLICK ON LINK WON'T REDIRECT
    window.redirect('/collection/details');
  });
};