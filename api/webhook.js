module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const { action, data } = req.body;

    if (action === 'payment.created' || action === 'payment.updated') {
      console.log(`Webhook recebido - Pagamento ${data?.id} - Ação: ${action}`);
    }

    res.status(200).end();
  } catch (error) {
    console.error('Erro no webhook:', error);
    res.status(200).end();
  }
};
