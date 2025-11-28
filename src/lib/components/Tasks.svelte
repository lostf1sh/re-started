<script>
    import { onMount, onDestroy } from 'svelte'
    import { 
        tasks, 
        addTask, 
        updateTask, 
        deleteTask, 
        toggleTask, 
        clearCompletedTasks,
        isTaskOverdue,
        formatDueDate 
    } from '../local-tasks-store.svelte.js'
    import { settings } from '../settings-store.svelte.js'

    let editingTask = $state(null)
    let editTitle = $state('')
    let editDue = $state('')
    let editNotes = $state('')
    let showCompleted = $state(false)
    
    let taskCount = $derived(tasks.filter((task) => !task.completed).length)
    let completedCount = $derived(tasks.filter((task) => task.completed).length)

    function handleVisibilityChange() {
        if (document.visibilityState === 'visible') {
            // Tasks are automatically reactive, no need to reload
        }
    }


    function startEditTask(task) {
        editingTask = task
        editTitle = task.title
        editDue = task.due ? task.due.toISOString().split('T')[0] : ''
        editNotes = task.notes
    }

    function saveEditTask() {
        if (!editTitle.trim() || !editingTask) return
        
        const due = editDue ? new Date(editDue) : null
        updateTask(editingTask.id, {
            title: editTitle.trim(),
            due: due,
            notes: editNotes.trim()
        })
        
        editingTask = null
        editTitle = ''
        editDue = ''
        editNotes = ''
    }

    function cancelEdit() {
        editingTask = null
        editTitle = ''
        editDue = ''
        editNotes = ''
    }

    function handleKeydown(event) {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault()
            if (editingTask) {
                saveEditTask()
            }
        } else if (event.key === 'Escape') {
            if (editingTask) {
                cancelEdit()
            }
        }
    }

    function getDisplayTasks() {
        if (showCompleted) {
            return tasks.filter(task => task.completed)
        } else {
            return tasks.filter(task => !task.completed)
        }
    }

    onMount(() => {
        document.addEventListener('visibilitychange', handleVisibilityChange)
    })

    onDestroy(() => {
        document.removeEventListener('visibilitychange', handleVisibilityChange)
    })
</script>

<svelte:window on:keydown={handleKeydown} />

<div class="panel">
    <div class="widget-header">
        <div class="widget-label">tasks</div>
        <div class="task-stats">
            <span class="task-count">{taskCount} active</span>
            {#if completedCount > 0}
                <button 
                    class="clear-completed"
                    onclick={() => clearCompletedTasks()}
                    title="Clear completed tasks"
                >
                    clear {completedCount}
                </button>
            {/if}
        </div>
    </div>

    <div class="task-filters">
        <button 
            class="filter-btn" 
            class:active={!showCompleted}
            onclick={() => showCompleted = false}
        >
            active ({taskCount})
        </button>
        <button 
            class="filter-btn" 
            class:active={showCompleted}
            onclick={() => showCompleted = true}
        >
            completed ({completedCount})
        </button>
    </div>

    <br />
    <div class="tasks">
        <div class="tasks-list">
            {#each getDisplayTasks() as task}
                <div
                    class="task"
                    class:completed={task.completed}
                    class:overdue={isTaskOverdue(task)}
                    class:editing={editingTask?.id === task.id}
                >
                    {#if editingTask?.id === task.id}
                        <div class="edit-form">
                            <input
                                bind:value={editTitle}
                                class="edit-input"
                            />
                            <input
                                bind:value={editDue}
                                type="date"
                                class="edit-input"
                            />
                            <textarea
                                bind:value={editNotes}
                                class="edit-notes"
                                rows="2"
                            ></textarea>
                            <div class="edit-actions">
                                <button onclick={saveEditTask} class="save-btn" disabled={!editTitle.trim()}>
                                    save
                                </button>
                                <button onclick={cancelEdit} class="cancel-btn">
                                    cancel
                                </button>
                            </div>
                        </div>
                    {:else}
                        <button
                            onclick={() => toggleTask(task.id)}
                            class="checkbox"
                            class:completed={task.completed}
                        >
                            {task.completed ? '[x]' : '[ ]'}
                        </button>
                        <button 
                            class="task-title" 
                            onclick={() => startEditTask(task)}
                            onkeydown={(e) => e.key === 'Enter' && startEditTask(task)}
                        >
                            {task.title}
                        </button>
                        {#if task.notes}
                            <span class="task-notes-display" title={task.notes}>
                                📝
                            </span>
                        {/if}
                        {#if task.due}
                            <span
                                class="task-due"
                                class:overdue-date={isTaskOverdue(task)}
                            >
                                {formatDueDate(task.due, false)}
                            </span>
                        {/if}
                        <button
                            onclick={() => deleteTask(task.id)}
                            class="delete-btn"
                            title="Delete task"
                        >
                            ×
                        </button>
                    {/if}
                </div>
            {/each}
            {#if getDisplayTasks().length === 0}
                <div class="empty-state">
                    {#if showCompleted}
                        No completed tasks
                    {:else}
                        No active tasks
                    {/if}
                </div>
            {/if}
        </div>
    </div>
</div>

<style>
    .panel {
        flex: 1;
    }
    .widget-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.5rem;
    }
    .task-stats {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
    .task-count {
        color: var(--txt-3);
        font-size: 0.875rem;
    }
    .clear-completed {
        background: none;
        border: none;
        color: var(--txt-3);
        font-size: 0.75rem;
        cursor: pointer;
        padding: 0.25rem 0.5rem;
        border-radius: 0.25rem;
    }
    .clear-completed:hover {
        background: var(--bg-2);
    }
    .task-filters {
        display: flex;
        gap: 0.5rem;
        margin-bottom: 1rem;
    }
    .filter-btn {
        padding: 0.25rem 0.75rem;
        background: none;
        border: 1px solid var(--bg-3);
        color: var(--txt-3);
        border-radius: 0.25rem;
        cursor: pointer;
        font-size: 0.875rem;
        transition: all 0.2s ease;
    }
    .filter-btn:hover {
        border-color: var(--txt-4);
    }
    .filter-btn.active {
        background: var(--bg-3);
        color: var(--txt-1);
        border-color: var(--txt-4);
    }
    .tasks {
        max-height: 15rem;
        overflow: auto;
        scrollbar-width: none;
    }
    .task {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem;
        margin-bottom: 0.25rem;
        border-radius: 0.25rem;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        animation: fadeInUp 0.4s cubic-bezier(0.4, 0, 0.2, 1) backwards;
    }
    .task:hover {
        background: var(--bg-2);
        transform: translateX(4px);
        box-shadow: -2px 0 0 var(--txt-4);
    }
    .task.editing {
        background: var(--bg-2);
        border: 1px solid var(--bg-3);
    }
    .checkbox {
        background: none;
        border: none;
        cursor: pointer;
        font-family: monospace;
        color: var(--txt-2);
    }
    .checkbox.completed {
        color: var(--txt-3);
    }
    .task-title {
        flex: 1;
        cursor: pointer;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        background: none;
        border: none;
        text-align: left;
        padding: 0;
        color: inherit;
        font: inherit;
    }
    .task.completed .task-title {
        text-decoration: line-through;
        color: var(--txt-3);
    }
    .task-notes-display {
        color: var(--txt-3);
        font-size: 0.875rem;
    }
    .task-due {
        color: var(--txt-3);
        font-size: 0.875rem;
        white-space: nowrap;
    }
    .overdue-date {
        color: var(--txt-err);
    }
    .delete-btn {
        background: none;
        border: none;
        color: var(--txt-3);
        cursor: pointer;
        font-size: 1.25rem;
        line-height: 1;
        padding: 0.25rem;
        border-radius: 0.25rem;
        opacity: 0;
        transition: opacity 0.2s;
    }
    .task:hover .delete-btn {
        opacity: 1;
    }
    .delete-btn:hover {
        background: var(--bg-3);
        color: var(--txt-err);
    }
    .edit-form {
        width: 100%;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }
    .edit-input, .edit-notes {
        padding: 0.5rem;
        background: var(--bg-1);
        border: 1px solid var(--bg-3);
        border-radius: 0.25rem;
        color: var(--txt-1);
    }
    .edit-notes {
        resize: vertical;
        min-height: 2rem;
    }
    .edit-actions {
        display: flex;
        gap: 0.5rem;
    }
    .save-btn, .cancel-btn {
        padding: 0.25rem 0.75rem;
        border: 1px solid var(--bg-3);
        border-radius: 0.25rem;
        cursor: pointer;
        font-size: 0.875rem;
    }
    .save-btn {
        background: var(--txt-1);
        color: var(--bg-1);
    }
    .save-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
    .cancel-btn {
        background: none;
        color: var(--txt-3);
    }
    .empty-state {
        text-align: center;
        color: var(--txt-3);
        padding: 2rem;
        font-style: italic;
    }
</style>
