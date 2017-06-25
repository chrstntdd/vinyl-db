const leaveInput = (el) => {
  if (el.value.length > 0) {
    if (!el.classList.contains('active')) {
      el.classList.add('active');
    }
  } else {
    if (el.classList.contains('active')) {
      el.classList.remove('active');
    }
  };
};

let inputs = document.getElementsByClassName('m-input');

for (let i = 0; i < inputs.length; i++) {
  let el = inputs[i];
  el.addEventListener('blur', function () {
    leaveInput(this);
  });
}

// Toggle Function
$('.toggle').click(() => {
  // Switches the forms
  $('.form').animate({
    height: 'toggle',
    'padding-top': 'toggle',
    'padding-bottom': 'toggle',
    opacity: 'toggle',
  }, 'slow');
});

// LOGIN HANDLER

const choices = $('.toggle .choice');
const text = $('.toggle .or');

choices.on('click', (e) => {
  choices.toggleClass('on');
  text.addClass('flip');
  setTimeout(() => text.removeClass('flip'), 1000);
});
