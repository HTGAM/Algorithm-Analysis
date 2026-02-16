// --- Configuration & Global State ---
const config = {
    delay: 50,
    size: 30,
    isSorting: false
};

const elements = {
    dataType: document.getElementById('data-type'),
    generateBtn: document.getElementById('generate'),
    startBtn: document.getElementById('start-all'),
    sizeInput: document.getElementById('size'),
    speedInput: document.getElementById('speed'),
};

// Visualizer Class to manage each algorithm's DOM and State
class Visualizer {
    constructor(id) {
        this.id = id;
        this.container = document.getElementById(`container-${id}`);
        this.timeDisplay = document.getElementById(`time-${id}`);
        this.swapDisplay = document.getElementById(`swap-${id}`);
        this.array = [];
        this.bars = [];
        this.swaps = 0;
        this.startTime = 0;
    }

    reset(arrayData) {
        this.array = [...arrayData];
        this.container.innerHTML = '';
        this.bars = [];
        this.swaps = 0;
        this.swapDisplay.innerText = '0';
        this.timeDisplay.innerText = '0';

        const width = (this.container.clientWidth / this.array.length) - 2;

        for (let val of this.array) {
            const bar = document.createElement('div');
            bar.classList.add('bar');
            bar.style.height = `${val}%`;
            bar.style.width = `${width}px`;
            this.container.appendChild(bar);
            this.bars.push(bar);
        }
    }

    async swap(i, j) {
        this.swaps++;
        this.swapDisplay.innerText = this.swaps;

        // Visual
        const tempHeight = this.bars[i].style.height;
        this.bars[i].style.height = this.bars[j].style.height;
        this.bars[j].style.height = tempHeight;

        this.bars[i].classList.add('swapping');
        this.bars[j].classList.add('swapping');

        await sleep(config.delay);

        this.bars[i].classList.remove('swapping');
        this.bars[j].classList.remove('swapping');

        // Logic
        let temp = this.array[i];
        this.array[i] = this.array[j];
        this.array[j] = temp;
    }

    async highlight(indices, className) {
        for (let idx of indices) {
            if (this.bars[idx]) this.bars[idx].classList.add(className);
        }
        await sleep(config.delay);
        for (let idx of indices) {
            if (this.bars[idx]) this.bars[idx].classList.remove(className);
        }
    }

    // Direct value overwrite for Merge Sort
    async overwrite(index, value) {
        this.array[index] = value;
        this.bars[index].style.height = `${value}%`;
        this.bars[index].classList.add('overwrite');
        this.swaps++; // Treating overwrite as a basic operation
        this.swapDisplay.innerText = this.swaps;
        await sleep(config.delay);
        this.bars[index].classList.remove('overwrite');
    }

    startTimer() {
        this.startTime = performance.now();
        this.timerInterval = setInterval(() => {
            const now = performance.now();
            this.timeDisplay.innerText = Math.floor(now - this.startTime);
        }, 100);
    }

    stopTimer() {
        clearInterval(this.timerInterval);
        const now = performance.now();
        this.timeDisplay.innerText = Math.floor(now - this.startTime);
    }

    markSorted() {
        for (let bar of this.bars) {
            bar.classList.add('sorted');
        }
    }
}

// --- Utils ---
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function generateData(size, type) {
    let arr = [];
    for (let i = 1; i <= size; i++) {
        arr.push((i / size) * 100); // 1% to 100%
    }

    if (type === 'random') {
        arr.sort(() => Math.random() - 0.5);
    } else if (type === 'reversed') {
        arr.reverse();
    } else if (type === 'nearly-sorted') {
        // Swap 10% of elements
        const swapCount = Math.floor(size * 0.1);
        for (let k = 0; k < swapCount; k++) {
            let i = Math.floor(Math.random() * size);
            let j = Math.floor(Math.random() * size);
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
    }
    return arr;
}

// --- Algorithm Implementations ---

// 1. Quick Sort
async function runQuickSort(viz) {
    viz.startTimer();
    await quickSortRecursive(viz, 0, viz.array.length - 1);
    viz.stopTimer();
    viz.markSorted();
}

async function quickSortRecursive(viz, low, high) {
    if (low < high) {
        let pi = await partition(viz, low, high);
        await quickSortRecursive(viz, low, pi - 1);
        await quickSortRecursive(viz, pi + 1, high);
    }
}

async function partition(viz, low, high) {
    let pivot = viz.array[high];
    viz.bars[high].classList.add('pivot');

    let i = low - 1;
    for (let j = low; j < high; j++) {
        viz.bars[j].classList.add('comparing');
        await sleep(config.delay);

        if (viz.array[j] < pivot) {
            i++;
            await viz.swap(i, j);
        }
        viz.bars[j].classList.remove('comparing');
    }
    await viz.swap(i + 1, high);
    viz.bars[high].classList.remove('pivot');
    return i + 1;
}

// 2. Merge Sort
async function runMergeSort(viz) {
    viz.startTimer();
    await mergeSortRecursive(viz, 0, viz.array.length - 1);
    viz.stopTimer();
    viz.markSorted();
}

async function mergeSortRecursive(viz, left, right) {
    if (left >= right) return;
    const mid = Math.floor((left + right) / 2);
    await mergeSortRecursive(viz, left, mid);
    await mergeSortRecursive(viz, mid + 1, right);
    await merge(viz, left, mid, right);
}

async function merge(viz, left, mid, right) {
    let n1 = mid - left + 1;
    let n2 = right - mid;
    let L = new Array(n1);
    let R = new Array(n2);

    for (let i = 0; i < n1; i++) L[i] = viz.array[left + i];
    for (let j = 0; j < n2; j++) R[j] = viz.array[mid + 1 + j];

    let i = 0, j = 0, k = left;
    while (i < n1 && j < n2) {
        // Visual comparison
        viz.bars[left + i].classList.add('comparing');
        viz.bars[mid + 1 + j].classList.add('comparing');
        await sleep(config.delay);
        viz.bars[left + i].classList.remove('comparing');
        viz.bars[mid + 1 + j].classList.remove('comparing');

        if (L[i] <= R[j]) {
            await viz.overwrite(k, L[i]);
            i++;
        } else {
            await viz.overwrite(k, R[j]);
            j++;
        }
        k++;
    }
    while (i < n1) {
        await viz.overwrite(k, L[i]);
        i++;
        k++;
    }
    while (j < n2) {
        await viz.overwrite(k, R[j]);
        j++;
        k++;
    }
}

// 3. Insertion Sort
async function runInsertionSort(viz) {
    viz.startTimer();
    for (let i = 1; i < viz.array.length; i++) {
        let key = viz.array[i];
        let j = i - 1;

        // Visualize key selection
        viz.bars[i].classList.add('pivot');
        await sleep(config.delay);

        while (j >= 0 && viz.array[j] > key) {
            viz.bars[j].classList.add('comparing');
            await sleep(config.delay);
            viz.bars[j].classList.remove('comparing');

            // Move element ahead (using overwrite or swap logic)
            // Here we use swap to make it look like shifting
            await viz.swap(j + 1, j);
            j = j - 1;
        }
        viz.bars[j + 1].classList.remove('pivot'); // In this logic pivot moves with swap, so cleaning up might be tricky if not tracked.
        // Actually since we swapped, the key is now at j+1.
        // Just ensure pivot color is cleared. 
        // With swap-based insertion, the 'pivot' (key) moved. 
        // We can just clear all pivot classes.
        for (let b of viz.bars) b.classList.remove('pivot');
    }
    viz.stopTimer();
    viz.markSorted();
}

// 4. Bubble Sort
async function runBubbleSort(viz) {
    viz.startTimer();
    let len = viz.array.length;
    for (let i = 0; i < len; i++) {
        let swapped = false;
        for (let j = 0; j < len - i - 1; j++) {
            viz.bars[j].classList.add('comparing');
            viz.bars[j + 1].classList.add('comparing');
            await sleep(config.delay);

            if (viz.array[j] > viz.array[j + 1]) {
                await viz.swap(j, j + 1);
                swapped = true;
            }
            viz.bars[j].classList.remove('comparing');
            viz.bars[j + 1].classList.remove('comparing');
        }
        viz.bars[len - i - 1].classList.add('sorted');
        // Optimization: if no elements were swapped, break
        if (!swapped) break;
    }
    // Ensure all are marked sorted (if broke early)
    viz.markSorted();
    viz.stopTimer();
}

// 5. Selection Sort
async function runSelectionSort(viz) {
    viz.startTimer();
    let len = viz.array.length;
    for (let i = 0; i < len; i++) {
        let minIdx = i;
        viz.bars[i].classList.add('pivot'); // Pivot is current position

        for (let j = i + 1; j < len; j++) {
            viz.bars[j].classList.add('comparing');
            await sleep(config.delay);
            viz.bars[j].classList.remove('comparing');

            if (viz.array[j] < viz.array[minIdx]) {
                if (minIdx !== i) {
                    viz.bars[minIdx].classList.remove('swapping'); // remove highlight from old min
                }
                minIdx = j;
                viz.bars[minIdx].classList.add('swapping'); // highlight new min
            }
        }

        if (minIdx !== i) {
            await viz.swap(i, minIdx);
        }

        viz.bars[minIdx].classList.remove('swapping');
        viz.bars[i].classList.remove('pivot');
        viz.bars[i].classList.add('sorted');
    }
    viz.markSorted();
    viz.stopTimer();
}

// 6. Heap Sort
async function runHeapSort(viz) {
    viz.startTimer();
    let n = viz.array.length;

    // Build max heap
    for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
        await heapify(viz, n, i);
    }

    // Heap sort
    for (let i = n - 1; i > 0; i--) {
        await viz.swap(0, i);
        viz.bars[i].classList.add('sorted');
        await heapify(viz, i, 0);
    }
    viz.bars[0].classList.add('sorted');

    viz.stopTimer();
    // viz.markSorted(); // Already marked in loop
}

async function heapify(viz, n, i) {
    let largest = i;
    let l = 2 * i + 1;
    let r = 2 * i + 2;

    if (l < n) {
        viz.bars[l].classList.add('comparing');
        viz.bars[largest].classList.add('comparing');
        await sleep(config.delay);
        viz.bars[l].classList.remove('comparing');
        viz.bars[largest].classList.remove('comparing');

        if (viz.array[l] > viz.array[largest]) {
            largest = l;
        }
    }

    if (r < n) {
        viz.bars[r].classList.add('comparing');
        viz.bars[largest].classList.add('comparing');
        await sleep(config.delay);
        viz.bars[r].classList.remove('comparing');
        viz.bars[largest].classList.remove('comparing');

        if (viz.array[r] > viz.array[largest]) {
            largest = r;
        }
    }

    if (largest !== i) {
        await viz.swap(i, largest);
        await heapify(viz, n, largest);
    }
}

// 7. Shell Sort
async function runShellSort(viz) {
    viz.startTimer();
    let n = viz.array.length;

    // Start with a big gap, then reduce the gap
    for (let gap = Math.floor(n / 2); gap > 0; gap = Math.floor(gap / 2)) {

        for (let i = gap; i < n; i += 1) {
            let temp = viz.array[i];
            let j;

            // We'll mimic insertion sort but with gap
            // Using swap to visualize moving back
            for (j = i; j >= gap; j -= gap) {
                viz.bars[j].classList.add('comparing');
                viz.bars[j - gap].classList.add('comparing');
                await sleep(config.delay);
                viz.bars[j].classList.remove('comparing');
                viz.bars[j - gap].classList.remove('comparing');

                if (viz.array[j - gap] > viz.array[j]) {
                    await viz.swap(j, j - gap);
                } else {
                    break;
                }
            }
        }
    }

    viz.stopTimer();
    viz.markSorted();
}

// --- Main Controller ---
const vizQuick = new Visualizer('quick');
const vizMerge = new Visualizer('merge');
const vizInsertion = new Visualizer('insertion');
const vizBubble = new Visualizer('bubble');
const vizSelection = new Visualizer('selection');
const vizHeap = new Visualizer('heap');
const vizShell = new Visualizer('shell');

const visualizers = [vizQuick, vizMerge, vizInsertion, vizBubble, vizSelection, vizHeap, vizShell];

function init() {
    config.size = parseInt(elements.sizeInput.value);
    const data = generateData(config.size, elements.dataType.value);
    visualizers.forEach(v => v.reset(data));
}

// Set initial size
elements.sizeInput.value = config.size;
elements.generateBtn.addEventListener('click', init);

elements.sizeInput.addEventListener('input', () => {
    init();
});

elements.speedInput.addEventListener('input', () => {
    // 1(slow) -> 100(fast)
    // map to delay: 1000ms -> 1ms
    // formula: 101 - val
    let val = parseInt(elements.speedInput.value);
    config.delay = (101 - val) * 2;
});

elements.startBtn.addEventListener('click', async () => {
    if (config.isSorting) return;
    config.isSorting = true;
    elements.generateBtn.disabled = true;
    elements.startBtn.disabled = true;

    // Run all in parallel
    const p1 = runQuickSort(vizQuick);
    const p2 = runMergeSort(vizMerge);
    const p3 = runInsertionSort(vizInsertion);
    const p4 = runBubbleSort(vizBubble);
    const p5 = runSelectionSort(vizSelection);
    const p6 = runHeapSort(vizHeap);
    const p7 = runShellSort(vizShell);

    await Promise.all([p1, p2, p3, p4, p5, p6, p7]);

    config.isSorting = false;
    elements.generateBtn.disabled = false;
    elements.startBtn.disabled = false;
});

// Init on load
init();
