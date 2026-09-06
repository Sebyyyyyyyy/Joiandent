const header = document.querySelector(".site-header");
const menuBtn = document.querySelector(".menu-toggle");
const mobileLinks = document.querySelectorAll(".mobile-nav a");

menuBtn?.addEventListener("click", () => {
  const open = header.classList.toggle("menu-open");
  menuBtn.setAttribute("aria-expanded", String(open));
});

mobileLinks.forEach(link => {
  link.addEventListener("click", () => {
    header.classList.remove("menu-open");
    menuBtn?.setAttribute("aria-expanded", "false");
  });
});

// Reveal on scroll
const revealItems = document.querySelectorAll(".reveal");

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.14 });

  revealItems.forEach(el => observer.observe(el));
} else {
  revealItems.forEach(el => el.classList.add("is-visible"));
}

// Active navigation state
const sections = [...document.querySelectorAll("main section[id]")];
const navLinks = [...document.querySelectorAll(".desktop-nav a")];

const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    navLinks.forEach(link => {
      const target = link.getAttribute("href");
      link.classList.toggle("active", target === `#${entry.target.id}`);
    });
  });
}, {
  rootMargin: "-35% 0px -55% 0px",
  threshold: 0
});

sections.forEach(section => sectionObserver.observe(section));

document.getElementById("year").textContent = new Date().getFullYear();


// Appointment modal
const appointmentModal = document.querySelector(".appointment-modal");
const appointmentTriggers = document.querySelectorAll(".appointment-trigger");
const modalCloseButtons = document.querySelectorAll("[data-close-modal]");

let lastFocusedElement = null;

function openAppointmentModal(event) {
  if (event) event.preventDefault();
  if (!appointmentModal) return;

  lastFocusedElement = document.activeElement;
  appointmentModal.classList.add("is-open");
  appointmentModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");

  // If opened from the mobile menu, close the menu behind it.
  header?.classList.remove("menu-open");
  menuBtn?.setAttribute("aria-expanded", "false");

  window.setTimeout(() => {
    appointmentModal.querySelector('input[name="Nume și prenume"]')?.focus();
  }, 120);
}

function closeAppointmentModal() {
  if (!appointmentModal) return;

  appointmentModal.classList.remove("is-open");
  appointmentModal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");

  if (lastFocusedElement && typeof lastFocusedElement.focus === "function") {
    lastFocusedElement.focus();
  }
}

appointmentTriggers.forEach(trigger => {
  trigger.addEventListener("click", openAppointmentModal);
});

modalCloseButtons.forEach(button => {
  button.addEventListener("click", closeAppointmentModal);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && appointmentModal?.classList.contains("is-open")) {
    closeAppointmentModal();
  }
});
