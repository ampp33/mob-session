<template>
  <div class="flex flex-wrap"> 
    <div class="w-50 pa2">
      <h1 class="f2 f1-m f-headline-l measure-narrow lh-title mt0 mb2">
        <div style="background-color: #363636" class="lh-copy white pa2 tracked-tight" contenteditable @input="mobNameChange">{{ mobName }}</div>
      </h1>
      <div v-if="!isBrake" class="f1 b">
        {{ members.length > 0 ? 'Driver: ' + members[currentDriverIndex] : '' }}
      </div>
      <div v-if="isBrake">
        Brake Time!
      </div>
      <h1 v-if="members.length > 0" style="background-color: #363636" class="f1 lh-copy white pa2 tracked-tight mt1">
        {{ currentClock }}
      </h1>
    </div>
    <div class="w-50 pa2">
      <div v-if="members.length > 0" class="mb3">
        <input type="button" value="Start/Pause" @click="startPause" class="f6 link ph3 pv2 dib black b bg-white br2 mr2 bn"/>
        <input type="button" value="Reset" @click="reset" class="f6 link ph3 pv2 dib black b bg-white br2 mr2 bn"/>
      </div>
      <div class="mb2">
        <label for="driverDuration">Driver Duration (minutes):</label>
        <input id="driverDuration" type="number" v-model="driverDuration" />
      </div>
      <div class="mb2">
        <label for="turnsBetweenBrakes">Turns Between Brakes:</label>
        <input id="turnsBetweenBrakes" type="number" v-model="turnsBetweenBrakes" />
      </div>
      <div class="mb2">
        <label for="brakeDuration">Brake Duration (minutes):</label>
        <input id="brakeDuration" type="number" v-model="brakeDuration" />
      </div>
      <div>
        <h1 class="mb2">Mob Members</h1>
        <div class="mb3">
          <input type="text" v-model="newMember" v-on:keyup.enter="addNewMember" class="black b bg-white br2 mr2 bn" />
          <input type="button" value="+" @click="addNewMember" class="black b bg-white br2 mr2 bn" />
        </div>
        <div v-for="(member, index) in members" :key="index" class="mb3">
          <h3 class="mr2" style="display: inline">{{ member }}{{ index == currentDriverIndex ? " &lt;&lt;&lt;" : '' }}</h3>
          <input type="button" value="x" @click="removeMember(index)" class="black b bg-white br2 mr2 bn" />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
const rs = require("randomstring");

export default {
  name: 'App',
  data() {
    return {
      mobId: '',
      currentDriverIndex: 0,
      currentTurnsUntilBrake: 0,
      clockRunning: false,
      isBrake: false,
      members: [],
      newMember: '',
      mobName: "Cool Mob",
      driverDuration: 15,
      turnsBetweenBrakes: 3,
      brakeDuration: 5,
      millisUntilEnd: 0,
      lastModelUpdateTs: Date.now(),
      updatingModel: false
    }
  },
  computed: {
    currentClock() {
      let secondsUntilEnd = this.millisUntilEnd / 1000;
      let minutes = Math.floor(secondsUntilEnd / 60);
      let seconds = Math.ceil(secondsUntilEnd - (60 * minutes));
      if(seconds == 60) {
        seconds = 0;
        minutes += 1;
      }
      return (minutes + "").padStart(2, '0') + ':'
                + (seconds + "").padStart(2, '0');
    }
  },
  watch: {
    driverDuration(newDriverDuration) {
      // skip watcher if updating model, to avoid persisting half-baked data
      if(this.updatingModel) return;

      if(!this.clockRunning) {
        this.millisUntilEnd = (newDriverDuration * 60 * 1000);
      }
      this.updateModelOnServer();
    },
    turnsBetweenBrakes(newValue, oldValue) {
      // skip watcher if updating model, to avoid persisting half-baked data
      if(this.updatingModel) return;

      // subtract the number of already used turns from new value
      const turnsUsed = oldValue - this.currentTurnsUntilBrake;
      this.currentTurnsUntilBrake = newValue - turnsUsed;
      if(this.currentTurnsUntilBrake <= 0) {
        this.toggleBrake();
      }
      this.updateModelOnServer();
    }
  },
  async created() {
    // check if mob name is specified, and if not generate one
    let isNewMob = false;
    const url = window.location.href;
    const mobId = url.substring(url.lastIndexOf('/') + 1).trim();
    if(mobId.length == 0) {
      isNewMob = true;
    }
    // keep track of mob id to pull and post mob data updates
    this.mobId = mobId;
    await this.checkServerForModelUpdates(true);

    // start polling process to periodically pull mob data
    setInterval(() => {
      this.checkServerForModelUpdates();
    }, 1000)

    // initialize starter values
    this.currentTurnsUntilBrake = this.turnsBetweenBrakes;
    this.millisUntilEnd = (this.driverDuration * 60 * 1000);

    // setup countdown process on component creation
    setInterval(() => {
      if(this.clockRunning) {
        this.millisUntilEnd -= 1000;
        if(this.millisUntilEnd <= 0) {
          this.clockRunning = false;
          this.rotateDriver();
          this.updateModelOnServer();
        }
      }
    }, 1000);

    // if this is a new mob then write it to the server
    if(isNewMob) {
      await this.updateModelOnServer();
      // have page reload with mobId as part of the URL
      window.location.href = '/' + rs.generate(8);
      return;
    }
  },
  methods: {
    getApiBaseUrl() {
      const {protocol, hostname} = window.location;
      const url = protocol + '//' + hostname + ':' + 3000;
      return url;
    },
    async updateModelOnServer() {
      // update model update time
      this.lastModelUpdateTs = Date.now();

      // remove updatingModel flag before persisting
      const { updatingModel, ...data } = this.$data;

      console.log('saving model to server...');
      console.log(data);

      // push updates to server
      const url = this.getApiBaseUrl() + '/mob/' + this.mobId;
      fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
    },
    async checkServerForModelUpdates(force) {
      const url = this.getApiBaseUrl() + '/mob/' + this.mobId;
      const res = await fetch(url);
      const data = await res.json();

      // if we get an empty object back then the mob doesn't exist, so ignore updating the model
      if(Object.keys(data).length === 0) return;

      if(force || data.lastModelUpdateTs > this.lastModelUpdateTs) {
        // if model on server was updated more recently than the last
        // update timestamp then replace the current model with the one
        // from the server
        /*eslint no-unused-vars: "warn"*/
        const { _id, _rev, ...trimmedData } = data;
        console.log('using model from server...');
        console.log(trimmedData);

        this.updatingModel = true;
        Object.assign(this.$data, trimmedData);
        this.updatingModel = false;
      }
    },
    mobNameChange(event) {
      this.mobName = event.target.innerText;
      this.updateModelOnServer();
    },
    addNewMember() {
      this.members.push(this.newMember);
      this.newMember = '';
      this.updateModelOnServer();
    },
    removeMember(index) {
      this.members.splice(index, 1);
      this.updateModelOnServer();
    },
    rotateDriver() {
      if(!this.isBrake) {
        this.currentTurnsUntilBrake--;
      }
      if(this.currentTurnsUntilBrake == 0) {
        // take brake
        this.toggleBrake();
        return;
      }
      this.isBrake = false;
      this.currentDriverIndex = ((this.currentDriverIndex + 1) % this.members.length);
    },
    toggleBrake() {
      this.isBrake = !this.isBrake;
      this.millisUntilEnd = (this.brakeDuration * 60 * 1000);
      this.currentTurnsUntilBrake = this.turnsBetweenBrakes;
      this.clockRunning = true;
    },
    startPause() {
      if(this.millisUntilEnd <= 0) {
        // if clock has run down and someone clicks to start then reset the clock first
        this.reset();
      }
      this.clockRunning = !this.clockRunning;
      this.updateModelOnServer();
    },
    reset() {
      this.millisUntilEnd = (this.driverDuration * 60 * 1000);
      this.updateModelOnServer();
    }
  }
}
</script>

<style>
</style>
