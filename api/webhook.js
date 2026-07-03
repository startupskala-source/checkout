const mercadopago = require('mercadopago');

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;
    if (!ACCESS_TOKEN) return res.status(500).end();

    mercadopago.configurations.setAccessToken(ACCESS_TOKEN);

    const { action, data } = req.body;

    if (action === 'payment.created' || action === 'payment.updated') {
      const paymentId = data?.id;
      if (paymentId) {
        const payment = await mercadopago.payment.get(paymentId);
        console.log(`Pagamento ${paymentId} - Status: ${payment.body.status}`);
      }
    }

    res.status(200).end();
  } catch (error) {
    console.error('Erro no webhook:', error);
    res.status(200).end();
  }
};
