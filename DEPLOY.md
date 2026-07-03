# 🚀 DEPLOY NO RENDER

## 1. Acesse o Render
- Vá em https://dashboard.render.com/
- Clique em **"New +"** > **"Blueprint"**

## 2. Conecte o GitHub
- Escolha seu repositório: `startupskala-source/checkout`
- O Render vai ler automaticamente o arquivo `render.yaml`
- Clique em **"Apply"**

## 3. Pronto! ⏳
- O Render vai instalar as dependências e fazer o deploy automático
- Em 2-3 minutos seu site estará no ar em:
  ```
  https://checkout-skala.onrender.com
  ```

## 4. Atualizar o GitHub Pages (opcional)
O GitHub Pages continua em:
  ```
  https://startupskala-source.github.io/checkout/
  ```
Mas a versão com PIX funcionando é a do Render:
  ```
  https://checkout-skala.onrender.com
  ```
(Ambas mostram o mesmo checkout, mas o Render tem o backend PIX)

---

## Testar local (se quiser)
```bash
cd /c/Users/Sidinei/projetos/checkout-skala-source
npm install
npm start
```
Abre em `http://localhost:3000`
