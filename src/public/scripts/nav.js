$(() => {
  handleNav();
});

const handleNav = () => {
  // browser window scroll (in pixels) after which the "menu" link is shown
  let offset = 300;

  let navigationContainer = $('#cd-nav');
  let mainNavigation = navigationContainer.find('#cd-main-nav ul');

  const checkMenu = () => {
    if (
      $(window).scrollTop() > offset &&
      !navigationContainer.hasClass('is-fixed')
    ) {
      navigationContainer
        .addClass('is-fixed')
        .find('.cd-nav-trigger')
        .one(
          'webkitAnimationEnd oanimationend msAnimationEnd animationend',
          () => {
            mainNavigation.addClass('has-transitions');
          }
        );
    } else if ($(window).scrollTop() <= offset) {
      // check if the menu is open when scrolling up
      if (
        mainNavigation.hasClass('is-visible') &&
        !$('html').hasClass('no-csstransitions')
      ) {
        // close the menu with animation
        mainNavigation
          .addClass('is-hidden')
          .one(
            'webkitTransitionEnd otransitionend oTransitionEnd msTransitionEnd transitionend',
            () => {
              // wait for the menu to be closed and do the rest
              mainNavigation.removeClass(
                'is-visible is-hidden has-transitions'
              );
              navigationContainer.removeClass('is-fixed');
              $('.cd-nav-trigger').removeClass('menu-is-open');
            }
          );
        // check if the menu is open when scrolling up - fallback if transitions are not supported
      } else if (
        mainNavigation.hasClass('is-visible') &&
        $('html').hasClass('no-csstransitions')
      ) {
        mainNavigation.removeClass('is-visible has-transitions');
        navigationContainer.removeClass('is-fixed');
        $('.cd-nav-trigger').removeClass('menu-is-open');
        // scrolling up with menu closed
      } else {
        navigationContainer.removeClass('is-fixed');
        mainNavigation.removeClass('has-transitions');
      }
    }
  };

  // hide or show the "menu" link
  checkMenu();
  $(window).scroll(() => {
    checkMenu();
  });

  // open or close the menu clicking on the bottom "menu" link
  $('.cd-nav-trigger').on('click', e => {
    e.preventDefault();
    $(this).toggleClass('menu-is-open');
    // we need to remove the transitionEnd event handler (we add it when scolling up with the menu open)
    mainNavigation
      .off(
        'webkitTransitionEnd otransitionend oTransitionEnd msTransitionEnd transitionend'
      )
      .toggleClass('is-visible');
  });
};
