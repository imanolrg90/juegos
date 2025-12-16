document.addEventListener('DOMContentLoaded', () => {
    
    // --- REFERENCIAS DOM ---
    const setupView = document.getElementById('setupView');
    const gameView = document.getElementById('gameView');
    
    const newPlayerInput = document.getElementById('newPlayerInput');
    const addPlayerBtn = document.getElementById('addPlayerBtn');
    const playersList = document.getElementById('playersList');
    const startGameBtn = document.getElementById('startGameBtn');
    const backToSetupBtn = document.getElementById('backToSetupBtn');
    const iconSelector = document.getElementById('iconSelector');
    const impostorCountInput = document.getElementById('impostorCountInput'); // Nuevo selector
    
    const gameBoard = document.getElementById('gameBoard');
    const currentThemeDisplay = document.getElementById('currentThemeDisplay');
    const startPlayerDisplay = document.getElementById('startPlayerDisplay');
    const livingImpostorsDisplay = document.getElementById('livingImpostorsCount');

    // Botones Votación y Modales
    const openVotingBtn = document.getElementById('openVotingBtn');
    const votingModal = document.getElementById('votingModal');
    const votingButtonsContainer = document.getElementById('votingButtonsContainer');
    const cancelVotingBtn = document.getElementById('cancelVotingBtn');
    const confirmVotingBtn = document.getElementById('confirmVotingBtn');

    // Modal Resultado
    const resultModal = document.getElementById('resultModal');
    const resultTitle = document.getElementById('resultTitle');
    const resultSubtitle = document.getElementById('resultSubtitle');
    const resultIcon = document.getElementById('resultIcon');
    const resultSecretWord = document.getElementById('resultSecretWord');
    const continueGameBtn = document.getElementById('continueGameBtn');
    const newGameResultBtn = document.getElementById('newGameResultBtn');

    // --- ESTADO DEL JUEGO ---
    let players = []; 
    let currentSelectedIcon = "🎩"; 
    
    // Estado de la ronda
    let currentImpostorIndices = []; // AHORA ES UN ARRAY
    let currentSecretWord = "";
    let currentVotes = {}; 

    // --- PERSISTENCIA ---
    function savePlayers() {
        localStorage.setItem('impostorPlayers', JSON.stringify(players));
    }

    function loadPlayers() {
        const saved = localStorage.getItem('impostorPlayers');
        if (saved) {
            try {
                const loaded = JSON.parse(saved);
                if(Array.isArray(loaded)) {
                    players = loaded.map(p => ({
                        name: p.name,
                        icon: p.icon || "👤",
                        flipCount: 0,
                        eliminated: false
                    }));
                    renderPlayerList();
                }
            } catch (e) {
                console.error("Error cargando jugadores", e);
            }
        }
    }

    // --- LISTA DE ICONOS (AMPLIADA) ---
    const availableIcons = [
        "🎩", "🐶", "🚗", "🚢", "🦖", "🦆", "👢", "🐱", 
        "🍔", "⚽", "🎮", "🚀", "👑", "👽", "🦄", "💩", 
        "💀", "🎸", "🌵", "🚲", "🍕", "🍦", "🎈", "🎃", 
        "💣", "💎", "🧸", "🦠", "🦊", "🐼", "🤖", "👻"
    ];
    
    // --- DATOS ---
   // --- DATOS MASIVOS (10 CATEGORÍAS x +100 PALABRAS) ---
    const wordData = {
        profesiones: [
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
        objetos: [
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
        animales: [
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
        cantantes: [
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
        comida: [
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
        lugares: [
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
        deportes: [
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
        cine: [
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
        ropa: [
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
        marcas: [
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
    };

    // --- INICIALIZAR ---
    function initIcons() {
        iconSelector.innerHTML = '';
        availableIcons.forEach(icon => {
            const btn = document.createElement('div');
            btn.className = 'icon-option';
            btn.textContent = icon;
            if (icon === currentSelectedIcon) btn.classList.add('selected');
            btn.addEventListener('click', () => {
                document.querySelectorAll('.icon-option').forEach(el => el.classList.remove('selected'));
                btn.classList.add('selected');
                currentSelectedIcon = icon;
            });
            iconSelector.appendChild(btn);
        });
    }

    // --- GESTIÓN JUGADORES ---
    function addPlayer() {
        const name = newPlayerInput.value.trim();
        if (!name) return;
        if (players.some(p => p.name === name)) {
            alert("¡Nombre repetido!");
            return;
        }
        players.push({ name: name, icon: currentSelectedIcon, flipCount: 0, eliminated: false });
        savePlayers();
        newPlayerInput.value = '';
        renderPlayerList();
        newPlayerInput.focus();
    }

    function removePlayer(nameToRemove) {
        players = players.filter(p => p.name !== nameToRemove);
        savePlayers();
        renderPlayerList();
    }

    function renderPlayerList() {
        playersList.innerHTML = '';
        if (players.length === 0) {
            playersList.innerHTML = '<p style="text-align: center; color: #888; margin-top: 20px;">Añade al menos 3 jugadores</p>';
            return;
        }
        players.forEach(player => {
            const div = document.createElement('div');
            div.className = 'player-list-item';
            div.innerHTML = `
                <div style="display:flex; align-items:center; gap:10px;">
                    <span style="font-size:1.5rem;">${player.icon}</span>
                    <span>${player.name}</span>
                </div>
                <button class="btn-delete">×</button>
            `;
            div.querySelector('.btn-delete').addEventListener('click', () => removePlayer(player.name));
            playersList.appendChild(div);
        });
    }

    // --- LÓGICA DEL JUEGO ---
    function getRandomItem(array) { return array[Math.floor(Math.random() * array.length)]; }

    function startRound() {
        if (players.length < 3) {
            alert("Mínimo 3 jugadores.");
            return;
        }

        const requestedImpostors = parseInt(impostorCountInput.value);
        
        // Validación: No puede haber tantos impostores como jugadores (debe haber al menos 1 tripulante)
        if (requestedImpostors >= players.length) {
            alert(`Para jugar con ${requestedImpostors} impostores necesitas más jugadores.`);
            return;
        }

        // RESET COMPLETO
        players.forEach(p => {
            p.flipCount = 0;
            p.eliminated = false;
        });

        // 1. Elegir Temática y Palabra
        const themes = Object.keys(wordData);
        const randomThemeKey = getRandomItem(themes);
        const themeDisplayName = randomThemeKey.charAt(0).toUpperCase() + randomThemeKey.slice(1);
        
        currentThemeDisplay.textContent = themeDisplayName;
        currentSecretWord = getRandomItem(wordData[randomThemeKey]);

        // 2. Elegir Impostores (Múltiples)
        currentImpostorIndices = [];
        const indicesPool = Array.from({length: players.length}, (_, i) => i);
        
        for (let i = 0; i < requestedImpostors; i++) {
            if(indicesPool.length === 0) break;
            const randPos = Math.floor(Math.random() * indicesPool.length);
            currentImpostorIndices.push(indicesPool[randPos]);
            indicesPool.splice(randPos, 1);
        }

        // 3. Elegir quién empieza
        const starterIndex = Math.floor(Math.random() * players.length);
        const starterPlayer = players[starterIndex];
        startPlayerDisplay.innerHTML = `${starterPlayer.icon} ${starterPlayer.name}`;
        
        // Ocultar número de impostores reales (para suspense, poner "?")
        livingImpostorsDisplay.textContent = "?"; 

        console.log("Impostores (Indices):", currentImpostorIndices); 

        renderCards();
        setupView.style.display = 'none';
        gameView.style.display = 'block';
    }

    function renderCards() {
        gameBoard.innerHTML = '';

        players.forEach((playerObj, index) => {
            const cardContainer = document.createElement('div');
            cardContainer.className = 'flip-card';
            if (playerObj.eliminated) cardContainer.classList.add('eliminated');

            const cardInner = document.createElement('div');
            cardInner.className = 'flip-card-inner';

            // FRENTE
            const cardFront = document.createElement('div');
            cardFront.className = 'flip-card-front';
            const counterId = `counter-${index}`;
            
            const frontIcon = playerObj.eliminated ? "💀" : playerObj.icon;
            const frontStatus = playerObj.eliminated ? "ELIMINADO" : `👀 ${playerObj.flipCount}`;

            cardFront.innerHTML = `
                <div class="role-icon">${frontIcon}</div>
                <div class="player-name">${playerObj.name}</div>
                <div class="flip-count-badge" id="${counterId}">${frontStatus}</div>
            `;

            // DORSO
            const isImpostor = currentImpostorIndices.includes(index);
            
            let backContent = "";
            if (isImpostor) {
                backContent = `<div class="role-icon">🕵️‍♀️</div><div class="impostor-text" style="font-size:0.9rem">¡ERES EL IMPOSTOR!</div>`;
            } else {
                backContent = `<div class="role-icon">🤫</div><div class="secret-word">${currentSecretWord}</div>`;
            }

            if (playerObj.eliminated) {
                const roleText = isImpostor ? "Era Impostor" : "Era Tripulante";
                const roleIcon = isImpostor ? "😈" : "👼";
                backContent = `<div class="role-icon">${roleIcon}</div><div class="secret-word" style="color:#666; font-size:1rem">${roleText}</div>`;
            }

            const cardBack = document.createElement('div');
            cardBack.className = 'flip-card-back';
            cardBack.innerHTML = backContent;

            cardInner.appendChild(cardFront);
            cardInner.appendChild(cardBack);
            cardContainer.appendChild(cardInner);

            cardContainer.addEventListener('click', () => {
                if (cardContainer.classList.contains('flipped')) return;
                if (playerObj.eliminated) return; 

                playerObj.flipCount++;
                const badgeEl = document.getElementById(counterId);
                badgeEl.textContent = `👀 ${playerObj.flipCount}`;
                if (playerObj.flipCount > 1) badgeEl.classList.add('suspicious');

                cardContainer.classList.add('flipped');
                setTimeout(() => { cardContainer.classList.remove('flipped'); }, 3000); 
            });

            gameBoard.appendChild(cardContainer);
        });
    }

    // --- VOTACIÓN ---
    function openVotingModal() {
        votingButtonsContainer.innerHTML = '';
        currentVotes = {}; 

        const livingPlayers = players.filter(p => !p.eliminated);

        livingPlayers.forEach(player => {
            currentVotes[player.name] = 0;
            const row = document.createElement('div');
            row.className = 'vote-item';
            row.innerHTML = `
                <div style="display:flex; align-items:center; gap:10px;">
                    <span style="font-size:1.5rem">${player.icon}</span>
                    <span style="font-weight:bold">${player.name}</span>
                </div>
                <div class="vote-controls">
                    <button class="vote-btn vote-minus" data-name="${player.name}">-</button>
                    <span class="vote-count" id="vote-val-${player.name}">0</span>
                    <button class="vote-btn vote-plus" data-name="${player.name}">+</button>
                </div>
            `;
            votingButtonsContainer.appendChild(row);
        });

        document.querySelectorAll('.vote-plus').forEach(btn => {
            btn.addEventListener('click', (e) => updateVote(e.target.dataset.name, 1));
        });
        document.querySelectorAll('.vote-minus').forEach(btn => {
            btn.addEventListener('click', (e) => updateVote(e.target.dataset.name, -1));
        });

        votingModal.style.display = 'flex';
    }

    function updateVote(playerName, change) {
        if (!currentVotes[playerName] && change < 0) return; 
        currentVotes[playerName] = (currentVotes[playerName] || 0) + change;
        const display = document.getElementById(`vote-val-${playerName}`);
        if(display) display.textContent = currentVotes[playerName];
    }

    function resolveVoting() {
        let maxVotes = -1;
        let votedName = null;
        let isTie = false;

        for (const [name, count] of Object.entries(currentVotes)) {
            if (count > maxVotes) {
                maxVotes = count;
                votedName = name;
                isTie = false;
            } else if (count === maxVotes) {
                isTie = true;
            }
        }

        if (maxVotes === 0) {
            alert("¡Nadie ha votado!");
            return;
        }
        if (isTie) {
            alert("¡Empate! Deshaced el empate.");
            return;
        }
        handleExpulsion(votedName);
    }

    function handleExpulsion(votedName) {
        votingModal.style.display = 'none';
        
        const playerIndex = players.findIndex(p => p.name === votedName);
        if (playerIndex === -1) return;

        // EXPULSAR
        players[playerIndex].eliminated = true;
        renderCards();

        // COMPROBAR CONDICIONES DE VICTORIA MULTI-IMPOSTOR
        const livingPlayers = players.filter(p => !p.eliminated);
        const livingCount = livingPlayers.length;
        
        // Contar impostores vivos
        let livingImpostors = 0;
        players.forEach((p, idx) => {
            if(!p.eliminated && currentImpostorIndices.includes(idx)) {
                livingImpostors++;
            }
        });

        const wasImpostor = currentImpostorIndices.includes(playerIndex);

        // CASO 1: TODOS LOS IMPOSTORES CAZADOS -> GANA TRIPULACIÓN
        if (livingImpostors === 0) {
            showResult(true, "victory", votedName);
            return;
        }

        // CASO 2: QUEDAN 2 PERSONAS Y AL MENOS 1 IMPOSTOR VIVO -> GANA IMPOSTOR
        if (livingCount <= 2 && livingImpostors > 0) {
            showResult(true, "impostorWin", votedName);
            return;
        }

        // CASO 3: JUEGO CONTINÚA
        if (wasImpostor) {
            // Cazaron a uno, pero quedan más
            showResult(false, "one_caught_continue", votedName);
        } else {
            // Era inocente
            showResult(false, "innocent_continue", votedName);
        }
    }

    function showResult(isGameOver, type, playerName) {
        resultModal.style.display = 'flex';
        
        continueGameBtn.style.display = 'none';
        newGameResultBtn.style.display = 'none';
        resultSecretWord.style.display = 'none';

        if (type === "victory") {
            // Ganan Tripulantes
            resultIcon.textContent = "🏆";
            resultTitle.textContent = "¡IMPOSTORES ELIMINADOS!";
            resultTitle.style.color = "#4556ac";
            resultSubtitle.innerHTML = `¡Bien hecho! La nave está segura.`;
            resultSecretWord.style.display = 'block';
            resultSecretWord.innerHTML = `La palabra era: <span style="color:#4556ac; font-size:1.5rem">${currentSecretWord}</span>`;
            newGameResultBtn.style.display = 'block';

        } else if (type === "impostorWin") {
            // Gana Impostor (quedan 2)
            resultIcon.textContent = "😈";
            resultTitle.textContent = "¡GANAN LOS IMPOSTORES!";
            resultTitle.style.color = "#ff4b2b";
            resultSubtitle.innerHTML = `Solo quedan 2 supervivientes... Los impostores toman el control.`;
            
            // Mostrar nombres de los impostores
            const impNames = currentImpostorIndices.map(i => players[i].name).join(", ");
            resultSecretWord.style.display = 'block';
            resultSecretWord.innerHTML = `La palabra era: <b>${currentSecretWord}</b><br>Impostores: <b>${impNames}</b>`;
            newGameResultBtn.style.display = 'block';

        } else if (type === "one_caught_continue") {
            // Se cazó a uno, pero quedan más
            resultIcon.textContent = "🎯";
            resultTitle.textContent = "¡IMPOSTOR CAZADO!";
            resultTitle.style.color = "#4556ac";
            resultSubtitle.innerHTML = `<b>${playerName}</b> era un impostor.<br>¡Pero cuidado, aún quedan enemigos!`;
            continueGameBtn.style.display = 'block';
            continueGameBtn.onclick = () => resultModal.style.display = 'none';

        } else if (type === "innocent_continue") {
            // Se expulsó a un inocente
            resultIcon.textContent = "💀";
            resultTitle.textContent = "¡FALLO!";
            resultTitle.style.color = "#666";
            resultSubtitle.innerHTML = `<b>${playerName}</b> era... <span style="color:#4556ac; font-weight:bold">¡TRIPULANTE!</span><br>Los impostores siguen aquí...`;
            continueGameBtn.style.display = 'block';
            continueGameBtn.onclick = () => resultModal.style.display = 'none';
        }
    }

    function goToNewGame() {
        resultModal.style.display = 'none';
        gameView.style.display = 'none';
        setupView.style.display = 'block';
    }

    // --- EVENT LISTENERS ---
    initIcons(); 
    loadPlayers(); 

    addPlayerBtn.addEventListener('click', addPlayer);
    newPlayerInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') addPlayer(); });
    startGameBtn.addEventListener('click', startRound);
    
    backToSetupBtn.addEventListener('click', () => {
        gameView.style.display = 'none';
        setupView.style.display = 'block';
    });

    openVotingBtn.addEventListener('click', openVotingModal);
    cancelVotingBtn.addEventListener('click', () => votingModal.style.display = 'none');
    confirmVotingBtn.addEventListener('click', resolveVoting);
    
    if(newGameResultBtn) newGameResultBtn.addEventListener('click', goToNewGame);
});