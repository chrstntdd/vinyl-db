$(() => {
  // DOCUMENT READY FUNCTIONS
  let userId = localStorage.userId;
  handleDetailsSubmit(userId);
  
  // LOOP THROUGH INPUTS TO GET LABEL OUT OF THE WAY
  _.forEach($('input').focus());
  _.last($('input').blur());
});

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