<script>
    import Tasks from './lib/components/Tasks.svelte'
    import NewsFeed from './lib/components/NewsFeed.svelte'
    import Weather from './lib/components/Weather.svelte'
    import Links from './lib/components/Links.svelte'
    import Clock from './lib/components/Clock.svelte'
    import Stats from './lib/components/Stats.svelte'
    import Settings from './lib/components/Settings.svelte'
    import { settings } from './lib/settings-store.svelte.js'
    import '@fontsource-variable/geist-mono'

    let showSettings = $state(false)

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
</script>

<main>
    <div class="frame">
        <div class="boot-message">
            <div class="boot-line">[RE-STARTED v{version} — session {sessionId}]</div>
            <div class="boot-line motd">{motd}</div>
        </div>

        <div class="container">
            <div class="top">
                <div class="panel-wrapper" style="--panel-delay: 0.1s; animation-delay: 0.1s;">
                    <Clock />
                </div>
                <div class="panel-wrapper" style="--panel-delay: 0.2s; animation-delay: 0.2s;">
                    <Stats />
                </div>
            </div>
            <div class="widgets">
                <div class="panel-wrapper" style="--panel-delay: 0.3s; animation-delay: 0.3s;">
                    <Weather />
                </div>
                <div class="panel-wrapper" style="--panel-delay: 0.4s; animation-delay: 0.4s;">
                    {#if settings.widgetType === 'tasks'}
                        <Tasks />
                    {:else if settings.widgetType === 'news'}
                        <NewsFeed />
                    {/if}
                </div>
            </div>
            <div class="panel-wrapper" style="--panel-delay: 0.5s; animation-delay: 0.5s;">
                <Links />
            </div>
        </div>
    </div>

    <button
        class="settings-btn"
        onclick={() => (showSettings = true)}
        aria-label="Open settings"
    >
        <span class="settings-text">settings</span>
        <span class="cursor">_</span>
    </button>

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
        padding: 3rem 1.5rem 4rem;
        width: 100%;
    }
    .frame {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        animation: fadeInUp 0.6s cubic-bezier(0.4, 0, 0.2, 1) backwards;
        width: min(1100px, 100%);
    }
    .boot-message {
        font-size: 0.75rem;
        color: var(--txt-4);
        font-family: 'Geist Mono Variable', monospace;
        animation: fadeInUp 0.4s cubic-bezier(0.4, 0, 0.2, 1) backwards;
        margin-bottom: 0.25rem;
        letter-spacing: 0.08em;
    }
    .boot-line {
        opacity: 0;
        animation: fadeIn 0.4s ease-in forwards;
    }
    .boot-line:nth-child(1) {
        animation-delay: 0s;
    }
    .boot-line:nth-child(2) {
        animation-delay: 0.1s;
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
        gap: 1.5rem;
        width: 100%;
    }
    .panel-wrapper {
        animation: fadeInUp 0.6s cubic-bezier(0.4, 0, 0.2, 1) backwards;
        flex: 1;
        min-width: 280px;
    }
    .panel-wrapper :global(.panel) {
        height: 100%;
    }
    .top,
    .widgets {
        display: flex;
        gap: 1.5rem;
        flex-wrap: wrap;
        align-items: stretch;
    }
    .settings-btn {
        position: fixed;
        bottom: 1.5rem;
        right: 1.5rem;
        padding: 0.75rem 1.25rem;
        opacity: 0.85;
        transition: all 0.3s ease;
        z-index: 100;
        color: var(--txt-3);
        display: flex;
        align-items: center;
        gap: 0.35rem;
        background: rgba(49, 50, 68, 0.75);
        border: 1px solid var(--bg-4);
        border-radius: 999px;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        font-size: 0.7rem;
        backdrop-filter: blur(8px);
        box-shadow: 0 15px 35px rgba(0, 0, 0, 0.45);
    }
    .settings-btn:hover {
        opacity: 1;
        color: var(--txt-1);
        transform: translateY(-2px);
        box-shadow: 0 20px 45px rgba(0, 0, 0, 0.55);
    }
    .settings-btn:focus-visible {
        outline: 2px solid var(--txt-2);
        outline-offset: 4px;
    }
    .settings-text {
        font-weight: 600;
    }
    .cursor {
        animation: blink 1s infinite;
        font-weight: 700;
    }
    @media (max-width: 960px) {
        main {
            padding: 2rem 1.5rem 3rem;
        }
        .top,
        .widgets {
            flex-direction: column;
        }
        .panel-wrapper {
            min-width: 100%;
        }
    }
    @media (max-width: 640px) {
        main {
            padding: 2rem 1rem 4rem;
        }
        .settings-btn {
            right: 1rem;
            bottom: 1rem;
            opacity: 1;
        }
    }
</style>
