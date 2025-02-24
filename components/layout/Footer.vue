<template>
  <footer
    class="flex justify-between border-t border-gray-100 bg-gray-100 p-4 text-gray-600 shadow-inner dark:border-gray-900 dark:bg-gray-900 dark:text-gray-300"
  >
    <p>
      By
      <a
        class="text-primary-700 dark:text-primary-500"
        href="https://cv.connor.nl"
        target="_blank"
        >Connor van Spronssen</a
      >
    </p>
    <span>{{ $config.public.version }}</span>
  </footer>
</template>
