<template>
  <div> 
    <div class="mob-name" contenteditable @input="mobNameChange">{{ mobName }}</div>
    <div class="current-driver">
      {{ members.length > 0 ? members[currentDriverIndex] : '' }}
    </div>
    <div class="clock">
      {{ currentClock }}
    </div>
    <div>
      <input type="button" value="Start/Pause" @click="startPause" />
      <input type="button" value="Reset" @click="reset" />
    </div>
    <div>
      <label for="driverDuratin">Driver Duration (minutes):</label>
      <input name="driverDuration" type="number" v-model="driverDuration" />
    </div>
    <div>
      <label for="turnsUntilBrake">Turns Until Brake:</label>
      <input name="turnsUntilBrake" type="number" v-model="turnsUntilBrake" />
    </div>
    <div>
      <label for="brakeDuration">Brake Duration (minutes):</label>
      <input name="brakeDuration" type="number" v-model="brakeDuration" />
    </div>
    <div>
      <div v-for="(member, index) in members" :key="index">
        <div style="display: inline">{{ index == currentDriverIndex ? '* ' : '' }}{{ member }} </div>
        <input type="button" value="x" @click="removeMember(index)" />
      </div>
      <input type="text" v-model="newMember" />
      <input type="button" value="+" @click="addNewMember" />
    </div>
  </div>
</template>

<script>

export default {
  name: 'App',
  data() {
    return {
      currentDriverIndex: 0,
      members: [],
      mobName: "Cool Mob",
      driverDuration: 15,
      turnsUntilBrake: 3,
      brakeDuration: 5,
      millisUntilEnd: 0,
      clockRunning: false
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
  created() {
    // setup countdown process on component creation
    setInterval(() => {
      if(this.clockRunning) {
        this.millisUntilEnd -= 1000;
        this.updateModelOnServer();
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
    startPause() {
      if(this.clockRunning) {
        this.clockRunning = false;
      } else {
        this.clockRunning = true;
      }
    },
    reset() {
      this.millisUntilEnd = (this.driverDuration * 60 * 1000);
      this.updateModelOnServer();
    }
  },
  components: {
  }
}
</script>

<style>
  body {
    font-family: Arial, Helvetica, sans-serif;
  }

  .mob-name {
    font-size: 42pt;
    font-weight: 600;
    letter-spacing: -2px;
  }

  .current-driver {
    font-size: 30pt;
    font-weight: 600;
  }

  .clock {
    font-size: 50pt;
    font-weight: 600;
  }
</style>
