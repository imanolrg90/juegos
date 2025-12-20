from flask import Flask, send_from_directory, request, jsonify
import os
import random

app = Flask(__name__, static_folder='.', static_url_path='')

# --- DATOS COMPLETOS (EXTRAÍDOS DE GAME-IMPOSTOR.JS) ---
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

# --- ESTADO GLOBAL (EN MEMORIA) ---
game_state = {
    "phase": "lobby",  # lobby, playing, voting, result
    "players": [],     # Lista de dicts: {name, icon, role, is_dead, votes, ip}
    "theme": "",
    "secret_word": "",
    "impostors": [],   # Lista de nombres de impostores
    "winner": None,    # crew o impostor
    "starting_player": "" # Jugador que empieza a hablar
}

def get_player(name):
    return next((p for p in game_state["players"] if p["name"] == name), None)

# --- RUTAS API (CONTROL Y TV) ---

@app.route('/api/join', methods=['POST'])
def join_game():
    data = request.json
    name = data.get('name', '').strip().upper()
    icon = data.get('icon')

    if game_state['phase'] != 'lobby':
        return jsonify({"error": "Partida ya iniciada"}), 400
    if get_player(name):
        return jsonify({"error": "Nombre ya en uso"}), 400
    
    # Crear jugador
    new_player = {
        "name": name,
        "icon": icon,
        "role": "crew",   # Se define al iniciar
        "is_dead": False,
        "votes": 0,
        "vote_target": None
    }
    game_state['players'].append(new_player)
    return jsonify({"success": True})

@app.route('/api/tv/state', methods=['GET'])
def get_tv_state():
    public_players = []
    for p in game_state['players']:
        public_players.append({
            "name": p["name"],
            "icon": p["icon"],
            "is_dead": p["is_dead"],
            "votes": p["votes"] if game_state['phase'] == 'voting' else 0
        })

    return jsonify({
        "phase": game_state['phase'],
        "theme": game_state['theme'],
        "players": public_players,
        "winner": game_state['winner'],
        "starting_player": game_state.get('starting_player', ''),
        "secret_word": game_state['secret_word'] if game_state['phase'] == 'result' else None
    })

@app.route('/api/player/status', methods=['GET'])
def get_player_status():
    name = request.args.get('name', '').upper()
    player = get_player(name)
    
    if not player:
        return jsonify({"error": "Jugador no encontrado"}), 404

    # Información privada para el móvil
    return jsonify({
        "phase": game_state['phase'],
        "role": player['role'],
        "is_dead": player['is_dead'],
        "secret_word": game_state['secret_word'],
        "impostor_partners": game_state['impostors'] if player['role'] == 'impostor' else []
    })

@app.route('/api/start', methods=['POST'])
def start_game():
    data = request.json
    impostor_count = int(data.get('impostorCount', 1))
    
    # Validar mínimo de jugadores
    if len(game_state['players']) < 3:
        return jsonify({"error": "⚠️ Se necesitan mínimo 3 jugadores para empezar."}), 400

    # 1. Elegir tema y palabra
    theme_key = random.choice(list(WORD_DATA.keys()))
    word = random.choice(WORD_DATA[theme_key])
    
    game_state['theme'] = theme_key.upper()
    game_state['secret_word'] = word.upper()
    game_state['phase'] = 'playing'
    game_state['winner'] = None
    game_state['impostors'] = []

    # 2. Resetear jugadores y asignar roles
    players = game_state['players']
    random.shuffle(players) # <--- Mezclamos el orden de los jugadores
    
    # Limpiar estado anterior
    for p in players:
        p['is_dead'] = False
        p['votes'] = 0
        p['role'] = 'crew'
        p['vote_target'] = None

    # Asignar impostores (Usamos los primeros N de la lista mezclada)
    actual_impostors_count = min(impostor_count, len(players) - 1)
    for i in range(actual_impostors_count):
        players[i]['role'] = 'impostor'
        game_state['impostors'].append(players[i]['name'])
    
    # --- CORRECCIÓN AQUÍ ---
    # Antes elegías players[0], que coincidía con el impostor asignado arriba.
    # Ahora elegimos uno al azar de toda la lista, desacoplando el rol del turno.
    if players:
        game_state['starting_player'] = random.choice(players)['name']
    # -----------------------

    return jsonify({"success": True})

@app.route('/api/vote/start', methods=['POST'])
def start_voting():
    game_state['phase'] = 'voting'
    for p in game_state['players']:
        p['votes'] = 0
        p['vote_target'] = None
    return jsonify({"success": True})

@app.route('/api/vote/cast', methods=['POST'])
def cast_vote():
    target_name = request.json.get('target')
    
    target = get_player(target_name)
    if target and not target['is_dead']:
        target['votes'] += 1
        return jsonify({"success": True})
    return jsonify({"error": "Voto inválido"}), 400

@app.route('/api/vote/resolve', methods=['POST'])
def resolve_votes():
    players = game_state['players']
    living_players = [p for p in players if not p['is_dead']]
    
    if not living_players: return jsonify({"error": "Nadie vivo"})

    sorted_players = sorted(living_players, key=lambda x: x['votes'], reverse=True)
    most_voted = sorted_players[0]
    
    if len(sorted_players) > 1 and sorted_players[1]['votes'] == most_voted['votes']:
        eliminated = None
    else:
        if most_voted['votes'] > 0:
            most_voted['is_dead'] = True
            eliminated = most_voted['name']
        else:
            eliminated = None

    winner = check_win_condition()
    if winner:
        game_state['phase'] = 'result'
        game_state['winner'] = winner
    else:
        game_state['phase'] = 'playing'

    return jsonify({
        "eliminated": eliminated,
        "winner": winner
    })

def check_win_condition():
    crew_alive = 0
    impostors_alive = 0
    
    for p in game_state['players']:
        if not p['is_dead']:
            if p['role'] == 'impostor':
                impostors_alive += 1
            else:
                crew_alive += 1
    
    if impostors_alive == 0:
        return "crew"
    if impostors_alive >= crew_alive:
        return "impostor"
    
    return None

@app.route('/api/reset', methods=['POST'])
def reset_game():
    game_state['phase'] = 'lobby'
    game_state['winner'] = None
    game_state['impostors'] = []
    game_state['theme'] = ""
    game_state['secret_word'] = ""
    game_state['starting_player'] = ""

    for p in game_state['players']:
        p['is_dead'] = False
        p['votes'] = 0
        p['role'] = 'crew'
        p['vote_target'] = None

    return jsonify({"success": True})

@app.route('/api/kick', methods=['POST'])
def kick_player():
    if game_state['phase'] != 'lobby':
        return jsonify({"error": "No se puede expulsar con la partida empezada"}), 403

    data = request.json
    name_to_kick = data.get('name', '').strip().upper()
    
    original_count = len(game_state['players'])
    
    game_state['players'] = [p for p in game_state['players'] if p['name'] != name_to_kick]
    
    if name_to_kick in game_state['impostors']:
        game_state['impostors'].remove(name_to_kick)
    
    if len(game_state['players']) < original_count:
        print(f"[-] Jugador expulsado: {name_to_kick}")
        return jsonify({"success": True})
    else:
        return jsonify({"error": "Jugador no encontrado"}), 404

@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory('.', path)

if __name__ == '__main__':
    port = 5002
    print(f"[*] SERVIDOR IMPOSTOR INICIADO")
    print(f"[*] TV: http://localhost:{port}/impostor/impostor-tv.html")
    print(f"[*] Mando: http://localhost:{port}/impostor/impostor-control.html")
    app.run(host='0.0.0.0', port=port, debug=True)