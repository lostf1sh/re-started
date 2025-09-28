<script>
    import { onMount, onDestroy } from 'svelte'
    import { settings } from '../settings-store.svelte.js'

    let articles = $state([])
    let loading = $state(false)
    let error = $state('')
    let selectedSource = $state('hackernews')
    let refreshInterval = null

    const newsSources = {
        hackernews: {
            name: 'Hacker News',
            url: 'https://hacker-news.firebaseio.com/v0/topstories.json',
            getArticleUrl: (id) => `https://hacker-news.firebaseio.com/v0/item/${id}.json`
        },
        reddit: {
            name: 'Reddit',
            url: 'https://www.reddit.com/r/programming/hot.json',
            getArticleUrl: null
        }
    }

    function handleVisibilityChange() {
        if (document.visibilityState === 'visible') {
            // Only refresh if it's been more than 5 minutes since last load
            const lastRefresh = localStorage.getItem('news_last_refresh')
            const now = Date.now()
            const fiveMinutes = 5 * 60 * 1000
            
            if (!lastRefresh || (now - parseInt(lastRefresh)) > fiveMinutes) {
                loadNews()
            }
        }
    }

    async function loadNews() {
        if (loading) return
        
        loading = true
        error = ''
        
        try {
            if (selectedSource === 'hackernews') {
                await loadHackerNews()
            } else if (selectedSource === 'reddit') {
                await loadReddit()
            }
        } catch (err) {
            error = `Failed to load ${selectedSource}: ${err.message}`
            console.error('News loading error:', err)
        } finally {
            loading = false
            // Save last refresh time
            localStorage.setItem('news_last_refresh', Date.now().toString())
        }
    }

    async function loadHackerNews() {
        // Get top story IDs
        const response = await fetch(newsSources.hackernews.url)
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        
        const storyIds = await response.json()
        const topIds = storyIds.slice(0, 5) // Get top 5
        
        // Get story details
        const storyPromises = topIds.map(id => 
            fetch(newsSources.hackernews.getArticleUrl(id))
                .then(res => res.json())
        )
        
        const stories = await Promise.all(storyPromises)
        
        articles = stories
            .filter(story => story && story.title && story.url)
            .map(story => ({
                id: story.id,
                title: story.title,
                url: story.url,
                score: story.score || 0,
                comments: story.descendants || 0,
                time: new Date(story.time * 1000),
                source: 'Hacker News',
                domain: extractDomain(story.url)
            }))
    }

    async function loadReddit() {
        try {
            const response = await fetch(newsSources.reddit.url, {
                headers: {
                    'User-Agent': 're-started/1.0 (https://github.com/lostf1sh/re-started)'
                }
            })
            
            if (!response.ok) {
                throw new Error(`Reddit API error: ${response.status}`)
            }
            
            const data = await response.json()
            
            if (!data.data || !data.data.children) {
                throw new Error('Invalid Reddit API response')
            }
            
            articles = data.data.children
                .slice(0, 5)
                .map(post => ({
                    id: post.data.id,
                    title: post.data.title,
                    url: post.data.url,
                    score: post.data.score || 0,
                    comments: post.data.num_comments || 0,
                    time: new Date(post.data.created_utc * 1000),
                    source: 'Reddit',
                    domain: extractDomain(post.data.url)
                }))
        } catch (err) {
            console.error('Reddit loading error:', err)
            // Fallback to Hacker News if Reddit fails
            await loadHackerNews()
        }
    }

    function extractDomain(url) {
        try {
            return new URL(url).hostname.replace('www.', '')
        } catch {
            return 'unknown'
        }
    }

    function formatTime(date) {
        const now = new Date()
        const diffMs = now.getTime() - date.getTime()
        const diffMins = Math.floor(diffMs / 60000)
        const diffHours = Math.floor(diffMins / 60)
        const diffDays = Math.floor(diffHours / 24)

        if (diffMins < 1) return 'now'
        if (diffMins < 60) return `${diffMins}m`
        if (diffHours < 24) return `${diffHours}h`
        if (diffDays < 7) return `${diffDays}d`
        return date.toLocaleDateString()
    }

    function refreshNews() {
        loadNews()
    }

    function changeSource(source) {
        selectedSource = source
        loadNews()
    }

    onMount(() => {
        loadNews()
        document.addEventListener('visibilitychange', handleVisibilityChange)
        
        // Auto-refresh every 5 minutes
        refreshInterval = setInterval(loadNews, 5 * 60 * 1000)
    })

    onDestroy(() => {
        document.removeEventListener('visibilitychange', handleVisibilityChange)
        if (refreshInterval) {
            clearInterval(refreshInterval)
        }
    })
</script>

<div class="panel">
    <div class="widget-header">
        <div class="widget-label">feed</div>
        <div class="source-selector">
            <button 
                class="source-btn" 
                class:active={selectedSource === 'hackernews'}
                onclick={() => changeSource('hackernews')}
            >
                HN
            </button>
            <button 
                class="source-btn" 
                class:active={selectedSource === 'reddit'}
                onclick={() => changeSource('reddit')}
            >
                Reddit
            </button>
        </div>
        <button 
            class="refresh-btn" 
            onclick={refreshNews} 
            disabled={loading}
            title="Refresh news"
        >
            {loading ? '⟳' : '↻'}
        </button>
    </div>

    {#if error}
        <div class="error">{error}</div>
    {:else if loading}
        <div class="loading">Loading news...</div>
    {:else}
        <div class="news-list">
            {#each articles as article}
                <div class="article">
                    <a 
                        href={article.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        class="article-title"
                    >
                        {article.title}
                    </a>
                    <div class="article-footer">
                        <span class="article-domain">{article.domain}</span>
                        <div class="article-meta">
                            <span class="score">↑ {article.score}</span>
                            <span class="comments">💬 {article.comments}</span>
                            <span class="time">{formatTime(article.time)}</span>
                        </div>
                    </div>
                </div>
            {/each}
        </div>
    {/if}
</div>

<style>
    .panel {
        flex: 1;
        max-width: 60rem; /* Normal genişliğin 1.5 katı */
    }
    .widget-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
    }
    .source-selector {
        display: flex;
        gap: 0.5rem;
    }
    .source-btn {
        padding: 0.25rem 0.75rem;
        background: none;
        border: 2px solid var(--bg-3);
        color: var(--txt-3);
        cursor: pointer;
        font-size: 0.875rem;
        font-weight: 500;
    }
    .source-btn.active {
        background: var(--bg-3);
        color: var(--txt-1);
    }
    .refresh-btn {
        background: none;
        border: 2px solid var(--bg-3);
        color: var(--txt-3);
        cursor: pointer;
        font-size: 1.25rem;
        padding: 0.25rem;
        transition: all 0.2s;
    }
    .refresh-btn:hover {
        background: var(--bg-2);
        color: var(--txt-1);
    }
    .refresh-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
    .loading {
        text-align: center;
        color: var(--txt-3);
        padding: 2rem;
        font-style: italic;
    }
    .news-list {
        max-height: 15rem;
        overflow: auto;
        scrollbar-width: none;
    }
    .news-list::-webkit-scrollbar {
        display: none;
    }
    .article {
        padding: 0.5rem;
        margin-bottom: 0.25rem;
        background: var(--bg-2);
        border: 2px solid var(--bg-3);
        transition: all 0.2s;
    }
    .article:hover {
        background: var(--bg-3);
        border-color: var(--txt-3);
    }
    .article-title {
        color: var(--txt-1);
        text-decoration: none;
        font-weight: 500;
        line-height: 1.3;
        display: block;
        margin-bottom: 0.25rem;
        word-wrap: break-word;
        font-size: 0.9rem;
    }
    .article-title:hover {
        color: var(--txt-2);
        text-decoration: underline;
    }
    .article-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 0.5rem;
    }
    .article-domain {
        color: var(--txt-3);
        font-size: 0.7rem;
        white-space: nowrap;
        background: var(--bg-1);
        padding: 0.2rem 0.4rem;
        border: 1px solid var(--bg-3);
    }
    .article-meta {
        display: flex;
        gap: 0.5rem;
        font-size: 0.7rem;
        color: var(--txt-3);
    }
    .score {
        color: var(--txt-2);
    }
    .comments {
        color: var(--txt-3);
    }
    .time {
        color: var(--txt-3);
    }
    .error {
        color: var(--txt-err);
        text-align: center;
        padding: 1rem;
        background: var(--bg-2);
        border: 2px solid var(--txt-err);
    }
</style>
