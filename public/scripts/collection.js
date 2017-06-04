$(() => {
  // DOCUMENT READY FUNCTIONS
  getCollection();
});

const getCollection = () => {
  $.ajax({
    method: 'GET',
    url: '/records',
    dataType: 'json',
  }).then((res) => {
    renderRecords(res);
  }).fail((err) => {
    console.error(err);
  });
};

const bindRecordDataToHTML = (res) => {
  let basicRecordHTML = (
    `<article id=''>
      <a href=''>
        <img src=''>
        <p class='artist'></p>
        <p class='album'></p>
        <p class='genre'></p>
        <p class='release-year'></p>
      </a>
    </article>`
  );

  let $record = $(basicRecordHTML);
  $record.find('img').attr('src', res.thumb);
  $record.find('a').attr('href', `/records/${res._id}`)
  $record.attr('id', res.discogsId);
  $record.find('.artist').text(`Artist: ${res.artist}`);
  $record.find('.album').text(`Album: ${res.album}`);
  $record.find('.release-year').text(`Released: ${res.releaseYear}`);
  $record.find('.genre').text(`Genre: ${res.genre}`);
  return $record;
};

const renderRecords = (res) => {
  // BIND EACH RECORD TO HTML TEMPLATE THEN RENDER
  _.map(res, record => {
    let basicRecordHTML = bindRecordDataToHTML(record);
    $('#record-collection').append(basicRecordHTML);
  });
}