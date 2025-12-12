# 🎵 Bingo Musical

Una aplicación web interactiva para jugar bingo musical con 90 números y canciones populares.

## 📋 Características

### Panel Izquierdo - Controles
- **🎲 Nuevo Bingo**: Reinicia la partida, limpia los números y carga todas las canciones
- **⏭️ Siguiente Canción**: Reproduce una canción aleatoria asociada a un número
- **✓ Mostrar Resultado**: Marca el número y detiene la música
- **Estadísticas**: Muestra canciones jugadas y estado del juego

### Panel Derecho - Grid de Números
- Grid de 9×10 con números del 1 al 90
- Los números se colorean en verde al ser marcados
- Visualización clara del progreso del juego

### Modal de Canciones
- Accesible desde el botón 📋 en la esquina superior derecha
- Lista completa de 90 canciones
- Las canciones escuchadas aparecen marcadas en verde

## 🎮 Cómo Jugar

1. **Inicia el juego**: Haz clic en "🎲 Nuevo Bingo"
2. **Escucha la canción**: Haz clic en "⏭️ Siguiente Canción"
3. **Marca el número**: Cuando ya hayas identificado la canción, haz clic en "✓ Mostrar Resultado"
4. **Continúa**: Repite los pasos 2-3 para seguir jugando
5. **Consulta el progreso**: Usa el botón 📋 para ver el listado de canciones

## 📁 Estructura de Archivos

```
BINGO MUSICAL/
├── index.html      # Estructura HTML principal
├── styles.css      # Estilos y diseño responsivo
├── app.js          # Lógica principal del juego
├── songs.js        # Base de datos de 90 canciones
└── README.md       # Este archivo
```

## 🎵 Base de Datos de Canciones

La aplicación incluye 90 canciones populares de diferentes géneros:
- Rock clásico (Queen, Led Zeppelin, The Beatles)
- Pop moderno (Dua Lipa, The Weeknd, Billie Eilish)
- Reggaeton y Latino (Bad Bunny, Despacito, Shakira)
- 80s y 90s (Wham!, Nirvana, Radiohead)
- Y muchas más...

## 🎨 Diseño

- **Interfaz moderna** con gradientes y sombras
- **Responsive**: Se adapta a diferentes tamaños de pantalla
- **Animaciones suaves**: Transiciones y efectos visuales
- **Colores intuitivos**: Verde para números marcados, estados claros

## ⚙️ Requisitos

- Navegador web moderno (Chrome, Firefox, Safari, Edge)
- Conexión a Internet (para reproducir los archivos de audio)
- No requiere instalación de dependencias

## 🚀 Cómo Ejecutar

1. Abre `index.html` en tu navegador web
2. ¡Disfruta del Bingo Musical!

## 🎵 Personalización

Para agregar canciones personalizadas:

1. Abre `songs.js`
2. Agrega nuevas canciones al array `SONGS_DATABASE` siguiendo este formato:

```javascript
{
    number: 91,
    title: "Nombre de la Canción",
    artist: "Artista",
    audioUrl: "URL_de_audio"
}
```

## 📝 Notas

- Las URLs de audio son ejemplos. Para usar canciones reales, reemplaza con URLs válidas
- El juego selecciona números aleatorios sin repetición
- Los números se marcan automáticamente al mostrar el resultado
- El estado se reinicia al comenzar un nuevo bingo

## 🔧 Troubleshooting

**El audio no se reproduce:**
- Verifica que las URLs en `songs.js` sean válidas
- Comprueba la conexión a Internet
- Revisa la consola del navegador para errores

**La página se ve mal:**
- Intenta actualizar (F5)
- Limpia el caché del navegador
- Abre en otro navegador

## 📄 Licencia

Proyecto educativo. Las canciones son de sus respectivos artistas y compositores.

---

¡Diviértete jugando Bingo Musical! 🎉
