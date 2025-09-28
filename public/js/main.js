// Espera o conteúdo da página carregar completamente
document.addEventListener("DOMContentLoaded", function() {

    // Função para carregar um componente HTML em um elemento
    const loadComponent = (url, elementId) => {
        fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Erro ao carregar ${url}: ${response.statusText}`);
                }
                return response.text();
            })
            .then(data => {
                const element = document.getElementById(elementId);
                if (element) {
                    element.innerHTML = data;
                }
            })
            .catch(error => console.error(error));
    };

    // Carrega o header e o footer
    loadComponent('header.html', 'header-placeholder');
    loadComponent('footer.html', 'footer-placeholder');

});