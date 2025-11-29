/**
 * Local Tasks Store - Simple task management with localStorage
 */

let defaultTasks = []

function loadTasks() {
    try {
        const stored = localStorage.getItem('local_tasks')
        if (stored) {
            const parsed = JSON.parse(stored)
            return parsed.map(task => ({
                ...task,
                due: task.due ? new Date(task.due) : null,
                createdAt: task.createdAt ? new Date(task.createdAt) : new Date(),
                completedAt: task.completedAt ? new Date(task.completedAt) : null
            }))
        }
    } catch (error) {
        console.error('failed to load tasks from localStorage:', error)
    }
    return defaultTasks
}

export function saveTasks(tasksToSave = tasks) {
    try {
        localStorage.setItem('local_tasks', JSON.stringify(tasksToSave))
    } catch (error) {
        console.error('failed to save tasks to localStorage:', error)
    }
}

export function addTask(title, due = null, notes = '') {
    const newTask = {
        id: crypto.randomUUID(),
        title: title.trim(),
        notes: notes.trim(),
        completed: false,
        due: due,
        createdAt: new Date(),
        completedAt: null,
        position: tasks.length
    }
    
    tasks.push(newTask)
    saveTasks(tasks)
    return newTask
}

export function updateTask(taskId, updates) {
    const index = tasks.findIndex(task => task.id === taskId)
    if (index === -1) return null
    
    tasks[index] = {
        ...tasks[index],
        ...updates,
        id: taskId // Ensure ID doesn't change
    }
    
    saveTasks(tasks)
    return tasks[index]
}

export function deleteTask(taskId) {
    const index = tasks.findIndex(task => task.id === taskId)
    if (index === -1) return false
    
    tasks.splice(index, 1)
    saveTasks(tasks)
    return true
}

export function toggleTask(taskId) {
    const task = tasks.find(task => task.id === taskId)
    if (!task) return null
    
    const completed = !task.completed
    return updateTask(taskId, {
        completed,
        completedAt: completed ? new Date() : null
    })
}

export function getTasks(showCompleted = false) {
    let filteredTasks = tasks
    
    if (!showCompleted) {
        filteredTasks = tasks.filter(task => !task.completed)
    }
    
    return sortTasks(filteredTasks)
}

export function getCompletedTasks() {
    return sortTasks(tasks.filter(task => task.completed))
}

export function clearCompletedTasks() {
    const activeTasks = tasks.filter(task => !task.completed)
    tasks.length = 0
    tasks.push(...activeTasks)
    saveTasks(tasks)
}

export function sortTasks(tasksToSort) {
    // Pre-convert dates to timestamps for faster comparison
    const tasksWithTimestamps = tasksToSort.map(task => ({
        task,
        dueTime: task.due ? new Date(task.due).getTime() : null,
        createdTime: task.createdAt ? new Date(task.createdAt).getTime() : 0,
        completedTime: task.completedAt ? new Date(task.completedAt).getTime() : null
    }))
    
    tasksWithTimestamps.sort((a, b) => {
        // Completed tasks last
        if (a.task.completed !== b.task.completed) {
            return a.task.completed ? 1 : -1
        }
        
        // Completed tasks: sort by completed date (recent first)
        if (a.task.completed) {
            if (a.completedTime && b.completedTime) {
                return b.completedTime - a.completedTime
            }
        }
        
        // Active tasks: sort by due date if available
        if (a.dueTime && b.dueTime) {
            return a.dueTime - b.dueTime
        }
        if (a.dueTime && !b.dueTime) return -1
        if (!a.dueTime && b.dueTime) return 1
        
        // Then by creation date
        return a.createdTime - b.createdTime
    })
    
    return tasksWithTimestamps.map(item => item.task)
}

export function isTaskOverdue(task) {
    if (!task.due || task.completed) return false
    const now = new Date()
    return new Date(task.due) < now
}

export function formatDueDate(date, hasTime = false) {
    if (!date) return ''
    
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const dueDate = new Date(date)
    const dueDateOnly = new Date(
        dueDate.getFullYear(),
        dueDate.getMonth(),
        dueDate.getDate()
    )
    
    const diffTime = dueDateOnly.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    let dateString = ''
    
    if (diffDays === -1) {
        dateString = 'yesterday'
    } else if (diffDays === 0) {
        dateString = 'today'
    } else if (diffDays === 1) {
        dateString = 'tmrw'
    } else if (diffDays > 1 && diffDays < 7) {
        dateString = dueDate
            .toLocaleDateString('en-US', {
                weekday: 'short',
            })
            .toLowerCase()
    } else {
        dateString = dueDate
            .toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
            })
            .toLowerCase()
    }
    
    if (hasTime) {
        let timeString
        if (settings.timeFormat === '12hr') {
            timeString = dueDate
                .toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true,
                })
                .toLowerCase()
        } else {
            timeString = dueDate.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: false,
            })
        }
        dateString += ` ${timeString}`
    }
    
    return dateString
}

// Initialize tasks from localStorage
export const tasks = $state(loadTasks())

// Import settings for time format
import { settings } from './settings-store.svelte.js'
