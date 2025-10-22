const postsRef = document.getElementById('posts');
async function populatePosts() {
    try {
        const response = await fetch(`https://sleepingami.github.io/modders-delight/mods/index.json`, {
            headers: {
                'Accept': 'application/json'
            }
        });
        if(!response.ok) {
            throw new Error('HTTP Error! Status: ' + response.status);
        }
        return await response.json();
    } catch(error) {
        console.log(error);
        return null;
    }
}

populatePosts().then(data => {
    if (!data || !Array.isArray(data) || data.length === 0) {
        postsRef.innerHTML = '<p>No posts found.</p>';
        return;
    }

    // Sort newest first (hopefully ISO date-friendly)
    const bogoSort = data.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    postsRef.innerHTML = bogoSort.map(post => {
        const title = escapeHtml(post.title || post.id || 'Untitled');
        const url = post.url || ('/mods/' + encodeURIComponent(post.id || ''));
        const excerpt = escapeHtml(post.excerpt || '');
        return `
        <a href="/modders-delight${url}">
            <article class="post">
                <h3>${title}</h3>
            </article>
        </a>
        `;
    }).join('\n');

})

// small helper to avoid XSS when inserting strings
function escapeHtml(str) {
return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}