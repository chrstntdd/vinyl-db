$(() => {
  // DOCUMENT READY FUNCTIONS
  let selectedRecordId = localStorage.selectedRecordId;
  getRecordDetails(user._id, selectedRecordId);

  handleModal();
  handleDelete(user._id, selectedRecordId);
});

const getRecordDetails = (userId, selectedRecordId) => {
  $.ajax({
    method: 'GET',
    url: `/records/${userId}/${selectedRecordId}`,
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
        <h1 class='title'></h1>
        <div class='stats'>
          <ul>
            <li>
              <p class='heading'>Genre</p>
              <p class='footing genre'></p>
            </li>
            <li>
              <p class='heading'>Released</p>
              <p class='footing release-year'></p>
            </li>
            <li>
              <p class='heading'>Purchased</p>
              <p class='footing purchase-date'></p>
            </li>
            <li>
              <p class='heading spins'></p>
              <p class='footing play-count'></p>
            </li>
            <li>
              <p class='heading'>Mood</p>
              <p class='footing mood'></p>
            </li>
            <li>
              <p class='heading'>Rating</p>
              <p class='footing rating'></p>
            </li>
            <li>
              <p class='heading'>Vinyl Color</p>
              <p class='footing vinyl-color'></p>
            </li>
          </ul>
        </div>
        <div class='notes-container'>
          <p class='heading'>Notes</p>
          <p class='footing notes'></p>
        </div>
        <div class='btn-group'>
          <a id='edit-record' href='/collection/details/edit'>
            <button>Edit</button>
          </a>
          <button id='delete-record'>Delete</button>
        </div>
    </article>`
  );

  let $record = $(basicRecordHTML);
  $record.find('img').attr('src', res.thumb);
  $record.attr('id', res.discogsId);
  $record.find('.title').html(`${res.artist} - ${res.album}`);
  $record.find('.release-year').html(`${res.releaseYear}`);
  $record.find('.genre').html(`${_.join(res.genre, ', ')}`);
  if (res.playCount == 1){
    $record.find('.spins').html('Spin')
  } else {
    $record.find('.spins').html('Spins')
  }
  $record.find('.play-count').html(`${res.playCount}`);
  // OPTIONAL DATA
  if (res.purchaseDate) {
    $record.find('.purchase-date').html(`${res.purchaseDate}`);
  } else {
    $record.find('.purchase-date').closest('li').remove();
  };

  if (res.vinylColor) {
    $record.find('.vinyl-color').html(`${res.vinylColor}`);
    $record.find('.stats').after(`<div class='record'></div>`);
  } else {
    $record.find('.vinyl-color').closest('li').remove();
  };

  if (res.mood != 0) {
    $record.find('.mood').html(`${res.mood}`);
  } else {
    $record.find('.mood').closest('li').remove();
  };

  if (res.rating) {
    $record.find('.rating').html(`${res.rating}`);
  } else {
    $record.find('.rating').closest('li').remove();
  };

  if (res.notes) {
    $record.find('.notes').html(`${res.notes}`);
  } else {
    $record.find('.notes').closest('.notes-container').remove();
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

const handleDelete = (userId, selectedRecordId) => {
  $('.btn-delete').on('click', (e) => {
    $.ajax({
        method: 'DELETE',
        url: `/records/${userId}/${selectedRecordId}`,
      })
      .done((res) => {
        window.location.replace('/collection');
      })
      .fail((err) => {
        console.error(err);
      });
  });
};
