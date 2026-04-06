/* ============================================
   LINEAR SEARCH VISUALIZER — SCRIPT
   ============================================ */

// ----- Configuration -----
const CONFIG = {
  arraySize: 25,       // Number of bars
  minArraySize: 5,
  maxArraySize: 60,
  minHeight: 8,        // Minimum bar height (%)
  maxHeight: 92,       // Maximum bar height (%)
  minValue: 1,         // Minimum array value
  maxValue: 100,       // Maximum array value
};

// ----- State -----
let array = [];        // Current array of values
let isSearching = false; // Prevents multiple simultaneous searches

// ----- DOM References -----
const barContainer  = document.getElementById('bar-container');
const arraySizeInput = document.getElementById('array-size-input');
const arrayInput    = document.getElementById('array-input');
const elementInput  = document.getElementById('element-input');
const targetInput   = document.getElementById('target-input');
const statusText    = document.getElementById('status-text');
const stepsCount    = document.getElementById('steps-count');
const arraySizeEl   = document.getElementById('array-size');
const btnSearch     = document.getElementById('btn-search');
const btnReset      = document.getElementById('btn-reset');
const btnGenerate   = document.getElementById('btn-generate');
const btnApplySize  = document.getElementById('btn-apply-size');
const btnApplyArray = document.getElementById('btn-apply-array');
const btnAddElement = document.getElementById('btn-add-element');

// ============================================
//   generateArray()
//   Creates a new random array and renders bars
// ============================================
function generateArray() {
  if (isSearching) return;

  // Build random array
  array = [];
  for (let i = 0; i < CONFIG.arraySize; i++) {
    const value = randomInt(CONFIG.minValue, CONFIG.maxValue);
    array.push(value);
  }

  renderBars();
  updateStatus('Ready', 'default');
  updateSteps(0);
  arraySizeEl.textContent = array.length;
  arraySizeInput.value = array.length;
  arrayInput.value = array.join(', ');
  elementInput.value = '';
  targetInput.value = '';
}

function updateArraySize() {
  if (isSearching) return;

  const raw = arraySizeInput.value.trim();
  if (!raw) {
    updateStatus('Enter array size first', 'notfound');
    return;
  }

  const nextSize = Number(raw);
  if (!Number.isInteger(nextSize) || nextSize < CONFIG.minArraySize || nextSize > CONFIG.maxArraySize) {
    updateStatus(`Array size must be ${CONFIG.minArraySize}-${CONFIG.maxArraySize}`, 'notfound');
    return;
  }

  CONFIG.arraySize = nextSize;
  generateArray();
  updateStatus(`Generated new array of size ${nextSize}`, 'default');
}

// ============================================
//   renderBars()
//   Clears and redraws all bars from `array`
// ============================================
function renderBars() {
  barContainer.innerHTML = '';
  barContainer.classList.toggle('compact-values', array.length > 20);
  barContainer.classList.toggle('ultra-compact-values', array.length > 35);

  array.forEach((value, index) => {
    const bar = document.createElement('div');
    bar.classList.add('bar');
    bar.id = `bar-${index}`;

    // Map value (1–100) to a height percentage within min/max range
    const heightPct = mapRange(value, CONFIG.minValue, CONFIG.maxValue, CONFIG.minHeight, CONFIG.maxHeight);
    bar.style.height = `${heightPct}%`;

    // Brief entrance animation stagger
    bar.style.animationDelay = `${index * 20}ms`;

    // Tooltip: show value on hover via title attribute
    bar.setAttribute('title', `Value: ${value}  |  Index: ${index}`);
    bar.setAttribute('data-value', value);
    bar.setAttribute('data-index', index);

    const valueLabel = document.createElement('span');
    valueLabel.classList.add('bar-value');
    valueLabel.textContent = value;
    bar.appendChild(valueLabel);

    barContainer.appendChild(bar);
  });

  arraySizeEl.textContent = array.length;
}

function applyCustomArray() {
  if (isSearching) return;

  const raw = arrayInput.value.trim();

  if (!raw) {
    updateStatus('Enter comma-separated values first', 'notfound');
    return;
  }

  const values = raw
    .split(',')
    .map(part => part.trim())
    .filter(part => part.length > 0)
    .map(part => Number(part));

  const isValid =
    values.length > 0 &&
    values.every(value => Number.isInteger(value) && value >= CONFIG.minValue && value <= CONFIG.maxValue);

  if (!isValid) {
    updateStatus(`Use integers from ${CONFIG.minValue} to ${CONFIG.maxValue}`, 'notfound');
    return;
  }

  array = values;
  CONFIG.arraySize = array.length;
  renderBars();
  resetBarColors();
  updateSteps(0);
  updateStatus('Custom array applied', 'default');
  arraySizeInput.value = array.length;
  targetInput.value = '';
  elementInput.value = '';
}

function addArrayElement() {
  if (isSearching) return;

  const raw = elementInput.value.trim();

  if (!raw) {
    updateStatus('Enter an element value to add', 'notfound');
    return;
  }

  const value = Number(raw);
  if (!Number.isInteger(value) || value < CONFIG.minValue || value > CONFIG.maxValue) {
    updateStatus(`Element must be ${CONFIG.minValue}-${CONFIG.maxValue}`, 'notfound');
    return;
  }

  array.push(value);
  CONFIG.arraySize = array.length;
  renderBars();
  resetBarColors();
  updateSteps(0);
  updateStatus(`Added element ${value}`, 'default');
  arraySizeInput.value = array.length;
  arrayInput.value = array.join(', ');
  elementInput.value = '';
}

// ============================================
//   startLinearSearch()
//   Runs animated linear search over bars
// ============================================
async function startLinearSearch() {
  if (isSearching) return;

  const rawValue = targetInput.value.trim();

  // --- Input Validation ---
  if (rawValue === '') {
    flashInput('Please enter a target value.');
    return;
  }

  const target = parseInt(rawValue, 10);

  if (isNaN(target) || target < CONFIG.minValue || target > CONFIG.maxValue) {
    flashInput(`Value must be between ${CONFIG.minValue} and ${CONFIG.maxValue}.`);
    return;
  }

  // --- Begin Search ---
  isSearching = true;
  setButtonsDisabled(true);
  resetBarColors();
  updateSteps(0);
  updateStatus(`Searching for ${target}...`, 'searching');

  const bars = barContainer.querySelectorAll('.bar');
  let found = false;

  try {
    for (let i = 0; i < bars.length; i++) {
      const bar = bars[i];
      const value = array[i];

      bar.classList.add('current');
      updateSteps(i + 1);
      updateStatus(`Checking index ${i} (value ${value})`, 'searching');

      await sleep(350);

      if (value === target) {
        bar.classList.remove('current');
        bar.classList.add('found');
        updateStatus(`Found ${target} at index ${i}`, 'found');
        found = true;
        break;
      }

      bar.classList.remove('current');
      bar.classList.add('searched');
      await sleep(220);
    }

    if (!found) {
      updateStatus(`${target} not found in array`, 'notfound');
    }
  } finally {
    isSearching = false;
    setButtonsDisabled(false);
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================
//   resetArray()
//   Resets bar colors without changing values
// ============================================
function resetArray() {
  if (isSearching) return;

  resetBarColors();
  updateStatus('Ready', 'default');
  updateSteps(0);
  targetInput.value = '';
}

// ============================================
//   Utility — resetBarColors()
//   Removes all state classes from every bar
// ============================================
function resetBarColors() {
  const bars = barContainer.querySelectorAll('.bar');
  bars.forEach(bar => {
    bar.classList.remove('current', 'found', 'searched');
  });
}

// ============================================
//   Utility — updateStatus(message, type)
//   Updates the status panel text & color
// ============================================
function updateStatus(message, type = 'default') {
  statusText.textContent = message;

  // Color-code based on type
  const colorMap = {
    default:    'var(--accent-blue)',
    searching:  'var(--accent-orange)',
    found:      'var(--accent-green)',
    notfound:   'var(--accent-red)',
  };

  statusText.style.color = colorMap[type] || colorMap.default;
}

// ============================================
//   Utility — updateSteps(count)
//   Updates the steps counter display
// ============================================
function updateSteps(count) {
  stepsCount.textContent = count;
}

// ============================================
//   Utility — setButtonsDisabled(disabled)
//   Enables / disables control buttons
// ============================================
function setButtonsDisabled(disabled) {
  btnSearch.disabled   = disabled;
  btnGenerate.disabled = disabled;
  btnReset.disabled    = disabled;
  btnApplySize.disabled = disabled;
  btnApplyArray.disabled = disabled;
  btnAddElement.disabled = disabled;
}

// ============================================
//   Utility — flashInput(message)
//   Brief shake animation + console warning
// ============================================
function flashInput(message) {
  targetInput.style.borderColor = 'var(--accent-red)';
  targetInput.style.boxShadow   = '0 0 0 3px rgba(248, 81, 73, 0.2)';
  targetInput.setAttribute('placeholder', message);

  setTimeout(() => {
    targetInput.style.borderColor = '';
    targetInput.style.boxShadow   = '';
    targetInput.setAttribute('placeholder', `Enter value (${CONFIG.minValue}–${CONFIG.maxValue})`);
  }, 2000);
}

// ============================================
//   Utility — randomInt(min, max)
//   Returns a random integer in [min, max]
// ============================================
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ============================================
//   Utility — mapRange(value, inMin, inMax, outMin, outMax)
//   Maps a value from one range to another
// ============================================
function mapRange(value, inMin, inMax, outMin, outMax) {
  return ((value - inMin) / (inMax - inMin)) * (outMax - outMin) + outMin;
}

// ============================================
//   Init — Auto-generate array on page load
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  arraySizeInput.min = String(CONFIG.minArraySize);
  arraySizeInput.max = String(CONFIG.maxArraySize);
  arraySizeInput.value = CONFIG.arraySize;
  generateArray();
});
