<script>
    import { settings } from '../settings-store.svelte.js'

    const columns = $derived.by(() => {
        const result = []
        const linksPerColumn = Math.max(
            1,
            parseInt(settings.linksPerColumn) || 1
        )
        for (let i = 0; i < settings.links.length; i += linksPerColumn) {
            result.push(settings.links.slice(i, i + linksPerColumn))
        }
        return result
    })
</script>

<div class="panel">
    <div class="panel-label">links</div>
    {#each columns as column}
        <div class="column">
            {#each column as link}
                <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    class="link"
                >
                    <span>></span>
                    {link.title}
                </a>
                <br />
            {/each}
        </div>
    {/each}
</div>

<style>
    .panel {
        display: flex;
    }
    .link {
        text-decoration: none;
        transition: all 0.2s ease;
        display: inline-block;
    }
    .link:hover {
        color: var(--txt-1);
        text-shadow: 0 0 8px rgba(180, 190, 254, 0.4);
        transform: translateX(4px);
    }
    .link:hover span {
        color: var(--txt-2);
        animation: pulse 0.6s ease-in-out;
    }
    span {
        color: var(--txt-3);
        display: inline-block;
        transition: all 0.2s ease;
    }
    .column {
        width: 100%;
    }
</style>
