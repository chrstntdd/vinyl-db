$(() => {
  // DOCUMENT READY FUNCTIONS
  let tempDataStore = JSON.parse(sessionStorage.tempDataStore);
  populate($('#record-details form'), tempDataStore);
  sessionStorage.clear();
  handleDetailsSubmit();
});

const populate = (form, data) => {
  $.each(data, (key, value) => {
    $(`[name=${key}]`, form).val(value);
  });
};

const handleDetailsSubmit = () => {
  $('#record-details form').on('submit', (e) => {
    e.preventDefault();
    const formData = $('#record-details form').serializeJSON();

    $.ajax({
      method: 'POST',
      url: '/records',
      processData: false,
      dataType: 'json',
      contentType: 'application/json',
      data: formData,
    })
      .done((data) => {
        console.log(`${data.album} has been added to your collection!`);
      })
      .fail((err) => {
        console.log(err);
      });
  });
};
