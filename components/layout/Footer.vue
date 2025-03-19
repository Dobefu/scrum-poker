<template>
  <footer
    class="flex justify-between border-t border-gray-100 bg-gray-100 p-4 text-gray-600 shadow-inner dark:border-gray-900 dark:bg-gray-900 dark:text-gray-300"
  >
    <p>
      By
      <a
        class="text-primary-700 dark:text-primary-400"
        href="https://cv.connor.nl"
        target="_blank"
      >
        Connor van Spronssen
      </a>
    </p>
    <span>{{ $config.public.version }}</span>

    <a
      class="text-primary-700 dark:text-primary-400"
      href="https://cv.connor.nl/en/projects/scrum-poker"
      target="_blank"
    >
      About this project
    </a>
  </footer>
</template>
