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
let isPaused = false;
let pauseResolver = null;
let stack = [];
let isStackAnimating = false;
let isStackPaused = false;
let stackPauseResolver = null;

// ----- DOM References -----
const barContainer  = document.getElementById('bar-container');
const arraySizeInput = document.getElementById('array-size-input');
const arrayInput    = document.getElementById('array-input');
const elementInput  = document.getElementById('element-input');
const algorithmSelect = document.getElementById('algorithm-select');
const intervalInput = document.getElementById('interval-input');
const intervalValue = document.getElementById('interval-value');
const targetInput   = document.getElementById('target-input');
const statusText    = document.getElementById('status-text');
const explanationText = document.getElementById('explanation-text');
const stepsCount    = document.getElementById('steps-count');
const arraySizeEl   = document.getElementById('array-size');
const btnSearch     = document.getElementById('btn-search');
const btnPause      = document.getElementById('btn-pause');
const btnReset      = document.getElementById('btn-reset');
const btnGenerate   = document.getElementById('btn-generate');
const btnApplySize  = document.getElementById('btn-apply-size');
const btnApplyArray = document.getElementById('btn-apply-array');
const btnAddElement = document.getElementById('btn-add-element');
const stackInput = document.getElementById('stack-input');
const stackContainer = document.getElementById('stack-container');
const stackCount = document.getElementById('stack-count');
const stackStatus = document.getElementById('stack-status');
const stackExplanation = document.getElementById('stack-explanation');
const btnStackPush = document.getElementById('btn-stack-push');
const btnStackPop = document.getElementById('btn-stack-pop');
const btnStackReset = document.getElementById('btn-stack-reset');
const btnStackRandom = document.getElementById('btn-stack-random');
const btnStackDemo = document.getElementById('btn-stack-demo');
const stackIntervalInput = document.getElementById('stack-interval-input');
const stackIntervalValue = document.getElementById('stack-interval-value');
const stackChatPanel = document.getElementById('stack-chat-panel');
const stackChatLog = document.getElementById('stack-chat-log');
const stackChatScroll = document.getElementById('stack-chat-scroll');
const navItems = document.querySelectorAll('.nav-item');
const modules = document.querySelectorAll('.module');

const ACTIVE_MODULE_STORAGE_KEY = 'dsa-visualizer-active-module';

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
  setExplanation('New random array generated. Start search to see each step explanation.');
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
  setExplanation(`Array size changed to ${nextSize} and a new random array was generated.`);
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
  arrayInput.value = array.join(', ');
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
  setExplanation('Custom array applied. Use search controls to run linear or binary search.');
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
  setExplanation(`Element ${value} was appended to the array.`);
  arraySizeInput.value = array.length;
  arrayInput.value = array.join(', ');
  elementInput.value = '';
}

function startSearch() {
  const algorithm = algorithmSelect.value;
  if (algorithm === 'binary') {
    setExplanation('Binary Search selected. It checks the middle element and discards half each step.');
    startBinarySearch();
    return;
  }

  setExplanation('Linear Search selected. It checks each element one by one from left to right.');
  startLinearSearch();
}

function switchModule(moduleId) {
  if (isSearching) {
    return;
  }

  modules.forEach(module => {
    module.classList.toggle('active-module', module.id === moduleId);
  });

  navItems.forEach(item => {
    item.classList.toggle('active', item.dataset.moduleTarget === moduleId);
  });

  window.localStorage.setItem(ACTIVE_MODULE_STORAGE_KEY, moduleId);
}

function renderStack(enteringIndex = null, removingIndex = null) {
  stackContainer.innerHTML = '';

  for (let index = stack.length - 1; index >= 0; index--) {
    const item = document.createElement('div');
    item.className = 'stack-block';
    if (index === stack.length - 1) {
      item.classList.add('top-block');
    }
    if (index === enteringIndex) {
      item.classList.add('entering');
    }
    if (index === removingIndex) {
      item.classList.add('removing');
    }

    const value = document.createElement('span');
    value.className = 'stack-value';
    value.textContent = stack[index];

    const label = document.createElement('span');
    label.className = 'stack-index';
    label.textContent = index === stack.length - 1 ? 'TOP' : `Index ${index}`;

    item.appendChild(value);
    item.appendChild(label);
    stackContainer.appendChild(item);
  }

  stackCount.textContent = stack.length;
}

function updateStackStatus(message) {
  stackStatus.textContent = message;
}

function setStackExplanation(message) {
  stackExplanation.textContent = message;
}

function setStackChat(message) {
  const bubble = document.createElement('div');
  bubble.className = 'stack-chat-bubble';

  const label = document.createElement('span');
  label.className = 'stack-chat-label';
  label.textContent = 'Assistant';

  const text = document.createElement('p');
  text.textContent = message;

  bubble.appendChild(label);
  bubble.appendChild(text);
  stackChatLog.appendChild(bubble);

  if (stackChatLog.children.length > 80) {
    stackChatLog.removeChild(stackChatLog.firstChild);
  }

  scrollStackChatToLatest();
}

function clearStackChatLog() {
  stackChatLog.innerHTML = '';
}

function scrollStackChatToLatest() {
  stackChatLog.scrollTop = stackChatLog.scrollHeight;
}

function showStackChatPanel() {
  stackChatPanel.classList.remove('is-hidden');
}

function setStackButtonsDisabled(disabled) {
  btnStackPush.disabled = disabled;
  btnStackPop.disabled = disabled;
  btnStackReset.disabled = disabled;
  btnStackRandom.disabled = disabled;
  btnStackDemo.disabled = disabled;
  stackIntervalInput.disabled = disabled;
  stackInput.disabled = disabled;
}

function disableStackControls() {
  isStackAnimating = true;
  isStackPaused = false;
  setStackButtonsDisabled(true);
}

function enableStackControls() {
  isStackAnimating = false;
  isStackPaused = false;
  stackPauseResolver = null;
  setStackButtonsDisabled(false);
}

async function pushElement() {
  if (isStackAnimating) return;

  const rawValue = stackInput.value.trim();
  if (rawValue === '') {
    updateStackStatus('Enter a value to push');
    setStackExplanation('Push needs a value. Type one in the input before pushing.');
    return;
  }

  const value = Number(rawValue);
  if (!Number.isFinite(value)) {
    updateStackStatus('Enter a valid number');
    setStackExplanation('Stack accepts numeric values for this visualizer.');
    return;
  }

  disableStackControls();
  stack.push(value);
  updateStackStatus(`Pushed ${value}`);
  setStackExplanation(`Value ${value} was added to the top of the stack.`);
  renderStack(stack.length - 1);
  stackInput.value = '';
  await sleep(650);
  renderStack();
  enableStackControls();
}

async function popElement() {
  if (isStackAnimating) return;

  if (stack.length === 0) {
    updateStackStatus('Stack is empty');
    setStackExplanation('Nothing to pop because the stack has no elements.');
    return;
  }

  disableStackControls();
  const topIndex = stack.length - 1;
  const poppedValue = stack[topIndex];
  updateStackStatus(`Popped ${poppedValue}`);
  setStackExplanation(`Removing the top element ${poppedValue} from the stack.`);
  renderStack(null, topIndex);
  await sleep(650);
  stack.pop();
  renderStack();
  enableStackControls();
}

function resetStack() {
  if (isStackAnimating) return;

  stack = [];
  renderStack();
  stackInput.value = '';
  updateStackStatus('Ready');
  setStackExplanation('Stack cleared. You can push elements again.');
  clearStackChatLog();
  setStackChat('Stack cleared. Random stack ready when you want to demo LIFO again.');
}

function togglePauseStackDemo() {
  if (!isStackAnimating) {
    return;
  }

  isStackPaused = !isStackPaused;
  if (isStackPaused) {
    updateStackStatus('Paused');
    setStackExplanation('Stack demo paused. Press Enter to resume.');
    setStackChat('Demo paused. Press Enter again to continue.');
  } else if (stackPauseResolver) {
    stackPauseResolver();
    stackPauseResolver = null;
    updateStackStatus('LIFO demo running');
    setStackExplanation('Stack demo resumed. LIFO steps continue from current top element.');
    setStackChat('Demo resumed. Continuing with the current top element.');
  }
}

function generateRandomStack() {
  if (isStackAnimating) return;

  const nextSize = randomInt(3, 6);
  stack = [];

  for (let index = 0; index < nextSize; index++) {
    stack.push(randomInt(10, 99));
  }

  renderStack();
  stackInput.value = '';
  updateStackStatus('Random stack generated');
  setStackExplanation('A random stack has been created. The top element is the most recent one added.');
  setStackChat(`Random stack generated with ${nextSize} elements. The top block is the newest item.`);
}

async function animateLifoDemo() {
  if (isStackAnimating) return;

  showStackChatPanel();

  if (stack.length === 0) {
    generateRandomStack();
  }

  disableStackControls();
  updateStackStatus('LIFO demo running');
  setStackExplanation('LIFO means Last In, First Out. The newest element is removed first.');
  setStackChat('Demo started. Watch the top item leave first, then the next one below it.');
  await sleepWithStackPause(getStackIntervalDelay());

  while (stack.length > 0) {
    const topIndex = stack.length - 1;
    const value = stack[topIndex];
    updateStackStatus(`Removing ${value}`);
    setStackExplanation(`Value ${value} was the last pushed element, so it leaves the stack first.`);
    setStackChat(`Step: ${value} is on top, so it is removed now.`);
    renderStack(null, topIndex);
    await sleepWithStackPause(getStackIntervalDelay());
    stack.pop();
    renderStack();
    if (stack.length > 0) {
      setStackChat(`Next up is ${stack[stack.length - 1]}. This is the next top element.`);
    }
    await sleepWithStackPause(Math.max(180, Math.floor(getStackIntervalDelay() * 0.35)));
  }

  updateStackStatus('Demo complete');
  setStackExplanation('The stack is empty now. That is how LIFO works: last in, first out.');
  setStackChat('Demo finished. The last item entered was removed first, which is exactly LIFO.');
  enableStackControls();
}

function getStackIntervalDelay() {
  return Math.round(Number(stackIntervalInput.value) * 1000);
}

function updateStackIntervalDisplay() {
  stackIntervalValue.textContent = `${Number(stackIntervalInput.value).toFixed(1)} s`;
}

async function sleepWithStackPause(ms) {
  let elapsed = 0;
  const chunk = 50;

  while (elapsed < ms) {
    if (isStackPaused) {
      await new Promise(resolve => {
        stackPauseResolver = resolve;
      });
    }

    const next = Math.min(chunk, ms - elapsed);
    await sleep(next);
    elapsed += next;
  }

  if (isStackPaused) {
    await new Promise(resolve => {
      stackPauseResolver = resolve;
    });
  }
}

// ============================================
//   startLinearSearch()
//   Runs animated linear search over bars
// ============================================
async function startLinearSearch() {
  if (isSearching) return;

  const target = readAndValidateTarget();
  if (target === null) {
    return;
  }

  // --- Begin Search ---
  isSearching = true;
  isPaused = false;
  disableControls();
  resetBarColors();
  updateSteps(0);
  updateStatus(`Searching for ${target}...`, 'searching');
  setExplanation(`Linear Search started for target ${target}.`);

  const bars = barContainer.querySelectorAll('.bar');
  let found = false;

  try {
    for (let i = 0; i < bars.length; i++) {
      const bar = bars[i];
      const value = array[i];

      bar.classList.add('current');
      updateSteps(i + 1);
      updateStatus(`Checking index ${i} (value ${value})`, 'searching');
      setExplanation(`Step ${i + 1}: comparing target ${target} with value ${value} at index ${i}.`);

      await sleepWithPause(getPrimaryDelay());

      if (value === target) {
        bar.classList.remove('current');
        bar.classList.add('found');
        updateStatus(`Found ${target} at index ${i}`, 'found');
        setExplanation(`Match found. Target ${target} equals value at index ${i}.`);
        found = true;
        break;
      }

      bar.classList.remove('current');
      bar.classList.add('searched');
      setExplanation(`No match at index ${i}. Move to the next element.`);
      await sleepWithPause(getSecondaryDelay());
    }

    if (!found) {
      updateStatus(`${target} not found in array`, 'notfound');
      setExplanation(`Linear Search complete. Target ${target} is not present in the array.`);
    }
  } finally {
    isSearching = false;
    isPaused = false;
    enableControls();
  }
}

async function startBinarySearch() {
  if (isSearching) return;

  const target = readAndValidateTarget();
  if (target === null) {
    return;
  }

  isSearching = true;
  isPaused = false;
  disableControls();
  resetBarColors();
  updateSteps(0);
  setExplanation(`Binary Search started for target ${target}.`);

  try {
    if (!isArraySortedAscending(array)) {
      updateStatus('Array not sorted. Auto-sorting for Binary Search...', 'searching');
      setExplanation('Binary Search requires sorted data, so the array is being auto-sorted first.');
      await sleepWithPause(getSecondaryDelay());
      array.sort((a, b) => a - b);
      renderBars();
      updateStatus('Array sorted. Starting Binary Search...', 'searching');
      setExplanation('Array sorted in ascending order. Binary Search will now begin.');
      await sleepWithPause(getSecondaryDelay());
    }

    const bars = barContainer.querySelectorAll('.bar');
    let left = 0;
    let right = array.length - 1;
    let step = 0;
    let found = false;

    while (left <= right) {
      step += 1;
      updateSteps(step);

      const mid = Math.floor((left + right) / 2);
      const midValue = array[mid];

      applyBinaryState(bars, left, right, mid);
      updateStatus(`Checking mid index ${mid} (value ${midValue})`, 'searching');
      setExplanation(`Step ${step}: current range is [${left}, ${right}], mid is ${mid} with value ${midValue}.`);
      await sleepWithPause(getPrimaryDelay());

      if (midValue === target) {
        bars[mid].classList.remove('mid');
        bars[mid].classList.add('found');
        updateStatus(`Target found at index ${mid}`, 'found');
        setExplanation(`Match found at mid index ${mid}. Binary Search stops here.`);
        found = true;
        break;
      }

      if (target < midValue) {
        updateStatus('Target is smaller than mid. Discarding right half.', 'searching');
        setExplanation(`Target ${target} is smaller than ${midValue}, so search continues in left half.`);
        for (let i = mid; i <= right; i++) {
          bars[i].classList.add('discarded');
        }
        right = mid - 1;
      } else {
        updateStatus('Target is greater than mid. Discarding left half.', 'searching');
        setExplanation(`Target ${target} is greater than ${midValue}, so search continues in right half.`);
        for (let i = left; i <= mid; i++) {
          bars[i].classList.add('discarded');
        }
        left = mid + 1;
      }

      await sleepWithPause(getSecondaryDelay());
    }

    if (!found) {
      updateStatus('Element not found', 'notfound');
      setExplanation(`Binary Search complete. Target ${target} is not present in the array.`);
    }
  } finally {
    isSearching = false;
    isPaused = false;
    enableControls();
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function waitIfPaused() {
  if (!isPaused) {
    return Promise.resolve();
  }

  return new Promise(resolve => {
    pauseResolver = resolve;
  });
}

async function sleepWithPause(ms) {
  let elapsed = 0;
  const chunk = 50;

  while (elapsed < ms) {
    await waitIfPaused();
    const next = Math.min(chunk, ms - elapsed);
    await sleep(next);
    elapsed += next;
  }

  await waitIfPaused();
}

function updatePauseButton() {
  btnPause.disabled = !isSearching;
  btnPause.textContent = isPaused ? 'Resume' : 'Pause';
  btnPause.setAttribute('aria-label', isPaused ? 'Resume search' : 'Pause search');
}

function togglePauseSearch() {
  if (!isSearching) {
    return;
  }

  isPaused = !isPaused;
  if (isPaused) {
    updateStatus('Paused', 'searching');
    setExplanation('Search paused. Tap Resume or press Enter to continue.');
  } else if (pauseResolver) {
    pauseResolver();
    pauseResolver = null;
  }

  updatePauseButton();
}

function getIntervalDelay() {
  return Math.round(Number(intervalInput.value) * 1000);
}

function getPrimaryDelay() {
  return getIntervalDelay();
}

function getSecondaryDelay() {
  return Math.max(140, Math.floor(getIntervalDelay() * 0.65));
}

function setExplanation(message) {
  explanationText.textContent = message;
}

function updateIntervalDisplay() {
  intervalValue.textContent = `${Number(intervalInput.value).toFixed(1)} s`;
}

function isArraySortedAscending(values) {
  for (let i = 1; i < values.length; i++) {
    if (values[i] < values[i - 1]) {
      return false;
    }
  }
  return true;
}

function applyBinaryState(bars, left, right, mid) {
  bars.forEach((bar, index) => {
    bar.classList.remove('current', 'found', 'searched', 'mid', 'in-range', 'discarded');

    if (index < left || index > right) {
      bar.classList.add('discarded');
      return;
    }

    bar.classList.add('in-range');
  });

  if (bars[mid]) {
    bars[mid].classList.remove('in-range');
    bars[mid].classList.add('mid');
  }
}

function readAndValidateTarget() {
  const rawValue = targetInput.value.trim();

  if (rawValue === '') {
    flashInput('Please enter a target value.');
    return null;
  }

  const target = parseInt(rawValue, 10);

  if (isNaN(target) || target < CONFIG.minValue || target > CONFIG.maxValue) {
    flashInput(`Value must be between ${CONFIG.minValue} and ${CONFIG.maxValue}.`);
    return null;
  }

  return target;
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
  setExplanation('Visualization reset. Colors and step count cleared.');
  targetInput.value = '';
}

// ============================================
//   Utility — resetBarColors()
//   Removes all state classes from every bar
// ============================================
function resetBarColors() {
  const bars = barContainer.querySelectorAll('.bar');
  bars.forEach(bar => {
    bar.classList.remove('current', 'found', 'searched', 'mid', 'in-range', 'discarded');
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
    searching:  'var(--accent-yellow)',
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
  algorithmSelect.disabled = disabled;
  intervalInput.disabled = disabled;
}

function disableControls() {
  setButtonsDisabled(true);
  updatePauseButton();
}

function enableControls() {
  setButtonsDisabled(false);
  updatePauseButton();
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
  navItems.forEach(item => {
    item.addEventListener('click', () => switchModule(item.dataset.moduleTarget));
  });

  stackChatScroll.addEventListener('click', scrollStackChatToLatest);

  arraySizeInput.min = String(CONFIG.minArraySize);
  arraySizeInput.max = String(CONFIG.maxArraySize);
  arraySizeInput.value = CONFIG.arraySize;
  intervalInput.addEventListener('input', updateIntervalDisplay);
  document.addEventListener('keydown', event => {
    if (event.key !== 'Enter') {
      return;
    }

    if (isSearching) {
      event.preventDefault();
      togglePauseSearch();
      return;
    }

    if (isStackAnimating) {
      event.preventDefault();
      togglePauseStackDemo();
    }
  });
  updateIntervalDisplay();
  updatePauseButton();
  stackIntervalInput.addEventListener('input', updateStackIntervalDisplay);
  updateStackIntervalDisplay();
  generateRandomStack();
  renderStack();
  updateStackStatus('Ready');
  setStackExplanation('Stack follows LIFO: the last pushed element is removed first.');
  clearStackChatLog();
  setStackChat('Random stack ready. Use LIFO Demo to see the removal order explained step by step.');
  setExplanation('Choose an algorithm, enter a target value, and start search to see step-by-step explanation here.');
  const initialModule = window.localStorage.getItem(ACTIVE_MODULE_STORAGE_KEY) || 'searching-module';
  switchModule(initialModule);
  generateArray();
});
