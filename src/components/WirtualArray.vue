<template>
  <div>
    <h2>Odjazdy z Klonowica:</h2>
    <p>Dane się aktualizują automatycznie</p>
    <transition-group :key="departures.length" name="list" tag="ul">
      <li
        v-for="(departure, index) in mergedDepartures.slice(0, 8)"
        :key="`${departure.line_number}-${departure.time_scheduled || index}`"
        :class="{
          highlight: isCurrentlyDeparting(departure),
          flashing: isCurrentlyDeparting(departure),
        }"
      >
        <div class="line">{{ departure.line_number }}</div>
        <div class="direction">{{ departure.direction }}</div>
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
    </transition-group>
  </div>
</template>

<script>
import axios from "axios";

export default {
  data() {
    return {
      stopNumbers: ["32622", "32621"],
      departures: [],
      currentTime: null,
      renderKey: 0,
    };
  },
  mounted() {
    this.fetchDepartures();
    this.updateCurrentTime();
    setInterval(this.fetchDepartures, 20000);
    setInterval(this.updateCurrentTime, 1000);
  },
  computed: {
    mergedDepartures() {
      return [...this.departures];
    },
  },
  methods: {
    getDepartureTimeInMinutes(departure) {
      if (departure.time_real !== null) {
        return departure.time_real === 0 ? 0 : departure.time_real;
      }
      return this.getMinutesFromScheduled(departure.time_scheduled);
    },
    async fetchDepartures() {
      try {
        const promises = this.stopNumbers.map((stopNumber) =>
          axios.get(`https://www.zditm.szczecin.pl/api/v1/displays/${stopNumber}`)
        );
        const results = await Promise.all(promises);
        const newDepartures = results.flatMap((response) => response.data.departures);
        setTimeout(() => {
          this.departures = newDepartures;
        }, 500);
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
      } else if ([2, 3, 4].includes(minutes % 10) && ![12, 13, 14].includes(minutes % 100)) {
        return `${minutes} minuty`;
      } else {
        return `${minutes} minut`;
      }
    },
    getMinutesFromScheduled(timeScheduled) {
      if (!timeScheduled) return Infinity;
      const [hour, minute] = timeScheduled.split(":").map(Number);
      const now = new Date();
      const scheduledMinutes = hour * 60 + minute;
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      return scheduledMinutes >= currentMinutes
        ? scheduledMinutes - currentMinutes
        : scheduledMinutes + 1440 - currentMinutes;
    },
    isCurrentlyDeparting(departure) {
      const now = new Date();
      const nowMinutes = now.getHours() * 60 + now.getMinutes();
      if (departure.time_real === 0) {
        return true;
      }
      if (departure.time_real === null) {
        const scheduledMinutes = this.getMinutesFromScheduled(departure.time_scheduled);
        if (scheduledMinutes === nowMinutes || scheduledMinutes + 1 === nowMinutes) {
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
  background-color: #fff;
  transition: opacity 0.3s ease;
  position: relative;
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
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
}

.list-leave-active:first-child {
  transition: transform 0.5s ease-in, opacity 0.5s ease-in;
  position: absolute;
  width: 100%;
}

.list-leave-to:first-child {
  opacity: 0;
  transform: translateX(-100%);
}
</style>
