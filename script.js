const header = document.getElementById("site-header");
const menuToggle = document.getElementById("menu-toggle");
const mobileMenu = document.getElementById("mobile-menu");
const navLinks = [...document.querySelectorAll('a[href^="#"]')];
const backToTopButton = document.getElementById("back-to-top");
const revealItems = document.querySelectorAll(".reveal");
const form = document.getElementById("contact-form");
const formStatus = document.getElementById("form-status");

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function toggleMobileMenu(forceOpen) {
  const shouldOpen = typeof forceOpen === "boolean" ? forceOpen : mobileMenu.classList.contains("hidden");
  mobileMenu.classList.toggle("hidden", !shouldOpen);
  menuToggle.setAttribute("aria-expanded", String(shouldOpen));
  menuToggle.classList.toggle("menu-open", shouldOpen);
}

function handleHeaderState() {
  const scrolled = window.scrollY > 20;
  header.classList.toggle("header-scrolled", scrolled);
  backToTopButton.classList.toggle("is-visible", window.scrollY > 420);
}

function setupSmoothScroll() {
  navLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      const href = link.getAttribute("href");
      if (!href || !href.startsWith("#")) {
        return;
      }

      const target = document.querySelector(href);
      if (!target) {
        return;
      }

      event.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      toggleMobileMenu(false);
    });
  });
}

function setupRevealAnimations() {
  if (!("IntersectionObserver" in window)) {
    revealItems.forEach((item) => item.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries, currentObserver) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        entry.target.classList.add("is-visible");
        currentObserver.unobserve(entry.target);
      });
    },
    { threshold: 0.16 }
  );

  revealItems.forEach((item) => observer.observe(item));
}

function setFieldError(fieldName, message) {
  const errorElement = document.querySelector(`[data-error-for="${fieldName}"]`);
  const input = form.elements[fieldName];

  if (errorElement) {
    errorElement.textContent = message;
  }

  if (input instanceof HTMLElement) {
    if (message) {
      input.style.borderColor = "rgba(220, 38, 38, 0.45)";
      input.style.boxShadow = "0 0 0 4px rgba(220, 38, 38, 0.08)";
    } else {
      input.style.borderColor = "";
      input.style.boxShadow = "";
    }
  }
}

function clearErrors() {
  ["fullName", "email", "phone", "schedule", "message"].forEach((fieldName) => setFieldError(fieldName, ""));
}

function setStatus(message, type) {
  formStatus.textContent = message;
  formStatus.className = "rounded-2xl border px-4 py-3 text-sm font-medium";

  if (type === "success") {
    formStatus.classList.add("border-emerald-200", "bg-emerald-50", "text-emerald-700");
  } else {
    formStatus.classList.add("border-rose-200", "bg-rose-50", "text-rose-700");
  }

  formStatus.classList.remove("hidden");
}

function validatePhone(phone) {
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 8;
}

function validateForm() {
  const data = {
    fullName: form.fullName.value.trim(),
    email: form.email.value.trim(),
    phone: form.phone.value.trim(),
    schedule: form.schedule.value.trim(),
    message: form.message.value.trim()
  };

  const errors = {};

  if (!data.fullName) {
    errors.fullName = "Ingresa tu nombre completo.";
  }

  if (!data.email) {
    errors.email = "Ingresa tu correo electronico.";
  } else if (!emailPattern.test(data.email)) {
    errors.email = "Ingresa un correo electronico valido.";
  }

  if (!data.phone) {
    errors.phone = "Ingresa tu numero de telefono.";
  } else if (!validatePhone(data.phone)) {
    errors.phone = "El telefono debe tener al menos 8 digitos.";
  }

  if (!data.schedule) {
    errors.schedule = "Selecciona una jornada de interes.";
  }

  if (!data.message) {
    errors.message = "Escribe un mensaje.";
  }

  return { data, errors };
}

function handleFormSubmit(event) {
  event.preventDefault();
  clearErrors();

  const { errors } = validateForm();
  const entries = Object.entries(errors);

  if (entries.length > 0) {
    entries.forEach(([fieldName, message]) => setFieldError(fieldName, message));
    setStatus("Hay campos con errores. Revisa la informacion ingresada.", "error");
    return;
  }

  setStatus("Mensaje enviado correctamente. Esta demo valida el formulario sin recargar la pagina.", "success");
  form.reset();
}

function init() {
  menuToggle.addEventListener("click", () => toggleMobileMenu());
  backToTopButton.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  window.addEventListener("scroll", handleHeaderState, { passive: true });
  form.addEventListener("submit", handleFormSubmit);

  setupSmoothScroll();
  setupRevealAnimations();
  handleHeaderState();
}

init();
