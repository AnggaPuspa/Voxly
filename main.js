const state = {
  currentPage: 'landing',
  currentQuestion: 0,
  score: 0,
  answers: [],
  micActive: false,
  timeLeft: 10,
  countdownInterval: null,
  recognizer: null,
  voiceCommandCooldown: false,
  lastDetectedCommand: null
};

const QUIZ_LENGTH = 10;
let questions = [];

const staticFactPool = [
  { text: 'Bumi mengelilingi Matahari', answer: true, hint: 'Pikirkan tentang sistem tata surya kita' },
  { text: 'Air mendidih pada suhu 50 derajat Celsius', answer: false, hint: 'Ingat suhu didih air di tekanan normal' },
  { text: 'Indonesia adalah negara kepulauan terbesar di dunia', answer: true, hint: 'Berapa banyak pulau yang dimiliki Indonesia?' },
  { text: 'Fotosintesis menghasilkan oksigen', answer: true, hint: 'Apa yang dilepaskan tumbuhan saat berfotosintesis?' },
  { text: 'Jerapah memiliki leher yang pendek', answer: false, hint: 'Bayangkan hewan dengan leher panjang' },
  { text: 'Gunung Everest terletak di Nepal', answer: true, hint: 'Kenali gunung tertinggi di dunia' },
  { text: 'Sungai Nil terletak di Asia', answer: false, hint: 'Bandingkan benua Afrika dan Asia.' },
  { text: 'Burung adalah satu-satunya hewan yang bisa terbang', answer: false, hint: 'Pikirkan mamalia yang dapat terbang.' },
  { text: 'Pulau Sumatra berada di Indonesia', answer: true, hint: 'Ingat letak pulau besar di Indonesia.' },
  { text: 'Hiu bernafas menggunakan paru-paru', answer: false, hint: 'Perhatikan cara ikan mengambil oksigen.' },
  { text: 'Pluto masih dianggap planet utama dalam tata surya', answer: false, hint: 'Periksa klasifikasi planet kerdil.' },
  { text: 'Air laut terasa asin karena garam mineral terlarut', answer: true, hint: 'Pikirkan apa yang terbawa arus dari daratan.' },
  { text: 'Petir terjadi karena perbedaan muatan listrik', answer: true, hint: 'Ingat kembali pelajaran fisika tentang listrik statis.' }
];

const factTemplates = [
  {
    trueText: 'Paus biru adalah mamalia terbesar di bumi',
    falseText: 'Paus biru adalah ikan terbesar di bumi',
    hint: 'Perhatikan bagaimana hewan laut raksasa berkembang biak'
  },
  {
    trueText: 'Fotosintesis membutuhkan cahaya matahari',
    falseText: 'Fotosintesis terjadi tanpa cahaya matahari',
    hint: 'Ingat apa yang dibutuhkan tumbuhan untuk membuat makanan'
  },
  {
    trueText: 'Gunung api aktif dapat meletus kapan saja',
    falseText: 'Gunung api aktif tidak bisa meletus lagi',
    hint: 'Pelajari status gunung api di Indonesia'
  },
  {
    trueText: 'Tulisan Braille digunakan oleh penyandang tunanetra',
    falseText: 'Tulisan Braille digunakan untuk mesin cetak',
    hint: 'Fokus pada media baca untuk indera peraba'
  },
  {
    trueText: 'Kanguru membawa anaknya dalam kantung',
    falseText: 'Kanguru bertelur untuk berkembang biak',
    hint: 'Ingat karakteristik hewan marsupial'
  }
];

const capitalData = [
  { country: 'Indonesia', capital: 'Jakarta', region: 'Asia Tenggara' },
  { country: 'Malaysia', capital: 'Kuala Lumpur', region: 'Asia Tenggara' },
  { country: 'Jepang', capital: 'Tokyo', region: 'Asia Timur' },
  { country: 'Australia', capital: 'Canberra', region: 'Australia' },
  { country: 'Kanada', capital: 'Ottawa', region: 'Amerika Utara' },
  { country: 'Mesir', capital: 'Kairo', region: 'Afrika Utara' },
  { country: 'Brasil', capital: 'Brasilia', region: 'Amerika Selatan' }
];

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickRandom(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function generateAdditionQuestion() {
  const a = getRandomInt(5, 30);
  const b = getRandomInt(5, 30);
  const isCorrect = Math.random() < 0.5;
  let result = a + b;
  if (!isCorrect) {
    let offset = pickRandom([-3, -2, -1, 1, 2, 3]);
    if (offset === 0) offset = 1;
    result += offset;
  }
  return {
    text: `${a} + ${b} = ${result}`,
    answer: isCorrect,
    hint: 'Hitung jumlah kedua bilangan secara teliti.'
  };
}

function generateMultiplicationQuestion() {
  const a = getRandomInt(2, 12);
  const b = getRandomInt(2, 12);
  const isCorrect = Math.random() < 0.5;
  let result = a * b;
  if (!isCorrect) {
    let offset = pickRandom([-8, -6, -4, -3, 3, 4, 6, 8]);
    if (offset === 0) offset = 4;
    result += offset;
  }
  return {
    text: `${a} × ${b} = ${result}`,
    answer: isCorrect,
    hint: 'Gunakan tabel perkalian untuk memastikan jawaban.'
  };
}

function generateComparisonQuestion() {
  const first = getRandomInt(10, 99);
  let second = getRandomInt(10, 99);
  while (second === first) {
    second = getRandomInt(10, 99);
  }
  const larger = Math.max(first, second);
  const smaller = Math.min(first, second);
  const compareGreater = Math.random() < 0.5;
  const isCorrect = Math.random() < 0.5;

  if (compareGreater) {
    const text = isCorrect
      ? `${larger} lebih besar dari ${smaller}`
      : `${smaller} lebih besar dari ${larger}`;
    return {
      text,
      answer: isCorrect,
      hint: 'Bandingkan nilai kedua angka secara langsung.'
    };
  } else {
    const text = isCorrect
      ? `${smaller} lebih kecil dari ${larger}`
      : `${larger} lebih kecil dari ${smaller}`;
    return {
      text,
      answer: isCorrect,
      hint: 'Perhatikan mana angka yang bernilai lebih kecil.'
    };
  }
}

function generateCapitalQuestion() {
  const pair = pickRandom(capitalData);
  const isCorrect = Math.random() < 0.5;
  let statedCapital = pair.capital;

  if (!isCorrect) {
    const alternatives = capitalData.filter(item => item.country !== pair.country);
    const other = pickRandom(alternatives);
    statedCapital = other.capital;
  }

  return {
    text: `Ibu kota ${pair.country} adalah ${statedCapital}`,
    answer: isCorrect,
    hint: `Ingat ibu kota negara di kawasan ${pair.region}.`
  };
}

function generateFactTemplateQuestion() {
  const template = pickRandom(factTemplates);
  const useTrue = Math.random() < 0.5;
  return {
    text: useTrue ? template.trueText : template.falseText,
    answer: useTrue,
    hint: template.hint
  };
}

function takeStaticFact(pool) {
  if (pool.length === 0) return null;
  const index = getRandomInt(0, pool.length - 1);
  return pool.splice(index, 1)[0];
}

function generateQuizQuestions(count = QUIZ_LENGTH) {
  const generated = [];
  const usedTexts = new Set();
  const availableStaticFacts = [...staticFactPool];
  const generatorPool = [
    () => generateAdditionQuestion(),
    () => generateMultiplicationQuestion(),
    () => generateComparisonQuestion(),
    () => generateCapitalQuestion(),
    () => generateFactTemplateQuestion(),
    () => takeStaticFact(availableStaticFacts)
  ];

  let safety = 0;
  while (generated.length < count && safety < count * 10) {
    safety++;
    const candidate = pickRandom(generatorPool)();
    if (!candidate || usedTexts.has(candidate.text)) continue;
    generated.push(candidate);
    usedTexts.add(candidate.text);
  }

  if (generated.length < count) {
    while (generated.length < count && availableStaticFacts.length > 0) {
      const fallback = takeStaticFact(availableStaticFacts);
      if (!fallback || usedTexts.has(fallback.text)) continue;
      generated.push(fallback);
      usedTexts.add(fallback.text);
    }
  }

  return generated;
}

const pages = {
  landing: document.getElementById('landing'),
  about: document.getElementById('about-project'),
  quiz: document.getElementById('quiz'),
  result: document.getElementById('result')
};

function navigateTo(page) {
  Object.keys(pages).forEach(key => {
    pages[key].classList.add('hidden');
  });
  
  pages[page].classList.remove('hidden');
  

  if (page === 'landing') {
    pages.about.classList.remove('hidden');
  }

  const navbar = document.querySelector('.navbar');
  const body = document.body;
  
  if (page === 'quiz' || page === 'result') {
    if (navbar) navbar.style.display = 'none';
    body.style.paddingTop = '0';
  } else {
    if (navbar) navbar.style.display = 'block';
    body.style.paddingTop = '70px';
  }
  
  state.currentPage = page;
}

async function startQuiz() {
  state.currentQuestion = 0;
  state.score = 0;
  state.answers = [];
  questions = generateQuizQuestions();
  navigateTo('quiz');
  loadQuestion();
  startCountdown();
  
  try {
    await initSpeechRecognition();
  } catch (error) {
    console.error("Failed to initialize speech recognition:", error);
    showSpeechError("Gagal mengaktifkan pengenalan suara. Silakan refresh halaman.");
  }
}

function loadQuestion() {
  if (questions.length === 0) {
    questions = generateQuizQuestions();
    state.currentQuestion = 0;
  }

  const q = questions[state.currentQuestion];
  document.getElementById('question-text').textContent = q.text;
  document.getElementById('question-number').textContent = state.currentQuestion + 1;
  document.getElementById('current-question').textContent = state.currentQuestion + 1;
  document.getElementById('total-questions').textContent = questions.length;
  document.getElementById('hint-text').textContent = q.hint;
  document.getElementById('hint-area').classList.add('hidden');
  document.getElementById('current-score').textContent = state.score;
  
  const progress = ((state.currentQuestion + 1) / questions.length) * 100;
  document.getElementById('progress-bar').style.width = progress + '%';
  try {
    document.getElementById('voice-result-container').classList.add('hidden');
    document.getElementById('recognition-status').textContent = 'Mendengarkan...';
    document.getElementById('recognition-status').classList.remove('text-red-500');
  } catch (e) {
    console.log("Voice UI elements not found yet");
  }
  
  state.timeLeft = 10;
  document.getElementById('countdown-text').textContent = state.timeLeft;
}

function startCountdown() {
  if (state.countdownInterval) clearInterval(state.countdownInterval);
  
  document.getElementById('countdown-bar').style.width = '100%';
  
  state.countdownInterval = setInterval(() => {
    state.timeLeft--;
    document.getElementById('countdown-text').textContent = state.timeLeft;
    const width = (state.timeLeft / 10) * 100;
    document.getElementById('countdown-bar').style.width = width + '%';
    
    if (state.timeLeft <= 0) {
      clearInterval(state.countdownInterval);
      setTimeout(nextQuestion, 500);
    }
  }, 1000);
}

function submitAnswer(userAnswer) {
  clearInterval(state.countdownInterval);
  
  const q = questions[state.currentQuestion];
  const isCorrect = userAnswer === q.answer;
  
  if (isCorrect) {
    state.score++;
    document.getElementById('current-score').textContent = state.score;
  }
  
  state.answers.push({
    question: q.text,
    userAnswer,
    correct: q.answer,
    isCorrect
  });
  
  setTimeout(nextQuestion, 1200);
}

function nextQuestion() {
  state.currentQuestion++;
  
  if (state.currentQuestion >= questions.length) {
    showResults();
  } else {
    loadQuestion();
    startCountdown();
  }
}

async function showResults() {
  await stopSpeechRecognition();
  
  navigateTo('result');
  
  document.getElementById('final-score').textContent = state.score;
  const totalQuestions = questions.length;
  document.getElementById('final-total').textContent = totalQuestions;
  
  const accuracy = totalQuestions > 0
    ? Math.round((state.score / totalQuestions) * 100)
    : 0;
  document.getElementById('accuracy').textContent = accuracy;
  
  let currentStreak = 0;
  let bestStreak = 0;
  state.answers.forEach(ans => {
    if (ans.isCorrect) {
      currentStreak++;
      bestStreak = Math.max(bestStreak, currentStreak);
    } else {
      currentStreak = 0;
    }
  });
  document.getElementById('best-streak').textContent = bestStreak;
  
  const detailsContainer = document.getElementById('answer-details');
  detailsContainer.innerHTML = state.answers.map((ans, idx) => `
    <div class="flex items-start gap-3 p-3 rounded-xl ${ans.isCorrect ? 'bg-green-50' : 'bg-red-50'}">
      <div class="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${ans.isCorrect ? 'bg-green-500' : 'bg-red-500'}">
        <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          ${ans.isCorrect 
            ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>'
            : '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>'
          }
        </svg>
      </div>
      <div class="flex-1">
        <p class="text-sm font-medium">${ans.question}</p>
        <p class="text-xs text-[var(--color-muted)] mt-1">
          Jawaban Anda: ${ans.userAnswer ? 'Benar' : 'Salah'} 
          ${!ans.isCorrect ? `• Seharusnya: ${ans.correct ? 'Benar' : 'Salah'}` : ''}
        </p>
      </div>
    </div>
  `).join('');
}

function showSpeechError(message) {
  try {
    const statusElement = document.getElementById('recognition-status');
    statusElement.textContent = message;
    statusElement.classList.add('text-red-500');
    console.error(message);
  } catch (e) {
    console.error("Could not display error message:", message);
  }
}

async function createSpeechModel() {
  try {
    if (typeof speechCommands === 'undefined') {
      console.error("Speech Commands library is not available!");
      showSpeechError("Librari pengenalan suara tidak tersedia");
      return null;
    }
    
    console.log("Attempting to load speech model...");
  const URL = window.location.origin + "/model/";
  const checkpointURL = URL + "model.json";
  const metadataURL = URL + "metadata.json";
    
    console.log("Loading model from:", checkpointURL);
    console.log("Loading metadata from:", metadataURL);

    const recognizer = speechCommands.create(
      "BROWSER_FFT", 
      undefined, 
      checkpointURL,
      metadataURL
    );

    await recognizer.ensureModelLoaded();
    console.log('Model loaded successfully');

    return recognizer;
  } catch (error) {
    console.error('Error creating speech model:', error);
    showSpeechError('Gagal memuat model suara: ' + error.message);
    return null;
  }
}

async function initSpeechRecognition() {
  console.log("Initializing speech recognition...");
  
  if (state.recognizer) {
    console.log("Stopping previous recognizer...");
    await state.recognizer.stopListening();
  }
  
  state.recognizer = await createSpeechModel();
  if (!state.recognizer) {
    console.error("Failed to create speech recognizer");
    return;
  }
  
  const classLabels = state.recognizer.wordLabels();
  console.log('Available commands:', classLabels);
  
  state.micActive = true;
  const statusElement = document.getElementById('mic-status');
  if (statusElement) statusElement.textContent = 'Mikrofon: Aktif';
  animateAudioMeters(true);

  state.recognizer.listen(result => {
    const scores = result.scores;
    let maxScore = scores[1];
    let maxIndex = 1;
    
    for (let i = 2; i < scores.length; i++) {
      if (scores[i] > maxScore) {
        maxScore = scores[i];
        maxIndex = i;
      }
    }
    console.log(`Top score: ${classLabels[maxIndex]} (${maxScore.toFixed(2)})`);
    if (maxScore > 0.75 && !state.voiceCommandCooldown) {
      const detectedCommand = classLabels[maxIndex];
      console.log(`Detected command: ${detectedCommand} with score ${maxScore.toFixed(2)}`);
      handleVoiceCommand(detectedCommand);
    }
  }, {
    includeSpectrogram: true,
    probabilityThreshold: 0.70,
    invokeCallbackOnNoiseAndUnknown: true,
    overlapFactor: 0.50
  });
}

function handleVoiceCommand(command) {
  if (command === 'Background Noise') return;
  
  console.log(`Processing command: ${command}`);
  
  state.voiceCommandCooldown = true;
  state.lastDetectedCommand = command;

  showDetectedCommand(command);
  
  if (command === 'benar') {
    submitAnswer(true);
  } else if (command === 'salah') {
    submitAnswer(false);
  }
  
  setTimeout(() => {
    state.voiceCommandCooldown = false;
    hideDetectedCommand();
  }, 1500);
}

function showDetectedCommand(command) {
  try {
    const container = document.getElementById('voice-result-container');
    const commandElement = document.getElementById('detected-command');
    
    if (container && commandElement) {
      commandElement.textContent = command === 'benar' ? 'BENAR' : 'SALAH';
      commandElement.className = command === 'benar' ? 'font-bold text-[var(--color-accent)]' : 'font-bold text-red-500';
      container.classList.remove('hidden');
    }
  } catch (e) {
    console.error("Error showing detected command:", e);
  }
}

function hideDetectedCommand() {
  try {
    const container = document.getElementById('voice-result-container');
    if (container) {
      container.classList.add('hidden');
    }
  } catch (e) {
    console.error("Error hiding detected command:", e);
  }
}

function animateAudioMeters(active) {
  const meters = document.querySelectorAll('.audio-meter-bar');

  meters.forEach(bar => {
    if (bar._animInterval) {
      clearInterval(bar._animInterval);
      bar._animInterval = null;
    }
  });
  
  if (active && meters.length > 0) {
    meters.forEach((bar, i) => {
      bar._animInterval = setInterval(() => {
        if (state.micActive) {
          const height = Math.random() * 80 + 20;
          bar.style.height = height + '%';
        } else {
          bar.style.height = '20%';
        }
      }, 100 + i * 50);
    });
  } else if (meters.length > 0) {
    meters.forEach(bar => {
      bar.style.height = '20%';
    });
  }
}

async function stopSpeechRecognition() {
  if (state.recognizer) {
    await state.recognizer.stopListening();
  }
  
  state.micActive = false;
  const statusElement = document.getElementById('mic-status');
  if (statusElement) statusElement.textContent = 'Mikrofon: Tidak Aktif';
  
  animateAudioMeters(false);
}

document.addEventListener('DOMContentLoaded', () => {
  if (typeof tf === 'undefined') {
    console.error("TensorFlow.js is not loaded!");
  }
  
  if (typeof speechCommands === 'undefined') {
    console.error("Speech Commands library is not loaded!");
  }
  
  document.getElementById('btn-start').addEventListener('click', startQuiz);
  document.getElementById('btn-restart').addEventListener('click', startQuiz);
  
  document.getElementById('hint-toggle').addEventListener('click', () => {
    const hint = document.getElementById('hint-area');
    hint.classList.toggle('hidden');
  });
});


document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && state.currentPage === 'landing') {
    startQuiz();
  }
});