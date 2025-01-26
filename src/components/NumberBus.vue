<template>
  <div class="p-4">
    <h1 class="text-xl font-bold mb-4">Wyszukiwanie autobusu</h1>

    <!-- Pole wyboru numeru autobusu -->
    <select
      id="bus-select"
      v-model="selectedBus"
      class="border p-2 rounded w-full mb-4"
    >
      <option value="" disabled>-- Wybierz autobus --</option>
      <option
        v-for="vehicle in uniqueVehicleNumbers"
        :key="vehicle.number"
        :value="vehicle.number"
      >
        {{ vehicle.number }} - {{ vehicle.depot }}
      </option>
    </select>

    <!-- Wskaźnik ładowania -->
    <div v-if="isLoading" class="text-gray-500">Ładowanie danych...</div>

    <!-- Błąd -->
    <div v-if="error" class="text-red-500">{{ error }}</div>

    <!-- Informacje o wybranym autobusie -->
    <ul v-if="selectedBusDetails.length">
      <li v-for="vehicle in selectedBusDetails" :key="vehicle.vehicle_id">
        <strong>Numer autobusu:</strong> {{ vehicle.vehicle_number }} <br />
        <strong>Zajezdnia:</strong> {{ getDepot(vehicle.vehicle_number) }}
        <br />
        <strong>Linia:</strong>
        <span class="line">{{ vehicle.line_number }}</span> <br />
        <strong>Kierunek:</strong> {{ vehicle.direction || "Brak danych" }}
      </li>
    </ul>

    <!-- Brak wyników -->
    <div v-else-if="selectedBus" class="text-gray-500">
      Brak wyników dla wybranego numeru autobusu.
    </div>
  </div>
</template>

<script>
import { ref, computed } from "vue";
import axios from "axios";

export default {
  methods: {
    getDepot(depot) {
      // Przetwarzaj wartość zajezdni, jeśli jest to potrzebne
      return depot.toUpperCase(); // Na przykład zamiana na wielkie litery
    },
  },
  setup() {
    const searchQuery = ref(""); // Wartość wyszukiwania (opcjonalne)
    const vehicles = ref([]); // Lista pojazdów
    const isLoading = ref(false); // Stan ładowania
    const error = ref(null); // Obsługa błędów
    const selectedBus = ref(""); // Wybrany numer autobusu

    const apiUrl = "https://www.zditm.szczecin.pl/api/v1/vehicles";

    const fetchVehicles = async () => {
      isLoading.value = true;
      error.value = null;

      try {
        const response = await axios.get(apiUrl);
        vehicles.value = response.data.data;
      } catch (err) {
        error.value = "Wystąpił błąd podczas pobierania danych.";
        console.error(err);
      } finally {
        isLoading.value = false;
      }
    };

    // Lista unikalnych numerów autobusów do wyświetlenia w rozwijanym menu
    const uniqueVehicleNumbers = computed(() => {
      return [
        ...new Set(
          vehicles.value
            .filter((vehicle) => vehicle.vehicle_type === "bus") // Filtruj tylko autobusy
            .map((vehicle) => {
              const depot = getDepot(vehicle.vehicle_number); // Określenie zajezdni
              return {
                number: vehicle.vehicle_number,
                depot: depot, // Zwracamy wynik z getDepot, bez dodatkowego opisu
              };
            })
        ),
      ].sort((a, b) => a.number - b.number); // Sortuj numerycznie
    });

    // Funkcja określająca zajezdnię na podstawie numeru autobusu
    const getDepot = (vehicleNumber) => {
      if (/^\d{5}$/.test(vehicleNumber)) {
        return "Pks Szczecin";
      } else if (/^1/.test(vehicleNumber)) {
        return "Spa Klonowica";
      } else if (/^2/.test(vehicleNumber)) {
        return "Spa Dąbie";
      } else if (/^3/.test(vehicleNumber)) {
        // Dla numerów zaczynających się na "3"
        return "Sppk Police"; // Zwracamy nazwę "SPPK Police"
      } else if (/^\d{3}$/.test(vehicleNumber)) {
        return "Sppk Police";
      } else {
        return "Nieznana zajezdnia";
      }
    };

    // Szczegóły wybranego autobusu
    const selectedBusDetails = computed(() =>
      vehicles.value.filter(
        (vehicle) =>
          vehicle.vehicle_number === selectedBus.value && // Porównanie tylko po numerze
          vehicle.vehicle_type === "bus" // Dodatkowy warunek na typ pojazdu
      )
    );

    // Pobierz dane przy montowaniu komponentu
    fetchVehicles();

    return {
      searchQuery,
      vehicles,
      isLoading,
      error,
      selectedBus,
      uniqueVehicleNumbers,
      selectedBusDetails,
    };
  },
};
</script>

<style scoped>
h3 {
  font-size: 2em;
  margin-bottom: 0;
  text-align: center;
}

.select option {
  text-align: center;
}

select {
  --webkit-appearance: none;
  --moz-appearance: none;
  --ms-appearance: none;
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

ul {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
  padding: 0;
  text-align: center;
  width: 90%;
}

li {
  list-style: none;
  font-weight: bold;
  margin-top: 20px;
  border: 1px solid #ccc;
  padding: 10px;
  border-radius: 20px;
  background-color: #0c3b2e;
  transition: box-shadow 0.3s ease-in-out;
  color: #a6b7b3;
  text-align: center;
  width: 100%;
  max-width: 300px;
  font-size: 20px;
}

.line {
  color: red;
}

li strong {
  margin-bottom: 12px;
  display: inline-block;
}
</style>
