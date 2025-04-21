const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();
const bcrypt = require('bcryptjs');

const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());

// Configuración de SQLite
const db = new sqlite3.Database("./database.sqlite", (err) => {
  if (err) {
    console.error("Error al conectar con SQLite:", err.message);
  } else {
    console.log("Conectado a la base de datos SQLite.");
  }
});

// Crear tabla de ejemplo si no existe
db.serialize(() => {
  db.run(
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL
    )`,
    (err) => {
      if (err) {
        console.error("Error al crear la tabla:", err.message);
      }
    }
  );
});

db.serialize(() => {
  db.run(
    `CREATE TABLE IF NOT EXISTS procesos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      lider TEXT NOT NULL,
      origen TEXT NOT NULL,
      fechaInicio TEXT NOT NULL,
      fechaVencimiento TEXT NOT NULL,
      meta TEXT,
      que TEXT,
      porQue TEXT,
      como TEXT,
      donde TEXT,
      estado TEXT NOT NULL,
      observaciones TEXT DEFAULT '[]',
      archivos TEXT DEFAULT '[]'
    )`,
    (err) => {
      if (err) {
        console.error("Error al crear la tabla procesos:", err.message);
      } else {
        console.log("Tabla 'procesos' creada exitosamente.");
      }
    }
  );
});

app.get("/api/procesos", (req, res) => {
  db.all("SELECT * FROM procesos", [], (err, rows) => {
    if (err) {
      console.error("Error al obtener los procesos:", err.message);
      res.status(500).json({ error: "Error en el servidor" });
    } else {
      res.json(rows);
    }
  });
});

app.get("/api/procesos/:id", (req, res) => {
  const { id } = req.params;

  db.get("SELECT * FROM procesos WHERE id = ?", [id], (err, row) => {
    if (err) {
      console.error("Error al obtener el proceso:", err.message);
      res.status(500).json({ error: "Error en el servidor" });
    } else if (!row) {
      res.status(404).json({ error: "Proceso no encontrado" });
    } else {
      // Parsear observaciones y archivos como JSON antes de enviarlos
      row.observaciones = JSON.parse(row.observaciones || "[]");
      row.archivos = JSON.parse(row.archivos || "[]");
      res.json(row);
    }
  });
});

app.post("/api/procesos", (req, res) => {
  const {
    nombre,
    lider,
    origen,
    fechaInicio,
    fechaVencimiento,
    meta,
    que,
    porQue,
    como,
    donde,
    estado,
  } = req.body;

  const query = `
    INSERT INTO procesos (nombre, lider, origen, fechaInicio, fechaVencimiento, meta, que, porQue, como, donde, estado)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.run(
    query,
    [
      nombre,
      lider,
      origen,
      fechaInicio,
      fechaVencimiento,
      meta,
      que,
      porQue,
      como,
      donde,
      estado || "En proceso",
    ],
    function (err) {
      if (err) {
        console.error("Error al insertar el proceso:", err.message);
        res.status(500).json({ error: "Error al crear el proceso" });
      } else {
        res.status(201).json({ id: this.lastID, message: "Proceso creado exitosamente" });
      }
    }
  );
});

app.put("/api/procesos/:id", (req, res) => {
  const { id } = req.params;
  const { observaciones, archivos } = req.body;

  const query = `
    UPDATE procesos
    SET observaciones = ?, archivos = ?
    WHERE id = ?
  `;

  db.run(
    query,
    [JSON.stringify(observaciones || []), JSON.stringify(archivos || []), id],
    function (err) {
      if (err) {
        console.error("Error al actualizar el proceso:", err.message);
        res.status(500).json({ error: "Error al actualizar el proceso" });
      } else if (this.changes === 0) {
        res.status(404).json({ error: "Proceso no encontrado" });
      } else {
        res.json({ message: "Proceso actualizado exitosamente" });
      }
    }
  );
});

// Crear un nuevo usuario
app.post('/api/users', async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Nombre, correo y contraseña son obligatorios' });
  }

  try {
    // Encriptar la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    const query = `INSERT INTO users (name, email, password) VALUES (?, ?, ?)`;

    db.run(query, [name, email, hashedPassword], function (err) {
      if (err) {
        console.error('Error al agregar el usuario:', err.message);
        return res.status(500).json({ error: 'Error al agregar el usuario' });
      }
      res.status(201).json({ id: this.lastID, message: 'Usuario agregado exitosamente' });
    });
  } catch (error) {
    console.error('Error al encriptar la contraseña:', error.message);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// Eliminar un usuario
app.delete('/api/users/:id', (req, res) => {
  const { id } = req.params;

  const query = `DELETE FROM users WHERE id = ?`;

  db.run(query, [id], function (err) {
    if (err) {
      console.error('Error al eliminar el usuario:', err.message);
      return res.status(500).json({ error: 'Error al eliminar el usuario' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json({ message: 'Usuario eliminado exitosamente' });
  });
});

// Ruta de prueba para verificar conexión con SQLite
app.get("/api/users", (req, res) => {
  db.all("SELECT * FROM users", [], (err, rows) => {
    if (err) {
      console.error(err);
      res.status(500).json({ error: "Error en el servidor" });
    } else {
      res.json(rows);
    }
  });
});

// Iniciar servidor
app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});
