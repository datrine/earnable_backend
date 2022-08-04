function getRandomToken({ minLength }) {
    let numString="";
    while (numString.length<minLength) {
      numString += Math.floor(Math.random() * Math.pow(10,1)) ;
    }
    //let minNum = Math.floor(Math.random() * Math.pow(10,minLength)) ;
   let number= numString
    return number;
}

module.exports={getRandomToken}
