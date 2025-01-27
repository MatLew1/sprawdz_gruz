<template>
  <div>
    <h2>Odjazdy z Klonowica:</h2>
    <p>Dane się aktualizują automatycznie</p>
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
            <span>Odjazd: {{ departure.time_scheduled }}</span>
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
      const aMinutes = this.getDepartureTimeInMinutes(a);
      const bMinutes = this.getDepartureTimeInMinutes(b);

      // Zawsze umieszczamy autobusy z rzeczywistym czasem odjazdu na początku listy
      return aMinutes - bMinutes;
    });
  },
  },
  methods: {
    getDepartureTimeInMinutes(departure) {
      // Preferujemy czas rzeczywisty, jeśli jest dostępny
      if (departure.time_real !== null) {
        return departure.time_real === 0
          ? 0 // Odjazd teraz
          : departure.time_real;
      }
      // Jeśli czas rzeczywisty nie jest dostępny, obliczamy czas na podstawie planowanego
      return this.getMinutesFromScheduled(departure.time_scheduled);
    },
    async fetchDepartures() {
      try {
        const promises = this.stopNumbers.map((stopNumber) =>
          axios.get(
            `https://www.zditm.szczecin.pl/api/v1/displays/${stopNumber}`
          )
        );

        const results = await Promise.all(promises);

        this.departures = results.flatMap(
          (response) => response.data.departures
        );

        // Dodaj sortowanie
        this.departures.sort((a, b) => {
          if (a.time_real !== null && b.time_real !== null) {
            return a.time_real - b.time_real;
          }
          if (a.time_real !== null && b.time_real === null) {
            return -1;
          }
          if (a.time_real === null && b.time_real !== null) {
            return 1;
          }
          return a.time_scheduled.localeCompare(b.time_scheduled);
        });
      } catch (error) {
        console.error("Błąd podczas pobierania danych:", error);
      }
    },
    updateCurrentTime() {
      this.currentTime = new Date();
    },
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
    getMinutesFromScheduled(timeScheduled) {
      if (!timeScheduled) return Infinity; // Brak planowanego czasu
      const [hour, minute] = timeScheduled.split(":").map(Number);
      const now = new Date();
      const scheduledMinutes = hour * 60 + minute;
      const currentMinutes = now.getHours() * 60 + now.getMinutes();

      // Jeśli czas planowany jest wcześniejszy niż obecny (np. po północy), dodajemy 24 godziny
      return scheduledMinutes >= currentMinutes
        ? scheduledMinutes - currentMinutes
        : scheduledMinutes + 1440 - currentMinutes;
    },
    isCurrentlyDeparting(departure) {
      const now = new Date();
      const nowMinutes = now.getHours() * 60 + now.getMinutes(); // aktualny czas w minutach

      // Dla czasu rzeczywistego (jeśli czas realny wynosi 0, autobus odjeżdża teraz)
      if (departure.time_real === 0) {
        return true; // Autobus miga, bo odjeżdża teraz
      }

      // Dla zaplanowanego czasu (time_real === null)
      if (departure.time_real === null) {
        const scheduledMinutes = this.getMinutesFromScheduled(
          departure.time_scheduled
        );

        // Autobus miga, jeśli zaplanowany czas odjazdu pokrywa się z bieżącym czasem
        if (scheduledMinutes === nowMinutes) {
          return true;
        }

        // Autobus powinien być jeszcze widoczny przez minutę po zaplanowanym odjeździe
        if (
          scheduledMinutes < nowMinutes &&
          scheduledMinutes + 1 === nowMinutes
        ) {
          return true;
        }

        return false;
      }

      return false;
    },
  },
};
</script>

<style scoped>
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
  grid-template-columns: 1fr 3fr 2fr;
  align-items: center;
}

.line {
  font-weight: bold;
  font-size: 1.5rem;
  text-align: left;
  color: #000;
}

.direction {
  font-size: 1.2rem;
  color: #555;
}

.time {
  font-size: 1rem;
  color: green;
  font-weight: bold;
  text-align: right;
}

.highlight {
  background-color: #ffe6e6;
  color: red;
  font-weight: bold;
}

.flashing {
  animation: flashingEffect 1s infinite;
}

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
