<template>
  <div class="ml4 mr4"> 
    <h1 class="f2 f1-m f-headline-l measure-narrow lh-title mt4 mb2">
      <div class="bg-black-90 lh-copy white pa2 tracked-tight" contenteditable @input="mobNameChange">{{ mobName }}</div>
    </h1>
    <div v-if="!isBrake" class="f1 b">
      {{ members.length > 0 ? 'Driver: ' + members[currentDriverIndex] : '' }}
    </div>
    <div v-if="isBrake">
      Brake Time!
    </div>
    <h1 v-if="members.length > 0" class="f1 bg-black-90 lh-copy white pa2 tracked-tight mt1">
      {{ currentClock }}
    </h1>
    <div v-if="members.length > 0" class="mb3">
      <input type="button" value="Start/Pause" @click="startPause" class="f6 link ph3 pv2 dib black b bg-white br2 mr2 bn"/>
      <input type="button" value="Reset" @click="reset" class="f6 link ph3 pv2 dib black b bg-white br2 mr2 bn"/>
    </div>
    <div class="mb2">
      <label for="driverDuratin">Driver Duration (minutes):</label>
      <input name="driverDuration" type="number" v-model="driverDuration" />
    </div>
    <div class="mb2">
      <label for="turnsBetweenBrakes">Turns Between Brakes:</label>
      <input name="turnsBetweenBrakes" type="number" v-model="turnsBetweenBrakes" />
    </div>
    <div class="mb2">
      <label for="brakeDuration">Brake Duration (minutes):</label>
      <input name="brakeDuration" type="number" v-model="brakeDuration" />
    </div>
    <div>
      <h1 class="mb2">Mob Members</h1>
      <div class="mb3">
        <input type="text" v-model="newMember" v-on:keyup.enter="addNewMember" class="black b bg-white br2 mr2 bn" />
        <input type="button" value="+" @click="addNewMember" class="black b bg-white br2 mr2 bn" />
      </div>
      <div v-for="(member, index) in members" :key="index" class="mb3">
        <div class="mr2" style="display: inline">{{ index == currentDriverIndex ? '* ' : '' }}{{ member }}</div>
        <input type="button" value="x" @click="removeMember(index)" class="black b bg-white br2 mr2 bn" />
      </div>
    </div>
  </div>
</template>

<script>

export default {
  name: 'App',
  data() {
    return {
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
      if(!this.clockRunning) {
        this.millisUntilEnd = (newDriverDuration * 60 * 1000);
      }
    },
    turnsBetweenBrakes(newValue, oldValue) {
      // subtract the number of already used turns from new value
      const turnsUsed = oldValue - this.currentTurnsUntilBrake;
      this.currentTurnsUntilBrake = newValue - turnsUsed;
      if(this.currentTurnsUntilBrake <= 0) {
        this.toggleBrake();
      }
      this.updateModelOnServer();
    }
  },
  created() {
    // initialize starter values
    this.currentTurnsUntilBrake = this.turnsBetweenBrakes;
    this.reset();
    // setup countdown process on component creation
    setInterval(() => {
      if(this.clockRunning) {
        this.millisUntilEnd -= 1000;
        this.updateModelOnServer();
      }
      if(this.clockRunning && this.millisUntilEnd <= 0) {
        this.clockRunning = false;
        this.rotateDriver();
      }
    }, 1000);
  },
  methods: {
    updateModelOnServer() {

    },
    modelOnServerChanged() {

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
      console.log(this.currentDriverIndex);
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
