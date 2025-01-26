<template>
  <div>
    <div class="select">
      <select v-model="selectedLineNumber" @change="updateBuses">
        <option
          selected
          v-for="line in lineNumbers"
          v-bind:key="line"
          :value="line"
        >
          {{ line }}
        </option>
      </select>
    </div>

    <div v-show="selectedLineNumber" class="brigade-container">
      <label for="brigade">Brygada:</label>
      <div class="select">
        <select v-model="selectedBrigade" @change="updateBuses">
          <option
            v-for="brigade in filteredBrigades"
            v-bind:key="brigade"
            :value="brigade"
          >
            {{ brigade }}
          </option>
        </select>
      </div>
    </div>
    <bus-info :bus="selectedBus" :lastKnownBus="lastKnownBus"></bus-info>
    <wirtual-array></wirtual-array>
  </div>
</template>

<script>
import axios from "axios";
import BusInfo from "./BusInfo.vue";
import WirtualArray from "./WirtualArray.vue";

export default {
  components: {
    BusInfo,
    WirtualArray,
  },
  data() {
    return {
      buses: [],
      lineNumbers: [],
      brigadeMap: {},
      selectedLineNumber: "",
      selectedBrigade: "",
      selectedBus: null,
      lastKnownBus: null,
      lastUpdatedTime: null,
    };
  },
  mounted() {
    this.fetchBuses();
    this.fetchInterval = setInterval(this.fetchBuses, 20000);
  },
  beforeUnmount() {
    clearInterval(this.fetchInterval);
    // Inicjalizacja listy numerów linii na podstawie danych z local storage, jeśli są dostępne
    const storedBuses = JSON.parse(localStorage.getItem("buses"));
    if (storedBuses) {
      this.buses = storedBuses;
      this.lineNumbers = [...new Set(this.buses.map((bus) => bus.line_number))];
    }

    const storedBrigades = JSON.parse(localStorage.getItem("brigades"));
    if (storedBrigades) {
      this.brigadeMap = storedBrigades;
    } else {
      // Jeśli nie ma danych w local storage, zainicjuj pustą mapę
      this.brigadeMap = {};
    }

    // Pobieranie danych z API i ustawianie interwału
    this.fetchBuses();
    setInterval(this.fetchBuses, 20000); // Zmieniłem interwał na 20 sekund

    const storedLastUpdatedTime = localStorage.getItem("lastUpdatedTime");
    if (storedLastUpdatedTime) {
      this.lastUpdatedTime = storedLastUpdatedTime;
    }
  },

  computed: {
    filteredBrigades() {
      const brigades = this.brigadeMap[this.selectedLineNumber] || [];
      // Sortowanie brygad numerycznie
      return brigades.sort((a, b) => a - b);
    },
  },

  methods: {
    async fetchBuses() {
      try {
        this.loading = true; // Ustawienie stanu loading na true podczas próby pobrania danych

        let response;
        try {
          response = await await axios.get(
            "https://www.zditm.szczecin.pl/api/v1/vehicles",
            { timeout: 2000 }
          );
        } catch (error) {
          console.error(
            "Nie udało się pobrać danych z API, używam danych z local storage",
            error
          );
          this.loading = false; // Ustawienie stanu loading na false w przypadku błędu

          this.selectedLineNumber = null;

          const storedBus = JSON.parse(localStorage.getItem("lastKnownBus"));
          if (storedBus) {
            this.lastKnownBus = storedBus.bus;
            this.lastUpdatedTime = storedBus.timestamp;
          }
          return; // Przerwanie działania metody, jeśli pobranie z API nie powiodło się
        }

        const busesData = response.data.data.filter(
          (bus) => bus.vehicle_type === "bus"
        );

        const isEmptyData = busesData.length === 0;

        // Jeśli dane z API nie są puste, nadpisz dane w local storage
        if (!isEmptyData) {
          this.buses = busesData;
          this.lineNumbers = [
            ...new Set(this.buses.map((bus) => bus.line_number)),
          ].sort((a, b) => {
            // Linie z literami na górze
            const isALetter = /^[A-Za-z]/.test(a);
            const isBLetter = /^[A-Za-z]/.test(b);

            if (isALetter && !isBLetter) return -1; // A jest literą, B nie -> A na górze
            if (!isALetter && isBLetter) return 1; // B jest literą, A nie -> B na górze

            // Jeśli oba są literami lub oba są numerami -> zwykłe sortowanie
            return isALetter && isBLetter
              ? a.localeCompare(b) // Sortowanie alfabetyczne dla liter
              : parseInt(a) - parseInt(b); // Sortowanie numeryczne
          });

          this.brigadeMap = this.lineNumbers.reduce((acc, line) => {
            const brigades = [
              ...new Set(
                this.buses
                  .filter((bus) => bus.line_number === line)
                  .map((bus) =>
                    parseInt(bus.service.split("-")[1], 10).toString()
                  )
              ),
            ];
            acc[line] = brigades;
            return acc;
          }, {});

          if (!this.selectedLineNumber && this.lineNumbers.length > 0) {
            this.selectedLineNumber = this.lineNumbers[0];
          }

          // Zapisz dane do local storage po pobraniu
          localStorage.setItem("buses", JSON.stringify(this.buses));
          localStorage.setItem("lastUpdatedTime", new Date().toLocaleString());
          localStorage.setItem("brigades", JSON.stringify(this.brigadeMap));

          this.updateBuses();
        }
      } catch (error) {
        console.error("Serwer zditm padł", error);
        this.loading = false; // Ustawienie stanu loading na false w przypadku błędu
        // Sprawdź, czy dane są dostępne w local storage
        const storedBuses = JSON.parse(localStorage.getItem("buses"));
        if (storedBuses) {
          // Aktualizuj dane w komponencie na podstawie danych z local storage
          this.buses = storedBuses;
          this.lineNumbers = [
            ...new Set(this.buses.map((bus) => bus.line_number)),
          ];
          this.brigadeMap = this.lineNumbers.reduce((acc, line) => {
            const brigades = [
              ...new Set(
                storedBuses
                  .filter((bus) => bus.line_number === line)
                  .map((bus) =>
                    parseInt(bus.service.split("-")[1], 10).toString()
                  )
              ),
            ];
            acc[line] = brigades;
            return acc;
          }, {});

          if (!this.selectedLineNumber && this.lineNumbers.length > 0) {
            this.selectedLineNumber = this.lineNumbers[0];
          }

          // Zapisz dane do local storage, nawet jeśli pobieranie zakończyło się niepowodzeniem
          localStorage.setItem("buses", JSON.stringify(this.buses));

          // Aktualizuj dane autobusu z local storage
          this.updateBuses();
        } else {
          // Wyświetl komunikat o braku danych
          alert("Brak dostępnych danych. Spróbuj ponownie później.");
        }
      }
    },

    updateBrigades() {
      this.selectedBrigade = "";
    },

    async updateBuses() {
      try {
        if (navigator.onLine) {
          // Jeśli jest dostęp do Internetu, pobierz dane z API
          const response = await axios.get(
            "https://www.zditm.szczecin.pl/api/v1/vehicles",
            { timeout: 2000 }
          );
          const filteredBuses = response.data.data.filter(
            (bus) =>
              bus.line_number === this.selectedLineNumber &&
              parseInt(bus.service.split("-")[1], 10).toString() ===
                this.selectedBrigade
          );
          if (filteredBuses.length > 0) {
            this.selectedBus = filteredBuses[0];
            this.lastKnownBus = null;
            this.lastUpdatedTime = new Date().toLocaleString();
            // Zapisz selectedBus do lastKnownBus w local storage
            localStorage.setItem(
              "lastKnownBus",
              JSON.stringify({
                bus: this.selectedBus,
                timestamp: this.lastUpdatedTime,
              })
            );
          } else {
            // Jeśli brak wyników filtrowania, ustaw selectedBus na null
            this.selectedBus = null;
            this.lastUpdatedTime = new Date().toLocaleString(); // Aktualizacja czasu ostatniej aktualizacji
          }
        } else {
          // Jeśli brak dostępu do Internetu, sprawdź, czy istnieje zapisany autobus dla wybranej linii w local storage
          const storedBuses = JSON.parse(localStorage.getItem("buses"));
          if (storedBuses) {
            const selectedBusFromLocalStorage = storedBuses.find(
              (bus) =>
                bus.line_number === this.selectedLineNumber &&
                parseInt(bus.service.split("-")[1], 10).toString() ===
                  this.selectedBrigade
            );
            if (selectedBusFromLocalStorage) {
              this.selectedBus = selectedBusFromLocalStorage;
              this.lastKnownBus = null;
              this.lastUpdatedTime = localStorage.getItem("lastUpdatedTime");
            } else {
              // Jeśli brak pasującego autobusu w local storage, ustaw selectedBus na null
              this.selectedBus = null;
              this.lastUpdatedTime = null;
            }
          }
        }
      } catch (error) {
        console.error("Serwer zditm padł", error);
        const storedBus = JSON.parse(localStorage.getItem("lastKnownBus"));
        if (storedBus) {
          this.lastKnownBus = storedBus.bus;
          this.lastUpdatedTime = storedBus.timestamp;
        }
      }
    },
  },
};
</script>

<style scoped>
h3 {
  font-size: 2em;
  margin-bottom: 0;
}

.select option {
  text-align: center;
}

select {
  --webkit-apperance: none;
  --moz-apperance: none;
  --ms-apperance: none;
  appearance: none;
  outline: 0;
  box-shadow: none;
  border: 0 !important;
  background: #6d9773;
  background-image: none;
  flex: 1;
  padding: 0 0.5em;
  color: white;
  cursor: pointer;
  font-size: 1.7em;
  font-weight: bold;
}

select::-ms-expand {
  display: none;
}

.select {
  position: relative;
  display: flex;
  width: 20em;
  height: 3em;
  line-height: 3;
  background: #5c6664;
  overflow: hidden;
  border-radius: 15px;
  margin-top: 1em;
  width: 75%;
  margin-left: 10%;
}

.select::after {
  content: "\25BC";
  position: absolute;
  top: 0;
  right: 0;
  padding: 0 1em;
  background: #000;
  cursor: pointer;
  color: white;
  pointer-events: none;
  transition: 0.25s all ease;
}

.select:hover::after {
  color: #23b499;
}

.brigade-container {
  margin-top: 20px;
  overflow: hidden;
}
</style>
