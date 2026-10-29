const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3000;

// Servir archivos estáticos (tu HTML, JS y las canciones)
app.use(express.static(__dirname));
app.use('/assets', express.static(path.join(__dirname, 'assets')));

app.post('/api/bingo/song-start', express.json({ limit: '16kb' }), (req, res) => {
    if (req.get('origin') && req.get('origin') !== `${req.protocol}://${req.get('host')}`) {
        return res.status(403).json({ error: 'Origen no permitido.' });
    }
    const { file, startTime } = req.body || {};
    if (typeof file !== 'string' || !file || !Number.isFinite(startTime) || startTime < 0) {
        return res.status(400).json({ error: 'La cancion y el segundo de inicio deben ser validos.' });
    }
    const seconds = Number(startTime.toFixed(3));
    const catalogPath = path.join(__dirname, 'js', 'songs.js');
    const temporaryPath = `${catalogPath}.${process.pid}.tmp`;
    const startMarker = '// BEGIN BINGO SONG START TIMES\n';
    const endMarker = '// END BINGO SONG START TIMES';
    try {
        const source = fs.readFileSync(catalogPath, 'utf8');
        const newline = source.includes('\r\n') ? '\r\n' : '\n';
        const normalized = source.replace(/\r\n/g, '\n');
        const markerIndex = normalized.indexOf(startMarker);
        const base = markerIndex === -1 ? normalized : normalized.slice(0, markerIndex);
        const files = [...base.matchAll(/\bfile\s*:\s*("(?:\\.|[^"\\])*")/g)].map(match => JSON.parse(match[1]));
        if (!files.includes(file)) return res.status(404).json({ error: 'La cancion no existe en songs.js.' });
        let starts = {};
        if (markerIndex !== -1) {
            const block = normalized.slice(markerIndex + startMarker.length);
            if (!block.endsWith(`${endMarker}\n`)) throw new Error('El bloque de inicios no es valido.');
            starts = JSON.parse(block.split('const BINGO_SONG_START_TIMES = ')[1].split(';\n')[0]);
            if (!starts || Array.isArray(starts) || typeof starts !== 'object'
                || Object.values(starts).some(value => !Number.isFinite(value) || value < 0)) {
                throw new Error('Los inicios guardados no son validos.');
            }
        }
        starts[file] = seconds;
        const updated = base + (base.endsWith('\n') ? '' : '\n') + startMarker
            + `const BINGO_SONG_START_TIMES = ${JSON.stringify(starts, null, 4)};\n`
            + 'sourceSongs.forEach(song => {\n'
            + '    if (Object.prototype.hasOwnProperty.call(BINGO_SONG_START_TIMES, song.file)) {\n'
            + '        song.startTime = BINGO_SONG_START_TIMES[song.file];\n'
            + '    }\n'
            + '});\n'
            + endMarker + '\n';
        fs.writeFileSync(temporaryPath, updated.replace(/\n/g, newline), { encoding: 'utf8', flag: 'wx' });
        fs.renameSync(temporaryPath, catalogPath);
        res.json({ file, startTime: seconds });
    } catch (error) {
        console.error('No se pudo guardar el inicio de la cancion:', error);
        res.status(500).json({ error: 'No se pudo escribir el inicio en songs.js. Revisa el archivo y sus permisos.' });
    } finally {
        if (fs.existsSync(temporaryPath)) fs.unlinkSync(temporaryPath);
    }
});

app.get('/api/bingo/sponsors', (req, res) => {
    const imagesPath = path.join(__dirname, 'assets', 'img');
    const imageExtensions = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.avif', '.bmp']);
    try {
        const directories = fs.readdirSync(imagesPath, { withFileTypes: true })
            .filter(entry => entry.isDirectory())
            .sort((a, b) => Number(b.name === 'estandar') - Number(a.name === 'estandar') || a.name.localeCompare(b.name));
        if (!directories.some(directory => directory.name === 'estandar')) {
            console.error('Falta la carpeta obligatoria assets/img/estandar');
            return res.status(500).json({ error: 'Falta la carpeta obligatoria assets/img/estandar.' });
        }
        const folders = directories.map(directory => ({
            name: directory.name,
            sponsors: fs.readdirSync(path.join(imagesPath, directory.name), { withFileTypes: true })
                .filter(entry => entry.isFile() && imageExtensions.has(path.extname(entry.name).toLowerCase()))
                .sort((a, b) => a.name.localeCompare(b.name))
                .map(image => ({
                    name: path.parse(image.name).name,
                    img: `img/${encodeURIComponent(directory.name)}/${encodeURIComponent(image.name)}`
                }))
        }));
        res.set('Cache-Control', 'no-store').json({ defaultFolder: 'estandar', folders });
    } catch (error) {
        console.error('No se pudieron leer las carpetas de patrocinadores:', error);
        res.status(500).json({ error: 'No se pudieron leer las carpetas de patrocinadores.' });
    }
});

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