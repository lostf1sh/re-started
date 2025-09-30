<script>
    import { onMount, onDestroy } from 'svelte'
    import { settings } from '../settings-store.svelte.js'

    let articles = $state([])
    let loading = $state(false)
    let error = $state('')
    let selectedSource = $state('hackernews')
    let refreshInterval = null

    const CACHE_PREFIX = 'news_cache_'
    const CACHE_TTL_MS = 3 * 60 * 1000
    const canUseStorage = typeof window !== 'undefined' && 'localStorage' in window

    const newsSources = {
        hackernews: {
            name: 'Hacker News',
            url: 'https://hn.algolia.com/api/v1/search?tags=front_page&hitsPerPage=10'
        },
        reddit: {
            name: 'Reddit',
            url: 'https://www.reddit.com/r/programming/hot.json?limit=10'
        }
    }

    function getCacheKey(source) {
        return `${CACHE_PREFIX}${source}`
    }

    function serializeArticles(items = []) {
        return items.map(article => ({
            ...article,
            time: article.time instanceof Date ? article.time.toISOString() : article.time
        }))
    }

    function deserializeArticles(items = []) {
        return items.map(article => ({
            ...article,
            time: article.time ? new Date(article.time) : new Date()
        }))
    }

    function readCachedArticles(source) {
        if (!canUseStorage) return null

        try {
            const raw = localStorage.getItem(getCacheKey(source))
            if (!raw) return null

            const parsed = JSON.parse(raw)
            if (!parsed || !Array.isArray(parsed.data) || typeof parsed.timestamp !== 'number') {
                return null
            }

            return parsed
        } catch (err) {
            console.warn('Failed to parse cached news data', err)
            return null
        }
    }

    function writeCachedArticles(source, data) {
        if (!canUseStorage) return

        const payload = {
            data: serializeArticles(data),
            timestamp: Date.now()
        }

        try {
            localStorage.setItem(getCacheKey(source), JSON.stringify(payload))
        } catch (err) {
            console.warn('Failed to write cached news data', err)
        }
    }

    function isCacheFresh(cache) {
        if (!cache) return false
        return Date.now() - cache.timestamp < CACHE_TTL_MS
    }

    function handleVisibilityChange() {
        if (document.visibilityState === 'visible') {
            // Only refresh if it's been more than 5 minutes since last load
            const lastRefresh = localStorage.getItem('news_last_refresh')
            const now = Date.now()
            const fiveMinutes = 5 * 60 * 1000
            
            if (!lastRefresh || (now - parseInt(lastRefresh)) > fiveMinutes) {
                loadNews({ force: true })
            }
        }
    }

    async function loadNews({ source = selectedSource, force = false, silent = false } = {}) {
        const isActiveSource = source === selectedSource

        if (isActiveSource && loading && !force) {
            return
        }

        const cached = readCachedArticles(source)

        if (!force && cached) {
            if (isActiveSource) {
                articles = deserializeArticles(cached.data)
            }

            if (isCacheFresh(cached)) {
                return
            }
        }

        if (isActiveSource && !silent) {
            loading = true
            error = ''
        }

        try {
            const freshArticles = await fetchArticles(source)
            writeCachedArticles(source, freshArticles)

            if (isActiveSource) {
                articles = freshArticles
                error = ''
            }
        } catch (err) {
            console.error('News loading error:', err)

            if (!cached || !cached.data?.length) {
                if (isActiveSource) {
                    error = `Failed to load ${newsSources[source]?.name || source}: ${err.message}`
                }
            } else if (isActiveSource) {
                error = `Showing cached ${newsSources[source]?.name || source} stories (refresh failed: ${err.message})`
            }
        } finally {
            if (isActiveSource && !silent) {
                loading = false
            }

            if (isActiveSource && canUseStorage) {
                localStorage.setItem('news_last_refresh', Date.now().toString())
            }
        }
    }

    async function fetchArticles(source) {
        if (source === 'hackernews') {
            return fetchHackerNews()
        }

        if (source === 'reddit') {
            return fetchReddit()
        }

        throw new Error(`Unsupported source: ${source}`)
    }

    async function fetchHackerNews() {
        try {
            const response = await fetch(newsSources.hackernews.url)
            if (!response.ok) throw new Error(`HTTP ${response.status}`)

            const payload = await response.json()
            const hits = Array.isArray(payload?.hits) ? payload.hits : []

            const topStories = hits
                .filter(story => story)
                .slice(0, 5)
                .map(story => {
                    const url = story.url || `https://news.ycombinator.com/item?id=${story.objectID}`
                    return {
                        id: story.objectID,
                        title: story.title || story.story_title || 'Untitled',
                        url,
                        score: story.points || 0,
                        comments: story.num_comments || 0,
                        time: new Date(story.created_at),
                        source: 'Hacker News',
                        domain: extractDomain(url)
                    }
                })

            if (topStories.length) {
                return topStories
            }

            throw new Error('Empty response')
        } catch (err) {
            console.warn('Fast Hacker News API failed, falling back to Firebase API', err)
            return fetchHackerNewsFallback()
        }
    }

    async function fetchHackerNewsFallback() {
        const storiesEndpoint = 'https://hacker-news.firebaseio.com/v0/topstories.json'
        const itemEndpoint = (id) => `https://hacker-news.firebaseio.com/v0/item/${id}.json`

        const response = await fetch(storiesEndpoint)
        if (!response.ok) throw new Error(`HTTP ${response.status}`)

        const storyIds = await response.json()
        const topIds = storyIds.slice(0, 5)

        const storyPromises = topIds.map(id =>
            fetch(itemEndpoint(id)).then(res => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`)
                return res.json()
            })
        )

        const stories = await Promise.all(storyPromises)

        return stories
            .filter(story => story && story.title && (story.url || story.id))
            .map(story => {
                const url = story.url || `https://news.ycombinator.com/item?id=${story.id}`
                return {
                    id: story.id,
                    title: story.title,
                    url,
                    score: story.score || 0,
                    comments: story.descendants || 0,
                    time: new Date(story.time * 1000),
                    source: 'Hacker News',
                    domain: extractDomain(url)
                }
            })
    }

    async function fetchReddit() {
        const response = await fetch(newsSources.reddit.url, {
            headers: {
                'User-Agent': 're-started/1.0 (https://github.com/lostf1sh/re-started)'
            }
        })

        if (!response.ok) {
            throw new Error(`Reddit API error: ${response.status}`)
        }

        const data = await response.json()

        if (!data?.data?.children) {
            throw new Error('Invalid Reddit API response')
        }

        const posts = data.data.children.slice(0, 5)

        if (!posts.length) {
            throw new Error('Empty Reddit response')
        }

        return posts.map(post => ({
            id: post.data.id,
            title: post.data.title,
            url: post.data.url,
            score: post.data.score || 0,
            comments: post.data.num_comments || 0,
            time: new Date(post.data.created_utc * 1000),
            source: 'Reddit',
            domain: extractDomain(post.data.url)
        }))
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
        loadNews({ force: true })
    }

    function changeSource(source) {
        selectedSource = source
        loadNews({ source })
    }

    onMount(() => {
        loadNews()
        // Prefetch the other source to keep caches warm without blocking initial render
        Promise.resolve().then(() => {
            const otherSource = selectedSource === 'hackernews' ? 'reddit' : 'hackernews'
            loadNews({ source: otherSource, silent: true })
        })
        document.addEventListener('visibilitychange', handleVisibilityChange)
        
        // Auto-refresh every 5 minutes
        refreshInterval = setInterval(() => loadNews({ force: true }), 5 * 60 * 1000)
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
