document.addEventListener('DOMContentLoaded', () => {
    const list = document.getElementById('home-news-list');
    if (!list) return;

    const formatDate = (value) => {
        const date = new Date(value.replace(' ', 'T'));
        return Number.isNaN(date.getTime()) ? 'Atualizado recentemente' : date.toLocaleDateString('pt-BR', { dateStyle: 'long' });
    };

    fetch('api/destaques.php')
        .then((response) => response.ok ? response.json() : Promise.reject())
        .then(({ articles }) => {
            list.innerHTML = '';
            if (!articles.length) {
                list.textContent = 'Ainda não há notícias publicadas.';
                return;
            }

            articles.forEach((article) => {
                const item = document.createElement('article');
                item.className = 'home-news-item';
                const link = document.createElement('a');
                link.href = `noticia.php?slug=${encodeURIComponent(article.slug)}`;
                link.className = 'home-news-image';
                if (article.image_url) {
                    const image = document.createElement('img');
                    image.src = article.image_url;
                    image.alt = article.image_alt || article.title;
                    image.loading = 'lazy';
                    link.appendChild(image);
                } else {
                    link.innerHTML = '<i class="fas fa-newspaper" aria-hidden="true"></i>';
                    link.setAttribute('aria-label', article.title);
                }

                const content = document.createElement('div');
                content.className = 'home-news-content';
                const date = document.createElement('time');
                date.textContent = formatDate(article.published_at);
                const title = document.createElement('h3');
                const titleLink = document.createElement('a');
                titleLink.href = link.href;
                titleLink.textContent = article.title;
                title.appendChild(titleLink);
                const excerpt = document.createElement('p');
                excerpt.textContent = article.excerpt;
                const readMore = document.createElement('a');
                readMore.href = link.href;
                readMore.className = 'home-news-read-more';
                readMore.textContent = 'Ler notícia';
                content.append(date, title, excerpt, readMore);
                item.append(link, content);
                list.appendChild(item);
            });
        })
        .catch(() => { list.textContent = 'Não foi possível carregar as notícias agora.'; });
});
