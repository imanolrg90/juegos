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
- **Modo Halloween (Bingo)**: En `bingo/index.html`, pulsa **🎃 Modo Halloween** junto al título del tablero para activar o desactivar la ambientación de terror. La preferencia se recuerda en el navegador sin reiniciar la partida ni interrumpir la música. Incluye colores naranja y violeta, luna, murciélagos y telarañas, también en los modales; respeta la preferencia de movimiento reducido del sistema. Las bolas del tablero tienen forma de calabaza (apagadas en violeta y encendidas en naranja al marcarse), las bolas especiales conservan sus distintivos y la cuenta atrás 3, 2, 1 se muestra con calabazas y el grito real de `assets/sounds/scream.mp3`, con el volumen del reproductor. Los eventos de brindis muestran un fantasma y los de conga una bruja. Al desactivar el modo vuelven las bolas, los iconos y los pitidos normales.

La ambientación incluye una casa encantada y un cementerio en silueta, niebla en movimiento, telarañas, una araña en el reproductor y una cabecera especial de Halloween. Los modales cambian sus mensajes y los eventos especiales llevan una decoración de terror. Estos efectos solo aparecen con el modo activo, no cambian la partida y respetan el movimiento reducido.

Al revelar el resultado, el número aparece entre humo violeta con un brillo naranja y una entrada suave. Al confirmarlo o marcarlo manualmente, su calabaza destaca brevemente y queda iluminada con un suave efecto de vela; solo la última marcada mantiene esta animación y se recuerda al recargar la partida. Los patrocinadores llevan un marco de retrato encantado con telarañas en ambos modales, sin filtros sobre sus fotos. Con movimiento reducido se omiten las animaciones y el humo, manteniendo el marco y la luz fija. Al desactivar Halloween se recupera el aspecto clásico.

El tablero Halloween tiene un marco antiguo, una luna con murciélagos y ramas, telarañas en las esquinas y un cementerio al pie con dos velas y bruma tenue. Fantasmas de tela translúcida con capucha y arañas de ocho patas articuladas recorren los pasillos entre filas, con rutas distintas que se recalculan al redimensionar o cambiar de tema. Los fantasmas aparecen y se desvanecen suavemente; los recorridos siguen los huecos entre las calabazas y los bordes, y ninguna criatura intercepta clics. No hay franja promocional: el título y el pie son compactos y, en escritorio, las nueve filas se ajustan a la altura disponible (con desplazamiento en ventanas muy bajas). En móvil se mantienen cinco columnas legibles. Con movimiento reducido las criaturas y las velas quedan quietas.

## ⚙️ Requisitos

- Navegador web moderno (Chrome, Firefox, Safari, Edge)
- Conexión a Internet (para reproducir los archivos de audio)
- No requiere instalación de dependencias

## 🚀 Cómo Ejecutar

1. Abre `index.html` en tu navegador web
2. ¡Disfruta del Bingo Musical!

## 🎵 Personalización

### Guardar el inicio de una canción

En el reproductor del bingo, tanto clásico como Halloween, sitúate en el punto deseado y pulsa **💾**, a la derecha del botón de avance de 10 segundos (**Guardar inicio desde aquí**). El botón se habilita cuando se ha cargado una canción. Se guarda el instante del clic, con precisión de milisegundos; al volver a pulsarlo se sustituye el inicio anterior de esa misma canción (identificada por su ruta completa).

El servidor escribe un bloque de inicios al final de `js/songs.js`, sin reformatear ni reescribir las canciones originales. Este bloque aplica la propiedad `startTime` a las canciones correspondientes y prevalece sobre un inicio declarado previamente en el objeto. No es un ajuste exclusivo del navegador: persiste en disco. Guardar desde 0:00 permite volver al principio.

La reproducción normal y manual del bingo usa ese inicio en las siguientes reproducciones, también al recuperar una partida. Guardarlo no reinicia ni desplaza el audio que está sonando. Si el punto guardado supera la duración del archivo, se avisa para que puedas corregirlo. Un error de escritura se muestra en el reproductor, sin anunciar un guardado correcto.

El check **Usar inicios guardados** está activado por defecto y recuerda su estado en el navegador. Si lo desmarcas, las siguientes canciones empiezan desde 0:00, tanto en reproducción normal como manual y en ambos temas. Cambiarlo no mueve la canción actual ni borra o impide guardar sus puntos de inicio.

Esta función requiere el servidor Flask o Node y permisos de escritura sobre `js/songs.js`; no funciona abriendo el HTML directamente. Las modificaciones guardadas durante el juego son cambios del catálogo que puedes incluir en tus próximos commits.

### Patrocinadores del bingo

Ejecuta la aplicación con el servidor Flask (`python app.py`) o el servidor Node existente y abre `bingo/index.html` desde ese servidor. La detección de carpetas no funciona abriendo el HTML directamente.

- Añade las imágenes a `assets/img/estandar` (carpeta obligatoria y seleccionada por defecto) o a otra subcarpeta directa de `assets/img`, como `Halloween`.
- Puedes crear tantas carpetas como quieras: se detectan automáticamente al abrir el bingo y al pulsar **Nuevo Bingo**, sin editar JavaScript. Solo se leen imágenes directamente dentro de cada carpeta, no subcarpetas.
- Selecciona la lista de canciones y la carpeta de patrocinadores antes de pulsar **Nuevo Bingo**. La selección de patrocinadores es independiente del modo visual Halloween.
- Cada imagen se asigna una sola vez a un número aleatorio distinto. Si hay más de 90, se eligen 90 imágenes al azar. Una carpeta vacía permite jugar sin patrocinadores.
- El nombre del archivo sin extensión se muestra como nombre del patrocinador. Se admiten JPG, JPEG, PNG, GIF, WebP, SVG, AVIF y BMP, sin distinguir mayúsculas.
- Las imágenes que estén sueltas en `assets/img` y los campos `patrocinador`, `img` e `imagen` de las canciones se ignoran. No hace falta modificar `js/songs.js`.
- La asignación se guarda con la partida y no cambia al recargar ni al cambiar el selector durante el juego. Las partidas antiguas se recuperan sin sus patrocinadores declarados en canciones; crea un nuevo bingo para usar las carpetas.

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
