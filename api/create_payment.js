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

    // Cria uma preferência de pagamento
    const preferenceData = {
      items: [
        {
          id: 'metodo-turbo-1',
          title: 'Método Turbo',
          description: 'Guia Completo + 2 Bônus',
          quantity: 1,
          currency_id: 'BRL',
          unit_price: 20.89
        }
      ],
      payer: {
        name: nome || 'Comprador',
        email: email || 'comprador@email.com',
        identification: {
          type: 'CPF',
          number: cpf || '00000000000'
        }
      },
      back_urls: {
        success: 'https://startupskala-source.github.io/checkout/sucesso.html',
        failure: 'https://startupskala-source.github.io/checkout/',
        pending: 'https://startupskala-source.github.io/checkout/'
      },
      auto_return: 'approved',
      payment_methods: {
        default_payment_method_id: 'pix',
        installments: 1,
        default_installments: 1
      },
      notification_url: 'https://checkout-skala2.vercel.app/api/webhook'
    };

    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(preferenceData)
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('MP Error:', result);
      return res.status(response.status).json({ error: result.message || 'Erro Mercado Pago' });
    }

    // Pega o QR Code da preferência
    const qrResponse = await fetch(`https://api.mercadopago.com/checkout/preferences/${result.id}/qr_code`, {
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`
      }
    });

    const qrData = await qrResponse.json();

    res.json({
      preference_id: result.id,
      init_point: result.init_point,
      qr_code_base64: qrData.qr_code_base64,
      qr_code: qrData.qr_code,
      public_key: process.env.MP_PUBLIC_KEY
    });

  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({ error: error.message || 'Erro ao criar pagamento' });
  }
};
