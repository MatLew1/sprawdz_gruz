<template>
  <div>
    <h2>Odjazdy z Klonowica:</h2>
    <p>Dane się aktualizuja automatycznie</p>
    <ul>
      <!-- Ograniczenie wyników do 8 za pomocą slice() -->
      <li
        v-for="(departure, index) in mergedDepartures.slice(0, 8)"
        :key="index"
        :class="{
          highlight: isCurrentlyDeparting(departure),
          flashing: isCurrentlyDeparting(departure),
        }"
      >
        <!-- Numery linii po lewej -->
        <div class="line">{{ departure.line_number }}</div>
        <!-- Nazwa kierunku obok numeru linii -->
        <div class="direction">{{ departure.direction }}</div>
        <!-- Czasy odjazdów po prawej -->
        <div class="time">
          <template v-if="departure.time_real === 0">
            <span>Odjeżdża</span>
          </template>
          <template v-else-if="departure.time_real !== null">
            <span>za {{ formatMinutes(departure.time_real) }}</span>
          </template>
          <template v-else>
            <span>Planowane: {{ departure.time_scheduled }}</span>
          </template>
        </div>
      </li>
    </ul>
  </div>
</template>

<script>
import axios from "axios";

export default {
  data() {
    return {
      stopNumbers: ["32622", "32621"], // Numery przystanków
      departures: [], // Lista odjazdów z obu przystanków
      currentTime: null, // Aktualny czas
    };
  },
  mounted() {
    this.fetchDepartures();
    this.updateCurrentTime();

    // Odświeżanie danych o odjazdach co 20 sekund
    setInterval(this.fetchDepartures, 20000);

    // Aktualizacja czasu co sekundę
    setInterval(this.updateCurrentTime, 1000);
  },
  computed: {
    mergedDepartures() {
      return [...this.departures].sort((a, b) => {
        // Oblicz czas w minutach od początku dnia dla obu odjazdów
        const aMinutes = this.getDepartureTimeInMinutes(a);
        const bMinutes = this.getDepartureTimeInMinutes(b);

        // Porównaj czasy odjazdów
        return aMinutes - bMinutes;
      });
    },
  },

  methods: {
    getDepartureTimeInMinutes(departure) {
      if (departure.time_real !== null) {
        // Jeśli istnieje czas rzeczywisty, zwróćmy go
        return departure.time_real === 0
          ? 0 // Odjazd teraz (0 minut)
          : departure.time_real; // Czas rzeczywisty w minutach
      }

      // Jeśli brak czasu rzeczywistego, przekształcamy czas zaplanowany na minuty
      return this.getMinutesFromScheduled(departure.time_scheduled);
    },
    // Pobieranie danych o odjazdach z obu przystanków
    async fetchDepartures() {
      try {
        const promises = this.stopNumbers.map((stopNumber) =>
          axios.get(
            `https://www.zditm.szczecin.pl/api/v1/displays/${stopNumber}`
          )
        );

        const results = await Promise.all(promises);

        // Zbieranie danych z obu przystanków
        this.departures = results.flatMap((response) =>
          response.data.departures.map((departure) => ({
            ...departure,
            time_display:
              departure.time_real === null
                ? departure.time_scheduled
                : departure.time_real,
          }))
        );
      } catch (error) {
        console.error("Błąd podczas pobierania danych:", error);
      }
    },

    // Aktualizacja aktualnego czasu
    updateCurrentTime() {
      const now = new Date();
      this.currentTime = now;

      // Opcjonalnie: Sprawdzamy poprawność aktualnego czasu w minutach
      
    },

    // Formatowanie czasu w minutach z poprawną gramatyką
    formatMinutes(minutes) {
      if (minutes === 1) {
        return "1 minutę";
      } else if (
        [2, 3, 4].includes(minutes % 10) &&
        ![12, 13, 14].includes(minutes % 100)
      ) {
        return `${minutes} minuty`;
      } else {
        return `${minutes} minut`;
      }
    },

    // Przekształcanie czasu planowanego na liczbę minut od początku dnia
    getMinutesFromScheduled(timeScheduled) {
      if (!timeScheduled) return 0; // Jeśli brak czasu zaplanowanego, zwróć 0

      const [hour, minute] = timeScheduled.split(":").map(Number);

      // Walidacja poprawności godzin i minut
      if (isNaN(hour) || isNaN(minute)) {
        console.error(`Błędny format czasu: ${timeScheduled}`);
        return 0; // Jeśli format jest błędny, zwróć 0
      }

      // Sprawdzanie poprawności zakresu godzin i minut
      if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
        console.error(`Niewłaściwy czas: ${timeScheduled}`);
        return 0;
      }

      return hour * 60 + minute; // Przekształć na minuty
    },

    // Sprawdzanie, czy odjazd dzieje się w tej chwili
    isCurrentlyDeparting(departure) {
      const currentMinutes =
        this.currentTime.getHours() * 60 + this.currentTime.getMinutes(); // Aktualny czas w minutach

      // Jeśli czas rzeczywisty jest równy 0, oznacza to, że odjazd ma miejsce teraz
      if (departure.time_real === 0) {
        return true;
      }

      // Jeśli czas rzeczywisty jest null, porównaj zaplanowany czas
      if (departure.time_real === null) {
        const scheduledMinutes = this.getMinutesFromScheduled(
          departure.time_scheduled
        );
        return scheduledMinutes === currentMinutes; // Porównaj minutowy zaplanowany czas z aktualnym
      }

      return false; // Inne przypadki
    },
  },
};
</script>

<style scoped>
/* Styl listy */
ul {
  list-style: none;
  padding: 0;
}

li {
  margin: 10px 0;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 5px;
  display: grid;
  grid-template-columns: 1fr 3fr 2fr; /* 3 kolumny: numer linii, kierunek, czas */
  align-items: center;
}

/* Styl dla numeru linii */
.line {
  font-weight: bold;
  font-size: 1.5rem;
  text-align: left; /* Całkowicie wyrównane do lewej */
  color: #000;
}

/* Styl dla nazwy kierunku */
.direction {
  font-size: 1.2rem;
  color: #555;
}

/* Styl dla czasu odjazdu */
.time {
  font-size: 1rem;
  color: green;
  font-weight: bold;
  text-align: right;
}

/* Styl dla odjazdów z czasem rzeczywistym 0 minut */
.highlight {
  background-color: #ffe6e6;
  color: red;
  font-weight: bold;
}

/* Miganie dla odjazdów z czasem 0 minut lub planowanych odjazdów */
.flashing {
  animation: flashingEffect 1s infinite;
}

/* Definicja animacji migania */
@keyframes flashingEffect {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
  100% {
    opacity: 1;
  }
}
</style>
