$(() => {
  // DOCUMENT READY FUNCTIONS
  const selectedRecordId = localStorage.selectedRecordId;
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
  const basicRecordHTML = (
    `<article id=''>
      <div class='wrapper'>
        <header class='header'>
          <img src=''>
        </header>
        <div class='panel header widest-panel'>
          <h1 class='title'></h1>
        </div>
        <div class='panel wide-panel'>
          <p class='heading'>Genre</p>
          <p class='footing genre'></p>
        </div>
        <div class='panel'>
          <p class='heading'>Released</p>
          <p class='footing release-year'></p>
        </div>
        <div class='panel'>
          <p class='heading'>Purchased</p>
          <p class='footing purchase-date'></p>
        </div>
        <div class='panel'>
          <p class='heading'>Rating</p>
          <p class='footing rating'></p>
        </div>
        <div class='panel'>
          <p class='heading'>Vinyl Color</p>
          <p class='footing vinyl-color'></p>
        </div>
        <div class='panel'>
          <p class='heading spins'></p>
          <p class='footing play-count'></p>
        </div>
        <div class='panel'>
          <p class='heading'>Mood</p>
          <p class='footing mood'></p>
        </div>
        <div class='panel footer widest-panel'>
          <p class='heading'>Notes</p>
          <p class='footing notes'></p>
        </div>
        <footer class='btn-group footer'>
          <a href='/collection/details/edit'><button id='edit-record'>Edit</button></a>
          <a href='#'><button id='delete-record'>Delete</button></a>
        </footer>
      </div>
    </article>`
  );

  const $record = $(basicRecordHTML);
  $record.find('img').attr('src', res.thumb);
  $record.attr('id', res.discogsId);
  $record.find('.title').html(`${res.artist} - ${res.album}`);
  $record.find('.release-year').html(`${res.releaseYear}`);
  $record.find('.genre').html(`${_.join(res.genre, ', ')}`);
  if (res.playCount == 1) {
    $record.find('.spins').html('Spin');
  } else {
    $record.find('.spins').html('Spins');
  }
  $record.find('.play-count').html(`${res.playCount}`);
  // OPTIONAL DATA
  if (res.purchaseDate) {
    $record.find('.purchase-date').html(`${res.purchaseDate}`);
  } else {
    $record.find('.purchase-date').closest('div').remove();
  }

  if (res.vinylColor) {
    $record.find('.vinyl-color').html(`${res.vinylColor}`);
    $record.find('.stats').after('<div class=\'record\'></div>');
  } else {
    $record.find('.vinyl-color').closest('div').remove();
  }

  if (res.mood != 0) {
    $record.find('.mood').html(`${res.mood}`);
  } else {
    $record.find('.mood').closest('div').remove();
  }

  if (res.rating) {
    $record.find('.rating').html(`${res.rating}`);
  } else {
    $record.find('.rating').closest('div').remove();
  }

  if (res.notes) {
    $record.find('.notes').html(`${res.notes}`);
  } else {
    $record.find('.notes').closest('.panel').remove();
  }

  return $record;
};

const renderRecord = (res) => {
  // BIND EACH RECORD TO HTML TEMPLATE THEN RENDER
  const basicRecordHTML = bindRecordDataToHTML(res);
  $('#record-details').append(basicRecordHTML);
};

const handleModal = () => {
  let deleteModal = $('.global-modal');
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

const handleEdit = () => {
  $('#edit-record').on('click', (e) => {
    window.location.replace('/collection/details/edit');
  });
};
