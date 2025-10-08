**Tytuł:** Proof of Concept dla Aplikacji 10xCards

**Kontekst:**

Twoim zadaniem jest wygenerowanie kodu dla Proof of Concept (PoC) aplikacji "10xCards". Wymagania funkcjonalne i stos technologiczny bazują na dokumentach `.ai/prd.md` oraz `.ai/tech-stack.md`. Celem PoC jest weryfikacja kluczowej, podstawowej pętli funkcjonalności: wyświetlenia ekranu głównego i umożliwienia użytkownikowi stworzenia nowej talii kart (Deck).

**Stos technologiczny:**

*   **Frontend:** Astro
*   **Komponenty interaktywne:** React (jako wyspy Astro)
*   **Backend & Baza Danych:** Supabase

**Zakres Funkcjonalny PoC (Co należy zaimplementować):**

1.  **Ekran Główny (Dashboard):**
    *   Stwórz główny widok aplikacji, który będzie wyświetlał listę talii (Decks) należących do użytkownika.
    *   Na potrzeby PoC lista talii może być początkowo hardkodowana lub pusta.
    *   Zaimplementuj "pusty stan" (empty state) zgodnie z historyjką `US-005` z PRD. Gdy użytkownik nie ma żadnych talii, powinien zobaczyć czytelny komunikat i przycisk wzywający do akcji "Stwórz nową talię".

2.  **Tworzenie Nowej Talii (Deck):**
    *   Zgodnie z `US-006`, na ekranie głównym musi znajdować się przycisk "Stwórz nową talię".
    *   Po kliknięciu przycisku, użytkownikowi powinien wyświetlić się prosty formularz lub modal, w którym może podać nazwę dla nowej talii.
    *   Po zatwierdzeniu formularza, nowa talia powinna pojawić się na liście na ekranie głównym.
    *   Na tym etapie operacja dodawania talii może odbywać się wyłącznie po stronie klienta (w stanie komponentu React), bez zapisu do bazy danych Supabase.

**Funkcjonalności Wykluczone z PoC (Czego NIE implementować):**

*   **System uwierzytelniania:** Nie implementuj rejestracji, logowania, wylogowywania ani resetowania hasła. Załóż, że mamy jednego, zalogowanego na stałe użytkownika.
*   **Zarządzanie Fiszakmi:** Całkowicie pomiń funkcjonalność dodawania, edytowania, usuwania i generowania fiszek za pomocą AI.
*   **Tryb Nauki:** Pomiń interfejs do nauki.
*   **Zaawansowane Zarządzanie Taliami:** Nie implementuj zmiany nazwy ani usuwania talii.
*   **Walidacja i Limity:** Ignoruj walidację (np. długość nazwy talii) oraz limity systemowe (np. maksymalna liczba talii).
*   **Trwałość Danych:** Pełna integracja z Supabase w celu trwałego zapisu danych nie jest wymagana, choć podstawowa konfiguracja klienta Supabase w projekcie jest wskazana.

**Krytyczne Instrukcje:**

Zanim przystąpisz do generowania jakiegokolwiek kodu, **musisz najpierw przedstawić mi do akceptacji szczegółowy plan działania**.

Twój plan powinien zawierać:
1.  Proponowaną strukturę plików i folderów dla projektu.
2.  Listę komponentów (React/Astro), które zamierzasz stworzyć, wraz z krótkim opisem ich odpowiedzialności.
3.  Kolejność kroków, jakie podejmiesz w celu implementacji PoC.

**Nie rozpoczynaj pisania kodu, dopóki nie zatwierdzę przedstawionego przez Ciebie planu.**

