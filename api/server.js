const express = require('express');
const mercadopago = require('mercadopago');
const cors = require('cors');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

// Credenciais Mercado Pago
const ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN || 'APP_USR-979073945795476-070311-4cd395c11c1ab047cd245ea48590fbea-3250900151';
const PUBLIC_KEY = process.env.MP_PUBLIC_KEY || 'APP_USR-a2fcf06f-d6a6-4ea0-8ea1-079cc2dfad20';

mercadopago.configurations.setAccessToken(ACCESS_TOKEN);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos da pasta atual
app.use(express.static(__dirname));

// Endpoint para criar pagamento PIX
app.post('/api/create_payment', async (req, res) => {
  try {
    const { nome, email, cpf, telefone } = req.body;

    const idempotencyKey = crypto.randomUUID();

    const payment_data = {
      transaction_amount: 20.89,
      description: 'Método Turbo - Guia Completo',
      payment_method_id: 'pix',
      payer: {
        email: email || 'comprador@email.com',
        first_name: nome ? nome.split(' ')[0] : 'Comprador',
        last_name: nome ? nome.split(' ').slice(1).join(' ') || 'Sem Sobrenome' : 'Sem Sobrenome',
        identification: {
          type: 'CPF',
          number: cpf || '00000000000'
        },
        phone: {
          area_code: telefone ? telefone.substring(0, 2) : '00',
          number: telefone ? telefone.substring(2) : '000000000'
        }
      },
      notification_url: `https://${req.headers.host || 'localhost:3000'}/api/webhook`,
    };

    const payment = await mercadopago.payment.create(payment_data, {
      headers: { 'X-Idempotency-Key': idempotencyKey }
    });

    const responseData = {
      id: payment.body.id,
      status: payment.body.status,
      status_detail: payment.body.status_detail,
      qr_code: payment.body.point_of_interaction?.transaction_data?.qr_code,
      qr_code_base64: payment.body.point_of_interaction?.transaction_data?.qr_code_base64,
      ticket_url: payment.body.point_of_interaction?.transaction_data?.ticket_url,
      public_key: PUBLIC_KEY,
    };

    res.json(responseData);
  } catch (error) {
    console.error('Erro ao criar pagamento:', error);
    res.status(500).json({ error: error.message || 'Erro ao criar pagamento' });
  }
});

// Endpoint para verificar status do pagamento
app.get('/api/check_payment/:id', async (req, res) => {
  try {
    const payment = await mercadopago.payment.get(req.params.id);
    res.json({
      id: payment.body.id,
      status: payment.body.status,
      status_detail: payment.body.status_detail,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Webhook para notificações do Mercado Pago
app.post('/api/webhook', async (req, res) => {
  try {
    const { action, data } = req.body;

    if (action === 'payment.created' || action === 'payment.updated') {
      const paymentId = data?.id;
      if (paymentId) {
        const payment = await mercadopago.payment.get(paymentId);
        console.log(`Pagamento ${paymentId} - Status: ${payment.body.status}`);
      }
    }

    res.sendStatus(200);
  } catch (error) {
    console.error('Erro no webhook:', error);
    res.sendStatus(200);
  }
});

// Endpoint para obter a public key
app.get('/api/public_key', (req, res) => {
  res.json({ public_key: PUBLIC_KEY });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
