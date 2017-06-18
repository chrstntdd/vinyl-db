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
              <p class='heading genre'></p>
              <p class='footing'>Genre</p>
            </li>
            <li>
              <p class='heading release-year'></p>
              <p class='footing'>Release Year</p>
            </li>
            <li>
              <p class='heading purchase-date'></p>
              <p class='footing'>Purchase Date</p>
            </li>
            <li>
              <p class='heading play-count'>Spins</p>
              <p class='footing'>Spins</p>
            </li>
            <li>
              <p class='heading mood'></p>
              <p class='footing'>Mood(s)</p>
            </li>
            <li>
              <p class='heading rating'></p>
              <p class='footing'>rating</p>
            </li>
            <li>
              <p class='heading vinyl-color'></p>
              <p class='footing'>Vinyl Color</p>
            </li>
          </ul>
        </div>  
        <p class='notes'></p>
        <a id='edit-record' href='/collection/details/edit'>
          <button>Edit</button>
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
  $record.find('.play-count').text(`${res.playCount}`);
  // OPTIONAL DATA
  if (res.purchaseDate) {
    $record.find('.purchase-date').text(`${res.purchaseDate}`);
  } else {
    $record.find('.purchase-date').closest('li').remove();
  };

  if (res.vinylColor) {
    $record.find('.vinyl-color').text(`${res.vinylColor}`);
    $record.find('.stats').after(`<div class='record'></div>`);
  } else {
    $record.find('.vinyl-color').closest('li').remove();
  };

  if (res.mood.length != 0) {
    $record.find('.mood').text(`${_.join(res.mood, ', ')}`);
  } else {
    $record.find('.mood').closest('li').remove();
  };

  if (res.rating) {
    $record.find('.rating').text(`${res.rating}`);
  } else {
    $record.find('.rating').closest('li').remove();
  };

  if (res.notes) {
    $record.find('.notes').text(`Notes: ${res.notes}`);
  } else {
    $record.find('.notes').closest('li').remove();
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