<script>
    import { fade, fly } from 'svelte/transition'
    
    let { onCommand = () => {} } = $props()
    
    let showPalette = $state(false)
    let query = $state('')
    let selectedIndex = $state(0)
    
    const commands = [
        {
            category: 'Navigation',
            items: [
                { id: 'open-settings', name: 'Open Settings', shortcut: 'Ctrl+,', action: () => onCommand('openSettings') },
                { id: 'refresh-weather', name: 'Refresh Weather', shortcut: 'Ctrl+R', action: () => onCommand('refreshWeather') },
                { id: 'toggle-theme', name: 'Toggle Theme', action: () => onCommand('toggleTheme') }
            ]
        },
        {
            category: 'Tasks',
            items: [
                { id: 'add-task', name: 'Add New Task', shortcut: 'Ctrl+N', action: () => onCommand('addTask') },
                { id: 'clear-completed', name: 'Clear Completed Tasks', action: () => onCommand('clearCompleted') },
                { id: 'show-completed', name: 'Show Completed Tasks', action: () => onCommand('showCompleted') },
                { id: 'show-active', name: 'Show Active Tasks', action: () => onCommand('showActive') }
            ]
        },
        {
            category: 'System',
            items: [
                { id: 'export-data', name: 'Export Data', shortcut: 'Ctrl+S', action: () => onCommand('exportData') },
                { id: 'import-data', name: 'Import Data', shortcut: 'Ctrl+O', action: () => onCommand('importData') },
                { id: 'clear-cache', name: 'Clear Cache', action: () => onCommand('clearCache') }
            ]
        }
    ]
    
    let filteredCommands = $derived.by(() => {
        const q = query.toLowerCase()
        if (!q) return commands
        
        return commands.map(group => ({
            ...group,
            items: group.items.filter(item => 
                item.name.toLowerCase().includes(q) || 
                (item.shortcut || '').toLowerCase().includes(q)
            )
        })).filter(group => group.items.length > 0)
    })
    
    let flatCommands = $derived.by(() => {
        return filteredCommands.flatMap(group => group.items)
    })
    
    export function togglePalette() {
        showPalette = !showPalette
        if (showPalette) {
            query = ''
            selectedIndex = 0
        }
    }
    
    function handleKeydown(event) {
        if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
            event.preventDefault()
            togglePalette()
            return
        }
        
        if (!showPalette) return
        
        switch (event.key) {
            case 'Escape':
                event.preventDefault()
                showPalette = false
                break
            case 'ArrowDown':
                event.preventDefault()
                selectedIndex = Math.min(selectedIndex + 1, flatCommands.length - 1)
                break
            case 'ArrowUp':
                event.preventDefault()
                selectedIndex = Math.max(selectedIndex - 1, 0)
                break
            case 'Enter':
                event.preventDefault()
                if (flatCommands[selectedIndex]) {
                    flatCommands[selectedIndex].action()
                    showPalette = false
                }
                break
        }
    }
    
    function selectCommand(index) {
        if (flatCommands[index]) {
            flatCommands[index].action()
            showPalette = false
        }
    }
    
    $effect(() => {
        if (showPalette) {
            selectedIndex = 0
        }
    })
</script>

<svelte:window on:keydown={handleKeydown} />

{#if showPalette}
    <div 
        class="backdrop" 
        onclick={() => showPalette = false}
        transition:fade={{ duration: 150 }}
    ></div>
    
    <div 
        class="command-palette"
        transition:fly={{ y: -20, duration: 200 }}
    >
        <div class="input-wrapper">
            <span class="prompt">$</span>
            <input
                type="text"
                bind:value={query}
                placeholder="Type a command or search..."
                class="command-input"
                autofocus
            />
        </div>
        
        <div class="commands-list">
            {#each filteredCommands as group}
                <div class="command-category">
                    {group.category}
                </div>
                {#each group.items as item, index (item.id)}
                    {@const globalIndex = flatCommands.indexOf(item)}
                    <button
                        class="command-item"
                        class:selected={globalIndex === selectedIndex}
                        onclick={() => selectCommand(globalIndex)}
                    >
                        <span class="command-name">{item.name}</span>
                        {#if item.shortcut}
                            <span class="command-shortcut">{item.shortcut}</span>
                        {/if}
                    </button>
                {/each}
            {/each}
            
            {#if flatCommands.length === 0}
                <div class="no-results">No commands found</div>
            {/if}
        </div>
        
        <div class="command-hints">
            <span>↑↓ Navigate</span>
            <span>↵ Execute</span>
            <span>ESC Close</span>
        </div>
    </div>
{/if}

<style>
    .backdrop {
        position: fixed;
        inset: 0;
        background: rgba(25, 25, 35, 0.8);
        z-index: 1000;
        backdrop-filter: blur(2px);
    }
    
    .command-palette {
        position: fixed;
        top: 20%;
        left: 50%;
        transform: translateX(-50%);
        width: min(600px, 90vw);
        background: var(--bg-1);
        border: 1px solid var(--bg-3);
        border-radius: 4px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
        z-index: 1001;
        overflow: hidden;
        font-family: var(--font-mono);
    }
    
    .input-wrapper {
        display: flex;
        align-items: center;
        padding: 1rem;
        border-bottom: 1px solid var(--bg-3);
    }
    
    .prompt {
        color: var(--accent-teal);
        font-weight: 500;
        margin-right: 0.5rem;
        font-size: 1rem;
    }
    
    .command-input {
        flex: 1;
        background: transparent;
        border: none;
        color: var(--txt-1);
        font-family: inherit;
        font-size: var(--font-size-base);
        outline: none;
    }
    
    .command-input::placeholder {
        color: var(--txt-4);
    }
    
    .commands-list {
        max-height: 400px;
        overflow-y: auto;
    }
    
    .command-category {
        padding: 0.5rem 1rem;
        font-size: var(--font-size-xs);
        color: var(--txt-3);
        text-transform: uppercase;
        letter-spacing: 0.1em;
        background: var(--bg-2);
        border-top: 1px solid var(--bg-3);
        font-family: var(--font-mono);
    }
    
    .command-category:first-child {
        border-top: none;
    }
    
    .command-item {
        width: 100%;
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.75rem 1rem;
        background: transparent;
        border: none;
        color: var(--txt-2);
        font-family: inherit;
        font-size: var(--font-size-sm);
        cursor: pointer;
        transition: all 0.2s ease;
    }
    
    .command-item:hover,
    .command-item.selected {
        background: var(--bg-2);
        color: var(--accent-lavender);
    }
    
    .command-name {
        flex: 1;
    }
    
    .command-shortcut {
        color: var(--txt-4);
        font-size: var(--font-size-xs);
        background: var(--bg-3);
        padding: 0.25rem 0.5rem;
        border-radius: 2px;
        font-family: var(--font-mono);
    }
    
    .command-hints {
        display: flex;
        gap: 1rem;
        padding: 0.5rem 1rem;
        font-size: var(--font-size-xs);
        color: var(--txt-4);
        background: var(--bg-2);
        border-top: 1px solid var(--bg-3);
        font-family: var(--font-mono);
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }
    
    .no-results {
        padding: 2rem;
        text-align: center;
        color: var(--txt-3);
        font-style: italic;
        font-family: var(--font-mono);
    }
</style>