let defaultSettings = {
    timeFormat: '12hr',
    latitude: 38.388129,
    longitude: 27.175331,
    tempUnit: 'fahrenheit',
    speedUnit: 'mph',
    widgetType: 'tasks', // 'tasks' or 'news'
    theme: 'catppuccin-mocha', // 'catppuccin-mocha', 'dark', 'light', 'custom'
    customTheme: {
        bg1: '#1e1e2e',
        bg2: '#313244',
        bg3: '#45475a',
        bg4: '#585b70',
        txt4: '#6c7086',
        txt3: '#a6adc8',
        txt2: '#cdd6f4',
        txt1: '#f5e0dc',
        txtErr: '#f38ba8'
    },
    linksPerColumn: 4,
    links: [
        { title: 'gmail', url: 'https://mail.google.com' },
        { title: 'calendar', url: 'https://calendar.google.com' },
        { title: 'drive', url: 'https://drive.google.com' },
        { title: 'docs', url: 'https://docs.google.com' },
        { title: 'github', url: 'https://github.com' },
        { title: 'slack', url: 'https://slack.com' },
        { title: 'keep', url: 'https://keep.google.com' },
        { title: 'leetcode', url: 'https://leetcode.com/problemset' },
        { title: 'perplexity', url: 'https://perplexity.ai' },
        { title: 'claude', url: 'https://claude.ai' },
        { title: 'aistudio', url: 'https://aistudio.google.com' },
        { title: 'chatgpt', url: 'https://chat.openai.com' },
        { title: 'youtube', url: 'https://youtube.com' },
        { title: 'reddit', url: 'https://reddit.com' },
        { title: 'twitter', url: 'https://x.com' },
        { title: 'feedly', url: 'https://feedly.com' },
    ],
}

function loadSettings() {
    try {
        const stored = localStorage.getItem('settings')
        if (stored) {
            const parsed = JSON.parse(stored)
            return { ...defaultSettings, ...parsed }
        }
    } catch (error) {
        console.error('failed to load settings from localStorage:', error)
    }

    return defaultSettings
}

export function saveSettings(settings) {
    try {
        localStorage.setItem('settings', JSON.stringify(settings))
    } catch (error) {
        console.error('failed to save settings to localStorage:', error)
    }
}

export function applyTheme(theme) {
    const root = document.documentElement
    
    // Remove existing theme classes
    root.classList.remove('theme-catppuccin-mocha', 'theme-dark', 'theme-light')
    
    // Apply new theme
    root.classList.add(`theme-${theme}`)
    
    // Update CSS variables based on theme
    if (theme === 'catppuccin-mocha') {
        root.style.setProperty('--bg-1', '#1e1e2e')
        root.style.setProperty('--bg-2', '#313244')
        root.style.setProperty('--bg-3', '#45475a')
        root.style.setProperty('--bg-4', '#585b70')
        root.style.setProperty('--txt-4', '#6c7086')
        root.style.setProperty('--txt-3', '#a6adc8')
        root.style.setProperty('--txt-2', '#cdd6f4')
        root.style.setProperty('--txt-1', '#f5e0dc')
        root.style.setProperty('--txt-err', '#f38ba8')
    } else if (theme === 'dark') {
        root.style.setProperty('--bg-1', '#0d1117')
        root.style.setProperty('--bg-2', '#161b22')
        root.style.setProperty('--bg-3', '#21262d')
        root.style.setProperty('--bg-4', '#30363d')
        root.style.setProperty('--txt-4', '#7d8590')
        root.style.setProperty('--txt-3', '#8b949e')
        root.style.setProperty('--txt-2', '#c9d1d9')
        root.style.setProperty('--txt-1', '#f0f6fc')
        root.style.setProperty('--txt-err', '#f85149')
    } else if (theme === 'light') {
        root.style.setProperty('--bg-1', '#ffffff')
        root.style.setProperty('--bg-2', '#f6f8fa')
        root.style.setProperty('--bg-3', '#e1e4e8')
        root.style.setProperty('--bg-4', '#d1d5da')
        root.style.setProperty('--txt-4', '#6a737d')
        root.style.setProperty('--txt-3', '#586069')
        root.style.setProperty('--txt-2', '#24292e')
        root.style.setProperty('--txt-1', '#1a1a1a')
        root.style.setProperty('--txt-err', '#d73a49')
    } else if (theme === 'custom') {
        root.style.setProperty('--bg-1', settings.customTheme.bg1)
        root.style.setProperty('--bg-2', settings.customTheme.bg2)
        root.style.setProperty('--bg-3', settings.customTheme.bg3)
        root.style.setProperty('--bg-4', settings.customTheme.bg4)
        root.style.setProperty('--txt-4', settings.customTheme.txt4)
        root.style.setProperty('--txt-3', settings.customTheme.txt3)
        root.style.setProperty('--txt-2', settings.customTheme.txt2)
        root.style.setProperty('--txt-1', settings.customTheme.txt1)
        root.style.setProperty('--txt-err', settings.customTheme.txtErr)
    }
}

export const settings = $state(loadSettings())

// Apply theme on load
applyTheme(settings.theme)
