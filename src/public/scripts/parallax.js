let parallaxImage = document.getElementById('ParallaxImage');
let parallaxContent = document.getElementById('ParallaxContent');
let windowScrolled;

window.addEventListener('scroll', () => {
  windowScrolled = window.pageYOffset || document.documentElement.scrollTop;
  parallaxImage.style.transform = `translate3d(0, ${windowScrolled / 4}px, 0)`;
  parallaxContent.style.transform = `translate3d(0, ${windowScrolled /
    6}px, 0)`;
});
