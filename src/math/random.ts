function randomIntFromInterval(min: number, max: number) { // min and max included 
  return Math.floor(Math.random() * (max - min + 1) + min)
}
function randomFromInterval(min:number, max:number) {
  return Math.random() * (max - min) + min
}

module.exports = {randomIntFromInterval, randomFromInterval}
