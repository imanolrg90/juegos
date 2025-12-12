import yt_dlp
import os
def descargar_playlist_mp3(url_playlist, carpeta_destino="Descargas"):
    if not os.path.exists(carpeta_destino):
        os.makedirs(carpeta_destino)

    opciones = {
        'format': 'bestaudio/best',
        'outtmpl': f'{carpeta_destino}/%(title)s.%(ext)s',
        'postprocessors': [{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'mp3',
            'preferredquality': '192',
        }],
        'ignoreerrors': True,
        'quiet': False,
        
        # --- AGREGA ESTA LÍNEA ---
        # Esto usará las cookies de tu navegador Chrome.
        # Si usas Edge, cambia 'chrome' por 'edge'. Si usas Firefox, por 'firefox'.
        'cookiesfrombrowser': ('chrome',), 
    }

    try:
        with yt_dlp.YoutubeDL(opciones) as ydl:
            print(f"Iniciando descarga... (Usando cookies del navegador)")
            ydl.download([url_playlist])
            print("¡Descarga completada!")
    except Exception as e:
        print(f"Ocurrió un error: {e}")
# --- USO ---
# Pega aquí la URL de tu playlist (puede ser de un canal, mix o playlist pública)
url = "https://www.youtube.com/watch?v=U6phuhL1YbY&list=PLW-YUx36hA_CUI3110jJPERuk-KkrkqBL" 

descargar_playlist_mp3(url)