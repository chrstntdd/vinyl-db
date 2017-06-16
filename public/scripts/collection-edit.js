$(() => {
  // DOCUMENT READY FUNCTIONS
  let selectedRecordId = localStorage.selectedRecordId;
  getRecordDetails(user._id, selectedRecordId);
  handlePutRecordDetails(user._id, selectedRecordId);
});

const populate = (form, data) => {
  $.each(data, (key, value) => {
    $(`[name=${key}]`, form).focus();
    $(`[name=${key}]`, form).val(value);
  });
};

const getRecordDetails = (userId, selectedRecordId) => {
  $.ajax({
      method: 'GET',
      url: `/records/${userId}/${selectedRecordId}`,
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

const handlePutRecordDetails = (userId, selectedRecordId) => {
  $('#record-details form').on('submit', (e) => {
    e.preventDefault();
    let formData = $('#record-details form').serializeJSON();
    formData.id = selectedRecordId;

    $.ajax({
        method: 'PUT',
        url: `/records/${userId}/${selectedRecordId}`,
        processData: false,
        dataType: 'text', // THROWS ERROR WITH 'JSON'
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