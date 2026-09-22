<script setup>
defineProps({ name: { type: String, default: "book" } });

const paths = {
  constitution: ["M5 3h13a1 1 0 0 1 1 1v17H6a2 2 0 0 1-2-2V5a2 2 0 0 1 1-2Z", "M4 17h15M9 7h5M9 11h5"],
  institution: ["m3 9 9-6 9 6H3ZM5 10v8m5-8v8m4-8v8m5-8v8M3 21h18"],
  book: ["M12 5v16M12 5C9 3 5 3 2 4v15c3-1 7-1 10 2 3-3 7-3 10-2V4c-3-1-7-1-10 1Z", "M5 8h3M5 12h3m8-4h3m-3 4h3"],
  administration: ["M7 4H4v17h16V4h-3M8 3h8v4H8V3Z", "m8 13 2 2 6-5M8 18h8"],
  economy: ["M4 3v18h17M8 16v-4m5 4V9m5 7V6"],
  people: ["M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM2 21v-2a7 7 0 0 1 14 0v2", "M17 3a4 4 0 0 1 0 8m2 4a6 6 0 0 1 3 5v1"],
  leaf: ["M20 3C9 2 3 6 4 13c1 7 10 9 14 3 3-4 2-9 2-13Z", "M3 22 15 10M8 17v-5m0 5h5"],
  scales: ["M12 3v18M5 21h14M3 7h18M5 7l-3 7h6L5 7Zm14 0-3 7h6l-3-7ZM2 14a3 3 0 0 0 6 0m8 0a3 3 0 0 0 6 0"],
  procedure: ["M6 3h12v18H6V3ZM9 7h6M9 11h6m-6 4h3", "m3 7 3 0m-3 4h3m-3 4h3"],
  search: ["M10.5 18a7.5 7.5 0 1 0 0-15 7.5 7.5 0 0 0 0 15Zm5.5-2 5 5"],
  arrow: ["M4 12h16m-6-6 6 6-6 6"],
  grid: ["M3 3h7v7H3V3Zm11 0h7v7h-7V3ZM3 14h7v7H3v-7Zm11 0h7v7h-7v-7Z"],
  list: ["M8 5h13M8 12h13M8 19h13M3 5h.01M3 12h.01M3 19h.01"],
  close: ["m6 6 12 12M6 18 18 6"],
  message: ["M21 15a3 3 0 0 1-3 3H9l-6 4V6a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v9Z", "M7 8h10M7 12h6"],
  coffee: ["M4 8h12v7a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V8Zm12 1h2a3 3 0 0 1 0 6h-2M3 22h16M8 2v3m4-3v3"],
};
</script>

<template>
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"
    stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
    <path v-for="(d, index) in (paths[name] || paths.book)" :key="index" :d="d" />
  </svg>
</template>
