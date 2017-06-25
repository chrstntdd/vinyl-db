$(() => {
  // DOCUMENT READY FUNCTIONS

  handleRecordSelection();
  handlePlayCountInc();
});

const handlePlayCountInc = () => {
  $('.cards').on('click', '.increment-play-count', function (e) {
    const currentSpinCount = $(this).siblings('.play-count');
    const selectedRecordId = $(this).closest('.card').attr('id');

    // DYNAMICALLY RENDER PLURAL OR SINGULAR OF SPIN
    if (parseInt(currentSpinCount.html()) == 0) {
      $(this).siblings('.spin').html('Spin');
    } else {
      $(this).siblings('.spin').html('Spins');
    }

    currentSpinCount.html((i, val) => {
      $.ajax({
        method: 'PATCH',
        url: `/records/${user._id}/${selectedRecordId}`,
        data: { increment: true },
      })
        .done(() => {
          
        })
        .fail((err) => {
          console.error(err);
        });
      return +val + 1;
    });
  });
};

const handleRecordSelection = () => {
  // SET SELECTED RECORD DISCOGS ID FOR USE IN COLLECTION DETAILS
  $('.cards').on('click', '#btn-rec-details', function (e) {
    const selectedRecordId = $(this).closest('.card').attr('id');
    localStorage.selectedRecordId = selectedRecordId;
  });
};
