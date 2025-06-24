const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Conexión a MongoDB Atlas
const MONGO_URI = 'mongodb+srv://rosalesvazquezsantiago46:1234@cluster0.egy6wky.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ Conectado a MongoDB Atlas'))
  .catch(err => {
    console.error('❌ Error de conexión a MongoDB:', err);
    if (err.code === 'ETIMEDOUT') {
      console.log('Error de conexión: Verifica tu internet o configuración de red');
    }
  });

// Modelos
const MaterialSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  tipo: { type: String, required: true },
  color_contenedor: { type: String, required: true },
  descripcion: String
}, { timestamps: true });

const PuntoRecoleccionSchema = new mongoose.Schema({
  ubicacion: { type: String, required: true },
  id_material: { type: mongoose.Schema.Types.ObjectId, ref: 'Material', required: true },
  capacidad: Number,
  tipo_contenedor: String,
  estado: { type: Boolean, default: true }
}, { timestamps: true });

const Material = mongoose.model('Material', MaterialSchema);
const PuntoRecoleccion = mongoose.model('PuntoRecoleccion', PuntoRecoleccionSchema);

// Rutas para Materiales
app.get('/api/materiales', async (req, res) => {
  try {
    const materiales = await Material.find().sort({ createdAt: -1 });
    res.json(materiales);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/materiales', async (req, res) => {
  try {
    if (!req.body.nombre || !req.body.tipo || !req.body.color_contenedor) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }
    
    const material = new Material(req.body);
    await material.save();
    res.status(201).json(material);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Ruta PUT actualizada para edición
app.put('/api/materiales/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'ID no válido' });
    }

    const material = await Material.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!material) {
      return res.status(404).json({ error: 'Material no encontrado' });
    }
    
    res.json(material);
  } catch (err) {
    res.status(400).json({ 
      error: 'Error al actualizar material',
      detalles: err.message 
    });
  }
});

app.delete('/api/materiales/:id', async (req, res) => {
  try {
    const material = await Material.findByIdAndDelete(req.params.id);
    if (!material) return res.status(404).json({ error: 'Material no encontrado' });
    
    await PuntoRecoleccion.deleteMany({ id_material: req.params.id });
    res.json({ message: 'Material y puntos asociados eliminados' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Rutas para Puntos de Recolección (se mantienen igual)
app.get('/api/puntos', async (req, res) => {
  try {
    const puntos = await PuntoRecoleccion.find().populate('id_material').sort({ createdAt: -1 });
    res.json(puntos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/puntos', async (req, res) => {
  try {
    if (!req.body.ubicacion || !req.body.id_material) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }
    
    const punto = new PuntoRecoleccion(req.body);
    await punto.save();
    const puntoConMaterial = await PuntoRecoleccion.findById(punto._id).populate('id_material');
    res.status(201).json(puntoConMaterial);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/puntos/:id', async (req, res) => {
  try {
    const punto = await PuntoRecoleccion.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('id_material');
    if (!punto) return res.status(404).json({ error: 'Punto no encontrado' });
    res.json(punto);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/puntos/:id', async (req, res) => {
  try {
    const punto = await PuntoRecoleccion.findByIdAndDelete(req.params.id);
    if (!punto) return res.status(404).json({ error: 'Punto no encontrado' });
    res.json({ message: 'Punto eliminado correctamente' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
