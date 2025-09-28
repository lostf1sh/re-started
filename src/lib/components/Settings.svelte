<script>
    import { fly, fade } from 'svelte/transition'
    import { settings, saveSettings, applyTheme } from '../settings-store.svelte.js'
    import { addTask } from '../local-tasks-store.svelte.js'
    import { exportUserData, importUserData, getBackupInfo } from '../data-manager.js'

    let { showSettings = false, closeSettings } = $props()

    // @ts-ignore
    const version = __APP_VERSION__

    // Task form
    let newTaskTitle = $state('')
    let newTaskDue = $state('')
    let newTaskNotes = $state('')
    
    // Import/Export
    let importMessage = $state('')
    let importError = $state('')
    let fileInput = $state(null)
    let isDragOver = $state(false)

    function addLink() {
        settings.links = [...settings.links, { title: '', url: '' }]
    }

    function removeLink(index) {
        settings.links = settings.links.filter((_, i) => i !== index)
    }

    function handleClose() {
        saveSettings(settings)
        closeSettings()
    }

    function handleKeydown(event) {
        if (event.key === 'Escape') {
            handleClose()
        }
    }

    function addNewTask() {
        if (!newTaskTitle.trim()) return
        
        const due = newTaskDue ? new Date(newTaskDue) : null
        addTask(newTaskTitle, due, newTaskNotes)
        
        // Reset form
        newTaskTitle = ''
        newTaskDue = ''
        newTaskNotes = ''
    }

    function changeTheme(theme) {
        settings.theme = theme
        applyTheme(theme)
    }

    function updateCustomTheme(colorKey, value) {
        settings.customTheme[colorKey] = value
        if (settings.theme === 'custom') {
            applyTheme('custom')
        }
    }

    function resetCustomTheme() {
        settings.customTheme = {
            bg1: '#1e1e2e',
            bg2: '#313244',
            bg3: '#45475a',
            bg4: '#585b70',
            txt4: '#6c7086',
            txt3: '#a6adc8',
            txt2: '#cdd6f4',
            txt1: '#f5e0dc',
            txtErr: '#f38ba8'
        }
        if (settings.theme === 'custom') {
            applyTheme('custom')
        }
    }

    function handleExport() {
        try {
            exportUserData()
            importMessage = 'Backup file downloaded successfully!'
            importError = ''
            setTimeout(() => importMessage = '', 3000)
        } catch (error) {
            importError = `Export failed: ${error.message}`
            importMessage = ''
        }
    }

    function handleFileSelect(event) {
        const file = event.target.files[0]
        if (file) {
            handleImport(file)
        }
    }

    async function handleImport(file) {
        try {
            importError = ''
            importMessage = 'Importing backup...'
            
            const result = await importUserData(file)
            importMessage = result.message
            
            // Show detailed import info
            console.log('Import successful:', result.itemsImported)
            
            // Clear file input
            if (fileInput) {
                fileInput.value = ''
            }
            
            setTimeout(() => importMessage = '', 5000)
        } catch (error) {
            importError = error.message
            importMessage = ''
            
            // Clear file input
            if (fileInput) {
                fileInput.value = ''
            }
        }
    }

    function handleDragOver(event) {
        event.preventDefault()
        isDragOver = true
    }

    function handleDragLeave(event) {
        event.preventDefault()
        isDragOver = false
    }

    function handleDrop(event) {
        event.preventDefault()
        isDragOver = false
        
        const files = event.dataTransfer.files
        if (files.length > 0) {
            handleImport(files[0])
        }
    }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if showSettings}
    <div
        class="backdrop"
        onclick={handleClose}
        onkeydown={(e) => e.key === 'Enter' && handleClose()}
        role="button"
        tabindex="0"
        transition:fade={{ duration: 200 }}
    ></div>

    <div class="settings" transition:fly={{ x: 640, duration: 200 }}>
        <div class="header">
            <h2>settings</h2>
            <button class="close-btn" onclick={handleClose}>×</button>
        </div>

        <div class="content">
            <div class="group">
                <div class="setting-label">time format</div>
                <div class="radio-group">
                    <label class="radio-label">
                        <input
                            type="radio"
                            bind:group={settings.timeFormat}
                            value="12hr"
                        />
                        12 hour
                    </label>
                    <label class="radio-label">
                        <input
                            type="radio"
                            bind:group={settings.timeFormat}
                            value="24hr"
                        />
                        24 hour
                    </label>
                </div>
            </div>
            <div class="group">
                <div class="setting-label">theme</div>
                <div class="radio-group">
                    <label class="radio-label">
                        <input
                            type="radio"
                            bind:group={settings.theme}
                            value="catppuccin-mocha"
                            onchange={() => changeTheme('catppuccin-mocha')}
                        />
                        catppuccin mocha
                    </label>
                    <label class="radio-label">
                        <input
                            type="radio"
                            bind:group={settings.theme}
                            value="dark"
                            onchange={() => changeTheme('dark')}
                        />
                        dark
                    </label>
                    <label class="radio-label">
                        <input
                            type="radio"
                            bind:group={settings.theme}
                            value="light"
                            onchange={() => changeTheme('light')}
                        />
                        light
                    </label>
                    <label class="radio-label">
                        <input
                            type="radio"
                            bind:group={settings.theme}
                            value="custom"
                            onchange={() => changeTheme('custom')}
                        />
                        custom
                    </label>
                </div>
            </div>
            {#if settings.theme === 'custom'}
                <div class="group">
                    <div class="setting-label">custom theme colors</div>
                    <div class="color-grid">
                        <div class="color-item">
                            <label for="bg1-color">Background 1</label>
                            <div class="color-input-group">
                                <input
                                    id="bg1-color"
                                    type="color"
                                    bind:value={settings.customTheme.bg1}
                                    onchange={() => updateCustomTheme('bg1', settings.customTheme.bg1)}
                                />
                                <input
                                    type="text"
                                    bind:value={settings.customTheme.bg1}
                                    onchange={() => updateCustomTheme('bg1', settings.customTheme.bg1)}
                                    class="color-text"
                                />
                            </div>
                        </div>
                        <div class="color-item">
                            <label for="bg2-color">Background 2</label>
                            <div class="color-input-group">
                                <input
                                    id="bg2-color"
                                    type="color"
                                    bind:value={settings.customTheme.bg2}
                                    onchange={() => updateCustomTheme('bg2', settings.customTheme.bg2)}
                                />
                                <input
                                    type="text"
                                    bind:value={settings.customTheme.bg2}
                                    onchange={() => updateCustomTheme('bg2', settings.customTheme.bg2)}
                                    class="color-text"
                                />
                            </div>
                        </div>
                        <div class="color-item">
                            <label for="bg3-color">Background 3</label>
                            <div class="color-input-group">
                                <input
                                    id="bg3-color"
                                    type="color"
                                    bind:value={settings.customTheme.bg3}
                                    onchange={() => updateCustomTheme('bg3', settings.customTheme.bg3)}
                                />
                                <input
                                    type="text"
                                    bind:value={settings.customTheme.bg3}
                                    onchange={() => updateCustomTheme('bg3', settings.customTheme.bg3)}
                                    class="color-text"
                                />
                            </div>
                        </div>
                        <div class="color-item">
                            <label for="txt1-color">Text 1</label>
                            <div class="color-input-group">
                                <input
                                    id="txt1-color"
                                    type="color"
                                    bind:value={settings.customTheme.txt1}
                                    onchange={() => updateCustomTheme('txt1', settings.customTheme.txt1)}
                                />
                                <input
                                    type="text"
                                    bind:value={settings.customTheme.txt1}
                                    onchange={() => updateCustomTheme('txt1', settings.customTheme.txt1)}
                                    class="color-text"
                                />
                            </div>
                        </div>
                        <div class="color-item">
                            <label for="txt2-color">Text 2</label>
                            <div class="color-input-group">
                                <input
                                    id="txt2-color"
                                    type="color"
                                    bind:value={settings.customTheme.txt2}
                                    onchange={() => updateCustomTheme('txt2', settings.customTheme.txt2)}
                                />
                                <input
                                    type="text"
                                    bind:value={settings.customTheme.txt2}
                                    onchange={() => updateCustomTheme('txt2', settings.customTheme.txt2)}
                                    class="color-text"
                                />
                            </div>
                        </div>
                        <div class="color-item">
                            <label for="txt3-color">Text 3</label>
                            <div class="color-input-group">
                                <input
                                    id="txt3-color"
                                    type="color"
                                    bind:value={settings.customTheme.txt3}
                                    onchange={() => updateCustomTheme('txt3', settings.customTheme.txt3)}
                                />
                                <input
                                    type="text"
                                    bind:value={settings.customTheme.txt3}
                                    onchange={() => updateCustomTheme('txt3', settings.customTheme.txt3)}
                                    class="color-text"
                                />
                            </div>
                        </div>
                    </div>
                    <div class="theme-actions">
                        <button onclick={resetCustomTheme} class="reset-theme-btn">
                            reset to catppuccin
                        </button>
                    </div>
                </div>
            {/if}
            <div class="group">
                <div class="setting-label">widget type</div>
                <div class="radio-group">
                    <label class="radio-label">
                        <input
                            type="radio"
                            bind:group={settings.widgetType}
                            value="tasks"
                        />
                        tasks
                    </label>
                    <label class="radio-label">
                        <input
                            type="radio"
                            bind:group={settings.widgetType}
                            value="news"
                        />
                        news feed
                    </label>
                </div>
            </div>
            {#if settings.widgetType === 'tasks'}
                <div class="group">
                    <div class="setting-label">add new task</div>
                    <input
                        type="text"
                        bind:value={newTaskTitle}
                        placeholder="Task title..."
                        class="task-input"
                    />
                    <input
                        type="date"
                        bind:value={newTaskDue}
                        class="task-input"
                        title="Due date (optional)"
                    />
                    <textarea
                        bind:value={newTaskNotes}
                        placeholder="Notes (optional)"
                        class="task-notes"
                        rows="2"
                    ></textarea>
                    <button onclick={addNewTask} class="add-task-btn" disabled={!newTaskTitle.trim()}>
                        add task
                    </button>
                </div>
            {/if}
            <div class="group">
                <div class="setting-label">backup & restore</div>
                <div class="backup-actions">
                    <button onclick={handleExport} class="backup-btn export-btn">
                        📥 export backup
                    </button>
                    <input
                        bind:this={fileInput}
                        type="file"
                        accept=".json"
                        onchange={handleFileSelect}
                        style="display: none"
                    />
                    <button onclick={() => fileInput?.click()} class="backup-btn import-btn">
                        📤 import backup
                    </button>
                </div>
                <div 
                    class="drop-zone"
                    class:drag-over={isDragOver}
                    ondragover={handleDragOver}
                    ondragleave={handleDragLeave}
                    ondrop={handleDrop}
                    role="button"
                    tabindex="0"
                    onkeydown={(e) => e.key === 'Enter' && fileInput?.click()}
                >
                    <div class="drop-text">
                        {#if isDragOver}
                            Drop your backup file here
                        {:else}
                            Or drag & drop your backup file here
                        {/if}
                    </div>
                </div>
                {#if importMessage}
                    <div class="import-success">{importMessage}</div>
                {/if}
                {#if importError}
                    <div class="import-error">{importError}</div>
                {/if}
            </div>
            <div class="group">
                <label for="latitude">latitude</label>
                <input
                    id="latitude"
                    type="number"
                    bind:value={settings.latitude}
                    step="0.01"
                />
            </div>
            <div class="group">
                <label for="longitude">longitude</label>
                <input
                    id="longitude"
                    type="number"
                    bind:value={settings.longitude}
                    step="0.01"
                />
            </div>
            <div class="group">
                <div class="setting-label">temperature format</div>
                <div class="radio-group">
                    <label class="radio-label">
                        <input
                            type="radio"
                            bind:group={settings.tempUnit}
                            value="fahrenheit"
                        />
                        fahrenheit
                    </label>
                    <label class="radio-label">
                        <input
                            type="radio"
                            bind:group={settings.tempUnit}
                            value="celsius"
                        />
                        celsius
                    </label>
                </div>
            </div>
            <div class="group">
                <div class="setting-label">speed format</div>
                <div class="radio-group">
                    <label class="radio-label">
                        <input
                            type="radio"
                            bind:group={settings.speedUnit}
                            value="mph"
                        />
                        mph
                    </label>
                    <label class="radio-label">
                        <input
                            type="radio"
                            bind:group={settings.speedUnit}
                            value="kmh"
                        />
                        kmh
                    </label>
                </div>
            </div>
            <div class="group">
                <label for="linksPerColumn">links per column</label>
                <input
                    id="linksPerColumn"
                    type="number"
                    bind:value={settings.linksPerColumn}
                    step="1"
                />
            </div>
            <div class="group">
                <div class="links-header">
                    <div class="setting-label">links</div>
                    <button class="add-btn" onclick={addLink}>add link</button>
                </div>
                <div class="links-list">
                    {#each settings.links as link, index}
                        <div class="link">
                            <input
                                type="text"
                                bind:value={link.title}
                                placeholder="title"
                                class="link-input name"
                            />
                            <input
                                type="url"
                                bind:value={link.url}
                                placeholder="https://example.com"
                                class="link-input"
                            />
                            <button
                                class="remove-btn"
                                onclick={() => removeLink(index)}
                            >
                                ×
                            </button>
                        </div>
                    {/each}
                </div>
            </div>
            <div class="version">
                re-start
                {#if version}v{version}
                {/if} • made with ❤️ by
                <a href="https://refact0r.dev" target="_blank">refact0r</a>
                •
                <a href="https://github.com/refact0r/re-start" target="_blank"
                    >github</a
                >
            </div>
        </div>
    </div>
{/if}

<style>
    .backdrop {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 999;
    }
    .settings {
        position: fixed;
        top: 0;
        right: 0;
        width: 40rem;
        height: 100%;
        background: var(--bg-1);
        border-left: 2px solid var(--bg-3);
        z-index: 1000;
        display: flex;
        flex-direction: column;
    }
    .header {
        padding: 0.75rem 1rem 0.75rem 1.5rem;
        border-bottom: 2px solid var(--bg-3);
        display: flex;
        justify-content: space-between;
        align-items: center;

        h2 {
            margin: 0;
        }
    }
    .close-btn {
        padding: 0 0.5rem;
        font-size: 1.75rem;
        line-height: 2.25rem;
        font-weight: 300;
    }
    .content {
        flex: 1;
        padding: 1.5rem;
        overflow-y: auto;
        scrollbar-width: thin;
        scrollbar-color: var(--bg-3) var(--bg-1);
    }
    .group {
        margin-bottom: 1.5rem;
    }
    .group > label,
    .setting-label {
        display: block;
        margin-bottom: 0.5rem;
    }
    .group input[type='text'],
    .group input[type='number'],
    .group input[type='url'] {
        width: 100%;
        padding: 0.5rem;
        background: var(--bg-2);
        border: 2px solid var(--bg-3);
    }
    .links-header {
        display: flex;
        justify-content: space-between;
    }
    .add-btn {
        height: 1.5rem;
    }
    .link {
        display: flex;
        margin-bottom: 0.5rem;
    }
    .link-input.name {
        width: 12rem;
        margin-right: 0.5rem;
    }
    .remove-btn {
        padding-left: 0.5rem;
        font-size: 1.5rem;
        font-weight: 300;
    }
    .version {
        color: var(--txt-3);
    }
    .task-input, .task-notes {
        width: 100%;
        padding: 0.5rem;
        margin-bottom: 0.5rem;
        background: var(--bg-2);
        border: 2px solid var(--bg-3);
        color: var(--txt-1);
    }
    .task-notes {
        resize: vertical;
        min-height: 2rem;
    }
    .add-task-btn {
        padding: 0.5rem 1rem;
        background: var(--txt-1);
        color: var(--bg-1);
        border: none;
        border-radius: 0.25rem;
        cursor: pointer;
    }
    .add-task-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
    .color-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
        margin-bottom: 1rem;
    }
    .color-item {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }
    .color-item label {
        font-size: 0.875rem;
        color: var(--txt-3);
        font-weight: 500;
    }
    .color-input-group {
        display: flex;
        gap: 0.5rem;
        align-items: center;
    }
    .color-input-group input[type="color"] {
        width: 2rem;
        height: 2rem;
        border: 2px solid var(--bg-3);
        cursor: pointer;
        background: none;
    }
    .color-text {
        flex: 1;
        padding: 0.5rem;
        background: var(--bg-2);
        border: 2px solid var(--bg-3);
        color: var(--txt-1);
        font-family: monospace;
        font-size: 0.875rem;
    }
    .theme-actions {
        display: flex;
        justify-content: center;
        margin-top: 1rem;
    }
    .reset-theme-btn {
        padding: 0.5rem 1rem;
        background: var(--bg-3);
        color: var(--txt-1);
        border: 2px solid var(--bg-3);
        cursor: pointer;
        font-size: 0.875rem;
    }
    .reset-theme-btn:hover {
        background: var(--bg-4);
        border-color: var(--txt-3);
    }
    .backup-actions {
        display: flex;
        gap: 1rem;
        margin-bottom: 1rem;
    }
    .backup-btn {
        flex: 1;
        padding: 0.75rem 1rem;
        border: 2px solid var(--bg-3);
        cursor: pointer;
        font-size: 0.875rem;
        font-weight: 500;
        text-align: center;
        transition: all 0.2s;
    }
    .export-btn {
        background: var(--accent-green);
        color: var(--bg-1);
        border-color: var(--accent-green);
    }
    .export-btn:hover {
        background: var(--accent-teal);
        border-color: var(--accent-teal);
    }
    .import-btn {
        background: var(--accent-blue);
        color: var(--bg-1);
        border-color: var(--accent-blue);
    }
    .import-btn:hover {
        background: var(--accent-sapphire);
        border-color: var(--accent-sapphire);
    }
    .drop-zone {
        padding: 2rem;
        border: 2px dashed var(--bg-3);
        text-align: center;
        transition: all 0.2s;
        background: var(--bg-2);
        margin-bottom: 1rem;
    }
    .drop-zone.drag-over {
        border-color: var(--accent-blue);
        background: var(--bg-3);
    }
    .drop-text {
        color: var(--txt-3);
        font-size: 0.875rem;
    }
    .drop-zone.drag-over .drop-text {
        color: var(--accent-blue);
        font-weight: 500;
    }
    .import-success {
        padding: 0.75rem;
        background: var(--accent-green);
        color: var(--bg-1);
        border: 2px solid var(--accent-green);
        font-size: 0.875rem;
        text-align: center;
    }
    .import-error {
        padding: 0.75rem;
        background: var(--accent-red);
        color: var(--bg-1);
        border: 2px solid var(--accent-red);
        font-size: 0.875rem;
        text-align: center;
    }
</style>
