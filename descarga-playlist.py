import yt_dlp
import os

def descargar_lista(url_playlist):
    # Nombre de la carpeta donde se guardarán
    carpeta_destino = "descargas_musica"
    
    # Opciones de configuración para yt-dlp
    ydl_opts = {
        'format': 'bestaudio/best', # Descargar la mejor calidad de audio disponible
        'postprocessors': [{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'mp3', # Convertir a MP3
            'preferredquality': '192', # Calidad 192kbps (estándar buena)
        }],
        # Plantilla del nombre del archivo: Carpeta/Titulo.mp3
        'outtmpl': f'{carpeta_destino}/%(title)s.%(ext)s',
        
        # Opciones extra para que no se detenga si falla un video
        'ignoreerrors': True,
        'no_warnings': True,
    }

    print(f"🚀 Iniciando descarga en la carpeta '{carpeta_destino}'...")
    print("⏳ Esto puede tardar dependiendo de la longitud de la lista...")

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([url_playlist])
        print(f"\n✅ ¡Descarga finalizada! Revisa la carpeta '{carpeta_destino}'.")
    except Exception as e:
        print(f"\n❌ Ocurrió un error: {e}")

if __name__ == "__main__":
    # Pide la URL al usuario
    url = input("pegue aquí la URL de la Playlist de YouTube: ")
    
    if url:
        descargar_lista(url)
    else:
        print("No has introducido ninguna URL.")