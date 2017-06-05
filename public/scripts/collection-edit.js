$(() => {
  // DOCUMENT READY FUNCTIONS
  let selectedRecordId = localStorage.tempDataStore;
  getRecordDetails(selectedRecordId);
  handlePutRecordDetails(selectedRecordId);
});

const populate = (form, data) => {
  $.each(data, (key, value) => {
    $(`[name=${key}]`, form).val(value);
  });
};

const getRecordDetails = (selectedRecordId) => {
  $.ajax({
      method: 'GET',
      url: `/records/${selectedRecordId}`,
      processData: false,
      dataType: 'json',
      contentType: 'application/json',
    })
    .done((res) => {
      populate($('#record-details form'), res);
    })
    .fail((err) => {
      console.error(err);
    });
};

const handlePutRecordDetails = (selectedRecordId) => {
  $('#record-details form').on('submit', (e) => {
    e.preventDefault();
    let formData = $('#record-details form').serializeJSON();
    formData.id = selectedRecordId;

    $.ajax({
        method: 'PUT',
        url: `/records/${selectedRecordId}`,
        processData: false,
        dataType: 'json',
        contentType: 'application/json',
        data: formData,
      })
      .done((data) => {
        window.location.replace('/collection/details');
      })
      .fail((err) => {
        console.error(err);
      });
  });
};