# Portfólio

## Como abrir no VS Code
1. Abra a **pasta inteira** (`Arquivo > Abrir Pasta...`), não só o `index.html`.
2. Instale a extensão **Live Server** (o VS Code vai sugerir).
3. Clique com o botão direito em `index.html` > **Open with Live Server**.

(Também funciona dando duplo clique no `index.html`.)

## Estrutura
```
index.html          conteúdo e estrutura da página
css/style.css       estilos (com índice no topo)
js/main.js          interações (tema, menu, digitação, fundo, formulário)
assets/images/      sua foto (troque foto.svg por foto.jpg e ajuste o src)
assets/projects/    imagens dos projetos
assets/certificates/ imagens/PDFs dos certificados
```

## O que editar
Todo o texto está direto no `index.html`. Procure por "Seu Nome", "seuemail@exemplo.com",
"seu-usuario" e pelos textos entre colchetes `[...]`.
- Frases digitadas no início: atributo `data-frases` (separe por `|`).
- E-mail do formulário: atributo `data-email` da tag `<form>`.
