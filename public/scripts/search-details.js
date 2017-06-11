$(() => {
  // DOCUMENT READY FUNCTIONS
  let tempDataStore = JSON.parse(sessionStorage.tempDataStore);
  let userId = localStorage.userId;
  populate($('#record-details form'), tempDataStore);
  sessionStorage.clear();
  handleDetailsSubmit(userId);
});

const populate = (form, data) => {
  $.each(data, (key, value) => {
    $(`[name=${key}]`, form).focus();
    $(`[name=${key}]`, form).val(value);
  });
};

const handleDetailsSubmit = (userId) => {
  $('#record-details form').on('submit', (e) => {
    e.preventDefault();
    const formData = $('#record-details form').serializeJSON();

    $.ajax({
        method: 'POST',
        url: `/records/${userId}`,
        processData: false,
        dataType: 'json',
        contentType: 'application/json',
        data: formData,
      })
      .done((data) => {
        window.location.replace('/collection');
      })
      .fail((err) => {
        console.log(err);
      });
  });
};