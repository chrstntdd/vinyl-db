$(document).ready(() => {
  let zindex = 10;
  $('.cards').on('click', '.toggle-info', function(e) {
    e.preventDefault();
    // TOGGLE BETWEEN ICONS.
    $(this).find('i').toggleClass('fa-times fa-chevron-down');

    let isShowing = false;

    const parentCard = $(this).parentsUntil('card');

    if (parentCard.hasClass('show')) {
      isShowing = true;
    }

    if (parentCard.hasClass('showing')) {
      // a card is already in view
      $('div.card.show').removeClass('show');

      if (isShowing) {
        // this card was showing - reset the grid
        $('div.cards').removeClass('showing');
      } else {
        // this card isn't showing - get in with it
        parentCard.css({ zIndex: zindex }).addClass('show');
      }
      zindex++;
    } else {
      // no cards in view
      $('div.cards').addClass('showing');
      parentCard.css({ zIndex: zindex }).addClass('show');
      zindex++;
    }
  });
});
