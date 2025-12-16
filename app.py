from flask import Flask, send_from_directory, request, jsonify
import os
import json
import random
import socket
from threading import Timer
import webbrowser

app = Flask(__name__, static_folder='.', static_url_path='')

# --- VARIABLE GLOBAL: ESTADO DEL JUEGO ---
GAME_STATE = {
    "phase": "lobby",       # lobby, playing, voting, result
    "players": {},          # { "Nombre": {icon: "🎃", role: "crew", is_dead: False, votes_received: 0} }
    "theme": "",
    "secret_word": "",
    "impostors": [],        
    "total_votes": 0,
    "winner": None          
}

# --- DATOS DE PALABRAS (TUS DATOS) ---
WORD_DATA = {
    "profesiones": [
        "Abogado", "Actor", "Administrativo", "Agricultor", "Albañil", "Alfarero", "Animador", "Antropólogo", "Apicultor", "Arqueólogo",
        "Arquitecto", "Astronauta", "Astrónomo", "Atleta", "Auditor", "Azafata", "Bailarín", "Barbero", "Barrendero", "Bibliotecario",
        "Biólogo", "Bombero", "Botánico", "Boxeador", "Cajero", "Camarero", "Camionero", "Cantante", "Carnicero", "Carpintero",
        "Cartero", "Científico", "Cirujano", "Cocinero", "Comediante", "Compositor", "Conductor", "Conserje", "Contable", "Coreógrafo",
        "Corredor", "Costurera", "Criminalista", "Cura", "Detective", "Dentista", "Dibujante", "Director", "Diseñador", "DJ",
        "Doctor", "Ecologista", "Economista", "Electricista", "Enfermero", "Entrenador", "Escritor", "Escultor", "Espía", "Estadístico",
        "Farmacéutico", "Filósofo", "Físico", "Florista", "Fontanero", "Fotógrafo", "Funcionario", "Futbolista", "Ganadero", "Geólogo",
        "Gimnasta", "Guionista", "Guitarrista", "Historiador", "Ingeniero", "Jardinero", "Joyero", "Juez", "Librero", "Locutor",
        "Maestro", "Mago", "Maquillador", "Marinero", "Matemático", "Mecánico", "Médico", "Meteorólogo", "Minero", "Modelo",
        "Monja", "Músico", "Niñera", "Notario", "Nutricionista", "Oculista", "Odontólogo", "Oficial", "Panadero", "Pastor",
        "Payaso", "Peluquero", "Periodista", "Pescador", "Piloto", "Pintor", "Policía", "Político", "Portero", "Profesor",
        "Programador", "Psicólogo", "Psiquiatra", "Publicista", "Químico", "Recepcionista", "Relojero", "Repartidor", "Reportero", "Sacerdote",
        "Sastre", "Secretario", "Segurata", "Soldado", "Socorrista", "Taxista", "Técnico", "Tenista", "Torero", "Traductor",
        "Veterinario", "Vigilante", "Youtuber", "Zapatero", "Zoólogo"
    ],
    "objetos": [
        "Abanico", "Abrigo", "Aceite", "Aguja", "Alfombra", "Almohada", "Anillo", "Anteojos", "Armario", "Auriculares",
        "Balanza", "Balón", "Banco", "Bandera", "Batería", "Batidora", "Bicicleta", "Billete", "Bolígrafo", "Bolsa",
        "Bombilla", "Botas", "Botella", "Botón", "Bufanda", "Calculadora", "Calendario", "Cama", "Cámara", "Camisa",
        "Campana", "Candado", "Caja", "Cajón", "Carpeta", "Cartera", "Casco", "Cazo", "Cepillo", "Cerradura",
        "Cesta", "Chaleco", "Chaqueta", "Cinturón", "Clavo", "Coche", "Cocina", "Colchón", "Collar", "Cometa",
        "Computadora", "Copa", "Corbata", "Cortina", "Cuaderno", "Cuadro", "Cuchara", "Cuchillo", "Cuerda", "Dado",
        "Dardos", "Despertador", "Diamante", "Disco", "Dominó", "Ducha", "Edredón", "Escalera", "Escoba", "Espejo",
        "Esponja", "Estantería", "Estuche", "Exprimidor", "Falda", "Farola", "Ficha", "Flauta", "Florero", "Foco",
        "Fregona", "Gafas", "Gorra", "Grapadora", "Grifo", "Guantes", "Guitarra", "Hacha", "Hilo", "Horno",
        "Imán", "Impresora", "Inodoro", "Jabón", "Jarrón", "Jaula", "Jeringuilla", "Joya", "Juguete", "Ladrillo",
        "Lámpara", "Lápiz", "Lavadora", "Libro", "Licuadora", "Linterna", "Llave", "Maleta", "Manguera", "Manta",
        "Mapa", "Maquillaje", "Marcador", "Martillo", "Mascarilla", "Mesa", "Micrófono", "Microondas", "Mochila", "Moneda",
        "Monitor", "Moto", "Mueble", "Muñeca", "Nevera", "Ordenador", "Pala", "Pantalón", "Pañuelo", "Papel",
        "Paraguas", "Peine", "Pelota", "Pendrive", "Percha", "Perfume", "Periódico", "Piano", "Pila"
    ],
    "animales": [
        "Águila", "Alce", "Almeja", "Anaconda", "Antílope", "Araña", "Ardilla", "Armadillo", "Avispa", "Avestruz",
        "Ballena", "Barracuda", "Bisonte", "Búfalo", "Búho", "Buitre", "Burro", "Caballo", "Cabra", "Cacatúa",
        "Cachalote", "Caimán", "Calamar", "Camaleón", "Camello", "Canario", "Cangrejo", "Canguro", "Caracol", "Castor",
        "Cebra", "Cerdo", "Chacal", "Chimpancé", "Ciempiés", "Ciervo", "Cigüeña", "Cisne", "Cobaya", "Cocodrilo",
        "Codorniz", "Colibrí", "Comadreja", "Cóndor", "Conejo", "Coral", "Correcaminos", "Coyote", "Cucaracha", "Cuervo",
        "Delfín", "Demonio de Tasmania", "Dinosaurio", "Dragón", "Dromedario", "Elefante", "Erizo", "Escarabajo", "Escorpión", "Estrella de mar",
        "Faisán", "Flamenco", "Foca", "Gacela", "Gallina", "Gallo", "Gamba", "Ganso", "Garrapata", "Garza",
        "Gato", "Gavilán", "Golondrina", "Gorila", "Gorrión", "Grillo", "Guepardo", "Gusano", "Halcón", "Hámster",
        "Hiena", "Hipopótamo", "Hormiga", "Hurón", "Iguana", "Impala", "Jabalí", "Jaguar", "Jirafa", "Koala",
        "Lagartija", "Langosta", "Lechuza", "Lémur", "León", "Leopardo", "Libélula", "Lince", "Llama", "Lobo",
        "Loro", "Luciérnaga", "Mamut", "Manatí", "Mandril", "Mangosta", "Manta Raya", "Mantis", "Mapache", "Mariposa",
        "Mariquita", "Medusa", "Mejillón", "Mosca", "Mosquito", "Mula", "Murciélago", "Nutria", "Ñu", "Oca",
        "Orangután", "Orca", "Ornitorrinco", "Oso", "Ostra", "Oveja", "Pájaro", "Paloma", "Pantera", "Pato"
    ],
    "cantantes": [
        "Adele", "Aitana", "Alejandro Sanz", "Alicia Keys", "Amaia Montero", "Amy Winehouse", "Ana Mena", "Anitta", "Antonio Orozco", "Ariana Grande",
        "Avicii", "Bad Bunny", "Bad Gyal", "Becky G", "Bebe Rexha", "Beyoncé", "Billie Eilish", "Bisbal", "Bob Marley", "Bon Jovi",
        "Britney Spears", "Bruno Mars", "Bustamante", "C. Tangana", "Camila Cabello", "Camilo", "Camilo Sesto", "Cardi B", "Carlos Baute", "Carlos Vives",
        "Chayanne", "Chenoa", "Cher", "Christina Aguilera", "Coldplay", "Daddy Yankee", "Dani Martín", "David Bowie", "David Guetta", "Demi Lovato",
        "Don Omar", "Drake", "Dua Lipa", "Ed Sheeran", "El Canto del Loco", "Elton John", "Elvis Presley", "Eminem", "Enrique Iglesias", "Estopa",
        "Feid", "Fito y Fitipaldis", "Frank Sinatra", "Freddie Mercury", "Harry Styles", "Hombres G", "Imagine Dragons", "Isabel Pantoja", "J Balvin", "Jason Derulo",
        "Jennifer Lopez", "Joaquín Sabina", "John Lennon", "Juan Magán", "Juanes", "Justin Bieber", "Justin Timberlake", "Karol G", "Katy Perry", "Lady Gaga",
        "Lana Del Rey", "Laura Pausini", "Leiva", "Lewis Capaldi", "Lola Flores", "Lola Índigo", "Luis Fonsi", "Luis Miguel", "Madonna", "Maluma",
        "Malú", "Maná", "Manuel Carrasco", "Manuel Turizo", "Marc Anthony", "Mariah Carey", "Maroon 5", "Melendi", "Michael Jackson", "Miley Cyrus",
        "Mónica Naranjo", "Morat", "Nathy Peluso", "Nicky Jam", "Nino Bravo", "Olivia Rodrigo", "Omar Montes", "Ozuna", "Pablo Alborán", "Pablo López",
        "Paulina Rubio", "Pereza", "Pitbull", "Prince", "Quevedo", "Raphael", "Rauw Alejandro", "Rihanna", "Ricky Martin", "Rocío Dúrcal",
        "Rocío Jurado", "Romeo Santos", "Rosalía", "Sam Smith", "Sebastian Yatra", "Selena Gomez", "Shakira", "Shawn Mendes", "Sia", "Taylor Swift",
        "The Beatles", "The Weeknd", "Tina Turner", "Vanesa Martín", "Whitney Houston"
    ],
    "comida": [
        "Aceite", "Aceituna", "Aguacate", "Ajo", "Albahaca", "Albóndiga", "Alcachofa", "Almeja", "Almendra", "Arroz",
        "Atún", "Avellana", "Azúcar", "Bacalao", "Bacon", "Baguette", "Banana", "Batido", "Berberecho", "Berenjena",
        "Bizcocho", "Bocadillo", "Bogavante", "Bollo", "Boquerón", "Brócoli", "Burrito", "Café", "Calabacín", "Calabaza",
        "Calamar", "Canela", "Cangrejo", "Canelones", "Caramelo", "Carne", "Cebolla", "Cereza", "Cerveza", "Champiñón",
        "Chicle", "Chocolate", "Chorizo", "Chuleta", "Churro", "Ciruela", "Coco", "Coliflor", "Comino", "Conejo",
        "Cordero", "Croissant", "Croqueta", "Donut", "Dorada", "Empanada", "Ensalada", "Espagueti", "Espárrago", "Espinaca",
        "Fresa", "Fideos", "Filete", "Flan", "Frambuesa", "Fritura", "Galleta", "Gamba", "Garbanzo", "Gazpacho",
        "Gelatina", "Gofre", "Guisante", "Hamburguesa", "Harina", "Helado", "Higo", "Huevo", "Jamón", "Judía",
        "Kebab", "Kiwi", "Langosta", "Lasaña", "Leche", "Lechuga", "Lenteja", "Limón", "Macarrón", "Magdalena",
        "Maíz", "Mandarina", "Mango", "Mantequilla", "Manzana", "Marisco", "Mayonesa", "Melocotón", "Melón", "Membrillo",
        "Merluza", "Mermelada", "Miel", "Mortadela", "Mostaza", "Naranja", "Nata", "Nuez", "Ostra", "Paella",
        "Pan", "Panceta", "Patata", "Pato", "Pavo", "Pepino", "Pera", "Pescado", "Pimienta", "Pimiento",
        "Piña", "Pistacho", "Pizza", "Plátano", "Pollo", "Pomelo", "Puerro", "Pulpo", "Puré", "Queso",
        "Rábano", "Ravioli", "Refresco", "Sal", "Salchicha", "Salmón", "Salsa", "Sandía", "Sardina", "Sopa",
        "Sushi", "Taco", "Tallarín", "Tarta", "Té", "Ternera", "Tomate", "Tortilla", "Tostada", "Trigo",
        "Trufa", "Turrón", "Uva", "Vainilla", "Verdura", "Vinagre", "Vino", "Yogur", "Zanahoria", "Zumo"
    ],
    "lugares": [
        "Aeropuerto", "África", "Alaska", "Alemania", "Amazonas", "América", "Andalucía", "Antártida", "Argentina", "Asia",
        "Atenas", "Australia", "Autobús", "Ayuntamiento", "Banco", "Barcelona", "Barco", "Barrio", "Biblioteca", "Bosque",
        "Brasil", "Cabaña", "Cafetería", "Calle", "Campo", "Canadá", "Canarias", "Cárcel", "Caribe", "Carnicería",
        "Casa", "Castillo", "Catedral", "Cementerio", "Centro Comercial", "China", "Cine", "Circo", "Ciudad", "Cocina",
        "Colegio", "Colombia", "Comisaría", "Concierto", "Desierto", "Discoteca", "Egipto", "Edificio", "Escocia", "Escuela",
        "España", "Estación", "Estadio", "Estados Unidos", "Europa", "Everest", "Farmacia", "Feria", "Francia", "Fábrica",
        "Galicia", "Garaje", "Gasolinera", "Gimnasio", "Granja", "Grecia", "Habitación", "Hawái", "Heladería", "Holanda",
        "Hospital", "Hotel", "Iglesia", "India", "Inglaterra", "Instituto", "Irlanda", "Isla", "Italia", "Japón",
        "Jardín", "Jungla", "Laboratorio", "Lago", "Librería", "Londres", "Luna", "Madrid", "Marruecos", "Marte",
        "México", "Montaña", "Museo", "Nueva York", "Oficina", "Ópera", "Panadería", "París", "Parque", "Peluquería",
        "Perú", "Piscina", "Playa", "Plaza", "Polo Norte", "Portugal", "Prisión", "Pueblo", "Puente", "Puerto",
        "Restaurante", "Río", "Roma", "Rusia", "Sahara", "Salón", "Selva", "Sevilla", "Supermercado", "Suiza",
        "Teatro", "Templo", "Tienda", "Tokio", "Torre Eiffel", "Tren", "Universidad", "Valencia", "Venecia", "Zoológico"
    ],
    "deportes": [
        "Aeróbic", "Ajedrez", "Alpinismo", "Atletismo", "Automovilismo", "Bádminton", "Baile", "Baloncesto", "Balonmano", "Béisbol",
        "Billar", "Bolos", "Boxeo", "Buceo", "Caminata", "Camping", "Canoa", "Kárate", "Cartas", "Caza",
        "Ciclismo", "Cine", "Cocina", "Coleccionismo", "Cometas", "Correr", "Costura", "Cricket", "Croquet", "Crucigramas",
        "Dardos", "Dibujo", "Dominó", "Escalada", "Escritura", "Esgrima", "Esquí", "Fútbol", "Fútbol Sala", "Gimnasia",
        "Golf", "Hockey", "Jardinería", "Judo", "Juegos de Mesa", "Karate", "Karting", "Kayak", "Kickboxing", "Lectura",
        "Lucha Libre", "Magia", "Malabares", "Maratón", "Meditación", "Modelismo", "Motociclismo", "Música", "Natación", "Navegación",
        "Origami", "Padel", "Paintball", "Paracaidismo", "Parapente", "Parkour", "Patinaje", "Pesas", "Pesca", "Petanca",
        "Pintura", "Piragüismo", "Póker", "Puzles", "Rafting", "Remo", "Rubik", "Rugby", "Running", "Senderismo",
        "Skate", "Snowboard", "Softball", "Squash", "Sudoku", "Sumo", "Surf", "Taekwondo", "Teatro", "Tejer",
        "Tenis", "Tenis de Mesa", "Tiro con Arco", "Triatlón", "Videojuegos", "Voleibol", "Vóley Playa", "Waterpolo", "Yoga", "Zumba"
    ],
    "cine": [
        "Aladdin", "Alien", "Anakin Skywalker", "Aquaman", "Avatar", "Avengers", "Bambi", "Barbie", "Batman", "Bella",
        "Bestia", "Blancanieves", "Bob Esponja", "Bond", "Buzz Lightyear", "Capitán América", "Casper", "Catwoman", "Cenicienta", "Chaplin",
        "Chewbacca", "Chucky", "Coco", "Cruella", "Darth Vader", "Deadpool", "Doctor Strange", "Doraemon", "Drácula", "Dumbo",
        "El Guasón", "El Padrino", "El Rey León", "El Zorro", "Elsa", "ET", "Forrest Gump", "Frankenstein", "Frodo", "Gandalf",
        "Garfield", "Goku", "Godzilla", "Gollum", "Goofy", "Groot", "Gru", "Han Solo", "Hannibal", "Harry Potter",
        "Heidi", "Hércules", "Homer Simpson", "Hulk", "Indiana Jones", "Iron Man", "Jack Sparrow", "James Bond", "Jasmine", "Jedi",
        "Joker", "Jurassic Park", "King Kong", "Kratos", "Kung Fu Panda", "Ladybug", "Lara Croft", "Legolas", "Leia", "Luke Skywalker",
        "Madagascar", "Magneto", "Maléfica", "Mario Bros", "Matrix", "Mickey Mouse", "Minions", "Moana", "Mowgli", "Mulan",
        "Mufasa", "Nemo", "Neo", "Obi-Wan", "Olaf", "Optimus Prime", "Pantera Negra", "Peter Pan", "Pikachu", "Pinocho",
        "Piratas del Caribe", "Pocahontas", "Popeye", "Predator", "R2-D2", "Rambo", "Rapunzel", "Ratatouille", "Robin Hood", "Rocky",
        "Scooby Doo", "Sherlock Holmes", "Shrek", "Simba", "Sirenit", "Sonic", "Spider-Man", "Star Wars", "Superman", "Tarzán",
        "Terminator", "Thor", "Timón", "Titanic", "Tom y Jerry", "Toy Story", "Voldemort", "Wall-E", "Wolverine", "Wonder Woman",
        "Woody", "Yoda", "Zelda", "Zeus", "Zombies"
    ],
    "ropa": [
        "Abrigo", "Albornoz", "Alpargata", "Anillo", "Aretes", "Bañador", "Bata", "Bermudas", "Bikini", "Blusa",
        "Boina", "Bolso", "Bombín", "Botas", "Botines", "Bragas", "Broche", "Bufanda", "Calcetines", "Calzoncillos",
        "Camisa", "Camiseta", "Capa", "Capucha", "Cartera", "Casco", "Cazadora", "Chal", "Chaleco", "Chandal",
        "Chanclas", "Chaqueta", "Cinturón", "Collar", "Corbata", "Cordones", "Corsé", "Corbatin", "Diadema", "Disfraz",
        "Esmoquin", "Faja", "Falda", "Gabardina", "Gafas de sol", "Gemelos", "Gorra", "Gorro", "Guantes", "Hebilla",
        "Hilo", "Impermeable", "Jersey", "Joya", "Kimono", "Lana", "Lencería", "Lentejuelas", "Liga", "Mallas",
        "Manga", "Manoplas", "Medias", "Mocasines", "Mochila", "Mono", "Pajarita", "Pantalones", "Pantuflas", "Pañuelo",
        "Pareo", "Pasador", "Pijama", "Pinza", "Plataformas", "Polainas", "Polo", "Poncho", "Pulsera", "Reloj",
        "Ropa Interior", "Sandalias", "Sari", "Seda", "Sombrero", "Sostén", "Sudadera", "Suela", "Suéter", "Tacones",
        "Tanga", "Tatuaje", "Tejano", "Tenis", "Tiara", "tirantes", "Top", "Traje", "Túnica", "Turbante",
        "Uniforme", "Vaqueros", "Velo", "Vestido", "Visera", "Zapatillas", "Zapatos", "Zuecos"
    ],
    "marcas": [
        "Adidas", "Adobe", "Amazon", "Android", "Apple", "Audi", "Barbie", "Bic", "BMW", "Boeing",
        "Bosch", "Burger King", "Canon", "Chanel", "Chevrolet", "Coca-Cola", "Colgate", "Converse", "Danone", "Dell",
        "Disney", "Dominos", "Doritos", "Dove", "eBay", "Facebook", "Fanta", "Ferrari", "Fiat", "Ford",
        "Gillette", "Google", "GoPro", "Gucci", "H&M", "Harley-Davidson", "Heineken", "Heinz", "Honda", "HP",
        "Huawei", "Hyundai", "IBM", "IKEA", "Instagram", "Intel", "Jaguar", "Jeep", "Johnnie Walker", "Kellogg's",
        "KFC", "Kia", "Kinder", "KitKat", "Kodak", "Lamborghini", "Lego", "Levi's", "LG", "LinkedIn",
        "L'Oréal", "Louis Vuitton", "M&M's", "Mastercard", "McDonald's", "Mercedes", "Microsoft", "Mini", "Mitsubishi", "Monster",
        "Motorola", "Nascar", "NBA", "Nescafé", "Netflix", "Nike", "Nintendo", "Nissan", "Nivea", "Nokia",
        "Nutella", "Oreo", "Panasonic", "PayPal", "Pepsi", "Peugeot", "Philips", "Pizza Hut", "PlayStation", "Porsche",
        "Prada", "Pringles", "Puma", "Ray-Ban", "Red Bull", "Reebok", "Renault", "Rolex", "Samsung", "Santander",
        "Seat", "Shell", "Siemens", "Sony", "Spotify", "Starbucks", "Subway", "Suzuki", "Swarovski", "Tesla",
        "TikTok", "Toblerone", "Toyota", "Twitter", "Uber", "Vans", "Versace", "Visa", "Vodafone", "Volkswagen",
        "Volvo", "Walmart", "WhatsApp", "Windows", "Xbox", "Xiaomi", "Yahoo", "Yamaha", "YouTube", "Zara"
    ]
}

# --- FUNCIONES AUXILIARES ---
def get_local_ip():
    """Intenta obtener la IP local de la máquina para el QR"""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except:
        return "localhost"

# --- API: ESTADO PÚBLICO (PARA LA TV) ---
@app.route('/api/tv/state', methods=['GET'])
def get_tv_state():
    public_players = []
    for name, data in GAME_STATE["players"].items():
        public_players.append({
            "name": name,
            "icon": data["icon"],
            "is_dead": data["is_dead"],
            "votes": data["votes_received"]
        })
    
    return jsonify({
        "phase": GAME_STATE["phase"],
        "players": public_players,
        "theme": GAME_STATE["theme"],
        "winner": GAME_STATE["winner"],
        "ip": get_local_ip()
    })

# --- API: ESTADO PRIVADO (PARA EL MÓVIL) ---
@app.route('/api/player/status', methods=['GET'])
def get_player_status():
    name = request.args.get('name')
    if name not in GAME_STATE["players"]:
        return jsonify({"error": "Player not found"}), 404
    
    p_data = GAME_STATE["players"][name]
    
    return jsonify({
        "phase": GAME_STATE["phase"],
        "role": p_data["role"],          
        "secret_word": GAME_STATE["secret_word"] if p_data["role"] == "crew" else "ERES EL IMPOSTOR",
        "is_dead": p_data["is_dead"],
        "impostor_partners": GAME_STATE["impostors"] if p_data["role"] == "impostor" else []
    })

# --- ACCIONES DEL JUEGO ---

@app.route('/api/join', methods=['POST'])
def join_game():
    data = request.json
    name = data.get('name').strip()
    icon = data.get('icon')
    
    if GAME_STATE["phase"] != "lobby":
        return jsonify({"error": "Partida en curso"}), 400
    if not name:
         return jsonify({"error": "Nombre vacío"}), 400
    if name in GAME_STATE["players"]:
        return jsonify({"error": "Nombre ocupado"}), 400
        
    GAME_STATE["players"][name] = {
        "icon": icon, 
        "role": "crew", 
        "is_dead": False, 
        "votes_received": 0
    }
    return jsonify({"success": True})

@app.route('/api/leave', methods=['POST'])
def leave_game():
    data = request.json
    name = data.get('name')
    if name in GAME_STATE["players"]:
        del GAME_STATE["players"][name]
    return jsonify({"success": True})

@app.route('/api/start', methods=['POST'])
def start_game():
    config = request.json # { "impostorCount": 1 }
    impostor_count = int(config.get('impostorCount', 1))
    
    player_names = list(GAME_STATE["players"].keys())
    if len(player_names) < 3:
        return jsonify({"error": "Mínimo 3 jugadores"}), 400
    
    max_impostors = max(1, len(player_names) // 3)
    if impostor_count > max_impostors:
        impostor_count = max_impostors

    theme_key = random.choice(list(WORD_DATA.keys()))
    GAME_STATE["theme"] = theme_key.upper()
    GAME_STATE["secret_word"] = random.choice(WORD_DATA[theme_key])
    
    GAME_STATE["impostors"] = random.sample(player_names, impostor_count)
    
    for name in GAME_STATE["players"]:
        GAME_STATE["players"][name]["role"] = "impostor" if name in GAME_STATE["impostors"] else "crew"
        GAME_STATE["players"][name]["votes_received"] = 0
        GAME_STATE["players"][name]["is_dead"] = False

    GAME_STATE["phase"] = "playing"
    GAME_STATE["winner"] = None
    return jsonify({"success": True})

@app.route('/api/vote/start', methods=['POST'])
def start_voting():
    GAME_STATE["phase"] = "voting"
    GAME_STATE["total_votes"] = 0
    for name in GAME_STATE["players"]:
        GAME_STATE["players"][name]["votes_received"] = 0
    return jsonify({"success": True})

@app.route('/api/vote/cast', methods=['POST'])
def cast_vote():
    data = request.json
    target = data.get('target')
    
    if target in GAME_STATE["players"]:
        GAME_STATE["players"][target]["votes_received"] += 1
        GAME_STATE["total_votes"] += 1
    
    return jsonify({"success": True})

@app.route('/api/vote/resolve', methods=['POST'])
def resolve_voting():
    max_votes = -1
    candidates = []
    
    for name, p in GAME_STATE["players"].items():
        if p["is_dead"]: continue
        if p["votes_received"] > max_votes:
            max_votes = p["votes_received"]
            candidates = [name]
        elif p["votes_received"] == max_votes:
            candidates.append(name)
    
    eliminated = None
    if max_votes > 0 and len(candidates) == 1:
        eliminated = candidates[0]
        GAME_STATE["players"][eliminated]["is_dead"] = True
    
    alive_impostors = [n for n in GAME_STATE["impostors"] if not GAME_STATE["players"][n]["is_dead"]]
    alive_crew = [n for n in GAME_STATE["players"] if n not in GAME_STATE["impostors"] and not GAME_STATE["players"][n]["is_dead"]]
    
    GAME_STATE["winner"] = None
    
    if not alive_impostors:
        GAME_STATE["winner"] = "crew"
        GAME_STATE["phase"] = "result"
    elif len(alive_impostors) >= len(alive_crew):
        GAME_STATE["winner"] = "impostors"
        GAME_STATE["phase"] = "result"
    else:
        GAME_STATE["phase"] = "playing"

    return jsonify({
        "eliminated": eliminated, 
        "winner": GAME_STATE["winner"],
        "impostors": GAME_STATE["impostors"],
        "secret_word": GAME_STATE["secret_word"]
    })

@app.route('/api/reset', methods=['POST'])
def reset_game():
    # --- CAMBIO IMPORTANTE: RESETEAR ESTADO SIN BORRAR JUGADORES ---
    GAME_STATE["phase"] = "lobby"
    GAME_STATE["theme"] = ""
    GAME_STATE["secret_word"] = ""
    GAME_STATE["impostors"] = []
    GAME_STATE["winner"] = None
    GAME_STATE["total_votes"] = 0
    
    # Reiniciar estado individual de cada jugador, pero no borrarlos
    for name in GAME_STATE["players"]:
        p = GAME_STATE["players"][name]
        p["role"] = "crew"
        p["is_dead"] = False
        p["votes_received"] = 0
        # Mantenemos 'icon' y la clave en el diccionario
    
    return jsonify({"success": True})

# --- RUTAS ESTÁTICAS ---
@app.route('/')
def index():
    if os.path.exists('impostor-tv.html'):
        return send_from_directory('.', 'impostor-tv.html')
    return "Servidor Impostor Activo."

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory('.', path)

def open_browser():
    webbrowser.open_new("http://localhost:5002/impostor-tv.html")

if __name__ == '__main__':
    port = 5002
    print(f"🚀 Servidor listo en http://localhost:{port}")
    Timer(1, open_browser).start()
    app.run(host='0.0.0.0', port=port, debug=True)