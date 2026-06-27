# VetCare

VetCare to system do zarządzania profilami zwierząt domowych, składający się z trzech współpracujących części:

* backendu REST API,
* aplikacji internetowej PWA,
* aplikacji mobilnej stworzonej w Expo React Native.

Użytkownik może założyć konto, zalogować się oraz zarządzać profilami swoich zwierząt. Dane są synchronizowane między aplikacją mobilną i PWA za pośrednictwem wspólnego backendu.

## Wersja online

### PWA

https://vetcare-pwa.onrender.com

### Backend API

https://vetcare-api-74lk.onrender.com

### Dokumentacja Swagger

https://vetcare-api-74lk.onrender.com/docs

### Repozytorium

https://github.com/Domin-owski/VetCare

# Główne funkcjonalności

## Konto użytkownika
* rejestracja konta,
* logowanie,
* uwierzytelnianie za pomocą tokenu JWT,
* dostęp do danych wyłącznie zalogowanego użytkownika,
* wspólne konto dla PWA i aplikacji mobilnej.

## Zarządzanie zwierzętami
* dodawanie profilu zwierzęcia,
* wyświetlanie listy zwierząt,
* wyświetlanie danych pojedynczego zwierzęcia,
* edycja danych w PWA,
* usuwanie profilu,
* wybór gatunku z listy,
* wybór daty urodzenia z kalendarza,
* zapis rasy oraz imienia zwierzęcia.

## Aplikacja mobilna
* minimum trzy ekrany:
  * lista zwierząt,
  * dodawanie zwierzęcia,
  * informacje o aplikacji,
* wykonanie zdjęcia aparatem,
* wybór zdjęcia z biblioteki telefonu,
* lokalne przechowywanie zdjęć,
* lokalne przechowywanie danych przez AsyncStorage,
* wykrywanie dostępności połączenia,
* dodawanie zwierząt bez dostępu do serwera,
* kolejka danych oczekujących na synchronizację,
* automatyczna synchronizacja po odzyskaniu połączenia,
* ręczne uruchomienie synchronizacji,
* wyświetlanie danych zapisanych wcześniej w pamięci telefonu.

## PWA
* responsywny interfejs,
* możliwość instalacji jako aplikacja,
* manifest aplikacji,
* service worker,
* działanie podstawowego interfejsu bez internetu,
* lokalny cache listy zwierząt,
* formularz rejestracji i logowania,
* widoki:

  * lista zwierząt,
  * formularz dodawania i edycji,
  * informacje o aplikacji.

# Architektura
```text
                         ┌─────────────────────┐
                         │   PostgreSQL        │
                         │   Render Database   │
                         └──────────▲──────────┘
                                    │
                                    │ SQLAlchemy
                                    │
┌────────────────────┐      ┌────────┴─────────┐     ┌────────────────────┐
│ PWA React + Vite   │────▶ │ FastAPI REST API │◀────│ Expo React Native  │
│ Render Static Site │ JWT  │Render Web Service│ JWT │ Expo Go / mobile   │
└────────────────────┘      └──────────────────┘     └────────────────────┘
```

Backend jest wspólnym źródłem danych dla PWA i aplikacji mobilnej. Obie aplikacje korzystają z tych samych endpointów oraz tego samego konta użytkownika.

# Technologie

## Backend
* Python 3.11,
* FastAPI,
* Uvicorn,
* SQLAlchemy,
* PostgreSQL,
* Psycopg2,
* JWT,
* Passlib,
* Pydantic,
* Pytest,
* HTTPX.

## PWA
* React,
* Vite,
* React Router,
* vite-plugin-pwa,
* JavaScript,
* CSS,
* LocalStorage,
* Service Worker.

## Aplikacja mobilna
* React Native,
* Expo SDK 54,
* Expo Router,
* TypeScript,
* AsyncStorage,
* Expo Image Picker,
* React Native DateTimePicker,
* React Native Picker,
* NetInfo.

## Wdrożenie
* GitHub,
* Render Web Service,
* Render Static Site,
* Render PostgreSQL,
* Expo Go.

# Struktura repozytorium
```text
VetCare/
├── backend/
│   ├── auth.py
│   ├── database.py
│   ├── main.py
│   ├── models.py
│   ├── schemas.py
│   ├── requirements.txt
│   └── test/
│       └── test_api.py
│
├── pwa/
│   ├── public/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── index.css
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
├── mobile/
│   ├── app/
│   │   ├── (tabs)/
│   │   │   ├── pets.tsx
│   │   │   ├── add.tsx
│   │   │   ├── about.tsx
│   │   │   └── _layout.tsx
│   │   ├── index.tsx
│   │   └── _layout.tsx
│   ├── lib/
│   │   ├── api.ts
│   │   └── offlineQueue.ts
│   └── package.json
│
├── docs/
├── .gitignore
└── README.md
```

# REST API

## System
 Metoda  Endpoint   Opis                          

 GET     `/`        Podstawowa informacja o API   
 GET     `/health`  Sprawdzenie działania serwera 

## Uwierzytelnianie
 Metoda  Endpoint          Opis                              

 POST    `/auth/register`  Rejestracja użytkownika           
 POST    `/auth/login`     Logowanie i otrzymanie tokenu JWT 
 GET     `/users/me`       Dane zalogowanego użytkownika     

## Zwierzęta
 Metoda  Endpoint          Opis                           

 GET     `/pets`           Lista zwierząt użytkownika     
 POST    `/pets`           Dodanie zwierzęcia             
 GET     `/pets/{pet_id}`  Pobranie jednego zwierzęcia    
 PUT     `/pets/{pet_id}`  Aktualizacja danych zwierzęcia 
 DELETE  `/pets/{pet_id}`  Usunięcie zwierzęcia           

Endpointy dotyczące użytkownika i zwierząt wymagają przekazania tokenu:
```http
Authorization: Bearer TOKEN_JWT
```

# Przykładowa rejestracja
```json
{
  "email": "user@example.com",
  "password": "test123"
}
```

# Przykładowe logowanie
```json
{
  "email": "user@example.com",
  "password": "test123"
}
```

# Przykładowe zwierzę
```json
{
  "name": "Luna",
  "species": "Kot",
  "breed": "Europejski",
  "birth_date": "2022-05-15"
}
```

---

# Uruchomienie lokalne

## Wymagania
* Python 3.11 lub nowszy,
* Node.js,
* npm,
* Git,
* Expo Go na telefonie.

## Backend
Przejdź do folderu backendu:
```powershell
cd backend
```

Utwórz środowisko wirtualne:
```powershell
python -m venv .venv
```

Aktywuj środowisko:
```powershell
.\.venv\Scripts\Activate.ps1
```

Zainstaluj zależności:
```powershell
pip install -r requirements.txt
```

Uruchom API:
```powershell
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Dokumentacja Swagger będzie dostępna pod adresem:
```text
http://127.0.0.1:8000/docs
```

Jeżeli zmienna `DATABASE_URL` nie została ustawiona, backend użyje lokalnej bazy SQLite.

## PWA

Przejdź do folderu PWA:
```powershell
cd pwa
```

Zainstaluj zależności:
```powershell
npm install
```

Utwórz plik `.env`:
```env
VITE_API_URL=http://127.0.0.1:8000
```

Uruchom aplikację:
```powershell
npm run dev
```

PWA będzie dostępna pod adresem:
```text
http://localhost:5173
```

## Aplikacja mobilna

Przejdź do folderu:
```powershell
cd mobile
```

Zainstaluj zależności:
```powershell
npm install
```

Uruchom Expo:
```powershell
npx expo start --clear
```

Następnie zeskanuj kod QR w aplikacji Expo Go.

Adres API znajduje się w pliku:
```text
mobile/lib/api.ts
```

Dla wersji wdrożonej używany jest adres:
```text
https://vetcare-api-74lk.onrender.com
```

# Tryb offline i synchronizacja
Aplikacja mobilna została zaprojektowana zgodnie z podejściem offline-first.
W przypadku braku dostępu do API:
1. dane zwierzęcia są zapisywane w AsyncStorage,
2. lokalny rekord otrzymuje tymczasowy identyfikator,
3. rekord pojawia się na liście jako oczekujący na synchronizację,
4. aplikacja przechowuje rekord nawet po ponownym uruchomieniu,
5. po odzyskaniu dostępu do serwera aplikacja wysyła rekord do API,
6. po poprawnej synchronizacji lokalny rekord zostaje usunięty z kolejki,
7. zwierzę pojawia się jako zwykły rekord serwerowy.

NetInfo monitoruje stan połączenia sieciowego. Użytkownik może również ręcznie uruchomić synchronizację.

PWA korzysta z service workera i lokalnego cache, dzięki czemu jej interfejs może zostać otwarty bez aktywnego połączenia z internetem.

# Zdjęcia zwierząt
Aplikacja mobilna pozwala:
* wykonać zdjęcie aparatem,
* wybrać zdjęcie z biblioteki telefonu,
* zobaczyć podgląd zdjęcia,
* usunąć wybrane zdjęcie przed zapisaniem.

Zdjęcia są przechowywane lokalnie w pamięci urządzenia. Do backendu przesyłane są dane tekstowe profilu zwierzęcia.

Oznacza to, że profile zwierząt są synchronizowane między urządzeniami, natomiast zdjęcie pozostaje na urządzeniu, na którym zostało wybrane.

# Bezpieczeństwo
W projekcie zastosowano:
* uwierzytelnianie JWT,
* hasła przechowywane w postaci skrótu,
* zabezpieczenie endpointów przez token Bearer,
* sprawdzanie właściciela rekordu,
* oddzielenie danych poszczególnych użytkowników,
* walidację danych wejściowych przez Pydantic,
* zmienne środowiskowe dla adresu bazy danych,
* brak danych dostępowych w repozytorium,
* połączenia HTTPS z wdrożonym API,
* bazę PostgreSQL działającą w prywatnej sieci Render.

Użytkownik może pobierać, zmieniać i usuwać wyłącznie własne zwierzęta.

# Testy
Testy automatyczne backendu znajdują się w:
```text
backend/test/test_api.py
```

Uruchomienie:
```powershell
cd backend
.\.venv\Scripts\Activate.ps1
pytest -v
```

Wynik ostatniego uruchomienia:
```text
7 passed
```

Testy obejmują:
* endpoint zdrowia serwera,
* rejestrację użytkownika,
* odrzucenie ponownej rejestracji tego samego adresu,
* logowanie,
* odrzucenie dostępu bez tokenu,
* pobieranie danych aktualnego użytkownika,
* pełny CRUD zwierzęcia:
  * utworzenie,
  * pobranie listy,
  * pobranie pojedynczego rekordu,
  * aktualizację,
  * usunięcie.

Testy korzystają z oddzielnej bazy SQLite i nie modyfikują produkcyjnej bazy PostgreSQL.

# Testy manualne
Wykonano również testy manualne:

 Test                                       Wynik    

 Rejestracja w PWA                          Poprawny 
 Logowanie w PWA                            Poprawny 
 Rejestracja w aplikacji mobilnej           Poprawny 
 Logowanie w aplikacji mobilnej             Poprawny 
 Dodanie zwierzęcia w PWA                   Poprawny 
 Dodanie zwierzęcia w aplikacji mobilnej    Poprawny 
 Usunięcie zwierzęcia w PWA                 Poprawny 
 Usunięcie zwierzęcia w aplikacji mobilnej  Poprawny 
 Synchronizacja PWA → mobile                Poprawny 
 Synchronizacja mobile → PWA                Poprawny 
 Zapis mobilny bez API                      Poprawny 
 Synchronizacja po odzyskaniu API           Poprawny 
 Wybór zdjęcia z biblioteki                 Poprawny 
 Wykonanie zdjęcia aparatem                 Poprawny 
 Wybór daty z kalendarza                    Poprawny 
 Instalacja PWA                             Poprawny 
 Uruchomienie PWA offline                   Poprawny 

# Budowanie wersji produkcyjnej PWA
```powershell
cd pwa
npm run build
```

Gotowe pliki zostaną zapisane w:
```text
pwa/dist
```

Na Renderze używane są ustawienia:
```text
Root Directory: pwa
Build Command: npm ci && npm run build
Publish Directory: dist
```

Zmienna środowiskowa:
```text
VITE_API_URL=https://vetcare-api-74lk.onrender.com
```

# Wdrożenie backendu
Backend został wdrożony jako Render Web Service.
Ustawienia:
```text
Root Directory: backend
Build Command: pip install -r requirements.txt
Start Command: uvicorn main:app --host 0.0.0.0 --port $PORT
```

Backend korzysta ze zmiennej środowiskowej:
```text
DATABASE_URL
```

Wartością jest prywatny Internal Database URL bazy PostgreSQL na Renderze.

# Ograniczenia
* zdjęcia zwierząt są zapisane lokalnie i nie są przesyłane do serwera,
* bez uruchomionego Expo aplikacja mobilna w wersji deweloperskiej jest otwierana przez Expo Go,
* darmowa usługa Render może potrzebować chwili na uruchomienie po okresie bezczynności,
* edycja profilu zwierzęcia jest obecnie dostępna w PWA.

# Możliwe kierunki rozwoju
* przesyłanie zdjęć do chmury,
* historia wizyt weterynaryjnych,
* przypomnienia o szczepieniach,
* harmonogram leków,
* powiadomienia push,
* dane lekarza weterynarii,
* dokumentacja medyczna,
* obsługa wielu opiekunów jednego zwierzęcia,
* wersja mobilna publikowana jako samodzielna aplikacja,
* resetowanie hasła,
* potwierdzanie adresu e-mail.

# Autor
**Dominik Janowski** **Jakub Adamczyk**
Projekt wykonany w ramach studiów informatycznych.
Specjalizacja:
**Architekt rozwiązań IT w chmurze obliczeniowej**
