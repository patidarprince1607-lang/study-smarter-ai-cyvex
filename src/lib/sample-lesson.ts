import type { Lesson } from "./types";

// Clearly-labelled sample shown before the student asks their own doubt.
// Never presented as a live Gemma 4 response.
export const SAMPLE_LESSON: Lesson = {
  source: "sample",
  topic: "Binary Search",
  diagnosis:
    "You know what binary search is, but the reason the middle element is checked first — and why that lets us throw away half the data — hasn't clicked yet.",
  explanation: `Checking the **middle** isn't a ritual — it's the single comparison that tells you the most.

In a **sorted** array, every element to the left of the middle is smaller and every element to the right is larger. So when you compare the target with the middle:

- If the target is **smaller**, it *cannot* be anywhere on the right. The entire right half is eliminated.
- If the target is **larger**, the entire left half is eliminated.
- If it's **equal**, you're done.

Any other position would split the data unevenly. Check the 2nd element and you might only eliminate 1 item. The middle guarantees you eliminate **half, every time**, no matter what the answer is. That's why 1,000,000 items need only about **20** checks.`,
  analogy: {
    title: "The dictionary trick",
    text: "If you want a word beginning with Z, you don't start at page 1. You open somewhere near the middle, see you're at 'M', and instantly know every page before it is useless. You flip to the middle of what's left, and repeat. Each flip throws away half the remaining pages — that's exactly what binary search does with the middle element.",
  },
  notes: [
    { heading: "What is Binary Search?", body: "Binary search is an algorithm for finding a target value in a **sorted** collection by repeatedly halving the portion of the collection that could contain it.", bullets: ["Works on sorted arrays", "Halves the search space each step", "Much faster than linear search for large inputs"] },
    { heading: "Why does it work?", body: "Sorting creates an *order guarantee*: everything left of an index is ≤ it and everything right is ≥ it. One comparison therefore tells us which side the target is on.", bullets: ["No sorting → no guarantee → can't discard anything", "Correctness depends entirely on the sorted property"] },
    { heading: "Why check the middle?", body: "The middle splits the remaining range into two equal halves, so whichever way the comparison goes, half the candidates disappear. Checking any other position risks eliminating only a few elements in the worst case.", bullets: ["Middle = worst-case optimal split", "Like opening a dictionary near the middle"] },
    { heading: "Step-by-step algorithm", body: "1. Set `low = 0`, `high = n - 1`\n2. While `low <= high`: compute `mid = low + (high - low) / 2`\n3. Compare `arr[mid]` with target\n4. If equal → return `mid`\n5. If target < `arr[mid]` → `high = mid - 1`, else `low = mid + 1`\n6. If the loop ends, the target is absent", bullets: ["Use low + (high-low)/2 to avoid overflow"] },
    { heading: "Worked example", body: "Array: `5, 9, 14, 18, 23, 31, 42, 57`, target **23**.\n\n- low=0, high=7, mid=3 → 18 < 23 → go right (low=4)\n- low=4, high=7, mid=5 → 31 > 23 → go left (high=4)\n- low=4, high=4, mid=4 → 23 = 23 → **found at index 4** in 3 checks", bullets: [] },
    { heading: "Complexity", body: "Each step halves n: n → n/2 → n/4 … → 1, which takes log₂ n steps.", bullets: ["Time: O(log n)", "Space: O(1) iterative, O(log n) recursive", "Best case: O(1) when the middle is the target"] },
    { heading: "Common mistakes", body: "Most bugs come from boundaries.", bullets: ["Using low < high and missing the last element", "Forgetting mid ± 1 → infinite loop", "Running it on unsorted data"] },
  ],
  keyPoints: ["Requires sorted data", "Compare with middle, discard half", "Time O(log n), space O(1) iterative", "mid = low + (high - low) / 2", "Loop condition: low <= high"],
  mindMap: {
    center: "Binary Search",
    info: "Find a value in sorted data by halving the search space.",
    branches: [
      { label: "Requirement", info: "What must be true before you start.", children: [{ label: "Sorted Array", info: "Order lets one comparison rule out a whole half." }] },
      { label: "Core Process", info: "The variables that track the search space.", children: [{ label: "Low", info: "Left edge of the remaining range." }, { label: "High", info: "Right edge of the remaining range." }, { label: "Mid", info: "Middle index — the most informative check." }, { label: "Compare", info: "Target vs arr[mid] decides the direction." }] },
      { label: "Decision", info: "What each comparison outcome means.", children: [{ label: "Search Left", info: "Target < mid → high = mid - 1." }, { label: "Search Right", info: "Target > mid → low = mid + 1." }, { label: "Found", info: "Target = mid → return index." }] },
      { label: "Complexity", info: "How fast it is.", children: [{ label: "O(log n)", info: "Halving n repeatedly takes log₂ n steps." }] },
      { label: "Applications", info: "Where it shows up.", children: [{ label: "Sorted Data", info: "Lookups in sorted lists, indexes, dictionaries." }, { label: "Answer Search", info: "Binary search on the answer in optimization problems." }] },
    ],
  },
  visual: {
    title: "See the search space shrink.",
    array: [5, 9, 14, 18, 23, 31, 42, 57],
    target: 23,
    steps: [],
  },
  example: {
    title: "Iterative binary search in C",
    text: "A clean iterative version — note `low <= high` and the overflow-safe midpoint.",
    language: "c",
    code: `int binarySearch(int arr[], int n, int target) {
    int low = 0, high = n - 1;
    while (low <= high) {
        int mid = low + (high - low) / 2;
        if (arr[mid] == target) return mid;
        if (target < arr[mid]) high = mid - 1; // discard right half
        else low = mid + 1;                    // discard left half
    }
    return -1; // not found
}`,
  },
  quiz: [
    { question: "Why can binary search discard half of the array after one comparison?", options: ["Because the array is sorted, so the target can only be on one side of mid", "Because the middle element is always the target", "Because it checks two elements at once", "Because half the array is always empty"], answerIndex: 0, explanation: "Sorting guarantees everything left of mid is smaller and right is larger, so one comparison rules out a whole side.", concept: "Search space reduction" },
    { question: "In [5, 9, 14, 18, 23, 31, 42, 57], searching for 42, what is checked first?", options: ["5", "57", "18", "31"], answerIndex: 2, explanation: "mid = (0+7)/2 = 3 → arr[3] = 18.", concept: "Finding mid" },
    { question: "Target > arr[mid]. What happens next?", options: ["high = mid - 1", "low = mid + 1", "Return -1", "Restart from index 0"], answerIndex: 1, explanation: "The target must be to the right, so the left half including mid is discarded.", concept: "Search space reduction" },
    { question: "Why is checking the middle better than checking the 2nd element?", options: ["It's easier to compute", "It guarantees half is eliminated no matter the outcome", "The 2nd element might be duplicated", "It uses less memory"], answerIndex: 1, explanation: "An uneven split can eliminate just 1–2 items in the worst case; the middle always removes half.", concept: "Why the middle" },
  ],
};
