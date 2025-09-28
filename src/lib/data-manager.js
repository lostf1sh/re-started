/**
 * Data Export/Import Manager
 * Handles saving and loading all user data
 */

import { settings, saveSettings, applyTheme } from './settings-store.svelte.js'
import { tasks, saveTasks } from './local-tasks-store.svelte.js'

const DATA_VERSION = '1.0'

/**
 * Export all user data to a JSON file
 */
export function exportUserData() {
    const exportData = {
        version: DATA_VERSION,
        timestamp: new Date().toISOString(),
        appName: 're-start',
        settings: {
            ...settings,
        },
        tasks: [...tasks],
        // Clear sensitive data
        exported: true
    }

    // Remove any sensitive information
    if (exportData.settings.todoistApiToken) {
        exportData.settings.todoistApiToken = ''
    }

    const dataStr = JSON.stringify(exportData, null, 2)
    const blob = new Blob([dataStr], { type: 'application/json' })
    
    // Generate filename with timestamp
    const now = new Date()
    const timestamp = now.toISOString().split('T')[0] // YYYY-MM-DD
    const filename = `re-start-backup-${timestamp}.json`
    
    // Download file
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    
    // Cleanup
    URL.revokeObjectURL(url)
    
    return exportData
}

/**
 * Import user data from JSON file
 */
export async function importUserData(file) {
    return new Promise((resolve, reject) => {
        if (!file) {
            reject(new Error('No file provided'))
            return
        }

        if (file.type !== 'application/json') {
            reject(new Error('Invalid file type. Please select a JSON file.'))
            return
        }

        const reader = new FileReader()
        
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result)
                
                // Validate data structure
                if (!validateImportData(data)) {
                    reject(new Error('Invalid backup file format'))
                    return
                }
                
                // Apply imported data
                applyImportedData(data)
                
                resolve({
                    success: true,
                    message: `Successfully imported backup from ${new Date(data.timestamp).toLocaleDateString()}`,
                    itemsImported: {
                        settings: !!data.settings,
                        tasks: data.tasks?.length || 0,
                        theme: data.settings?.theme || 'unknown'
                    }
                })
                
            } catch (error) {
                reject(new Error(`Failed to parse backup file: ${error.message}`))
            }
        }
        
        reader.onerror = () => {
            reject(new Error('Failed to read file'))
        }
        
        reader.readAsText(file)
    })
}

/**
 * Validate imported data structure
 */
function validateImportData(data) {
    // Check required fields
    if (!data.version || !data.timestamp) {
        return false
    }
    
    // Check if it's a re-start backup
    if (data.appName !== 're-start') {
        return false
    }
    
    // Check version compatibility
    if (data.version !== DATA_VERSION) {
        console.warn(`Version mismatch: expected ${DATA_VERSION}, got ${data.version}`)
        // For now, we'll be lenient with version mismatches
    }
    
    return true
}

/**
 * Apply imported data to current state
 */
function applyImportedData(data) {
    // Import settings
    if (data.settings) {
        // Merge with current settings to preserve any new fields
        Object.assign(settings, {
            ...settings, // Keep current defaults
            ...data.settings, // Override with imported values
        })
        
        // Apply theme
        applyTheme(settings.theme)
        
        // Save to localStorage
        saveSettings(settings)
    }
    
    // Import tasks
    if (data.tasks && Array.isArray(data.tasks)) {
        // Clear current tasks
        tasks.length = 0
        
        // Add imported tasks with proper date conversion
        data.tasks.forEach(task => {
            tasks.push({
                ...task,
                due: task.due ? new Date(task.due) : null,
                createdAt: task.createdAt ? new Date(task.createdAt) : new Date(),
                completedAt: task.completedAt ? new Date(task.completedAt) : null
            })
        })
        
        // Save to localStorage
        saveTasks(tasks)
    }
}

/**
 * Create a quick backup before major operations
 */
export function createQuickBackup() {
    const backup = {
        settings: { ...settings },
        tasks: [...tasks],
        timestamp: new Date().toISOString()
    }
    
    localStorage.setItem('re-start-quick-backup', JSON.stringify(backup))
    return backup
}

/**
 * Restore from quick backup
 */
export function restoreQuickBackup() {
    try {
        const backup = localStorage.getItem('re-start-quick-backup')
        if (!backup) return false
        
        const data = JSON.parse(backup)
        applyImportedData(data)
        return true
    } catch (error) {
        console.error('Failed to restore quick backup:', error)
        return false
    }
}

/**
 * Clear all user data (factory reset)
 */
export function factoryReset() {
    // Create backup before reset
    createQuickBackup()
    
    // Clear localStorage
    localStorage.clear()
    
    // Reload page to reset to defaults
    window.location.reload()
}

/**
 * Get backup info without downloading
 */
export function getBackupInfo() {
    return {
        totalTasks: tasks.length,
        activeTasks: tasks.filter(t => !t.completed).length,
        completedTasks: tasks.filter(t => t.completed).length,
        customLinks: settings.links?.length || 0,
        theme: settings.theme,
        hasCustomTheme: settings.theme === 'custom',
        lastModified: new Date().toISOString()
    }
}

