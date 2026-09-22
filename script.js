// Navbar shrink
window.addEventListener('scroll', () => {
  const nav = document.getElementById('navbar');
  nav.style.boxShadow = window.scrollY > 50 ?
    "0 4px 20px rgba(0,0,0,0.05)" : "none";
});

// Smooth scroll
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    document.querySelector(this.getAttribute('href')).scrollIntoView({
      behavior: 'smooth'
    });
  });
});

// FAQ accordion
document.querySelectorAll('.faq-item').forEach(item => {
  item.addEventListener('click', () => {
    item.classList.toggle('active');
  });
});

// Section highlight on scroll
const sections = document.querySelectorAll("section, header");

window.addEventListener("scroll", () => {
  let scrollPos = window.scrollY + 150;

  sections.forEach(sec => {
    if (
      scrollPos > sec.offsetTop &&
      scrollPos < sec.offsetTop + sec.offsetHeight
    ) {
      sections.forEach(s => s.classList.remove("active-section"));
      sec.classList.add("active-section");
    }
  });
});
