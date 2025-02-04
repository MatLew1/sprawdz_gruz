<template>
  <div>
    <h2>Odjazdy z Klonowica:</h2>
    <p>Dane się aktualizują automatycznie</p>
    <transition-group :key="departures.length" name="list" tag="ul">
      <li
        v-for="(departure, index) in sortedDepartures.slice(0, 8)"
        :key="
          departure.id ||
          `${departure.line_number}-${departure.direction}-${
            departure.time_scheduled || index
          }`
        "
        :class="{
          flashing:
            departure.time_real === 0 || isScheduledDeparting(departure),
          departing:
            departingBuses.includes(
              departure.id ||
                `${departure.line_number}-${departure.direction}-${departure.time_scheduled}`
            ) &&
            isFinalPhase(
              departure.id ||
                `${departure.line_number}-${departure.direction}-${departure.time_scheduled}`
            ),
        }"
      >
        <div class="line">{{ departure.line_number }}</div>
        <div class="details">
          <div class="direction">{{ departure.direction }}</div>
          <div class="info">
            <div class="vehicle-number">{{ departure.vehicle_number }}</div>
            <div class="brigade">Brygada: {{ departure.brigade_number }}</div>
            <div
              class="punctuality"
              :class="getPunctualityClass(departure.punctuality)"
            >
              {{ getPunctualityStatus(departure.punctuality) }}
            </div>
          </div>
        </div>
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
      departingBuses: [],
      finalPhaseBuses: [],
    };
  },
  mounted() {
    this.fetchDepartures();
    this.updateCurrentTime();
    setInterval(this.fetchDepartures, 10000); // Co 20 sekund
    setInterval(this.updateCurrentTime, 1000); // Co 1 sekundę
  },
  computed: {
    sortedDepartures() {
      const sorted = [...this.departures].sort((a, b) => {
        const timeA =
          a.time_real !== null
            ? a.time_real
            : this.getMinutesFromScheduled(a.time_scheduled);
        const timeB =
          b.time_real !== null
            ? b.time_real
            : this.getMinutesFromScheduled(b.time_scheduled);
        return timeA - timeB;
      });
      console.log(sorted); // Dodano logowanie posortowanych danych
      return sorted;
    },
  },
  methods: {
    async fetchDepartures() {
      try {
        const stopPromises = this.stopNumbers.map((stopNumber) =>
          axios.get(
            `https://www.zditm.szczecin.pl/api/v1/displays/${stopNumber}`
          )
        );
        const vehiclePromise = axios.get(
          "https://www.zditm.szczecin.pl/api/v1/vehicles"
        );

        const [stopResponses, vehicleResponse] = await Promise.all([
          Promise.all(stopPromises),
          vehiclePromise,
        ]);

        let vehicles = vehicleResponse.data;
        if (!Array.isArray(vehicles)) {
          console.log("Vehicles API Response (raw):", vehicles);
          vehicles = vehicles.vehicles || vehicles.data || [];
        }

        const departures = stopResponses.flatMap((res) => res.data.departures);

        console.log("Departures API Response:", departures);
        console.log("Vehicles API Response (processed):", vehicles);

        const newDepartures = departures
          .map((dep) => {
            const matchingVehicles = vehicles.filter(
              (v) => v.line_number === dep.line_number
            );

            let matchingVehicle = null;
            if (matchingVehicles.length === 1) {
              matchingVehicle = matchingVehicles[0];
            } else if (matchingVehicles.length > 1) {
              matchingVehicle = matchingVehicles.find(
                (v) =>
                  v.direction
                    .toLowerCase()
                    .includes(dep.direction.toLowerCase()) &&
                  v.next_stop &&
                  dep.next_stop &&
                  v.next_stop.toLowerCase() === dep.next_stop.toLowerCase()
              );

              if (!matchingVehicle) {
                matchingVehicle = matchingVehicles[0];
              }
            }

            // **PUNKT 3: IGNOROWANIE STARYCH DANYCH**
            if (
              matchingVehicle &&
              new Date(matchingVehicle.updated_at) - new Date(dep.updated_at) >
                20000
            ) {
              return null; // Ignorujemy przestarzałe wpisy
            }

            return {
              line_number: dep.line_number,
              direction: dep.direction,
              time_scheduled: dep.time_scheduled,
              time_real: dep.time_real,
              vehicle_number: matchingVehicle
                ? matchingVehicle.vehicle_number
                : "-",
              brigade_number: matchingVehicle
                ? parseInt(matchingVehicle.service.split("-")[1], 10)
                : "-",
              punctuality: matchingVehicle ? matchingVehicle.punctuality : null,
              punctuality_status: this.getPunctualityStatus(
                matchingVehicle ? matchingVehicle.punctuality : null
              ),
              status: this.getStatus(dep),
            };
          })
          .filter(Boolean); // Usunięcie wpisów, które zostały odrzucone przez filtr czasu

        // **USUWANIE DUPLIKATÓW NA PODSTAWIE numeru linii, kierunku, godziny i brygady**
        const uniqueDepartures = [];
        const seenDepartures = new Set();

        newDepartures.forEach((departure) => {
          const depKey = `${departure.line_number}-${departure.direction}-${departure.time_scheduled}-${departure.brigade_number}`;

          if (!seenDepartures.has(depKey)) {
            seenDepartures.add(depKey);
            uniqueDepartures.push(departure);
          }
        });

        this.departures = uniqueDepartures; // Zapisujemy przefiltrowaną listę
        this.checkDepartures();
      } catch (error) {
        console.error("Błąd podczas pobierania danych:", error);
      }
    }, 

    getPunctualityStatus(punctuality) {
      if (punctuality === null) return "O czasie"; // Gdy brak danych, uznajemy jako "O czasie"
      if (punctuality === 0) return "O czasie"; // Jeśli 0, kurs punktualny
      return punctuality < 0
        ? `> ${Math.abs(punctuality)} min`
        : `${punctuality} min`;
    },

    getPunctualityClass(punctuality) {
      if (punctuality === null || punctuality === 0) return "punctual-green"; // Zielony dla punktualnych
      if (punctuality < 0) return "punctual-red"; // Czerwony dla opóźnionych
      return "punctual-blue"; // Niebieski dla przyspieszonych
    },

    getStatus(departure) {
      if (departure.time_real === 0) return "Odjeżdża";
      if (departure.time_real === null) return "Planowy";
      return departure.time_real > 0
        ? `Za ${departure.time_real} min`
        : "Opóźniony";
    },
    updateCurrentTime() {
      this.currentTime = new Date();
    },
    checkDepartures() {
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const departingSet = new Set(); // Trzymamy odjazdy, by unikać duplikatów

  this.departures.forEach((departure) => {
    const depId =
      departure.id ||
      `${departure.line_number}-${departure.direction}-${departure.time_scheduled}`;

    const scheduledMinutes = this.getMinutesFromScheduled(
      departure.time_scheduled
    );

    const shouldDepartNow =
      departure.time_real === 0 || // Odjazd wg czasu rzeczywistego
      (departure.time_real === null && scheduledMinutes === nowMinutes); // Odjazd wg zaplanowanego rozkładu

    if (shouldDepartNow && !departingSet.has(depId)) {
      this.handleDepartureAnimation(depId);
      departingSet.add(depId); // Zapamiętujemy, że ten już odjeżdża
    }
  });
},

    handleDepartureAnimation(id) {
      this.departingBuses.push(id);

      setTimeout(() => {
        this.finalPhaseBuses.push(id);

        setTimeout(() => {
          // Usuwamy TYLKO autobus, który rzeczywiście powinien zniknąć
          this.departingBuses = this.departingBuses.filter(
            (busId) => busId !== id
          );
          this.finalPhaseBuses = this.finalPhaseBuses.filter(
            (busId) => busId !== id
          );
          this.departures = this.departures.filter(
            (departure) =>
              (departure.id ||
                `${departure.line_number}-${departure.direction}-${departure.time_scheduled}`) !==
              id
          );
        }, 5000); // 5 sekund animacji przesunięcia w lewo i zniknięcia
      }, 60000); // 15 sekund migania
    },

    isScheduledDeparting(departure) {
      const now = new Date();
      const nowMinutes = now.getHours() * 60 + now.getMinutes();
      if (departure.time_real === null) {
        const scheduledMinutes = this.getMinutesFromScheduled(
          departure.time_scheduled
        );
        return scheduledMinutes === nowMinutes;
      }
      return false;
    },
    isFinalPhase(id) {
      return this.finalPhaseBuses.includes(id);
    },
    getMinutesFromScheduled(timeScheduled) {
      if (!timeScheduled) return Infinity;

      const [hour, minute] = timeScheduled.split(":").map(Number);
      const now = new Date();

      const scheduledMinutes = hour * 60 + minute;
      const currentMinutes = now.getHours() * 60 + now.getMinutes();

      const diff = scheduledMinutes - currentMinutes;

      // Obsługa przypadków, gdy godzina odjazdu jest po północy
      return diff >= 0 ? diff : diff + 1440;
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
  grid-template-columns: 50px 3fr 100px; /* Zmieniono auto na 50px */
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

.details {
  display: flex;
  flex-direction: column;
}

.direction {
  font-size: 1.1rem; /* Lekko zmniejszona (było 1.2rem) */
  color: #444; /* Nieco przyciemniony kolor dla lepszej czytelności */
  font-weight: bold;
  margin-bottom: 3px; /* Delikatny odstęp od pozostałych elementów */
}

.info {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  font-size: 1rem;
  color: #333;
}

.time {
  font-size: 1rem;
  color: green;
  font-weight: bold;
  text-align: right;
}

.flashing {
  background-color: #ffe6e6;
  color: red;
  font-weight: bold;
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

.departing {
  transition: transform 3s ease-out, opacity 3s ease-out;
  transform: translateX(-100%);
  opacity: 0;
}

.punctual-green {
  color: green;
  font-weight: bold;
}

.punctual-red {
  color: red;
  font-weight: bold;
}

.punctual-blue {
  color: blue;
  font-weight: bold;
}

.info {
  display: flex;
  flex-direction: row; /* Ustawienie w jednej linii */
  justify-content: space-between; /* Równe odstępy */
  align-items: center;
  font-size: 0.9rem; /* Minimalnie zmniejszona czcionka dla całej sekcji */
  gap: 15px; /* Odstępy między elementami */
}

.brigade {
  font-size: 0.8rem; /* Zmniejszona czcionka */
  font-weight: normal;
  color: #555; /* Przyciemniony kolor dla czytelności */
  margin-right: 10px; /* Odsunięcie od punktualności */
}

.punctuality {
  font-size: 0.8rem; /* Zmniejszona czcionka dla punktualności */
  font-weight: bold;
  margin-left: 5px; /* Drobny odstęp od brygady */
}

.scheduled-time {
  font-size: 0.9rem;
  color: #333;
}

.vehicle-number {
  font-weight: bold;
  font-size: 1rem;
}
</style>
