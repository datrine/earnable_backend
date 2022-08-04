function getRandomToken({ minLength }) {
    let numString="";
    while (numString.length<minLength) {
      numString = Math.floor(Math.random() * Math.pow(10,minLength)) ;
    }
    //let minNum = Math.floor(Math.random() * Math.pow(10,minLength)) ;
   let number= Number(numString)
    return number;
}



function sendTokenToMobile(params) {
    
}

module.exports={getRandomToken}
