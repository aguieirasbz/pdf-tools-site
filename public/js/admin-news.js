(() => {
  const form = document.getElementById('news-generator-form');
  const review = document.getElementById('news-review');
  const status = document.getElementById('admin-status');
  let article = null;

  const setStatus = (message, type = 'info') => { status.textContent = message; status.className = `admin-status ${type}`; };
  const callApi = async (payload) => {
    const response = await fetch('../api/noticias.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const result = await response.json();
    if (!response.ok || !result.ok) throw new Error(result.message || 'Não foi possível concluir a operação.');
    return result;
  };
  const display = (data) => {
    article = data;
    review.hidden = false;
    document.getElementById('review-title').value = data.title || '';
    document.getElementById('review-excerpt').value = data.excerpt || '';
    document.getElementById('review-meta').value = data.meta_description || '';
    document.getElementById('review-content').value = data.content_html || '';
    document.getElementById('review-tags').value = (data.tags || []).join(', ');
    document.getElementById('review-sources').value = (data.official_sources || []).map((item) => `${item.title} | ${item.url}`).join('\n');
    document.getElementById('review-image').innerHTML = data.image?.url ? `<img src="${data.image.url}" alt=""><small>Imagem: ${data.image.author || 'Pexels'}</small>` : '<p>Nenhuma imagem encontrada.</p>';
  };
  const loadArticles = async () => {
    try {
      const result = await callApi({ action: 'list' });
      const list = document.getElementById('admin-articles-list');
      if (!result.articles.length) { list.innerHTML = '<p>Nenhum artigo criado.</p>'; return; }
      list.innerHTML = `<div class="admin-article-list">${result.articles.map((item) => `<article><div><strong>${item.title}</strong><small>${item.status === 'published' ? 'Publicado' : 'Rascunho'} · ${item.unique_views} usuários únicos · ${item.page_views} visualizações</small></div><button type="button" class="btn btn-outline edit-article" data-id="${item.id}">Editar</button></article>`).join('')}</div>`;
      list.querySelectorAll('.edit-article').forEach((button) => button.addEventListener('click', async () => {
        try { const response = await callApi({ action: 'get', id: button.dataset.id }); display(response.article); review.scrollIntoView({ behavior: 'smooth' }); setStatus('Artigo carregado para edição.', 'info'); }
        catch (error) { setStatus(error.message, 'error'); }
      }));
    } catch (error) { document.getElementById('admin-articles-list').textContent = error.message; }
  };
  const edited = () => ({
    title: document.getElementById('review-title').value, excerpt: document.getElementById('review-excerpt').value,
    meta_description: document.getElementById('review-meta').value, content_html: document.getElementById('review-content').value,
    tags: document.getElementById('review-tags').value.split(',').map((value) => value.trim()).filter(Boolean), image: article.image,
    official_sources: document.getElementById('review-sources').value.split('\n').map((line) => { const [title, url] = line.split('|').map((value) => value.trim()); return { title, url }; }).filter((item) => item.title && item.url)
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault(); const button = form.querySelector('button'); button.disabled = true; setStatus('Gerando texto e buscando imagem...', 'info');
    try { const result = await callApi({ action: 'generate', topic: document.getElementById('news-topic').value, program: document.getElementById('news-program').value, notes: document.getElementById('news-notes').value }); display(result.article); setStatus('Artigo publicado. Você pode corrigir o conteúdo abaixo.', 'success'); loadArticles(); }
    catch (error) { setStatus(error.message, 'error'); } finally { button.disabled = false; }
  });
  document.getElementById('save-draft').addEventListener('click', async () => {
    try { await callApi({ action: 'save', id: article.id, article: edited() }); setStatus('Alterações salvas.', 'success'); loadArticles(); } catch (error) { setStatus(error.message, 'error'); }
  });
  loadArticles();
})();
