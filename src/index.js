const express = require('express');
const cors = require('cors');

const { v4: uuidv4 } = require('uuid');

const app = express();

app.use(cors());
app.use(express.json());

const users = [];

function checksExistsUserAccount(request, response, next) {
  const { username } = request.headers;

  const user = users.find(user => user.username === username);

  if(!user){
    return response.status(404).json({ 
      error: "Usuário não encontrado!" 
    });
  }
  request.user = user;

  return next();
}

app.post('/users', async (request, response) => {
  const { name, username } = request.body;

  const userExists = users.some(user => user.username === username);

  if(userExists) {
    return response.status(400).json({ 
      error: "Já existe um usuário utilizando este username, tente informar outro!" 
    });
  }

  const user = {
    id: uuidv4(),
    name,
    username,
    todos: []
  }
  
  users.push(user);

  return response.status(201).json(user);
});

app.get('/todos', checksExistsUserAccount, async (request, response) => {
  const { user } = request;
  
  return response.status(200).json(user.todos)
});

app.post('/todos', checksExistsUserAccount, async (request, response) => {
  const { title, deadline } = request.body;
  const { user } = request;

  const todo = {
    id: uuidv4(),
    title,
    done: false,
    deadline: new Date(deadline),
    created_at: new Date()
  }

  user.todos.push(todo);

  return response.status(201).json(todo);
});

app.put('/todos/:id', checksExistsUserAccount, async (request, response) => {
  const { id } = request.params;
  const { username } = request.headers;
  const { title, deadline } = request.body;

  const user = users.find(user => user.username === username);
  const todo = user.todos.find(todo => todo.id === id);

  if(!todo) {
    return response.status(404).json({ 
      error: "TODO não encontrado, informe o ID correto!" 
    });
  }

  const todoUpdated = Object.assign(todo, {
    title,
    deadline: new Date(deadline)
  });

  return response.status(201).json(todoUpdated);
});

app.patch('/todos/:id/done', checksExistsUserAccount, async (request, response) => {
  const { id } = request.params;
  const { user } = request;
  
  const todo = user.todos.find(todo => todo.id === id);

  if(!todo) {
    return response.status(404).json({ 
      error: "TODO não encontrado, informe o ID correto!" 
    });
  }

  todo.done = true;

  return response.status(200).json(todo);
});

app.delete('/todos/:id', checksExistsUserAccount, async(request, response) => {
  const { id } = request.params;
  const { user } = request;

  const todoExists = user.todos.some(todo => todo.id === id);

  if(!todoExists){
    return response.status(404).json({ 
      error: "TODO não encontrado, informe o ID correto!" 
    });
  }

  const indexUser = user.todos.findIndex(todo => todo.id === id);
  user.todos.splice(indexUser, 1);

  return response.status(204).send();
});

module.exports = app;