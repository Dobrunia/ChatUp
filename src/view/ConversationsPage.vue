<template>
  <section class="page">
    <h2 class="page__title dbru-text-lg dbru-text-main">Диалоги</h2>
    <div class="page__empty dbru-surface dbru-text-sm dbru-text-muted">
      Список чатов будет здесь.
    </div>
  </section>
</template>

<style scoped>
.page {
  display: grid;
  gap: var(--dbru-space-3);
}

.page__title {
  margin: 0;
}

.page__empty {
  border: 1px solid var(--dbru-color-border);
  border-radius: var(--dbru-radius-md);
  padding: var(--dbru-space-4);
}
</style>
