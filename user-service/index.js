const express = require('express');
const fs = require('fs');  // встроенный модуль для работы с файловой системой

const app = express();
app.use(express.json());  // встроенный парсер JSON-тел запросов

const PORT = process.env.PORT || 3001;  // порт сервиса пользователей (3001 по умолчанию)

// GET /users - вернуть список всех пользователей
app.get('/users', (req, res) => {
  // Читаем файл users.json (синхронно или асинхронно). Здесь для простоты — синхронно:
  let rawData = fs.readFileSync('users.json');       // читаем JSON-файл с диска
  let users = JSON.parse(rawData);                   // парсим содержимое в объект
  res.json(users);                                   // отправляем массив пользователей в ответе
});

// GET /users/:id - вернуть пользователя по ID
app.get('/users/:id', (req, res) => {
  const userId = Number(req.params.id);
  let rawData = fs.readFileSync('users.json');
  let users = JSON.parse(rawData);
  const user = users.find(u => u.id === userId);     // ищем пользователя с нужным ID
  if (!user) {
    // Если не найден, возвращаем 404
    return res.status(404).json({ error: 'User not found' });
  }
  res.json(user);  // отправляем найденного пользователя
});

// POST /users - добавить нового пользователя
app.post('/users', (req, res) => {
  const newUser = req.body;    // ожидаем в теле запроса JSON с полями нового пользователя
  if (!newUser.name) {
    return res.status(400).json({ error: 'Name is required' });  // простой валидатор
  }
  // Загружаем текущих пользователей, чтобы сгенерировать новый ID и сохранить обновление
  let rawData = fs.readFileSync('users.json');
  let users = JSON.parse(rawData);
  // Генерируем новый ID (например, на 1 больше максимального текущего ID)
  const maxId = users.reduce((max, u) => u.id > max ? u.id : max, 0);
  newUser.id = maxId + 1;
  users.push(newUser);
  // Сохраняем обновленный список обратно в файл
  fs.writeFileSync('users.json', JSON.stringify(users, null, 2));
  console.log(`Добавлен новый пользователь: ${newUser.name} (id=${newUser.id})`);
  res.status(201).json(newUser);  // возвращаем добавленного пользователя
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`User Service запущен на порту ${PORT}`);
});
