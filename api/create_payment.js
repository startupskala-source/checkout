const crypto = require('crypto');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });

  try {
    const ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;
    if (!ACCESS_TOKEN) return res.status(500).json({ error: 'ACCESS_TOKEN não configurado' });

    const { nome, email, cpf } = req.body;

    // Cria preferência com purpose = wallet_purchase
    // Isso faz o Wallet Brick mostrar só PIX
    const prefResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        items: [{
          id: 'metodo-turbo-1',
          title: 'Método Turbo',
          description: 'Guia Completo + 2 Bônus',
          quantity: 1,
          currency_id: 'BRL',
          unit_price: 20.89
        }],
        payer: {
          name: nome || 'Comprador',
          email: email || 'comprador@email.com',
          identification: { type: 'CPF', number: cpf || '00000000000' }
        },
        purpose: 'wallet_purchase',
        auto_return: 'approved',
        back_urls: {
          success: 'https://startupskala-source.github.io/checkout/',
          failure: 'https://startupskala-source.github.io/checkout/',
          pending: 'https://startupskala-source.github.io/checkout/'
        }
      })
    });

    const pref = await prefResponse.json();

    if (!prefResponse.ok) {
      return res.status(500).json({ error: pref.message || 'Erro ao criar preferência' });
    }

    res.json({
      preference_id: pref.id,
      init_point: pref.init_point,
      public_key: process.env.MP_PUBLIC_KEY
    });

  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({ error: error.message || 'Erro ao criar pagamento' });
  }
};
