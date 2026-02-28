const sections = {
  intro: document.getElementById("intro"),
  quiz: document.getElementById("quiz"),
  proposal: document.getElementById("proposal"),
  celebration: document.getElementById("celebration"),
  gallery: document.getElementById("gallery")
};

const ui = {
  splash: document.getElementById("splash"),
  enterExperienceBtn: document.getElementById("enterExperienceBtn"),
  musicControls: document.getElementById("musicControls"),
  bgMusic: document.getElementById("bgMusic"),
  bgVideo: document.getElementById("bgVideo"),
  musicToggleBtn: document.getElementById("musicToggleBtn"),
  videoToggleBtn: document.getElementById("videoToggleBtn"),
  volumeControl: document.getElementById("volumeControl"),
  floatingKisses: document.getElementById("floatingKisses"),
  hoorayLayer: document.getElementById("hoorayLayer"),
  modeButtons: document.querySelectorAll(".mode-btn"),
  startBtn: document.getElementById("startBtn"),
  progressText: document.getElementById("progressText"),
  progressFill: document.getElementById("progressFill"),
  scoreText: document.getElementById("scoreText"),
  negativeText: document.getElementById("negativeText"),
  timerText: document.getElementById("timerText"),
  memoryImage: document.getElementById("memoryImage"),
  imageFallback: document.getElementById("imageFallback"),
  questionText: document.getElementById("questionText"),
  hintText: document.getElementById("hintText"),
  answerArea: document.getElementById("answerArea"),
  feedbackText: document.getElementById("feedbackText"),
  nextBtn: document.getElementById("nextBtn"),
  yesBtn: document.getElementById("yesBtn"),
  noBtn: document.getElementById("noBtn"),
  noReaction: document.getElementById("noReaction"),
  yesMoodIcon: document.getElementById("yesMoodIcon"),
  bloomField: document.getElementById("bloomField"),
  openGalleryBtn: document.getElementById("openGalleryBtn"),
  galleryGrid: document.getElementById("galleryGrid"),
  galleryHelp: document.getElementById("galleryHelp")
};

const questions = [
  {
    prompt: "What is the name of the music in this website?",
    hint: "Type the exact word.",
    answers: ["sitaare"],
    forceInput: true,
    timerSeconds: 15,
    timeoutPenalty: 1
  },
  {
    prompt: "When did we first talk?",
    hint: "Think: November 2022, around afternoon.",
    answers: ["16 nov 2022 1:48 pm", "nov 16 2022 1:48 pm", "16 november 2022 1:48 pm", "november 16 2022 1:48 pm"],
    options: ["16 Nov 2022 1:48 PM", "22 Dec 2022 evening", "2 Aug 2023", "9 Feb 2026"]
  },
  {
    prompt: "Who messaged first on LinkedIn?",
    hint: "It was not Saurav.",
    answers: ["ritu"],
    options: ["Ritu", "Saurav"]
  },
  {
    prompt: "What was the first platform where we connected?",
    hint: "Professional platform.",
    answers: ["linkedin", "linked in"],
    options: ["WhatsApp", "Instagram", "LinkedIn", "Telegram"]
  },
  {
    prompt: "What was Ritu's first WhatsApp message about?",
    hint: "Android development context.",
    answers: ["video lecture for android development", "android development video lecture", "video lecture android development"],
    options: ["Class notes PDF", "Video lecture for Android development", "Project internship update", "Birthday wish"]
  },
  {
    prompt: "Where did we meet for the first time in person (2023)?",
    hint: "City in Bihar.",
    answers: ["patna"],
    options: ["Delhi", "Patna", "Mumbai", "Kolkata"]
  },
  {
    prompt: "On 2 Aug and 5 Aug, where did we meet again?",
    hint: "Short form: CP.",
    answers: ["cp", "connaught place", "delhi cp"],
    options: ["India Gate", "CP", "Noida Sector 18", "Bangla Sahib"]
  },
  {
    prompt: "Where did we meet on 19 Sep 2024?",
    hint: "A famous gurdwara in Delhi.",
    answers: ["gurdwara bangla sahib", "bangla sahib", "gurudwara bangla sahib"],
    options: ["Lotus Temple", "Akshardham", "Gurdwara Bangla Sahib", "Red Fort"]
  },
  {
    prompt: "Who gifted rose and Dairy Milk Silk on 9 Feb 2026?",
    hint: "Your special person.",
    answers: ["ritu"],
    options: ["Saurav", "Ritu"]
  }
];

const imageExtensions = ["png", "jpg", "jpeg", "webp"];
const STILLNESS_SECONDS = 60; // change this line for final timing
const STILLNESS_MOVE_TOLERANCE = 6;
const PROPOSAL_HINT_TEXT = "Hint: do not look here and there. To be in my life as wife, stay silently dont chase the another boy. 🔍";

let mode = "easy";
let currentIndex = 0;
let canProceed = false;
let musicStarted = false;
let videoStarted = false;
let score = 0;
let negativeMarks = 0;
let timerInterval = null;
let timerSecondsLeft = 0;

let proposalActive = false;
let proposalLocked = false;
let yesAnimId = null;
let noRoamTimer = null;
let stillnessInterval = null;
let stillnessDeadline = 0;
let lastPointerX = null;
let lastPointerY = null;

const yesFollower = {
  x: window.innerWidth * 0.5,
  y: window.innerHeight * 0.62,
  targetX: window.innerWidth * 0.5,
  targetY: window.innerHeight * 0.62
};

function showSection(name) {
  Object.entries(sections).forEach(([key, element]) => {
    element.classList.toggle("hidden", key !== name);
    element.classList.toggle("active", key === name);
  });

  if (name === "proposal") {
    activateProposal();
  } else {
    deactivateProposal();
  }
}

function normalize(value) {
  return value
    .toLowerCase()
    .replace(/[,.-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isCorrect(input, answerSet) {
  const data = normalize(input);
  return answerSet.some((ans) => data.includes(normalize(ans)) || normalize(ans).includes(data));
}

function getActiveSectionName() {
  return Object.entries(sections).find(([, element]) => !element.classList.contains("hidden"))?.[0] || "";
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function setProposalHint(message) {
  ui.noReaction.textContent = message;
}

function updateQuizMeta() {
  ui.scoreText.textContent = `Score: ${score}`;
  ui.negativeText.textContent = `Negative: ${negativeMarks}`;
  ui.timerText.textContent = timerInterval ? `Timer: ${timerSecondsLeft}s` : "Timer: --";
}

function clearQuestionTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
    timerSecondsLeft = 0;
    updateQuizMeta();
  }
}

function advanceToNextQuestion() {
  clearQuestionTimer();
  currentIndex += 1;
  if (currentIndex >= questions.length) {
    showSection("proposal");
    return;
  }
  renderQuestion();
}

function startQuestionTimer(question) {
  clearQuestionTimer();
  if (!question.timerSeconds) {
    updateQuizMeta();
    return;
  }

  timerSecondsLeft = question.timerSeconds;
  updateQuizMeta();

  timerInterval = setInterval(() => {
    timerSecondsLeft -= 1;
    if (timerSecondsLeft <= 0) {
      clearQuestionTimer();
      if (!canProceed) {
        canProceed = true;
        negativeMarks += question.timeoutPenalty || 1;
        updateQuizMeta();
        handleWrong("Time is up. -1 negative mark.");
        setTimeout(() => {
          advanceToNextQuestion();
        }, 900);
      }
      return;
    }
    updateQuizMeta();
  }, 1000);
}

function clearStillnessMonitor() {
  if (stillnessInterval) {
    clearInterval(stillnessInterval);
    stillnessInterval = null;
  }
  lastPointerX = null;
  lastPointerY = null;
}

function clearProposalAnimations() {
  if (yesAnimId) {
    cancelAnimationFrame(yesAnimId);
    yesAnimId = null;
  }
  if (noRoamTimer) {
    clearInterval(noRoamTimer);
    noRoamTimer = null;
  }
}

function lockProposalButtons() {
  if (!proposalActive || proposalLocked) {
    return;
  }

  proposalLocked = true;
  clearProposalAnimations();
  clearStillnessMonitor();

  const yesW = ui.yesBtn.offsetWidth || 180;
  const yesH = ui.yesBtn.offsetHeight || 58;
  const noW = ui.noBtn.offsetWidth || 160;
  const noH = ui.noBtn.offsetHeight || 58;
  const y = clamp(window.innerHeight * 0.68, 8, window.innerHeight - Math.max(yesH, noH) - 8);
  const yesX = clamp(window.innerWidth * 0.4, 8, window.innerWidth - yesW - 8);
  const noX = clamp(window.innerWidth * 0.57, 8, window.innerWidth - noW - 8);

  yesFollower.x = yesX;
  yesFollower.y = y;
  yesFollower.targetX = yesX;
  yesFollower.targetY = y;

  ui.yesBtn.style.transform = "";
  ui.yesBtn.style.left = `${yesX}px`;
  ui.yesBtn.style.top = `${y}px`;
  ui.noBtn.style.left = `${noX}px`;
  ui.noBtn.style.top = `${y}px`;
  ui.yesMoodIcon.src = "assets/characters/smile-face-openmoji.svg";
  setProposalHint("Silence won. Buttons are now stable. Click YES.");
}

function startStillnessMonitor() {
  clearStillnessMonitor();
  stillnessDeadline = Date.now() + STILLNESS_SECONDS * 1000;
  setProposalHint(PROPOSAL_HINT_TEXT);

  stillnessInterval = setInterval(() => {
    if (!proposalActive || proposalLocked) {
      return;
    }
    if (Date.now() >= stillnessDeadline) {
      lockProposalButtons();
    }
  }, 200);
}

function moveNoButtonGlobal() {
  if (!proposalActive || proposalLocked) {
    return;
  }
  const pad = 12;
  const bw = ui.noBtn.offsetWidth || 130;
  const bh = ui.noBtn.offsetHeight || 50;
  const x = Math.random() * Math.max(10, window.innerWidth - bw - pad * 2) + pad;
  const y = Math.random() * Math.max(10, window.innerHeight - bh - pad * 2) + pad;
  ui.noBtn.style.left = `${x}px`;
  ui.noBtn.style.top = `${y}px`;
  ui.noBtn.style.opacity = "1";
}

function animateYesFollower() {
  if (!proposalActive || proposalLocked) {
    return;
  }
  yesFollower.x += (yesFollower.targetX - yesFollower.x) * 0.2;
  yesFollower.y += (yesFollower.targetY - yesFollower.y) * 0.2;
  ui.yesBtn.style.transform = `translate(${yesFollower.x}px, ${yesFollower.y}px)`;
  yesAnimId = requestAnimationFrame(animateYesFollower);
}

function activateProposal() {
  proposalActive = true;
  proposalLocked = false;

  ui.yesBtn.style.position = "fixed";
  ui.yesBtn.style.left = "0";
  ui.yesBtn.style.top = "0";
  ui.yesBtn.style.zIndex = "9";
  ui.noBtn.style.position = "fixed";
  ui.noBtn.style.zIndex = "9";
  ui.yesMoodIcon.src = "assets/characters/angry-face-openmoji.svg";

  const yesW = ui.yesBtn.offsetWidth || 180;
  const yesH = ui.yesBtn.offsetHeight || 58;
  yesFollower.x = clamp(window.innerWidth * 0.52, 8, window.innerWidth - yesW - 8);
  yesFollower.y = clamp(window.innerHeight * 0.7, 8, window.innerHeight - yesH - 8);
  yesFollower.targetX = yesFollower.x;
  yesFollower.targetY = yesFollower.y;
  ui.yesBtn.style.transform = `translate(${yesFollower.x}px, ${yesFollower.y}px)`;
  ui.noBtn.style.opacity = "1";

  moveNoButtonGlobal();
  clearProposalAnimations();
  noRoamTimer = setInterval(() => {
    moveNoButtonGlobal();
  }, 1500);
  yesAnimId = requestAnimationFrame(animateYesFollower);
  startStillnessMonitor();
}

function deactivateProposal() {
  proposalActive = false;
  proposalLocked = false;
  clearProposalAnimations();
  clearStillnessMonitor();

  ui.yesBtn.style.position = "";
  ui.yesBtn.style.left = "";
  ui.yesBtn.style.top = "";
  ui.yesBtn.style.transform = "";
  ui.yesBtn.style.zIndex = "";
  ui.noBtn.style.position = "";
  ui.noBtn.style.left = "";
  ui.noBtn.style.top = "";
  ui.noBtn.style.zIndex = "";
}

function onProposalMouseMove(event) {
  if (!proposalActive || proposalLocked) {
    return;
  }

  if (lastPointerX !== null && lastPointerY !== null) {
    const delta = Math.hypot(event.clientX - lastPointerX, event.clientY - lastPointerY);
    if (delta >= STILLNESS_MOVE_TOLERANCE) {
      stillnessDeadline = Date.now() + STILLNESS_SECONDS * 1000;
    }
  } else {
    stillnessDeadline = Date.now() + STILLNESS_SECONDS * 1000;
  }

  lastPointerX = event.clientX;
  lastPointerY = event.clientY;

  const w = ui.yesBtn.offsetWidth || 180;
  const h = ui.yesBtn.offsetHeight || 58;
  yesFollower.targetX = clamp(event.clientX - w * 0.35, 8, window.innerWidth - w - 8);
  yesFollower.targetY = clamp(event.clientY - h * 0.5, 8, window.innerHeight - h - 8);
  ui.yesMoodIcon.src = "assets/characters/angry-face-openmoji.svg";
}

async function startMusic() {
  if (!ui.bgMusic) {
    return;
  }

  ui.bgMusic.volume = Number(ui.volumeControl.value || 0.6);
  try {
    await ui.bgMusic.play();
    musicStarted = true;
    ui.musicToggleBtn.textContent = "Pause Music";
  } catch (_error) {
    ui.musicToggleBtn.textContent = "Play Music";
  }
}

function toggleMusic() {
  if (!ui.bgMusic) {
    return;
  }

  if (ui.bgMusic.paused) {
    ui.bgMusic.play().then(() => {
      musicStarted = true;
      ui.musicToggleBtn.textContent = "Pause Music";
    }).catch(() => {
      ui.musicToggleBtn.textContent = "Play Music";
    });
    return;
  }

  ui.bgMusic.pause();
  ui.musicToggleBtn.textContent = "Play Music";
}

async function startVideo() {
  if (!ui.bgVideo) {
    return;
  }

  ui.bgVideo.volume = Number(ui.volumeControl.value || 0.6) * 0.28;
  try {
    await ui.bgVideo.play();
    videoStarted = true;
    ui.videoToggleBtn.textContent = "Pause Video";
  } catch (_error) {
    ui.videoToggleBtn.textContent = "Play Video";
  }
}

function toggleVideo() {
  if (!ui.bgVideo) {
    return;
  }

  if (ui.bgVideo.paused) {
    ui.bgVideo.play().then(() => {
      videoStarted = true;
      ui.videoToggleBtn.textContent = "Pause Video";
    }).catch(() => {
      ui.videoToggleBtn.textContent = "Play Video";
    });
    return;
  }

  ui.bgVideo.pause();
  ui.videoToggleBtn.textContent = "Play Video";
}

function setMode(nextMode) {
  mode = nextMode;
  ui.modeButtons.forEach((button) => {
    button.classList.toggle("selected", button.dataset.mode === mode);
  });
}

function spawnHeart(x, y, scaleBonus = 0) {
  const heart = document.createElement("span");
  heart.className = "heart-rise";
  heart.textContent = "💙";
  heart.style.left = `${x}px`;
  heart.style.setProperty("--x-drift", `${(Math.random() - 0.5) * 170}px`);
  heart.style.setProperty("--dur", `${1.8 + Math.random() * 1.3}s`);
  heart.style.fontSize = `${20 + Math.random() * 14 + scaleBonus}px`;

  const multiply = (event) => {
    event.preventDefault();
    const burstX = heart.getBoundingClientRect().left + heart.offsetWidth / 2;
    const burstY = heart.getBoundingClientRect().top;
    for (let i = 0; i < 5; i += 1) {
      spawnHeart(burstX + (Math.random() - 0.5) * 50, burstY, 3);
    }
    heart.remove();
  };

  heart.addEventListener("click", multiply);
  heart.addEventListener("touchstart", multiply, { passive: false });
  heart.addEventListener("animationend", () => heart.remove());
  document.body.appendChild(heart);
}

function launchHoorayEffect() {
  const label = document.createElement("div");
  label.className = "hooray-text";
  label.textContent = "Hooray!";
  ui.hoorayLayer.appendChild(label);
  setTimeout(() => {
    label.remove();
  }, 1450);

  const count = 24;
  for (let i = 0; i < count; i += 1) {
    const x = window.innerWidth * (0.1 + Math.random() * 0.8);
    setTimeout(() => {
      spawnHeart(x, window.innerHeight - 18);
    }, i * 40);
  }
}

function initFloatingKisses() {
  if (!ui.floatingKisses) {
    return;
  }

  ui.floatingKisses.innerHTML = "";
  const symbolPool = [
    "🤗", "🤗", "🤗", "🫶", "💞", "💘", "💗", "🌹", "✨", "🥰", "💙", "💑", "💓", "💖", "💌", "💋"
  ];

  for (let i = 0; i < 14; i += 1) {
    const mark = document.createElement("span");
    mark.className = "float-symbol";
    mark.textContent = symbolPool[Math.floor(Math.random() * symbolPool.length)];
    mark.style.left = `${Math.random() * 96}%`;
    mark.style.animationDuration = `${11 + Math.random() * 12}s`;
    mark.style.animationDelay = `${-Math.random() * 10}s`;
    mark.style.opacity = `${0.38 + Math.random() * 0.5}`;
    ui.floatingKisses.appendChild(mark);
  }
}

function probeImage(path) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = path;
  });
}

async function findImageForIndex(index) {
  for (const ext of imageExtensions) {
    const path = `images/${index}.${ext}`;
    const ok = await probeImage(path);
    if (ok) {
      return path;
    }
  }
  return null;
}

async function setStageImage(index) {
  const path = await findImageForIndex(index);
  if (!path) {
    ui.memoryImage.classList.add("hidden");
    ui.imageFallback.classList.remove("hidden");
    return;
  }

  ui.memoryImage.src = path;
  ui.memoryImage.alt = `Memory ${index}`;
  ui.imageFallback.classList.add("hidden");
  ui.memoryImage.classList.remove("hidden");
}

function handleCorrect() {
  clearQuestionTimer();
  score += 1;
  updateQuizMeta();
  canProceed = true;
  ui.feedbackText.textContent = "Hooray! Correct answer.";
  ui.nextBtn.classList.remove("hidden");
  launchHoorayEffect();
}

function handleWrong(message) {
  ui.feedbackText.textContent = message;
}

function renderOptions(question) {
  const list = document.createElement("div");
  list.className = "option-list";

  question.options.forEach((optionText) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "option-btn";
    btn.textContent = optionText;

    btn.addEventListener("click", () => {
      if (canProceed) {
        return;
      }
      const correct = isCorrect(optionText, question.answers);
      if (correct) {
        btn.classList.add("correct");
        handleCorrect();
      } else {
        btn.classList.add("wrong");
        handleWrong("Not this one. Try again.");
      }
    });

    list.appendChild(btn);
  });

  ui.answerArea.appendChild(list);
}

function renderInput(question) {
  const input = document.createElement("input");
  input.className = "answer-input";
  input.type = "text";
  input.placeholder = "Type your answer";

  const submit = document.createElement("button");
  submit.type = "button";
  submit.className = "primary";
  submit.textContent = "Submit";

  submit.addEventListener("click", () => {
    if (!input.value.trim()) {
      handleWrong("Please type an answer first.");
      return;
    }
    if (isCorrect(input.value, question.answers)) {
      handleCorrect();
    } else {
      handleWrong("Not correct yet. Try once more.");
    }
  });

  ui.answerArea.appendChild(input);
  ui.answerArea.appendChild(submit);
}

function renderQuestion() {
  canProceed = false;
  ui.feedbackText.textContent = "";
  ui.nextBtn.classList.add("hidden");

  const question = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;
  ui.progressText.textContent = `Stage ${currentIndex + 1} of ${questions.length}`;
  ui.progressFill.style.width = `${progress}%`;
  ui.questionText.textContent = question.prompt;
  ui.hintText.textContent = mode === "easy" ? `Hint: ${question.hint}` : (question.forceInput ? "Hard mode: type the exact answer." : "Hard mode: no hints.");

  setStageImage(currentIndex + 1);
  ui.answerArea.innerHTML = "";

  if (question.forceInput || mode === "hard") {
    renderInput(question);
  } else {
    renderOptions(question);
  }

  startQuestionTimer(question);
}

function runBloomAnimation() {
  ui.bloomField.innerHTML = "";
  let count = 0;
  const timer = setInterval(() => {
    count += 1;
    const dot = document.createElement("span");
    dot.className = "bloom";
    dot.style.left = `${Math.random() * 95}%`;
    dot.style.bottom = `${Math.random() * 25}px`;
    dot.style.animationDelay = `${Math.random() * 0.25}s`;
    ui.bloomField.appendChild(dot);

    if (count >= 48) {
      clearInterval(timer);
    }
  }, 65);
}

async function loadGalleryImages(start, end) {
  ui.galleryGrid.innerHTML = "";
  let found = 0;

  for (let i = start; i <= end; i += 1) {
    const path = await findImageForIndex(i);
    if (!path) {
      continue;
    }

    found += 1;
    const img = document.createElement("img");
    img.src = path;
    img.alt = `Memory ${i}`;
    ui.galleryGrid.appendChild(img);
  }

  if (found === 0) {
    ui.galleryHelp.textContent = "No images found yet. Add images as images/1.png or images/1.jpeg (jpg/webp also works).";
  } else {
    ui.galleryHelp.textContent = `Loaded ${found} image(s) from your images folder.`;
  }
}

ui.modeButtons.forEach((button) => {
  button.addEventListener("click", () => setMode(button.dataset.mode));
});

ui.enterExperienceBtn.addEventListener("click", async () => {
  ui.splash.classList.add("hidden");
  showSection("intro");
  ui.musicControls.classList.remove("hidden");
  if (!videoStarted) {
    await startVideo();
  }
  if (!musicStarted) {
    await startMusic();
  }
});

ui.startBtn.addEventListener("click", () => {
  currentIndex = 0;
  score = 0;
  negativeMarks = 0;
  clearQuestionTimer();
  updateQuizMeta();
  showSection("quiz");
  renderQuestion();
  if (!videoStarted) {
    startVideo();
  }
  if (!musicStarted) {
    startMusic();
  }
});

ui.nextBtn.addEventListener("click", () => {
  advanceToNextQuestion();
});

["mouseenter", "mousemove"].forEach((evt) => {
  ui.noBtn.addEventListener(evt, (event) => {
    if (!proposalActive || proposalLocked) {
      return;
    }
    event.preventDefault();
    moveNoButtonGlobal();
  });
});

ui.noBtn.addEventListener("click", (event) => {
  if (!proposalActive || proposalLocked) {
    return;
  }
  event.preventDefault();
  moveNoButtonGlobal();
});

ui.yesBtn.addEventListener("click", () => {
  if (proposalActive && !proposalLocked) {
    setProposalHint(PROPOSAL_HINT_TEXT);
    return;
  }
  showSection("celebration");
  runBloomAnimation();
  launchHoorayEffect();
});

ui.yesBtn.addEventListener("touchend", (event) => {
  event.preventDefault();
  ui.yesBtn.click();
}, { passive: false });

ui.yesBtn.addEventListener("pointerdown", (event) => {
  if (proposalActive && !proposalLocked) {
    event.preventDefault();
    setProposalHint(PROPOSAL_HINT_TEXT);
  }
});

ui.openGalleryBtn.addEventListener("click", async () => {
  showSection("gallery");
  await loadGalleryImages(1, 40);
});

ui.musicToggleBtn.addEventListener("click", () => {
  toggleMusic();
});

ui.videoToggleBtn.addEventListener("click", () => {
  toggleVideo();
});

ui.volumeControl.addEventListener("input", () => {
  const val = Number(ui.volumeControl.value || 0.6);
  if (ui.bgMusic) {
    ui.bgMusic.volume = val;
  }
  if (ui.bgVideo) {
    ui.bgVideo.volume = val * 0.28;
  }
});

document.addEventListener("mousemove", onProposalMouseMove);
window.addEventListener("resize", () => {
  if (!proposalActive) {
    return;
  }
  if (proposalLocked) {
    lockProposalButtons();
    return;
  }
  const yesW = ui.yesBtn.offsetWidth || 180;
  const yesH = ui.yesBtn.offsetHeight || 58;
  yesFollower.targetX = clamp(yesFollower.targetX, 8, window.innerWidth - yesW - 8);
  yesFollower.targetY = clamp(yesFollower.targetY, 8, window.innerHeight - yesH - 8);
  moveNoButtonGlobal();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    event.preventDefault();
    toggleMusic();
    return;
  }

  if (event.key !== "Enter") {
    return;
  }

  const activeElement = document.activeElement;
  const typingInInput = activeElement && (activeElement.tagName === "INPUT" || activeElement.tagName === "TEXTAREA");
  if (typingInInput) {
    return;
  }

  if (!ui.splash.classList.contains("hidden")) {
    ui.enterExperienceBtn.click();
    return;
  }

  const activeSection = getActiveSectionName();
  if (activeSection === "intro") {
    ui.startBtn.click();
    return;
  }
  if (activeSection === "quiz") {
    if (!ui.nextBtn.classList.contains("hidden")) {
      ui.nextBtn.click();
      return;
    }
    const submitBtn = ui.answerArea.querySelector("button.primary");
    if (submitBtn) {
      submitBtn.click();
    }
    return;
  }
  if (activeSection === "celebration") {
    ui.openGalleryBtn.click();
  }
});

initFloatingKisses();
updateQuizMeta();
