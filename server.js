const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3000;

// Servir archivos estáticos (tu HTML, JS y las canciones)
app.use(express.static(__dirname));
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// API 1: Listar las carpetas (Temáticas)
app.get('/api/songs/', (req, res) => {
    const songsPath = path.join(__dirname, 'assets', 'songs');
    const categories = fs.readdirSync(songsPath).filter(file => {
        return fs.statSync(path.join(songsPath, file)).isDirectory();
    });
    res.json(categories);
});

// API 2: Listar canciones de una carpeta específica
app.get('/api/songs-list', (req, res) => {
    const category = req.query.category;
    const dirPath = path.join(__dirname, 'assets', 'songs', category);
    
    if (!fs.existsSync(dirPath)) return res.status(404).send("Carpeta no encontrada");

    const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.mp3'));
    
    // Aquí transformamos el nombre del archivo en el objeto que espera tu juego
    const songs = files.map(file => {
        // Ejemplo: "Artista - Titulo.mp3" -> artista: Artista, titulo: Titulo
        const nameWithoutExt = file.replace('.mp3', '');
        const parts = nameWithoutExt.split(' - ');
        
        return {
            file: `${category}/${file}`, // Ruta relativa para el audio player
            title: parts[1] || parts[0],
            artist: parts[1] ? parts[0] : "Desconocido"
        };
    });
    
    res.json(songs);
});

app.listen(PORT, () => console.log(`Servidor corriendo en http://localhost:${PORT}`));