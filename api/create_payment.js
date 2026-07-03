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

    // Cria pagamento PIX
    const paymentData = {
      transaction_amount: 20.89,
      description: 'Método Turbo - Guia Completo',
      payment_method_id: 'pix',
      payer: {
        email: email || 'comprador@email.com',
        first_name: nome ? nome.split(' ')[0] : 'Comprador',
        identification: {
          type: 'CPF',
          number: cpf || '00000000000'
        }
      }
    };

    const response = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': crypto.randomUUID(),
        'X-Caller-Id': '3250900151',
        'Accept': 'application/json'
      },
      body: JSON.stringify(paymentData)
    });

    const result = await response.json();

    if (!response.ok) {
      // Se falhou criar pagamento, cai no checkout Pro do Mercado Pago
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
          payment_methods: {
            excluded_payment_methods: [
              { id: 'master' }, { id: 'visa' }, { id: 'amex' },
              { id: 'hipercard' }, { id: 'elo' }, { id: 'diners' }
            ],
            excluded_payment_types: [
              { id: 'ticket' }, { id: 'bank_transfer' },
              { id: 'credit_card' }, { id: 'debit_card' }, { id: 'prepaid_card' }
            ],
            installments: 1,
            default_installments: 1
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
      return res.json({
        init_point: pref.init_point,
        preference_id: pref.id,
        public_key: process.env.MP_PUBLIC_KEY
      });
    }

    // Pagamento PIX criado com sucesso
    const qr = result.point_of_interaction?.transaction_data;
    res.json({
      id: result.id,
      status: result.status,
      qr_code: qr?.qr_code,
      qr_code_base64: qr?.qr_code_base64,
      init_point: qr?.ticket_url,
      public_key: process.env.MP_PUBLIC_KEY
    });

  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({ error: error.message || 'Erro ao criar pagamento' });
  }
};
