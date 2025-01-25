<template>
  <div v-if="bus || lastKnownBus" class="bus-info">
    <h3>Autobus na wybranej Lini:</h3>
    <p v-if="bus">
      <span class="stylebus">{{ bus.vehicle_number }}</span>
    </p>
    <p v-if="!bus && lastKnownBus">
      <span class="stylebus">{{ lastKnownBus.vehicle_number }}</span>
    </p>
    <p class="stylepunctually" v-if="bus">
      Punktualność: {{ bus.punctuality }}
    </p>
    <p class="stylepunctually" v-if="!bus && lastKnownBus">
      Punktualność: {{ lastKnownBus.punctuality }}
    </p>
    <p class="stylepunctually" v-if="bus">Kierunek: {{ bus.direction }}</p>
    <p class="stylepunctually" v-if="!bus && lastKnownBus">
      Kierunek: {{ lastKnownBus.direction }}
    </p>
    <p class="stylepunctually" v-if="bus">
      Następny Przystanek: {{ bus.next_stop }}
    </p>
    <p class="stylepunctually" v-if="!bus && lastKnownBus">
      Następny Przystanek: {{ lastKnownBus.next_stop }}
    </p>
    <p class="stylepunctually1" v-if="bus">
      Prędkość Chwilowa: {{ bus.velocity }} km/h
    </p>
    <p class="stylepunctually1" v-if="!bus && lastKnownBus">
      Prędkość Chwilowa: {{ lastKnownBus.velocity }} km/h
    </p>
    
    <p v-if="lastUpdatedTime" class="stylepunctually1">
      Ostatnia aktualizacja: {{ lastUpdatedTime }}
    </p>
    <p class="danneupdate" v-if="!bus && lastKnownBus">
      Ostatnia aktualizacja: {{ lastUpdatedTime }}
    </p>
    <p class="danneupdate">
      (Informacje aktualizują się automatycznie co 20 sekund)
    </p>

    
    
   
   
  </div>
</template>

<script>
export default {
  props: {
    bus: Object,
    lastKnownBus: Object,
    lastUpdatedTime: String,
  },
};
</script>

<style scoped>
.bus-info {
  font-weight: bold;
  margin-top: 20px;
  border: 1px solid #ccc;
  padding: 10px;
  border-radius: 20px;
  background-color: #0c3b2e;
  transition: box-shadow 0.3s ease-in-out;
  color: #a6b7b3;
}

.bus-info:hover {
  box-shadow: 20px 20px 20px rgba(0, 0, 0, 0.1);
}

.stylebus {
  font-size: 3em;
  color: rgb(222, 67, 67);
}

.stylepunctually {
  font-size: 1em;
}

.stylepunctually1 {
  font-size: 1em;
  color: rgb(222, 67, 67);
}
</style>
