const mercadopago = require('mercadopago');
const crypto = require('crypto');

module.exports = async (req, res) => {
  // Habilitar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });

  try {
    const ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;
    const PUBLIC_KEY = process.env.MP_PUBLIC_KEY;

    if (!ACCESS_TOKEN) {
      return res.status(500).json({ error: 'ACCESS_TOKEN não configurado' });
    }

    mercadopago.configurations.setAccessToken(ACCESS_TOKEN);

    const { nome, email, cpf, telefone } = req.body;

    const payment_data = {
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
      },
      notification_url: `https://${req.headers.host}/api/webhook`,
    };

    const payment = await mercadopago.payment.create(payment_data, {
      headers: { 'X-Idempotency-Key': crypto.randomUUID() }
    });

    res.json({
      id: payment.body.id,
      status: payment.body.status,
      qr_code: payment.body.point_of_interaction?.transaction_data?.qr_code,
      qr_code_base64: payment.body.point_of_interaction?.transaction_data?.qr_code_base64,
      public_key: PUBLIC_KEY,
    });

  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({ error: error.message || 'Erro ao criar pagamento' });
  }
};
