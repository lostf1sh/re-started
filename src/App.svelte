<script>
    import Tasks from './lib/components/Tasks.svelte'
    import NewsFeed from './lib/components/NewsFeed.svelte'
    import Weather from './lib/components/Weather.svelte'
    import Links from './lib/components/Links.svelte'
    import Clock from './lib/components/Clock.svelte'
    import Stats from './lib/components/Stats.svelte'
    import Settings from './lib/components/Settings.svelte'
    import CommandPalette from './lib/components/CommandPalette.svelte'
    import { settings } from './lib/settings-store.svelte.js'
    import '@fontsource-variable/geist-mono'

    let showSettings = $state(false)
    let showCommandPalette = $state(false)
    let minimizedPanels = $state(new Set())

    // @ts-ignore injected at build time
    const version = __APP_VERSION__

    const motdPhrases = [
        'system nominal — awaiting input',
        'drag. drop. focus. hydrate.',
        'remember to take a stretch break',
        'syncing local cache ⇢ cloudless',
        'today is a good day for deep work',
        'monospace dreams powered by caffeine'
    ]

    const motd = motdPhrases[Math.floor(Math.random() * motdPhrases.length)]

    const sessionId = (() => {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            return crypto.randomUUID().split('-')[0].toUpperCase()
        }
        return Math.random().toString(16).slice(2, 6).toUpperCase()
    })()

    function closeSettings() {
        showSettings = false
    }

    function togglePanel(panelId) {
        if (minimizedPanels.has(panelId)) {
            minimizedPanels.delete(panelId)
        } else {
            minimizedPanels.add(panelId)
        }
    }

    function handleCommandPalette() {
        showCommandPalette = !showCommandPalette
    }

    function handleCommand(action) {
        switch (action) {
            case 'openSettings':
                showSettings = true
                break
            case 'refreshWeather':
                // This would need to be implemented in Weather component
                console.log('Refresh weather command')
                break
            case 'toggleTheme':
                // Toggle between available themes
                const themes = ['catppuccin-mocha', 'dark', 'light']
                const currentIndex = themes.indexOf(settings.theme)
                const nextTheme = themes[(currentIndex + 1) % themes.length]
                settings.theme = nextTheme
                break
            case 'addTask':
                // This would need to be implemented in Tasks component
                console.log('Add task command')
                break
            case 'clearCompleted':
                // This would need to be implemented in Tasks component
                console.log('Clear completed tasks command')
                break
            case 'showCompleted':
                // This would need to be implemented in Tasks component
                console.log('Show completed tasks command')
                break
            case 'showActive':
                // This would need to be implemented in Tasks component
                console.log('Show active tasks command')
                break
            case 'exportData':
                // This would need to be implemented in Settings component
                console.log('Export data command')
                break
            case 'importData':
                // This would need to be implemented in Settings component
                console.log('Import data command')
                break
            case 'clearCache':
                // Clear local storage cache
                localStorage.clear()
                location.reload()
                break
        }
    }
</script>

<main>
    <div class="frame">
        <div class="boot-message">
            <div class="boot-line">[INIT v{version} — session {sessionId}]</div>
            <div class="boot-line motd">{motd}</div>
        </div>

        <CommandPalette bind:showPalette={showCommandPalette} onCommand={handleCommand} />

        <div class="container">
            <div class="top">
                <div class="panel-wrapper" style="--panel-delay: 0.1s; animation-delay: 0.1s;" class:minimized={minimizedPanels.has('clock')}>
                    <Clock on:toggleMinimize={() => togglePanel('clock')} />
                </div>
                <div class="panel-wrapper" style="--panel-delay: 0.2s; animation-delay: 0.2s;" class:minimized={minimizedPanels.has('stats')}>
                    <Stats on:toggleMinimize={() => togglePanel('stats')} />
                </div>
            </div>
            <div class="widgets">
                <div class="panel-wrapper" style="--panel-delay: 0.3s; animation-delay: 0.3s;" class:minimized={minimizedPanels.has('weather')}>
                    <Weather on:toggleMinimize={() => togglePanel('weather')} />
                </div>
                <div class="panel-wrapper" style="--panel-delay: 0.4s; animation-delay: 0.4s;" class:minimized={minimizedPanels.has('widget')}>
                    {#if settings.widgetType === 'tasks'}
                        <Tasks on:toggleMinimize={() => togglePanel('widget')} />
                    {:else if settings.widgetType === 'news'}
                        <NewsFeed on:toggleMinimize={() => togglePanel('widget')} />
                    {/if}
                </div>
            </div>
            <div class="panel-wrapper" style="--panel-delay: 0.5s; animation-delay: 0.5s;" class:minimized={minimizedPanels.has('links')}>
                <Links on:toggleMinimize={() => togglePanel('links')} />
            </div>
        </div>
    </div>

    <div class="control-bar">
        <button
            class="control-btn"
            onclick={handleCommandPalette}
            title="Command Palette (Ctrl/Cmd+K)"
            aria-label="Open command palette"
        >
            <span class="control-text">ctrl+k</span>
        </button>
        <button
            class="control-btn settings-btn-main"
            onclick={() => (showSettings = true)}
            title="Settings"
            aria-label="Open settings"
        >
            <span class="settings-text">settings</span>
            <span class="cursor">_</span>
        </button>
    </div>

    <Settings {showSettings} {closeSettings} />
</main>

<style>
    main {
        display: flex;
        flex-direction: column;
        min-height: 100vh;
        justify-content: center;
        align-items: center;
        position: relative;
        padding: 2rem 1.5rem 5rem;
        width: 100%;
    }
    .frame {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        animation: fadeInUp 0.4s cubic-bezier(0.4, 0, 0.2, 1) backwards;
        width: min(1000px, 100%);
    }
    .boot-message {
        font-size: 0.7rem;
        color: var(--txt-4);
        font-family: 'Geist Mono Variable', monospace;
        animation: fadeInUp 0.3s cubic-bezier(0.4, 0, 0.2, 1) backwards;
        margin-bottom: 0.25rem;
        letter-spacing: 0.08em;
    }
    .boot-line {
        opacity: 0;
        animation: fadeIn 0.3s ease-in forwards;
    }
    .boot-line:nth-child(1) {
        animation-delay: 0s;
    }
    .boot-line:nth-child(2) {
        animation-delay: 0.08s;
    }
    .motd {
        color: var(--txt-3);
        font-style: italic;
    }
    @keyframes fadeIn {
        from {
            opacity: 0;
        }
        to {
            opacity: 1;
        }
    }
    .container {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        width: 100%;
    }
    .panel-wrapper {
        animation: fadeInUp 0.4s cubic-bezier(0.4, 0, 0.2, 1) backwards;
        flex: 1;
        min-width: 280px;
        transition: all 0.3s ease;
    }
    .panel-wrapper.minimized {
        opacity: 0.3;
        transform: scale(0.95);
    }
    .panel-wrapper :global(.panel) {
        height: 100%;
    }
    .top,
    .widgets {
        display: flex;
        gap: 1rem;
        flex-wrap: wrap;
        align-items: stretch;
    }
    .control-bar {
        position: fixed;
        bottom: 1.5rem;
        right: 1.5rem;
        display: flex;
        gap: 0.5rem;
        z-index: 100;
    }
    .control-btn {
        padding: 0.5rem 0.75rem;
        background: rgba(30, 30, 46, 0.9);
        border: 1px solid var(--bg-3);
        color: var(--txt-3);
        font-family: 'Geist Mono Variable', monospace;
        font-size: 0.7rem;
        cursor: pointer;
        transition: all 0.2s ease;
        backdrop-filter: blur(4px);
        text-transform: uppercase;
        letter-spacing: 0.1em;
    }
    .control-btn:hover {
        background: var(--bg-2);
        color: var(--txt-1);
        border-color: var(--txt-4);
        transform: translateY(-1px);
    }
    .control-text {
        font-weight: 500;
    }
    .settings-btn-main {
        display: flex;
        align-items: center;
        gap: 0.25rem;
    }
    .settings-text {
        font-weight: 500;
    }
    .cursor {
        animation: blink 1s infinite;
        font-weight: 700;
    }
    @media (max-width: 960px) {
        main {
            padding: 1.5rem 1rem 4rem;
        }
        .frame {
            gap: 0.5rem;
        }
        .top,
        .widgets {
            flex-direction: column;
            gap: 0.5rem;
        }
        .panel-wrapper {
            min-width: 100%;
        }
        .control-bar {
            bottom: 1rem;
            right: 1rem;
        }
        .control-btn {
            padding: 0.4rem 0.6rem;
            font-size: 0.65rem;
        }
    }
    @media (max-width: 640px) {
        main {
            padding: 1rem 0.5rem 3.5rem;
        }
        .boot-message {
            font-size: 0.65rem;
        }
    }
</style>
