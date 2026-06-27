# Raport z testów projektu VetCare

## 1. Informacje o projekcie

**Nazwa projektu:** VetCare
**Autor:** Dominik Janowski , Jakub Adamczyk
**Data wykonania testów:** 27 czerwca 2026 r.

VetCare jest aplikacją służącą do zarządzania profilami zwierząt. Projekt składa się z trzech głównych części:

* backendu REST API,
* aplikacji internetowej PWA,
* aplikacji mobilnej wykonanej w React Native i Expo.

Obie aplikacje korzystają z tego samego backendu i tej samej bazy danych. Dzięki temu po zalogowaniu na to samo konto dane zwierząt są dostępne zarówno na stronie internetowej, jak i w aplikacji mobilnej.

Adresy wdrożonych usług:

* PWA: https://vetcare-pwa.onrender.com
* Backend API: https://vetcare-api-74lk.onrender.com
* Dokumentacja Swagger: https://vetcare-api-74lk.onrender.com/docs
* Repozytorium: https://github.com/Domin-owski/VetCare

## 2. Cel testów

Celem testów było sprawdzenie, czy wszystkie najważniejsze elementy projektu działają poprawnie.

Sprawdzałem przede wszystkim:

* rejestrację i logowanie użytkowników,
* działanie tokenu JWT,
* dodawanie, wyświetlanie, edytowanie i usuwanie zwierząt,
* synchronizację danych między PWA i aplikacją mobilną,
* zapis danych bez dostępu do serwera,
* późniejszą synchronizację danych,
* obsługę aparatu i biblioteki zdjęć,
* działanie kalendarza podczas wyboru daty urodzenia,
* instalację PWA,
* działanie podstawowego interfejsu PWA bez internetu,
* działanie produkcyjnej bazy PostgreSQL.

## 3. Środowisko testowe

Testy były wykonywane na komputerze z systemem Windows 11.

Używane narzędzia:

* Visual Studio Code,
* Python 3.11,
* Node.js 24,
* npm 11,
* Microsoft Edge,
* DuckDuckGo Browser,
* Git i GitHub,
* Render,
* Expo Go.

Aplikacja mobilna była testowana na telefonie iPhone z systemem iOS. Sprawdzałem na nim między innymi aparat, bibliotekę zdjęć, kalendarz oraz zapis lokalny.

Backend i PWA zostały wdrożone na platformie Render. Produkcyjna baza danych działa w PostgreSQL.

## 4. Testy automatyczne backendu

Testy automatyczne zostały napisane przy użyciu biblioteki Pytest oraz FastAPI TestClient.

Plik z testami znajduje się w:

```text
backend/test/test_api.py
```

Testy można uruchomić poleceniem:

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
pytest .\test\test_api.py -v
```

Podczas ostatniego uruchomienia uzyskano wynik:

```text
7 passed, 1 warning
```

Wszystkie testy zostały zakończone poprawnie. Wyświetlone ostrzeżenie dotyczyło biblioteki TestClient i nie miało wpływu na działanie testów.

## 5. Zakres testów automatycznych

### Sprawdzenie działania serwera

Wykonano zapytanie do endpointu:

```text
GET /health
```

Serwer odpowiedział kodem HTTP 200, co potwierdziło, że backend działa poprawnie.

### Rejestracja użytkownika

Sprawdzono możliwość utworzenia nowego konta przez:

```text
POST /auth/register
```

Konto zostało utworzone poprawnie. W odpowiedzi serwera nie znajdowało się hasło ani jego skrót.

### Próba ponownej rejestracji

Sprawdzono, czy można utworzyć drugie konto z tym samym adresem e-mail.

Backend poprawnie odrzucił taką próbę.

### Logowanie użytkownika

Sprawdzono endpoint:

```text
POST /auth/login
```

Po podaniu poprawnych danych serwer zwrócił token JWT typu Bearer.

### Dostęp bez tokenu

Wykonano próbę pobrania danych użytkownika bez przesłania tokenu JWT.

Backend poprawnie zablokował dostęp.

### Pobranie danych użytkownika

Po zalogowaniu i przesłaniu poprawnego tokenu endpoint:

```text
GET /users/me
```

zwrócił dane aktualnie zalogowanego użytkownika.

### Operacje CRUD na zwierzętach

W jednym teście sprawdzono pełną obsługę profilu zwierzęcia:

* utworzenie zwierzęcia,
* pobranie listy zwierząt,
* pobranie jednego zwierzęcia,
* zmianę danych,
* usunięcie zwierzęcia,
* próbę pobrania usuniętego rekordu.

Wszystkie operacje zostały wykonane poprawnie. Po usunięciu rekordu serwer zwrócił kod 404 przy ponownej próbie jego pobrania.

## 6. Testy PWA

W aplikacji PWA sprawdzono następujące funkcje:

| Testowana funkcja                     | Wynik    |
| ------------------------------------- | -------- |
| Otwarcie strony online                | Poprawny |
| Rejestracja użytkownika               | Poprawny |
| Logowanie użytkownika                 | Poprawny |
| Dodanie zwierzęcia                    | Poprawny |
| Edycja zwierzęcia                     | Poprawny |
| Usunięcie zwierzęcia                  | Poprawny |
| Odświeżenie strony                    | Poprawny |
| Instalacja jako PWA                   | Poprawny |
| Uruchomienie interfejsu bez internetu | Poprawny |
| Dopasowanie strony do rozmiaru okna   | Poprawny |

PWA została zainstalowana w przeglądarce Microsoft Edge jako osobna aplikacja.

Tryb offline został sprawdzony przy użyciu narzędzi deweloperskich przeglądarki. Po przełączeniu sieci w tryb Offline aplikacja nadal się uruchamiała i wyświetlała wcześniej zapisany interfejs.

## 7. Testy aplikacji mobilnej

W aplikacji mobilnej sprawdzono:

| Testowana funkcja                       | Wynik    |
| --------------------------------------- | -------- |
| Uruchomienie przez Expo Go              | Poprawny |
| Rejestracja użytkownika                 | Poprawny |
| Logowanie użytkownika                   | Poprawny |
| Wylogowanie użytkownika                 | Poprawny |
| Wyświetlenie listy zwierząt             | Poprawny |
| Dodanie zwierzęcia                      | Poprawny |
| Usunięcie zwierzęcia                    | Poprawny |
| Wybór gatunku z listy                   | Poprawny |
| Wybór daty z kalendarza                 | Poprawny |
| Wykonanie zdjęcia aparatem              | Poprawny |
| Wybór zdjęcia z biblioteki              | Poprawny |
| Wyświetlenie zdjęcia                    | Poprawny |
| Wykrycie braku połączenia               | Poprawny |
| Zapis zwierzęcia lokalnie               | Poprawny |
| Synchronizacja po odzyskaniu połączenia | Poprawny |

Podczas dodawania zwierzęcia można wybrać gatunek, datę urodzenia, rasę oraz zdjęcie.

Zdjęcie można wykonać aparatem lub wybrać z biblioteki telefonu.

Zdjęcia są przechowywane lokalnie na urządzeniu. Pozostałe dane profilu są zapisywane w bazie i synchronizowane z PWA.

## 8. Test synchronizacji danych

Synchronizacja została sprawdzona w obu kierunkach.

Najpierw dodano zwierzę w PWA. Po odświeżeniu listy w aplikacji mobilnej zwierzę pojawiło się na telefonie.

Następnie dodano inne zwierzę w aplikacji mobilnej. Po odświeżeniu strony internetowej rekord pojawił się w PWA.

Sprawdzono również usuwanie. Po usunięciu zwierzęcia w jednej aplikacji i odświeżeniu drugiej rekord nie był już widoczny.

Oznacza to, że PWA i aplikacja mobilna prawidłowo korzystają ze wspólnego konta, API oraz bazy danych.

## 9. Test działania offline w aplikacji mobilnej

Sprawdzono również sytuację, w której backend był niedostępny.

Przebieg testu:

1. zatrzymano dostęp do backendu,
2. w aplikacji mobilnej dodano nowe zwierzę,
3. aplikacja poinformowała, że dane zostały zapisane lokalnie,
4. zwierzę pojawiło się na liście jako oczekujące na synchronizację,
5. ponownie uruchomiono backend,
6. wykonano synchronizację,
7. zwierzę zostało przesłane do API,
8. rekord pojawił się również w PWA.

Dane oczekujące na wysłanie są przechowywane w AsyncStorage. Dzięki temu nie znikają po ponownym otwarciu aplikacji.

## 10. Testy bezpieczeństwa

W projekcie sprawdzono podstawowe zabezpieczenia:

* endpointy użytkownika i zwierząt wymagają tokenu JWT,
* dostęp bez tokenu jest blokowany,
* hasło nie jest zwracane przez API,
* nie można zarejestrować dwóch kont z tym samym adresem e-mail,
* użytkownik widzi wyłącznie swoje zwierzęta,
* adres bazy danych znajduje się w zmiennej środowiskowej,
* połączenie z wdrożonym API odbywa się przez HTTPS,
* dane produkcyjne są przechowywane w PostgreSQL.

## 11. Problemy napotkane podczas testów

Podczas pracy nad projektem pojawiło się kilka problemów.

### Niepoprawny adres API

W aplikacji mobilnej pojawiał się komunikat `Not Found`.

Problem wynikał z dodatkowego ukośnika na końcu adresu API. Po jego usunięciu rejestracja i logowanie zaczęły działać prawidłowo.

Poprawny adres:

```text
https://vetcare-api-74lk.onrender.com
```

### Brak trwałości danych w SQLite

Na początku backend korzystał z bazy SQLite. Na Renderze istniało ryzyko utraty danych po restarcie lub ponownym wdrożeniu.

Z tego powodu została utworzona baza PostgreSQL. Backend pobiera adres bazy ze zmiennej środowiskowej `DATABASE_URL`.

### Brak importu podczas testów

Przy pierwszej próbie uruchomienia testów pojawił się błąd:

```text
ModuleNotFoundError: No module named 'database'
```

Problem rozwiązano przez dodanie folderu backendu do ścieżki importów Pythona w pliku testowym.

### Brak informacji o trybie offline

Na początku komunikat o braku połączenia pojawiał się dopiero po ręcznym odświeżeniu.

Po dodaniu biblioteki NetInfo aplikacja zaczęła automatycznie wykrywać zmianę połączenia.

### Ręczne wpisywanie gatunku i daty

Początkowo gatunek i data urodzenia były zwykłymi polami tekstowymi.

Zostały zastąpione przez:

* listę Picker dla gatunku,
* DateTimePicker dla daty urodzenia.

## 12. Ograniczenia obecnej wersji

Obecna wersja aplikacji ma kilka ograniczeń:

* zdjęcia zwierząt nie są przesyłane na serwer,
* zdjęcia nie są synchronizowane między urządzeniami,
* aplikacja mobilna jest uruchamiana przez Expo Go,
* pierwsze otwarcie backendu po dłuższej przerwie może trwać dłużej,
* operacje PWA wymagające serwera nie działają bez internetu,
* edycja danych zwierzęcia jest dostępna głównie w PWA.

Nie przeszkadza to jednak w przedstawieniu najważniejszych funkcji projektu.

## 13. Podsumowanie

Wszystkie przygotowane testy automatyczne zostały zakończone poprawnie.

```text
7 passed
```

Testy ręczne również potwierdziły poprawne działanie:

* rejestracji i logowania,
* tokenów JWT,
* operacji CRUD,
* synchronizacji między PWA i aplikacją mobilną,
* zapisu lokalnego,
* późniejszej synchronizacji,
* aparatu,
* biblioteki zdjęć,
* kalendarza,
* instalacji PWA,
* bazy PostgreSQL.

Na podstawie wykonanych testów uważam, że projekt VetCare działa zgodnie z przyjętymi założeniami i jest gotowy do zaprezentowania oraz oddania.
