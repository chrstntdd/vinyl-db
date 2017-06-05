$(() => {
  // DOCUMENT READY FUNCTIONS
  let selectedRecordId = localStorage.tempDataStore;
  getRecordDetails(selectedRecordId);
  
  handleModal();
  handleDelete(selectedRecordId);
});

const getRecordDetails = (selectedRecordId) => {
  $.ajax({
    method: 'GET',
    url: `/records/${selectedRecordId}`,
    dataType: 'json',
  }).then((res) => {
    renderRecord(res);
  }).fail((err) => {
    console.error(err);
  });
};

const bindRecordDataToHTML = (res) => {
  let basicRecordHTML = (
    `<article id=''>
        <img src=''>
        <p class='title'></p>
        <p class='genre'></p>
        <p class='release-year'></p>
        <p class='purchase-date'></p>
        <p class='play-count'></p>
        <p class='vinyl-color'></p>
        <p class='mood'></p>
        <p class='rating'></p>
        <p class='notes'></p>
        <a id='edit-record' href='/collection/details/edit'>
          <button>Edit details</button>
        </a>
        <button id='delete-record'>Delete</button>
    </article>`
  );

  let $record = $(basicRecordHTML);
  $record.find('img').attr('src', res.thumb);
  $record.attr('id', res.discogsId);
  $record.find('.title').text(`${res.artist} - ${res.album}`);
  $record.find('.release-year').text(`${res.releaseYear}`);
  $record.find('.genre').text(`${_.join(res.genre, ', ')}`);
  $record.find('.play-count').text(`${res.playCount} Spins`);
  // OPTIONAL DATA
  if (res.purchaseDate) {
    $record.find('.purchase-date').text(`Purchased on ${res.purchaseDate}`);
  } else {
    $record.find('.purchase-date').remove();
  };

  if (res.vinylColor) {
    $record.find('.vinyl-color').text(`Vinyl Color: ${res.vinylColor}`);
    $record.find('.vinyl-color').after(`<div class='record'></div>`);
  } else {
    $record.find('.vinyl-color').remove();
  };

  if (res.mood.length != 0) {
    $record.find('.mood').text(`Mood(s): ${_.join(res.mood, ', ')}`);
  } else {
    $record.find('.mood').remove()
  };

  if (res.rating) {
    $record.find('.rating').text(`Rating: ${res.rating}`);
  } else {
    $record.find('.rating').remove();
  };

  if (res.notes) {
    $record.find('.notes').text(`Notes: ${res.notes}`);
  } else {
    $record.find('.notes').remove()
  };

  return $record;
};

const renderRecord = (res) => {
  // BIND EACH RECORD TO HTML TEMPLATE THEN RENDER
  let basicRecordHTML = bindRecordDataToHTML(res);
  $('#record-details').append(basicRecordHTML);
};

const handleModal = () => {
  var deleteModal = $('.global-modal');
  $('#record-details').on('click', '#delete-record', (e) => {
    e.preventDefault();
    $(deleteModal).toggleClass('global-modal-show');
  });
  $('.overlay').on('click', () => {
    $(deleteModal).toggleClass('global-modal-show');
  });
  $('.btn-return').on('click', () => {
    $(deleteModal).toggleClass('global-modal-show');
  });
};

const handleDelete = (selectedRecordId) => {
  $('.btn-delete').on('click', (e) => {
    $.ajax({
        method: 'DELETE',
        url: `/records/${selectedRecordId}`,
      })
      .done((res) => {
        window.location.replace('/collection');
      })
      .fail((err) => {
        console.error(err);
      });
  });
};
