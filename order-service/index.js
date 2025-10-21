const express = require('express');
const fs = require('fs');
const axios = require('axios');

const app = express();
app.use(express.json());  

const PORT = process.env.PORT || 3002;  

app.get('/orders', (req, res) => {
  const data = fs.readFileSync('orders.json');
  const orders = JSON.parse(data);
  res.json(orders);
});

app.get('/orders/:id', async (req, res) => {
  const orderId = Number(req.params.id);
  const data = fs.readFileSync('orders.json');
  const orders = JSON.parse(data);
  const order = orders.find(o => o.id === orderId);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  try {
    const userResponse = await axios.get(`http://user-service:3001/users/${order.userId}`);
    order.user = userResponse.data;  
  } catch (err) {
    console.error(`Не удалось получить пользователя id=${order.userId} из User Service`);
    // В случае ошибки вызова оставляем пользователя неопределенным, либо вернём частичные данные:
    order.user = null;
  }
  res.json(order);
});

// POST /orders - создать новый заказ
app.post('/orders', (req, res) => {
  const newOrder = req.body;
  if (!newOrder.item || !newOrder.userId) {
    return res.status(400).json({ error: 'Order item and userId are required' });
  }
  // Загружаем текущие заказы
  const data = fs.readFileSync('orders.json');
  let orders = JSON.parse(data);
  // Генерируем новый ID заказа
  const maxId = orders.reduce((max, o) => o.id > max ? o.id : max, 0);
  newOrder.id = maxId + 1;
  // Сохраняем заказ в "базу" (JSON-файл)
  orders.push(newOrder);
  fs.writeFileSync('orders.json', JSON.stringify(orders, null, 2));
  console.log(`Создан новый заказ id=${newOrder.id} для userId=${newOrder.userId}`);
  res.status(201).json(newOrder);
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`Order Service запущен на порту ${PORT}`);
});
