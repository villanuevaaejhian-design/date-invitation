const inviteScreen = document.querySelector("#invite-screen");
const detailsScreen = document.querySelector("#details-screen");
const confirmationScreen = document.querySelector("#confirmation-screen");
const yesButton = document.querySelector("#yes-button");
const noButton = document.querySelector("#no-button");
const noMessage = document.querySelector("#no-message");
const dateForm = document.querySelector("#dateForm");
const formMessage = document.querySelector("#form-message");
const changeDetailsButton = document.querySelector("#change-details");
const dateInput = document.querySelector("#date");
const pageShell = document.querySelector(".page-shell");
const envelopeScreen = document.querySelector("#envelope-screen");
const envelopeButton = document.querySelector("#envelope-button");

const playfulMessages = [
  "Are you sure? 🥺",
  "Nope! 😭",
  "Catch me! 😂",
  "Try again! ❤️",
  "Please say yes! 🥹",
];

envelopeButton.addEventListener("click", () => {
  if (pageShell.classList.contains("is-opening")) {
    return;
  }

  pageShell.classList.add("is-opening");
  envelopeButton.setAttribute("aria-disabled", "true");

  window.setTimeout(() => {
    pageShell.classList.add("is-open");
    envelopeScreen.setAttribute("aria-hidden", "true");
  }, 1900);
});

function showScreen(screenToShow) {
  [inviteScreen, detailsScreen, confirmationScreen].forEach((screen) => {
    screen.hidden = screen !== screenToShow;
  });
  noMessage.hidden = screenToShow !== inviteScreen;
}

function moveNoButton() {
  const buttonBounds = noButton.getBoundingClientRect();
  const yesBounds = yesButton.getBoundingClientRect();
  const maxLeft = Math.max(0, window.innerWidth - buttonBounds.width);
  const maxTop = Math.max(0, window.innerHeight - buttonBounds.height);
  const positionsToTry = 100;
  let nextPosition;

  function isAvailable(left, top) {
    const gap = 8;
    const overlapsYes = left < yesBounds.right + gap
      && left + buttonBounds.width > yesBounds.left - gap
      && top < yesBounds.bottom + gap
      && top + buttonBounds.height > yesBounds.top - gap;
    const isSamePosition = Math.abs(left - buttonBounds.left) < 1
      && Math.abs(top - buttonBounds.top) < 1;

    return !overlapsYes && !isSamePosition;
  }

  for (let attempt = 0; attempt < positionsToTry; attempt += 1) {
    const left = Math.random() * maxLeft;
    const top = Math.random() * maxTop;

    if (isAvailable(left, top)) {
      nextPosition = { left, top };
      break;
    }
  }

  if (!nextPosition) {
    for (let row = 0; row <= 20 && !nextPosition; row += 1) {
      for (let column = 0; column <= 20; column += 1) {
        const left = maxLeft * column / 20;
        const top = maxTop * row / 20;

        if (isAvailable(left, top)) {
          nextPosition = { left, top };
          break;
        }
      }
    }
  }

  noButton.classList.add("is-dodging");
  noButton.style.left = `${buttonBounds.left}px`;
  noButton.style.top = `${buttonBounds.top}px`;

  if (nextPosition) {
    requestAnimationFrame(() => {
      noButton.style.left = `${nextPosition.left}px`;
      noButton.style.top = `${nextPosition.top}px`;

      noMessage.textContent = playfulMessages[Math.floor(Math.random() * playfulMessages.length)];
      noMessage.hidden = false;
      document.body.append(noMessage);
      noMessage.classList.add("is-floating");

      const messageBounds = noMessage.getBoundingClientRect();
      const messageLeft = Math.min(
        Math.max(12, nextPosition.left),
        Math.max(12, window.innerWidth - messageBounds.width - 12),
      );
      const belowButton = nextPosition.top + buttonBounds.height + 8;
      const messageTop = belowButton + messageBounds.height <= window.innerHeight - 12
        ? belowButton
        : Math.max(12, nextPosition.top - messageBounds.height - 8);

      noMessage.style.left = `${messageLeft}px`;
      noMessage.style.top = `${messageTop}px`;
    });
  }

}

function setDateMinimum() {
  const today = new Date();
  const localDate = new Date(today.getTime() - today.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 10);
  dateInput.min = localDate;
}

yesButton.addEventListener("click", () => {
  setDateMinimum();
  showScreen(detailsScreen);
});

noButton.addEventListener("click", (event) => {
  event.preventDefault();
  moveNoButton();
});

dateForm.addEventListener("invalid", (event) => {
  const fieldMessages = {
    location: "Please add a location for your date.",
    date: "Please choose a day for your date.",
    time: "Please choose a time to meet.",
  };
  formMessage.textContent = fieldMessages[event.target.name] || "Please complete the missing field.";
}, true);

dateForm.addEventListener("input", () => {
  formMessage.textContent = "";
});

dateForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const locationInput = dateForm.elements.location;
  const timeInput = dateForm.elements.time;
  const fields = [
    { input: locationInput, message: "Please add a location for your date." },
    { input: dateInput, message: "Please choose a day for your date." },
    { input: timeInput, message: "Please choose a time to meet." },
  ];
  const incompleteField = fields.find(({ input }) => !input.value.trim() || !input.validity.valid);

  if (incompleteField) {
    formMessage.textContent = incompleteField.message;
    incompleteField.input.focus();
    return;
  }

  const submitButton = dateForm.querySelector('[type="submit"]');
  submitButton.disabled = true;

  try {
    const response = await fetch(dateForm.action, {
      method: dateForm.method,
      body: new FormData(dateForm),
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      throw new Error("The form submission failed.");
    }

    document.querySelector("#confirmed-location").textContent = locationInput.value;
    document.querySelector("#confirmed-date").textContent = dateInput.value;
    document.querySelector("#confirmed-time").textContent = timeInput.value;
    showScreen(confirmationScreen);
  } catch {
    formMessage.textContent = "Your date details could not be sent. Please try again.";
  } finally {
    submitButton.disabled = false;
  }
});

changeDetailsButton.addEventListener("click", () => {
  setDateMinimum();
  showScreen(detailsScreen);
});

window.addEventListener("resize", () => {
  if (noButton.classList.contains("is-dodging")) {
    moveNoButton();
  }
});
