const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());  

const PORT = process.env.PORT || 3000;  

// GET /api/users -> перенаправляем на User Service
app.get('/api/users', async (req, res) => {
  try {
    const response = await axios.get('http://user-service:3001/users');
    res.json(response.data);
  } catch (err) {
    res.status(502).json({ error: 'Failed to fetch users' }); 
  }
});

app.get('/api/users/:id', async (req, res) => {
  const userId = req.params.id;
  try {
    const response = await axios.get(`http://user-service:3001/users/${userId}`);
    res.json(response.data);
  } catch (err) {
    if (err.response) {
      res.status(err.response.status).json(err.response.data);
    } else {
      res.status(502).json({ error: 'Failed to fetch user' });
    }
  }
});

// GET /api/orders -> Order Service (список заказов)
app.get('/api/orders', async (req, res) => {
  try {
    const response = await axios.get('http://order-service:3002/orders');
    res.json(response.data);
  } catch (err) {
    res.status(502).json({ error: 'Failed to fetch orders' });
  }
});

// GET /api/orders/:id -> получение детального заказа (заказ + пользователь)
// Gateway объединяет ответы от Order Service и User Service
app.get('/api/orders/:id', async (req, res) => {
  const orderId = req.params.id;
  try {
    // Запрашиваем детали заказа у Order Service
    const orderResponse = await axios.get(`http://order-service:3002/orders/${orderId}`);
    const order = orderResponse.data;
    // Если сервис заказов вернул заказ без данных пользователя, получим их:
    if (!order.user) {
      const userResponse = await axios.get(`http://user-service:3001/users/${order.userId}`);
      order.user = userResponse.data;
    }
    res.json(order);
  } catch (err) {
    if (err.response && err.response.status === 404) {
      res.status(404).json({ error: 'Order not found' });
    } else {
      console.error('Ошибка при объединении данных заказа:', err);
      res.status(502).json({ error: 'Failed to fetch order details' });
    }
  }
});

// POST /api/users -> проброс в User Service (создание пользователя)
app.post('/api/users', async (req, res) => {
  try {
    const response = await axios.post('http://user-service:3001/users', req.body);
    res.status(response.status).json(response.data);
  } catch (err) {
    if (err.response) {
      res.status(err.response.status).json(err.response.data);
    } else {
      res.status(502).json({ error: 'Failed to create user' });
    }
  }
});

// POST /api/orders -> проброс в Order Service (создание заказа)
app.post('/api/orders', async (req, res) => {
  try {
    const response = await axios.post('http://order-service:3002/orders', req.body);
    res.status(response.status).json(response.data);
  } catch (err) {
    if (err.response) {
      res.status(err.response.status).json(err.response.data);
    } else {
      res.status(502).json({ error: 'Failed to create order' });
    }
  }
});

// Запуск API Gateway сервера
app.listen(PORT, () => {
  console.log(`API Gateway запущен на порту ${PORT}`);
});
