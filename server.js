// server.js
const express = require('express');
const mysql = require('mysql');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const app = express();

// Configuration MySQL
const db = mysql.createConnection({
  host: 'localhost',
  user: 'korom',
  password: 'Monkey78%',
  database: 'loc_prod'
});

db.connect(err => {
  if (err) {
    console.error('Erreur de connexion à MySQL:', err);
  } else {
    console.log('Connecté à MySQL');
  }
});

// Middleware pour analyser le corps des requêtes
app.use(bodyParser.json());

// Middleware de gestion des erreurs
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Erreur serveur!');
});

// Middleware pour vérifier le token
const verifyToken = (req, res, next) => {
  const token = req.header('Authorization');
  if (!token) return res.status(401).send('Non autorisé');

  jwt.verify(token, 'secret', (err, user) => {
    if (err) return res.status(403).send('Token invalide');
    req.user = user;
    next();
  });
};

// Endpoint d'inscription
app.post('/signup', async (req, res) => {
  const { username, password } = req.body;

  // Vérifier si l'utilisateur existe déjà
  const query = 'SELECT * FROM utilisateurs WHERE username = ?';
  db.query(query, [username], async (err, result) => {
    if (err) throw err;

    if (result.length > 0) {
      return res.status(400).send('Nom d\'utilisateur déjà utilisé');
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Ajouter un nouvel utilisateur
    const insertQuery = 'INSERT INTO utilisateurs (username, password) VALUES (?, ?)';
    db.query(insertQuery, [username, hashedPassword], (err, result) => {
      if (err) throw err;
      res.status(201).send('Inscription réussie');
    });
  });
});

// Endpoint de connexion
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  // Vérifier les informations d'identification
  const query = 'SELECT * FROM utilisateurs WHERE username = ?';
  db.query(query, [username], async (err, result) => {
    if (err) throw err;

    if (result.length === 0) {
      return res.status(401).send('Nom d\'utilisateur ou mot de passe incorrect');
    }

    const user = result[0];
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).send('Nom d\'utilisateur ou mot de passe incorrect');
    }

    // Générer un token
    const token = jwt.sign({ username: user.username }, 'secret');
    res.header('Authorization', token).send('Connexion réussie');
  });
});

// Endpoint protégé
app.get('/protected', verifyToken, (req, res) => {
  res.send(`Bienvenue, ${req.user.username}!`);
});

// Démarrer le serveur
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Serveur en écoute sur le port ${port}`);
});

