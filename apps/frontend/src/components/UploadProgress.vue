<template>
  <Transition name="panel">
    <div v-if="tasks.length > 0" class="upload-progress-bar">
      <TransitionGroup name="task" tag="div" class="tasks-list">
        <div v-for="task in tasks" :key="task.id" class="upload-task">
          <div class="task-info">
            <span class="task-name" :title="task.fileName">{{ task.fileName }}</span>
            <span :class="['task-status', `task-status--${task.status}`]">
              {{ statusLabel(task.status) }}
            </span>
          </div>
          <div class="task-progress-row">
            <div class="progress-track">
              <div
                :class="['progress-fill', `progress-fill--${task.status}`]"
                :style="{ width: task.progress + '%' }"
              />
            </div>
            <span class="progress-pct">{{ task.progress }}%</span>
            <button
              v-if="task.status === 'uploading'"
              @click="emit('cancel', task.id)"
              class="cancel-btn"
              title="Cancel"
            >&#x2715;</button>
          </div>
        </div>
      </TransitionGroup>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import type { UploadTask } from '@/types';

defineProps<{ tasks: UploadTask[] }>();
const emit = defineEmits<{ (e: 'cancel', id: string): void }>();

function statusLabel(status: UploadTask['status']) {
  const labels: Record<UploadTask['status'], string> = {
    uploading: 'Uploading...',
    done: 'Done',
    error: 'Error',
    cancelled: 'Cancelled',
  };
  return labels[status];
}
</script>

<style scoped>
/* ── Panel (cały kontener) ── */
.panel-enter-active {
  animation: panel-slide-in 0.28s ease;
}
.panel-leave-active {
  animation: panel-slide-out 0.28s ease forwards;
}

@keyframes panel-slide-in {
  from {
    opacity: 0;
    max-height: 0;
    padding-top: 0;
    padding-bottom: 0;
  }
  to {
    opacity: 1;
    max-height: 400px;
    padding-top: 8px;
    padding-bottom: 8px;
  }
}
@keyframes panel-slide-out {
  from {
    opacity: 1;
    max-height: 400px;
    padding-top: 8px;
    padding-bottom: 8px;
  }
  to {
    opacity: 0;
    max-height: 0;
    padding-top: 0;
    padding-bottom: 0;
  }
}

/* ── Poszczególne paski ── */
.tasks-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  position: relative;
}

.task-enter-active {
  animation: task-in 0.22s ease;
}
.task-leave-active {
  animation: task-out 0.22s ease forwards;
  /* position: absolute zapobiega skokowi innych pasków */
  position: absolute;
  left: 0;
  right: 0;
}
.task-move {
  transition: transform 0.22s ease;
}

@keyframes task-in {
  from {
    opacity: 0;
    transform: translateX(-12px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
@keyframes task-out {
  from {
    opacity: 1;
    transform: translateX(0);
  }
  to {
    opacity: 0;
    transform: translateX(12px);
  }
}

/* ── Stałe style ── */
.upload-progress-bar {
  padding: 8px 20px;
  background: rgba(15, 52, 96, 0.4);
  border-bottom: 1px solid rgba(255,255,255,0.06);
  overflow: hidden;
}
.upload-task {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.task-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.task-name {
  font-size: 0.8rem;
  color: #aaa;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 300px;
}
.task-status {
  font-size: 0.75rem;
  white-space: nowrap;
}
.task-status--uploading { color: #64b5f6; }
.task-status--done { color: #81c784; }
.task-status--error { color: #e94560; }
.task-status--cancelled { color: #888; }
.task-progress-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.progress-track {
  flex: 1;
  height: 4px;
  background: rgba(255,255,255,0.08);
  border-radius: 2px;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.3s ease;
}
.progress-fill--uploading { background: #64b5f6; }
.progress-fill--done { background: #81c784; }
.progress-fill--error { background: #e94560; }
.progress-fill--cancelled { background: #555; }
.progress-pct {
  font-size: 0.75rem;
  color: #666;
  width: 36px;
  text-align: right;
}
.cancel-btn {
  background: transparent;
  border: none;
  color: #888;
  cursor: pointer;
  font-size: 0.9rem;
  padding: 0 4px;
  transition: color 0.15s;
}
.cancel-btn:hover { color: #e94560; }
</style>
